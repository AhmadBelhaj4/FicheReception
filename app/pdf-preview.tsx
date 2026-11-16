// app/pdf-preview.tsx
// Visual in-app PDF preview rendered directly using WebView and buildFicheHtml.
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Button } from 'heroui-native';

import { useProjectStore } from '../src/store/useProjectStore';
import { useSettingsStore } from '../src/store/useSettingsStore';
import {
  calculateCotePratique,
  calculateDifference,
  getConformity,
} from '../src/utils/calculations';
import { ProfileData } from '../src/types';
import {
  buildFicheHtml,
  FicheProfileModel,
} from '../src/utils/fichePdf';
import { FICHE_FONT_CSS } from '../src/assets/ficheFonts';
import { FICHE_METRICS } from '../src/assets/ficheMetrics';
import { formatDateFR } from '../src/utils/date';

export default function PdfPreviewScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const {
    receptionNumber,
    vNumber,
    date,
    typeIntervention,
    institutionLines,
    repere,
    alt,
    lectureArriere,
    pc,
    profiles,
    logoClient,
    logoEntreprise,
    logoBureau,
  } = useProjectStore();

  const { toleranceM } = useSettingsStore();
  const formattedDate = formatDateFR(date);

  const htmlContent = useMemo(() => {
    const models: FicheProfileModel[] = profiles.map((p: ProfileData) => {
      const readings = [p.d1, p.d2, p.axe, p.g1, p.g2];
      const points = readings.map((lav) => {
        const pratique = pc !== null && lav !== null ? calculateCotePratique(pc, lav) : null;
        const diff =
          p.coteProjet !== null && pratique !== null
            ? calculateDifference(p.coteProjet, pratique)
            : null;
        return {
          lav,
          pratique,
          diff,
          out: diff !== null && getConformity(diff, toleranceM) === 'out',
        };
      }) as FicheProfileModel['points'];
      return {
        points,
        coteProjet: p.coteProjet,
        distance: p.distance,
        devers: p.devers,
        observation: p.observation || '',
      };
    });

    const doc = buildFicheHtml(
      {
        institution: institutionLines,
        receptionNumber,
        vNumber,
        dateFr: formattedDate,
        typeIntervention,
        repere,
        alt,
        lectureArriere,
        pc,
        profiles: models,
        logos: { client: logoClient, enterprise: logoEntreprise, bureau: logoBureau },
      },
      { fontCss: FICHE_FONT_CSS, metrics: FICHE_METRICS },
      // In WebView, standard px scaling renders crisply
      { unit: 'px' }
    );
    return doc.html;
  }, [
    institutionLines,
    receptionNumber,
    vNumber,
    formattedDate,
    typeIntervention,
    repere,
    alt,
    lectureArriere,
    pc,
    profiles,
    logoClient,
    logoEntreprise,
    logoBureau,
    toleranceM,
  ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }} edges={['top', 'bottom']}>
      {/* Minimal Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#1e293b',
          backgroundColor: '#0f172a',
        }}
      >
        <Button variant="ghost" size="sm" onPress={() => router.back()}>
          <Button.Label className="font-bold text-slate-300">← Retour</Button.Label>
        </Button>
        <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '800' }}>
          Aperçu de la Fiche A4
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/* WebView Container */}
      <View style={{ flex: 1, backgroundColor: '#334155', position: 'relative' }}>
        {loading && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#0f172a',
            }}
          >
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text style={{ color: '#94a3b8', fontSize: 13, marginTop: 12 }}>
              Génération du rendu A4...
            </Text>
          </View>
        )}
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent }}
          onLoadEnd={() => setLoading(false)}
          scalesPageToFit={Platform.OS === 'android'}
          showsVerticalScrollIndicator={true}
          style={{ flex: 1, backgroundColor: '#52525b' }}
        />
      </View>
    </SafeAreaView>
  );
}


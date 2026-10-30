import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { formatDateFR } from '../src/utils/date';
import { Button } from 'heroui-native';

import { useProjectStore } from '../src/store/useProjectStore';
import { useSettingsStore } from '../src/store/useSettingsStore';
import { useProjectsStore } from '../src/store/useProjectsStore';
import {
  calculateCotePratique,
  calculateDifference,
  getConformity,
} from '../src/utils/calculations';
import { ProfileData } from '../src/types';
import {
  buildFicheHtml,
  countPages,
  FicheProfileModel,
} from '../src/utils/fichePdf';
import { FICHE_FONT_CSS } from '../src/assets/ficheFonts';
import { FICHE_METRICS } from '../src/assets/ficheMetrics';

// A4 in PDF points (expo-print defaults to US Letter, which would crop/scale the form).
const PDF_PAGE_W = 595;
const PDF_PAGE_H = 842;

export default function PreviewScreen() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

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
    logoBureau,
    setLogos,
    resetProject,
  } = useProjectStore();

  const { logoBase64: enterpriseLogo, toleranceM } = useSettingsStore();
  const { saveOrUpdateProject } = useProjectsStore();

  const formattedDate = formatDateFR(date);

  // ─── LOGO PICKERS ──────────────────────────────────────────────────────────
  const handlePickLogo = async (target: 'client' | 'bureau') => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission requise',
        "L'accès à la galerie est nécessaire pour sélectionner un logo."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      let dataUri: string | null = null;
      if (asset.base64) {
        const uri = asset.uri.toLowerCase();
        const mime = uri.endsWith('.png') ? 'image/png' : 'image/jpeg';
        dataUri = `data:${mime};base64,${asset.base64}`;
      } else if (asset.uri) {
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        dataUri = `data:image/jpeg;base64,${base64}`;
      }
      if (dataUri) {
        if (target === 'client') {
          setLogos({ logoClient: dataUri });
        } else {
          setLogos({ logoBureau: dataUri });
        }
      }
    }
  };

  // ─── HTML TEMPLATE (A4 portrait twin of the official form) ─────────────────
  const buildDocument = () => {
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

    return buildFicheHtml(
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
        logos: { client: logoClient, enterprise: enterpriseLogo, bureau: logoBureau },
      },
      { fontCss: FICHE_FONT_CSS, metrics: FICHE_METRICS },
      { unit: Platform.OS === 'ios' ? 'px' : 'pt' }
    );
  };

  const pageCount = countPages(profiles.length);

  const handlePrint = async () => {
    try {
      setIsGenerating(true);
      const { html } = buildDocument();
      await Print.printAsync({ html, width: PDF_PAGE_W, height: PDF_PAGE_H });
    } catch (error) {
      Alert.alert('Erreur', "Échec de l'impression : " + String(error));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    try {
      setIsGenerating(true);
      const { html } = buildDocument();

      const { uri: cacheUri, base64 } = await Print.printToFileAsync({
        html,
        width: PDF_PAGE_W,
        height: PDF_PAGE_H,
        base64: true,
      });

      let shareUri = cacheUri;

      if (base64) {
        const fileName = `fiche-reception-${Date.now()}.pdf`;
        const destUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(destUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        shareUri = destUri;
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          'Partage non disponible',
          `Le fichier PDF a été généré ici :\n${shareUri}`
        );
        return;
      }

      await Sharing.shareAsync(shareUri, {
        UTI: 'com.adobe.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Partager la Fiche de Réception',
      });
    } catch (error) {
      console.error('PDF share error:', error);
      Alert.alert('Erreur', 'Échec du partage PDF : ' + String(error));
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── CSV EXPORT (WITH UTF-8 BOM FOR PERFECT EXCEL DISPLAY) ────────────────
  const handleExportCSV = async () => {
    try {
      setIsGenerating(true);

      const headers = [
        'Profil N°',
        'Point',
        'Lecture AV (m)',
        'Cote Pratique (m)',
        'Cote Projet (m)',
        'Différence (m)',
        'Dévers (%)',
        'Distance (m)',
        'Observation',
      ].join(';');

      const points = ['D1', 'D2 (F)', 'Axe', 'G1', 'G2 (F)'] as const;
      type PointKey = 'd1' | 'd2' | 'axe' | 'g1' | 'g2';
      const pointKeys: PointKey[] = ['d1', 'd2', 'axe', 'g1', 'g2'];

      const rows: string[] = [];

      profiles.forEach((p, idx) => {
        points.forEach((pointLabel, pIdx) => {
          const key = pointKeys[pIdx];
          const lecture = p[key];
          const cotePratique =
            pc !== null && lecture !== null ? calculateCotePratique(pc, lecture) : null;
          const difference =
            p.coteProjet !== null && cotePratique !== null
              ? calculateDifference(p.coteProjet, cotePratique)
              : null;

          const esc = (v: string | number | null) => {
            if (v === null || v === undefined) return '';
            const str = String(v);
            if (str.includes(';') || str.includes('"') || str.includes('\n')) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          };

          rows.push(
            [
              esc(idx + 1),
              esc(pointLabel),
              esc(lecture !== null ? lecture.toFixed(3) : null),
              esc(cotePratique !== null ? cotePratique.toFixed(3) : null),
              esc(p.coteProjet !== null ? p.coteProjet.toFixed(3) : null),
              esc(difference !== null ? difference.toFixed(3) : null),
              esc(p.devers !== null ? p.devers.toString() : null),
              esc(p.distance !== null ? p.distance.toString() : null),
              esc(pointLabel === 'Axe' ? p.observation : ''),
            ].join(';')
          );
        });
      });

      // Prepend UTF-8 BOM (\uFEFF) so Excel natively recognizes accents
      const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n');

      const fileName = `fiche-reception-${Date.now()}.csv`;
      const destUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(destUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Export CSV', `Fichier enregistré ici :\n${destUri}`);
        return;
      }

      await Sharing.shareAsync(destUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Exporter le CSV',
        UTI: 'public.comma-separated-values-text',
      });
    } catch (error) {
      console.error('CSV export error:', error);
      Alert.alert('Erreur', "Échec de l'export CSV : " + String(error));
    } finally {
      setIsGenerating(false);
    }
  };

  // ─── SAVE TO CHANTIERS ────────────────────────────────────────────────────
  const handleSaveChantier = () => {
    const id = saveOrUpdateProject({
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
      logoBureau,
      status: 'En cours',
    });

    const saved = useProjectsStore.getState().projects.find((p) => p.id === id);
    Alert.alert(
      'Chantier Enregistré ✓',
      `Le chantier "${saved?.name || receptionNumber || 'Sans nom'}" a été sauvegardé avec succès dans Mes Chantiers.`
    );
  };

  const handleReset = () => {
    Alert.alert(
      'Nouveau Projet',
      'Voulez-vous réinitialiser toutes les données saisies pour démarrer une nouvelle fiche ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: () => {
            resetProject();
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ScrollView
        contentContainerClassName="px-5 pt-6 pb-10"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View className="items-center mb-6">
          <View className="bg-emerald-500 rounded-full px-4 py-1.5 mb-3">
            <Text className="text-white text-xs font-black tracking-widest uppercase">
              Étape 4 / 4 — Finalisation
            </Text>
          </View>
          <Text className="text-2xl font-black text-slate-50 text-center">
            Aperçu & Exportation PDF
          </Text>
          <Text className="text-slate-400 text-sm text-center mt-1.5 px-4">
            Vérifiez la synthèse ci-dessous avant d’imprimer ou de partager la fiche officielle.
          </Text>
        </View>

        {/* ── 1. Résumé du Chantier ── */}
        <View className="bg-slate-800 rounded-2xl p-5 mb-4 border border-slate-700">
          <View className="flex-row items-center gap-2 mb-4">
            <View className="w-1 h-5 bg-emerald-400 rounded-full" />
            <Text className="text-xs font-bold text-slate-400 tracking-widest uppercase">
              1. Résumé du Chantier
            </Text>
          </View>

          {[
            { label: 'Réception N°', value: receptionNumber || 'Non spécifié' },
            { label: 'V', value: vNumber || '–' },
            { label: 'Pages', value: `${pageCount} (5 profils par page)` },
            { label: 'Date', value: formattedDate || 'Non spécifiée' },
          ].map(({ label, value }) => (
            <View key={label} className="flex-row justify-between py-2.5 border-b border-slate-700">
              <Text className="text-slate-400 text-sm font-semibold">{label}</Text>
              <Text className="text-slate-100 text-sm font-bold max-w-[55%] text-right">{value}</Text>
            </View>
          ))}

          <View className="flex-row justify-between pt-2.5">
            <Text className="text-slate-400 text-sm font-semibold">{"Type d'intervention"}</Text>
            <Text className="text-slate-100 text-sm font-bold max-w-[55%] text-right" numberOfLines={2}>
              {typeIntervention || 'Non spécifié'}
            </Text>
          </View>
        </View>

        {/* ── 2. Données Topographiques ── */}
        <View className="bg-slate-800 rounded-2xl p-5 mb-4 border border-slate-700">
          <View className="flex-row items-center gap-2 mb-4">
            <View className="w-1 h-5 bg-emerald-400 rounded-full" />
            <Text className="text-xs font-bold text-slate-400 tracking-widest uppercase">
              2. Données Topographiques
            </Text>
          </View>

          <View className="flex-row gap-3">
            {/* Repère */}
            <View className="flex-1 bg-slate-900 rounded-xl p-3 items-center border border-slate-700">
              <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Repère</Text>
              <Text className="text-slate-100 text-sm font-black text-center">{repere || '–'}</Text>
            </View>
            {/* P.C. */}
            <View className="flex-1 bg-slate-900 rounded-xl p-3 items-center border border-amber-400/30">
              <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">P.C. Calculé</Text>
              <Text className="text-amber-400 text-sm font-black">
                {pc !== null ? `${pc.toFixed(3)} m` : '–'}
              </Text>
            </View>
            {/* Nb Profils */}
            <View className="flex-1 bg-slate-900 rounded-xl p-3 items-center border border-slate-700">
              <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Profils</Text>
              <Text className="text-slate-100 text-2xl font-black">{profiles.length}</Text>
            </View>
          </View>
        </View>

        {/* ── 3. Logos du Chantier & Partenaires ── */}
        <View className="bg-slate-800 rounded-2xl p-5 mb-5 border border-slate-700">
          <View className="flex-row items-center gap-2 mb-4">
            <View className="w-1 h-5 bg-amber-400 rounded-full" />
            <Text className="text-xs font-bold text-slate-400 tracking-widest uppercase">
              3. Logos pour cette Fiche
            </Text>
          </View>
          <Text className="text-slate-400 text-xs mb-4 leading-relaxed">
            Placés à leur emplacement d’origine dans l’en-tête du PDF : Client puis Entreprise à gauche, Bureau de Contrôle à droite.
          </Text>

          {/* Logo Entreprise (Info) */}
          <View className="bg-slate-900 rounded-xl p-3.5 mb-3 border border-slate-700">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-slate-300 text-xs font-bold mb-0.5">Logo Entreprise (Gauche)</Text>
                <Text className="text-slate-500 text-xs">
                  {enterpriseLogo ? '✓ Défini dans les Paramètres' : 'Non défini (dans Paramètres)'}
                </Text>
              </View>
              {enterpriseLogo ? (
                <View className="bg-white rounded-lg p-1">
                  <Image source={{ uri: enterpriseLogo }} style={{ width: 44, height: 28, resizeMode: 'contain' }} />
                </View>
              ) : null}
            </View>
          </View>

          {/* Logo Client / ARRU */}
          <View className="bg-slate-900 rounded-xl p-3.5 mb-3 border border-slate-700">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-slate-300 text-xs font-bold mb-0.5">Logo Client / ARRU (Gauche)</Text>
                <Text className="text-slate-500 text-xs">
                  {logoClient ? '✓ Logo ajouté' : 'Optionnel'}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                {logoClient ? (
                  <>
                    <View className="bg-white rounded-lg p-1">
                      <Image source={{ uri: logoClient }} style={{ width: 44, height: 28, resizeMode: 'contain' }} />
                    </View>
                    <Button
                      variant="danger-soft"
                      size="sm"
                      isIconOnly
                      onPress={() => setLogos({ logoClient: null })}
                    >
                      <Text className="text-red-400 font-bold text-xs">✕</Text>
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => handlePickLogo('client')}
                  >
                    <Button.Label className="font-bold text-xs">+ Choisir</Button.Label>
                  </Button>
                )}
              </View>
            </View>
          </View>

          {/* Logo Bureau de Contrôle / SOIT */}
          <View className="bg-slate-900 rounded-xl p-3.5 border border-slate-700">
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-3">
                <Text className="text-slate-300 text-xs font-bold mb-0.5">Logo Bureau de Contrôle (Droite)</Text>
                <Text className="text-slate-500 text-xs">
                  {logoBureau ? '✓ Logo ajouté' : 'Optionnel'}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                {logoBureau ? (
                  <>
                    <View className="bg-white rounded-lg p-1">
                      <Image source={{ uri: logoBureau }} style={{ width: 44, height: 28, resizeMode: 'contain' }} />
                    </View>
                    <Button
                      variant="danger-soft"
                      size="sm"
                      isIconOnly
                      onPress={() => setLogos({ logoBureau: null })}
                    >
                      <Text className="text-red-400 font-bold text-xs">✕</Text>
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onPress={() => handlePickLogo('bureau')}
                  >
                    <Button.Label className="font-bold text-xs">+ Choisir</Button.Label>
                  </Button>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* ── Action buttons ── */}
        <View className="gap-3 mb-5">
          {/* Primary 1: Enregistrer dans Mes Chantiers */}
          <Button
            variant="outline"
            size="lg"
            onPress={handleSaveChantier}
            className="border-amber-400/60 bg-amber-400/10"
          >
            <Text className="text-xl mr-2">💾</Text>
            <Button.Label className="font-bold tracking-wide text-amber-300">
              Enregistrer dans Mes Chantiers
            </Button.Label>
          </Button>

          {/* Primary 2: Share PDF */}
          <Button
            variant="primary"
            size="lg"
            feedbackVariant="scale-ripple"
            isDisabled={isGenerating}
            onPress={handleShare}
          >
            {isGenerating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text className="text-white text-xl mr-2">📤</Text>
                <Button.Label className="font-bold tracking-wide">
                  Partager / Enregistrer le PDF
                </Button.Label>
              </>
            )}
          </Button>

          {/* Secondary: Print */}
          <Button
            variant="outline"
            size="lg"
            isDisabled={isGenerating}
            onPress={handlePrint}
          >
            <Text className="text-xl mr-2">🖨️</Text>
            <Button.Label className="font-bold">Imprimer directement</Button.Label>
          </Button>

          {/* Secondary: CSV Export */}
          <Button
            variant="outline"
            size="lg"
            isDisabled={isGenerating || profiles.length === 0}
            onPress={handleExportCSV}
          >
            <Text className="text-xl mr-2">📊</Text>
            <Button.Label className="font-bold">Exporter CSV (Excel)</Button.Label>
          </Button>
        </View>

        {/* ── Nav row ── */}
        <View className="flex-row justify-between items-center pt-2">
          <Button variant="ghost" size="md" onPress={() => router.back()}>
            <Button.Label className="font-bold text-slate-400">
              ← Revenir aux Profils
            </Button.Label>
          </Button>

          <Button variant="danger-soft" size="md" onPress={handleReset}>
            <Button.Label className="font-bold">Nouveau Chantier ⟳</Button.Label>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

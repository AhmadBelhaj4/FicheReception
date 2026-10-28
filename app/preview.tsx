import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Button } from 'heroui-native';

import { useProjectStore } from '../src/store/useProjectStore';
import {
  calculateCotePratique,
  calculateDifference,
} from '../src/utils/calculations';
import { ProfileData } from '../src/types';

export default function PreviewScreen() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    receptionNumber,
    vNumber,
    pNumber,
    date,
    typeIntervention,
    repere,
    alt,
    lectureArriere,
    pc,
    profiles,
    resetProject,
  } = useProjectStore();

  const formattedDate = date
    ? new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

  // ── HTML TEMPLATE — UNTOUCHED ──────────────────────────────────────────────
  // Generate HTML for the standard Fiche de Réception Topographique
  // Layout: readings stacked vertically per profile (5 rows per profile),
  // with rowspan on N°, Cote Projet, Dévers, Observation columns.
  const generateHtml = (): string => {
    const pcVal = pc !== null ? pc.toFixed(3) : '-';
    const altVal = alt !== null ? alt.toFixed(3) : '-';
    const larVal = lectureArriere !== null ? lectureArriere.toFixed(3) : '-';

    const formatNum = (n: number | null) => (n !== null ? n.toFixed(3) : '');

    const formatDiff = (diff: number | null) => {
      if (diff === null) return '';
      const val = diff > 0 ? `+${diff.toFixed(3)}` : diff.toFixed(3);
      const color = diff > 0 ? '#15803d' : diff < 0 ? '#b91c1c' : '#334155';
      return `<span style="color: ${color}; font-weight: bold;">${val}</span>`;
    };

    const rowsHtml = profiles
      .map((p: ProfileData, idx: number) => {
        const cpD1 = pc !== null && p.d1 !== null ? calculateCotePratique(pc, p.d1) : null;
        const cpD2 = pc !== null && p.d2 !== null ? calculateCotePratique(pc, p.d2) : null;
        const cpAxe = pc !== null && p.axe !== null ? calculateCotePratique(pc, p.axe) : null;
        const cpG1 = pc !== null && p.g1 !== null ? calculateCotePratique(pc, p.g1) : null;
        const cpG2 = pc !== null && p.g2 !== null ? calculateCotePratique(pc, p.g2) : null;

        const diffD1 = p.coteProjet !== null && cpD1 !== null ? calculateDifference(p.coteProjet, cpD1) : null;
        const diffD2 = p.coteProjet !== null && cpD2 !== null ? calculateDifference(p.coteProjet, cpD2) : null;
        const diffAxe = p.coteProjet !== null && cpAxe !== null ? calculateDifference(p.coteProjet, cpAxe) : null;
        const diffG1 = p.coteProjet !== null && cpG1 !== null ? calculateDifference(p.coteProjet, cpG1) : null;
        const diffG2 = p.coteProjet !== null && cpG2 !== null ? calculateDifference(p.coteProjet, cpG2) : null;

        const deversDisplay = p.devers !== null ? `${p.devers} %` : p.distance !== null ? `${p.distance} m` : '';
        const obsDisplay = p.observation || '';
        const coteProjetDisplay = p.coteProjet !== null ? p.coteProjet.toFixed(3) : '';

        // Alternate row background per profile for readability
        const profileBg = idx % 2 === 0 ? '' : 'style="background-color: #f9fafb;"';

        return `
          <tr ${profileBg}>
            <td class="center bold border-b" rowspan="5">${idx + 1}</td>
            <td class="center">D1</td>
            <td class="center">${formatNum(p.d1)}</td>
            <td class="center">${formatNum(cpD1)}</td>
            <td class="center bold border-b" rowspan="5">${coteProjetDisplay}</td>
            <td class="center">${formatDiff(diffD1)}</td>
            <td class="center border-b" rowspan="5">${deversDisplay}</td>
            <td class="left border-b" rowspan="5">${obsDisplay}</td>
          </tr>
          <tr ${profileBg}>
            <td class="center">D2 (F)</td>
            <td class="center">${formatNum(p.d2)}</td>
            <td class="center">${formatNum(cpD2)}</td>
            <td class="center">${formatDiff(diffD2)}</td>
          </tr>
          <tr ${profileBg} class="axe-row">
            <td class="center bold">Axe</td>
            <td class="center bold">${formatNum(p.axe)}</td>
            <td class="center bold">${formatNum(cpAxe)}</td>
            <td class="center bold">${formatDiff(diffAxe)}</td>
          </tr>
          <tr ${profileBg}>
            <td class="center">G1</td>
            <td class="center">${formatNum(p.g1)}</td>
            <td class="center">${formatNum(cpG1)}</td>
            <td class="center">${formatDiff(diffG1)}</td>
          </tr>
          <tr class="profile-last-row ${profileBg ? 'alt-profile' : ''}">
            <td class="center">G2 (F)</td>
            <td class="center">${formatNum(p.g2)}</td>
            <td class="center">${formatNum(cpG2)}</td>
            <td class="center">${formatDiff(diffG2)}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Fiche de Réception Topographique</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 8mm 6mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 0;
            font-size: 10px;
          }
          /* ── Institutional header ── */
          .institution {
            text-align: center;
            margin-bottom: 4px;
            font-size: 9px;
            font-weight: bold;
          }
          /* ── Form title ── */
          .title-box {
            text-align: center;
            border: 2px solid #000;
            padding: 5px;
            margin-bottom: 6px;
          }
          .title-box h1 {
            margin: 0;
            font-size: 14px;
            font-weight: bold;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          /* ── Header block ── */
          .header-block {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
            font-size: 10px;
          }
          .header-block td {
            border: 1px solid #000;
            padding: 3px 6px;
            vertical-align: middle;
          }
          .header-block .lbl {
            font-weight: bold;
            background: #f0f0f0;
            white-space: nowrap;
          }
          /* ── Reference row ── */
          .ref-block {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
            font-size: 10px;
          }
          .ref-block td {
            border: 1px solid #000;
            padding: 3px 6px;
            text-align: center;
          }
          .ref-block .lbl {
            font-weight: bold;
            background: #e8e8e8;
          }
          .ref-block .val {
            font-weight: bold;
          }
          /* ── Main data table ── */
          .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5px;
          }
          .data-table th, .data-table td {
            border: 1px solid #000;
            padding: 2px 3px;
          }
          .data-table th {
            background-color: #d0d0d0;
            text-align: center;
            font-weight: bold;
            font-size: 9px;
            vertical-align: middle;
          }
          .data-table th.sub-header {
            background-color: #e8e8e8;
          }
          .center { text-align: center; vertical-align: middle; }
          .left { text-align: left; vertical-align: middle; padding-left: 4px; }
          .bold { font-weight: bold; }
          /* Axe row is slightly shaded for visual prominence */
          .axe-row td { background-color: #f0f4ff; }
          /* Thick bottom border between profiles */
          .profile-last-row td, .border-b { border-bottom: 2px solid #444 !important; }
          .alt-profile td { background-color: #f9fafb; }
          /* ── Signature block ── */
          .sig-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          .sig-table td {
            border: 1px solid #000;
            width: 33.33%;
            height: 55px;
            vertical-align: top;
            padding: 4px 6px;
            font-size: 9px;
          }
          .sig-title {
            font-weight: bold;
            text-align: center;
            border-bottom: 1px dashed #555;
            padding-bottom: 3px;
            margin-bottom: 3px;
          }
          /* ── Nota ── */
          .nota {
            margin-top: 6px;
            font-size: 8.5px;
            color: #333;
          }
          .nota p { margin: 1px 0; }
        </style>
      </head>
      <body>
        <div class="institution">AGENCE DE RÉHABILITATION ET DE RÉNOVATION URBAINE</div>

        <div class="title-box">
          <h1>FICHE DE RÉCEPTION TOPOGRAPHIQUE</h1>
        </div>

        <table class="header-block">
          <tr>
            <td class="lbl" style="width:12%;">RÉCEPTION N° :</td>
            <td style="width:22%;"><strong>${receptionNumber || '…'}</strong></td>
            <td class="lbl" style="width:6%;">V N° :</td>
            <td style="width:10%;"><strong>${vNumber || '…'}</strong></td>
            <td class="lbl" style="width:6%;">P N° :</td>
            <td style="width:14%;"><strong>${pNumber || '…'}</strong></td>
            <td class="lbl" style="width:6%;">Date :</td>
            <td style="width:24%;"><strong>${formattedDate || '…'}</strong></td>
          </tr>
          <tr>
            <td class="lbl">TYPE D'INTERVENTION :</td>
            <td colspan="7">${typeIntervention || '…'}</td>
          </tr>
        </table>

        <table class="ref-block">
          <tr>
            <td class="lbl" style="width:20%;">REPÈRE</td>
            <td class="lbl" style="width:20%;">ALT (Z)</td>
            <td class="lbl" style="width:20%;">Lecture arrière</td>
            <td class="lbl" style="width:20%; background:#c8c8c8;">P.C.</td>
          </tr>
          <tr>
            <td class="val">${repere || '…'}</td>
            <td>${altVal} m</td>
            <td>${larVal} m</td>
            <td class="val" style="font-size:12px; background:#eeeeee;">${pcVal} m</td>
          </tr>
        </table>

        <table class="data-table">
          <thead>
            <tr>
              <th rowspan="2" style="width:5%;">N°<br>PROFIL</th>
              <th rowspan="2" style="width:8%;">LECTURE AV<br>(m)</th>
              <th rowspan="2" style="width:10%;">COTE<br>RÉCEPTION<br>(PRATIQUE)</th>
              <th rowspan="2" style="width:10%;">COTE PROJET<br>(THÉORIQUE)</th>
              <th rowspan="2" style="width:10%;">DIFFÉRENCE<br>(Z.Théo – Z.pr)</th>
              <th rowspan="2" style="width:8%;">DISTANCE /<br>DÉVERS (%)</th>
              <th rowspan="2">OBSERVATION /<br>OBSTACLE</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || `
              <tr>
                <td colspan="7" class="center" style="padding: 12px; font-style: italic; color: #666;">
                  Aucun profil saisi.
                </td>
              </tr>
            `}
          </tbody>
        </table>

        <div class="nota">
          <p><strong>NOTA 1 :</strong> La case DÉVERS (%) : Ligne rouge projetée par rapport à des caniveaux existants à conserver (V-EX)</p>
          <p><strong>NOTA 2 :</strong> D2 et G2 sont les lectures de la couche de base sous caniveaux (F = Fond)</p>
        </div>

        <table class="sig-table">
          <tr>
            <td>
              <div class="sig-title">L'ENTREPRISE TRAVAUX</div>
            </td>
            <td>
              <div class="sig-title">BUREAU DE CONTRÔLE / GÉOMÈTRE</div>
            </td>
            <td>
              <div class="sig-title">MAÎTRE D'OUVRAGE / CLIENT</div>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  };
  // ── END HTML TEMPLATE ──────────────────────────────────────────────────────

  const handlePrint = async () => {
    try {
      setIsGenerating(true);
      const html = generateHtml();
      await Print.printAsync({ html });
    } catch (error) {
      Alert.alert('Erreur', "Échec de l'impression : " + String(error));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    try {
      setIsGenerating(true);
      const html = generateHtml();

      // 1. Generate PDF with Base64 output to avoid Android scoped cache permission issue
      const { uri: cacheUri, base64 } = await Print.printToFileAsync({
        html,
        base64: true,
      });

      let shareUri = cacheUri;

      if (base64) {
        // 2. Write directly to documentDirectory via Base64 (100% accessible to FileProvider)
        const fileName = `fiche-reception-${Date.now()}.pdf`;
        const destUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(destUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        shareUri = destUri;
      }

      // 3. Check sharing availability
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          'Partage non disponible',
          `Le fichier PDF a été généré ici :\n${shareUri}`
        );
        return;
      }

      // 4. Share from documentDirectory URI — works on both iOS and Android
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
            {"Aperçu & Exportation PDF"}
          </Text>
          <Text className="text-slate-400 text-sm text-center mt-1.5 px-4">
            {"Vérifiez la synthèse ci-dessous avant d\u2019imprimer ou de partager la fiche officielle."}
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
            { label: 'V N° / P N°', value: `${vNumber || '–'} / ${pNumber || '–'}` },
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
        <View className="bg-slate-800 rounded-2xl p-5 mb-5 border border-slate-700">
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

        {/* ── Action buttons ── */}
        <View className="gap-3 mb-5">
          {/* Primary: Share PDF */}
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

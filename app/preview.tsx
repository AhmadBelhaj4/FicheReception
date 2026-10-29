import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { escapeHtml } from '../src/utils/html';
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

  // ─── HTML TEMPLATE (OFFICIAL 3-COLUMN HEADER MATCHING REAL FORM) ───────────
  const generateHtml = (): string => {
    const pcVal = pc !== null ? pc.toFixed(3) : '-';
    const altVal = alt !== null ? alt.toFixed(3) : '-';
    const larVal = lectureArriere !== null ? lectureArriere.toFixed(3) : '-';

    const formatNum = (n: number | null) => (n !== null ? n.toFixed(3) : '');

    const formatDiff = (diff: number | null) => {
      if (diff === null) return '';
      const val = diff > 0 ? `+${diff.toFixed(3)}` : diff.toFixed(3);
      const isOk = getConformity(diff, toleranceM) === 'ok';
      const mark = isOk ? ' ✓' : ' ⚠';
      const color = isOk ? '#15803d' : '#b91c1c';
      return `<span style="color: ${color}; font-weight: bold;">${val}${mark}</span>`;
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
          <tbody class="profile">
          <tr ${profileBg}>
            <td class="center bold border-b" rowspan="5">${idx + 1}</td>
            <td class="center">D1</td>
            <td class="center">${formatNum(p.d1)}</td>
            <td class="center">${formatNum(cpD1)}</td>
            <td class="center bold border-b" rowspan="5">${coteProjetDisplay}</td>
            <td class="center">${formatDiff(diffD1)}</td>
            <td class="center border-b" rowspan="5">${deversDisplay}</td>
            <td class="left border-b" rowspan="5">${escapeHtml(obsDisplay)}</td>
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
          </tbody>
        `;
      })
      .join('');

    // Logos rendering
    const clientLogoImg = logoClient
      ? `<img src="${logoClient}" class="header-logo" alt="Logo Client" />`
      : '';
    const enterpriseLogoImg = enterpriseLogo
      ? `<img src="${enterpriseLogo}" class="header-logo" alt="Logo Entreprise" />`
      : '';
    const bureauLogoImg = logoBureau
      ? `<img src="${logoBureau}" class="header-logo" alt="Logo Bureau" />`
      : '';

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
          /* ── 3-Column Header Layout (Matches Official Document) ── */
          .top-header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
          }
          .top-header-table td {
            border: none;
            vertical-align: middle;
            padding: 0 4px;
          }
          .top-header-left {
            width: 25%;
            text-align: left;
            white-space: nowrap;
          }
          .top-header-center {
            width: 50%;
            text-align: center;
          }
          .top-header-right {
            width: 25%;
            text-align: right;
            white-space: nowrap;
          }
          .header-logo {
            max-height: 48px;
            max-width: 90px;
            object-fit: contain;
            display: inline-block;
            vertical-align: middle;
            margin: 0 3px;
          }
          /* ── Institutional double box ── */
          .institution-box {
            display: inline-block;
            border: 1.5px solid #000;
            width: 100%;
            font-size: 8.5px;
            font-weight: bold;
            line-height: 1.35;
          }
          .inst-top {
            padding: 3px 6px;
            border-bottom: 1.5px solid #000;
            text-transform: uppercase;
          }
          .inst-bottom {
            padding: 3px 6px;
            text-transform: uppercase;
          }
          /* ── Form title ── */
          .title-box {
            text-align: center;
            border: 2px solid #000;
            padding: 4px;
            margin-bottom: 5px;
          }
          .title-box h1 {
            margin: 0;
            font-size: 13px;
            font-weight: bold;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          /* ── Header block ── */
          .header-block {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
            font-size: 9.5px;
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
            margin-bottom: 5px;
            font-size: 9.5px;
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
            font-size: 9px;
          }
          .data-table th, .data-table td {
            border: 1px solid #000;
            padding: 2px 3px;
          }
          .data-table th {
            background-color: #d0d0d0;
            text-align: center;
            font-weight: bold;
            font-size: 8.5px;
            vertical-align: middle;
          }
          .center { text-align: center; vertical-align: middle; }
          .left { text-align: left; vertical-align: middle; padding-left: 4px; }
          .bold { font-weight: bold; }
          /* Axe row is slightly shaded for visual prominence */
          .axe-row td { background-color: #f0f4ff; }
          /* Thick bottom border between profiles */
          .profile-last-row td, .border-b { border-bottom: 2px solid #444 !important; }
          .alt-profile td { background-color: #f9fafb; }
          /* ── Signature block (Official paper signature boxes) ── */
          .sig-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }
          .sig-table td {
            border: 1px solid #000;
            width: 33.33%;
            height: 60px;
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
          /* ── Pagination: never split a profile across pages ── */
          thead { display: table-header-group; }
          tbody.profile { page-break-inside: avoid; break-inside: avoid; }
          tr { page-break-inside: avoid; break-inside: avoid; }
          .sig-table, .nota { page-break-inside: avoid; break-inside: avoid; }
          .nota {
            margin-top: 5px;
            font-size: 8.5px;
            color: #333;
          }
          .nota p { margin: 1px 0; }
        </style>
      </head>
      <body>
        <!-- 3-Column Official Top Header with Logos -->
        <table class="top-header-table">
          <tr>
            <td class="top-header-left">
              ${clientLogoImg}
              ${enterpriseLogoImg}
            </td>
            <td class="top-header-center">
              <div class="institution-box">
                <div class="inst-top">
                  RÉPUBLIQUE TUNISIENNE<br>
                  AGENCE DE RÉHABILITATION ET DE RÉNOVATION URBAINE
                </div>
                <div class="inst-bottom">
                  TRAVAUX DE RÉHABILITATION DU QUARTIER ENNOUR<br>
                  DANS LA COMMUNE DE KASSERINE
                </div>
              </div>
            </td>
            <td class="top-header-right">
              ${bureauLogoImg}
            </td>
          </tr>
        </table>

        <div class="title-box">
          <h1>FICHE DE RÉCEPTION TOPOGRAPHIQUE</h1>
        </div>

        <table class="header-block">
          <tr>
            <td class="lbl" style="width:12%;">RÉCEPTION N° :</td>
            <td style="width:22%;"><strong>${escapeHtml(receptionNumber) || '…'}</strong></td>
            <td class="lbl" style="width:6%;">V N° :</td>
            <td style="width:10%;"><strong>${escapeHtml(vNumber) || '…'}</strong></td>
            <td class="lbl" style="width:6%;">P N° :</td>
            <td style="width:14%;"><strong>${escapeHtml(pNumber) || '…'}</strong></td>
            <td class="lbl" style="width:6%;">Date :</td>
            <td style="width:24%;"><strong>${formattedDate || '…'}</strong></td>
          </tr>
          <tr>
            <td class="lbl">TYPE D'INTERVENTION :</td>
            <td colspan="7">${escapeHtml(typeIntervention) || '…'}</td>
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
            <td class="val">${escapeHtml(repere) || '…'}</td>
            <td>${altVal} m</td>
            <td>${larVal} m</td>
            <td class="val" style="font-size:12px; background:#eeeeee;">${pcVal} m</td>
          </tr>
        </table>

        <table class="data-table">
          <thead>
            <tr>
              <th rowspan="2" style="width:5%;">N°<br>PROFIL</th>
              <th rowspan="2" style="width:4%;">POINT</th>
              <th rowspan="2" style="width:8%;">LECTURE AV<br>(m)</th>
              <th rowspan="2" style="width:10%;">COTE<br>RÉCEPTION<br>(PRATIQUE)</th>
              <th rowspan="2" style="width:10%;">COTE PROJET<br>(THÉORIQUE)</th>
              <th rowspan="2" style="width:10%;">DIFFÉRENCE<br>(Z.Théo – Z.pr)</th>
              <th rowspan="2" style="width:8%;">DISTANCE /<br>DÉVERS (%)</th>
              <th rowspan="2">OBSERVATION /<br>OBSTACLE</th>
            </tr>
          </thead>
          ${rowsHtml || `
          <tbody>
            <tr>
              <td colspan="8" class="center" style="padding: 12px; font-style: italic; color: #666;">
                Aucun profil saisi.
              </td>
            </tr>
          </tbody>`}
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

      const { uri: cacheUri, base64 } = await Print.printToFileAsync({
        html,
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
      pNumber,
      date,
      typeIntervention,
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
            Positionnés autour du bloc officiel dans l’en-tête du PDF (Maître d’Ouvrage / Entreprise à gauche, Bureau de Contrôle à droite).
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

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
import { escapeHtml } from '../src/utils/html';
import { formatDateFR } from '../src/utils/date';
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

  const formattedDate = formatDateFR(date);

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
          /* ── Pagination: never split a profile across pages ── */
          thead { display: table-header-group; }
          tbody.profile { page-break-inside: avoid; break-inside: avoid; }
          tr { page-break-inside: avoid; break-inside: avoid; }
          .sig-table, .nota { page-break-inside: avoid; break-inside: avoid; }
          .nota {
            margin-top: 6px;
            font-size: 8.5px;
            color: #333;
          }
          .nota p { margin: 1px 0; }
        </style>
      </head>
      <body>
        <div class="institution">
          RÉPUBLIQUE TUNISIENNE<br>
          AGENCE DE RÉHABILITATION ET DE RÉNOVATION URBAINE<br>
          TRAVAUX DE RÉHABILITATION DU QUARTIER ENNOUR<br>
          DANS LA COMMUNE DE KASSERINE
        </div>

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

  const handleExportCSV = async () => {
    try {
      setIsGenerating(true);

      // Build CSV header
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

      // Build rows — 5 rows per profile (D1, D2(F), Axe, G1, G2(F))
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

          // Escape a cell value for CSV (wrap in quotes if it contains ; or ")
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
              // Only show observation on the Axe row for readability
              esc(pointLabel === 'Axe' ? p.observation : ''),
            ].join(';')
          );
        });
      });

      const csvContent = [headers, ...rows].join('\n');

      // Write to documentDirectory
      const fileName = `fiche-reception-${Date.now()}.csv`;
      const destUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(destUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share
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
      Alert.alert('Erreur', 'Échec de l\'export CSV : ' + String(error));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportLandXML = async () => {
    try {
      setIsGenerating(true);

      // Each profile becomes a <CrossSect> with one <CrossSectSurf> containing 5 points.
      // Horizontal offsets are nominal (ki-2) since real distances aren't captured.
      const pointKeys: Array<'d1' | 'd2' | 'axe' | 'g1' | 'g2'> = ['d1', 'd2', 'axe', 'g1', 'g2'];

      const crossSectsXml = profiles.map((p, idx) => {
        const pntPairs = pointKeys
          .map((key, ki) => {
            const lecture = p[key];
            const elev = pc !== null && lecture !== null ? calculateCotePratique(pc, lecture) : null;
            if (elev === null) return null;
            const x = (ki - 2).toFixed(3);
            const y = elev.toFixed(3);
            return `${x} ${y}`;
          })
          .filter((v): v is string => v !== null)
          .join(' ');

        const staSafe = (idx + 1).toFixed(3);
        const nameSafe = escapeHtml(`Profil ${idx + 1}`);
        const descSafe = escapeHtml(p.observation);

        return [
          `    <CrossSect sta="${staSafe}" name="${nameSafe}">`,
          `      <CrossSectSurf name="Reception" desc="${descSafe}">`,
          `        <PntList2D>${pntPairs}</PntList2D>`,
          `      </CrossSectSurf>`,
          `    </CrossSect>`,
        ].join('\n');
      }).join('\n');

      const now = new Date().toISOString();
      const dateStr = now.split('T')[0];
      const timeStr = now.split('T')[1]?.split('.')[0] ?? '00:00:00';
      const projName = escapeHtml(receptionNumber || 'Fiche de Reception');
      const projDesc = escapeHtml(typeIntervention);

      const xmlLines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<LandXML xmlns="http://www.landxml.org/schema/LandXML-1.2"',
        `         date="${dateStr}" time="${timeStr}"`,
        '         version="1.2">',
        `  <Project name="${projName}">`,
        `    <Desc>${projDesc}</Desc>`,
        '  </Project>',
        '  <CrossSects>',
        crossSectsXml,
        '  </CrossSects>',
        '</LandXML>',
      ];
      const xmlContent = xmlLines.join('\n');

      const fileName = `fiche-reception-${Date.now()}.xml`;
      const destUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(destUri, xmlContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Export LandXML', `Fichier enregistre :\n${destUri}`);
        return;
      }

      await Sharing.shareAsync(destUri, {
        mimeType: 'application/xml',
        dialogTitle: 'Exporter LandXML',
        UTI: 'public.xml',
      });
    } catch (error) {
      console.error('LandXML export error:', error);
      Alert.alert('Erreur', "Echec export LandXML : " + String(error));
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

          {/* CSV Export */}
          <Button
            variant="outline"
            size="lg"
            isDisabled={isGenerating || profiles.length === 0}
            onPress={handleExportCSV}
          >
            <Text className="text-xl mr-2">📊</Text>
            <Button.Label className="font-bold">Exporter CSV (Excel)</Button.Label>
          </Button>

          {/* LandXML Export */}
          <Button
            variant="outline"
            size="lg"
            isDisabled={isGenerating || profiles.length === 0}
            onPress={handleExportLandXML}
          >
            <Text className="text-xl mr-2">📐</Text>
            <Button.Label className="font-bold">Exporter LandXML (CAO)</Button.Label>
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

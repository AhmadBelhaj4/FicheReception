import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
      const { uri } = await Print.printToFileAsync({ html });

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          'Information',
          `Fichier PDF généré avec succès :\n${uri}`
        );
        return;
      }

      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: 'Partager la Fiche de Réception',
      });
    } catch (error) {
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ÉTAPE 4 / 4 - FINALISATION</Text>
          </View>
          <Text style={styles.title}>Aperçu & Exportation PDF</Text>
          <Text style={styles.subtitle}>
            {"Vérifiez la synthèse ci-dessous avant d'imprimer ou de partager la fiche officielle."}
          </Text>
        </View>

        {/* Project Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>1. Résumé du Chantier</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Réception N° :</Text>
            <Text style={styles.infoValue}>{receptionNumber || 'Non spécifié'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>V N° / P N° :</Text>
            <Text style={styles.infoValue}>
              {vNumber || '-'} / {pNumber || '-'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date :</Text>
            <Text style={styles.infoValue}>{formattedDate || 'Non spécifiée'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{"Type d'intervention :"}</Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {typeIntervention || 'Non spécifié'}
            </Text>
          </View>
        </View>

        {/* Reference & Profiles Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>2. Données Topographiques</Text>
          <View style={styles.gridRow}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>REPÈRE</Text>
              <Text style={styles.gridValue}>{repere || '-'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>P.C. CALCULÉ</Text>
              <Text style={[styles.gridValue, { color: '#1e40af' }]}>
                {pc !== null ? `${pc.toFixed(3)} m` : '-'}
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>NB PROFILS</Text>
              <Text style={styles.gridValue}>{profiles.length}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            disabled={isGenerating}
            onPress={handleShare}>
            {isGenerating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.primaryButtonIcon}>📤</Text>
                <Text style={styles.primaryButtonText}>
                  Partager / Enregistrer le PDF
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.85}
            disabled={isGenerating}
            onPress={handlePrint}>
            <Text style={styles.secondaryButtonIcon}>🖨️</Text>
            <Text style={styles.secondaryButtonText}>
              Imprimer directement
            </Text>
          </TouchableOpacity>
        </View>

        {/* Navigations */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.8}
            onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Revenir aux Profils</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetButton}
            activeOpacity={0.8}
            onPress={handleReset}>
            <Text style={styles.resetButtonText}>Nouveau Chantier ⟳</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 6,
  },
  badge: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1a365d',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    color: '#64748b',
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1a365d',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    maxWidth: '65%',
    textAlign: 'right',
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  gridItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  actionsSection: {
    marginTop: 8,
    marginBottom: 20,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#1a365d',
    paddingVertical: 16,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1a365d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingVertical: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#1a365d',
  },
  secondaryButtonIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  secondaryButtonText: {
    color: '#1a365d',
    fontSize: 15,
    fontWeight: '700',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '700',
  },
  resetButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  resetButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '700',
  },
});

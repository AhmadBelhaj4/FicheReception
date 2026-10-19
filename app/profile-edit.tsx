// app/profile-edit.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProjectStore } from '../src/store/useProjectStore';
import {
  calculateCotePratique,
  calculateDifference,
} from '../src/utils/calculations';

// Robust decimal input handling without losing trailing decimal points
function NumInput({
  label,
  value,
  onChange,
  placeholder = '0.000',
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(value !== null ? value.toString() : '');
  const [isFocused, setIsFocused] = useState(false);

  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    if (!isFocused) {
      if (value === null) {
        setText('');
      } else {
        setText(value.toString());
      }
    }
  }

  const handleChange = (t: string) => {
    const cleaned = t.replace(/[^0-9.,-]/g, '').replace(',', '.');
    const parts = cleaned.split('.');
    const formatted =
      parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
    setText(formatted);

    if (formatted === '' || formatted === '-' || formatted.endsWith('.')) {
      if (formatted === '') onChange(null);
      return;
    }

    const parsed = parseFloat(formatted);
    onChange(isNaN(parsed) ? null : parsed);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (text === '' || text === '-') {
      onChange(null);
      setText('');
    } else {
      const parsed = parseFloat(text);
      if (isNaN(parsed)) {
        onChange(null);
        setText('');
      } else {
        onChange(parsed);
        setText(parsed.toString());
      }
    }
  };

  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={text}
        onChangeText={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor="#999"
      />
    </View>
  );
}

// Result line with color coding for Remblai (Green) / Déblai (Red)
function ResultLine({
  label,
  lecture,
  cote,
  diff,
}: {
  label: string;
  lecture: number | null;
  cote: number | null;
  diff: number | null;
}) {
  const diffColor =
    diff === null
      ? '#94a3b8'
      : diff > 0
      ? '#16a34a' // Remblai = Green
      : diff < 0
      ? '#dc2626' // Déblai = Red
      : '#475569';

  return (
    <View style={styles.resultRow}>
      <Text style={[styles.resultCell, styles.pointCell]}>{label}</Text>
      <Text style={styles.resultCell}>
        {lecture !== null ? lecture.toFixed(3) : '-'}
      </Text>
      <Text style={styles.resultCell}>
        {cote !== null ? cote.toFixed(3) : '-'}
      </Text>
      <Text style={[styles.resultCell, { color: diffColor, fontWeight: '700' }]}>
        {diff !== null
          ? (diff > 0 ? `+${diff.toFixed(3)}` : diff.toFixed(3))
          : '-'}
      </Text>
    </View>
  );
}

export default function ProfileEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profiles, pc, updateProfile } = useProjectStore();

  const profileIndex = profiles.findIndex((p) => p.id === id);
  const profile = profiles[profileIndex];

  if (!profile || pc === null) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Profil introuvable ou Plan de Comparaison (P.C.) non défini.
        </Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Calculate practical elevations live (Cote Pratique = PC - Lecture Avant)
  const coteD2 =
    profile.d2 !== null ? calculateCotePratique(pc, profile.d2) : null;
  const coteD1 =
    profile.d1 !== null ? calculateCotePratique(pc, profile.d1) : null;
  const coteAxe =
    profile.axe !== null ? calculateCotePratique(pc, profile.axe) : null;
  const coteG1 =
    profile.g1 !== null ? calculateCotePratique(pc, profile.g1) : null;
  const coteG2 =
    profile.g2 !== null ? calculateCotePratique(pc, profile.g2) : null;

  // Differences live (Différence = Cote Projet - Cote Pratique)
  const diffD2 =
    profile.coteProjet !== null && coteD2 !== null
      ? calculateDifference(profile.coteProjet, coteD2)
      : null;
  const diffD1 =
    profile.coteProjet !== null && coteD1 !== null
      ? calculateDifference(profile.coteProjet, coteD1)
      : null;
  const diffAxe =
    profile.coteProjet !== null && coteAxe !== null
      ? calculateDifference(profile.coteProjet, coteAxe)
      : null;
  const diffG1 =
    profile.coteProjet !== null && coteG1 !== null
      ? calculateDifference(profile.coteProjet, coteG1)
      : null;
  const diffG2 =
    profile.coteProjet !== null && coteG2 !== null
      ? calculateDifference(profile.coteProjet, coteG2)
      : null;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'android' ? 25 : 0}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled">
        {/* Header with Profile Sequence */}
        <View style={styles.headerSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>PROFIL N° {profileIndex + 1}</Text>
          </View>
          <Text style={styles.title}>Édition du Profil</Text>
          <View style={styles.pcBadge}>
            <Text style={styles.pcText}>P.C. Actuel : {pc.toFixed(3)} m</Text>
          </View>
        </View>

        {/* Section 1: Lectures Avant */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Lectures Avant (Mires en m)</Text>
          <Text style={styles.sectionSubtitle}>
            Ordre standard terrain : Droite (D2, D1), Axe, Gauche (G1, G2)
          </Text>

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <NumInput
                label="D2 (EXT D)"
                value={profile.d2}
                onChange={(v) => updateProfile(profile.id, { d2: v })}
              />
            </View>
            <View style={{ flex: 1, marginRight: 8 }}>
              <NumInput
                label="D1 (INT D)"
                value={profile.d1}
                onChange={(v) => updateProfile(profile.id, { d1: v })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <NumInput
                label="AXE"
                value={profile.axe}
                onChange={(v) => updateProfile(profile.id, { axe: v })}
              />
            </View>
          </View>

          <View style={[styles.row, { marginTop: 8 }]}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <NumInput
                label="G1 (INT G)"
                value={profile.g1}
                onChange={(v) => updateProfile(profile.id, { g1: v })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <NumInput
                label="G2 (EXT G)"
                value={profile.g2}
                onChange={(v) => updateProfile(profile.id, { g2: v })}
              />
            </View>
          </View>
        </View>

        {/* Section 2: Cote Projet */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>2. Cote Projet Théorique (m)</Text>
          <Text style={styles.sectionSubtitle}>
            {"Cote requise par les plans d'exécution du projet"}
          </Text>
          <NumInput
            label="COTE PROJET (Z.THÉO)"
            value={profile.coteProjet}
            onChange={(v) => updateProfile(profile.id, { coteProjet: v })}
            placeholder="Ex: 15.250"
          />
        </View>

        {/* Section 3: Live Calculations Summary */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>3. Synthèse des Calculs</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: '#16a34a' }]} />
              <Text style={styles.legendText}>+ Remblai</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: '#dc2626' }]} />
              <Text style={styles.legendText}>- Déblai</Text>
            </View>
          </View>

          <View style={styles.resultsTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, styles.pointCell]}>Point</Text>
              <Text style={styles.tableHeaderCell}>Lec. AV</Text>
              <Text style={styles.tableHeaderCell}>Cote Pr.</Text>
              <Text style={styles.tableHeaderCell}>Différence</Text>
            </View>
            <ResultLine label="D2" lecture={profile.d2} cote={coteD2} diff={diffD2} />
            <ResultLine label="D1" lecture={profile.d1} cote={coteD1} diff={diffD1} />
            <ResultLine label="Axe" lecture={profile.axe} cote={coteAxe} diff={diffAxe} />
            <ResultLine label="G1" lecture={profile.g1} cote={coteG1} diff={diffG1} />
            <ResultLine label="G2" lecture={profile.g2} cote={coteG2} diff={diffG2} />
          </View>
        </View>

        {/* Section 4: Optional fields */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>4. Données Complémentaires</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <NumInput
                label="DÉVERS (%)"
                value={profile.devers}
                onChange={(v) => updateProfile(profile.id, { devers: v })}
                placeholder="Ex: 2.5"
              />
            </View>
            <View style={{ flex: 1 }}>
              <NumInput
                label="DISTANCE (m)"
                value={profile.distance}
                onChange={(v) => updateProfile(profile.id, { distance: v })}
                placeholder="Ex: 20.0"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>OBSERVATION / OBSTACLE</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={2}
              value={profile.observation}
              onChangeText={(t) =>
                updateProfile(profile.id, { observation: t })
              }
              placeholder="Ex: Regard pluvial, bordure cassée, poteau..."
              placeholderTextColor="#999"
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.saveButton}
          activeOpacity={0.85}
          onPress={() => router.back()}>
          <Text style={styles.saveButtonText}>Enregistrer le Profil ✓</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 6,
  },
  badge: {
    backgroundColor: '#1a365d',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 12,
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
  pcBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  pcText: {
    fontSize: 13,
    color: '#1e40af',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1a365d',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    color: '#475569',
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  textArea: {
    height: 60,
  },
  row: {
    flexDirection: 'row',
  },
  legendRow: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  resultsTable: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 8,
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    color: '#334155',
  },
  resultRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 8,
    alignItems: 'center',
  },
  resultCell: {
    flex: 1,
    fontSize: 12,
    textAlign: 'center',
    color: '#1e293b',
  },
  pointCell: {
    fontWeight: '800',
    color: '#1a365d',
  },
  saveButton: {
    backgroundColor: '#1a365d',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#1a365d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  errorText: {
    fontSize: 16,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '700',
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { useProjectStore } from '../src/store/useProjectStore';

export default function ReferenceScreen() {
  const router = useRouter();
  const { repere, alt, lectureArriere, pc, setReference } = useProjectStore();

  const [altText, setAltText] = useState(alt !== null ? alt.toString() : '');
  const [lecText, setLecText] = useState(
    lectureArriere !== null ? lectureArriere.toString() : ''
  );

  // Keep local input text in sync if store values are reset or changed externally
  const [prevAlt, setPrevAlt] = useState(alt);
  if (alt !== prevAlt) {
    setPrevAlt(alt);
    if (alt === null) {
      setAltText('');
    } else if (parseFloat(altText.replace(',', '.')) !== alt) {
      setAltText(alt.toString());
    }
  }

  const [prevLec, setPrevLec] = useState(lectureArriere);
  if (lectureArriere !== prevLec) {
    setPrevLec(lectureArriere);
    if (lectureArriere === null) {
      setLecText('');
    } else if (parseFloat(lecText.replace(',', '.')) !== lectureArriere) {
      setLecText(lectureArriere.toString());
    }
  }

  const handleAltChange = (t: string) => {
    const cleaned = t.replace(/[^0-9.,-]/g, '').replace(',', '.');
    // Ensure only one dot or minus
    const parts = cleaned.split('.');
    const formatted = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
    setAltText(formatted);

    if (formatted === '' || formatted === '-' || formatted.endsWith('.')) {
      if (formatted === '') setReference({ alt: null });
      return;
    }
    const parsed = parseFloat(formatted);
    setReference({ alt: isNaN(parsed) ? null : parsed });
  };

  const handleLecChange = (t: string) => {
    const cleaned = t.replace(/[^0-9.,-]/g, '').replace(',', '.');
    const parts = cleaned.split('.');
    const formatted = parts[0] + (parts.length > 1 ? '.' + parts.slice(1).join('') : '');
    setLecText(formatted);

    if (formatted === '' || formatted === '-' || formatted.endsWith('.')) {
      if (formatted === '') setReference({ lectureArriere: null });
      return;
    }
    const parsed = parseFloat(formatted);
    setReference({ lectureArriere: isNaN(parsed) ? null : parsed });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled">
      {/* Step Badge & Header */}
      <View style={styles.headerSection}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>ÉTAPE 2 / 4</Text>
        </View>
        <Text style={styles.title}>Repère de Référence</Text>
        <Text style={styles.subtitle}>
          Définition du repère et calcul automatique du Plan de Comparaison (P.C.)
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>REPÈRE (BORNE OU POINT FIXE)</Text>
          <TextInput
            style={styles.input}
            value={repere}
            onChangeText={(t) => setReference({ repere: t })}
            placeholder="Ex: TN 01, Borne A, Clou..."
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>ALTITUDE (Z) EN MÈTRES</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={altText}
            onChangeText={handleAltChange}
            placeholder="Ex: 16.530"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>LECTURE ARRIÈRE (LAR) EN MÈTRES</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={lecText}
            onChangeText={handleLecChange}
            placeholder="Ex: 1.310"
            placeholderTextColor="#999"
          />
        </View>

        {/* Calculated PC Box */}
        <View style={styles.calculatedBox}>
          <Text style={styles.calculatedLabel}>
            PLAN DE COMPARAISON (P.C. = ALT + LAR)
          </Text>
          <Text style={styles.calculatedValue}>
            {pc !== null ? `${pc.toFixed(3)} m` : '---'}
          </Text>
          <Text style={styles.calculatedHelper}>
            {pc !== null
              ? 'Calculé automatiquement et utilisé pour tous les profils'
              : 'Renseignez ALT (Z) et Lecture Arrière pour calculer le P.C.'}
          </Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.8}
          onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.nextButton, !pc && styles.nextButtonDisabled]}
          activeOpacity={0.85}
          onPress={() => router.push('/profiles' as Href)}>
          <Text style={styles.nextButtonText}>Suivant : Profils (Étape 3) →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a365d',
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
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    color: '#334155',
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  calculatedBox: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginTop: 8,
    alignItems: 'center',
  },
  calculatedLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e40af',
    letterSpacing: 0.5,
  },
  calculatedValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a365d',
    marginTop: 6,
  },
  calculatedHelper: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 4,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  backButtonText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '700',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#1a365d',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#1a365d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
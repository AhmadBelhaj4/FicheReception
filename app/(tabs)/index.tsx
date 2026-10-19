import React, { useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, Href } from 'expo-router';
import { useProjectStore } from '../../src/store/useProjectStore';

export default function HeaderScreen() {
  const router = useRouter();
  const [showPicker, setShowPicker] = useState(false);
  const {
    receptionNumber,
    vNumber,
    pNumber,
    date,
    typeIntervention,
    setHeader,
  } = useProjectStore();

  const handleNext = () => {
    router.push('/reference' as Href);
  };

  const currentDateObj = date ? new Date(date) : new Date();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled">
        {/* Step Badge & Header */}
        <View style={styles.headerSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ÉTAPE 1 / 4</Text>
          </View>
          <Text style={styles.title}>FICHE DE RÉCEPTION</Text>
          <Text style={styles.subtitle}>Informations Générales du Chantier</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>RÉCEPTION N°</Text>
            <TextInput
              style={styles.input}
              value={receptionNumber}
              onChangeText={(t) => setHeader({ receptionNumber: t })}
              placeholder="Ex: 01/2024"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>V N°</Text>
              <TextInput
                style={styles.input}
                value={vNumber}
                onChangeText={(t) => setHeader({ vNumber: t })}
                placeholder="Ex: 02"
                placeholderTextColor="#999"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>P N°</Text>
              <TextInput
                style={styles.input}
                value={pNumber}
                onChangeText={(t) => setHeader({ pNumber: t })}
                placeholder="Ex: 1/4"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>DATE DE RÉCEPTION</Text>
            <TouchableOpacity
              style={styles.dateButton}
              activeOpacity={0.7}
              onPress={() => setShowPicker(true)}>
              <Text style={styles.dateText}>
                {date
                  ? new Date(date).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Sélectionner la date'}
              </Text>
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={isNaN(currentDateObj.getTime()) ? new Date() : currentDateObj}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowPicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    const iso = selectedDate.toISOString().split('T')[0];
                    setHeader({ date: iso });
                  }
                }}
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{"TYPE D'INTERVENTION VOIRIE PROJETÉE"}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={3}
              value={typeIntervention}
              onChangeText={(t) => setHeader({ typeIntervention: t })}
              placeholder="Ex: Pose de bordures T2, Décaissement et Réglage..."
              placeholderTextColor="#999"
              textAlignVertical="top"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.nextButton}
          activeOpacity={0.85}
          onPress={handleNext}>
          <Text style={styles.nextButtonText}>Suivant : Repère de Référence (Étape 2) →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
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
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    color: '#64748b',
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
  textArea: {
    height: 90,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
  },
  nextButton: {
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
  nextButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
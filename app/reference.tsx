// app/reference.tsx
import React from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { useProjectStore } from '../src/store/useProjectStore';

export default function ReferenceScreen() {
  const router = useRouter();
  const { repere, alt, lectureArriere, pc, setReference } = useProjectStore();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Étape 2: Repère de Référence</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>REPÈRE</Text>
        <TextInput
          style={styles.input}
          value={repere}
          onChangeText={(t) => setReference({ repere: t })}
          placeholder="Ex: TN 01"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>ALT (Z) (m)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={alt !== null ? alt.toString() : ''}
          onChangeText={(t) => setReference({ alt: parseFloat(t) || null })}
          placeholder="Ex: 16.53"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>LECTURE ARRIÈRE (m)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={lectureArriere !== null ? lectureArriere.toString() : ''}
          onChangeText={(t) => setReference({ lectureArriere: parseFloat(t) || null })}
          placeholder="Ex: 1.31"
        />
      </View>

      {/* This box shows the auto-calculated PC */}
      <View style={styles.calculatedBox}>
        <Text style={styles.calculatedLabel}>P.C. (Calculé automatiquement)</Text>
        <Text style={styles.calculatedValue}>
          {pc !== null ? `${pc.toFixed(3)} m` : '---'}
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/profiles' as Href)}>
          <Text style={styles.buttonText}>Suivant (Étape 3)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginTop: 20, marginBottom: 30, color: '#1a365d' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 6,
    padding: 12, fontSize: 16, backgroundColor: '#f9f9f9'
  },
  calculatedBox: {
    backgroundColor: '#e6f0fa',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#b3d4f0',
    marginBottom: 20,
    alignItems: 'center'
  },
  calculatedLabel: { fontSize: 12, fontWeight: 'bold', color: '#1a365d' },
  calculatedValue: { fontSize: 24, fontWeight: 'bold', color: '#1a365d', marginTop: 5 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  button: {
    backgroundColor: '#1a365d', padding: 15, borderRadius: 8,
    alignItems: 'center', flex: 1, marginLeft: 10
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  backButton: {
    backgroundColor: '#e0e0e0', padding: 15, borderRadius: 8,
    alignItems: 'center', flex: 1, marginRight: 10
  },
  backButtonText: { color: '#333', fontSize: 16, fontWeight: 'bold' },
});
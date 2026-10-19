// app/(tabs)/index.tsx
import React, { useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, Href } from 'expo-router';
import { useProjectStore } from '../../src/store/useProjectStore';

export default function HeaderScreen() {
  const router = useRouter();
  const [showPicker, setShowPicker] = useState(false);
  const {
    receptionNumber, vNumber, pNumber, date, typeIntervention,
    setHeader
  } = useProjectStore();

  const handleNext = () => {
    router.push('/reference' as Href);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>FICHE DE RECEPTION</Text>
      <Text style={styles.subtitle}>Étape 1: Informations Générales</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>RÉCEPTION N°</Text>
        <TextInput
          style={styles.input}
          value={receptionNumber}
          onChangeText={(t) => setHeader({ receptionNumber: t })}
          placeholder="Ex: 01/2024"
        />
      </View>

      <View style={styles.row}>
        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
          <Text style={styles.label}>V N°</Text>
          <TextInput
            style={styles.input}
            value={vNumber}
            onChangeText={(t) => setHeader({ vNumber: t })}
          />
        </View>
        <View style={[styles.inputGroup, { flex: 1 }]}>
          <Text style={styles.label}>P N°</Text>
          <TextInput
            style={styles.input}
            value={pNumber}
            onChangeText={(t) => setHeader({ pNumber: t })}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>DATE</Text>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowPicker(true)}
        >
          <Text style={{ fontSize: 16 }}>
            {date ? new Date(date).toLocaleDateString('fr-FR') : 'Choisir une date'}
          </Text>
        </TouchableOpacity>

        {showPicker && (
          <DateTimePicker
            value={date ? new Date(date) : new Date()}
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
        <Text style={styles.label}>TYPE D'INTERVENTION VOIRIE PROJETEE</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          multiline
          value={typeIntervention}
          onChangeText={(t) => setHeader({ typeIntervention: t })}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Suivant (Étape 2)</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginTop: 20, color: '#1a365d' },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 30, color: '#666' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: 'bold', marginBottom: 5, color: '#333' },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 6,
    padding: 12, fontSize: 16, backgroundColor: '#f9f9f9'
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  button: {
    backgroundColor: '#1a365d', padding: 15, borderRadius: 8,
    alignItems: 'center', marginTop: 10
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
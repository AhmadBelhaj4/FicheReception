// app/profile-edit.tsx
// app/profile-edit.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useProjectStore } from '../src/store/useProjectStore';
import { calculateCotePratique, calculateDifference } from '../src/utils/calculations';

// Helper to render a numeric input
function NumInput({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
    const [text, setText] = React.useState(value !== null ? value.toString() : '');

    // Keep local text in sync if external value changes (e.g. reset)
    React.useEffect(() => {
        const parsed = parseFloat(text.replace(',', '.'));
        if (value === null && text !== '' && isNaN(parsed)) setText('');
        else if (value === null && text !== '') setText('');
        else if (value !== null && parsed !== value) setText(value.toString());
    }, [value]);

    const handleChange = (t: string) => {
        // Allow digits, comma, dot, and one decimal separator
        const cleaned = t.replace(/[^0-9.,]/g, '');
        setText(cleaned);
        const parsed = parseFloat(cleaned.replace(',', '.'));
        onChange(isNaN(parsed) ? null : parsed);
    };

    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={text}
                onChangeText={handleChange}
                placeholder="0.00"
            />
        </View>
    );
}

export default function ProfileEditScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { profiles, pc, updateProfile } = useProjectStore();

    const profile = profiles.find((p) => p.id === id);

    if (!profile || !pc) {
        return (
            <View style={styles.container}>
                <Text style={styles.error}>Profil introuvable ou P.C. non défini.</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Retour</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Calculate reception elevations live
    const coteD1 = profile.d1 !== null ? calculateCotePratique(pc, profile.d1) : null;
    const coteD2 = profile.d2 !== null ? calculateCotePratique(pc, profile.d2) : null;
    const coteAxe = profile.axe !== null ? calculateCotePratique(pc, profile.axe) : null;
    const coteG1 = profile.g1 !== null ? calculateCotePratique(pc, profile.g1) : null;
    const coteG2 = profile.g2 !== null ? calculateCotePratique(pc, profile.g2) : null;

    // Difference (only if coteProjet entered)
    const diffD1 = profile.coteProjet !== null && coteD1 !== null ? calculateDifference(profile.coteProjet, coteD1) : null;
    const diffD2 = profile.coteProjet !== null && coteD2 !== null ? calculateDifference(profile.coteProjet, coteD2) : null;
    const diffAxe = profile.coteProjet !== null && coteAxe !== null ? calculateDifference(profile.coteProjet, coteAxe) : null;
    const diffG1 = profile.coteProjet !== null && coteG1 !== null ? calculateDifference(profile.coteProjet, coteG1) : null;
    const diffG2 = profile.coteProjet !== null && coteG2 !== null ? calculateDifference(profile.coteProjet, coteG2) : null;

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView style={styles.container}>
                <Text style={styles.title}>Édition du Profil</Text>
                <Text style={styles.pcText}>P.C.: {pc.toFixed(3)} m</Text>

                {/* Readings */}
                <Text style={styles.sectionTitle}>Lectures Avant (m)</Text>
                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <NumInput label="D1" value={profile.d1} onChange={(v) => updateProfile(profile.id, { d1: v })} />
                    </View>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <NumInput label="D2" value={profile.d2} onChange={(v) => updateProfile(profile.id, { d2: v })} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <NumInput label="AXE" value={profile.axe} onChange={(v) => updateProfile(profile.id, { axe: v })} />
                    </View>
                </View>
                <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <NumInput label="G1" value={profile.g1} onChange={(v) => updateProfile(profile.id, { g1: v })} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <NumInput label="G2" value={profile.g2} onChange={(v) => updateProfile(profile.id, { g2: v })} />
                    </View>
                </View>

                {/* Cote Projet */}
                <Text style={styles.sectionTitle}>Cote Projet (m)</Text>
                <NumInput label="COTE PROJET (THEORIQUE)" value={profile.coteProjet} onChange={(v) => updateProfile(profile.id, { coteProjet: v })} />

                {/* Calculated Results */}
                <Text style={styles.sectionTitle}>Résultats Calculés</Text>
                <View style={styles.resultsTable}>
                    <View style={styles.resultRow}>
                        <Text style={styles.resultCell}>Point</Text>
                        <Text style={styles.resultCell}>Cote Pratique</Text>
                        <Text style={styles.resultCell}>Différence</Text>
                    </View>
                    <ResultLine label="D1" cote={coteD1} diff={diffD1} />
                    <ResultLine label="D2" cote={coteD2} diff={diffD2} />
                    <ResultLine label="Axe" cote={coteAxe} diff={diffAxe} />
                    <ResultLine label="G1" cote={coteG1} diff={diffG1} />
                    <ResultLine label="G2" cote={coteG2} diff={diffG2} />
                </View>

                {/* Optional fields */}
                <Text style={styles.sectionTitle}>Divers</Text>
                <NumInput label="DISTANCE (m)" value={profile.distance} onChange={(v) => updateProfile(profile.id, { distance: v })} />
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>OBSERVATION</Text>
                    <TextInput
                        style={[styles.input, { height: 70 }]}
                        multiline
                        value={profile.observation}
                        onChangeText={(t) => updateProfile(profile.id, { observation: t })}
                        placeholder="Note libre..."
                    />
                </View>

                <TouchableOpacity style={styles.saveButton} onPress={() => router.back()}>
                    <Text style={styles.saveButtonText}>Enregistrer et Retour</Text>
                </TouchableOpacity>
                <View style={{ height: 40 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// Small helper to render a results row
function ResultLine({ label, cote, diff }: { label: string; cote: number | null; diff: number | null }) {
    const diffColor = diff === null ? '#888' : diff > 0 ? '#2c7a7b' : diff < 0 ? '#c53030' : '#888';
    return (
        <View style={styles.resultRow}>
            <Text style={styles.resultCell}>{label}</Text>
            <Text style={styles.resultCell}>{cote !== null ? cote.toFixed(3) : '-'}</Text>
            <Text style={[styles.resultCell, { color: diffColor, fontWeight: 'bold' }]}>
                {diff !== null ? (diff > 0 ? `+${diff.toFixed(3)}` : diff.toFixed(3)) : '-'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginTop: 20, color: '#1a365d' },
    pcText: { fontSize: 14, textAlign: 'center', color: '#1a365d', marginBottom: 15, fontWeight: 'bold' },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#2c7a7b', marginTop: 20, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', paddingBottom: 5 },
    inputGroup: { marginBottom: 12 },
    label: { fontSize: 11, fontWeight: 'bold', marginBottom: 4, color: '#333' },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, fontSize: 15, backgroundColor: '#f9f9f9' },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    resultsTable: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 6, overflow: 'hidden' },
    resultRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
    resultCell: { flex: 1, padding: 8, fontSize: 13, textAlign: 'center', color: '#333' },
    saveButton: { backgroundColor: '#2c7a7b', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 25 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    backButton: { backgroundColor: '#e0e0e0', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    backButtonText: { color: '#333', fontSize: 16, fontWeight: 'bold' },
    error: { fontSize: 16, color: '#c53030', textAlign: 'center', marginTop: 40 },
});
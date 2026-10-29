// app/profile-edit.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Button } from 'heroui-native';

import { useProjectStore } from '../src/store/useProjectStore';
import { useSettingsStore } from '../src/store/useSettingsStore';
import {
  calculateCotePratique,
  calculateDifference,
  checkDifference,
  checkReading,
  getConformity,
  DEFAULT_TOLERANCE_M,
} from '../src/utils/calculations';

// ─── NumInput ────────────────────────────────────────────────────────────────
// Robust decimal input: retains trailing dots, handles commas, commits on blur.
// Uses raw TextInput (not HeroUI Input) to keep exact event-handling logic.
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
    <View className="mb-2.5">
      <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">
        {label}
      </Text>
      <TextInput
        className="bg-slate-700 border border-slate-600 rounded-xl px-3 text-slate-50 text-base"
        style={{ height: 48 }}
        keyboardType="decimal-pad"
        value={text}
        onChangeText={handleChange}
        onFocus={() => { setIsFocused(true); Haptics.selectionAsync(); }}
        onBlur={handleBlur}
        placeholder={placeholder}
        placeholderTextColor="#64748b"
      />
    </View>
  );
}

// ─── ResultLine ───────────────────────────────────────────────────────────────
// One row in the live calculations table.
function ResultLine({
  label,
  isAxe,
  lecture,
  cote,
  diff,
  tolerance,
}: {
  label: string;
  isAxe?: boolean;
  lecture: number | null;
  cote: number | null;
  diff: number | null;
  tolerance?: number;
}) {
  const isRemblai = diff !== null && diff > 0;
  const isDeblai  = diff !== null && diff < 0;

  const diffColor = diff === null
    ? 'text-slate-600'
    : isRemblai
    ? 'text-emerald-400'
    : isDeblai
    ? 'text-red-400'
    : 'text-slate-400';

  const rowBg = isAxe ? 'bg-slate-700' : 'bg-transparent';
  const labelStyle = isAxe
    ? 'text-amber-400 font-black text-xs'
    : 'text-slate-300 font-bold text-xs';

  return (
    <View className={`flex-row py-2.5 px-3 border-b border-slate-700 ${rowBg}`}>
      <Text className={`${labelStyle} flex-1 text-center`}>{label}</Text>
      <Text className="text-slate-300 text-xs text-center flex-1">
        {lecture !== null ? lecture.toFixed(3) : '–'}
      </Text>
      <Text className="text-slate-300 text-xs text-center flex-1">
        {cote !== null ? cote.toFixed(3) : '–'}
      </Text>
      <Text className={`${diffColor} text-xs text-center flex-1 font-bold`}>
        {diff !== null
          ? (diff > 0 ? `+${diff.toFixed(3)}` : diff.toFixed(3)) +
            (getConformity(diff, tolerance) === 'ok' ? ' ✓' : ' ⚠')
          : '–'}
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ProfileEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profiles, pc, updateProfile } = useProjectStore();
  const { toleranceM } = useSettingsStore();

  // Discard a never-filled profile when leaving the screen, so tapping
  // "Ajouter" then going back doesn't leave a blank profile in the list.
  useEffect(() => {
    return () => {
      const { profiles: current, deleteProfile } = useProjectStore.getState();
      const p = current.find((x) => x.id === id);
      if (
        p &&
        p.d1 === null && p.d2 === null && p.axe === null &&
        p.g1 === null && p.g2 === null && p.coteProjet === null &&
        p.distance === null && p.devers === null &&
        p.observation.trim() === ''
      ) {
        deleteProfile(p.id);
      }
    };
  }, [id]);

  const profileIndex = profiles.findIndex((p) => p.id === id);
  const profile = profiles[profileIndex];

  if (!profile || pc === null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-red-400 text-base text-center font-semibold mb-6">
          Profil introuvable ou Plan de Comparaison (P.C.) non défini.
        </Text>
        <Button variant="outline" size="lg" onPress={() => router.back()}>
          <Button.Label className="font-bold">← Retour</Button.Label>
        </Button>
        </View>
    </SafeAreaView>
    );
  }

  // Live cote pratique calculations (Cote Pratique = PC – Lecture Avant)
  const coteD2  = profile.d2  !== null ? calculateCotePratique(pc, profile.d2)  : null;
  const coteD1  = profile.d1  !== null ? calculateCotePratique(pc, profile.d1)  : null;
  const coteAxe = profile.axe !== null ? calculateCotePratique(pc, profile.axe) : null;
  const coteG1  = profile.g1  !== null ? calculateCotePratique(pc, profile.g1)  : null;
  const coteG2  = profile.g2  !== null ? calculateCotePratique(pc, profile.g2)  : null;

  // Live differences (Différence = Cote Projet – Cote Pratique)
  const diffD2  = profile.coteProjet !== null && coteD2  !== null ? calculateDifference(profile.coteProjet, coteD2)  : null;
  const diffD1  = profile.coteProjet !== null && coteD1  !== null ? calculateDifference(profile.coteProjet, coteD1)  : null;
  const diffAxe = profile.coteProjet !== null && coteAxe !== null ? calculateDifference(profile.coteProjet, coteAxe) : null;
  const diffG1  = profile.coteProjet !== null && coteG1  !== null ? calculateDifference(profile.coteProjet, coteG1)  : null;
  const diffG2  = profile.coteProjet !== null && coteG2  !== null ? calculateDifference(profile.coteProjet, coteG2)  : null;

  // Sanity checks: label each warning with its point, de-duplicated.
  const warnings: string[] = [];
  const addWarning = (label: string, msg: string | null) => {
    if (msg) warnings.push(`${label} : ${msg}`);
  };
  ([['D2', profile.d2, diffD2], ['D1', profile.d1, diffD1], ['Axe', profile.axe, diffAxe],
    ['G1', profile.g1, diffG1], ['G2', profile.g2, diffG2]] as const).forEach(
    ([label, reading, diff]) => {
      addWarning(label, checkReading(reading));
      addWarning(label, checkDifference(diff));
    }
  );

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: '#0f172a' }}
      contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 180 }}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={120}
      extraHeight={120}
      enableResetScrollToCoords={false}
      keyboardOpeningTime={0}
    >
      {/* ── Header ── */}
        <View className="items-center mb-5">
          <View className="bg-amber-400 rounded-full px-5 py-1.5 mb-2">
            <Text className="text-slate-900 text-xs font-black tracking-widest uppercase">
              Profil N° {profileIndex + 1}
            </Text>
          </View>
          <Text className="text-2xl font-black text-slate-50 text-center">
            Édition du Profil
          </Text>
          <View className="bg-slate-800 border border-amber-400/40 rounded-lg px-4 py-1.5 mt-2">
            <Text className="text-amber-400 text-sm font-bold">
              P.C. Actuel : {pc.toFixed(3)} m
            </Text>
          </View>
        </View>

        {/* ── Section 1: Lectures Avant ── */}
        <View className="bg-slate-800 rounded-2xl p-4 mb-3 border border-slate-700">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-1 h-5 bg-amber-400 rounded-full" />
            <Text className="text-xs font-bold text-slate-400 tracking-widest uppercase">
              1. Lectures Avant (mires en m)
            </Text>
          </View>
          <Text className="text-slate-500 text-xs mb-3">
            Même ordre que la fiche officielle : D1, D2 (F), Axe, G1, G2 (F)
          </Text>

          {/* D1, D2, Axe on one row (same order as the PDF) */}
          <View className="flex-row gap-2">
            <View className="flex-1">
              <NumInput
                label="D1 (Int D)"
                value={profile.d1}
                onChange={(v) => updateProfile(profile.id, { d1: v })}
              />
            </View>
            <View className="flex-1">
              <NumInput
                label="D2 (Ext D)"
                value={profile.d2}
                onChange={(v) => updateProfile(profile.id, { d2: v })}
              />
            </View>
            <View className="flex-1">
              <NumInput
                label="Axe"
                value={profile.axe}
                onChange={(v) => updateProfile(profile.id, { axe: v })}
              />
            </View>
          </View>

          {/* G1, G2 on a second row */}
          <View className="flex-row gap-2 mt-1">
            <View className="flex-1">
              <NumInput
                label="G1 (Int G)"
                value={profile.g1}
                onChange={(v) => updateProfile(profile.id, { g1: v })}
              />
            </View>
            <View className="flex-1">
              <NumInput
                label="G2 (Ext G)"
                value={profile.g2}
                onChange={(v) => updateProfile(profile.id, { g2: v })}
              />
            </View>
            {/* Spacer to keep symmetry */}
            <View className="flex-1" />
          </View>
        </View>

        {/* ── Section 2: Cote Projet ── */}
        <View className="bg-slate-800 rounded-2xl p-4 mb-3 border border-slate-700">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-1 h-5 bg-amber-400 rounded-full" />
            <Text className="text-xs font-bold text-slate-400 tracking-widest uppercase">
              2. Cote Projet Théorique (m)
            </Text>
          </View>
          <Text className="text-slate-500 text-xs mb-3">
            {"Cote requise par les plans d\u2019exécution du projet"}
          </Text>
          <NumInput
            label="Cote Projet (Z.Théo)"
            value={profile.coteProjet}
            onChange={(v) => updateProfile(profile.id, { coteProjet: v })}
            placeholder="Ex : 15.250"
          />
        </View>

        {/* ── Section 3: Live Calculations Table ── */}
        <View className="bg-slate-800 rounded-2xl mb-3 border border-slate-700 overflow-hidden">
          {/* Table header */}
          <View className="flex-row items-center gap-2 p-4 pb-2">
            <View className="w-1 h-5 bg-amber-400 rounded-full" />
            <Text className="text-xs font-bold text-slate-400 tracking-widest uppercase">
              3. Synthèse des Calculs
            </Text>
          </View>

          {/* Legend */}
          <View className="flex-row gap-4 px-4 pb-3">
            <View className="flex-row items-center gap-1.5">
              <View className="w-2 h-2 rounded-full bg-emerald-400" />
              <Text className="text-emerald-400 text-xs font-semibold">+ Remblai</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View className="w-2 h-2 rounded-full bg-red-400" />
              <Text className="text-red-400 text-xs font-semibold">– Déblai</Text>
            </View>
          </View>

          {/* Column header */}
          <View className="flex-row bg-slate-900 py-2 px-3 border-y border-slate-700">
            <Text className="flex-1 text-xs font-black text-center text-slate-400 uppercase">Point</Text>
            <Text className="flex-1 text-xs font-black text-center text-slate-400 uppercase">Lec. AV</Text>
            <Text className="flex-1 text-xs font-black text-center text-slate-400 uppercase">Cote Pr.</Text>
            <Text className="flex-1 text-xs font-black text-center text-slate-400 uppercase">Diff.</Text>
          </View>

          <ResultLine label="D1" tolerance={toleranceM} lecture={profile.d1} cote={coteD1} diff={diffD1} />
          <ResultLine label="D2" tolerance={toleranceM} lecture={profile.d2} cote={coteD2} diff={diffD2} />
          <ResultLine label="Axe" isAxe lecture={profile.axe} cote={coteAxe} diff={diffAxe} />
          <ResultLine label="G1" tolerance={toleranceM} lecture={profile.g1} cote={coteG1} diff={diffG1} />
          <ResultLine label="G2" tolerance={toleranceM} lecture={profile.g2} cote={coteG2} diff={diffG2} />
          <Text className="text-slate-500 text-xs px-4 py-2">
            ✓ conforme (± {(toleranceM * 100).toFixed(0)} cm) · ⚠ hors tolérance
          </Text>
        </View>

        {warnings.length > 0 && (
          <View className="bg-amber-400/10 rounded-2xl p-4 mb-3 border border-amber-400/40">
            <Text className="text-amber-400 text-xs font-bold tracking-widest uppercase mb-2">
              Vérifications
            </Text>
            {warnings.map((w) => (
              <Text key={w} className="text-amber-300 text-xs mb-1">• {w}</Text>
            ))}
          </View>
        )}

        {/* ── Section 4: Données complémentaires ── */}
        <View className="bg-slate-800 rounded-2xl p-4 mb-5 border border-slate-700">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="w-1 h-5 bg-amber-400 rounded-full" />
            <Text className="text-xs font-bold text-slate-400 tracking-widest uppercase">
              4. Données Complémentaires
            </Text>
          </View>

          <View className="flex-row gap-2 mb-2">
            <View className="flex-1">
              <NumInput
                label="Dévers (%)"
                value={profile.devers}
                onChange={(v) => updateProfile(profile.id, { devers: v })}
                placeholder="Ex : 2.5"
              />
            </View>
            <View className="flex-1">
              <NumInput
                label="Distance (m)"
                value={profile.distance}
                onChange={(v) => updateProfile(profile.id, { distance: v })}
                placeholder="Ex : 20.0"
              />
            </View>
          </View>

          <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">
            Observation / Obstacle
          </Text>
          <TextInput
            className="bg-slate-700 border border-slate-600 rounded-xl px-3 text-slate-50 text-sm"
            style={{ height: 64, paddingTop: 10 }}
            multiline
            numberOfLines={2}
            value={profile.observation}
            onChangeText={(t) => updateProfile(profile.id, { observation: t })}
            placeholder="Ex : Regard pluvial, bordure cassée, poteau..."
            placeholderTextColor="#64748b"
            textAlignVertical="top"
          />
        </View>

        {/* ── Save button ── */}
        <Button
          variant="primary"
          size="lg"
          feedbackVariant="scale-ripple"
          onPress={() => router.back()}
        >
          <Button.Label className="font-bold tracking-wide">
            Enregistrer le Profil ✓
          </Button.Label>
        </Button>
    </KeyboardAwareScrollView>
  );
}

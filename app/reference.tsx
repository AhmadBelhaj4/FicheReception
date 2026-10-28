import React, { useState } from 'react';
import {
  Text,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter, Href } from 'expo-router';
import { Button, Input, Label, TextField } from 'heroui-native';

import { useProjectStore } from '../src/store/useProjectStore';
import { StepBadge } from '../components/ui/StepBadge';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { FieldCard } from '../components/ui/FieldCard';

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

  const pcReady = pc !== null;

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1, backgroundColor: '#0f172a' }}
      contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 160 }}
      keyboardShouldPersistTaps="handled"
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={120}
      extraHeight={120}
      enableResetScrollToCoords={false}
      keyboardOpeningTime={0}
    >
      {/* Step badge + heading */}
      <StepBadge current={2} total={4} />
      <ScreenHeader
        title="Repère de Référence"
        subtitle={"Définition du repère et calcul automatique du Plan de Comparaison (P.C.)"}
      />

      {/* ─── Benchmark inputs ─── */}
      <FieldCard>
        <View className="flex-row items-center gap-2 mb-4">
          <View className="w-1 h-5 bg-amber-400 rounded-full" />
          <Text className="text-xs font-bold text-slate-400 tracking-widest uppercase">
            Point de référence
          </Text>
        </View>

        {/* Repère */}
        <TextField className="mb-4">
          <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
            Repère (borne ou point fixe)
          </Label>
          <Input
            className="bg-slate-700 border-slate-600 text-slate-50 rounded-xl h-13"
            placeholder="Ex : TN 01, Borne A, Clou..."
            placeholderTextColor="#64748b"
            value={repere}
            onChangeText={(t) => setReference({ repere: t })}
            returnKeyType="next"
          />
        </TextField>

        {/* ALT (Z) + LAR row */}
        <View className="flex-row gap-3">
          <TextField className="flex-1">
            <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Altitude Z (m)
            </Label>
            <Input
              className="bg-slate-700 border-slate-600 text-slate-50 rounded-xl h-13"
              keyboardType="decimal-pad"
              placeholder="16.530"
              placeholderTextColor="#64748b"
              value={altText}
              onChangeText={handleAltChange}
            />
          </TextField>

          <TextField className="flex-1">
            <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Lect. Arrière (m)
            </Label>
            <Input
              className="bg-slate-700 border-slate-600 text-slate-50 rounded-xl h-13"
              keyboardType="decimal-pad"
              placeholder="1.310"
              placeholderTextColor="#64748b"
              value={lecText}
              onChangeText={handleLecChange}
            />
          </TextField>
        </View>
      </FieldCard>

      {/* ─── P.C. result card ─── */}
      <View
        className={[
          'rounded-2xl p-5 mb-5 border items-center',
          pcReady
            ? 'bg-slate-800 border-amber-400'
            : 'bg-slate-800 border-slate-700',
        ].join(' ')}
      >
        {/* Formula label */}
        <View className="flex-row items-center gap-2 mb-3">
          <View
            className={['w-1 h-5 rounded-full', pcReady ? 'bg-amber-400' : 'bg-slate-600'].join(' ')}
          />
          <Text className="text-xs font-bold text-slate-400 tracking-widest uppercase">
            Plan de Comparaison
          </Text>
        </View>

        {/* Formula */}
        <Text className="text-slate-500 text-xs font-semibold tracking-wider mb-2 uppercase">
          P.C. = ALT (Z) + LAR
        </Text>

        {/* Big value */}
        <Text
          className={[
            'font-black text-5xl tracking-tight',
            pcReady ? 'text-amber-400' : 'text-slate-600',
          ].join(' ')}
        >
          {pcReady ? `${pc!.toFixed(3)}` : '---'}
        </Text>
        {pcReady && (
          <Text className="text-amber-500 text-xs font-semibold mt-1">mètres NGT</Text>
        )}

        {/* Helper text */}
        <Text
          className={[
            'text-xs text-center mt-3 px-4',
            pcReady ? 'text-slate-400' : 'text-slate-600',
          ].join(' ')}
        >
          {pcReady
            ? 'Calculé automatiquement · utilisé pour tous les profils'
            : 'Renseignez ALT (Z) et Lecture Arrière pour calculer le P.C.'}
        </Text>
      </View>

      {/* ─── Button row ─── */}
      <View className="flex-row gap-3">
        <Button
          variant="outline"
          size="lg"
          onPress={() => router.back()}
          className="flex-none px-5"
        >
          <Button.Label className="font-bold">← Retour</Button.Label>
        </Button>

        <Button
          variant="primary"
          size="lg"
          feedbackVariant="scale-ripple"
          isDisabled={!pcReady}
          onPress={() => router.push('/profiles' as Href)}
          className="flex-1"
        >
          <Button.Label className="font-bold tracking-wide">
            Suivant : Profils
          </Button.Label>
          <Text className="text-white text-lg ml-1">→</Text>
        </Button>
      </View>
    </KeyboardAwareScrollView>
  );
}
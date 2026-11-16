import React, { useState } from 'react';
import {
  Text,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter, Href } from 'expo-router';
import { Button, Input, TextField } from 'heroui-native';

import { useProjectStore } from '../src/store/useProjectStore';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { StepBadge } from '../components/ui/StepBadge';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { FieldCard } from '../components/ui/FieldCard';

export default function ReferenceScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { repere, alt, lectureArriere, pc, setReference } = useProjectStore();

  const [altText, setAltText] = useState(alt !== null ? alt.toString() : '');
  const [lecText, setLecText] = useState(
    lectureArriere !== null ? lectureArriere.toString() : ''
  );

  const inputClass = isDark
    ? 'bg-slate-700 border-slate-600 text-slate-50'
    : 'bg-slate-100 border-slate-300 text-slate-900';

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
      style={{ flex: 1, backgroundColor: colors.bg }}
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
          <Text style={{ color: colors.textMuted }} className="text-xs font-bold tracking-widest uppercase">
            Point de référence
          </Text>
        </View>

        {/* Repère */}
        <TextField className="mb-4">
          <Text style={{ color: colors.textMuted }} className="text-xs font-bold uppercase tracking-wider mb-1.5">
            Repère (borne ou point fixe)
          </Text>
          <Input
            className={`${inputClass} rounded-xl h-13`}
            placeholder="Ex : Clou de géomètre, Borne A..."
            placeholderTextColor={colors.textDim}
            value={repere}
            onChangeText={(t) => setReference({ repere: t })}
            returnKeyType="next"
          />
        </TextField>

        {/* ALT (Z) + LAR row */}
        <View className="flex-row gap-3">
          <TextField className="flex-1">
            <Text style={{ color: colors.textMuted }} className="text-xs font-bold uppercase tracking-wider mb-1.5">
              Altitude Z (m)
            </Text>
            <Input
              className={`${inputClass} rounded-xl h-13`}
              keyboardType="decimal-pad"
              placeholder="Ex : 16.530"
              placeholderTextColor={colors.textDim}
              value={altText}
              onChangeText={handleAltChange}
            />
          </TextField>

          <TextField className="flex-1">
            <Text style={{ color: colors.textMuted }} className="text-xs font-bold uppercase tracking-wider mb-1.5">
              Lect. Arrière (m)
            </Text>
            <Input
              className={`${inputClass} rounded-xl h-13`}
              keyboardType="decimal-pad"
              placeholder="Ex : 1.310"
              placeholderTextColor={colors.textDim}
              value={lecText}
              onChangeText={handleLecChange}
            />
          </TextField>
        </View>
      </FieldCard>

      {/* ─── P.C. result card ─── */}
      <View
        style={{
          backgroundColor: colors.card,
          borderColor: pcReady ? colors.accent : colors.cardBorder,
        }}
        className="rounded-2xl p-5 mb-5 border items-center"
      >
        {/* Formula label */}
        <View className="flex-row items-center gap-2 mb-3">
          <View
            style={{ width: 4, height: 20, borderRadius: 9999, backgroundColor: pcReady ? colors.accent : colors.cardBorder }}
          />
          <Text style={{ color: colors.textMuted }} className="text-xs font-bold tracking-widest uppercase">
            Plan de Comparaison
          </Text>
        </View>

        {/* Formula */}
        <Text style={{ color: colors.textDim }} className="text-xs font-semibold tracking-wider mb-2 uppercase">
          P.C. = ALT (Z) + LAR
        </Text>

        {/* Big value */}
        <Text
          style={{ color: pcReady ? colors.accent : colors.textDim }}
          className="font-black text-5xl tracking-tight"
        >
          {pcReady ? `${pc!.toFixed(3)}` : '---'}
        </Text>
        {pcReady && (
          <Text style={{ color: colors.accent }} className="text-xs font-semibold mt-1">mètres NGT</Text>
        )}

        {/* Helper text */}
        <Text
          style={{ color: pcReady ? colors.textMuted : colors.textDim }}
          className="text-xs text-center mt-3 px-4"
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
          <Button.Label style={{ color: colors.text }} className="font-bold">← Retour</Button.Label>
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

      <Button
        variant="outline"
        size="md"
        onPress={() => router.push('/pdf-preview' as Href)}
        className="mt-3"
      >
        <Text className="mr-2 text-base">👁️</Text>
        <Button.Label className="font-bold" style={{ color: colors.textMuted }}>Aperçu PDF</Button.Label>
      </Button>
    </KeyboardAwareScrollView>
  );
}
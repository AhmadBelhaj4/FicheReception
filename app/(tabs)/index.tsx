import React, { useState } from 'react';
import {
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, Href } from 'expo-router';
import { Button, Input, Label, TextField } from 'heroui-native';

import { useProjectStore } from '../../src/store/useProjectStore';
import { StepBadge } from '../../components/ui/StepBadge';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { FieldCard } from '../../components/ui/FieldCard';
import { parseLocalISODate, toLocalISODate } from '../../src/utils/date';
import { DEFAULT_INSTITUTION } from '../../src/utils/fichePdf';

const INSTITUTION_LABELS = [
  'Ligne 1 (petite)',
  'Ligne 2 (petite)',
  'Ligne 3 (grande)',
  'Ligne 4 (grande)',
];

export default function HeaderScreen() {
  const router = useRouter();
  const [showPicker, setShowPicker] = useState(false);
  const {
    receptionNumber,
    vNumber,
    institutionLines,
    date,
    typeIntervention,
    setHeader,
  } = useProjectStore();

  const handleNext = () => {
    router.push('/reference' as Href);
  };

  const currentDateObj = (date && parseLocalISODate(date)) || new Date();

  const formattedDate = date && parseLocalISODate(date)
    ? currentDateObj.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
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
        <StepBadge current={1} total={4} />
        <ScreenHeader
          title="Fiche de Réception"
          subtitle="Informations générales du chantier"
        />

        {/* ─── Identification card ─── */}
        <FieldCard>
          {/* Section label */}
          <View className="flex-row items-center gap-2 mb-4">
            <View className="w-1 h-5 bg-amber-400 rounded-full" />
            <Text className="text-xs font-bold text-slate-400 tracking-widest uppercase">
              Identification
            </Text>
          </View>

          {/* Réception N° */}
          <TextField className="mb-4">
            <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Réception N°
            </Label>
            <Input
              className="bg-slate-700 border-slate-600 text-slate-50 rounded-xl h-13"
              placeholder="Ex : 01/2024"
              placeholderTextColor="#64748b"
              value={receptionNumber}
              onChangeText={(t) => setHeader({ receptionNumber: t })}
              returnKeyType="next"
            />
          </TextField>

          {/* V */}
          <TextField className="mb-4">
            <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              V
            </Label>
            <Input
              className="bg-slate-700 border-slate-600 text-slate-50 rounded-xl h-13"
              placeholder="Ex : 02"
              placeholderTextColor="#64748b"
              value={vNumber}
              onChangeText={(t) => setHeader({ vNumber: t })}
              returnKeyType="done"
            />
          </TextField>

          {/* Date de réception */}
          <View className="mb-1">
            <Text className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Date de réception
            </Text>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setShowPicker(true)}
              className="bg-slate-700 border border-slate-600 rounded-xl px-4 justify-center"
              style={{ height: 52 }}
            >
              <View className="flex-row items-center justify-between">
                <Text
                  className={
                    formattedDate
                      ? 'text-slate-50 text-base font-medium'
                      : 'text-slate-500 text-base'
                  }
                >
                  {formattedDate ?? 'Sélectionner la date'}
                </Text>
                {/* Calendar icon (text-based) */}
                <Text className="text-amber-400 text-lg">📅</Text>
              </View>
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={isNaN(currentDateObj.getTime()) ? new Date() : currentDateObj}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowPicker(Platform.OS === 'ios');
                  if (selectedDate) {
                    const iso = toLocalISODate(selectedDate);
                    setHeader({ date: iso });
                  }
                }}
              />
            )}
          </View>
        </FieldCard>

        {/* ─── Type d'intervention card ─── */}
        <FieldCard>
          <View className="flex-row items-center gap-2 mb-4">
            <View className="w-1 h-5 bg-amber-400 rounded-full" />
            <Text className="text-xs font-bold text-slate-400 tracking-widest uppercase">
              {"Type d'intervention"}
            </Text>
          </View>

          <TextField>
            <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Voirie projetée
            </Label>
            <Input
              className="bg-slate-700 border-slate-600 text-slate-50 rounded-xl"
              multiline
              numberOfLines={4}
              value={typeIntervention}
              onChangeText={(t) => setHeader({ typeIntervention: t })}
              placeholder="Ex : Pose de bordures T2, Décaissement et Réglage..."
              placeholderTextColor="#64748b"
              textAlignVertical="top"
              style={{ minHeight: 96, paddingTop: 12 }}
            />
          </TextField>
        </FieldCard>

        {/* ─── En-tête officiel (bloc entre les logos) ─── */}
        <FieldCard>
          <View className="flex-row items-center gap-2 mb-1">
            <View className="w-1 h-5 bg-amber-400 rounded-full" />
            <Text className="text-xs font-bold text-slate-400 tracking-widest uppercase">
              En-tête du document
            </Text>
          </View>
          <Text className="text-slate-500 text-xs mb-4 leading-relaxed">
            Texte du cadre central entre les logos. Pré-rempli avec l’en-tête ENNOUR, modifiable pour chaque fiche.
          </Text>

          {INSTITUTION_LABELS.map((label, i) => (
            <TextField key={label} className="mb-3">
              <Label className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                {label}
              </Label>
              <Input
                className="bg-slate-700 border-slate-600 text-slate-50 rounded-xl h-13"
                value={institutionLines[i]}
                autoCapitalize="characters"
                onChangeText={(t) => {
                  const next = [...institutionLines] as typeof institutionLines;
                  next[i] = t;
                  setHeader({ institutionLines: next });
                }}
                returnKeyType={i === 3 ? 'done' : 'next'}
              />
            </TextField>
          ))}

          <Button
            variant="outline"
            size="sm"
            onPress={() =>
              setHeader({ institutionLines: [...DEFAULT_INSTITUTION] as typeof institutionLines })
            }
          >
            <Button.Label className="font-bold text-xs text-slate-300">
              Rétablir l’en-tête ENNOUR
            </Button.Label>
          </Button>
        </FieldCard>

        {/* ─── CTA ─── */}
        <Button
          variant="primary"
          size="lg"
          feedbackVariant="scale-ripple"
          onPress={handleNext}
          className="mt-1"
        >
          <Button.Label className="font-bold tracking-wide">
            Suivant : Repère de Référence
          </Button.Label>
          <Text className="text-white text-lg ml-1">→</Text>
        </Button>

        {/* ── Bottom links row ── */}
        <View className="flex-row gap-3 mt-3">
          <Button
            variant="outline"
            size="md"
            onPress={() => router.push('/projects' as Href)}
            className="flex-1"
          >
            <Text className="mr-2 text-base">🏗️</Text>
            <Button.Label className="font-bold text-slate-300">Chantiers</Button.Label>
          </Button>
          <Button
            variant="outline"
            size="md"
            onPress={() => router.push('/settings' as Href)}
            className="flex-1"
          >
            <Text className="mr-2 text-base">⚙️</Text>
            <Button.Label className="font-bold text-slate-300">Paramètres</Button.Label>
          </Button>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

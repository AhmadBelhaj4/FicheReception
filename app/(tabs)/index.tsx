import React, { useEffect, useRef, useState } from 'react';
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
import { Button, Input, TextField } from 'heroui-native';

import { useProjectStore } from '../../src/store/useProjectStore';
import { useProjectsStore } from '../../src/store/useProjectsStore';
import { useAppTheme } from '../../src/hooks/useAppTheme';
import { StepBadge } from '../../components/ui/StepBadge';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { FieldCard } from '../../components/ui/FieldCard';
import { parseLocalISODate, toLocalISODate } from '../../src/utils/date';
import { DEFAULT_INSTITUTION } from '../../src/utils/fichePdf';

const INSTITUTION_FIELDS = [
  {
    label: 'République',
    placeholder: 'Ex : République Tunisienne',
    returnKeyType: 'next' as const,
  },
  {
    label: 'Agence',
    placeholder: "Ex : Nom de l'agence",
    returnKeyType: 'next' as const,
  },
  {
    label: 'Nature des travaux',
    placeholder: 'Ex : Description des travaux',
    returnKeyType: 'next' as const,
  },
  {
    label: 'Localisation',
    placeholder: 'Dans la commune de …',
    returnKeyType: 'done' as const,
  },
];

export default function HeaderScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const [showPicker, setShowPicker] = useState(false);
  const {
    receptionNumber,
    vNumber,
    institutionLines,
    date,
    typeIntervention,
    setHeader,
  } = useProjectStore();

  const { projects, activeProjectId } = useProjectsStore();
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  const hasRunStartup = useRef(false);

  useEffect(() => {
    if (hasRunStartup.current) return;
    hasRunStartup.current = true;

    const projectState = useProjectStore.getState();
    const projectsState = useProjectsStore.getState();

    const hasContent =
      !!projectState.receptionNumber ||
      !!projectState.repere ||
      (projectState.profiles?.length ?? 0) > 0;

    const activeId = projectsState.activeProjectId;
    const isAlreadySaved =
      activeId !== null &&
      projectsState.projects.some((p) => p.id === activeId);

    if (!isAlreadySaved) {
      if (hasContent) {
        // Auto-sauvegarder en "Non terminé"
        projectsState.saveOrUpdateProject({
          id: null, // force création d'un nouveau
          name: 'Non terminé',
          status: 'En cours',
          receptionNumber: projectState.receptionNumber,
          vNumber: projectState.vNumber,
          date: projectState.date,
          typeIntervention: projectState.typeIntervention,
          institutionLines: projectState.institutionLines,
          repere: projectState.repere,
          alt: projectState.alt,
          lectureArriere: projectState.lectureArriere,
          pc: projectState.pc,
          profiles: projectState.profiles,
          logoClient: projectState.logoClient,
          logoEntreprise: projectState.logoEntreprise,
          logoBureau: projectState.logoBureau,
        });
      }

      // Toujours réinitialiser pour démarrer sur une ardoise vierge
      projectState.resetProject();
      // Effacer l'activeProjectId pour ne pas rouvrir le dernier chantier
      useProjectsStore.setState({ activeProjectId: null });
    }
  }, []);

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

  const inputClass = isDark
    ? 'bg-slate-700 border-slate-600 text-slate-50'
    : 'bg-slate-100 border-slate-300 text-slate-900';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
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

        {activeProject && (
          <View
            style={{
              backgroundColor: colors.accentBorder ?? 'rgba(245,158,11,0.15)',
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 6,
              marginBottom: 12,
              alignSelf: 'flex-start',
            }}
          >
            <Text style={{ color: colors.accent }} className="text-xs font-bold">
              📂 {activeProject.name}
            </Text>
          </View>
        )}

        {/* ─── Identification card ─── */}
        <FieldCard>
          {/* Section label */}
          <View className="flex-row items-center gap-2 mb-4">
            <View className="w-1 h-5 bg-amber-400 rounded-full" />
            <Text style={{ color: colors.textMuted }} className="text-xs font-bold tracking-widest uppercase">
              Identification
            </Text>
          </View>

          {/* Réception N° */}
          <TextField className="mb-4">
            <Text style={{ color: colors.textMuted }} className="text-xs font-bold uppercase tracking-wider mb-1.5">
              Réception N°
            </Text>
            <Input
              className={`${inputClass} rounded-xl h-13`}
              placeholderTextColor={colors.textDim}
              value={receptionNumber}
              onChangeText={(t) => setHeader({ receptionNumber: t })}
              returnKeyType="next"
            />
          </TextField>

          {/* Voie */}
          <TextField className="mb-4">
            <Text style={{ color: colors.textMuted }} className="text-xs font-bold uppercase tracking-wider mb-1.5">
              Voie
            </Text>
            <Input
              className={`${inputClass} rounded-xl h-13`}
              placeholderTextColor={colors.textDim}
              value={vNumber}
              onChangeText={(t) => setHeader({ vNumber: t })}
              returnKeyType="done"
            />
          </TextField>

          {/* Date de réception */}
          <View className="mb-1">
            <Text style={{ color: colors.textMuted }} className="text-xs font-bold uppercase tracking-wider mb-1.5">
              Date de réception
            </Text>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => setShowPicker(true)}
              style={{
                height: 52,
                backgroundColor: colors.inputBg,
                borderColor: colors.inputBorder,
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 16,
                justifyContent: 'center',
              }}
            >
              <View className="flex-row items-center justify-between">
                <Text
                  style={{
                    color: formattedDate ? colors.text : colors.textDim,
                    fontSize: 16,
                    fontWeight: '500',
                  }}
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
            <Text style={{ color: colors.textMuted }} className="text-xs font-bold tracking-widest uppercase">
              {"Type d'intervention"}
            </Text>
          </View>

          <TextField>
            <Text style={{ color: colors.textMuted }} className="text-xs font-bold uppercase tracking-wider mb-1.5">
              Voirie projetée
            </Text>
            <Input
              className={`${inputClass} rounded-xl`}
              multiline
              numberOfLines={4}
              value={typeIntervention}
              onChangeText={(t) => setHeader({ typeIntervention: t })}
              placeholder="Ex : Pose de bordures T2, Décaissement et Réglage..."
              placeholderTextColor={colors.textDim}
              textAlignVertical="top"
              style={{ minHeight: 96, paddingTop: 12 }}
            />
          </TextField>
        </FieldCard>

        {/* ─── En-tête officiel (bloc entre les logos) ─── */}
        <FieldCard>
          <View className="flex-row items-center gap-2 mb-1">
            <View className="w-1 h-5 bg-amber-400 rounded-full" />
            <Text style={{ color: colors.textMuted }} className="text-xs font-bold tracking-widest uppercase">
              En-tête du document
            </Text>
          </View>
          <Text style={{ color: colors.textDim }} className="text-xs mb-4 leading-relaxed">
            Texte du cadre central entre les logos..
          </Text>

          {INSTITUTION_FIELDS.map((field, i) => (
            <TextField key={field.label} className="mb-3">
              <Text style={{ color: colors.textMuted }} className="text-xs font-bold uppercase tracking-wider mb-1.5">
                {field.label}
              </Text>
              <Input
                className={`${inputClass} rounded-xl h-13`}
                value={institutionLines[i]}
                placeholder={field.placeholder}
                placeholderTextColor={colors.textDim}
                autoCapitalize="characters"
                onChangeText={(t) => {
                  const next = [...institutionLines] as typeof institutionLines;
                  next[i] = t;
                  setHeader({ institutionLines: next });
                }}
                returnKeyType={field.returnKeyType}
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
            <Button.Label style={{ color: colors.textMuted }} className="font-bold text-xs">
              {"Réinitialiser l'en-tête"}
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
        <View className="flex-row gap-2 mt-3">
          <Button
            variant="outline"
            size="md"
            onPress={() => router.push('/pdf-preview' as Href)}
            className="flex-1"
          >
            <Text className="mr-1 text-base">👁️</Text>
            <Button.Label className="font-bold text-xs" style={{ color: colors.textMuted }}>Aperçu PDF</Button.Label>
          </Button>
          <Button
            variant="outline"
            size="md"
            onPress={() => router.push('/projects' as Href)}
            className="flex-1"
          >
            <Text className="mr-1 text-base">🏗️</Text>
            <Button.Label className="font-bold text-xs" style={{ color: colors.textMuted }}>Chantiers</Button.Label>
          </Button>
          <Button
            variant="outline"
            size="md"
            onPress={() => router.push('/settings' as Href)}
            className="flex-1"
          >
            <Text className="mr-1 text-base">⚙️</Text>
            <Button.Label className="font-bold text-xs" style={{ color: colors.textMuted }}>Paramètres</Button.Label>
          </Button>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

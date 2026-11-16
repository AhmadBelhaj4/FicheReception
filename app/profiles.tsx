import React from 'react';
import {
  Alert,
  FlatList,
  Text,
  View,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import { Button } from 'heroui-native';

import { useProjectStore } from '../src/store/useProjectStore';
import { useAppTheme } from '../src/hooks/useAppTheme';
import {
  calculateCotePratique,
  calculateDifference,
} from '../src/utils/calculations';
import { ProfileData } from '../src/types';
import { StepBadge } from '../components/ui/StepBadge';

export default function ProfilesListScreen() {
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const { profiles, pc, repere, addProfile, deleteProfile, duplicateProfile } = useProjectStore();

  const handleAddProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newId = Crypto.randomUUID();
    const newProfile: ProfileData = {
      id: newId,
      d1: null,
      d2: null,
      axe: null,
      g1: null,
      g2: null,
      coteProjet: null,
      distance: null,
      devers: null,
      observation: '',
    };
    addProfile(newProfile);
    router.push({
      pathname: '/profile-edit',
      params: { id: newId },
    } as unknown as Href);
  };

  const handleDuplicateProfile = (id: string) => {
    duplicateProfile(id);
  };

  const handleEditProfile = (id: string) => {
    router.push({
      pathname: '/profile-edit',
      params: { id },
    } as unknown as Href);
  };

  const handleDeleteProfile = (id: string, index: number) => {
    Alert.alert(
      'Supprimer le profil',
      `Êtes-vous sûr de vouloir supprimer le profil N° ${index + 1} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteProfile(id),
        },
      ]
    );
  };

  const renderProfileItem = ({
    item,
    index,
  }: {
    item: ProfileData;
    index: number;
  }) => {
    // Calculate difference for Axe if available
    let diffAxe: number | null = null;
    if (pc !== null && item.axe !== null && item.coteProjet !== null) {
      const cotePratiqueAxe = calculateCotePratique(pc, item.axe);
      diffAxe = calculateDifference(item.coteProjet, cotePratiqueAxe);
    }

    const isRemblai = diffAxe !== null && diffAxe > 0;
    const isDeblai  = diffAxe !== null && diffAxe < 0;

    const diffLabel =
      diffAxe === null
        ? 'Non calculé'
        : isRemblai
        ? `Remblai  +${diffAxe.toFixed(3)} m`
        : isDeblai
        ? `Déblai  ${diffAxe.toFixed(3)} m`
        : 'Conforme  0.000 m';

    const badgeStyle = {
      backgroundColor: diffAxe === null
        ? (isDark ? '#334155' : '#e2e8f0')
        : isRemblai
        ? (isDark ? '#064e3b' : '#d1fae5')
        : isDeblai
        ? (isDark ? '#7f1d1d' : '#fee2e2')
        : (isDark ? '#334155' : '#e2e8f0'),
    };
    const badgeTextColor = diffAxe === null
      ? colors.textMuted
      : isRemblai ? colors.success
      : isDeblai ? colors.danger
      : colors.textMuted;
    const diffValueColor = diffAxe === null
      ? colors.textDim
      : isRemblai ? colors.success
      : isDeblai ? colors.danger
      : colors.textMuted;

    return (
      <View
        style={{ backgroundColor: colors.card, borderColor: colors.cardBorder }}
        className="rounded-2xl p-4 mb-3 border"
      >
        {/* Card header row */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="bg-amber-400 rounded-lg px-3 py-1">
            <Text className="text-slate-900 text-xs font-black tracking-widest uppercase">
              Profil N° {index + 1}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onPress={() => handleEditProfile(item.id)}
            >
              <Button.Label style={{ color: colors.text }} className="font-bold">Modifier</Button.Label>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => handleDuplicateProfile(item.id)}
            >
              <Button.Label style={{ color: colors.accent }} className="font-bold">Dupliquer</Button.Label>
            </Button>
            <Button
              variant="danger-soft"
              size="sm"
              isIconOnly
              onPress={() => handleDeleteProfile(item.id, index)}
            >
              <Text style={{ color: colors.danger }} className="font-bold text-sm">✕</Text>
            </Button>
          </View>
        </View>

        {/* Metrics row */}
        <View style={{ backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }} className="flex-row rounded-xl p-3 mb-3">
          <View className="flex-1 items-center">
            <Text style={{ color: colors.textDim }} className="text-xs font-bold uppercase tracking-wider mb-1">
              Lec. Axe
            </Text>
            <Text style={{ color: colors.text }} className="text-sm font-bold">
              {item.axe !== null ? `${item.axe.toFixed(3)} m` : '–'}
            </Text>
          </View>
          <View style={{ backgroundColor: colors.cardBorder }} className="w-px mx-1" />
          <View className="flex-1 items-center">
            <Text style={{ color: colors.textDim }} className="text-xs font-bold uppercase tracking-wider mb-1">
              Cote Projet
            </Text>
            <Text style={{ color: colors.text }} className="text-sm font-bold">
              {item.coteProjet !== null ? `${item.coteProjet.toFixed(3)} m` : '–'}
            </Text>
          </View>
          <View style={{ backgroundColor: colors.cardBorder }} className="w-px mx-1" />
          <View className="flex-1 items-center">
            <Text style={{ color: colors.textDim }} className="text-xs font-bold uppercase tracking-wider mb-1">
              Diff. Axe
            </Text>
            <Text style={{ color: diffValueColor }} className="text-sm font-black">
              {diffAxe !== null
                ? isRemblai
                  ? `+${diffAxe.toFixed(3)}`
                  : diffAxe.toFixed(3)
                : '–'}
            </Text>
          </View>
        </View>

        {/* Status pill + obs */}
        <View className="flex-row items-center justify-between">
          <View style={badgeStyle} className="rounded-lg px-3 py-1.5">
            <Text style={{ color: badgeTextColor }} className="text-xs font-bold">{diffLabel}</Text>
          </View>
          {item.observation ? (
            <Text style={{ color: colors.textMuted }} className="text-xs italic max-w-[45%]" numberOfLines={1}>
              {item.observation}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* ── Sticky header ── */}
      <View style={{ borderBottomColor: colors.cardBorder }} className="px-5 pt-5 pb-3 border-b">
        <View className="flex-row items-center justify-between mb-2">
          <StepBadge current={3} total={4} />
          {/* P.C. context pill */}
          <View style={{ backgroundColor: colors.card, borderColor: colors.accentBorder }} className="border rounded-lg px-3 py-1">
            <Text style={{ color: colors.accent }} className="text-xs font-bold">
              P.C.{' '}
              {pc !== null ? `${pc.toFixed(3)} m` : '–'}
            </Text>
          </View>
        </View>
        <Text style={{ color: colors.text }} className="text-xl font-black tracking-tight">
          Profils en Travers
        </Text>
        <Text style={{ color: colors.textMuted }} className="text-sm mt-0.5">
          {profiles.length === 0
            ? 'Ajoutez les profils relevés sur le terrain.'
            : `${profiles.length} profil(s) enregistré(s)${repere ? `  ·  Repère : ${repere}` : ''}`}
        </Text>
      </View>

      {/* ── Add Profile button ── */}
      <View className="px-5 py-3">
        <Button
          variant="primary"
          size="lg"
          feedbackVariant="scale-ripple"
          onPress={handleAddProfile}
        >
          <Text className="text-white text-xl font-black mr-1">+</Text>
          <Button.Label className="font-bold tracking-wide">
            Ajouter un Profil
          </Button.Label>
        </Button>
      </View>

      {/* ── List or empty state ── */}
      {profiles.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Text className="text-5xl mb-4">📐</Text>
          <Text style={{ color: colors.text }} className="text-lg font-black text-center mb-2">
            Aucun profil enregistré
          </Text>
          <Text style={{ color: colors.textMuted }} className="text-sm text-center leading-relaxed">
            Appuyez sur le bouton ci-dessus pour saisir les lectures avant (D2, D1, Axe, G1, G2) et cotes projets.
          </Text>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.id}
          renderItem={renderProfileItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Footer nav ── */}
      <View style={{ borderTopColor: colors.cardBorder, backgroundColor: colors.card }} className="flex-row gap-2 px-4 py-4 border-t">
        <Button
          variant="outline"
          size="lg"
          onPress={() => router.back()}
          className="flex-none px-4"
        >
          <Button.Label style={{ color: colors.text }} className="font-bold">← Retour</Button.Label>
        </Button>

        <Button
          variant="outline"
          size="lg"
          onPress={() => router.push('/pdf-preview' as Href)}
          className="flex-1"
        >
          <Text className="mr-1 text-base">👁️</Text>
          <Button.Label className="font-bold text-xs" style={{ color: colors.textMuted }}>Aperçu PDF</Button.Label>
        </Button>

        <Button
          variant="primary"
          size="lg"
          feedbackVariant="scale-ripple"
          isDisabled={profiles.length === 0}
          onPress={() => router.push('/preview' as Href)}
          className="flex-1"
        >
          <Button.Label className="font-bold tracking-wide text-xs">
            Finaliser
          </Button.Label>
          <Text className="text-white text-base ml-0.5">→</Text>
        </Button>
      </View>
    </View>
  );
}
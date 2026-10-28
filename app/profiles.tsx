import React from 'react';
import {
  Alert,
  FlatList,
  Text,
  View,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { Button } from 'heroui-native';

import { useProjectStore } from '../src/store/useProjectStore';
import {
  calculateCotePratique,
  calculateDifference,
} from '../src/utils/calculations';
import { ProfileData } from '../src/types';
import { StepBadge } from '../components/ui/StepBadge';

export default function ProfilesListScreen() {
  const router = useRouter();
  const { profiles, pc, repere, addProfile, deleteProfile } = useProjectStore();

  const handleAddProfile = () => {
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

    const badgeBg = diffAxe === null
      ? 'bg-slate-700'
      : isRemblai
      ? 'bg-emerald-900'
      : isDeblai
      ? 'bg-red-900'
      : 'bg-slate-700';

    const badgeText = diffAxe === null
      ? 'text-slate-400'
      : isRemblai
      ? 'text-emerald-300'
      : isDeblai
      ? 'text-red-300'
      : 'text-slate-300';

    const diffValueColor = diffAxe === null
      ? 'text-slate-500'
      : isRemblai
      ? 'text-emerald-400'
      : isDeblai
      ? 'text-red-400'
      : 'text-slate-400';

    return (
      <View className="bg-slate-800 rounded-2xl p-4 mb-3 border border-slate-700">
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
              <Button.Label className="font-bold">Modifier</Button.Label>
            </Button>
            <Button
              variant="danger-soft"
              size="sm"
              isIconOnly
              onPress={() => handleDeleteProfile(item.id, index)}
            >
              <Text className="text-red-400 font-bold text-sm">✕</Text>
            </Button>
          </View>
        </View>

        {/* Metrics row */}
        <View className="flex-row bg-slate-900 rounded-xl p-3 mb-3">
          <View className="flex-1 items-center">
            <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              Lec. Axe
            </Text>
            <Text className="text-slate-200 text-sm font-bold">
              {item.axe !== null ? `${item.axe.toFixed(3)} m` : '–'}
            </Text>
          </View>
          <View className="w-px bg-slate-700 mx-1" />
          <View className="flex-1 items-center">
            <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              Cote Projet
            </Text>
            <Text className="text-slate-200 text-sm font-bold">
              {item.coteProjet !== null ? `${item.coteProjet.toFixed(3)} m` : '–'}
            </Text>
          </View>
          <View className="w-px bg-slate-700 mx-1" />
          <View className="flex-1 items-center">
            <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
              Diff. Axe
            </Text>
            <Text className={`text-sm font-black ${diffValueColor}`}>
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
          <View className={`${badgeBg} rounded-lg px-3 py-1.5`}>
            <Text className={`${badgeText} text-xs font-bold`}>{diffLabel}</Text>
          </View>
          {item.observation ? (
            <Text className="text-slate-500 text-xs italic max-w-[45%]" numberOfLines={1}>
              {item.observation}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      {/* ── Sticky header ── */}
      <View className="px-5 pt-5 pb-3 border-b border-slate-800">
        <View className="flex-row items-center justify-between mb-2">
          <StepBadge current={3} total={4} />
          {/* P.C. context pill */}
          <View className="bg-slate-800 border border-amber-400/40 rounded-lg px-3 py-1">
            <Text className="text-amber-400 text-xs font-bold">
              P.C.{' '}
              {pc !== null ? `${pc.toFixed(3)} m` : '–'}
            </Text>
          </View>
        </View>
        <Text className="text-xl font-black text-slate-50 tracking-tight">
          Profils en Travers
        </Text>
        <Text className="text-slate-400 text-sm mt-0.5">
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
          <Text className="text-slate-200 text-lg font-black text-center mb-2">
            Aucun profil enregistré
          </Text>
          <Text className="text-slate-500 text-sm text-center leading-relaxed">
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
      <View className="flex-row gap-3 px-5 py-4 border-t border-slate-800 bg-slate-900">
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
          isDisabled={profiles.length === 0}
          onPress={() => router.push('/preview' as Href)}
          className="flex-1"
        >
          <Button.Label className="font-bold tracking-wide">
            Export PDF
          </Button.Label>
          <Text className="text-white text-lg ml-1">→</Text>
        </Button>
      </View>
    </View>
  );
}
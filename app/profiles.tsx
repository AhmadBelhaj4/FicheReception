import React from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Href } from 'expo-router';
import * as Crypto from 'expo-crypto';
import { useProjectStore } from '../src/store/useProjectStore';
import {
  calculateCotePratique,
  calculateDifference,
} from '../src/utils/calculations';
import { ProfileData } from '../src/types';

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

    const diffBadgeColor =
      diffAxe === null
        ? '#94a3b8'
        : diffAxe > 0
        ? '#16a34a' // Remblai
        : diffAxe < 0
        ? '#dc2626' // Déblai
        : '#475569';

    const diffLabel =
      diffAxe === null
        ? 'Non calculé'
        : diffAxe > 0
        ? `Remblai (+${diffAxe.toFixed(3)} m)`
        : diffAxe < 0
        ? `Déblai (${diffAxe.toFixed(3)} m)`
        : 'Égalité (0.000 m)';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.profileBadge}>
            <Text style={styles.profileBadgeText}>PROFIL N° {index + 1}</Text>
          </View>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              activeOpacity={0.7}
              onPress={() => handleEditProfile(item.id)}>
              <Text style={styles.editButtonText}>Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              activeOpacity={0.7}
              onPress={() => handleDeleteProfile(item.id, index)}>
              <Text style={styles.deleteButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick summary metrics */}
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>LECTURE AXE</Text>
            <Text style={styles.metricValue}>
              {item.axe !== null ? `${item.axe.toFixed(3)} m` : '-'}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>COTE PROJET</Text>
            <Text style={styles.metricValue}>
              {item.coteProjet !== null
                ? `${item.coteProjet.toFixed(3)} m`
                : '-'}
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>DIFF. AXE</Text>
            <Text
              style={[
                styles.metricValue,
                { color: diffBadgeColor, fontWeight: '800' },
              ]}>
              {diffAxe !== null
                ? diffAxe > 0
                  ? `+${diffAxe.toFixed(3)}`
                  : diffAxe.toFixed(3)
                : '-'}
            </Text>
          </View>
        </View>

        {/* Status pill & observation */}
        <View style={styles.cardFooter}>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: diffBadgeColor + '18' },
            ]}>
            <Text style={[styles.statusPillText, { color: diffBadgeColor }]}>
              {diffLabel}
            </Text>
          </View>
          {item.observation ? (
            <Text style={styles.obsText} numberOfLines={1}>
              Obs : {item.observation}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header section with context */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>ÉTAPE 3 / 4</Text>
          </View>
          <View style={styles.infoPill}>
            <Text style={styles.infoPillText}>
              {repere ? `Repère: ${repere}` : 'Repère'} | P.C.:{' '}
              {pc !== null ? `${pc.toFixed(3)} m` : '-'}
            </Text>
          </View>
        </View>
        <Text style={styles.title}>Profils en Travers</Text>
        <Text style={styles.subtitle}>
          {profiles.length === 0
            ? 'Commencez par ajouter les profils relevés sur le terrain.'
            : `${profiles.length} profil(s) enregistré(s)`}
        </Text>
      </View>

      {/* Add Profile Button */}
      <View style={styles.addBar}>
        <TouchableOpacity
          style={styles.addButton}
          activeOpacity={0.85}
          onPress={handleAddProfile}>
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>Ajouter un Profil</Text>
        </TouchableOpacity>
      </View>

      {/* Profile list or empty state */}
      {profiles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📐</Text>
          <Text style={styles.emptyTitle}>Aucun profil enregistré</Text>
          <Text style={styles.emptyDescription}>
            Appuyez sur le bouton « + Ajouter un Profil » ci-dessus pour saisir les
            lectures avant (D2, D1, Axe, G1, G2) et cotes projets.
          </Text>
        </View>
      ) : (
        <FlatList
          data={profiles}
          keyExtractor={(item) => item.id}
          renderItem={renderProfileItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Bottom navigation buttons */}
      <View style={styles.footerBar}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.8}
          onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.generateButton,
            profiles.length === 0 && styles.generateButtonDisabled,
          ]}
          activeOpacity={0.85}
          disabled={profiles.length === 0}
          onPress={() => router.push('/preview' as Href)}>
          <Text style={styles.generateButtonText}>
            Aperçu & Export PDF (Étape 4) →
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1a365d',
    letterSpacing: 0.5,
  },
  infoPill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  infoPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e40af',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a365d',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  addBar: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#1a365d',
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#1a365d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  addButtonIcon: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginRight: 8,
    lineHeight: 22,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  profileBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  editButtonText: {
    color: '#1d4ed8',
    fontSize: 13,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#fee2e2',
    width: 30,
    height: 30,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '800',
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  obsText: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
    maxWidth: '50%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a365d',
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  footerBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  backButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  generateButton: {
    flex: 1,
    backgroundColor: '#1a365d',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#1a365d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  generateButtonDisabled: {
    backgroundColor: '#94a3b8',
    elevation: 0,
    shadowOpacity: 0,
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
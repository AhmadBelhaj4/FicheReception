// app/projects.tsx
// "Mes Chantiers" — project list dashboard for multi-project management.
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as DocumentPicker from 'expo-document-picker';
import { Button } from 'heroui-native';

import { useProjectsStore } from '../src/store/useProjectsStore';
import { useProjectStore } from '../src/store/useProjectStore';
import { SavedProject, ProjectStatus } from '../src/types';

/** Status pill colors */
const STATUS_COLORS: Record<ProjectStatus, { bg: string; text: string }> = {
  'En cours': { bg: '#065f46', text: '#6ee7b7' },
  'Validé':   { bg: '#1e3a5f', text: '#93c5fd' },
  'Archivé':  { bg: '#374151', text: '#9ca3af' },
};

export default function ProjectsScreen() {
  const router = useRouter();
  const { projects, createProject, openProject, deleteProject, archiveProject } =
    useProjectsStore();
  const { setHeader, setReference, addProfile, resetProject } = useProjectStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  /** Load a saved project into the active working store, then navigate home. */
  const handleOpenProject = (proj: SavedProject) => {
    openProject(proj.id);
    // Hydrate the active project store with saved data
    resetProject();
    setHeader({
      receptionNumber: proj.receptionNumber,
      vNumber: proj.vNumber,
      pNumber: proj.pNumber,
      date: proj.date,
      typeIntervention: proj.typeIntervention,
    });
    setReference({
      repere: proj.repere,
      alt: proj.alt ?? undefined,
      lectureArriere: proj.lectureArriere ?? undefined,
    });
    // Re-add each profile
    proj.profiles.forEach((p) => addProfile(p));
    router.replace('/(tabs)');
  };

  const handleCreateProject = () => {
    const name = newProjectName.trim();
    if (!name) return;
    createProject(name);
    setModalVisible(false);
    setNewProjectName('');
    // Start fresh with the new project in the active store
    resetProject();
    router.replace('/(tabs)');
  };

  const handleDeleteProject = (id: string, name: string) => {
    Alert.alert(
      'Supprimer le chantier',
      `Supprimer définitivement "${name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteProject(id),
        },
      ]
    );
  };

  const handleArchiveProject = (id: string) => {
    archiveProject(id);
  };

  const handleExportBackup = async () => {
    try {
      const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        projects: projects,
      };
      const json = JSON.stringify(backup, null, 2);
      const fileName = `fiche-reception-backup-${Date.now()}.json`;
      const destUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(destUri, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(destUri, {
          mimeType: 'application/json',
          dialogTitle: 'Sauvegarder les chantiers',
          UTI: 'public.json',
        });
      } else {
        Alert.alert('Sauvegarde', `Fichier enregistré :\n${destUri}`);
      }
    } catch (e) {
      Alert.alert('Erreur', 'Sauvegarde échouée : ' + String(e));
    }
  };

  const handleImportBackup = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const uri = result.assets[0].uri;
      const raw = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      const backup = JSON.parse(raw);
      if (!Array.isArray(backup?.projects)) {
        Alert.alert('Erreur', 'Fichier de sauvegarde invalide.');
        return;
      }
      Alert.alert(
        'Importer la sauvegarde',
        `${backup.projects.length} chantier(s) trouvé(s). Les importer ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Importer',
            onPress: () => {
              backup.projects.forEach((p: SavedProject) => {
                const existing = projects.find((ex) => ex.id === p.id);
                if (!existing) {
                  useProjectsStore.setState((s) => ({ projects: [...s.projects, p] }));
                }
              });
              Alert.alert('Import réussi', `${backup.projects.length} chantier(s) importé(s).`);
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert('Erreur', 'Import échoué : ' + String(e));
    }
  };

  const renderItem = ({ item }: { item: SavedProject }) => {
    const colors = STATUS_COLORS[item.status];
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => handleOpenProject(item)}
        className="bg-slate-800 rounded-2xl p-4 mb-3 border border-slate-700"
      >
        {/* Row 1: name + status */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-slate-50 font-black text-base flex-1 mr-2" numberOfLines={1}>
            {item.name}
          </Text>
          <View style={{ backgroundColor: colors.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ color: colors.text, fontSize: 10, fontWeight: '700' }}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Row 2: reception number + profile count + date */}
        <View className="flex-row gap-4 mb-3">
          {item.receptionNumber ? (
            <Text className="text-slate-400 text-xs">
              N° <Text className="text-slate-200 font-bold">{item.receptionNumber}</Text>
            </Text>
          ) : (
            <Text className="text-slate-600 text-xs italic">Numéro non défini</Text>
          )}
          <Text className="text-slate-400 text-xs">
            <Text className="text-amber-400 font-bold">{item.profiles.length}</Text> profil(s)
          </Text>
          <Text className="text-slate-500 text-xs">{item.date}</Text>
        </View>

        {/* Row 3: action buttons */}
        <View className="flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onPress={() => handleOpenProject(item)}
            className="flex-1"
          >
            <Button.Label className="font-bold text-xs">Ouvrir</Button.Label>
          </Button>
          {item.status !== 'Archivé' && (
            <Button
              variant="outline"
              size="sm"
              onPress={() => handleArchiveProject(item.id)}
            >
              <Button.Label className="font-bold text-xs text-slate-400">Archiver</Button.Label>
            </Button>
          )}
          <Button
            variant="danger-soft"
            size="sm"
            isIconOnly
            onPress={() => handleDeleteProject(item.id, item.name)}
          >
            <Text className="text-red-400 font-bold text-sm">✕</Text>
          </Button>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      {/* Header */}
      <View className="px-5 pt-5 pb-4 border-b border-slate-800">
        <Text className="text-2xl font-black text-slate-50 tracking-tight">Mes Chantiers</Text>
        <Text className="text-slate-400 text-sm mt-0.5">
          {projects.length === 0
            ? 'Aucun chantier enregistré.'
            : `${projects.length} chantier(s) enregistré(s)`}
        </Text>
      </View>

      {/* New project button */}
      <View className="px-5 py-3">
        <Button
          variant="primary"
          size="lg"
          feedbackVariant="scale-ripple"
          onPress={() => setModalVisible(true)}
        >
          <Text className="text-white text-xl font-black mr-1">+</Text>
          <Button.Label className="font-bold tracking-wide">Nouveau Chantier</Button.Label>
        </Button>
      </View>

      {/* Backup / restore */}
      <View className="flex-row gap-2 px-5 pb-2">
        <Button
          variant="outline"
          size="sm"
          onPress={handleExportBackup}
          className="flex-1"
        >
          <Text className="text-sm mr-1">💾</Text>
          <Button.Label className="font-bold text-xs text-slate-300">Sauvegarder</Button.Label>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onPress={handleImportBackup}
          className="flex-1"
        >
          <Text className="text-sm mr-1">📥</Text>
          <Button.Label className="font-bold text-xs text-slate-300">Restaurer</Button.Label>
        </Button>
      </View>

      {/* List or empty state */}
      {projects.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Text className="text-5xl mb-4">🏗️</Text>
          <Text className="text-slate-200 text-lg font-black text-center mb-2">
            Aucun chantier
          </Text>
          <Text className="text-slate-500 text-sm text-center leading-relaxed">
            Créez un nouveau chantier pour commencer à saisir les fiches de réception topographique.
          </Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create project modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
        >
          <View
            style={{
              backgroundColor: '#1e293b',
              borderRadius: 20,
              padding: 24,
              width: '100%',
              borderWidth: 1,
              borderColor: '#334155',
            }}
          >
            <Text className="text-slate-50 text-lg font-black mb-1">Nouveau Chantier</Text>
            <Text className="text-slate-400 text-sm mb-4">
              Donnez un nom à ce chantier (ex: Rue de la Paix, Lot 3-B...)
            </Text>
            <TextInput
              style={{
                backgroundColor: '#0f172a',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#475569',
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: '#f8fafc',
                fontSize: 15,
                marginBottom: 16,
              }}
              placeholder="Nom du chantier"
              placeholderTextColor="#64748b"
              value={newProjectName}
              onChangeText={setNewProjectName}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreateProject}
            />
            <View className="flex-row gap-3">
              <Button
                variant="outline"
                size="lg"
                onPress={() => { setModalVisible(false); setNewProjectName(''); }}
                className="flex-1"
              >
                <Button.Label className="font-bold">Annuler</Button.Label>
              </Button>
              <Button
                variant="primary"
                size="lg"
                feedbackVariant="scale-ripple"
                isDisabled={!newProjectName.trim()}
                onPress={handleCreateProject}
                className="flex-1"
              >
                <Button.Label className="font-bold">Créer</Button.Label>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

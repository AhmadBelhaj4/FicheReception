// app/projects.tsx
// "Mes Chantiers" — project list dashboard for multi-project management.
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SectionList,
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
import { useAppTheme } from '../src/hooks/useAppTheme';
import { SavedProject, ProjectStatus } from '../src/types';

function getStatusStyle(status: ProjectStatus, isDark: boolean): { bg: string; text: string } {
  if (isDark) {
    if (status === 'En cours') return { bg: '#065f46', text: '#6ee7b7' };
    if (status === 'Validé')   return { bg: '#1e3a5f', text: '#93c5fd' };
    return { bg: '#374151', text: '#9ca3af' }; // Archivé / fallback
  } else {
    if (status === 'En cours') return { bg: '#d1fae5', text: '#065f46' };
    if (status === 'Validé')   return { bg: '#dbeafe', text: '#1e3a5f' };
    return { bg: '#f1f5f9', text: '#475569' }; // Archivé / fallback
  }
}

export default function ProjectsScreen() {
  const router = useRouter();
  const {
    projects,
    activeProjectId,
    createProject,
    openProject,
    deleteProject,
    archiveProject,
    updateProjectStatus,
    renameProject,
  } = useProjectsStore();
  const { setHeader, setReference, addProfile, setLogos, resetProject } = useProjectStore();
  const { colors, isDark } = useAppTheme();

  const [modalVisible, setModalVisible] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const [renameTarget, setRenameTarget] = useState<SavedProject | null>(null);
  const [renameText, setRenameText] = useState('');
  const [renameModalVisible, setRenameModalVisible] = useState(false);

  /** Load a saved project into the active working store, then navigate home. */
  const handleOpenProject = (proj: SavedProject) => {
    openProject(proj.id);
    // Hydrate the active project store with saved data
    resetProject();
    setHeader({
      receptionNumber: proj.receptionNumber,
      vNumber: proj.vNumber,
      date: proj.date,
      typeIntervention: proj.typeIntervention,
      ...(proj.institutionLines ? { institutionLines: proj.institutionLines } : {}),
    });
    setReference({
      repere: proj.repere,
      alt: proj.alt ?? undefined,
      lectureArriere: proj.lectureArriere ?? undefined,
    });
    setLogos({
      logoClient: proj.logoClient ?? null,
      logoEntreprise: proj.logoEntreprise ?? null,
      logoBureau: proj.logoBureau ?? null,
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
          dialogTitle: 'Exporter / Partager la sauvegarde',
          UTI: 'public.json',
        });
      } else {
        Alert.alert('Sauvegarde enregistrée', `Fichier disponible dans :\n${destUri}`);
      }
    } catch (e) {
      Alert.alert('Erreur', "Échec de l'export : " + String(e));
    }
  };

  const handleImportBackup = async () => {
    let tempFile: string | null = null;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets || !result.assets[0]) return;
      const uri = result.assets[0].uri;

      let raw = '';
      try {
        // Robust reading: copy to app cache first to ensure read permissions on Android
        tempFile = `${FileSystem.cacheDirectory}backup_import_${Date.now()}.json`;
        await FileSystem.copyAsync({ from: uri, to: tempFile });
        raw = await FileSystem.readAsStringAsync(tempFile, {
          encoding: FileSystem.EncodingType.UTF8,
        });
      } catch {
        // Fallback: direct read if copy was not possible
        try {
          raw = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.UTF8,
          });
        } catch {
          Alert.alert(
            'Fichier illisible',
            "Impossible de lire le fichier. Réessayez en sélectionnant à nouveau depuis votre stockage local."
          );
          return;
        }
      } finally {
        if (tempFile) {
          await FileSystem.deleteAsync(tempFile, { idempotent: true }).catch(() => {});
        }
      }

      let backup: unknown;
      try {
        backup = JSON.parse(raw);
      } catch {
        Alert.alert('Fichier corrompu', 'Fichier de sauvegarde invalide ou corrompu.');
        return;
      }

      const backupObj = backup as { projects?: SavedProject[] };
      if (!Array.isArray(backupObj?.projects)) {
        Alert.alert('Format invalide', 'Ce fichier ne contient pas de liste de chantiers valide.');
        return;
      }

      Alert.alert(
        'Importer la sauvegarde',
        `${backupObj.projects.length} chantier(s) trouvé(s). Les importer ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Importer',
            onPress: () => {
              backupObj.projects!.forEach((p: SavedProject) => {
                const existing = projects.find((ex) => ex.id === p.id);
                if (!existing) {
                  useProjectsStore.setState((s) => ({ projects: [...s.projects, p] }));
                }
              });
              Alert.alert('Import terminé ✓', 'Les chantiers ont été importés avec succès.');
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert('Erreur', "Échec de l'import : " + String(e));
    }
  };

  const handleExportSingleProject = async (proj: SavedProject) => {
    try {
      const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        projects: [proj],
      };
      const json = JSON.stringify(backup, null, 2);
      const safeName = proj.name.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 40);
      const fileName = `chantier-${safeName}-${Date.now()}.json`;
      const destUri = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(destUri, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(destUri, {
          mimeType: 'application/json',
          dialogTitle: `Exporter : ${proj.name}`,
          UTI: 'public.json',
        });
      } else {
        Alert.alert(
          'Chantier exporté ✓',
          `Fichier enregistré dans :\n${destUri}`
        );
      }
    } catch (e) {
      Alert.alert('Erreur', "Échec de l'export : " + String(e));
    }
  };

  const renderItem = ({ item }: { item: SavedProject }) => {
    const statusColor = getStatusStyle(item.status, isDark);
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => handleOpenProject(item)}
        style={{
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
          borderWidth: 1,
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
        }}
      >
        {/* Row 1: name + status */}
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1 mr-2">
            <Text style={{ color: colors.text }} className="font-black text-base" numberOfLines={1}>
              {item.name}
            </Text>
            {activeProjectId === item.id && (
              <View style={{ backgroundColor: colors.accent, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8 }}>
                <Text className="text-xs font-black text-slate-900">● Actif</Text>
              </View>
            )}
          </View>
          <View style={{ backgroundColor: statusColor.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ color: statusColor.text, fontSize: 10, fontWeight: '700' }}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Row 2: reception number + profile count + date */}
        <View className="flex-row gap-4 mb-3">
          {item.receptionNumber ? (
            <Text style={{ color: colors.textMuted }} className="text-xs">
              N° <Text style={{ color: colors.text }} className="font-bold">{item.receptionNumber}</Text>
            </Text>
          ) : (
            <Text style={{ color: colors.textDim }} className="text-xs italic">Numéro non défini</Text>
          )}
          <Text style={{ color: colors.textMuted }} className="text-xs">
            <Text style={{ color: colors.accent }} className="font-bold">{item.profiles.length}</Text> profil(s)
          </Text>
          <Text style={{ color: colors.textDim }} className="text-xs">{item.date}</Text>
        </View>

        {/* Row 3: action buttons */}
        <View className="flex-row gap-2">
          <Button
            variant="outline"
            size="sm"
            onPress={() => handleOpenProject(item)}
            className="flex-1"
          >
            <Button.Label style={{ color: colors.text }} className="font-bold text-xs">Ouvrir</Button.Label>
          </Button>
          <Button
            variant="outline"
            size="sm"
            isIconOnly
            onPress={() => handleExportSingleProject(item)}
          >
            <Text style={{ color: colors.text }} className="text-sm">📤</Text>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onPress={() => {
              setRenameTarget(item);
              setRenameText(item.name);
              setRenameModalVisible(true);
            }}
          >
            <Button.Label style={{ color: colors.text }} className="font-bold text-xs">✏️ Renommer</Button.Label>
          </Button>
          {item.status === 'Archivé' ? (
            <Button
              variant="outline"
              size="sm"
              onPress={() => updateProjectStatus(item.id, 'En cours')}
            >
              <Button.Label className="font-bold text-xs" style={{ color: colors.success }}>
                ♻️ Désarchiver
              </Button.Label>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onPress={() =>
                Alert.alert(
                  'Archiver ce chantier ?',
                  'Le chantier sera archivé. Vous pourrez le désarchiver à tout moment.',
                  [
                    { text: 'Annuler', style: 'cancel' },
                    {
                      text: 'Archiver',
                      style: 'destructive',
                      onPress: () => archiveProject(item.id),
                    },
                  ]
                )
              }
            >
              <Button.Label style={{ color: colors.textMuted }} className="font-bold text-xs">
                Archiver
              </Button.Label>
            </Button>
          )}
          <Button
            variant="danger-soft"
            size="sm"
            isIconOnly
            onPress={() => handleDeleteProject(item.id, item.name)}
          >
            <Text style={{ color: colors.danger }} className="font-bold text-sm">✕</Text>
          </Button>
        </View>
      </TouchableOpacity>
    );
  };

  const activeProjects = projects.filter((p) => p.status !== 'Archivé');
  const archivedProjects = projects.filter((p) => p.status === 'Archivé');

  const sections = [
    ...(activeProjects.length > 0 ? [{ title: null, data: activeProjects }] : []),
    ...(archivedProjects.length > 0 ? [{ title: 'Archivés', data: archivedProjects }] : []),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.cardBorder }}>
        <Text style={{ color: colors.text }} className="text-2xl font-black tracking-tight">Mes Chantiers</Text>
        <Text style={{ color: colors.textMuted }} className="text-sm mt-0.5">
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
      <View className="flex-row gap-2 px-5 pb-3">
        <Button
          variant="outline"
          size="sm"
          onPress={handleExportBackup}
          className="flex-1"
        >
          <Text className="text-sm mr-1">📤</Text>
          <Button.Label style={{ color: colors.text }} className="font-bold text-xs">
            Exporter tout
          </Button.Label>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onPress={handleImportBackup}
          className="flex-1"
        >
          <Text className="text-sm mr-1">📥</Text>
          <Button.Label style={{ color: colors.text }} className="font-bold text-xs">
            Importer
          </Button.Label>
        </Button>
      </View>

      {/* List or empty state */}
      {projects.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Text className="text-5xl mb-4">🏗️</Text>
          <Text style={{ color: colors.text }} className="text-lg font-black text-center mb-2">
            Aucun chantier
          </Text>
          <Text style={{ color: colors.textDim }} className="text-sm text-center leading-relaxed">
            Créez un nouveau chantier pour commencer à saisir les fiches de réception topographique.
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={({ section: { title } }) =>
            title ? (
              <View style={{ paddingTop: 16, paddingBottom: 8 }}>
                <Text style={{ color: colors.textDim }} className="text-xs font-bold uppercase tracking-widest">
                  {title}
                </Text>
              </View>
            ) : null
          }
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
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 24,
              width: '100%',
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <Text style={{ color: colors.text }} className="text-lg font-black mb-1">Nouveau Chantier</Text>
            <Text style={{ color: colors.textMuted }} className="text-sm mb-4">
              Donnez un nom à ce chantier (ex: Rue de la Paix, Lot 3-B...)
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.inputBg,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.inputBorder,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: colors.text,
                fontSize: 15,
                marginBottom: 16,
              }}
              placeholder="Ex : Rue de la Paix, Lot 3-B..."
              placeholderTextColor={colors.textDim}
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
                <Button.Label style={{ color: colors.text }} className="font-bold">Annuler</Button.Label>
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

      {/* Rename project modal */}
      <Modal
        visible={renameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setRenameModalVisible(false);
          setRenameTarget(null);
        }}
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
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 24,
              width: '100%',
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <Text style={{ color: colors.text }} className="text-lg font-black mb-1">
              Renommer le chantier
            </Text>
            <Text style={{ color: colors.textMuted }} className="text-sm mb-4">
              Indiquez le nouveau nom du chantier
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.inputBg,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.inputBorder,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: colors.text,
                fontSize: 15,
                marginBottom: 16,
              }}
              placeholder="Nouveau nom..."
              placeholderTextColor={colors.textDim}
              value={renameText}
              onChangeText={setRenameText}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => {
                if (renameTarget && renameText.trim()) {
                  renameProject(renameTarget.id, renameText.trim());
                  setRenameModalVisible(false);
                  setRenameTarget(null);
                }
              }}
            />
            <View className="flex-row gap-3">
              <Button
                variant="outline"
                size="lg"
                onPress={() => {
                  setRenameModalVisible(false);
                  setRenameTarget(null);
                }}
                className="flex-1"
              >
                <Button.Label style={{ color: colors.text }} className="font-bold">Annuler</Button.Label>
              </Button>
              <Button
                variant="primary"
                size="lg"
                feedbackVariant="scale-ripple"
                isDisabled={!renameText.trim()}
                onPress={() => {
                  if (renameTarget && renameText.trim()) {
                    renameProject(renameTarget.id, renameText.trim());
                  }
                  setRenameModalVisible(false);
                  setRenameTarget(null);
                }}
                className="flex-1"
              >
                <Button.Label className="font-bold">Enregistrer</Button.Label>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// app/settings.tsx
// App settings: company logo upload (embedded in PDF header) and tolerance threshold.
import React from 'react';
import {
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Button } from 'heroui-native';

import { useSettingsStore } from '../src/store/useSettingsStore';

export default function SettingsScreen() {
  const { logoBase64, toleranceM, setLogo, setTolerance } = useSettingsStore();

  const handlePickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission requise',
        "L'accès à la galerie est nécessaire pour sélectionner un logo."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 1],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        // Determine MIME type from URI extension
        const uri = asset.uri.toLowerCase();
        const mime = uri.endsWith('.png') ? 'image/png' : 'image/jpeg';
        setLogo(`data:${mime};base64,${asset.base64}`);
      } else if (asset.uri) {
        // Fallback: read file as base64
        const base64 = await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setLogo(`data:image/jpeg;base64,${base64}`);
      }
    }
  };

  const handleRemoveLogo = () => {
    Alert.alert(
      'Supprimer le logo',
      'Supprimer le logo de tous les PDF futurs ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => setLogo(null) },
      ]
    );
  };

  const toleranceCm = Math.round(toleranceM * 100);

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Company Logo ── */}
        <View style={{ backgroundColor: '#1e293b', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#334155' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <View style={{ width: 4, height: 20, backgroundColor: '#f59e0b', borderRadius: 2 }} />
            <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Logo Entreprise / Bureau
            </Text>
          </View>

          <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 16, lineHeight: 18 }}>
            {"Le logo s'affiche dans l'en-tête de chaque PDF généré, à la place du texte institutionnel.\nFormat recommandé : image horizontale (rapport 4:1), PNG ou JPEG."}
          </Text>

          {logoBase64 ? (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ color: '#64748b', fontSize: 11, marginBottom: 8 }}>Aperçu :</Text>
              <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center' }}>
                <Image
                  source={{ uri: logoBase64 }}
                  style={{ width: '100%', height: 60, resizeMode: 'contain' }}
                />
              </View>
            </View>
          ) : (
            <View style={{ backgroundColor: '#0f172a', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#1e293b', borderStyle: 'dashed' }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🏢</Text>
              <Text style={{ color: '#475569', fontSize: 13, textAlign: 'center' }}>
                Aucun logo sélectionné{'\n'}Le texte institutionnel ARRU sera utilisé
              </Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button
              variant="primary"
              size="lg"
              feedbackVariant="scale-ripple"
              onPress={handlePickLogo}
              className="flex-1"
            >
              <Text style={{ marginRight: 8 }}>📁</Text>
              <Button.Label className="font-bold">
                {logoBase64 ? 'Changer le logo' : 'Choisir un logo'}
              </Button.Label>
            </Button>
            {logoBase64 && (
              <Button
                variant="danger-soft"
                size="lg"
                isIconOnly
                onPress={handleRemoveLogo}
              >
                <Text style={{ color: '#f87171', fontWeight: '700' }}>✕</Text>
              </Button>
            )}
          </View>
        </View>

        {/* ── Tolerance Threshold ── */}
        <View style={{ backgroundColor: '#1e293b', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#334155' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <View style={{ width: 4, height: 20, backgroundColor: '#f59e0b', borderRadius: 2 }} />
            <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
              Tolérance (✓ / ⚠)
            </Text>
          </View>

          <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 16, lineHeight: 18 }}>
            {"Seuil en cm pour l'indicateur de conformité sur chaque point. Un écart inférieur ou égal à ce seuil affiche ✓, sinon ⚠."}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ color: '#f8fafc', fontSize: 28, fontWeight: '900' }}>
              ± {toleranceCm} cm
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                variant="outline"
                size="sm"
                isDisabled={toleranceM <= 0.01}
                onPress={() => setTolerance(Math.max(0.01, toleranceM - 0.01))}
              >
                <Button.Label className="font-bold text-lg">−</Button.Label>
              </Button>
              <Button
                variant="outline"
                size="sm"
                isDisabled={toleranceM >= 0.10}
                onPress={() => setTolerance(Math.min(0.10, toleranceM + 0.01))}
              >
                <Button.Label className="font-bold text-lg">+</Button.Label>
              </Button>
            </View>
          </View>

          {/* Preset buttons */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[1, 2, 3, 5].map((cm) => (
              <TouchableOpacity
                key={cm}
                onPress={() => setTolerance(cm / 100)}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: toleranceCm === cm ? '#f59e0b' : '#0f172a',
                  borderWidth: 1,
                  borderColor: toleranceCm === cm ? '#f59e0b' : '#334155',
                }}
              >
                <Text style={{
                  color: toleranceCm === cm ? '#0f172a' : '#94a3b8',
                  fontSize: 12,
                  fontWeight: '700',
                }}>
                  {cm} cm
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}


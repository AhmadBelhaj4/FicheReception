// app/settings.tsx
// App settings: Theme (system/light/dark), tolerance threshold (✓ / ⚠).
import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from 'heroui-native';

import { useSettingsStore, AppTheme } from '../src/store/useSettingsStore';
import { useAppTheme } from '../src/hooks/useAppTheme';

export default function SettingsScreen() {
  const { toleranceM, setTolerance } = useSettingsStore();
  const { theme, setTheme, colors } = useAppTheme();

  const toleranceCm = Math.round(toleranceM * 100);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Theme Selection ── */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.cardBorder,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <View style={{ width: 4, height: 20, backgroundColor: colors.accent, borderRadius: 2 }} />
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              {"Thème de l'application"}
            </Text>
          </View>

          <Text style={{ color: colors.textDim, fontSize: 12, marginBottom: 16, lineHeight: 18 }}>
            {"Choisissez l'apparence visuelle de l'application. En mode Système, l'app suit automatiquement le réglage de votre téléphone."}
          </Text>

          {/* 3 Segmented Options */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { id: 'system', label: 'Système', icon: '📱' },
              { id: 'light', label: 'Clair', icon: '☀️' },
              { id: 'dark', label: 'Sombre', icon: '🌙' },
            ].map((opt) => {
              const isSelected = theme === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  activeOpacity={0.75}
                  onPress={() => setTheme(opt.id as AppTheme)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: 'center',
                    backgroundColor: isSelected ? colors.accent : colors.inputBg,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.accent : colors.inputBorder,
                  }}
                >
                  <Text style={{ fontSize: 18, marginBottom: 4 }}>{opt.icon}</Text>
                  <Text
                    style={{
                      color: isSelected ? '#ffffff' : colors.text,
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Tolerance Threshold ── */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.cardBorder,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <View style={{ width: 4, height: 20, backgroundColor: colors.accent, borderRadius: 2 }} />
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 11,
                fontWeight: '700',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              Tolérance (✓ / ⚠)
            </Text>
          </View>

          <Text style={{ color: colors.textDim, fontSize: 12, marginBottom: 16, lineHeight: 18 }}>
            {"Seuil en cm pour l'indicateur de conformité sur chaque point. Au-delà de ce seuil, l'écart est affiché ⚠ dans l'application et en rouge gras dans le PDF."}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ color: colors.text, fontSize: 28, fontWeight: '900' }}>
              ± {toleranceCm} cm
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                variant="outline"
                size="sm"
                isDisabled={toleranceM <= 0.01}
                onPress={() => setTolerance(Math.max(0.01, toleranceM - 0.01))}
              >
                <Button.Label style={{ color: colors.text }} className="font-bold text-lg">−</Button.Label>
              </Button>
              <Button
                variant="outline"
                size="sm"
                isDisabled={toleranceM >= 0.10}
                onPress={() => setTolerance(Math.min(0.10, toleranceM + 0.01))}
              >
                <Button.Label style={{ color: colors.text }} className="font-bold text-lg">+</Button.Label>
              </Button>
            </View>
          </View>

          {/* Preset buttons */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[1, 2, 3, 5].map((cm) => {
              const isSelected = toleranceCm === cm;
              return (
                <TouchableOpacity
                  key={cm}
                  onPress={() => setTolerance(cm / 100)}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    borderRadius: 10,
                    alignItems: 'center',
                    backgroundColor: isSelected ? colors.accent : colors.surface,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.accent : colors.cardBorder,
                  }}
                >
                  <Text
                    style={{
                      color: isSelected ? '#ffffff' : colors.textMuted,
                      fontSize: 12,
                      fontWeight: '700',
                    }}
                  >
                    {cm} cm
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

import React from 'react';
import { View, Text } from 'react-native';
import { useAppTheme } from '../../src/hooks/useAppTheme';

interface StepBadgeProps {
  current: number;
  total: number;
}

export function StepBadge({ current, total }: StepBadgeProps) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{ backgroundColor: colors.card, borderColor: colors.cardBorder, borderWidth: 1 }}
      className="self-center rounded-full px-4 py-1.5 mb-3"
    >
      <Text
        style={{ color: colors.accent }}
        className="text-xs font-bold tracking-widest uppercase"
      >
        Étape {current} / {total}
      </Text>
    </View>
  );
}

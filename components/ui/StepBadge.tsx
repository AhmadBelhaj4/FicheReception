import React from 'react';
import { View, Text } from 'react-native';

interface StepBadgeProps {
  current: number;
  total: number;
}

/**
 * Pill badge showing "ÉTAPE X / Y" — used at the top of every wizard step.
 */
export function StepBadge({ current, total }: StepBadgeProps) {
  return (
    <View className="self-center bg-slate-800 rounded-full px-4 py-1.5 mb-3">
      <Text className="text-amber-400 text-xs font-bold tracking-widest uppercase">
        Étape {current} / {total}
      </Text>
    </View>
  );
}

import React from 'react';
import { View, Text } from 'react-native';
import { useAppTheme } from '../../src/hooks/useAppTheme';

interface ScreenHeaderProps {
  title: string;
  subtitle: string;
}

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  const { colors } = useAppTheme();
  return (
    <View className="items-center mb-6">
      <Text
        style={{ color: colors.text }}
        className="text-2xl font-black text-center tracking-tight leading-tight"
      >
        {title}
      </Text>
      <Text
        style={{ color: colors.textMuted }}
        className="text-sm text-center mt-1.5 font-medium"
      >
        {subtitle}
      </Text>
    </View>
  );
}

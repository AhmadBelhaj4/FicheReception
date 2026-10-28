import React from 'react';
import { View, Text } from 'react-native';

interface ScreenHeaderProps {
  title: string;
  subtitle: string;
}

/**
 * Hero header used at the top of each wizard step screen.
 * Title is bold and prominent; subtitle is muted.
 */
export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <View className="items-center mb-6">
      <Text className="text-2xl font-black text-slate-50 text-center tracking-tight leading-tight">
        {title}
      </Text>
      <Text className="text-sm text-slate-400 text-center mt-1.5 font-medium">
        {subtitle}
      </Text>
    </View>
  );
}

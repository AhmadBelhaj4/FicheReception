import React from 'react';
import { View, ViewProps } from 'react-native';
import { useAppTheme } from '../../src/hooks/useAppTheme';

interface FieldCardProps extends ViewProps {
  children: React.ReactNode;
}

export function FieldCard({ children, style, ...rest }: FieldCardProps) {
  const { colors } = useAppTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: colors.cardBorder,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

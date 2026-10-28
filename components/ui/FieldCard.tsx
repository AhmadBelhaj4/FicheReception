import React from 'react';
import { View, ViewProps } from 'react-native';

interface FieldCardProps extends ViewProps {
  children: React.ReactNode;
}

/**
 * Dark-surface card used to group form fields on a step screen.
 * Provides consistent padding, rounded corners, and a subtle border.
 */
export function FieldCard({ children, ...rest }: FieldCardProps) {
  return (
    <View
      className="bg-slate-800 rounded-2xl p-5 mb-5 border border-slate-700"
      {...rest}
    >
      {children}
    </View>
  );
}

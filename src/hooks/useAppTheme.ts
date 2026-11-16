// src/hooks/useAppTheme.ts
// Hook resolving current theme mode ('light' | 'dark') based on user settings and OS.
import { useColorScheme as useNativeColorScheme } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { darkColors, lightColors, ThemeColors } from '../theme/colors';

export function useAppTheme() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const systemScheme = useNativeColorScheme();

  const isDark = theme === 'system' ? systemScheme !== 'light' : theme === 'dark';
  const colors: ThemeColors = isDark ? darkColors : lightColors;

  return {
    theme,
    setTheme,
    isDark,
    colors,
  };
}

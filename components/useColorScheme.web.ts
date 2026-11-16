import { useAppTheme } from '../src/hooks/useAppTheme';

export const useColorScheme = () => {
  const { isDark } = useAppTheme();
  return isDark ? 'dark' : 'light';
};

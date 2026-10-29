import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { HeroUINativeProvider } from "heroui-native";
import { useEffect } from 'react';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import 'react-native-reanimated';
import "../global.css";

import { useColorScheme } from '@/components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <HeroUINativeProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: "#0f172a",
              },
              headerTintColor: "#f8fafc",
              headerTitleStyle: {
                fontWeight: "bold",
              },
              headerShadowVisible: false,
            }}
          >
            <Stack.Screen
              name="(tabs)"
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="reference"
              options={{
                title: "Repère de Référence",
                headerBackTitle: "Retour",
              }}
            />
            <Stack.Screen
              name="profiles"
              options={{
                title: "Profils",
                headerBackTitle: "Retour",
              }}
            />
            <Stack.Screen
              name="profile-edit"
              options={{
                title: "Édition du Profil",
                headerBackTitle: "Retour",
              }}
            />
            <Stack.Screen
              name="preview"
              options={{
                title: "Aperçu & Export PDF",
                headerBackTitle: "Retour",
              }}
            />
            <Stack.Screen
              name="projects"
              options={{
                title: "Mes Chantiers",
                headerBackTitle: "Retour",
              }}
            />
            <Stack.Screen
              name="settings"
              options={{
                title: "Paramètres",
                headerBackTitle: "Retour",
              }}
            />
          </Stack>
        </ThemeProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );

}

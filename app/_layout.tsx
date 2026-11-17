import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { HeroUINativeProvider } from "heroui-native";
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from "react-native-gesture-handler";
import 'react-native-reanimated';
import { Uniwind } from 'uniwind';
import "../global.css";

import IntroSplash from '../components/IntroSplash';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { useProjectsStore } from '../src/store/useProjectsStore';
import { useProjectStore } from '../src/store/useProjectStore';

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
  const { isDark, colors } = useAppTheme();
  const [showIntro, setShowIntro] = useState(true);
  const hideIntro = useCallback(() => setShowIntro(false), []);

  useEffect(() => {
    Uniwind.setTheme(isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        // Force-flush both stores to AsyncStorage immediately (bypass debounce)
        const projectsSnap = useProjectsStore.getState();
        const projectSnap = useProjectStore.getState();
        AsyncStorage.setItem(
          'fiche-reception-projects',
          JSON.stringify({
            state: {
              projects: projectsSnap.projects,
              activeProjectId: projectsSnap.activeProjectId,
            },
            version: 2,
          })
        ).catch(() => {});
        AsyncStorage.setItem(
          'fiche-reception-project',
          JSON.stringify({
            state: {
              receptionNumber: projectSnap.receptionNumber,
              vNumber: projectSnap.vNumber,
              date: projectSnap.date,
              typeIntervention: projectSnap.typeIntervention,
              institutionLines: projectSnap.institutionLines,
              repere: projectSnap.repere,
              alt: projectSnap.alt,
              lectureArriere: projectSnap.lectureArriere,
              pc: projectSnap.pc,
              profiles: projectSnap.profiles,
              logoClient: projectSnap.logoClient,
              logoEntreprise: projectSnap.logoEntreprise,
              logoBureau: projectSnap.logoBureau,
            },
            version: 3,
          })
        ).catch(() => {});
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <HeroUINativeProvider>
        <ThemeProvider
          value={isDark ? DarkTheme : DefaultTheme}
        >
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: colors.bg,
              },
              headerTintColor: colors.text,
              headerTitleStyle: {
                fontWeight: "bold",
              },
              headerShadowVisible: false,
              contentStyle: {
                backgroundColor: colors.bg,
              },
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
              name="pdf-preview"
              options={{
                headerShown: false,
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
          {showIntro && <IntroSplash onDone={hideIntro} />}
        </ThemeProvider>
      </HeroUINativeProvider>
    </GestureHandlerRootView>
  );

}

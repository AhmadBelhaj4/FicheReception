// components/IntroSplash.tsx
// Cinematic in-app loading screen, shown once per cold start right after the native splash.
// Full-screen picture + centered app name and tagline. Tap anywhere to skip. No new dependencies.
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HERO = require('../assets/images/intro-cinematic.jpg');
const SHOW_MS = 2000;

// Explicit full-screen style (StyleSheet.absoluteFillObject was removed in recent React Native).
const FILL = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
} as const;

type Props = {
  /** Called after SHOW_MS or when the user taps. Must be a stable function (useCallback). */
  onDone: () => void;
};

export default function IntroSplash({ onDone }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  // Text block sits about 12% up from the bottom edge, never under the system bar.
  const bottomPad = Math.max(insets.bottom + 24, height * 0.12);

  useEffect(() => {
    const timer = setTimeout(onDone, SHOW_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      exiting={FadeOut.duration(450)}
      style={styles.root}
    >
      <StatusBar style="light" />
      <Pressable
        style={FILL}
        onPress={onDone}
        accessibilityRole="button"
        accessibilityLabel="Passer l'introduction"
      >
        <Image source={HERO} style={styles.image} />
        <View style={[styles.content, { paddingBottom: bottomPad }]}>
          <Text style={styles.title}>Fiche Topo</Text>
          <Text style={styles.subtitle}>RÉCEPTION & CONTRÔLE TOPOGRAPHIQUE</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...FILL,
    backgroundColor: '#0f172a',
    zIndex: 10,
  },
  image: {
    // Absolute + explicit size: a bundled image otherwise keeps its pixel size,
    // and without absolute it would push the text out of the screen.
    ...FILL,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    ...FILL,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#f8fafc',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 10,
    textAlign: 'center',
  },
});

// components/IntroSplash.tsx
// Cinematic in-app loading screen, shown once per cold start right after the native splash.
// Full-screen photo + app name. Tap anywhere to skip. No new dependencies.
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HERO = require('../assets/images/intro-cinematic.jpg');
const SHOW_MS = 2000;

type Props = {
  /** Called after SHOW_MS or when the user taps. Must be a stable function (useCallback). */
  onDone: () => void;
};

export default function IntroSplash({ onDone }: Props) {
  const insets = useSafeAreaInsets();

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
        style={StyleSheet.absoluteFill}
        onPress={onDone}
        accessibilityRole="button"
        accessibilityLabel="Passer l'introduction"
      >
        <Image source={HERO} style={styles.image} />
        <View style={styles.scrim} />
        <View style={[styles.content, { paddingBottom: insets.bottom + 48 }]}>
          <View style={styles.rule} />
          <Text style={styles.title}>Fiche Topo</Text>
          <Text style={styles.subtitle}>Réception topographique · Nivellement</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0f172a',
    zIndex: 10,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 32,
  },
  rule: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#f59e0b',
    marginBottom: 14,
  },
  title: {
    color: '#f8fafc',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#cbd5e1',
    fontSize: 15,
    marginTop: 6,
  },
});

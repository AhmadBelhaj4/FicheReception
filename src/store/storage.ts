// src/store/storage.ts
import { StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const timers = new Map<string, ReturnType<typeof setTimeout>>();

export const zustandStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await AsyncStorage.getItem(name)) ?? null;
  },
  setItem: (name: string, value: string): void => {
    // Debounce: cancel any pending write for this key, wait 300 ms
    const existing = timers.get(name);
    if (existing) clearTimeout(existing);
    const id = setTimeout(() => {
      timers.delete(name);
      AsyncStorage.setItem(name, value).catch(() => {
        // Retry once on failure
        AsyncStorage.setItem(name, value).catch(() => {});
      });
    }, 300);
    timers.set(name, id);
  },
  removeItem: async (name: string): Promise<void> => {
    const existing = timers.get(name);
    if (existing) {
      clearTimeout(existing);
      timers.delete(name);
    }
    await AsyncStorage.removeItem(name);
  },
};

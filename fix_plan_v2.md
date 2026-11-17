# Fix Plan v2 — Mes Chantiers: Data Loss on Relaunch + Local Save Option

**For the agent:** Read every section carefully before writing a single line of code.  
Run `npx tsc --noEmit` and `$env:EXPO_NO_TELEMETRY=1; npx expo lint` after every file you touch.  
Run `npm test` before the final commit.  
Never use `&&` to chain shell commands in PowerShell — run each command on its own line.  
Never edit `ios/` or `android/` by hand.  
Push to `origin main` with `BypassSandbox: true` at the very end.

---

## Problem 1 — All Chantiers Disappear When App Restarts Mid-Modal

### Root Cause (diagnosed, do not guess)

The store that holds the list of all saved projects is `useProjectsStore`
(`src/store/useProjectsStore.ts`).  
It is backed by **AsyncStorage** via the Zustand `persist` middleware.  
AsyncStorage writes are **asynchronous** — the middleware calls `setItem`
but does **not** block the JS thread and does **not** wait for the write to
complete before the process exits.

Here is the exact sequence that causes the wipe:

1. User presses **Nouveau Chantier** → the modal appears.
2. The user force-closes the app (or Android kills the process) while the modal
   is open and before they press **Créer**.
3. At that point, `createProject` has **not** been called yet —
   `useProjectsStore` state in memory is still the correct list of old
   chantiers.
4. BUT: when the user reopened the app the **previous session**, the store was
   loaded from AsyncStorage. Meanwhile, some earlier call (opening or saving a
   chantier) had mutated the **single-project working store**
   (`useProjectStore`).  
   That other store also persists to AsyncStorage under the key
   `'fiche-reception-project'`.  
   The two stores share the **same AsyncStorage instance**.  
   On some Android versions, a large concurrent write to AsyncStorage can
   corrupt or truncate the value for `'fiche-reception-projects'` (the
   multi-project list key) if the other large write (logos are base64 strings,
   potentially several MB) races with it.

5. On next cold start Zustand reads the corrupted/empty value from AsyncStorage
   and rehydrates with an empty projects array.

### Additional suspicion (secondary cause)

Look at `handleCreateProject` in `app/projects.tsx` (line 85-94):

```ts
const handleCreateProject = () => {
  const name = newProjectName.trim();
  if (!name) return;
  createProject(name);          // <- writes to useProjectsStore state
  setModalVisible(false);
  setNewProjectName('');
  resetProject();               // <- writes to useProjectStore state
  router.replace('/(tabs)');
};
```

`createProject` triggers a Zustand state update which enqueues an **async**
AsyncStorage write.  
Then immediately `resetProject()` triggers **another** async AsyncStorage write
on the **other** store.  
Two concurrent large writes to AsyncStorage on Android is a known source of
data loss.

### Fix for Problem 1

**Two changes are needed:**

#### Change A — Debounce / serialize the AsyncStorage writes

Modify `src/store/storage.ts` to add a **debounced write wrapper** for
`setItem`.  Use a `Map<string, ReturnType<typeof setTimeout>>` to hold one
pending timer per storage key.  Flush after **300 ms** of silence.

Replace the entire contents of `src/store/storage.ts` with:

```ts
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
```

> **IMPORTANT:** The `setItem` signature in `StateStorage` accepts both `void`
> and `Promise<void>`. Using synchronous scheduling (setTimeout) here is safe
> because Zustand only reads the return value for `getItem`. Do NOT change
> `getItem` — it must remain `async`.

#### Change B — Flush both stores to AsyncStorage when the app goes to background

Add an **AppState listener in `app/_layout.tsx`** that force-writes a snapshot
of both stores when the app transitions to background. This guarantees that
even if the debounce timer hasn't fired yet, the data is saved the moment
Android starts shutting down the process.

Add these imports to `app/_layout.tsx` (at the top, with other imports):

```ts
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProjectsStore } from '../src/store/useProjectsStore';
import { useProjectStore } from '../src/store/useProjectStore';
```

Then inside `RootLayoutNav` component, add a `useEffect` block. Place it
**after** the existing `useEffect` that calls `Uniwind.setTheme`:

```ts
useEffect(() => {
  const sub = AppState.addEventListener('change', (nextState) => {
    if (nextState === 'background' || nextState === 'inactive') {
      // Force-flush both stores to AsyncStorage immediately (bypass debounce)
      const projectsSnap = useProjectsStore.getState();
      const projectSnap  = useProjectStore.getState();
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
            receptionNumber:   projectSnap.receptionNumber,
            vNumber:           projectSnap.vNumber,
            date:              projectSnap.date,
            typeIntervention:  projectSnap.typeIntervention,
            institutionLines:  projectSnap.institutionLines,
            repere:            projectSnap.repere,
            alt:               projectSnap.alt,
            lectureArriere:    projectSnap.lectureArriere,
            pc:                projectSnap.pc,
            profiles:          projectSnap.profiles,
            logoClient:        projectSnap.logoClient,
            logoEntreprise:    projectSnap.logoEntreprise,
            logoBureau:        projectSnap.logoBureau,
          },
          version: 3,
        })
      ).catch(() => {});
    }
  });
  return () => sub.remove();
}, []);
```

> **CRITICAL RULE — version numbers:** The JSON structure written here must
> match exactly what Zustand `persist` middleware reads on startup:
> `{ state: { ...fields }, version: N }`.
> The version numbers **must** be:
> - `useProjectsStore` → `version: 2` (see `src/store/useProjectsStore.ts` line 156)
> - `useProjectStore` → `version: 3` (see `src/store/useProjectStore.ts` line 87)
> If you use the wrong version, Zustand calls `migrate()` on cold start and
> wipes all data.

> **DO NOT** call the stores with the React hook (`useProjectsStore()`,
> `useProjectStore()`) inside the effect. Use the static `.getState()` method
> available on the store object — it reads current state without subscribing.

> **DO NOT** add `AsyncStorage` as a default-export import if it is already
> imported in that file. Check the existing imports first.

---

## Problem 2 — Export Backup Does Not Offer "Save Locally to Phone"

### Root Cause

The current `handleExportBackup` in `app/projects.tsx` calls
`Sharing.shareAsync()` immediately.  
On Android, the native share sheet (Intent chooser) only offers apps registered
to receive files — Messenger, Drive, WhatsApp, etc.  
There is **no "Save to phone" / "Save to Downloads"** option in the standard
Android share sheet.

On iOS the share sheet **does** include "Save to Files" so it works there.

### Fix for Problem 2

Add a **"Enregistrer en local"** button that bypasses the share sheet and writes
the file directly to a folder the user picks.

**On Android:** Use `expo-file-system/legacy`'s `StorageAccessFramework` (SAF)
to let the user pick a destination folder (e.g. Downloads) then write the file.
This is the correct Android scoped-storage approach for Expo SDK 58.

**On iOS:** `documentDirectory` is accessible via the Files app, so write there
and show a plain alert.

#### Change A — Add `handleSaveLocally` to `app/projects.tsx`

Add `Platform` to the existing `react-native` import at the top of the file:

```ts
import { Alert, Modal, Platform, SectionList, Text, TextInput, TouchableOpacity, View } from 'react-native';
```

Then add the following function inside `ProjectsScreen`, placed right after
`handleExportBackup`:

```ts
const handleSaveLocally = async () => {
  try {
    const backup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      projects,
    };
    const json = JSON.stringify(backup, null, 2);
    const fileName = `fiche-reception-backup-${Date.now()}.json`;

    if (Platform.OS === 'android') {
      // SAF: ask user to pick a destination folder
      const permissions =
        await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        Alert.alert('Permission refusée', 'Accès au stockage refusé.');
        return;
      }
      const uri = await FileSystem.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        fileName,
        'application/json'
      );
      await FileSystem.writeAsStringAsync(uri, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      Alert.alert(
        'Sauvegarde enregistrée ✓',
        'Fichier JSON enregistré dans le dossier que vous avez choisi.'
      );
    } else {
      // iOS: documentDirectory is accessible from the Files app
      const dest = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(dest, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      Alert.alert(
        'Sauvegarde enregistrée ✓',
        `Fichier enregistré. Ouvrez l'app Fichiers pour le retrouver.`
      );
    }
  } catch (e) {
    Alert.alert('Erreur', 'Impossible de sauvegarder localement : ' + String(e));
  }
};
```

> **IMPORTANT:** `FileSystem.StorageAccessFramework` is part of
> `expo-file-system/legacy` which is **already imported** in this file as
> `import * as FileSystem from 'expo-file-system/legacy'`.  
> Do **not** add a new import — just use `FileSystem.StorageAccessFramework`.  
> Do **not** switch to the non-legacy `expo-file-system` import — keep the
> existing `/legacy` path.

#### Change B — Add the button to the UI in `app/projects.tsx`

The existing backup row is around lines 366-389 and contains two buttons in a
`flex-row`. Add a third button between the existing two:

```tsx
<Button
  variant="outline"
  size="sm"
  onPress={handleSaveLocally}
  className="flex-1"
>
  <Text className="text-sm mr-1">💾</Text>
  <Button.Label style={{ color: colors.text }} className="font-bold text-xs">
    Enregistrer local
  </Button.Label>
</Button>
```

Place it **after** the "Exporter la sauvegarde" button and **before** the
"Importer une sauvegarde" button.

If the row becomes too tight with three buttons in `flex-row`, split into two
rows: row 1 has "Exporter" + "Enregistrer local", row 2 has "Importer".
Match the padding/gap style already used in the file.

---

## Execution Order

1. `git pull origin main` — make sure you are on the latest `main`.
2. Edit `src/store/storage.ts` — full replacement with debounce wrapper (Problem 1, Change A).
3. Edit `app/_layout.tsx` — add `AppState` flush effect + new imports (Problem 1, Change B).
4. Edit `app/projects.tsx` — add `handleSaveLocally` + Platform import + new UI button (Problem 2).
5. Run `npx tsc --noEmit` — fix **all** TypeScript errors before continuing.
6. Run `$env:EXPO_NO_TELEMETRY=1; npx expo lint` — fix **all** lint errors.
7. Run `npm test` — all 8 tests must pass.
8. Stage, commit, and push (each command separately, all with `BypassSandbox: true`):
   ```
   git add .
   git commit -m "Fix chantiers data loss on cold restart and add local save option"
   git push origin main
   ```

---

## Hard Rules / Guardrails

- **Never** chain PowerShell commands with `&&`. Run each command separately.
- **Never** edit `ios/` or `android/` folders.
- **Never** run `npm install` or `npx expo install` — no new packages needed.
- **Never** use NativeWind color utility classes for theme colors — always use
  `style={{ color: colors.xxx }}`.
- **Do not** add unused imports — TypeScript and the linter will both fail.
- **Do not** change the `version` numbers in the stores — they are intentional.
- The AppState flush JSON must match the Zustand persist envelope exactly:
  `{ state: { …partialize fields }, version: N }`.
  - `useProjectsStore` version = **2**
  - `useProjectStore`  version = **3**
- Do not use hook-style store access inside `useEffect` — use `.getState()`.
- After all edits, verify `git status` shows only the three expected files modified:
  `src/store/storage.ts`, `app/_layout.tsx`, `app/projects.tsx`.
  If any other file appears modified unexpectedly, investigate before committing.

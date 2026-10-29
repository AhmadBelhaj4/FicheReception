# FicheReception — Issue Tracker & Resolution Log

This document serves as the permanent record of all identified bugs, root causes, implemented solutions, and architecture rules for **FicheReception**.

---

## 1. Issues Summary & Resolution Status

| # | Issue Description | Root Cause | Solution Implemented | Status |
|---|---|---|---|:---:|
| **1** | **Virtual Keyboard Occlusion (Refined)**: Soft keyboard pops up and covers input fields & bottom buttons (*Voirie projetée*, *P.C. card*, *Observation*, *Enregistrer*). The screen did not resize or scroll adequately with initial settings. | Initial `KeyboardAwareScrollView` setup had: (1) only `paddingBottom: 40`, leaving no vertical runway for bottom inputs to scroll above the ~320px soft keyboard; (2) `extraScrollHeight` set to only `20px`; and (3) Android default `softwareKeyboardLayoutMode` ("resize") fighting the scroll calculations. | (1) Added `contentContainerStyle={{ flexGrow: 1, paddingBottom: 160-180 }}` to guarantee vertical scroll runway; (2) Increased `extraScrollHeight={120}` and `extraHeight={120}`; (3) Added `enableResetScrollToCoords={false}` and `keyboardOpeningTime={0}`; (4) Configured `"softwareKeyboardLayoutMode": "pan"` in `app.json`. | ✅ **RESOLVED & TUNED** |
| **2** | **White Band at Top of Screen**: All screens except the first displayed a white band between the header and dark body. | Root `_layout.tsx` Stack navigator had `headerStyle: { backgroundColor: '#ffffff' }` with dark slate screens (`#0f172a`). | Changed Stack header `backgroundColor` to `#0f172a` and `headerTintColor` to `#f8fafc`. | ✅ **RESOLVED** |
| **3** | **PDF Share/Save Failure (Scoped Storage Error)**: Tapping *"Partager / Enregistrer le PDF"* crashed with `Not allowed to read file under given URL` or failed silently. | `expo-print` writes PDFs to app cache (`file://`), which Android 7+ Scoped Storage / FileProvider blocks external apps from accessing. Additionally, iOS had an invalid Uniform Type Identifier (`UTI: '.pdf'`). | Used `expo-file-system/legacy` to copy the generated PDF from temporary cache to `FileSystem.documentDirectory`, then shared the permanent content URI with `UTI: 'com.adobe.pdf'` and `mimeType: 'application/pdf'`. | ✅ **RESOLVED** |
| **4** | **Double Safe Area Inset**: `profiles.tsx` and `preview.tsx` had excessive top padding on notched iOS devices. | Both screens wrapped content in `SafeAreaView`, while already rendered inside an Expo Router `Stack` navigator whose header already absorbs the top inset. | Replaced outer `SafeAreaView` with a standard `View` (`{ flex: 1, backgroundColor: '#0f172a' }`) in both screens. First screen retains `SafeAreaView` because it has `headerShown: false`. | ✅ **RESOLVED** |
| **5** | **Data Loss on App Interruption / Kill**: Closing the app or background interruption wiped all survey inputs and profiles. | Zustand store was purely in-memory with no storage adapter. | Implemented custom `AsyncStorage` adapter in `src/store/storage.ts` and wrapped `useProjectStore` with Zustand's `persist` middleware with `partialize` (persisting only data, never action functions). | ✅ **RESOLVED** |
| **6** | **Unused Template Boilerplate Clutter**: Default template files from `create-expo-app` remained in the repository. | Boilerplate files (`two.tsx`, `modal.tsx`, `EditScreenInfo.tsx`, `ExternalLink.tsx`, `StyledText.tsx`, `Themed.tsx`, `useClientOnlyValue.ts`, `Colors.ts`) were unused by the core application. | Completely removed all obsolete boilerplate files and their unused route declarations, keeping only active components and styles. | ✅ **RESOLVED** |
| **7** | **Print Cache Unreadable (`copyAsync` Rejection)**: `ExponentFileSystem.copyAsync` failed with `java.io.IOException: Location 'file:///data/user/0/host.exp.exponent/cache/Print/....pdf' isn't readable`. | On Android in Expo Go, the print cache directory (`/cache/Print/`) is managed by the native Android print spooler service with isolated permissions, making it unreadable by `ExponentFileSystem.copyAsync`. | Updated `Print.printToFileAsync({ html, base64: true })` to capture the in-memory Base64 PDF directly, then wrote it directly to `FileSystem.documentDirectory` using `FileSystem.writeAsStringAsync(destUri, base64, { encoding: EncodingType.Base64 })`. Completely avoids reading from the inaccessible print cache. | ✅ **RESOLVED** |
| **8** | **Unescaped user text in PDF HTML**: `<`, `&` or quotes in observation/repère/etc. break or inject into the generated PDF. | Template literals interpolated raw strings. | Added `src/utils/html.ts` (`escapeHtml`) and applied it to all free-text fields in `preview.tsx`. | ✅ **RESOLVED** (unverified on device) |
| **9** | **Stale / UTC-shifted date**: reset reused the date from app launch; `toISOString()` could shift the picked day. | `initialState` evaluated once; UTC conversion. | Added `src/utils/date.ts` (local-time helpers); store builds a fresh initial state on reset; index and preview use the helpers. | ✅ **RESOLVED** (unverified on device) |
| **10** | **Blank profile left behind**: tapping "Ajouter" then going back kept an empty profile. | Profile is created in the store before the edit screen opens. | `profile-edit.tsx` removes the profile on unmount if every field is empty. | ✅ **RESOLVED** (unverified on device) |
| **11** | **No store migration path**. | `persist` had `version: 1` but no `migrate`. | Added a `migrate` stub in `useProjectStore.ts`; bump `version` there on schema changes. | ✅ **RESOLVED** |

---

## 2. File-by-File Change Log

### `app/_layout.tsx`
- Set Stack header `backgroundColor` to `#0f172a` and `headerTintColor` to `#f8fafc`.
- Removed unused `modal` route definition.

### `app/(tabs)/_layout.tsx`
- Removed unused `two` tab route.

### `app/(tabs)/index.tsx`
- Retained `SafeAreaView` (since `headerShown: false`).
- Replaced `KeyboardAvoidingView` + `ScrollView` with tuned `KeyboardAwareScrollView`:
  - `contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 160 }}`
  - `enableOnAndroid={true}`
  - `enableAutomaticScroll={true}`
  - `extraScrollHeight={120}`
  - `extraHeight={120}`
  - `enableResetScrollToCoords={false}`
  - `keyboardOpeningTime={0}`

### `app/reference.tsx`
- Replaced outer `KeyboardAvoidingView` + `ScrollView` with tuned `KeyboardAwareScrollView`:
  - `contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 160 }}`
  - `extraScrollHeight={120}` & `extraHeight={120}`
  - Preserved dark background (`#0f172a`) and live P.C. auto-calculation.

### `app/profile-edit.tsx`
- Replaced `KeyboardAvoidingView` + `ScrollView` with tuned `KeyboardAwareScrollView`:
  - `contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 180 }}`
  - `extraScrollHeight={120}` & `extraHeight={120}`
  - Allows full viewing and keyboard clearance for observations and the *"Enregistrer le Profil"* button.

### `app/profiles.tsx`
- Replaced redundant `SafeAreaView` with standard `<View style={{ flex: 1, backgroundColor: '#0f172a' }}>`.

### `app/preview.tsx`
- Replaced redundant `SafeAreaView` with standard `View`.
- In `handleShare`:
  - Invokes `Print.printToFileAsync({ html, base64: true })`.
  - Writes directly into `FileSystem.documentDirectory` using `FileSystem.writeAsStringAsync(destUri, base64, { encoding: FileSystem.EncodingType.Base64 })`.
  - Passes the permanent URI to `Sharing.shareAsync()` with `UTI: 'com.adobe.pdf'` and `mimeType: 'application/pdf'`.
  - Bypasses the unreadable native print cache error on Android.

### `app.json`
- Added `"softwareKeyboardLayoutMode": "pan"` under `"android"` so native Android window adjustments work seamlessly with `KeyboardAwareScrollView`.

### `app/+not-found.tsx`
- Replaced deleted `@/components/Themed` imports with standard `react-native` primitives (`Text`, `View`, `StyleSheet`).

### `src/store/storage.ts`
- Bridges `@react-native-async-storage/async-storage` to Zustand's `StateStorage` interface (`getItem`, `setItem`, `removeItem`).

### `src/store/useProjectStore.ts`
- Wrapped store with `persist` middleware using `createJSONStorage(() => zustandStorage)`.
- Added `partialize` configuration to ensure only serializable survey data fields are persisted to disk.

---

## 3. Cleaned Up Files (Deleted)

The following unused template files were safely removed:
* `app/(tabs)/two.tsx`
* `app/modal.tsx`
* `components/EditScreenInfo.tsx`
* `components/ExternalLink.tsx`
* `components/StyledText.tsx`
* `components/Themed.tsx`
* `components/useClientOnlyValue.ts`
* `components/useClientOnlyValue.web.ts`
* `constants/Colors.ts`

---

## 4. Current Clean Project Structure

```
FicheReception/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Tab layout (headerShown: false)
│   │   └── index.tsx           # Step 1: Informations Générales & Chantier
│   ├── +html.tsx               # Web HTML entry
│   ├── +not-found.tsx          # 404 handler
│   ├── _layout.tsx             # Root Stack navigator (dark theme headers)
│   ├── preview.tsx             # Step 4: Synthèse, Print & PDF Share
│   ├── profile-edit.tsx        # Profile Form (D2, D1, Axe, G1, G2, etc.)
│   ├── profiles.tsx            # Step 3: Profiles List
│   └── reference.tsx           # Step 2: Repère & P.C. Calculation
├── assets/                     # Fonts & app icons
├── components/
│   ├── ui/
│   │   ├── FieldCard.tsx       # Form card container
│   │   ├── ScreenHeader.tsx    # Step header
│   │   └── StepBadge.tsx       # Step pill indicator
│   ├── useColorScheme.ts      # Native color scheme hook
│   └── useColorScheme.web.ts  # Web color scheme hook
├── resource/                   # Original reference PDFs & leveling sheets
├── src/
│   ├── store/
│   │   ├── storage.ts          # AsyncStorage adapter for Zustand
│   │   └── useProjectStore.ts  # Persisted project state
│   ├── types/
│   │   └── index.ts            # ProfileData, ProjectState types
│   └── utils/
│       └── calculations.ts     # P.C., Cote Pratique, Déblai/Remblai math
├── app.json                    # Expo config (softwareKeyboardLayoutMode: pan)
├── global.css                  # Tailwind styles
├── package.json                # Dependencies & SDK 58 definitions
├── problems.md                 # This file
├── recommendations.md          # Future development roadmap
└── tsconfig.json               # TypeScript config
```

---

## 5. Architectural Rules & "DO NOT" List for Future Agents

> [!CAUTION]
> Any future AI agent modifying this project must respect the following rules:

1. **DO NOT attempt to `copyAsync` from `Print.printToFileAsync`'s temporary cache path**: Android Expo Go isolates the print spooler cache (`cache/Print/`), causing `IOException: Location isn't readable`. Always generate with `base64: true` and write directly to `FileSystem.documentDirectory` via `writeAsStringAsync`.
2. **DO NOT reduce `paddingBottom` on input screens below 140px**: Without sufficient bottom padding, `KeyboardAwareScrollView` has no scroll runway to lift bottom fields (like *Voirie projetée* or observations) above the ~320px on-screen keyboard.
3. **DO NOT revert `softwareKeyboardLayoutMode` to `"resize"` in `app.json`**: When combined with JavaScript keyboard handling on modern Android, `"resize"` causes competing layout passes and jitter.
4. **DO NOT pass Tailwind classes to `KeyboardAwareScrollView`'s `contentContainerStyle`**: `contentContainerClassName` is not supported on third-party scroll components. Always use a numeric JS object with `flexGrow: 1`.
5. **DO NOT add `SafeAreaView` to Stack screens with visible headers**: `reference.tsx`, `profiles.tsx`, `profile-edit.tsx`, and `preview.tsx` have headers managed by the Stack navigator. Adding `SafeAreaView` causes double top-padding on notched phones. Only `(tabs)/index.tsx` should use `SafeAreaView`.
6. **DO NOT remove `partialize` from `useProjectStore.ts`**: Zustand will try to serialize function actions (`setHeader`, `addProfile`, etc.) to AsyncStorage, corrupting the storage.

---

## 6. Verification Status

- **TypeScript Compilation**: `npx tsc --noEmit` passed with **0 errors**.
- **All Reported Bugs**: Documented, analyzed, resolved, and logged in this tracker.

---

## 7. Open Backlog (prioritised)

1. PDF header: add official institutional lines (République Tunisienne / Travaux de réhabilitation du quartier Ennour / Commune de Kasserine).
2. PDF pagination: `page-break-inside: avoid` per 5-row profile and repeated `thead` on each page.
3. Make the point order consistent (UI: D2, D1, Axe, G1, G2 vs PDF: D1, D2, Axe, G1, G2).
4. Tolerance (± cm) indicator per point and sanity checks on readings (e.g. 15.300 typed as 1.530, jumps > 50 cm).
5. Jest tests for `src/utils/calculations.ts`.
6. Inspect `RECEPTION TN .xlsx` for exact tolerances/rules.
7. Refresh `PROJECT_DOCUMENTATION_A_TO_Z.md` (stale: persistence, template files, step count) and regenerate `firstoutput.pdf`.
8. Roadmap features: see `recommendations.md` (multi-project, backup, signatures, CSV, photos, GPS, branding).

> Note: items 8–11 above were implemented without being able to run `tsc`/`expo lint` (npm registry unreachable in that session). Run `npx tsc --noEmit && npx expo lint` before merging.

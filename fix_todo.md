# Fix Instructions for Code Agent

> **YOU ARE A CODE AGENT.** Read every section carefully before touching any file.  
> This document is self-contained. Do NOT rely on conversation history.  
> Fix only what is described here. Do not refactor, rename, or "improve" anything else.

---

## ⛔ GUARDRAILS — Read First, Violate None

1. **NEVER use NativeWind color utility classes** (`text-slate-X`, `text-white`, `text-gray-X`, `bg-slate-X`, etc.) on any `Text`, `Button.Label`, or `View` that must adapt to the app theme. Use `style={{ color: colors.X }}` from `useAppTheme()` instead. NativeWind classes are fine for layout/spacing/radius/padding — not for color.

2. **NEVER hardcode hex color values** (`#065f46`, `#ffffff`, etc.) directly in JSX unless they are intentionally theme-independent (e.g., a fixed amber accent badge). Theme-sensitive colors must come from `useAppTheme()` → `colors`.

3. **NEVER use a component-level `useRef` as a "run-once per app lifetime" guard.** A `useRef` is scoped to the component instance. When the navigator replaces the screen, the component remounts and the ref resets to its initial value — the guard does nothing.

4. **NEVER call `resetProject()` or `useProjectsStore.setState({ activeProjectId: null })` unconditionally in a startup `useEffect`.** Always guard these calls with a check that no project was intentionally opened before the screen mounted.

5. **ALWAYS read the actual current file content before editing.** Do not assume what lines contain. File contents may differ from what you expect.

6. **ALWAYS run all three verification commands after completing ALL changes** (see Section 5). Every command must exit with 0 errors/warnings before you are done.

7. **DO NOT add unused imports.** Every import you add must be referenced in the file.

8. **DO NOT remove or rename** `handleArchiveProject` from `app/projects.tsx` — it is used in the UI.

9. **DO NOT create new files, move files, or change routing structure.**

10. **DO NOT install new packages.** No new dependencies are needed.

---

## Bug 1 — Opening a Saved Project Shows a Blank Screen

### Symptom
In "Mes Chantiers", tapping an existing project navigates to the main tab but the form is completely empty instead of showing the project's data.

### Root Cause
`app/(tabs)/index.tsx` has a startup `useEffect` with a `useRef(false)` guard (`hasRunStartup`). When `handleOpenProject` in `projects.tsx` calls `router.replace('/(tabs)')`, the main tab component **remounts** (navigation stack is replaced). On remount the ref resets to `false`, the effect fires again, sees `isAlreadySaved === true` (the project was just loaded), correctly skips the auto-save — but then **unconditionally calls `projectState.resetProject()` and `useProjectsStore.setState({ activeProjectId: null })`**, wiping the just-loaded project data.

### Fix — `app/(tabs)/index.tsx`

**Step 1.** Open `app/(tabs)/index.tsx` and read the entire file.

**Step 2.** Find the startup `useEffect`. It looks approximately like this (the exact line numbers may vary — use the structure to locate it):

```js
useEffect(() => {
  if (hasRunStartup.current) return;
  hasRunStartup.current = true;

  const hasContent = /* ... some boolean ... */;
  const isAlreadySaved = /* ... some boolean ... */;

  if (hasContent && !isAlreadySaved) {
    projectsState.saveOrUpdateProject({ ... });
  }

  projectState.resetProject();                          // ← BUG: always runs
  useProjectsStore.setState({ activeProjectId: null }); // ← BUG: always runs
}, []);
```

**Step 3.** Replace the body of this `useEffect` with the fixed version below. Keep ALL existing local variables (`hasContent`, `isAlreadySaved`, and anything else already there) exactly as they are. Only change the conditional structure at the end:

```js
useEffect(() => {
  if (hasRunStartup.current) return;
  hasRunStartup.current = true;

  // --- Keep all existing variable declarations exactly as they are ---
  // const hasContent = ...
  // const isAlreadySaved = ...

  if (!isAlreadySaved) {
    // No project was intentionally opened — apply auto-save logic then reset
    if (hasContent) {
      projectsState.saveOrUpdateProject({
        id: null,
        name: 'Non terminé',
        status: 'En cours',
        receptionNumber: projectState.receptionNumber,
        vNumber: projectState.vNumber,
        date: projectState.date,
        typeIntervention: projectState.typeIntervention,
        institutionLines: projectState.institutionLines,
        repere: projectState.repere,
        alt: projectState.alt,
        lectureArriere: projectState.lectureArriere,
        pc: projectState.pc,
        profiles: projectState.profiles,
        logoClient: projectState.logoClient,
        logoEntreprise: projectState.logoEntreprise,
        logoBureau: projectState.logoBureau,
      });
    }
    projectState.resetProject();
    useProjectsStore.setState({ activeProjectId: null });
  }
  // If isAlreadySaved === true: a project was just intentionally opened via
  // handleOpenProject — do NOT reset anything.
}, []);
```

> **Important**: The `saveOrUpdateProject` call above must pass exactly the same fields that were there before. If the original call used different field names or fewer fields, preserve those exactly. The key structural change is wrapping BOTH the auto-save block AND the reset/clear calls inside `if (!isAlreadySaved) { ... }`.

**Step 4.** Do not change anything else in this file.

---

## Bug 2a — Light Theme: Status Badges in "Mes Chantiers" are Unreadable

### Symptom
In light mode, the status badges ("En cours", "Validé", "Archivé") on project cards in `app/projects.tsx` show dark green/blue/gray backgrounds with light-colored text — the text is barely visible or invisible against a white card.

### Root Cause
`app/projects.tsx` defines a module-level constant `STATUS_COLORS` with hardcoded dark-mode hex values. These never adapt to light mode.

### Fix — `app/projects.tsx`

**Step 1.** Open `app/projects.tsx` and read the entire file.

**Step 2.** Find the `STATUS_COLORS` constant (a plain object near the top of the file, outside any component).

**Step 3.** Delete the `STATUS_COLORS` constant entirely.

**Step 4.** In its place, add this pure function (also at module level, outside the component):

```ts
function getStatusStyle(status: string, isDark: boolean): { bg: string; text: string } {
  if (isDark) {
    if (status === 'En cours') return { bg: '#065f46', text: '#6ee7b7' };
    if (status === 'Validé')   return { bg: '#1e3a5f', text: '#93c5fd' };
    return { bg: '#374151', text: '#9ca3af' }; // Archivé / fallback
  } else {
    if (status === 'En cours') return { bg: '#d1fae5', text: '#065f46' };
    if (status === 'Validé')   return { bg: '#dbeafe', text: '#1e3a5f' };
    return { bg: '#f1f5f9', text: '#475569' }; // Archivé / fallback
  }
}
```

**Step 5.** Find the `useAppTheme()` call inside the component function. It currently destructures at minimum `{ colors }`. Add `isDark` to the destructure:

```ts
// Before:
const { colors } = useAppTheme();

// After:
const { colors, isDark } = useAppTheme();
```

If `isDark` is already destructured, skip this step.

**Step 6.** Find every usage of `STATUS_COLORS[item.status]` (or `STATUS_COLORS[proj.status]` — whatever the variable name is) in the JSX and replace it with `getStatusStyle(item.status, isDark)` (use the actual variable name in your file).

For example:
```tsx
// Before:
backgroundColor: STATUS_COLORS[item.status].bg
color: STATUS_COLORS[item.status].text

// After:
backgroundColor: getStatusStyle(item.status, isDark).bg
color: getStatusStyle(item.status, isDark).text
```

**Step 7.** Do not change anything else in this file.

---

## Bug 2b — Light Theme: Full Audit of `app/preview.tsx`

### Symptom
Some text or backgrounds in the preview screen may be invisible or very low contrast in light mode.

### Fix — `app/preview.tsx`

**Step 1.** Open `app/preview.tsx` and read the **entire** file (all lines).

**Step 2.** Check that `useAppTheme()` is imported and called. If it is not, add:
```ts
import { useAppTheme } from '@/src/hooks/useAppTheme';
// inside component:
const { colors, isDark } = useAppTheme();
```

**Step 3.** Search for every occurrence of these NativeWind color class patterns in `className` props:
- `text-slate-` followed by any number
- `text-white`
- `text-gray-` followed by any number
- `text-zinc-` followed by any number
- `bg-slate-` followed by any number
- `bg-gray-` followed by any number

For each occurrence, determine if it is on a surface that:
- **Is always dark by design** (e.g., the PDF viewer black background, a colored button with its own background color): leave it as-is.
- **Must adapt to theme** (e.g., body text, label text, card background): replace the NativeWind class with an inline `style` using the appropriate token from `src/theme/colors.ts`.

**Available tokens in `colors`** (from `src/theme/colors.ts`):
- `colors.text` — primary body text
- `colors.textMuted` — secondary / muted text
- `colors.textDim` — dimmer tertiary text
- `colors.background` — screen background
- `colors.surface` — card/panel background
- `colors.border` — border color
- `colors.accent` — amber accent (same in both themes)

**Step 4.** For any `Text` component with a hardcoded color class that must adapt:
```tsx
// Before:
<Text className="text-slate-300 ...">...</Text>

// After:
<Text className="..." style={{ color: colors.textMuted }}>...</Text>
```

**Step 5.** For any `View` with a hardcoded background class that must adapt:
```tsx
// Before:
<View className="bg-slate-800 ...">

// After:
<View className="..." style={{ backgroundColor: colors.surface }}>
```

**Step 6.** Do not change layout, spacing, font-size, or any non-color className.

---

## Section 5 — Mandatory Verification

After ALL changes in Sections 1–4 are complete, run these three commands **in the project root** (`c:\Users\USER\Documents\Study\self\FicheReception`):

### TypeScript check
```powershell
npx tsc --noEmit
```
Expected: exits 0, prints nothing (no errors).

### Lint check
```powershell
$env:EXPO_NO_TELEMETRY=1; npx expo lint
```
Expected: exits 0, prints no errors or warnings.

### Tests
```powershell
npm test
```
Expected: `Tests: 8 passed, 8 total` — zero failures.

**If any command fails**: fix the error before declaring done. Do not skip verification.

---

## Summary Checklist

- [x] `app/(tabs)/index.tsx` — reset calls wrapped inside `if (!isAlreadySaved)` block
- [x] `app/projects.tsx` — `STATUS_COLORS` replaced with `getStatusStyle()` function; `isDark` added to `useAppTheme()` destructure; all usages updated
- [x] `app/preview.tsx` — full audit; all theme-sensitive hardcoded color classes replaced with `style={{ color: colors.X }}` or `style={{ backgroundColor: colors.X }}`
- [x] `npx tsc --noEmit` → 0 errors
- [x] `$env:EXPO_NO_TELEMETRY=1; npx expo lint` → 0 warnings
- [x] `npm test` → 8 passed, 0 failed

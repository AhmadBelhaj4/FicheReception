# 📘 FICHE DE RÉCEPTION TOPOGRAPHIQUE — MASTER BLUEPRINT (A TO Z)
> **Comprehensive Project Specification, Technical Architecture, Status Audit, Commercial Product Roadmap, and Discovery Q&A**  
> *Target Platforms:* Android (Google Play Store) & iOS (Apple App Store)  
> *Initial Phase:* Bespoke field utility for surveyor use  
> *Target Product:* Premium, Commercial-Grade Topography & Civil Engineering SaaS Application  
> *Current Version:* Expo SDK 58 / React Native 0.88 / TypeScript / Zustand  
> *Date:* October 2026

---

## 📑 TABLE OF CONTENTS
1. [Executive Summary & High-Level Vision](#1-executive-summary--high-level-vision)
2. [Domain Knowledge & Civil Engineering Fundamentals](#2-domain-knowledge--civil-engineering-fundamentals)
3. [Existing Technical Architecture](#3-existing-technical-architecture)
4. [A-to-Z Feature Audit: What Has Been Done](#4-a-to-z-feature-audit-what-has-been-done)
5. [In-Progress Work & Recent Fixes](#5-in-progress-work--recent-fixes)
6. [Missing Components & Deficits for Store-Readiness](#6-missing-components--deficits-for-store-readiness)
7. [The Final Product Vision: What "World-Class" Looks Like](#7-the-final-product-vision-what-world-class-looks-like)
8. [Phase-by-Phase Roadmap (From Cousin Beta to App Store)](#8-phase-by-phase-roadmap)
9. [Vague Points & Critical Information Needed From You](#9-vague-points--critical-information-needed-from-you)

---

## 1. Executive Summary & High-Level Vision

### 1.1 The Genesis
The project began as an immediate, practical response to a real-world field problem faced by a land surveyor (your cousin) executing roadworks (*travaux de voirie*) and urban rehabilitation projects (*réhabilitation et rénovation urbaine*). 

On civil engineering construction sites, surveying teams use optical or digital levels to verify that the executed road base layer, curbs, and asphalt match the theoretical engineering design drawings before receiving sign-off and payment. Historically, this workflow is plagued by:
- Wet or dirty physical paper sheets carried in muddy field conditions.
- Manual mental or pocket-calculator arithmetic on the spot ($P.C. - LAV = Z_{pr}$ and $Z_{théo} - Z_{pr} = \Delta Z$).
- Severe risk of sign errors (confusing **Remblai** [fill] with **Déblai** [cut]).
- Hours wasted in the evening transcribing field notebooks into Excel or Word templates to produce official reports.

### 1.2 The Ambition: From Cousin's Field Tool to Global Store App
While this mobile application starts as a custom, tailored utility solving your cousin's daily headaches, it is designed from day one to evolve into a **commercial, polished, App Store and Google Play Store application** ("*Fiche Réception Topo Pro*").

To transition from a private prototype to a top-tier app on the stores:
1. **It must feel bulletproof**: Offline-first, zero latency, saving on every single keystroke, resilient against phone reboots, rain droplets on screens, and app backgrounding.
2. **It must produce certified deliverables**: The generated PDF must look indistinguishable from official government-contract forms (such as ARRUT, Ministry of Public Works, or major BTP engineering firms).
3. **It must feel premium and effortless**: Modern typography, tactile feedback, color-coded civil engineering metrics, instant previewing, and native one-tap sharing via WhatsApp, Email, or cloud drives.

---

## 2. Domain Knowledge & Civil Engineering Fundamentals

To build software for surveyors, the mathematical models, terminologies, and workflows must be understood down to the millimeter.

```
                      [ OPTICAL / DIGITAL LEVEL ]
                                 |  Line of Collimation
        Backsight (Lecture Arrière)       Foresight (Lecture Avant)
                 |                                  |
                 v                                  v
           [STAFF / MIRE]                     [STAFF / MIRE]
                 |                                  |
                 |                                  |
                 v                                  v
        ==================                  =================
         REPERE / BENCHMARK                  CROSS-SECTION POINT
          Altitude = ALT (Z)                 Measured = Z.pr
```

### 2.1 The Mathematical Model (Direct Differential Leveling)

1. **Benchmark / Repère de Référence**:
   - A fixed, immovable physical marker (concrete monument, geodetic pillar, bronze nail in sidewalk, or rock).
   - Has a known absolute altitude above sea level: $\text{ALT } (Z)$ in meters (e.g., $16.530\text{ m}$).

2. **Lecture Arrière ($LAR$ - Backsight)**:
   - The surveyor places the graduated staff (*mire*) vertically onto the known benchmark.
   - The level operator looks through the telescope and notes the reading in meters (e.g., $1.310\text{ m}$).

3. **Plan de Comparaison ($P.C.$ - Height of Instrument / Collimation Line)**:
   - The horizontal optical plane of the level's telescope.
   $$\mathbf{P.C. = ALT(Z) + LAR}$$
   *(Example: $16.530 + 1.310 = 17.840\text{ m}$)*. Every measurement taken from this instrument setup uses this constant $P.C.$

4. **Lecture Avant ($LAV$ - Foresight / Intermediate Sight)**:
   - The staff-holder moves to the roadway cross-section profile. Readings are taken across transverse stations.

5. **Cote Pratique / Cote Réception ($Z_{pr}$ - Measured Ground Elevation)**:
   - The actual physical altitude of the ground point as measured today on the terrain.
   $$\mathbf{Z_{pr} = P.C. - LAV}$$
   *(Example: If $P.C. = 17.840\text{ m}$ and $LAV = 1.420\text{ m}$, then $Z_{pr} = 17.840 - 1.420 = 16.420\text{ m}$)*.

6. **Cote Projet Théorique ($Z_{th\acute{e}o}$ - Design Elevation)**:
   - Extracted from the road design execution blueprints (*Plans d'exécution voirie / Profil en long / Profils en travers types*).
   - The required elevation where the finished road surface or base layer ought to be.

7. **Différence d'Altitude ($\Delta Z = Z_{th\acute{e}o} - Z_{pr}$)**:
   - The difference indicates what the earthmoving contractor must do:
   $$\mathbf{\Delta Z = Z_{th\acute{e}o} - Z_{pr}}$$
   - **Case $\Delta Z > 0$ (+ Positive) $\rightarrow$ REMBLAI (Fill)**: The actual ground is lower than the design elevation. Soil/aggregate must be brought in and compacted. (Displayed in **GREEN**).
   - **Case $\Delta Z < 0$ (- Negative) $\rightarrow$ DÉBLAI (Cut)**: The actual ground is higher than the design elevation. Soil must be excavated/milled down. (Displayed in **RED**).
   - **Case $\Delta Z = 0$ $\rightarrow$ CONFORME (On Grade)**: Perfect execution within construction tolerances.

### 2.2 Cross-Section Topography: 5 Reading Points per Profile
In the official standard form (*FCIHE DE RECEPTION TOPOGRAPHIQUE*), each roadway profile is not a single point, but a transverse slice across the road. The official deliverable records **5 distinct points** per profile:

| Point Code | French Technical Name | Practical Definition |
|---|---|---|
| **D2 (F)** | Droite 2 (Fond) | Extrémité Droite — Trench bottom / bedding layer under curbs (*couche de base sous caniveau*). Marked with `(F)` for *Fond*. |
| **D1** | Droite 1 | Intérieur Droite — Right gutter line / curb edge (*fil d'eau / bordure droite*). |
| **Axe** | Axe Central | Centerline of the road (*axe de la chaussée*). Crucial reference for cross-slopes and long-profile. |
| **G1** | Gauche 1 | Intérieur Gauche — Left gutter line / curb edge (*fil d'eau / bordure gauche*). |
| **G2 (F)** | Gauche 2 (Fond) | Extrémité Gauche — Trench bottom / bedding layer under curbs (*couche de base sous caniveau gauche*). |

> **Crucial Insight from Excel vs Official PDF:**  
> The simplified Excel sheet (`resource/RECEPTION TN .xlsx`) only used 3 columns (`D`, `A`, `G`), but the **official binding inspection PDF** (`resource/FCIHE DE RECEPTION TOPOGRAPHIQUE ENNOUR...pdf`) requires the **5-point structure** with vertical stacking and sub-rows.

### 2.3 Additional Survey Columns
- **Distance / Dévers (%)**:
  - *Dévers*: Cross-fall / transverse slope percentage across the pavement (e.g. $2.5\%$) designed for storm drainage runoff.
  - *Distance*: Linear chainage or station offset from start of section (e.g. $P1 = 0\text{ m}, P2 = 25\text{ m}, P3 = 50\text{ m}$).
  - *Nota 1 standard*: In rehabilitation, Dévers refers to the projected red line relative to existing gutters to be preserved.
- **Observation / Obstacle**:
  - Critical site notes: e.g., "*Regard pluvial à rehausser*", "*Poteau STEG à déplacer*", "*Bordure existante conservée*", "*Réseau ONAS apparent*".

---

## 3. Existing Technical Architecture

### 3.1 Technology Stack Matrix
```
┌────────────────────────────────────────────────────────┐
│               MOBILE CLIENT (iOS & Android)            │
│               Expo SDK 58.0.14 / React Native 0.88     │
├────────────────────────────────────────────────────────┤
│ Navigation:      Expo Router 58 (File-based)           │
│ State Store:     Zustand 5.0.15 (In-memory reactive)   │
│ Typing:          TypeScript 6.0.3                      │
│ Document Engine: expo-print (HTML5/CSS Print Engine)   │
│ Native Sharing:  expo-sharing                          │
│ Date Picking:    @react-native-community/datetimepicker│
│ Unique IDs:      expo-crypto (UUIDv4)                  │
└────────────────────────────────────────────────────────┘
```

### 3.2 File Tree & Component Directory
```
FicheReception/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx         # Tab container (tabs hidden for linear wizard flow)
│   │   ├── index.tsx           # [Étape 1] Header / Chantier details & date
│   │   └── two.tsx             # Unused template tab (hidden from tab bar)
│   ├── _layout.tsx             # Root navigation stack with theme & headers
│   ├── reference.tsx           # [Étape 2] Benchmark setup & live P.C. calculation
│   ├── profiles.tsx            # [Étape 3] List of profiles with Remblai/Déblai badges
│   ├── profile-edit.tsx        # [Étape 4] 5-point data entry, live diff calculation
│   ├── preview.tsx             # [Étape 5] PDF generation, print & share engine
│   ├── modal.tsx               # Standard modal screen
│   └── +not-found.tsx          # 404 handler
├── src/
│   ├── store/
│   │   └── useProjectStore.ts  # Centralized Zustand reactive state
│   ├── types/
│   │   └── index.ts            # ProfileData, ProjectState, HeaderData types
│   └── utils/
│       └── calculations.ts     # Pure functions: calculatePC, CotePratique, Difference
├── resource/
│   ├── STATUS.md               # Living operational status documentation
│   ├── deepseek_markdown...md  # Initial handover notes
│   ├── FCIHE DE RECEPTION...pdf# Ground-truth homologated inspection PDF
│   └── RECEPTION TN .xlsx      # Ground-truth civil engineer Excel spreadsheet
├── package.json
└── tsconfig.json
```

---

## 4. A-to-Z Feature Audit: What Has Been Done

Here is an exhaustive catalog of all features implemented, tested, and confirmed in code:

| Component / Layer | Features Implemented | Current Behavior |
|---|---|---|
| **Data Types** (`src/types/index.ts`) | Strict TypeScript contracts for `ProfileData` and `ProjectState`. | All 5 survey points (`d1, d2, axe, g1, g2`), `coteProjet`, `distance`, `devers`, `observation` are strictly typed (`number \| null` or `string`). |
| **Math Utility** (`src/utils/calculations.ts`) | Core surveying equations abstracted as pure, side-effect-free functions. | `calculatePC(alt, lar)`<br>`calculateCotePratique(pc, lav)`<br>`calculateDifference(coteProjet, cotePratique)` |
| **State Management** (`src/store/useProjectStore.ts`) | Centralized Zustand reactive store. | Automatic real-time recalculation of `pc` whenever `alt` or `lectureArriere` updates. CRUD profile actions (`addProfile`, `updateProfile`, `deleteProfile`, `resetProject`). |
| **Étape 1: Chantier Header** (`app/(tabs)/index.tsx`) | Official site metadata inputs. | Fields for *Réception N°*, *V N°*, *P N°*, *Date de réception* (via native calendar picker), and *Type d'intervention voirie projetée* (multiline). Navigates cleanly to Step 2. |
| **Étape 2: Repère & P.C.** (`app/reference.tsx`) | Benchmark definition and collimation plane computation. | Text and decimal inputs with bulletproof decimal sanitization (prevents losing `.` when typing). Displays prominent blue card showing live $P.C. = \text{ALT} + \text{LAR}$. Prevents moving to Step 3 until $P.C.$ is valid. |
| **Étape 3: Profiles Dashboard** (`app/profiles.tsx`) | Visual list of all measured cross-sections. | Displays profile cards (`PROFIL N° 1, 2...`), instant preview of Axe reading, Cote Projet, and colored difference badge (**+ Remblai** green vs **- Déblai** red). Delete confirmation dialogs with profile index awareness. Clean empty-state graphic when no profiles exist. |
| **Étape 4: Profile Editor** (`app/profile-edit.tsx`) | Deep measurement entry for a single cross-section. | 5 numeric inputs (`D2`, `D1`, `Axe`, `G1`, `G2`) grouped logically by Right side, Centerline, and Left side. Separate `Cote Projet` input. Live calculation table displaying practical cote and difference on every keystroke. Secondary inputs for `Dévers (%)`, `Distance (m)`, and `Observation`. |
| **Étape 5: PDF Generator** (`app/preview.tsx`) | Production-ready landscape A4 HTML-to-PDF compiler using `expo-print`. | Full landscape layout matching the institutional standard: Header, reference table, 5-row vertical profile blocks (`rowspan="5"`), colorized differences, official NOTA 1 & NOTA 2, and 3 signature blocks (*L'Entreprise Travaux, Bureau de Contrôle / Géomètre, Maître d'Ouvrage*). Direct print and native file share sheet. |

---

## 5. In-Progress Work & Recent Fixes

### 5.1 PDF Template Vertical Stacking (Resolved in Code)
- **Previous Flaw**: The prototype initially rendered 19 horizontal columns per profile on a single row, which broke printable page margins and did not reflect the paper form.
- **Current Solution**: Replaced with vertical sub-row layout:
  - Each profile spans **5 HTML table rows (`<tr>`)**.
  - `N° PROFIL`, `COTE PROJET`, `DISTANCE/DEVERS`, and `OBSERVATION` use `rowspan="5"`.
  - The `Axe` row is highlighted with a light-blue accent tint (`#f0f4ff`) and bold text.
  - Profile rows are separated by solid 2px horizontal borders (`.profile-last-row`).

### 5.2 Decimal Input Handling on Native Keyboards (Resolved in Code)
- **Previous Flaw**: In early React Native numeric inputs, typing a dot (`.`) or comma (`,`) on iOS/Android decimal keypads often got swallowed or erased because of immediate premature `parseFloat()` conversion on every character.
- **Current Solution**: The `NumInput` component retains raw string state while typing, converts commas to dots on the fly, allows trailing dots (`"16."`), and commits numeric values only on valid numerical states or on `onBlur`.

### 5.3 Android Keyboard Occlusion (Under Active Verification)
- In `app/profile-edit.tsx`, `KeyboardAvoidingView` was updated with `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}` and `keyboardVerticalOffset={Platform.OS === 'android' ? 25 : 0}` to prevent the on-screen keypad from covering the bottom input fields.

---

## 6. Missing Components & Deficits for Store-Readiness

To make this app ready for commercial release on Google Play and Apple App Store, several critical engineering layers still need to be built.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   COMMERCIAL STORE GAP ANALYSIS                        │
├────────────────────────────┬───────────────────────────────────────────┤
│ 1. DATA PERSISTENCE        │ Current: In-memory only (Lost on quit)    │
│                            │ Needed: Local SQLite / WatermelonDB / MMKV│
├────────────────────────────┼───────────────────────────────────────────┤
│ 2. PROJECT MANAGEMENT      │ Current: Single active project            │
│                            │ Needed: Multi-chantier archive & drafts   │
├────────────────────────────┼───────────────────────────────────────────┤
│ 3. SURVEYING REALITIES     │ Current: Only 1 fixed instrument station  │
│                            │ Needed: Multiple stations (Stations P.C.) │
├────────────────────────────┼───────────────────────────────────────────┤
│ 4. TOLERANCE ENGINE        │ Current: Only positive/negative colors    │
│                            │ Needed: Tolerance range (e.g. ±20mm)      │
├────────────────────────────┼───────────────────────────────────────────┤
│ 5. EXPORT FLEXIBILITY      │ Current: PDF only                         │
│                            │ Needed: Excel (.xlsx), CSV, DXF export    │
├────────────────────────────┼───────────────────────────────────────────┤
│ 6. BRANDING & QUALITY      │ Current: Generic Expo default shell       │
│                            │ Needed: App icon, splash, custom logos    │
└────────────────────────────┴───────────────────────────────────────────┘
```

### 6.1 Critical Architectural Deficit: Lack of Local Persistence
- **The Problem**: Right now, the entire app state lives exclusively in RAM inside the Zustand store (`useProjectStore.ts`). If the user leaves the app to take a phone call on the job site and Android OS kills background memory, or if the battery dies, **all measurements are permanently lost**.
- **The Solution Needed**: Integrate an offline-first storage engine (e.g., `AsyncStorage`, `react-native-mmkv`, or SQLite via `expo-sqlite`). Every keystroke in Step 1, 2, and 4 must auto-save locally within 100 milliseconds.

### 6.2 Missing Multi-Project / Multi-Chantier Manager
- **The Problem**: Currently, clicking "Nouveau Chantier" wipes the state with `resetProject()`. A professional surveyor manages 5 to 10 different sites simultaneously (e.g., "*Lot 3 Boulevard Ennour*", "*Rocade Ouest*", "*Zone Industrielle*").
- **The Solution Needed**: A top-level Project List Screen (Dashboard) displaying:
  - Chantier Name, Date, Status (Draft vs Completed/Exported).
  - Search and filter bar.
  - Clone, edit, archive, and delete project capabilities.

### 6.3 Topographic Deficit: Multi-Station / Station Tournante (Rayonnement)
- **The Problem**: In real surveying, if a road segment is 400 meters long, the level cannot see all profiles from a single setup (max reliable optical sighting distance is typically 40–50 meters). The surveyor must perform a **Changement de Station** (Instrument relocation).
  - The level moves to Setup 2.
  - A new Backsight reading ($LAR_2$) is taken on a turning point ($PC_2$).
  - Profiles 1 to 5 belong to $PC_1$; Profiles 6 to 11 belong to $PC_2$.
- **Current Limitation**: The app assumes 1 global $P.C.$ for all profiles in the project.

### 6.4 Missing Construction Tolerance Engine
- In public works specifications (*Cahier des Clauses Techniques Particulières - CCTP*), acceptable civil engineering tolerances are strictly bounded (e.g., $\pm 10\text{ mm}$ for sub-base layer, $\pm 5\text{ mm}$ for asphalt).
- If $\Delta Z = +0.003\text{ m}$ ($+3\text{ mm}$), it should show as **Valid / Green**, not flagged as needing fill.
- The app needs user-configurable tolerance thresholds:
  - Within tolerance: **GREEN / OK**
  - Out of tolerance: **RED / NON-CONFORME**

### 6.5 Missing Photo & GPS Evidence
- On modern construction sites, supervisors demand photo evidence of obstacles (e.g., broken underground pipes, tree roots, concrete curbs).
- Missing: Camera integration to attach 1–2 geotagged photos per profile directly into the report.

### 6.6 Multi-Page PDF Pagination Engine
- When a survey has 15 or 30 profiles, an HTML-rendered table will split across multiple pages. Without custom CSS page-break rules (`page-break-inside: avoid; page-break-after: always;`), profile tables can be sliced in half across physical paper pages.

---

## 7. The Final Product Vision: What "World-Class" Looks Like

When published to the Play Store and App Store, this application will stand as the benchmark mobile utility for civil engineering topography in the Francophone and international market.

### 7.1 Visual & Interactive Experience (UI/UX)
- **Field-Ready Design System**: High-contrast mode optimized for bright outdoor daylight; deep slate `#0f172a`, vibrant engineering amber `#f59e0b`, high-visibility emerald `#10b981`, and danger red `#ef4444`.
- **Large Tactile Numpad / Custom Input Keyboard**: Field surveyors often wear work gloves or hold the phone with one thumb while holding a rod or clipboard. A custom, ergonomic numpad with large target keys, tactile haptic vibrations (`expo-haptics`), and instant `Next Field` jumping makes data entry 3x faster than standard phone keyboards.
- **Topographic Visual Profile Cross-Section**: An interactive SVG graphic showing the transverse shape of the road based on the 5 entries, instantly displaying the crown slope (*pente en toit*) or one-way slope.

### 7.2 Export & Enterprise Deliverables
- **Official Homologated PDF**:
  - Upload custom enterprise logo (e.g., contractor logo top-left, inspection bureau logo top-right).
  - Configurable signature blocks with on-screen digital signatures (*signature tactile au doigt*).
  - Embedded GPS coordinates and Google Maps QR code linking to exact site location.
- **Direct Excel / CSV Export**:
  - Surveyors and engineers do not only want PDFs; design offices need raw data to import into AutoCAD, Covadis, or Civil 3D. One-tap export to formatted `.xlsx` with active formulas intact.

---

## 8. Phase-by-Phase Roadmap

```
PHASE 1 (Current)           PHASE 2 (Beta Polish)       PHASE 3 (Commercial Launch)
• Core 4-step wizard        • SQLite local auto-save    • Multi-project dashboard
• 5-point profile math      • Multi-station P.C.        • Cloud backup & sync
• Live Remblai/Déblai       • Multi-page PDF pagination • In-app purchases / Pro tier
• Expo-print PDF export     • Excel (.xlsx) export      • App Store & Play Store publish
• Field testing with cousin • Configurable tolerances   • Custom branding / logos
```

### Phase 1: Operational Field Beta (Current State)
- Fully functional for your cousin's primary workflow.
- Complete 5-point data entry, instant calculations, and PDF generation with vertical row stacking.
- Used on live sites to discover real-world edge cases.

### Phase 2: Professionalization & Persistence (Pre-Launch)
1. Add `expo-sqlite` or persistent storage layer so data is never lost.
2. Build Multi-Project manager (save, load, list, delete drafts).
3. Implement `xlsx` export alongside PDF.
4. Support multi-page PDF pagination with repeating table headers.
5. Add customizable tolerance settings (e.g., $\pm 1.5\text{ cm}$).

### Phase 3: Store Launch & Monetization (Production Release)
1. App Store & Google Play metadata (icons, splash screens, privacy policy, localized French/English descriptions).
2. Freemium / Monetization model:
   - *Free Tier*: 3 fiches per month with standard template.
   - *Pro Subscription*: Unlimited fiches, custom company logos, Excel export, cloud sync, team sharing.
3. Crash reporting via Sentry and anonymous telemetry via PostHog.

---

## 9. Vague Points & Critical Information Needed From You

To ensure future development aligns with your vision, please review the following technical and business questions:

### ❓ Question 1: Instrument Stations (Single vs Multi-Station)
> *In your cousin's standard field work, does he complete a whole fiche from a **single level setup** (one P.C. for all profiles), or does he frequently move the instrument and need **multiple P.C. values** within the same fiche?*

### ❓ Question 2: Point Variability per Profile
> *Is every single profile strictly composed of 5 points (`D2(F), D1, Axe, G1, G2(F)`), or are there profiles where only 3 points (`D, Axe, G`) or additional sidewalk/shoulder points (`D3, G3`) exist?*

### ❓ Question 3: Number of Profiles per Document
> *Typically, how many profiles exist on a single Fiche de Réception? Is it usually 5 to 10 profiles (which fits on one A4 page), or does it reach 20 to 50 profiles requiring multi-page pagination?*

### ❓ Question 4: Data Deliverables Required
> *Beyond the official PDF report, is generating an **Excel (.xlsx)** or **CSV** file required by your cousin's clients or design offices?*

### ❓ Question 5: Company Branding & Customization
> *Does your cousin or the future store users need to put their own company name, company logo, and custom inspector titles on the header and signature blocks of the PDF?*

### ❓ Question 6: Target Monetization Model for the Store
> *When we publish to the Play Store and App Store, do you envision:*
> - A 100% free app (with optional ads or donations)?
> - A paid upfront app (e.g. $9.99)?
> - A freemium subscription model (e.g. $4.99/month for unlimited exports + cloud sync)?

---

## 10. Summary Checklist for Developers & Collaborators

- [x] Mathematics verified against civil engineering standards ($P.C. = \text{ALT} + \text{LAR}$; $Z_{pr} = P.C. - LAV$; $\Delta Z = Z_{th\acute{e}o} - Z_{pr}$).
- [x] Color coding strictly adheres to conventions: **Green = Remblai** ($\Delta Z > 0$), **Red = Déblai** ($\Delta Z < 0$).
- [x] 5-point cross-section data model implemented.
- [x] PDF template uses vertical sub-row layout matching official ARRUT form.
- [ ] SQLite local persistence implementation (Priority 1).
- [ ] Multi-project management dashboard (Priority 2).
- [ ] Multi-page printing and table split rules (Priority 3).
- [ ] Play Store / App Store packaging and production build configurations (Priority 4).

*(This document serves as the permanent, living single source of truth for the project.)*

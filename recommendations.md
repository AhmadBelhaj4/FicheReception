# FicheReception — Future Technical & Functional Recommendations

This document outlines strategic recommendations for the future development of **FicheReception** (Fiche de Réception Topographique). It covers architecture, feature additions, user experience improvements, and engineering best practices tailored to civil engineering and topographic field surveys.

---

## 1. Multi-Project & History Management

### Current State
The app currently supports a single active project stored in `AsyncStorage` via Zustand's `persist` middleware. Clicking *"Nouveau Chantier"* resets the active project and overwrites existing data.

### Recommendations
* **Project Archive / History**:
  * Transition from a single-project store to a multi-project repository model (e.g. `projects: Record<string, ProjectState>` or an `expo-sqlite` database).
  * Add a "Mes Chantiers" dashboard screen displaying recent surveys with status pills (`En cours`, `Validé`, `Archivé`), date, reception number, and profile count.
* **Store Versioning & Migrations**:
  * When updating schema fields (e.g., adding GPS coordinates or contractor contact info), implement Zustand's `version` and `migrate` callback to prevent data corruption across app updates:
    ```typescript
    persist(..., {
      name: 'fiche-reception-storage',
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          // migrate schema safely
        }
        return persistedState;
      }
    })
    ```
* **Offline Backup & Restore**:
  * Provide an export/import option as a `.json` backup file via `expo-sharing` and `expo-document-picker` so surveyors can back up or transfer chantiers between devices without cloud reliance.

---

## 2. Advanced Topographic Calculations & Validation

### Current State
The app handles standard leveling calculations:
- $P.C. = ALT(Z) + LAR$
- $\text{Cote Pratique} = P.C. - \text{Lecture Avant}$
- $\text{Différence} = \text{Cote Projet} - \text{Cote Pratique}$ (Remblai / Déblai)

### Recommendations
* **Transverse Slope / Dévers Auto-Calculation**:
  * Given horizontal offsets (distances from axis to D1/G1) and vertical differences, automatically calculate the cross slope percentage ($\text{Pente} = \frac{\Delta H}{D} \times 100\%$) and flag deviations against project tolerance (e.g. $\pm 0.5\%$).
* **Outlier & Sanity Checks**:
  * Warn the surveyor if a reading has an unexpected discrepancy (e.g., $15.300\,\text{m}$ entered as $1.530\,\text{m}$ or sudden jump $> 50\,\text{cm}$ between consecutive cross sections).
* **Tolerance Status per Point**:
  * In addition to displaying "+ Remblai" / "- Déblai", add a customizable tolerance threshold (e.g., $\pm 1\,\text{cm}$ or $\pm 2\,\text{cm}$). Display a green checkmark if within civil engineering tolerance, or an amber alert if out of spec.
* **Unit Test Suite**:
  * Add Jest unit tests for `src/utils/calculations.ts` covering edge cases, rounding precision (3 decimal places for optical/digital levels), negative readings, and null-safety.

---

## 3. PDF Reporting, Digital Signatures & Branding

### Current State
`expo-print` renders an HTML table matching the ARRU standard, and `expo-sharing` distributes the PDF.

### Recommendations
* **In-App Digital Signatures**:
  * Civil works reception sheets require signatures from 3 parties:
    1. *L'Entreprise Travaux*
    2. *Bureau de Contrôle / Géomètre*
    3. *Maître d'Ouvrage / Client*
  * Integrate `react-native-signature-canvas` in a modal to capture finger/stylus signatures directly on the device and embed them as base64 images into the PDF signature boxes before final export.
* **Company Logo & Custom Header**:
  * Allow users to upload or select their enterprise/bureau logo in a settings modal, dynamically rendering it in the top header of the generated PDF.
* **Multi-Page Pagination Handling**:
  * When a survey has many profiles (e.g. 15+ profiles), CSS page breaks (`page-break-inside: avoid;`) should ensure that a 5-row profile is never split across two separate printed sheets.

---

## 4. Data Interoperability & CAD Export

### Current State
The app exports exclusively to PDF.

### Recommendations
* **CSV / Excel (.xlsx) Export**:
  * Surveyors and design offices frequently need raw numbers in Excel or CAD leveling spreadsheets.
  * Add a button to export CSV/Excel with tabular columns:
    `[Profil_N°, Point, Lect_Av, Cote_Prat, Cote_Proj, Diff, Devers, Distance, Obs]`
* **LandXML / DXF Generation**:
  * Provide LandXML or basic DXF cross-section polylines for direct import into AutoCAD, Covadis, or Mensura software.

---

## 5. Hardware Integration & Field Usability

Topographic surveys are conducted outdoors in high-glare, noisy, and challenging environments.

### Recommendations
* **GPS & Geotagging (`expo-location`)**:
  * Capture GPS coordinates (latitude, longitude, altitude) for the reference benchmark (Borne/Point Fixe) and each profile point.
  * Enable viewing surveyed points on a satellite map overlay (`react-native-maps`).
* **Photo Attachments for Non-Conformities (`expo-image-picker`)**:
  * Allow taking field photos of obstacles (e.g., manholes, existing utility pipes, damaged curbs) and attaching them to the profile observation.
  * Append photos to an "Annexe Photographique" page in the PDF report.
* **Haptic Feedback (`expo-haptics`)**:
  * Provide tactile haptic feedback on keypad input and profile creation for confident entry when wearing work gloves.
* **Profile Duplication / Auto-Increment**:
  * Add a "Dupliquer le profil précédent" button. On standard road projects, many parameters (design level, step distance, dévers) change incrementally from the previous profile, speeding up data entry on site.

---

## 6. Implementation Roadmap

| Phase | Focus | Key Deliverables |
|:---:|---|---|
| **Phase 1** *(High Impact)* | **Multi-Chantier & Backups** | Project list screen, project archiving, JSON import/export, tolerance indicators ($\pm \text{tolérance}$). |
| **Phase 2** *(Field Workflow)* | **Signatures & CSV Export** | Digital signature modal, CSV export for Excel/CAD, photo attachments for obstacles. |
| **Phase 3** *(Advanced Topo)* | **GPS & Dévers Engine** | GPS stamping with `expo-location`, transverse slope calculation, automated anomaly alerts. |
| **Phase 4** *(Ecosystem)* | **Custom Branding & Cloud Sync** | Logo upload, optional cloud sync (Supabase / Firebase), CAD LandXML export. |


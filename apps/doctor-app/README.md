# MyDoctor24 — Doctor App (Phase 1, React Native)

React Native (Expo + TypeScript) doctor app for the MYDR24 ecosystem: **Acute Care · Chronic Care · Virtual IPD · RPM/Elderly**. It's built from [`docs/MYDR24-Master-Specification-v3.0.pdf`](../../docs/MYDR24-Master-Specification-v3.0.pdf) (screen IDs match §18/§19 of that spec).

> **Demo build. It uses fictional data, an in-memory store, and has no backend.** It's not for clinical use. Thresholds, red-flag lists and triage logic are drafts that the Clinical Governance Committee must approve.

## Run on Windows
1. Install **Node.js LTS** (20 or 22) from nodejs.org.
2. In PowerShell:
   ```powershell
   cd apps\doctor-app
   npm install
   npx expo install --fix      # aligns package versions to your Expo SDK
   npx expo start
   ```
3. Open the app:
   - **Phone:** install **Expo Go** (Android/iOS) and scan the QR code.
   - **Browser:** press `w` (Edge/Chrome).
   - **Android emulator:** press `a`.
4. Login: enter any 10-digit mobile number, tap **Send OTP**, then enter **any 6-digit OTP**.

## What's built (≈ 38 routes covering 60+ spec screen IDs)
| Module | Screens |
|---|---|
| Unified | Dashboard with pathway tabs + critical strip (UD-D-01), patient header (UD-D-02), transitions (UD-D-03), event inbox (UD-D-04) |
| Virtual IPD | Login (D-01), census (D-03), eligibility with hard-stops + capacity guard (D-04), consent (D-05), baseline + live NEWS2 (D-06), goals of care (D-07), care team (D-08), care plan (D-09), devices (D-10), ICU monitor (D-12, view-only), results (D-13), chart (D-14), trends (D-15) |
| Orders | Med reconciliation (D-16), e-Rx & MAR (D-17), CPOE with allergy / duplicate / high-alert / home-ineligible checks (D-18/19) |
| Rounds | Overnight review (D-20), tele-round (D-21), SOAP note with labelled AI draft (D-22) |
| Alerts | Alert detail (D-24), emergency response console (D-25), escalation (D-26), hospital handover (D-27) |
| Team | Shift handover I-PASS (D-28), chat (D-29), family update with consent filtering (D-30) |
| Discharge | 3-step discharge → Chronic / RPM continuity (D-32) |
| Acute | Intake queue (AC-D-01), red flags + triage (AC-D-02/03), consultation workspace with exceptions (AC-D-04…10), closure (AC-D-11) |
| Chronic / RPM | Chronic & RPM worklists (CC-D-01/02, RM-D-02), reassessment decision (CC-D-12), longitudinal trends |
| More | Screen catalogue (built vs planned), audit log & transition register |

The **More → Screen catalogue** screen lists all 69 Phase-1 doctor screen IDs and marks each as built or planned.

## Safety rules the code enforces
- Emergency button on every patient header. Red flags or "not sure" route to the emergency console immediately.
- Emergency events have no acknowledgement timer. Emergency and urgent events can't be snoozed. There are no swipe-to-acknowledge gestures.
- Virtual IPD is only entered through eligibility (D-04):
  - A hard exclusion blocks admission.
  - Soft overrides need a written reason.
  - The capacity guard stops over-admission.
- Data freshness labels (Live / Current / Stale / Missing). Stale data is greyed out, and trend gaps aren't filled in.
- Device failure, notification-delivery failure and clinical deterioration are separate event types.
- CPOE blocks home-ineligible drugs (vasopressors, infusions, blood products) and allergy conflicts. High-alert drugs need a second confirmation.
- Family updates go only to consented contacts, within their consent scope.
- Every pathway transition records trigger, rationale, authoriser, outstanding tasks and handover status. AI can only draft.
- The emergency console adapts to code status (Full / Limited / DNR / unknown).

## Structure
```
src/
  theme/tokens.ts        design tokens (visual match to MyDoctor24 canvases – replace with Figma values)
  types/models.ts        domain model (FHIR R4-aligned)
  data/mock.ts           fictional patients/events      data/formulary.ts  demo formulary
  utils/clinical.ts      NEWS2 (RCP 2017), freshness, time helpers
  store/AppStore.tsx     context + reducer, audit trail
  components/ui.tsx      Screen, Card, Button, Pill, Segmented, Stepper, CheckRow, Field, Banner, Choice …
  components/clinical.tsx PatientHeader, PathwayChip, CodeStatusChip, VitalTile, FreshnessDot, News2Badge, EventRow, TrendChart
  navigation/            stack + tabs, typed params
  screens/               auth · home · patients · admission · orders · rounds · alerts · team · discharge · acute · chronic · more
```

## Not yet built / next steps
- **Remaining planned screens:** D-11 alarm thresholds, D-31 analytics, CC-D-03…09/13/14/16, RM-D-01/04, SP-D-01.
- **Integrations still to do:**
  - Backend APIs (master spec §14)
  - Real video SDK (LiveKit / Agora / 100ms)
  - FHIR server + ABDM
  - Push notifications
  - Secure storage
  - Biometric sign-off
- **Theme:** replace `theme/tokens.ts` with the exact Figma tokens once Figma access is available.
- **Testing:** unit tests (NEWS2, eligibility rules), E2E tests (Detox/Maestro) for the critical journeys, and a clinician usability test.

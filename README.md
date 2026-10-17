# MYDR24 — Virtual Hospitalization & Unified Care Ecosystem

MyDoctor24 (MYDR24) is a clinically governed digital-health platform with four care pathways that share one patient record:

| Pathway | Code | Purpose |
|---|---|---|
| Acute Care | `ACU` | Assessment and treatment of new or worsening problems (red-flag first) |
| Chronic Care Management | `CCM` | Long-term, programme-based care (HTN, diabetes, heart failure, CKD, COPD …) |
| Virtual Hospitalization / Virtual IPD | `VIPD` | Hospital-level care at home for selected, formally admitted patients |
| Remote Patient Monitoring / Elderly Care | `RPM` | Device-based or manual monitoring with honest service levels |

> **Status:** Stage 1 specification (draft for approval) and the Phase 1 Doctor app (demo build with fictional data). Clinical content must be approved by the MYDR24 Clinical Governance Committee before use with patients.

## Repository layout
```
docs/                     specifications (start with the PDF)
  MYDR24-Master-Specification-v3.0.pdf   ← consolidated master spec + Annexes A–D
  MYDR24-Master-Specification-v3.md      master spec source
  annex-a-…research.md                   evidence & market research
  annex-b-…platform-ecosystem-spec.md    platform, devices, architecture, NFRs, budget
  annex-c-…doctor-app-screen-spec.md     Virtual IPD doctor screens D-01…D-32
  annex-d-…chronic-care-spec.md          Chronic Care & longitudinal RPM
apps/
  doctor-app/             React Native (Expo + TypeScript) Doctor app – Phase 1
tools/                    PDF build + offline type-check helpers
```

## Quick start — Doctor app
```bash
cd apps/doctor-app
npm install
npx expo install --fix
npx expo start          # press w for browser, or scan QR with Expo Go
```
Login: any 10-digit mobile number, then any 6-digit OTP. See [apps/doctor-app/README.md](apps/doctor-app/README.md).

## Roadmap (from master spec §21)
| Phase | Scope | Status |
|---|---|---|
| 0 | Master specification & approvals | Draft ready – awaiting approval |
| 1 | Doctor app (69 screens) | **38 routes built** (≈ 60 screen IDs); remainder listed in-app (More → Screen catalogue) |
| 2 | Caregiver / Nursing app | Not started |
| 3 | Patient / Family app | Not started |
| 4 | Allied professionals (physio, dietitian …) | Not started |
| 5 | Integration, backend, validation | Not started |

## Known limitations
- The design tokens are a visual match to the shared MyDoctor24 canvases only. They haven't been checked against Figma yet.
- There's no backend yet. The app uses an in-memory store and demo data, and video calls are placeholders.
- The app hasn't been run on a device yet. Code was written in a sandbox without npm access, and it passes an offline TypeScript check and NEWS2 unit checks.

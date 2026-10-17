# Virtual Hospital at Home — Ecosystem & Mobile Application Development Specification

| Item | Detail |
|---|---|
| Document | Product, Technical & Clinical-Operations Specification |
| Version | 1.0 (Draft for review) |
| Date | 17 October 2026 |
| Primary market | India (designed to extend to US/UK/GCC) |
| Companion doc | `virtual-hospitalization-research.md` (evidence & market research) |
| Status | Ready for stakeholder review → architecture sign-off → sprint planning |

---

## Table of Contents
1. Executive Summary
2. Vision, Scope & Care Tiers
3. Ecosystem Map & Stakeholders
4. Clinical Operating Model & Patient Journey
5. Product Suite (Mobile, Web, Edge)
6. Detailed Mobile App Specifications
7. Medical Device Ecosystem & Integration
8. System Architecture
9. Monitoring, Early-Warning & Escalation Engine
10. Data Model & Interoperability (FHIR / ABDM)
11. API & Event Design
12. Technology Stack
13. Security, Privacy & Regulatory Compliance
14. Non-Functional Requirements
15. Low-Connectivity & Power-Failure Strategy
16. UX & Accessibility Guidelines
17. AI/ML Roadmap
18. Testing, Validation & Clinical Pilot
19. Delivery Roadmap
20. Team Structure
21. Indicative Budget
22. Business Model & KPIs
23. Risk Register
24. Appendices

---

## 1. Executive Summary

The platform lets a hospital, or a home-care provider working with one, **admit patients to a virtual bed at home** and run their care to the same clinical standard as an inpatient ward. Patients who need intensive monitoring get an ICU-grade monitoring tier. The ecosystem has:

- **6 apps:**
  - Patient app
  - Caregiver app
  - Field Clinician app (nurse/paramedic/phlebotomist)
  - Doctor app (hospitalist/intensivist)
  - Command Centre web console
  - Partner & Admin portals
- A **Home Hub** edge device that collects data from medical devices and stays connected even when the internet drops.
- A **cloud clinical platform** that handles vitals streaming, early-warning scoring, orders and medication administration (eMAR), logistics, billing, and FHIR/ABDM interoperability.
- A **24×7 virtual command centre** staffed by monitoring nurses and doctors.

**Clinical guardrail (non-negotiable):** the platform *monitors* at ICU level. It does **not** replace an ICU for acutely unstable patients. Every patient has a guaranteed escalation-and-transfer pathway (Section 9.4).

**Target outcomes (Year 1 pilot):**
- Cost per episode ≥ 30% lower than inpatient.
- Unplanned escalation < 10%.
- Mean time for staff to acknowledge a critical alarm < 60 seconds.
- Patient satisfaction (NPS) > 60.
- No preventable deaths attributable to delayed escalation.

---

## 2. Vision, Scope & Care Tiers

### 2.1 Vision
*"Any bed can be a hospital bed."* Deliver safe, hospital-grade care at home by combining continuous monitoring, virtual physicians, in-person clinical teams and fast escalation.

### 2.2 Care Tiers

| Tier | Name | Typical patients | Monitoring | Human touchpoints | Typical stay |
|---|---|---|---|---|---|
| **T0** | Remote Monitoring / Post-discharge | Post-discharge for CHF, COPD, diabetes, post-op | Spot checks 2–4×/day | Tele-consult as needed | 14–90 days |
| **T1** | **Virtual IPD (Ward-level)** | Pneumonia, cellulitis, UTI/pyelo, CHF/COPD exacerbation, dehydration, low-risk DVT/PE | Continuous wearable plus BP every 1–4 h | Daily video MD round; ≥ 2 RN/paramedic visits/day | 3–7 days + 30-day follow-up |
| **T2** | **High-Dependency / Step-down** | Early ICU discharge, post-major surgery, stable NIV users | Continuous multipara monitor with waveforms, ECG, capnography (optional) | MD round twice a day; 12–24 h nurse at home | 3–14 days |
| **T3** | **Chronic Home ICU** | Long-term ventilator or tracheostomy, neuro-rehab (stroke/TBI/ALS), palliative high-dependency | Ventilator telemetry, multipara monitor, continuous SpO₂/EtCO₂ | 24×7 ICU-trained nurse; intensivist round every day or two | Weeks–months |
| ✖ | **Out of scope (must stay or go to hospital ICU)** | Vasopressors, new invasive ventilation, active bleeding needing blood products, unstable arrhythmia, continuous high-risk drips | — | — | — |

### 2.3 In Scope (v1.0)
- Referral, eligibility screening, virtual admission, daily care delivery, monitoring, escalation, discharge, follow-up.
- Equipment logistics, medicine and lab logistics, billing/claims, analytics.
- Integration with hospital HIS/EHR, labs, pharmacies, ambulance services and ABDM.

### 2.4 Out of Scope (v1.0)
- An in-house e-pharmacy licence. The platform uses partner pharmacies.
- Diagnostic AI that makes decisions on its own. AI only gives *decision support*, with a clinician in the loop.
- Paediatric and obstetric tiers (planned for v2.0).

---

## 3. Ecosystem Map & Stakeholders

```
                       ┌────────────────────────────┐
                       │   INSURERS / TPAs / GOVT   │
                       │ (PM-JAY, CGHS, private)    │
                       └──────────────┬─────────────┘
                                      │ pre-auth, claims
┌──────────────┐  referral   ┌────────▼─────────┐  orders/results  ┌──────────────┐
│ HOSPITALS    │────────────▶│                  │◀────────────────▶│ LABS / POC   │
│ ED/IPD/ICU   │◀────────────│  VIRTUAL HOSPITAL│                  └──────────────┘
│ (HIS / EHR)  │ escalation  │  PLATFORM        │  e-Rx / delivery ┌──────────────┐
└──────────────┘             │  + 24×7 COMMAND  │◀────────────────▶│ PHARMACIES / │
┌──────────────┐  data       │  CENTRE          │                  │ HOME INFUSION│
│ ABDM / ABHA  │◀───────────▶│                  │  dispatch        └──────────────┘
│ (HIE-CM)     │  consent    │                  │◀────────────────▶┌──────────────┐
└──────────────┘             └──┬────┬────┬─────┘                  │ AMBULANCE /  │
                                │    │    │                        │ 108 / private│
          ┌─────────────────────┘    │    └──────────────┐         └──────────────┘
          ▼                          ▼                   ▼
┌──────────────────┐   ┌────────────────────┐  ┌──────────────────┐ ┌──────────────┐
│ PATIENT +        │   │ FIELD CLINICIANS   │  │ VIRTUAL DOCTORS  │ │ DEVICE / DME │
│ CAREGIVER        │   │ RN, paramedic,     │  │ Hospitalist,     │ │ VENDORS      │
│ Home Hub+Devices │   │ phlebotomist, physio│ │ intensivist,     │ │ (rental,     │
└──────────────────┘   └────────────────────┘  │ specialists      │ │ maintenance) │
                                               └──────────────────┘ └──────────────┘
```

| Stakeholder | Needs | Touchpoint |
|---|---|---|
| Patient | Safety, comfort, clarity, a quick way to get help | Patient App, Home Hub tablet, SOS button |
| Caregiver / family | Updates, task guidance, emergency help | Caregiver App |
| Field clinician | Route, tasks, documentation, offline use | Field Clinician App |
| Virtual doctor | Patient list, trends, orders, video | Doctor App + Command Centre |
| Command-centre nurse | Real-time alarms, triage, escalation | Command Centre Console |
| Hospital partner | Bed capacity, referral, outcomes, revenue | Partner Portal, HIS integration |
| Lab / pharmacy / ambulance | Orders, dispatch, status | Partner Portal / APIs |
| Insurer / TPA | Pre-auth, documentation, outcomes | Claims API / Portal |
| Ops / admin | Inventory, staffing, SLAs, finance | Admin Portal |
| Regulator / auditor | Audit trail, consent, data protection | Audit exports |

---

## 4. Clinical Operating Model & Patient Journey

### 4.1 End-to-End Journey

```
Referral ─▶ Eligibility ─▶ Consent ─▶ Home Setup ─▶ Virtual Admission ─▶ Daily Care Loop ─▶ Discharge ─▶ 30-day Follow-up
 (ED/IPD/    (clinical +     (e-consent   (≤ 4 h: devices,  (MD admission     (rounds, visits,     (summary,    (T0 RPM,
  OPD/GP)     home safety)    + ABHA link)  hub, meds, kit)   note, orders)     monitoring, labs)    e-Rx, pickup) tele-consult)
                                                                       │
                                                                       ▼
                                                           Escalation ─▶ Hospital transfer
```

### 4.2 Step Detail & SLAs

| Step | Owner | SLA | System support |
|---|---|---|---|
| Referral received | Hospital ED/IPD doctor | — | Referral form (Partner Portal/HIS), auto-fetch of records |
| Eligibility decision | Admitting physician | ≤ 60 min | Eligibility checklist (Appendix A), risk score, geo-fence check |
| Consent & onboarding | Coordinator | ≤ 30 min | e-Consent (video + OTP/Aadhaar e-sign), ABHA linking |
| Home setup | Field team | ≤ 4 h from decision | Kit checklist, device pairing wizard, connectivity test |
| Admission note & orders | Physician | Before patient leaves hospital, or within 1 h of arrival | Order sets per condition |
| First in-home RN visit | Field RN | ≤ 2 h after arrival | Field App task |
| Daily MD round | Physician | 1×/day (T1), 2×/day (T2) | Video round, trends summary |
| In-person visits | RN/paramedic | ≥ 2/day (T1) | Route optimisation |
| Labs | Phlebotomist / POC | Results ≤ 4 h (routine), ≤ 60 min (urgent POC) | Lab orders & results (FHIR) |
| Meds delivery | Pharmacy partner | ≤ 2 h (urgent), ≤ 6 h (routine) | e-Rx, delivery tracking |
| Discharge | Physician | — | Discharge summary, device pickup ≤ 24 h |
| Follow-up | Care team | Day 2, 7, 14, 30 | T0 monitoring + tele-consult |

### 4.3 Staffing Ratios (starting assumptions)

| Role | T1 Virtual IPD | T2 Step-down | T3 Home ICU |
|---|---|---|---|
| Command-centre monitoring nurse | 1 : 30–40 patients | 1 : 8–12 | 1 : 10–15 (with on-site nurse) |
| Virtual hospitalist / intensivist | 1 : 12–15 | 1 : 8–10 | 1 : 20–30 |
| Field RN (visits/shift) | 5–7 visits | — | On-site 12/24 h nurse |
| Paramedic rapid-response unit | 1 per 25–30 km radius | Same | Same |

---

## 5. Product Suite

| # | Product | Platform | Primary users | MVP |
|---|---|---|---|---|
| 1 | **Patient App** | Android, iOS, plus a kiosk build for the Home Hub tablet | Patient | ✅ |
| 2 | **Caregiver App** | Android, iOS (shared codebase with Patient App, role-based) | Family | ✅ |
| 3 | **Field Clinician App** | Android first, then iOS (offline-first) | RN, paramedic, phlebotomist, physio | ✅ |
| 4 | **Doctor App** | iOS, Android, tablet-optimised | Hospitalist, intensivist, specialists | ✅ |
| 5 | **Command Centre Console** | Web (multi-monitor; video-wall mode) | Monitoring nurses, MDs, ops | ✅ |
| 6 | **Partner Portal** | Web | Hospitals, labs, pharmacies, ambulance, insurers | Phase 2 |
| 7 | **Admin & Ops Portal** | Web | Ops, inventory, finance, HR rostering | ✅ (core) |
| 8 | **Home Hub Firmware/App** | Android (locked-down kiosk) or Linux gateway | — (headless + patient UI) | ✅ |
| 9 | **Logistics Driver App** | Android (module inside Field App) | Equipment/med delivery staff | Phase 2 |

---

## 6. Detailed Mobile App Specifications

> Priority key: **P0** = MVP must-have, **P1** = Phase 2, **P2** = later.

### 6.1 Patient App

**Goals:** feel safe, know what's happening, get help in one tap, and make device use easy.

| Module | Features | Priority |
|---|---|---|
| Onboarding | Language selection (EN, HI + 8 regional), OTP login, ABHA create/link, e-consent with video explainer, permissions walkthrough | P0 |
| Home / "My Hospital Room" | Today's care plan timeline, next visit ETA, next medicine, live vitals card, care team photos | P0 |
| **SOS / Call Nurse** | Large red button. Opens instant voice/video to the command centre; shares location and latest vitals; falls back to a PSTN call | P0 |
| Vitals | Live and trend charts, guided spot measurements (BP, glucose, weight, temp), symptom check-ins | P0 |
| Medications | Schedule, reminders, "taken" confirmation, photo of pill pack, side-effect report | P0 |
| Video Rounds | Scheduled and on-demand video (WebRTC), screen share for results, interpreter add-on | P0 |
| Care Team | Who's on duty, chat (async, triaged), visit history | P0 |
| Device Help | Pairing status, battery, "device not working" guided fix, request a technician | P0 |
| Reports | Lab results, discharge summary, prescriptions (PDF + FHIR), share via ABHA | P0 |
| Education | Condition-specific videos and red-flag symptoms | P1 |
| Feedback | Daily comfort score, PROMs/PREMs, NPS at discharge | P1 |
| Payments | Estimate, deposit, UPI/card, insurance status | P1 |
| Voice Assistant | Voice symptom logging and reading the care plan aloud (regional languages) | P2 |

**Key screens:** Splash → Language → Login → Consent → Home → Vitals → Meds → Video → SOS → Reports → Profile/Settings.

### 6.2 Caregiver App (role inside the Patient App codebase)

| Feature | Detail | Priority |
|---|---|---|
| Multi-patient linking | One caregiver, several patients (e.g. elderly parents) | P0 |
| Real-time status | Vitals summary, alerts relevant to the caregiver (with the patient's consent) | P0 |
| Task guidance | Step-by-step videos: repositioning, suction (T3), feeding, mobility | P0 |
| Shift handover | Night-observation checklist, log observations | P1 |
| SOS on behalf of patient | Same escalation path as the patient | P0 |
| Remote family | View-only access for relatives living elsewhere or abroad | P1 |

### 6.3 Field Clinician App (offline-first)

**Goals:** fast, accurate documentation at the bedside, with or without network.

| Module | Features | Priority |
|---|---|---|
| My Day | Route-optimised visit list, ETA sharing with the patient, navigation | P0 |
| Visit Workflow | Check-in (geo + QR on Home Hub), assessment template per tier, vitals capture (BLE auto-import), wound photos, notes (voice-to-text) | P0 |
| eMAR | Barcode scan of patient + medication (5 rights), IV start/stop, pump programming record | P0 |
| Lab Collection | Order list, label print/scan, chain of custody, POC device result import (e.g. blood gas analyser) | P0 |
| Device Setup | Kit checklist, BLE pairing wizard, hub connectivity test, asset tag scan | P0 |
| Escalation | One-tap "Deteriorating patient" → command centre MD on video; structured SBAR handoff | P0 |
| Tele-assist | Pull in a remote MD/specialist during the visit; POCUS image streaming | P1 |
| Offline Sync | Local encrypted DB, conflict resolution, background sync, queued uploads | P0 |
| Safety | Lone-worker check-in timer, panic button, shift check-in/out | P0 |
| Inventory | Consumables used, restock request | P1 |

### 6.4 Doctor App (Hospitalist / Intensivist)

| Module | Features | Priority |
|---|---|---|
| Census | Virtual ward list sorted by acuity (NEWS2 / AI risk), filters by tier, day-of-stay, pending tasks | P0 |
| Patient Chart | Summary ("One-liner + overnight events"), vitals trends, waveforms (T2/T3), labs, meds, notes, images | P0 |
| Orders (CPOE) | Condition order sets, meds, labs, imaging, visit frequency, monitoring thresholds per patient, drug-interaction checks | P0 |
| e-Prescription | Telemedicine-Guideline-compliant e-Rx with digital signature, sent to partner pharmacy | P0 |
| Video Round | Multi-party (patient + RN at home + family + interpreter), in-call vitals overlay | P0 |
| Alerts Inbox | Escalated alarms, acknowledgement, actions, audit | P0 |
| Documentation | Admission, progress, and discharge templates; AI-drafted summaries (clinician signs) | P0 / P1 (AI) |
| Escalate / Transfer | One-tap transfer request → ambulance dispatch + receiving hospital handoff (FHIR bundle) | P0 |
| Handover | Shift handoff list (I-PASS format) | P1 |
| Analytics | Personal outcomes, LOS, escalation rates | P2 |

### 6.5 Command Centre Console (Web)

| Area | Features |
|---|---|
| **Live Board** | Tile grid of all patients, colour-coded by acuity and alarm state; sort by risk; video-wall mode |
| **Patient Focus View** | Real-time vitals and waveforms, 24 h trends, NEWS2 history, device health, last visit, care plan |
| **Alarm Queue** | Prioritised queue, acknowledge/assign/escalate, snooze with reason, alarm-fatigue analytics |
| **Communication** | Click-to-video/voice (patient, caregiver, field RN), secure chat, broadcast |
| **Dispatch** | Map of field staff and paramedics, assign urgent visit, ambulance request, ETA tracking |
| **Device Fleet** | Connectivity, battery, data gaps, firmware, remote reboot of the hub |
| **Shift Ops** | Staff on duty, load balancing, handoff |
| **Audit** | Full event timeline per patient (who saw what, when) |

### 6.6 Home Hub (Edge Gateway)

| Feature | Detail |
|---|---|
| Hardware | Rugged Android tablet (kiosk mode) **or** Linux gateway (Raspberry Pi CM4/industrial) + small screen; dual-SIM 4G/5G + Wi-Fi; BLE 5.x; USB/RS-232 for monitors and ventilators |
| Power | UPS / battery backup ≥ 8 h; power-loss alert to the command centre |
| Functions | Device data collection, normalisation, timestamping; **local alarm evaluation** (so alarms still fire offline); store-and-forward buffer (≥ 72 h); video endpoint; SOS button (hardware) |
| Management | MDM (zero-touch enrolment), remote config, OTA updates, tamper detection |
| Security | Device certificate (mTLS), encrypted storage, secure boot |

### 6.7 Cross-App Feature Matrix

| Capability | Patient | Caregiver | Field | Doctor | Command |
|---|:-:|:-:|:-:|:-:|:-:|
| Live vitals | ✅ | ✅ (consented) | ✅ | ✅ | ✅ |
| Waveforms | — | — | ✅ | ✅ | ✅ |
| SOS / escalate | ✅ | ✅ | ✅ | ✅ | ✅ |
| Video | ✅ | ✅ | ✅ | ✅ | ✅ |
| Orders | — | — | View/execute | Create | View |
| eMAR | View | View | Administer | Order | View |
| Offline mode | Partial | Partial | **Full** | Read cache | — |
| Device pairing | Guided | — | ✅ | — | Remote |

---

## 7. Medical Device Ecosystem & Integration

### 7.1 Device Kit by Tier

| Device | T0 | T1 | T2 | T3 | Interface |
|---|:-:|:-:|:-:|:-:|---|
| Wearable vitals patch/armband (HR, RR, SpO₂, temp, activity, posture) | ○ | ● | ● | ○ | BLE → Hub or vendor cloud API |
| BP monitor (automatic, scheduled) | ● | ● | ● | ● | BLE (Bluetooth BLP profile) |
| Pulse oximeter (continuous) | ○ | ● | ● | ● | BLE (PLX profile) |
| 1–3 lead ECG patch / Holter | — | ○ | ● | ○ | BLE / vendor API |
| Glucometer | ○ | ● | ● | ● | BLE (GLS profile) |
| Thermometer | ● | ● | ● | ● | BLE (HTS profile) |
| Weighing scale (CHF) | ● | ● | — | — | BLE (WSS profile) |
| Multiparameter monitor (ECG, NIBP, SpO₂, RR, Temp, EtCO₂) | — | — | ● | ● | HL7 v2 / serial / vendor gateway |
| Ventilator / BiPAP with telemetry | — | — | ○ | ● | Vendor cloud API / serial |
| Oxygen concentrator (flow, alarms) | — | ○ | ● | ● | Smart plug / vendor API |
| Infusion pump (smart) | — | ○ | ● | ● | Vendor API (record only) |
| Suction, nebuliser, air mattress | — | — | ○ | ● | Asset tracking only |
| POC blood analyser (e.g. blood gas/electrolytes) | — | ● (carried by RN) | ● | ● | USB/Wi-Fi export → Field App |
| Handheld ultrasound (POCUS) | — | ● (carried by MD/paramedic) | ● | ○ | DICOM / vendor app |
| Fall-detection / bed-exit sensor | — | ○ | ○ | ● | Zigbee/BLE |
| Smart camera (with consent, privacy mode) | — | — | ○ | ○ | RTSP/WebRTC |

● Standard ○ Optional

### 7.2 Integration Strategy
1. **Standard BLE GATT profiles first** (BP, glucose, SpO₂, thermometer, weight) using a generic driver layer.
2. **Vendor cloud-to-cloud APIs** for wearables and ventilators whose vendors don't allow raw BLE access.
3. **HL7 v2 / IEEE 11073 SDC** for bedside multipara monitors, with an edge parser on the Hub.
4. **Normalisation layer** that converts all data to FHIR `Observation` with LOINC codes, UCUM units, device ID and quality flags.
5. A **device certification lab** in-house. Each new device model passes an integration test suite covering accuracy, latency, reconnection and battery.

### 7.3 Device Selection Criteria
- Regulatory: CDSCO-registered (India), plus FDA/CE where applicable.
- Clinical accuracy (SpO₂ accuracy across skin tones; ISO 81060-2 for BP).
- Open data access (SDK/API), battery ≥ 3 days for wearables.
- Rental/refurbish economics, vendor service SLA in your cities.

---

## 8. System Architecture

### 8.1 High-Level Architecture

```
┌───────────────────────── CLIENTS ─────────────────────────────────────────┐
│ Patient/Caregiver App │ Field App │ Doctor App │ Command Console │ Portals │
└───────────┬───────────────────────────────────────────────────────────────┘
            │ HTTPS/GraphQL, WebSocket, WebRTC
┌───────────▼───────────────────────────────────────────────────────────────┐
│ API GATEWAY (authN/Z, rate limit, WAF)  │  REALTIME GATEWAY (WS)  │ SFU   │
└───────────┬───────────────────────────────────────────────────────────────┘
            │
┌───────────▼──────────────── CORE SERVICES (containers / K8s) ─────────────┐
│ Identity & Access │ Patient & Encounter │ Referral & Eligibility          │
│ Care Plan & Tasks │ Orders/CPOE & eMAR  │ Clinical Docs                   │
│ Scheduling & Routing │ Dispatch & Logistics │ Inventory & Assets         │
│ Notification (push/SMS/IVR/WhatsApp) │ Video Session │ Billing & Claims   │
│ Consent & ABDM Gateway │ FHIR Facade │ Audit │ Analytics                 │
└───────────┬────────────────────────────────────────▲──────────────────────┘
            │                                        │ alerts
┌───────────▼──────────── REAL-TIME DATA PIPELINE ───┴──────────────────────┐
│ Device Ingestion (MQTT broker) → Stream bus (Kafka) → Stream processor    │
│ (Flink / Kafka Streams): validation, artifact filter, NEWS2, rules, ML    │
│ → Alarm Manager (dedupe, tiering, escalation timers)                      │
└───────────┬───────────────────────────────────────────────────────────────┘
            │
┌───────────▼─────────────────── DATA LAYER ────────────────────────────────┐
│ PostgreSQL (transactional) │ TimescaleDB (vitals/waveforms) │ FHIR store  │
│ Redis (cache, presence)    │ Object store (images, docs, recordings)      │
│ Data lake / warehouse (de-identified analytics, ML training)              │
└───────────────────────────────────────────────────────────────────────────┘
            ▲
┌───────────┴──── EDGE ─────┐          ┌──── EXTERNAL INTEGRATIONS ─────────┐
│ Home Hub: drivers, local  │          │ HIS/EHR (HL7/FHIR), LIS, Pharmacy, │
│ alarms, buffer, mTLS MQTT │          │ ABDM (HIP/HIU), Insurer/TPA (NHCX),│
└───────────────────────────┘          │ Ambulance, Maps, Payments (UPI)    │
                                       └────────────────────────────────────┘
```

### 8.2 Critical Data Flow: Vital Sign → Alarm → Action

1. A device sends a reading to the Home Hub (BLE), and the Hub timestamps it and attaches the device ID.
2. The Hub runs a **local threshold check**. A critical value fires a local alarm (siren plus screen) right away.
3. The Hub publishes the reading over MQTT (QoS 1, mTLS) to the cloud and buffers it if the connection is down.
4. Ingestion validates the reading and writes it to Kafka topic `vitals.raw`.
5. The stream processor filters artifacts, calculates NEWS2, applies patient-specific thresholds and runs the ML risk score, then writes to `vitals.scored`.
6. The alarm manager creates an alarm, dedupes it, assigns a tier, and starts an escalation timer.
7. The Command Console receives a WebSocket push. The nurse acknowledges within the SLA, or the alarm auto-escalates.
8. The nurse calls the patient by video, dispatches a paramedic, or escalates to the MD. Every action is audited.

**Latency budget:** device to Hub < 2 s, Hub to cloud < 3 s, processing < 2 s, push to console < 1 s. **Total < 10 s.**

### 8.3 Deployment
- Cloud: AWS **ap-south-1 (Mumbai)** primary and **ap-south-2 (Hyderabad)** for DR, which keeps data in India. Azure Central/South India works equally well.
- Kubernetes (EKS/AKS), Infrastructure-as-Code (Terraform), GitOps (ArgoCD).
- Multi-AZ for all stateful services. RPO ≤ 5 min, RTO ≤ 30 min. The real-time alarm path is active-active.

---

## 9. Monitoring, Early-Warning & Escalation Engine

### 9.1 Scoring Layers
1. **Hard thresholds:** device and patient-specific, set by the MD (e.g. SpO₂ < 90% for 60 s).
2. **NEWS2:** calculated automatically from every complete set of vitals (RR, SpO₂, O₂ use, systolic BP, HR, consciousness, temp).
3. **Trend rules:** e.g. HR up ≥ 20% from baseline over 4 h, weight up ≥ 2 kg over 3 days (CHF), rising RR trend.
4. **ML deterioration index (Phase 2):** personalised baseline model. Used for decision support only and needs SaMD clearance before it drives any clinical action.

### 9.2 NEWS2 Response Mapping (adapted for home)

| NEWS2 | Risk | Platform response |
|---|---|---|
| 0–4 | Low | Routine monitoring; RN reviews at next visit |
| 3 in any single parameter | Low–medium | Command nurse video check ≤ 30 min; MD informed |
| 5–6 | Medium | **Urgent**: MD video review ≤ 15 min; consider urgent RN/paramedic visit ≤ 60 min |
| ≥ 7 | High | **Emergency**: MD ≤ 5 min; paramedic dispatch; prepare transfer; ambulance on standby |

### 9.3 Alarm Tiers & SLAs

| Tier | Example | Acknowledge SLA | Auto-escalation if not acknowledged |
|---|---|---|---|
| **Critical (Red)** | SpO₂ < 85% sustained, HR < 40 / > 150, apnoea, ventilator disconnect, SOS | ≤ 60 s | 60 s → charge nurse + MD; 3 min → ops lead + auto-call patient |
| **Urgent (Amber)** | NEWS2 5–6, SBP < 90, new arrhythmia | ≤ 5 min | 5 min → second nurse; 15 min → MD |
| **Advisory (Yellow)** | Trend deviation, missed medication, missed vitals | ≤ 30 min | Queue to next round |
| **Technical (Blue)** | Device offline, low battery, signal loss, hub on battery | ≤ 15 min | Tech support → field visit if > 60 min data gap (T2/T3: 15 min) |

**Alarm-fatigue controls:**
- Artifact filtering (motion, poor perfusion index).
- Delay windows (sustained duration before an alarm fires).
- Dedupe.
- Per-patient threshold tuning by the MD.
- Weekly alarm analytics review.

### 9.4 Escalation & Transfer Pathway (guaranteed)

```
Deterioration ─▶ Command nurse assess (video) ─▶ MD review ─▶ Decision:
   ├─ Treat at home (new orders, urgent RN/paramedic visit)
   ├─ Upgrade tier (T1→T2: add monitor, increase visits)
   └─ TRANSFER: ambulance dispatch (target door-to-door ≤ 30–45 min)
                + FHIR handoff bundle to receiving ED/ICU
                + family notified + bed pre-alert at partner hospital
```

Contracts with ambulance providers and partner hospitals must guarantee response times. Each patient's escalation plan, including the nearest ICU, is fixed at admission.

---

## 10. Data Model & Interoperability

### 10.1 FHIR R4 Resource Mapping

| Domain | FHIR resource(s) |
|---|---|
| Patient, caregiver | `Patient`, `RelatedPerson` |
| Staff | `Practitioner`, `PractitionerRole` |
| Virtual admission | `Encounter` (class = `HH` home health / `VR` virtual), `EpisodeOfCare` |
| Location / virtual bed | `Location` (mode = kind, type = virtual bed) |
| Referral | `ServiceRequest` |
| Care plan, tasks | `CarePlan`, `Task`, `Goal` |
| Vitals & device data | `Observation` (LOINC), `Device`, `DeviceMetric` |
| Alarms | `Flag`, `DetectedIssue`, `Communication` |
| Orders | `MedicationRequest`, `ServiceRequest` (lab/imaging/visits) |
| Med administration | `MedicationAdministration` |
| Labs | `DiagnosticReport`, `Specimen` |
| Notes | `DocumentReference`, `Composition` (discharge summary) |
| Consent | `Consent` |
| Billing | `Claim`, `Coverage`, `ChargeItem` |
| Audit | `AuditEvent`, `Provenance` |

### 10.2 ABDM Integration (India)
- **ABHA** creation/linking during onboarding.
- Register as a **HIP** (share records) and **HIU** (fetch prior records with consent) through the ABDM Gateway and Consent Manager.
- Health records published as FHIR documents following the ABDM FHIR profiles (DischargeSummary, Prescription, DiagnosticReport, OPConsultation, WellnessRecord).
- Claims via **NHCX** (National Health Claims Exchange) once insurers onboard.

### 10.3 Key Internal Entities (non-FHIR operational)
`VirtualBed`, `Kit`, `Asset`, `HubDevice`, `Visit`, `Route`, `Shift`, `AlarmEvent`, `EscalationTimer`, `ThresholdProfile`, `Dispatch`, `Invoice`.

---

## 11. API & Event Design

### 11.1 REST/GraphQL (illustrative)

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/v1/referrals` | Create referral (from HIS/Partner Portal) |
| POST | `/v1/referrals/{id}/eligibility` | Submit eligibility checklist → decision |
| POST | `/v1/encounters` | Virtual admission |
| GET | `/v1/encounters/{id}/summary` | Chart summary (Doctor App) |
| PUT | `/v1/encounters/{id}/thresholds` | Patient-specific alarm thresholds |
| POST | `/v1/orders` | Create order (med/lab/visit) |
| POST | `/v1/med-admin` | Record administration (Field App) |
| GET | `/v1/patients/{id}/observations?code=&from=&to=` | Vitals trends |
| POST | `/v1/alarms/{id}/ack` | Acknowledge alarm |
| POST | `/v1/alarms/{id}/escalate` | Escalate |
| POST | `/v1/transfers` | Initiate hospital transfer |
| POST | `/v1/video/sessions` | Create video room token |
| POST | `/v1/devices/pair` | Register device to patient/hub |
| GET | `/fhir/r4/...` | Standards-based FHIR facade |

### 11.2 MQTT Topics (Hub ↔ Cloud)
```
hub/{hubId}/obs          # normalised observations (QoS1)
hub/{hubId}/waveform     # compressed waveform chunks (T2/T3)
hub/{hubId}/alarm        # locally-detected alarms (QoS1, retained)
hub/{hubId}/status       # heartbeat, battery, power, connectivity (every 30 s)
hub/{hubId}/cmd          # cloud → hub: config, thresholds, reboot, OTA
```

### 11.3 Kafka Topics
`vitals.raw`, `vitals.scored`, `alarms.events`, `encounter.events`, `orders.events`, `tasks.events`, `dispatch.events`, `audit.events`, `notifications.outbound`

### 11.4 Sample Observation Event
```json
{
  "eventId": "8b2f…",
  "patientId": "pt_123",
  "encounterId": "enc_456",
  "hubId": "hub_789",
  "deviceId": "dev_spo2_001",
  "code": { "system": "http://loinc.org", "code": "59408-5", "display": "SpO2" },
  "value": 89, "unit": "%",
  "quality": { "perfusionIndex": 1.2, "artifact": false },
  "effectiveTime": "2026-10-17T10:42:05.120Z",
  "receivedTime": "2026-10-17T10:42:07.004Z"
}
```

---

## 12. Technology Stack (Recommended)

| Layer | Choice | Rationale |
|---|---|---|
| **Mobile apps** | **Flutter** (Dart) with native modules (Kotlin/Swift) for BLE and background services | One codebase for 4 apps and the tablet kiosk; strong offline/UI performance. *Alternative: React Native + TypeScript if the team is JS-heavy.* |
| BLE | `flutter_reactive_ble` or a custom native plugin; Android foreground service | Reliable background device connections |
| Offline DB (mobile) | SQLite + SQLCipher (via Drift) | Encrypted local store, sync queue |
| Video | WebRTC via **LiveKit** (self-hostable) or a managed CPaaS (Agora / 100ms) | Low latency, recording, multi-party, India PoPs |
| Web (Console/Portals) | React + TypeScript, Next.js; uPlot/ECharts for real-time charts; WebGL waveforms | High-frequency charting performance |
| Backend services | **Kotlin + Spring Boot** (clinical core) and **Go** (ingestion/real-time) *or* Node.js/NestJS | Type safety, mature healthcare libs (HAPI FHIR on JVM) |
| FHIR server | **HAPI FHIR** (JPA, Postgres) | Open source, ABDM-compatible profiles |
| Messaging | EMQX/HiveMQ (MQTT) + **Apache Kafka** (MSK/Confluent) | Device scale + durable event streaming |
| Stream processing | Apache Flink or Kafka Streams | Windowed rules, NEWS2, CEP |
| Databases | PostgreSQL, **TimescaleDB** (vitals), Redis | Relational + time-series + cache |
| Search | OpenSearch | Patient/notes search, logs |
| Object storage | S3 (SSE-KMS) | Images, documents, recordings |
| Analytics | Warehouse (Redshift/BigQuery/Snowflake) + dbt + Metabase/Superset | KPIs, outcomes |
| ML | Python, scikit-learn/XGBoost/PyTorch, MLflow, SageMaker | Model lifecycle |
| Auth | Keycloak / Cognito (OIDC), MFA, device binding | RBAC + ABAC |
| Notifications | FCM/APNs, SMS, WhatsApp Business API, IVR | Multi-channel for low-literacy users |
| Maps/routing | Google Maps Platform / MapmyIndia (Mappls) | Routing, geofence |
| Payments | UPI via Razorpay/PayU/Cashfree | Indian payment rails |
| DevOps | GitHub Actions, Terraform, ArgoCD, Docker, EKS | CI/CD, GitOps |
| Observability | OpenTelemetry, Prometheus, Grafana, Loki/ELK, Sentry, PagerDuty | End-to-end tracing of the alarm path |
| MDM (Hub & staff devices) | Android Enterprise MDM (e.g. Esper / Scalefusion / Intune) | Kiosk, OTA, remote wipe |

---

## 13. Security, Privacy & Regulatory Compliance

### 13.1 Regulatory Map

| Area | India | International (if expanding) |
|---|---|---|
| Data protection | **DPDP Act 2023** & DPDP Rules: consent notices, purpose limitation, data principal rights, breach notification, Data Protection Officer | HIPAA (US), GDPR/UK GDPR |
| Telemedicine | **Telemedicine Practice Guidelines 2020** (NMC): RMP identification, consent, e-Rx rules, drug lists | State licensure (US), CQC (UK) |
| Medical devices / software | **Medical Devices Rules 2017** (CDSCO): risk-classify alarm and AI modules as SaMD (likely Class B/C) | FDA 510(k)/De Novo, EU MDR, UKCA |
| Digital health | **ABDM** compliance and certification (HIP/HIU, sandbox → production) | ONC, NHS DSPT |
| Quality | **NABH** home-care standards; ISO 9001 | Joint Commission, CMS AHCAH waiver conditions |
| Software lifecycle | IEC 62304 (software lifecycle), ISO 14971 (risk), IEC 62366-1 (usability), ISO 13485 (QMS) for SaMD components | Same |
| Info security | ISO 27001, CERT-In directions (6-hour incident reporting, log retention 180 days) | SOC 2 Type II, HITRUST |
| Clinical establishment | Clinical Establishments Act / state equivalents; pharmacy & drug licensing via partners | — |

> Get legal/regulatory counsel to confirm classification and licensing before launch.

### 13.2 Security Controls
- **Identity:**
  - OIDC with MFA for all clinicians.
  - Device binding and biometric unlock on mobile.
  - Session timeout (clinician: 15 min idle).
- **Access:**
  - RBAC plus ABAC: a clinician only sees patients on their care team or roster.
  - Break-glass access with justification and audit.
- **Encryption:**
  - TLS 1.3 in transit and mTLS for Hub/devices.
  - AES-256 at rest (KMS).
  - Field-level encryption for sensitive identifiers (Aadhaar/ABHA).
- **Mobile hardening:**
  - SQLCipher, certificate pinning, root/jailbreak detection, screenshot blocking on PHI screens, remote wipe, OWASP MASVS L2.
- **Audit:**
  - Immutable audit log (`AuditEvent`) for every read and write of PHI, plus alarm actions.
  - Logs retained according to the regulatory policy.
- **Testing:**
  - SAST/DAST/SCA in CI.
  - Annual third-party penetration test plus a pre-launch VAPT (CERT-In empanelled auditor).
- **Privacy:**
  - Consent ledger, data minimisation, de-identification for analytics/ML, configurable retention, export and erasure workflows.

---

## 14. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Availability | 99.95% core clinical services; **99.99% alarm pipeline** (active-active) |
| Latency | Device→console alarm ≤ 10 s (p99); API p95 ≤ 300 ms; video setup ≤ 5 s |
| Scalability | Phase 1: 500 concurrent virtual beds; design target 10,000 beds, 50k devices, ~5k obs/s, waveforms 250 Hz × 3 leads for T2/T3 |
| Data retention | Clinical records per Indian medical-records norms (typically ≥ 3 years for outpatient-type records and longer for inpatient; confirm with counsel); raw waveforms 30 days hot, summarised thereafter |
| Offline | Field App fully functional offline ≥ 12 h; Hub buffers ≥ 72 h; local alarms always on |
| Power | Hub runs on battery ≥ 8 h; power-loss alert ≤ 60 s |
| Accessibility | WCAG 2.2 AA; font scaling 200%; voice prompts |
| Localisation | EN, HI + Tamil, Telugu, Kannada, Malayalam, Marathi, Bengali, Gujarati (phase-wise) |
| Device compatibility | Android 9+ (Field/Patient), iOS 16+; low-end Android (2 GB RAM) supported for Patient App |
| Observability | 100% distributed tracing on the alarm path; synthetic "canary patient" running 24×7 |
| DR | RPO ≤ 5 min, RTO ≤ 30 min; quarterly DR drills |

---

## 15. Low-Connectivity & Power-Failure Strategy (India-critical)

| Failure | Mitigation |
|---|---|
| Home Wi-Fi down | Hub automatically switches to 4G/5G (dual-SIM, two different carriers) |
| All data down | Hub local alarms (siren + screen + caregiver phone over BLE); **SMS fallback** for critical alarms; command centre flags a "data gap" after 2–5 min (by tier) and calls by PSTN |
| Power cut | Hub UPS; ventilator/concentrator backup batteries and inverter checks during home-safety assessment; power-loss alert |
| Low bandwidth | Adaptive bitrate video → audio-only → PSTN; vitals prioritised over waveforms; waveform compression |
| App killed by OS | Android foreground service, battery-optimisation whitelisting (MDM-enforced on Hub) |
| Patient phone unavailable | Hub tablet is the primary patient device; the patient's phone is optional |

---

## 16. UX & Accessibility Guidelines

- **Design for elderly and low-literacy users:**
  - Big touch targets (≥ 48 dp).
  - Icon + text + voice on every screen.
  - At most 3 primary actions per screen.
- **SOS is always one tap away** on every patient and caregiver screen, plus a physical button on the Hub.
- **Calm technology:** the Patient App shows reassurance ("Your nurse is watching your vitals"), not raw alarms.
- **Clinician UX:**
  - Acuity-first sorting.
  - "What changed since I last looked" diffs.
  - Keyboard shortcuts on the console.
  - Dark mode for night shifts.
  - Consistent colour semantics (Red/Amber/Yellow/Blue).
- **Design system:** one shared component library (Flutter + React tokens), clinical colour palette checked for colour-blind safety.
- **Usability engineering** per IEC 62366-1: formative tests with real nurses and elderly patients; a summative test before launch.

---

## 17. AI/ML Roadmap

| Phase | Capability | Regulatory note |
|---|---|---|
| 1 | Rules + NEWS2, artifact filtering | Low risk; document under QMS |
| 1 | AI-drafted clinical notes and discharge summaries (LLM, clinician signs off) | Decision support; PHI must stay in-region; human sign-off |
| 2 | Personalised deterioration index (multivariate vitals) | SaMD; needs clinical validation & CDSCO registration |
| 2 | Readmission risk at discharge | Decision support |
| 2 | Alarm-fatigue optimiser (suggests threshold tuning) | Clinician approves changes |
| 3 | Computer vision: fall detection, wound-healing tracking | Consent, privacy |
| 3 | Capacity forecasting & staff rostering | Operational |
| 3 | Multilingual voice assistant for symptom check-ins | Decision support |

**MLOps:**
- Versioned datasets and models (MLflow).
- Bias testing across age, sex and skin tone (SpO₂).
- Drift monitoring.
- Model cards.
- A predetermined change control plan.

---

## 18. Testing, Validation & Clinical Pilot

| Layer | Approach |
|---|---|
| Unit/integration | ≥ 80% coverage on clinical core; contract tests for every external integration |
| Device integration | Device-in-the-loop lab rig; simulators for vitals and waveforms; reconnect/out-of-range/battery tests |
| Alarm pipeline | Chaos testing (kill broker/zone); end-to-end latency tests; synthetic patients 24×7 in production |
| Load | k6/Gatling: 10k beds, 5k obs/s, 1k concurrent video |
| Security | SAST/DAST/SCA, mobile MASVS testing, VAPT |
| Usability | IEC 62366 formative and summative tests |
| Clinical simulation | Tabletop and live drills: hypoxia, sepsis, fall, power cut, ventilator disconnect |
| **Pilot** | 1 partner hospital, 2–3 conditions, 50–100 patients, 3 months; compare against matched inpatient controls on mortality, escalation, 30-day readmission, LOS, cost, and patient/caregiver satisfaction; ethics committee approval if publishing |

**Go-live readiness gates:**
- Clinical governance committee sign-off.
- All Red-tier alarm SLAs passing in drills.
- Escalation contracts signed.
- VAPT closed.
- DPDP notices and consents live.
- ABDM certification complete.

---

## 19. Delivery Roadmap

| Phase | Duration | Scope | Exit criteria |
|---|---|---|---|
| **0. Discovery & Design** | Months 0–2 | Clinical protocols, order sets, eligibility, device selection, UX research, architecture, regulatory classification, QMS setup | Signed PRD, clickable prototypes, architecture & risk file |
| **1. MVP Build** | Months 2–7 | Patient/Caregiver, Field, Doctor apps; Command Console; Hub; ingestion + NEWS2 + alarms; orders/eMAR; video; HIS referral integration; Admin core | Internal alpha, device lab validated |
| **2. Pilot (T1 Virtual IPD)** | Months 7–10 | 1 city, 1 hospital, 2–3 conditions; 24×7 command centre live | Safety KPIs met; ≥ 50 discharged patients |
| **3. Scale & T2/T3** | Months 10–15 | Multipara monitor/ventilator integration, waveforms, Partner Portal, billing/claims (NHCX), ABDM HIP/HIU production, regional languages | 3 hospitals, 200 concurrent beds |
| **4. Intelligence & Expansion** | Months 15–24 | ML deterioration index (validated), logistics optimisation, voice assistant, multi-city, international readiness (HIPAA/GDPR) | 1,000+ concurrent beds; SaMD registration filed |

### MVP Sprint Plan (2-week sprints, Phase 1)

| Sprint | Focus |
|---|---|
| 1–2 | Foundations: IAM, CI/CD, IaC, design system, FHIR server, patient/encounter services |
| 3–4 | Device ingestion (MQTT/Kafka), Hub app v0, BLE drivers (BP, SpO₂, temp, glucose), vitals store |
| 5–6 | NEWS2 + rules engine, alarm manager, Command Console live board & alarm queue |
| 7–8 | Doctor App: census, chart, orders, e-Rx; video service |
| 9–10 | Field App: visits, offline sync, eMAR barcode, lab collection; routing |
| 11–12 | Patient/Caregiver App: home, vitals, meds, SOS, video; onboarding/consent; ABHA link |
| 13–14 | Referral/eligibility, HIS integration, discharge & follow-up, notifications (SMS/WhatsApp/IVR) |
| 15–16 | Hardening: security, load, chaos, usability tests, clinical drills, documentation; alpha release |

---

## 20. Team Structure (Phase 0–2)

| Function | Roles | FTE |
|---|---|---|
| Product | Head of Product, Product Manager (clinical), Product Manager (platform) | 3 |
| Clinical | Medical Director (intensivist/internist), Nursing Lead, Clinical Informaticist, Clinical Safety Officer | 4 |
| Design | UX Lead, UX/UI Designers, UX Researcher | 3 |
| Mobile | Flutter engineers (incl. lead), native Android/iOS (BLE) engineer | 5 |
| Web | React engineers | 3 |
| Backend | Backend engineers (clinical core, integrations), FHIR/ABDM specialist | 6 |
| Data/Real-time | Streaming engineers, data engineer | 3 |
| IoT/Edge | Embedded/Edge engineer, device integration engineer | 2 |
| ML | ML engineer / data scientist (Phase 2+) | 1–2 |
| QA | QA lead, automation engineers, device-lab tester | 4 |
| DevOps/SRE/Sec | SRE, DevSecOps | 3 |
| Regulatory/QA (QMS) | Regulatory & quality manager | 1 |
| **Total** | | **≈ 38–40** |

Operations staff (command-centre nurses, doctors, field teams, logistics) scale with the number of beds and are budgeted separately.

---

## 21. Indicative Budget (Technology Build, India-based team)

> These are rough planning estimates for early budgeting only. Get vendor quotes before committing.

| Item | Phase 0–2 (≈ 10 months) | Notes |
|---|---|---|
| Product & engineering team (~38 FTE) | ₹6.0 – 9.0 Cr (≈ US$0.7–1.1M) | Blended Indian market rates |
| Cloud & infrastructure | ₹40 – 80 L | Dev/stage/prod, DR, observability |
| Video/CPaaS, SMS/WhatsApp/IVR | ₹15 – 40 L | Usage-based |
| Device lab & pilot device kits (≈ 60 kits) | ₹60 L – 1.5 Cr | Depends on T1 vs T2/T3 mix; rental models reduce capex |
| Security (VAPT, ISO 27001 readiness) | ₹15 – 30 L | |
| Regulatory, legal, QMS, ABDM certification | ₹20 – 50 L | |
| Command-centre setup (fit-out, video wall, telephony) | ₹30 – 75 L | |
| Contingency (15%) | | |
| **Indicative total** | **≈ ₹9 – 14 Cr (≈ US$1.1–1.7M)** | Excludes clinical operations payroll |

**Per-bed unit economics (to model):**
- Device kit amortisation, consumables, field visits (number × cost), command-centre share, MD share, logistics, and connectivity.
- Compare against the inpatient bed-day cost and payer tariff.

---

## 22. Business Model & KPIs

### 22.1 Revenue Models
1. **Hospital partnership (B2B):** platform plus operations as a service. Per-virtual-bed-day fee or revenue share. The hospital gains bed capacity.
2. **Direct-to-consumer:** per-day packages by tier (out-of-pocket).
3. **Payer/insurer:** bundled episode rates; pre-authorised virtual admissions.
4. **Corporate/government:** PM-JAY / state schemes / CGHS pilots; employer health plans.
5. **SaaS licence:** platform-only for large hospital groups that run their own operations.

### 22.2 KPI Dashboard

| Category | KPI | Target |
|---|---|---|
| Safety | Unplanned escalation to hospital | < 10% |
| Safety | Unplanned ICU transfer within 24 h of admission | < 2% |
| Safety | Mortality (unexpected) | ≤ matched inpatient |
| Safety | Critical alarm acknowledgement (median / p95) | < 30 s / < 60 s |
| Quality | 30-day readmission | ≤ matched inpatient (aim −20%) |
| Quality | Hospital-acquired complications (falls, delirium, CLABSI) | Below inpatient baseline |
| Experience | Patient NPS / caregiver burden score | > 60 / monitored |
| Operations | Referral-to-home-setup time | ≤ 4 h |
| Operations | Device data completeness | ≥ 95% |
| Operations | Alarms per patient-day (actionable %) | Track; actionable ≥ 30% |
| Financial | Cost per episode vs inpatient | ≥ 30% lower |
| Financial | Beds freed for partner hospital (bed-days/month) | Track |

---

## 23. Risk Register

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| 1 | Delayed escalation → patient harm | M | Critical | Strict eligibility, local alarms, SLA auto-escalation, ambulance contracts, drills |
| 2 | Connectivity/power failure | H | High | Dual-SIM, UPS, SMS/PSTN fallback, data-gap alarms |
| 3 | Alarm fatigue | H | High | Artifact filtering, tuning, analytics, staffing ratios |
| 4 | Regulatory reclassification of software as a higher-risk device | M | High | Early CDSCO consultation, QMS from day 0, modular SaMD boundary |
| 5 | Reimbursement/insurer adoption slow | H | High | Hospital B2B model first, outcome evidence, NHCX readiness |
| 6 | Device vendor lock-in / API changes | M | Medium | Abstraction layer, standards-based profiles, multi-vendor |
| 7 | Data breach | L–M | Critical | Zero-trust, encryption, VAPT, DPDP compliance, incident response plan |
| 8 | Workforce shortage (critical-care nurses) | H | High | Training academy, tele-mentoring, efficient ratios via tech |
| 9 | Caregiver burden & home unsuitability | M | Medium | Home-safety assessment, caregiver training, respite visits |
| 10 | Low digital literacy | H | Medium | Hub-first design, voice, regional languages, assisted onboarding |
| 11 | Clinician liability across jurisdictions | M | High | Licensed RMPs, malpractice cover, clear protocols, documentation |
| 12 | Program unsustainable at small scale | M | High | Hub-and-spoke command centre shared across hospitals; scale targets |

---

## 24. Appendices

### Appendix A — Eligibility Checklist (T1 Virtual IPD)

**Clinical (all must be ✅):**
- [ ] Requires inpatient-level care for an approved condition
- [ ] Haemodynamically stable: SBP ≥ 90, HR 50–120, RR ≤ 24, SpO₂ ≥ 92% (or ≥ 88% for known COPD) on ≤ 4 L O₂
- [ ] NEWS2 ≤ 4 (or ≤ 6 with MD approval)
- [ ] No vasopressors, blood products, new NIV/invasive ventilation, continuous high-risk infusions
- [ ] No acute delirium without a 24 h caregiver
- [ ] Diagnosis is clear and the treatment plan is defined

**Home & social (all must be ✅):**
- [ ] Inside the service radius (ambulance ≤ 30–45 min to partner hospital)
- [ ] Reliable electricity (or UPS feasible) and mobile network coverage verified
- [ ] Caregiver available (mandatory for T2/T3; strongly preferred for T1)
- [ ] Safe home environment (no fall hazards that can't be fixed, sanitation adequate)
- [ ] Patient/legal representative consents to home admission

### Appendix B — Escalation Contact Tree (template)

| Level | Role | Contact SLA |
|---|---|---|
| L1 | Command-centre monitoring nurse | ≤ 60 s (Red) |
| L2 | Charge nurse / second nurse | +60 s |
| L3 | Virtual hospitalist / intensivist on duty | ≤ 5 min (Red) |
| L4 | Medical director on call | ≤ 15 min |
| Dispatch | Paramedic rapid-response | Arrive ≤ 30 min |
| Transfer | Ambulance → partner ED/ICU | Door-to-door ≤ 45 min |

### Appendix C — Initial Condition Order Sets (MVP)
1. Community-acquired pneumonia (IV/oral antibiotics, O₂ titration, CXR, CBC/CRP)
2. Heart-failure exacerbation (IV/oral diuretics, daily weight, electrolytes, fluid balance)
3. COPD exacerbation (nebulisation, steroids, O₂ targets 88–92%, ABG/VBG POC)
4. Cellulitis (IV antibiotics, wound photo tracking)
5. Complicated UTI / pyelonephritis (IV antibiotics, cultures, renal function)

### Appendix D — Glossary
| Term | Meaning |
|---|---|
| HaH | Hospital at Home |
| IPD | In-Patient Department |
| NEWS2 | National Early Warning Score 2 |
| eMAR | Electronic Medication Administration Record |
| CPOE | Computerised Physician Order Entry |
| SaMD | Software as a Medical Device |
| ABDM / ABHA | Ayushman Bharat Digital Mission / Ayushman Bharat Health Account |
| HIP / HIU | Health Information Provider / User (ABDM) |
| NHCX | National Health Claims Exchange |
| FHIR | Fast Healthcare Interoperability Resources (HL7) |
| SFU | Selective Forwarding Unit (video server) |
| SBAR / I-PASS | Structured clinical handoff formats |
| RPO / RTO | Recovery Point / Time Objective |

---
*This document is a product and technical specification. Clinical protocols, thresholds and regulatory classifications in it are starting points that must be reviewed and approved by the organisation's clinical governance and regulatory counsel before use with patients.*

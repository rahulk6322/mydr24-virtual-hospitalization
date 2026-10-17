# MyDoctor24 — Doctor App Master Screen Specification (v2.0)
*Virtual Hospitalization (IPD + ICU-level monitoring at home) · Consolidated & corrected · 17 Oct 2026*

| Item | Detail |
|---|---|
| Replaces | The 3 ChatGPT PDFs (Doctor-App Executive Summary / Tele-ICU Feature Map / Advanced Virtual ICU Design) and the 3 storyboard canvases (25 screens) |
| Parent documents | `virtual-hospital-ecosystem-and-mobile-app-spec.md` (platform), `virtual-hospitalization-research.md` (evidence) |
| Scope | The Doctor/Intensivist mobile app only. The Patient, Caregiver, Field-Nurse and Command-Centre apps are covered in the parent spec. |
| Market | India first (DPDP Act, NMC Telemedicine Guidelines, ABDM, CDSCO, NABH) |

---

## PART A — Review of the Attached Material

### A1. What's strong (keep)
- The **25-screen flow is complete and logical**: admission → daily care → alerts → escalation → discharge → follow-up. It lines up one-to-one with the care journey in the platform spec.
- The visual language is consistent: MyDoctor24 blue, Red/Amber/Info severity chips, a bottom nav (Home · Patients · Rounds · Alerts · More), and status pills (Stable/Critical/Pending).
- The right clinical building blocks are present: NEWS2/SOFA scoring, SOAP notes, CPOE, MAR, I-PASS-style handover, discharge checklist, and family updates.
- Escalation is handled correctly in the mock data: the patient with SpO₂ 82% and BP 78/50 is sent to *Transfer to Hospital*, not managed at home.

### A2. Issues that must be fixed before Figma/dev hand-off

| # | Severity | Where | Issue | Fix (applied in Part B) |
|---|---|---|---|---|
| 1 | 🔴 Critical | All 3 PDFs | Citations like `【45†L7-L10】`, `【34†embed_image】` and "graphic courtesy Shutterstock" are **ChatGPT placeholders, not real references**. The "ChatGPT" logo is on every page. | Removed. Real sources are in the research doc. Don't send the PDFs externally as they are. |
| 2 | 🔴 Critical | Emergency/Code-Blue console (PDF 1 #21, PDF 2 #22) | A remote doctor **can't run ACLS/CPR timers at home**. There's no code team at the bedside, so presenting it this way creates medico-legal risk. | Redesigned as the **Emergency Response Console**. It calls 108/112 and the paramedic, guides the caregiver through CPR, notifies the receiving ED, and logs a timestamped record. |
| 3 | 🔴 Critical | PDF 3 #17 "Add remote ventilator control", "start ventilator at home"; PDF 2 "titration guardrails for infusions" | Remote ventilator control and vasopressor titration are **out of scope for safe home care**. They would also count as high-risk medical-device functions. | Removed. Ventilator data is **view-only** (screen D-12). Vasopressors trigger a transfer. |
| 4 | 🔴 Critical | Admission Eligibility mockup (all 3 canvases) | "Exclusion Criteria ✖" is shown, yet **"Proceed to Consent" is still enabled**. | Any failed hard exclusion blocks the flow. Only an MD override with a written reason is allowed, and it's audited. |
| 5 | 🔴 Critical | Missing screen | No **Goals of Care / Code Status (Full code / DNR / limits)**. This is essential for home-ICU and palliative patients and changes what "emergency" means. | Added **D-07 Goals of Care & Code Status**. It shows as a banner on every patient screen. |
| 6 | 🟠 High | PDF 1 & 2 data mapping | Uses **retired or non-existent FHIR resources**: `ReferralRequest`, `ProcedureRequest`, `OrderRequest`, `ClinicalNote`, "ImagingStudy requests". It also mixes FHIR v5 with ABDM's FHIR R4. | Remapped to **FHIR R4** (ABDM profiles): `ServiceRequest`, `Task`, `DocumentReference`, `Composition` and others (Part C). |
| 7 | 🟠 High | PDF 1 #20 | "Call **911**". | India: **108 / 112**, or the contracted private ambulance. Make the emergency numbers configurable per region. |
| 8 | 🟠 High | Alert Inbox (PDF 1 #10) | **Swipe-to-acknowledge / swipe-to-escalate** on critical alerts leads to accidental actions. Snooze has no limit. | Use explicit buttons. Red alerts can't be snoozed. Amber snooze is capped at 15 min and needs a reason. |
| 9 | 🟠 High | Family Update | Clinical data goes to family **without a consent check**, which the DPDP Act 2023 requires. | Send only to recipients who have consented (the consent scope is captured in D-04). |
| 10 | 🟠 High | e-Prescription | No **RMP registration number / digital signature / Telemedicine-Guideline drug-list checks**. | Added to D-17. |
| 11 | 🟠 High | Missing screens | No **results viewer** (only ordering), **medication reconciliation & allergy**, **per-patient alarm thresholds**, **device/connectivity status**, **shift handover**, or **ventilator/respiratory telemetry**. | Added D-13, D-16, D-11, D-10, D-28, D-12. |
| 12 | 🟡 Medium | PDF 2 partner table | Lists Surescripts (US only), "MediPro (India)" (unverified), "108 service API" (there's no public API; it's set up through state/EMRI contracts), "BD Heart", "Geneva monitors". | Replaced with a vendor-neutral integration list (Part D). Confirm vendors through procurement. |
| 13 | 🟡 Medium | PDF 3 | Claims about Mercy SafeWatch "450+ beds / VidyoWorks" and Philips Capsule aren't backed by verifiable citations. | Dropped from the spec. If needed, use them only in a pitch deck with real sources. |
| 14 | 🟡 Medium | Canvas 3 | "Dr. Ramesh Kumar" is both the **logged-in doctor and a 72M patient**. Patient Sita Devi is shown as 68F on one screen and 66F on another. | Use separate, consistent dummy data (Part E). |
| 15 | 🟡 Medium | Canvas 3 dashboard | Date reads "**Tue**, 24 Sep 2026", but 24 Sep 2026 is a **Thursday**. | Fix in the mock data. |
| 16 | 🟡 Medium | Three overlapping documents | Screen counts (25 / ~30 / ~35 / "40"), screen names and numbering all disagree. | This document is the **single source of truth**: 32 screens with fixed IDs D-01…D-32. |
| 17 | 🟢 Low | PDF 2 Gantt | The roadmap chart can't be read at that resolution. | Roadmap is in the parent spec §19. |

> **Docx attachment:** the file `Virtual-Hospitalization-RPM-Master-Specification.docx` arrived as raw compressed binary, so I couldn't read it. Upload it into the workspace (or paste its text) and I'll merge anything it has that isn't here.

---

## PART B — Consolidated Screen Specification (32 screens)

### B1. Screen Index

| ID | Screen | Module | Canvas ref | Status |
|---|---|---|---|---|
| D-01 | Login & Role Selection | Access | C1-01 | Kept |
| D-02 | Doctor Dashboard | Home | C1-02, C2-01, C3-01 | Kept |
| D-03 | Patient Queue / Census & Filters | Census | C1-03, C2-02, C3-02 | Kept |
| D-04 | Admission Eligibility | Admission | C1-04 | **Fixed** (hard-stop) |
| D-05 | Consent Review | Admission | C1-05 | **Fixed** (consent scopes) |
| D-06 | Baseline Assessment | Admission | C1-06 | Kept + NEWS2 |
| D-07 | Goals of Care & Code Status | Admission | — | **New** |
| D-08 | Care-Team Assignment | Admission | C1-07 | Kept |
| D-09 | Initial Care Plan & Order Set | Admission | C1-08 | Kept + order sets |
| D-10 | Device & Connectivity Status | Monitoring | — | **New** |
| D-11 | Alarm Thresholds & Monitoring Profile | Monitoring | — | **New** |
| D-12 | ICU Monitoring Dashboard (waveforms + ventilator view) | Monitoring | C1-11 | **Fixed** (view-only) |
| D-13 | Results Viewer (Labs & Imaging) | Clinical | — | **New** |
| D-14 | Unified Patient Chart | Clinical | C1-09, C2-08 | Kept |
| D-15 | Real-Time Vitals & Trends | Monitoring | C1-10 | Kept |
| D-16 | Medication Reconciliation & Allergies | Clinical | — | **New** |
| D-17 | e-Prescription & MAR | Clinical | C1-16 | **Fixed** (RMP/e-sign) |
| D-18 | Order Entry (CPOE) | Clinical | C1-14 | Kept + safety checks |
| D-19 | Lab & Imaging Orders | Clinical | C1-15 | Kept |
| D-20 | Overnight / Since-Last-Seen Review | Rounds | C2-09 | Kept |
| D-21 | Tele-Round Console | Rounds | C1-12 | Kept |
| D-22 | SOAP Progress Note | Rounds | C1-13 | Kept + AI draft |
| D-23 | Alert Inbox | Alerts | C1-17 | **Fixed** (no swipe) |
| D-24 | Alert Detail (Amber / Red) | Alerts | C1-18 | Kept |
| D-25 | Emergency Response Console | Alerts | C1-19 | **Redesigned** |
| D-26 | Escalation Decision | Alerts | C1-20 | Kept |
| D-27 | Hospital Transfer Handover | Alerts | C1-21 | Kept |
| D-28 | Shift Handover (I-PASS) | Team | — | **New** |
| D-29 | Care-Team Chat | Team | C2-20 | Kept |
| D-30 | Family Update | Team | C1-22 | **Fixed** (consent) |
| D-31 | Progress Analytics & History | Clinical | C1-23, C2-22 | Merged |
| D-32 | Discharge (Checklist → Summary → Continuity) | Discharge | C1-23/24/25 | Merged as 3-step flow |

*C1/C2/C3 = canvases 1/2/3 in the order they were attached.*

### B2. Global UI Rules (apply to every screen)
1. **Patient header** on all patient-context screens:
   - Photo, name, age/sex, UHID/ABHA, tier badge (T1 IPD / T2 Step-down / T3 Home-ICU), day of stay.
   - **Code-status chip** (Full / DNR / Limited) and **allergy chip** (red if any allergy is recorded).
2. **Severity colours** (tokens):
   - `critical` #D92D20
   - `urgent` #F79009
   - `advisory` #EAAA08
   - `technical` #2E90FA
   - `stable` #12B76A
   - Always pair colour with an icon and text so it's colour-blind safe.
3. **Persistent emergency access:** a red **"Emergency"** action in the patient header opens D-25 from anywhere.
4. **Data freshness:** every vital shows a "last updated" time. If data is older than 5 min (T2/T3) or 15 min (T1), it turns grey and shows a ⚠ "stale data" warning.
5. **States** every screen must design for: Loading (skeletons), Empty, Error (with retry), Offline (read-only cache plus a banner), and Permission denied.
6. **Audit:** every view, order, acknowledgement and message writes an `AuditEvent`. Patient data is only visible to the care team or the on-call roster. Break-glass access needs a reason.
7. **Signing:** orders, prescriptions, notes and discharge are signed with biometric or PIN plus the RMP registration number.
8. **Accessibility:** touch targets ≥ 48 dp, dynamic text up to 200%, screen-reader labels on charts ("SpO₂ trend, falling from 96 to 89 over 2 hours").

---

### B3. Screen Details

> Format: **Purpose · Key components · Data (FHIR R4) · Rules & states · Acceptance criteria (AC)**

#### D-01 Login & Role Selection
- **Purpose:** secure entry and role context.
- **Components:**
  - Role cards: Doctor/Intensivist, Consultant, On-call Doctor.
  - Mobile + OTP or SSO, MFA, device binding, biometric unlock for returning users.
- **Data:** `Practitioner`, `PractitionerRole`.
- **Rules:** lock after 5 failed attempts; 15-min idle timeout; shift check-in prompt for the on-call role.
- **AC:** without MFA, no patient data loads. The selected role filters the census.

#### D-02 Doctor Dashboard
- **Purpose:** what needs my attention right now.
- **Components:**
  - Greeting and shift.
  - KPI tiles: Total / ICU-tier / IPD-tier / Discharge-ready.
  - **Alert tile** (critical/urgent counts, which open D-23).
  - Pending orders to sign; today's rounds (scheduled/done); unread chat.
  - Bottom nav: Home · Patients · Rounds · Alerts · More.
- **Data:** aggregates of `Encounter`, `Flag`, `Task`, `Appointment`.
- **Rules:** critical alerts are pinned at the top with a pulsing badge. Tiles show counts only, with no PHI on the lock-screen widget.
- **AC:** counts match the census within 5 s of a change.

#### D-03 Patient Queue / Census & Filters
- **Purpose:** the virtual ward list, sorted by acuity.
- **Components:**
  - Tabs: All / ICU-tier / IPD-tier / Alerts / Pending admission / Discharge-ready.
  - Search (name, UHID, ABHA).
  - Patient rows: name, age/sex, tier, day, diagnosis, **NEWS2 score + trend arrow**, status pill, latest HR/BP/SpO₂, data-freshness dot.
  - "+ Admit patient".
- **Default sort:** active Red → Amber → NEWS2 high→low → day of stay.
- **Data:** `Encounter` (status in-progress, class `HH`/`VR`), `Observation` (latest), `RiskAssessment`.
- **AC:** a patient with an active Red alert is always in the first visible rows.

#### D-04 Admission Eligibility *(fixed)*
- **Purpose:** check the referral is safe before a home admission.
- **Components:**
  - 4-step stepper: Eligibility → Consent → Baseline → Confirm.
  - Three checklist groups:
    - **Clinical inclusion:** approved diagnosis, stable vitals, NEWS2 ≤ 4.
    - **Hard exclusions:** vasopressors, blood products, new NIV/invasive ventilation, continuous high-risk infusions, active bleed, unstable arrhythmia.
    - **Home & social:** caregiver available, power and network checked, inside the ambulance radius (≤ 30–45 min), safe home.
  - Auto-filled from the referral and HIS. Map pin with the drive time to the partner ED.
- **Rules:**
  - Any **hard exclusion = blocked**. The CTA changes to "Refer to IPD/ICU".
  - A soft criterion can be overridden only by the MD, with a written reason that is audited.
- **Data:** `ServiceRequest` (referral), `QuestionnaireResponse` (checklist), `Observation`.
- **AC:** with any exclusion ticked, "Proceed" can't be tapped (automated UI test).

#### D-05 Consent Review *(fixed)*
- **Purpose:** record informed consent with granular scopes.
- **Components:**
  - Tabs: Patient consent / Family (LAR) consent.
  - Documents:
    - Virtual hospitalization consent
    - Tele-consultation consent (NMC)
    - Data sharing & privacy (DPDP notice in the user's language)
    - Emergency & transfer consent
    - Video recording (optional)
    - **Family data-sharing scope** (who sees what)
  - Each document has View plus e-sign (Aadhaar e-Sign / OTP / drawn signature) and a timestamp.
- **Data:** `Consent` (one per scope), `DocumentReference` (signed PDF).
- **AC:** monitoring can't start until the mandatory scopes are signed. The family update screen (D-30) only lists recipients covered by a consent scope.

#### D-06 Baseline Assessment
- **Components:**
  - Vitals: BP, HR, SpO₂ (+ O₂ flow), Temp, RR, weight, glucose, plus **auto-calculated NEWS2**.
  - General condition, consciousness (ACVPU/GCS), pain 0–10, frailty (CFS), fall risk, pressure-injury risk (Braden) for T3.
  - Problem list, comorbidities.
- **Data:** `Observation` (LOINC), `Condition`, `RiskAssessment`.
- **Rules:** values outside physiological limits show inline errors; the baseline becomes the reference for trend alerts.
- **AC:** NEWS2 matches the reference calculator for 20 test vectors.

#### D-07 Goals of Care & Code Status *(new)*
- **Purpose:** record what the patient wants in an emergency, before it happens.
- **Components:**
  - Code status: Full / DNR / DNI / Limited, plus escalation ceiling (Transfer to ICU? Yes/No).
  - Surrogate decision-maker, advance directive upload, palliative flag, discussion note and date.
- **Data:** `Consent` (category = advance directive), `Goal`, `Flag`.
- **Rules:** shown as a chip on every patient header. **D-25 changes its actions** based on code status (for example, DNR means comfort-care pathway instead of CPR guidance). Re-confirm on tier change.
- **AC:** the code-status chip shows on all patient-context screens.

#### D-08 Care-Team Assignment
- **Components:**
  - Roles: Primary doctor, Nurse (command centre), Field nurse, Physiotherapist, Dietitian, Caregiver, Specialist on call.
  - Each role has Assign / Change / Optional, with staff search showing availability and load.
- **Data:** `CareTeam`, `PractitionerRole`.
- **Rules:** primary doctor and command-centre nurse are mandatory. Assigning someone notifies them.
- **AC:** alerts route to the assigned nurse within 1 s of creation.

#### D-09 Initial Care Plan & Order Set
- **Components:**
  - Duration estimate, goals (e.g. infection control, SpO₂ ≥ 94%, mobilisation, nutrition).
  - **Condition order set picker:** Pneumonia, CHF, COPD, Cellulitis, Complicated UTI, Post-op, T3 Home-ICU.
  - Interventions (IV antibiotics, nebulisation, physio, diet), visit frequency, monitoring frequency.
  - "Activate care plan".
- **Data:** `CarePlan`, `Goal`, `PlanDefinition` (order set) → `MedicationRequest`/`ServiceRequest`.
- **AC:** activating creates the scheduled tasks for the field and nurse apps.

#### D-10 Device & Connectivity Status *(new)*
- **Components:**
  - Home Hub (online/offline, 4G/Wi-Fi, battery or mains power).
  - Each device: battery, last reading time, signal quality.
  - Data-gap timeline. "Request technician" and "Call patient" actions.
- **Data:** `Device`, `DeviceMetric`, hub heartbeat.
- **AC:** a hub that's offline longer than the tier threshold creates a Blue technical alert.

#### D-11 Alarm Thresholds & Monitoring Profile *(new)*
- **Components:**
  - Per vital: low/high limits, sustained-duration delay, enabled/disabled.
  - Defaults by tier and condition (e.g. COPD SpO₂ target 88–92%).
  - "Why changed" reason, expiry/review time.
- **Rules:**
  - Limits outside the safe bounds need a second sign-off.
  - Every change is audited and shown on the chart.
  - The Critical tier can't be disabled.
- **AC:** a threshold change reaches the alarm engine within 10 s.

#### D-12 ICU Monitoring Dashboard *(fixed — view-only)*
- **Components:**
  - Live waveforms: ECG lead II, SpO₂ pleth, RR, optional EtCO₂.
  - Numerics: HR, SpO₂, RR, NIBP, Temp, plus urine/fluid balance if recorded.
  - **Ventilator/BiPAP telemetry panel** (mode, FiO₂, PEEP/EPAP, Vt, RR, leak, alarms), **read-only**.
  - Freeze/scroll 30 s, full-screen landscape.
- **Data:** `Observation` (sampled-data for waveforms), `DeviceMetric`.
- **Rules:** **no remote device control.** Changes go out as an order to the on-site nurse or RT.
- **AC:** waveform lag ≤ 3 s when on 4G.

#### D-13 Results Viewer *(new)*
- **Components:**
  - Labs table with reference ranges and abnormal flags, plus trend sparklines.
  - Imaging reports (PDF/DICOM viewer link).
  - POC results (blood gas, electrolytes) tagged by source.
  - "Acknowledge result".
- **Data:** `DiagnosticReport`, `Observation`, `ImagingStudy`.
- **Rules:** critical values create an Amber/Red alert and must be acknowledged.
- **AC:** an unacknowledged critical result escalates after 30 min.

#### D-14 Unified Patient Chart
- **Components:**
  - Tabs: Overview · Vitals · Orders · Notes · Results · Meds.
  - Overview cards: BP, HR, SpO₂, Temp, RR, Pain, NEWS2.
  - Diagnosis, allergies, active meds count, clinical notes count, care team, code status.
- **Data:** `Patient`, `Encounter`, `Condition`, `AllergyIntolerance`, `Observation`.
- **AC:** tapping any vital opens D-15 filtered to that vital.

#### D-15 Real-Time Vitals & Trends
- **Components:**
  - Range chips: Live / 1h / 6h / 24h / 72h.
  - Per-vital charts with threshold bands.
  - Event markers (meds given, alerts, visits); NEWS2 timeline.
  - Export PDF/CSV.
- **AC:** pinch-zoom works; tapping a point shows value, time and device.

#### D-16 Medication Reconciliation & Allergies *(new)*
- **Components:**
  - Home meds vs hospital meds vs current orders: continue/stop/modify per line.
  - Allergy list with reaction and severity.
  - Interaction warnings.
- **Data:** `MedicationStatement`, `MedicationRequest`, `AllergyIntolerance`.
- **AC:** the first virtual-ward prescription can't be signed until reconciliation is done.

#### D-17 e-Prescription & MAR *(fixed)*
- **Components:**
  - Tabs: Active / All / History.
  - Each line: drug, dose, route, frequency (1-0-1 style), day x/y, status (Given / Due / Missed / PRN / Held), administered by and time.
  - "Send e-Prescription".
- **Compliance:** e-Rx carries the RMP name, qualification, **registration number**, digital signature, patient ID and date, and follows the **NMC Telemedicine Practice Guidelines** drug lists. Sent to the partner pharmacy; status is tracked.
- **Data:** `MedicationRequest`, `MedicationAdministration`, `MedicationDispense`.
- **AC:** a missed dose older than 60 min creates an Advisory alert. High-alert drugs need double confirmation.

#### D-18 Order Entry (CPOE)
- **Components:**
  - Tabs: Medications · Labs · Imaging · Nursing/Visits · Consults.
  - Search with formulary auto-complete, dose/route/frequency/duration pickers, order cart, "Review & send".
- **Safety checks:** allergy, duplicate therapy, dose range by weight and renal function, drug–drug interactions. **Home-ineligible drugs** (vasopressors, heparin/insulin infusions, blood products) are blocked with "Requires hospital admission".
- **Data:** `MedicationRequest`, `ServiceRequest`, `Task`.
- **AC:** a blocked drug can't be ordered; the attempt is logged.

#### D-19 Lab & Imaging Orders
- **Components:**
  - Checklist panels (CBC, CRP, LFT, KFT, electrolytes, blood culture, ABG/VBG, procalcitonin, ECG 12-lead, portable chest X-ray, POCUS).
  - Priority (Routine/Urgent/STAT), specimen instructions, clinical indication.
  - Collection mode: field phlebotomy / POC / transfer to centre.
- **Data:** `ServiceRequest`, `Specimen`.
- **AC:** an urgent order creates a field task with an SLA (≤ 60 min).

#### D-20 Overnight / Since-Last-Seen Review
- **Components:**
  - Date range, combined trend (HR/SpO₂/BP).
  - **Clinical events list** (e.g. 02:15 SpO₂ ↓ 88%, 02:17 nebulisation given, 04:30 SpO₂ ↑ 95%, 06:00 stable).
  - Nurse notes. "Mark as reviewed".
- **AC:** "Mark as reviewed" clears the "unseen events" badge for this doctor only.

#### D-21 Tele-Round Console
- **Components:**
  - Full-screen video plus picture-in-picture self view.
  - Multi-party (patient, field nurse, family, interpreter).
  - **Live vitals overlay toggle**, screen-share of results, chat, snapshot (with consent), timer.
  - Mute/Video/Share/Chat/End.
  - Fallback: audio-only, then a PSTN call.
- **Data:** `Encounter` (virtual), `Communication`, `Media` (snapshots).
- **AC:** ending the call opens D-22 with the encounter linked.

#### D-22 SOAP Progress Note
- **Components:**
  - S / O / A / P tabs. **O auto-fills** with the latest vitals, NEWS2 and new results.
  - Voice dictation; *optional AI draft* (clinician must edit/sign).
  - "Convert plan item to order" (opens D-18). Save / Sign.
- **Data:** `Composition` (progress note) / `DocumentReference`.
- **AC:** an unsigned note older than 12 h shows on the dashboard as pending.

#### D-23 Alert Inbox *(fixed)*
- **Components:**
  - Filter chips: All / Red / Amber / Advisory / Technical.
  - Row: patient, alert text (e.g. "SpO₂ 84% (Critical)"), source device, age.
  - **Explicit "Acknowledge" and "Open" buttons, no swipe actions.**
  - Ack SLA countdown on Red.
- **Rules:**
  - Red: can't be snoozed; auto-escalates after 60 s if not acknowledged.
  - Amber: snooze ≤ 15 min, reason required.
- **Data:** `Flag`, `DetectedIssue`, `Communication`.
- **AC:** the ack time (median and p95) is recorded per alert.

#### D-24 Alert Detail (Amber / Red)
- **Components:**
  - Severity banner with ack countdown; triggering value vs threshold.
  - 2-h mini-trend; other vitals (HR, RR, BP); trigger source (device); current status note from the nurse.
  - Code-status chip.
  - Actions: **Start video call** · **Dispatch field team** · **Escalate** · Resolve (with reason).
- **AC:** every action is time-stamped on the patient timeline.

#### D-25 Emergency Response Console *(redesigned)*
- **Purpose:** coordinate the response to an acute emergency at home. The clinical work at the bedside is done by the people physically there.
- **Components:**
  - **LIVE EMERGENCY** banner with elapsed timer; latest vitals.
  - Response tracker:
    - Nurse at home: En route / On site
    - Doctor: On call
    - **Ambulance (108/112/private): Requested → ETA**
    - Receiving ED: Pre-alerted
  - **Caregiver guidance mode:** pushes step-by-step CPR / recovery-position / suction instructions to the caregiver app and Home Hub (only if code status = Full).
  - One-tap: **Call ambulance**, **Call caregiver**, **Video to home**, **Notify receiving ED**.
  - Event log: auto plus manual, timestamped.
- **Rules:**
  - Code status changes what's offered: DNR shows the comfort-care pathway, the palliative contact, and no CPR prompt.
  - Closing the console requires an outcome (transferred / stabilised at home / death) and generates D-27 or an incident report.
- **Data:** `Encounter` (emergency), `Task` (dispatch), `Communication`, `AuditEvent`.
- **AC:** "Call ambulance" places the call and sends location plus summary in ≤ 2 taps.

#### D-26 Escalation Decision
- **Components:**
  - Current status summary.
  - Recommendation (rules-based).
  - Options:
    - Continue home care with new orders
    - Upgrade tier (e.g. T1 → T2) / urgent field visit
    - **Transfer to hospital**
  - Reason (structured: haemodynamic instability, respiratory failure, neuro change, patient/family request, device/home failure) plus free text.
- **Data:** `Task`, `ClinicalImpression`.
- **AC:** choosing Transfer opens D-27 already pre-filled.

#### D-27 Hospital Transfer Handover
- **Components:**
  - Handover summary: diagnosis, current vitals, meds, recent events, allergies, code status.
  - Receiving hospital (partner list with ED/ICU bed status if integrated).
  - Attachments: clinical summary, latest vitals, lab reports, ECG.
  - "Send handover package".
- **Data:** FHIR `Bundle` (document) with `Composition`, sent via HIS integration / ABDM HIP. A `ServiceRequest` is the transfer request.
- **AC:** the package is delivered or acknowledged by the receiving facility, or it falls back to a secure PDF link with a call.

#### D-28 Shift Handover (I-PASS) *(new)*
- **Components:**
  - Per patient: **I**llness severity, **P**atient summary, **A**ction list, **S**ituation awareness/contingency, **S**ynthesis by receiver.
  - Receiver must accept the handover.
- **Data:** `Composition` (handoff), `Task`.
- **AC:** the outgoing doctor can't end their shift until every assigned patient has been handed over.

#### D-29 Care-Team Chat
- **Components:**
  - Tabs: Team / Family / Field team.
  - Patient-context threads, @mentions, images (stored in the chart, not the phone gallery), voice notes, read receipts, priority flag.
- **Rules:** chat is **not used for emergencies**; the composer has a banner linking to D-25. Messages are retained per policy.
- **Data:** `Communication`.

#### D-30 Family Update *(fixed)*
- **Components:**
  - Update text (templates: Stable / Improving / Plan change / Visit time / Discharge plan, all editable).
  - Recipients (**only consented contacts** from D-05).
  - "Include latest reports" toggle (respects consent scope).
  - Language selection; delivered by app push plus WhatsApp/SMS link.
- **Data:** `Communication`, checked against `Consent`.
- **AC:** an unconsented recipient can't be selected.

#### D-31 Progress Analytics & History
- **Components:**
  - Tabs: Vitals / Treatment / Notes / Events.
  - SpO₂ and other trends over the stay; average SpO₂; episodes count; improvement %.
  - Key indicators (fever resolved, O₂ requirement ↓, mobility, labs trending normal).
  - Daily NEWS2/SOFA.
  - Timeline of admissions, alerts, escalations, notes.
- **Data:** aggregates of `Observation`, `RiskAssessment`, `AuditEvent`.

#### D-32 Discharge — 3-step flow
1. **Checklist:**
   - Clinically stable ≥ 24–48 h
   - Meds reconciled
   - Caregiver trained
   - Follow-up booked
   - Devices pickup scheduled
   - Home-care instructions given
   - Discharge summary prepared
   
   "Mark for discharge" is enabled only when every item is ticked.
2. **Summary:**
   - Auto-generated hospital course, discharge meds, follow-up, red-flag symptoms in the patient's language.
   - Doctor edits and signs. Download PDF / share to family / **push to ABHA (ABDM DischargeSummary)**.
3. **Post-discharge continuity:**
   - Next follow-up (video), remote monitoring toggle (e.g. 14 days, T0), home-care plan, reschedule.
- **Data:** `Composition` (Discharge Summary), `Appointment`, `CarePlan` (T0), `Encounter` status → finished.
- **AC:** discharge closes the virtual bed, creates the device-pickup task, and starts the 30-day follow-up schedule.

---

## PART C — FHIR R4 Mapping Corrections

| Used in the PDFs | Problem | Use instead (R4 / ABDM) |
|---|---|---|
| `ReferralRequest` | Removed after STU3 | `ServiceRequest` (intent = order, category = referral/transfer) |
| `ProcedureRequest` | Removed after STU3 | `ServiceRequest` / `Task` |
| `OrderRequest` | Doesn't exist | `MedicationRequest` / `ServiceRequest` |
| "ClinicalNote" | Not a resource | `Composition` (structured) or `DocumentReference` |
| "ImagingStudy requests" | `ImagingStudy` holds results, not orders | `ServiceRequest` (order) → `ImagingStudy` + `DiagnosticReport` (result) |
| `AdverseEvent` for Code Blue log | Wrong semantics | `Encounter` + `Task` + `AuditEvent`; `AdverseEvent` only for harm incidents |
| "Alert resource" | Doesn't exist | `Flag` / `DetectedIssue` + `Communication` |
| `Media` for waveforms | Not the right fit | `Observation` with `valueSampledData` |
| FHIR v5 references | ABDM is built on R4 | Pin **FHIR R4 (4.0.1)** with ABDM profiles |

---

## PART D — Integration Partners (vendor-neutral, India-first)

| Category | Options to evaluate | Integration |
|---|---|---|
| Wearables / RPM | Clinical-grade patches/armbands with SDK or cloud API | BLE → Home Hub, or cloud-to-cloud → `Observation` |
| Bedside monitors | Philips, GE, Mindray, Nihon Kohden, Dräger (whichever your DME partner supplies) | HL7 v2 ORU / vendor gateway → `Observation` |
| Home ventilators/BiPAP | ResMed, Philips, Löwenstein and others (check telemetry access) | Vendor cloud API, **read-only** |
| Video | LiveKit (self-host), Agora, 100ms, Zoom Video SDK | WebRTC SDK in app; recordings only with consent |
| HIS/EHR/LIS | Partner hospital HIS | HL7 v2 / FHIR APIs |
| National stack | **ABDM** (ABHA, HIP/HIU, Consent Manager), **NHCX** claims | ABDM gateway (R4 profiles) |
| e-Pharmacy | Licensed partner pharmacy chains | e-Rx API / signed PDF |
| Ambulance | 108/112 (via state service agreements), private networks | Phone plus dispatch API where contracted |
| Cloud | AWS / Azure / GCP India regions | Data stays in India (DPDP) |
| Auth | Keycloak / Cognito / Auth0 (OIDC, MFA) | RBAC + ABAC, audit |

---

## PART E — Mock Data Fix-list (for Figma)

| Field | Current | Use |
|---|---|---|
| Logged-in doctor | Dr. Ramesh Kumar (also used as a patient on canvas 3) | Dr. Ramesh Kumar, Intensivist, Reg. No. `MCI-XXXXX` (placeholder) |
| Patient 1 | Sita Devi 68F / 66F (inconsistent) | **Sita Devi, 68F**, T1 IPD Day 3, Pneumonia, Stable |
| Patient 2 | Mohan Yadav 72M ICU Sepsis | **Mohan Yadav, 72M**, T2 Day 1, Sepsis → Critical → **Transfer** (this is the escalation storyline) |
| Patient 3 | Ram Prasad 60M | **Ram Prasad, 60M**, T1 IPD Day 1, Post-surgery, Stable |
| Patient 4 | Sunita Kumari 72F ICU Day 4 | **Sunita Kumari, 72F**, **T3 Home-ICU** Day 4, chronic respiratory failure on home ventilator, code status: Limited (no intubation) |
| Dashboard date | "Tue, 24 Sep 2026" | "Thu, 24 Sep 2026" |
| Emergency number | 911 | 108 / 112 |
| Code-Blue screen title | "CODE BLUE" | "LIVE EMERGENCY" |

---

## PART F — Figma Hand-off Checklist
- [ ] Rebuild the screens using IDs **D-01…D-32**, one Figma page per module.
- [ ] Components with variants:
  - Patient header (tier × code status × allergy)
  - Vital tile (normal/urgent/critical/stale)
  - Alert row (4 severities)
  - Status pill
  - Waveform card
  - Order line
  - MAR line (Given/Due/Missed/PRN/Held)
- [ ] Design tokens for colour, type, spacing and radius, exported for Flutter (Doctor app) and React (Command Centre).
- [ ] Prototype links for the three critical journeys:
  1. Admission D-03→04→05→06→07→08→09
  2. Red alert D-23→24→26→27, with the D-25 branch
  3. Discharge D-32 steps 1→2→3
- [ ] Design every state (Loading/Empty/Error/Offline/Stale) for D-03, D-12, D-15, D-23, D-25.
- [ ] Usability test with ≥ 5 doctors and ≥ 5 nurses (IEC 62366 formative). The emergency flows must be completable in under 30 s.
- [ ] Clinical-safety review sign-off on D-04, D-07, D-11, D-18, D-25 before development.

---
*Clinical rules, thresholds and drug restrictions here are design starting points. MyDoctor24's clinical governance committee and regulatory counsel must approve them.*

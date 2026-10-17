# MYDR24 Master Specification — Domain 2: Chronic Care Management (CCM) & Longitudinal Remote Patient Monitoring (RPM)

| Item | Detail |
|---|---|
| Document | Stage 1 consolidated domain specification (**for approval; no screens to be generated yet**) |
| Version | 2.1-draft (adds Domain 2 to master v2.0) |
| Date | 17 October 2026 |
| Parent / sibling documents | `virtual-hospital-ecosystem-and-mobile-app-spec.md` (Domain 1: Virtual Hospitalization platform), `mydoctor24-doctor-app-master-screen-spec.md` (Doctor app D-01…D-32), `virtual-hospitalization-research.md` (evidence) |
| Figma sources | *Caregiver Flow Final (MyDr.24)* and *MVP-1 Instant Service Flow (MyDr.24)*. **Couldn't open: the links need a Figma login (HTTP 403).** Component reuse below is based on the shared canvases and is marked **"verify"**. |
| Status of clinical content | **DRAFT. Every disease programme, threshold, interval and alert rule needs sign-off by the MYDR24 Clinical Governance Committee (CGC) before build.** |

### Delivery-order tracker (from the brief §17)

| Step | Description | Status |
|---|---|---|
| 1 | Research chronic-care models, guidelines, regulations | ✅ Done (Section 1, Evidence Register in Section 20) |
| 2 | Add Chronic Care domain to master specification | ✅ This document + change log (Section 19) |
| 3 | Update screen inventory and role-permission matrix | ✅ Sections 15 and 16 |
| 4 | Present consolidated document for approval | ⏳ **Awaiting your approval** (decisions in Section 21) |
| 5–8 | Generate Phase 1–4 screens (Doctor → Nurse/Caregiver → Patient/Family → Allied) | 🔒 Blocked until step 4 is approved |
| 9 | Validate the full cross-role CCM ↔ Virtual IPD journey | 🔒 Blocked |

---

## 1. Research Summary (what the evidence supports and what it doesn't)

| Topic | Key finding | Design implication |
|---|---|---|
| **Chronic Care Model (Wagner)** | Interventions that consistently improved care fell into four categories: changes to the way care is delivered, education and support for patients, educating or reminding providers, and changes to information systems [EV-01]. In diabetes, *delivery-system design* and *self-management support* showed the largest effects [EV-02]. | Technology alone isn't the intervention. Every programme combines a care team, scheduled reviews, self-management support and decision support. |
| **Standardised protocols (India)** | WHO HEARTS and the India Hypertension Control Initiative use **drug- and dose-specific standard treatment protocols** with team-based care and information systems [EV-03, EV-04]. ICMR publishes Standard Treatment Workflows (STWs), e.g. T2DM and CKD [EV-05]. | Programme templates reference CGC-approved protocols (ICMR STW / national programme) and can be configured per partner. |
| **Hypertension** | The 2025 ACC/AHA guideline keeps <130/80 mmHg as the general target and gives home BP monitoring a bigger role [EV-06]. Telemonitoring reduced SBP by about 3.7 mmHg vs usual care in a network meta-analysis [EV-07]; self-measured home BP alone gives a smaller reduction [EV-08]. | Home BP **plus clinician co-intervention** (titration reviews), not readings alone. The target is set per patient by the clinician. |
| **Diabetes** | The ADA Standards of Care 2026 widen CGM eligibility and assess glycaemic status with A1C, BGM and CGM metrics (TIR, TBR, GMI) [EV-09, EV-10]. | Support CGM and BGM sources, plus CGM summary metrics. Hypoglycaemia gets its own escalation pathway. |
| **Heart failure** | A 2026 meta-analysis found remote monitoring reduced HF hospitalisations (IRR 0.81) and all-cause mortality (RR 0.90) [EV-11]. Another systematic review found **heterogeneous, mostly neutral** results, especially for mortality [EV-12]. Guideline therapy: ESC 2021 + 2023 focused update [EV-13]. | HF telemonitoring is reasonable for selected patients, but don't claim it "prevents hospitalisation". Build GDMT-optimisation tasks (clinician-led). |
| **COPD** | GOLD 2026 makes *disease activity* a treatment target, lowers the Group E threshold to ≥1 moderate/severe exacerbation, and adds a technology section [EV-14]. | Exacerbation history drives programme intensity. Symptom diary and action plan are core; SpO₂ only where clinically indicated. |
| **CKD** | KDIGO 2024 classifies CKD by Cause, GFR and albuminuria (CGA). Monitoring frequency follows the risk heat map [EV-15]. | The CKD programme schedules eGFR and uACR by heat-map category, set by the clinician. |
| **Regulation — India** | **DPDP Rules 2025** were notified 13 Nov 2025 with phased commencement: Consent-Manager provisions from **Nov 2026** and core obligations from **May 2027** [EV-16]. Also applicable: NMC Telemedicine Practice Guidelines 2020, ABDM, CDSCO SaMD rules, NABH. | Build for full DPDP compliance now: consent ledger, notice, rights, breach handling. Long-term programmes will outlive the transition period. |
| **Regulation — US (future)** | CMS 2026 Physician Fee Schedule added RPM code **99445** (2–15 days of data/30 days) and **99470** (first 10 min management) [EV-17]. | Capture monitoring days and clinician time per patient-month. This also supports India payer reporting. |

> **Evidence gaps (honest):** I haven't yet reviewed current guidelines for stroke, Parkinson's, arthritis/MSK, obesity, thyroid, frailty/multimorbidity, asthma (GINA) or post-operative pathways. They're marked **EV-TBD**, and the CGC's clinical leads must attach the source before those programmes can be approved.

---

## 2. Care Pathways & Status Model

> **Terminology update (Master v3.0):** the master specification now defines four top-level pathways: **A Acute (ACU), B Chronic (CCM), C Virtual IPD (VIPD), D RPM/Elderly Care (RPM)**. The chronic-care *sub-variants* below were renamed to avoid clashing with those letters. "Monitoring-only enrolment" (`RPM-ONLY`) is now **Pathway D**.

### 2.1 Chronic Care Sub-variants

| Code | Sub-variant | Who | Core components | Monitoring mode |
|---|---|---|---|---|
| **CCM-STD** | Chronic Care Management | Patients needing planned long-term follow-up | Care plan, scheduled reviews, med review, lifestyle and self-management support, periodic reassessment | Per plan |
| **CCM-IOT** | Chronic Care **with** IoT/RPM | CCM-STD **plus** a clinician-approved device monitoring plan | Above + connected devices, data-freshness rules, device support | `IOT` or `HYBRID` |
| **CCM-MAN** | Chronic Care **without** IoT | CCM-STD patients managed without connected devices | Consultations, patient-reported outcomes (PROs), manual readings entered by the patient/nurse, home visits, labs | `MANUAL` |
| **CCM-ESC** | Deterioration → Acute/Virtual IPD reassessment | Any enrolled patient with acute or worsening illness | Clinical reassessment, then a decision: adjust plan / Acute Care episode / urgent visit / Virtual IPD eligibility (D-04) / ED | Inherits |

> **CCM-IOT and CCM-MAN are one programme with different monitoring modes**, not separate products. A patient can switch modes (for example, a device is returned) without being re-enrolled. Every mode change is audited.

### 2.2 Three Distinct Enrolment Statuses (never merged)

| Record | FHIR | Purpose | Owner |
|---|---|---|---|
| **Monitoring-only enrolment (Pathway D)** | `EpisodeOfCare` type=`RPM` | Time-limited device monitoring under a clinician order with a defined review owner, **without** a comprehensive care plan (e.g. 14-day post-discharge T0, BP diagnosis week) | Ordering clinician |
| **Chronic-care enrolment** | `EpisodeOfCare` type=`CCM` + `CarePlan` (one per programme; multimorbidity = a *coordinated* plan across programmes) | Long-term managed care | Primary clinician (responsible) |
| **Virtual IPD admission** | `Encounter` class=`HH` (inpatient-level at home), linked to the CCM episode | Acute inpatient-level care at home | Admitting hospitalist |

### 2.3 Status Lifecycle

| From | Event / condition | To |
|---|---|---|
| (start) | Referral received | Referred |
| Referred | Intake started | Screening |
| Screening | Criteria not met (reason recorded) | NotEligible |
| Screening | Clinician authorises + consent signed | Enrolled |
| Enrolled | Baseline done + care plan signed | Active |
| Active | Deterioration trigger (rule or human) | ReassessmentRequired |
| ReassessmentRequired | Clinician: manage in CCM (plan updated) | Active |
| ReassessmentRequired | Clinician opens an Acute Care episode (CCM stays Active, linked) | Active + ACU episode |
| ReassessmentRequired | Clinician admits to Virtual IPD (D-04 passed) | SuspendedForIPD |
| ReassessmentRequired | ED / hospital admission | SuspendedForHospital |
| SuspendedForIPD | IPD discharge | PostAcuteReview |
| SuspendedForHospital | Hospital discharge notified | PostAcuteReview |
| PostAcuteReview | Med reconciliation + plan review signed | Active |
| Active ↔ OnHold | Patient request / travel / device gap (reason) | OnHold / Active |
| Active | Goals met, step-down approved | Graduated |
| Active | Patient withdraws consent | Withdrawn |
| Active | Transfer of care / death / programme end | Closed |

**Emergency bypass (all states):** patient SOS, an emergency symptom report, or a caregiver emergency call goes **straight to the Emergency Pathway** (Command Centre + 108/112, from the Domain 1 spec). Routine CCM workflow steps are never inserted in front of an emergency.

### 2.4 Transition Rules

| # | From → To | Who can authorise | Pre-conditions | System effects |
|---|---|---|---|---|
| T1 | Screening → Enrolled | Responsible clinician | Inclusion met, no exclusion, consent scopes signed (incl. family access) | Creates `EpisodeOfCare`; assigns care team |
| T2 | Enrolled → Active | Responsible clinician | Baseline assessment, med reconciliation, signed care plan | Schedules tasks and measurements |
| T3 | Active → ReassessmentRequired | **Rule engine or any care-team member** | Trigger fired (Section 8) | Creates reassessment task with an SLA from service policy; **doesn't change care level** |
| T4 | ReassessmentRequired → SuspendedForIPD | **Doctor only, after clinical assessment** | D-04 Virtual IPD eligibility passed; IPD consent | CCM plan **suspended, not cancelled**; chronic meds reconciled into IPD orders; CCM alerts muted *only* for parameters the IPD monitors (traced) |
| T5 | Any → SuspendedForHospital | Any clinician; or auto when a hospital admission notice (ADT) arrives | — | Same as T4; CCM team notified |
| T6 | Suspended* → PostAcuteReview → Active | Responsible clinician | Discharge summary received, med reconciliation, plan review | Restores the plan as a **new version**; the earlier version is kept |
| T7 | Active → Graduated / Withdrawn / Closed | Responsible clinician (Withdrawn: the patient) | Reason; handover letter if care transfers | Stops devices/tasks; data kept per retention policy |

> **AI can't trigger T4, T5, T6 or T7.** AI may only raise T3 as a *suggestion*, which a human confirms (Section 13).

---

## 3. Disease Programme Catalogue (configurable templates)

Each programme is a versioned `PlanDefinition` with these sections:
- Population
- Inclusion and exclusion criteria
- Assessments
- Monitoring (IoT and manual options)
- Review intervals
- Escalation rules
- Responsibilities
- Evidence
- Approval

The table holds **draft defaults for CGC review**. The responsible clinician individualises them per patient; nothing here is a universal prescription.

| Prog. | Population & inclusion (draft) | Key exclusions → other pathway | Baseline & periodic assessments | Monitoring options (if clinically relevant) | Review cadence (draft, configurable) | Example escalation triggers (detail in Section 8) | Core team | Evidence |
|---|---|---|---|---|---|---|---|---|
| **DM-T2 / DM-T1** | Confirmed T1/T2 diabetes | DKA/HHS signs, pregnancy (→ obstetric pathway), paediatric T1 (→ paediatric endocrine) | A1C, lipids, renal (eGFR/uACR), eye and foot exam, hypoglycaemia history | BGM log or CGM (TIR/TBR/GMI); weight; BP | A1C per ADA (more often if not at goal); clinician reviews per protocol | Level 2/3 hypoglycaemia; persistent hyperglycaemia above the patient's plan threshold; foot ulcer | Physician/diabetologist, nurse educator, dietitian | EV-05, EV-09, EV-10 |
| **HTN** | Confirmed hypertension (HBPM/ABPM/clinic) | Suspected secondary/malignant HTN, pregnancy | BP, CV risk, renal, ECG | Validated home BP cuff (protocol-based measurement weeks); manual entry | Titration reviews while not at target; then periodic | Severe BP with symptoms (emergency); severe BP without symptoms (urgent review); sustained above target | Physician, nurse | EV-03, EV-04, EV-06–08 |
| **CKD** | CKD by KDIGO CGA | Rapid eGFR decline, dialysis planning (→ nephrology-led) | eGFR, uACR, K⁺, Hb, BP, med review (nephrotoxins, dose adjustment) | BP; labs by heat-map category; weight/fluid if clinician directs | Labs per KDIGO heat-map frequency | Critical K⁺; AKI-pattern creatinine rise; fluid overload symptoms | Physician/nephrologist, dietitian, pharmacist | EV-05, EV-15 |
| **HF** | Diagnosed HF (any EF) | NYHA IV at rest / cardiogenic signs (→ hospital) | NYHA, EF, NT-proBNP (where available), renal, K⁺, GDMT status | Daily weight, symptoms, BP/HR; SpO₂ optional | GDMT optimisation visits; then periodic | Weight gain above the patient's clinician-set threshold; worsening dyspnoea/orthopnoea; hypotension on titration | Cardiologist/physician, HF nurse, dietitian, pharmacist | EV-11–13 |
| **CAD / post-cardiac event** | Stable CAD, post-ACS/PCI/CABG | Unstable angina symptoms (→ emergency) | Lipids, BP, glucose, adherence (antiplatelet), cardiac rehab status | BP/HR; activity; symptoms | Per cardiology plan | Chest-pain symptoms (emergency); missed antiplatelet (adherence alert) | Cardiologist, physio (rehab), dietitian | EV-TBD |
| **COPD** | Spirometry-confirmed COPD | Acute exacerbation needing hospital/NIV | CAT/mMRC, exacerbation history (GOLD ABE), inhaler technique, eosinophils | Symptom diary; SpO₂ where clinician-indicated; activity | Higher intensity for Group E | Exacerbation symptoms per action plan; SpO₂ below the patient's target band | Pulmonologist/physician, respiratory physio, nurse | EV-14 |
| **Asthma** | Diagnosed asthma | Life-threatening attack features (→ emergency) | Control score, triggers, inhaler technique, action plan | Symptom diary; peak flow optional | Per control level | Action-plan red zone | Physician, nurse | EV-TBD (GINA) |
| **Stroke recovery / neuro** | Post-stroke/TIA, other neuro follow-up | New focal deficit (→ emergency stroke pathway) | mRS/Barthel, BP, AF status, swallowing, mood | BP; function PROs; falls | Per neuro/rehab plan | New neuro symptoms (emergency); falls; BP above target | Neurologist, physio, OT, SLP | EV-TBD |
| **Parkinson's & long-term neuro** | Diagnosed PD/other | Acute confusion/aspiration (→ urgent) | Motor/non-motor scales, falls, swallowing, cognition | Medication-timing adherence; falls log | Per neurology plan | Missed time-critical doses; falls; swallowing difficulty | Neurologist, physio, SLP, pharmacist | EV-TBD |
| **Arthritis / MSK** | OA/RA/chronic MSK | Septic joint signs (→ urgent) | Pain/function scores; DMARD lab monitoring for RA | PROs; activity | Per rheumatology/DMARD schedule | Abnormal DMARD labs; infection signs on immunosuppression | Physician/rheumatologist, physio | EV-TBD |
| **Obesity / metabolic** | BMI/waist criteria per CGC | Eating disorder (→ specialist) | Weight, waist, BP, glucose, lipids, comorbidities | Weight scale; activity | Per plan | Rapid unintended change; medication side effects | Physician, dietitian, physio | EV-TBD |
| **Thyroid** | Hypo/hyperthyroidism | Thyroid storm / myxoedema signs (→ emergency) | TSH ± FT4 | Symptom PROs | Labs after dose change per protocol | Abnormal TSH outside plan; symptoms | Physician/endocrinologist | EV-TBD |
| **Frailty & multimorbidity (elderly)** | ≥2 chronic conditions and/or frailty (e.g. CFS ≥ CGC threshold) | — | Comprehensive geriatric assessment, polypharmacy review, falls, cognition, carer status | Mix by conditions; fall sensors optional | Coordinated single plan; regular MDT review | Functional decline; falls; carer breakdown | Geriatrician/physician, nurse, physio, pharmacist, social worker | EV-TBD |
| **Post-op / post-discharge continuity** | Recent surgery or hospital/VIPD discharge | Surgical complications (→ surgeon/ED) | Wound, pain, mobility, VTE signs, discharge meds | Vitals per discharge plan; wound photos | Time-limited (e.g. 30 days), then graduate or move to a disease programme | Wound infection signs; uncontrolled pain; VTE symptoms | Surgeon/physician, nurse, physio | EV-TBD |

**Programme approval checklist (each programme):**
- ☐ Evidence source attached
- ☐ Thresholds and intervals signed off
- ☐ Escalation rules signed off
- ☐ Patient education content approved
- ☐ Responsibilities agreed with staffing
- ☐ Version number and review date

---

## 4. Longitudinal Patient Profile

| Profile section | FHIR R4 resource(s) | History rule |
|---|---|---|
| Demographics & verified identity (ABHA/Aadhaar-verified flag, method, date) | `Patient`, `Patient.identifier`, `Provenance` | Version history; identity verification events kept |
| Active chronic conditions | `Condition` (clinicalStatus, verificationStatus, onset, abatement) | Status changes create new versions; **no deletes** (use `entered-in-error`) |
| Medical & surgical history | `Condition`, `Procedure` | Append-only |
| Allergies & ADRs | `AllergyIntolerance` (criticality, reaction) | Append-only, refuted entries kept |
| Current medications & reconciliation history | `MedicationStatement`, `MedicationRequest`, `List` (reconciliation snapshots) | Every reconciliation saved as a dated `List` |
| Consultations & admissions (incl. VIPD) | `Encounter`, `EpisodeOfCare` | Immutable once finished |
| Labs & diagnostics | `DiagnosticReport`, `Observation` | Corrections via `amended` status |
| Observations & trends | `Observation` (with device, method, data-quality extensions) | Raw readings never edited; annotations separate |
| Deteriorations & escalations | `Flag`, `DetectedIssue`, `Task`, `Encounter` | Append-only |
| Specialist assessments | `ServiceRequest` → `Task` → `DiagnosticReport`/`DocumentReference` | Recommendations stored separately from orders |
| Comorbidities & risk factors | `Condition`, `RiskAssessment`, `Observation` (social history) | Versioned |
| Functional status & mobility | `Observation` (Barthel, CFS, etc.), `QuestionnaireResponse` | Time series |
| Lifestyle & social | `Observation` (smoking, alcohol, activity), SDOH questionnaire | Time series |
| Patient-defined goals / clinician goals | `Goal` (`expressedBy` patient vs practitioner) | Achievement status history |
| Care-plan versions & review dates | `CarePlan` (`replaces`, `period`, extension `nextReviewDate`) | **Each change is a new version; the old one is kept** |
| Care team & primary clinician | `CareTeam` | Membership periods |
| Emergency contacts & family access | `RelatedPerson` + `Consent` (scope) | Consent history kept |
| Consent & communication preferences | `Consent`, `Patient.communication`, preference extension | Ledger |
| Upcoming follow-ups & pending actions | `Appointment`, `Task`, `ServiceRequest` | — |

**Rule:** clinically significant data is **never silently overwritten**. Every change records who, when, why and the source (`Provenance`). A UI "edit" makes a new version with a reason.

---

## 5. Individualised Chronic Care Plan

### 5.1 Structure (all 16 required elements)

| # | Section | Content rules |
|---|---|---|
| 1 | Diagnoses & comorbidities | Confirmed `Condition`s only; unconfirmed shown as "provisional" |
| 2 | Baseline & risk | Linked baseline observations and risk tools used (name and version) |
| 3 | Patient goals | In the patient's own words + clinician-agreed measurable goal |
| 4 | Observations & frequency | Per parameter: source (device/manual/lab), frequency, target range, **who reviews** |
| 5 | Investigations & schedule | Labs/imaging with due dates |
| 6 | Medication plan | Reconciled list; **reconciliation due dates** |
| 7 | Lifestyle & self-management | From the approved education library only |
| 8 | Dietitian / physio referrals | `ServiceRequest` with clinical question |
| 9 | Doctor & specialist appointments | `Appointment` schedule |
| 10 | Nursing / home care | Visit frequency and task list with **required qualification** |
| 11 | Patient education | Assigned modules and completion |
| 12 | Warning symptoms & escalation instructions | Patient-language red/amber/green action plan |
| 13 | Emergency contact pathway | 108/112, command centre number, nearest partner ED |
| 14 | Follow-up schedule | Auto-generated, editable |
| 15 | Review & reassessment dates | Mandatory next-review date |
| 16 | Responsible clinician & team | Named owner per section |

### 5.2 Goal Schema (every goal)

| Field | Example (illustrative only) |
|---|---|
| Goal statement | "Home BP within my target" |
| Measure | Mean of protocol home BP readings over the measurement week |
| Target | Set by clinician (e.g. per guideline/individualised) |
| Owner | Dr X (clinical), Nurse Y (measurement support) |
| Review interval | e.g. every 4 weeks until achieved |
| Outcome | Achieved / Improving / No change / Worsening / Not assessable (insufficient data) |

### 5.3 Authorisation
- Care plans move through **Draft → Proposed → Signed (Active) → Superseded**.
- AI or a template may fill a *Draft*. Only the responsible clinician can sign.
- AI **can't** prescribe, change doses, stop treatment or set targets the clinician hasn't verified (Section 13).

---

## 6. Doctor Chronic Care Dashboard — Worklists & Prioritisation

### 6.1 Worklists

| Worklist | Inclusion logic (configurable) |
|---|---|
| Active patients | Status = Active |
| By programme | Group by `PlanDefinition` |
| Follow-up due (next 7 days) / **Overdue reviews** | `CarePlan.nextReviewDate`, `Appointment` |
| Abnormal / deteriorating trends | Rule-based trend alerts (Section 8) not yet acknowledged |
| **Data gaps** (missing scheduled measurements) | Expected vs received per plan |
| Device connectivity & freshness | Hub/device heartbeat |
| Pending lab results / unacknowledged results | `ServiceRequest` without result past due; results without ack |
| Medication reconciliation / review due | Reconciliation due date |
| Adherence concerns | Patient-reported missed doses per rule |
| Specialist referrals outstanding / recommendations awaiting authorisation | `Task` status |
| Nursing visit needed | Plan task due/overdue |
| Dietitian / physio review needed | Referral status |
| Repeated emergency escalations | ≥ N emergency/urgent events in a period (N set by the CGC) |
| **Possible Virtual IPD reassessment** | Status = ReassessmentRequired |

Filters: programme, clinician, care-plan status, risk category, monitoring mode (IoT/Manual/Hybrid), next review date, location.

### 6.2 Prioritisation Rules
- The risk category comes **only from a documented, CGC-approved rule set**, which is versioned and shown in an info panel: "Why is this patient here?"
- **Clinical risk and data completeness are separate dimensions.** A missing reading or disconnected device puts the patient in the *Data gaps* worklist with a "Data gap" badge. It **never** marks them high clinical risk on its own.
- Patient-reported concerning symptoms always outrank calculated scores.

---

## 7. Longitudinal RPM & Trend Analysis

### 7.1 Observation Provenance (shown on every reading)
Value + unit, **measurement time**, receipt time, source (device model/serial, manual entry by patient/caregiver/nurse, lab), method (e.g. protocol BP), signal or data quality flag, and whether it was entered by proxy.

### 7.2 Freshness States (never treat old data as live)

| State | Definition (configurable per parameter and programme) | UI |
|---|---|---|
| Live | Streaming device, last sample within the streaming window | Green dot "Live" |
| Current | Within the expected measurement interval | Timestamp |
| Due | Expected reading not yet received, inside the grace period | Grey "Due" |
| **Missing** | Grace period passed | Hollow marker "Missing"; **no interpolation** |
| Stale | Last value older than the clinical validity window | Value greyed with "Last: 3 days ago" |

**Rules:**
- Charts **don't interpolate** across missing periods; they show gaps.
- Averages state their n and period ("Mean of 9 of 14 expected readings").
- A missing value is never shown as normal.

### 7.3 Patient Monitoring Dashboard Components
- Current values (each with its freshness state)
- Historical graphs with clinician target bands
- Baseline line
- **Treatment-change markers** (medication start/stop/dose change)
- Alert history
- Clinician annotations
- Relevant lab trends (e.g. eGFR, A1C, K⁺)
- Device info panel
- Data completeness % per parameter

Parameters appear **only if they're in the patient's monitoring plan**.

---

## 8. Chronic Care Alerts & Escalation

### 8.1 Severity Classes (Domain 2)

| Class | Meaning | Routing principle |
|---|---|---|
| **E – Emergency** | Possible life-threatening symptoms (patient/caregiver report or device rule) | **Bypass CCM.** Emergency pathway: command centre + 108/112 guidance |
| **U – Urgent clinical** | Needs clinician assessment within the urgent window | Responsible clinician / on-call doctor; may lead to T3 Reassessment |
| **R – Routine clinical** | Needs review before the next scheduled review | Care-team queue |
| **A – Adherence / data** | Missed measurements, missed doses (patient-reported), overdue tasks | Nurse/care coordinator |
| **T – Technical** | Device or connectivity issues | Device support; only clinically escalated if the plan requires active data |

**Ack deadlines and escalation timers come from the Service Policy configuration** (`SP-<class>-<programme>`), which the CGC and operations approve. The spec doesn't fix universal times.

### 8.2 Alert Rule Definition Schema (every rule must fill all fields)

| Field | Description |
|---|---|
| Rule ID / version | e.g. `HF-WT-01 v1` |
| Programme | HF |
| Trigger logic | Exact computable definition, including the data-sufficiency condition |
| Severity class | E/U/R/A/T |
| Clinical rationale | Why it matters, with evidence ref |
| Responsible recipient | Role (not a named person); fallback role |
| Required response | e.g. "Contact patient; assess symptoms; decide on diuretic plan per protocol" |
| Ack deadline | Reference to `SP-…` |
| Escalation route | Next role(s) if not acknowledged |
| Closure criteria | What must be documented to close |
| Suppression rules | Duplicate/cool-down only. **Never suppressed by a low risk score.** |
| Approval | CGC sign-off ID and date |

### 8.3 Draft Rule Catalogue (illustrative — needs CGC approval)

| ID | Programme | Trigger (draft) | Class |
|---|---|---|---|
| GEN-SYM-E | All | Patient/caregiver reports an emergency symptom from the approved list (chest pain, stroke signs, severe breathlessness, unresponsive, etc.) | **E** |
| GEN-SYM-U | All | Patient reports worsening symptoms on the programme symptom check | U |
| GEN-TGT-R | All | ≥ X of the last Y valid readings outside the patient's target (data-sufficiency met) | R |
| GEN-BASE-U | All | Change from established baseline greater than the plan threshold | U |
| GEN-MISS-A | All | Missed measurements where the plan marks the parameter "clinically consequential" | A (→ U if the plan says so) |
| GEN-LAB-U | All | Critical lab result (lab's critical list) | U (or E per lab policy) |
| GEN-FU-A | All | Missed critical follow-up or investigation | A |
| GEN-MED-U | All | Patient reports a possible serious side effect / interaction flag | U |
| GEN-FALL-U | Frailty/neuro | Fall reported/detected, or repeated falls | U |
| GEN-FUNC-R | Frailty/neuro | Functional score decline beyond the threshold | R |
| GEN-DEV-T | IoT plans | Device disconnected beyond the plan's tolerance | T (→ A if data is required) |
| GEN-VIPD-U | All | Composite deterioration criteria in the programme → **ReassessmentRequired (T3)** | U |
| HTN-SEV | HTN | Severe BP reading: with symptoms → E; without → U | E/U |
| DM-HYPO | DM | Level 2 hypoglycaemia → U; Level 3 (needs assistance) → E | U/E |
| HF-WT | HF | Weight gain above the patient's clinician-set threshold over the set days | U |
| COPD-AP | COPD/Asthma | Action plan amber → U; red → E | U/E |
| CKD-K | CKD | Potassium above the critical threshold | U/E |

**Hard rule:** a calculated low risk score **never** suppresses a concerning symptom report or an emergency request.

---

## 9. Medication & Adherence Management

### 9.1 Workflows
- Medication reconciliation (at enrolment, after any admission, at each scheduled review)
- Clinician-authorised medication list
- Renewal requests (patient-initiated → clinician queue)
- Reminders
- Patient-reported adherence and missed doses
- Side-effect reporting
- Medication review appointments
- Refill coordination with partner pharmacy (where supported)
- Allergy and interaction checks (only from validated drug-knowledge sources)
- Change history with audit
- Clinician adherence summaries

### 9.2 Dose-Event States (strictly separate)

| State | Meaning | Source |
|---|---|---|
| `REMINDER_SCHEDULED` | Reminder planned | System |
| `REMINDER_SENT` / `DELIVERED` | Push/SMS sent / delivery receipt | System |
| `NOTIFICATION_OPENED` | User opened the reminder | System, **doesn't mean the dose was taken** |
| `PATIENT_CONFIRMED_TAKEN` | Patient or caregiver tapped "Taken" | Patient-reported |
| `PATIENT_REPORTED_MISSED` / `SKIPPED (reason)` | Patient-reported | Patient-reported |
| `NO_RESPONSE` | No confirmation in the window | System, shown as **Unknown**, not missed and not taken |
| `ADMINISTERED_BY_PROFESSIONAL` | Nurse administered (eMAR, with ID scan) | Professional |

**Rules:**
- No automatic dose changes.
- **No compensatory or "double-up" advice from the system.** After a missed dose the app shows only the *clinician-authored* missed-dose instruction attached to that prescription, if there is one. Otherwise it shows "Contact your care team".
- Adherence % always states its basis: "patient-reported, 22 of 28 doses confirmed; 4 unknown".

---

## 10. Nursing & Home Visits

### 10.1 Visit Workflow
Scheduled visit → identity verification (photo + DOB/ABHA, or QR) → observations and symptom check → device setup/troubleshooting → med reconciliation support (within scope) → education → care-plan tasks → functional/wound assessment (if in plan) → escalate to responsible clinician if needed → schedule next visit → documentation and handover.

### 10.2 Task Scope Matrix (draft — confirm with nursing council norms and CGC)

| Task | RN (GNM/B.Sc) | ANM / LPN | Trained care assistant | Family caregiver | Patient |
|---|:-:|:-:|:-:|:-:|:-:|
| Clinical assessment, triage decision | ✅ | ◐ (under protocol) | ✖ | ✖ | ✖ |
| Vital signs measurement | ✅ | ✅ | ✅ | ✅ (trained) | ✅ |
| Device setup / troubleshooting | ✅ | ✅ | ✅ | ◐ | ◐ |
| Medication reconciliation (data gathering) | ✅ | ◐ | ✖ | ◐ (provide info) | ◐ |
| Medication administration (injectables/IV) | ✅ | ◐ per scope | ✖ | ✖ | ✖ |
| Oral medication assistance | ✅ | ✅ | ◐ | ✅ | ✅ |
| Wound assessment & dressing | ✅ | ◐ | ✖ | ✖ (simple dressing if trained) | ✖ |
| Functional assessment (scored tools) | ✅ | ◐ | ✖ | ✖ | PRO only |
| Patient/family education | ✅ | ✅ | ◐ (scripted) | — | — |
| Escalation to clinician | ✅ | ✅ | ✅ | ✅ | ✅ |

✅ allowed · ◐ limited/under protocol · ✖ not allowed. Every task in the system carries a `requiredQualification`. The app blocks completion by a user without that qualification.

---

## 11. Specialist & Multidisciplinary Care

- **Referral package (mandatory fields):** clinical question, urgency, longitudinal summary (auto-compiled), current meds, allergies, relevant observations and trends, investigations, previous specialist input.
- **Statuses:** Draft → Sent → Accepted / Declined (reason) → Scheduled → Completed (report) → **Recommendations pending authorisation** → Incorporated / Not adopted (reason).
- **One coordinated care plan** with clear section ownership. Specialist recommendations are stored as *recommendations*. Changes to treatment need the responsible clinician (or the specialist, if delegated) to sign before they become orders.
- **MDT review:** scheduled case conferences for frailty/multimorbidity and complex patients, with documented outcomes.

---

## 12. Patient & Family Experience (screen list → Section 15.4)

Principles:
- Plain language in the patient's language.
- Every number paired with context ("within your target set by Dr X").
- No automated risk score shown as a diagnosis.
- **No promises** ("will keep you out of hospital").
- An emergency help button on every screen.
- Family access only within the consent scope (DPDP).

---

## 13. AI-Assisted Chronic Care — Capability Register

| ID | Capability | Inputs | Intended use | Limitations | Validation before release | Bias assessment | Human oversight | Failure handling |
|---|---|---|---|---|---|---|---|---|
| AI-01 | Longitudinal clinical summary | Structured record (Section 4), recent notes | Draft summary for clinician review | Can omit or misstate facts | Clinician-rated accuracy on a sample set; zero-tolerance check for meds/allergies | Check performance across languages and note styles | Clinician edits/signs; labelled "AI draft" | Show "Summary unavailable"; full record always accessible |
| AI-02 | Trend & significant-change detection | Observations + plan targets | Highlight changes for review | Depends on data completeness | Retrospective comparison with clinician-labelled events | Device accuracy differences (e.g. SpO₂ by skin tone) | Suggestion only; rules engine remains authoritative | Falls back to rule-based alerts |
| AI-03 | Missing-data identification | Plan schedule vs received | Data-gap worklist | — (deterministic preferred) | Unit tests | n/a | Nurse acts | Deterministic job |
| AI-04 | Follow-up prioritisation | Worklists, risk rules | Order the queue | May deprioritise wrongly | Shadow mode vs the clinician ranking | Equity check (rural, elderly, female) | **Can't remove items; U/E alerts are pinned above AI ordering** | Default to the rules-based sort |
| AI-05 | Patient-friendly education | **Approved content library only** | Personalise and translate approved text | Translation errors | Clinical and linguistic review of templates | Language coverage | Content team approves templates | Show the original approved text |
| AI-06 | Adherence summary | Dose-event states (Section 9.2) | Clinician overview | Patient-reported bias | Matches the deterministic calculation | — | Clinician | Show the raw table |
| AI-07 | Review-note preparation | Since-last-review data | Draft review note | As AI-01 | As AI-01 | As AI-01 | Sign-off required | Blank template |
| AI-08 | Overdue care-plan tasks | Tasks | Flag overdue | — (deterministic) | Unit tests | n/a | Coordinator | — |
| AI-09 | Suggestions for clinician review | Record + guideline rules | "Consider" prompts (e.g. GDMT not optimised) | Guideline mismatch for the individual | Rule review by the CGC | Subgroup review | Accept/dismiss with reason | Hidden if unavailable |
| AI-10 | Inconsistent-record detection | Meds vs conditions vs labs | Flag possible errors (e.g. duplicate drugs) | False positives | Precision/recall on audit sample | — | Pharmacist/clinician resolves | — |

**Prohibited for AI (system-enforced):**
- Diagnosing
- Prescribing or changing/stopping treatment
- Suppressing or downgrading U/E alerts
- Autonomous enrolment, admission, discharge or graduation
- Patient-facing risk predictions presented as fact

If any capability starts to influence clinical decisions, it's assessed for **SaMD classification under CDSCO** before release.

---

## 14. Outcomes & Quality Metrics Framework

| Metric | Numerator | Denominator | Period | Source | Exclusions | Type |
|---|---|---|---|---|---|---|
| Follow-up completion | Scheduled clinical reviews completed within window | Scheduled reviews due | Monthly | `Appointment`/`Encounter` | Patient-cancelled with rebook ≤ window | Process |
| Care-plan review completion | Plans reviewed by due date | Plans with review due | Monthly | `CarePlan` | On-hold/suspended | Process |
| Monitoring adherence | Patient-days with ≥ required readings | Patient-days requiring readings | Monthly | `Observation` | Suspended days | Process |
| Data completeness | Received readings | Expected readings | Monthly | Plan vs `Observation` | Device-fault days (reported separately) | Data quality |
| Time to acknowledgement (U/E) | Median / p90 minutes, alert → ack | All U/E alerts | Monthly | Alert log | Test alerts | Safety |
| Alert resolution | Alerts closed meeting closure criteria within policy time | Alerts raised | Monthly | Alert log | Duplicates | Safety |
| Med reconciliation completion | Reconciliations done by due date (incl. post-discharge) | Reconciliations due | Monthly | `List` | — | Safety |
| Pending-investigation follow-up | Results acknowledged within policy time | Results received | Monthly | `DiagnosticReport` | — | Safety |
| Condition indicators (examples) | e.g. HTN: patients with latest valid BP at their individual target; DM: latest A1C at individual target | Enrolled ≥ 90 days with valid measure | Quarterly | `Observation` | Insufficient data (reported separately, **not counted as controlled**) | Outcome (intermediate) |
| PROs / QoL / function | Change in validated score from baseline | Patients with baseline + follow-up | 6-monthly | `QuestionnaireResponse` | — | Outcome |
| Unplanned hospital transfers / ED visits | Events | Per 1,000 enrolled patient-days | Quarterly | `Encounter`, ADT feeds, patient report | Planned admissions | Outcome |
| 30-day readmission (where measurable) | Readmissions ≤ 30 d of discharge | Discharges of enrolled patients | Quarterly | ADT/partners | Planned | Outcome |
| Patient / caregiver experience | Validated survey scores | Respondents | Quarterly | Survey | — | Experience |
| **Equity of access** | All of the above stratified by rural/urban, sex, age band, language, monitoring mode, payer | — | Quarterly | All | — | Equity |

**Evaluation rules:**
- Engagement metrics (app opens, messages) are **never** reported as clinical improvement.
- Outcome comparisons need a defined baseline, a comparison method (e.g. matched cohort or interrupted time series), case-mix adjustment, and a missing-data analysis.
- Every metric definition is versioned.

---

## 15. Chronic Care Screen Inventory (specification only — screens not to be designed until approval)

### 15.1 Standard Applied to Every Screen (avoids repeating it 60 times)
- **States:**
  - Loading: skeleton
  - Empty: guidance + primary action
  - Offline: cached read-only + banner; write actions queued only where safe (no orders offline)
  - Error: message + retry + support code
  - Permission-denied: explanation
- **Alert state banner:** an E/U alert for this patient shows a sticky banner on any patient-context screen.
- **Data freshness:** per Section 7.2 on any observation.
- **Audit:** view and act events are logged.
- **Accessibility:** ≥ 48 dp targets, dynamic type 200%, screen-reader labels, colour + icon + text for severity.
- **Localisation:** EN/HI + regional; numbers and units are locale-aware.
- **Figma reuse key** (from the shared canvases, **verify against the library**):

  | Key | Component |
  |---|---|
  | `F-HDR` | Patient header card |
  | `F-VT` | Vital tile |
  | `F-PILL` | Status pill |
  | `F-ALR` | Alert row with severity chip |
  | `F-NAV` | Bottom nav |
  | `F-STEP` | Stepper |
  | `F-CHK` | Checklist row |
  | `F-DOC` | Consent document row |
  | `F-MAR` | MAR line |
  | `F-CHAT` | Chat thread |
  | `F-CHART` | Trend chart card |
  | `F-TAB` | Segmented tabs |
  | `F-CTA` | Primary button |

### 15.2 Doctor (Phase 1) — `CC-D-xx` (in the Doctor app, alongside D-01…D-32)

| ID | Screen | Entry | Data displayed | Actions & permissions | Validation / safety | APIs | AC (key) | Figma reuse |
|---|---|---|---|---|---|---|---|---|
| CC-D-01 | Chronic Care Dashboard | Home tab switch "Virtual Ward / Chronic Care" | Worklist counts (Section 6.1), programme tiles | Open worklist; filter | Clinical risk and data gaps shown separately | `GET /cc/worklists` | Counts update ≤ 60 s; E/U pinned | F-VT, F-PILL, F-NAV |
| CC-D-02 | Worklist / Patient List | CC-D-01 tile | Patient rows: programme(s), mode, risk category + "why", next review, data completeness, badges | Open patient; bulk assign (coordinator) | No "high risk" from data gaps alone | `GET /cc/patients?filters` | "Why" panel lists the rule ID/version | F-HDR(row), F-PILL |
| CC-D-03 | Referral & Programme Screening | "+ Enrol" / referral inbox | Referral, programme criteria checklist | Accept → Enrol; Not eligible (reason); Redirect (VIPD/ED/specialist) | Hard exclusions block; emergency features → emergency pathway | `POST /cc/enrolments`, `GET /cc/programmes/{id}` | Can't enrol with an exclusion ticked | F-STEP, F-CHK |
| CC-D-04 | Enrolment Consent & Family Access | CC-D-03 | Consent scopes (CCM, RPM devices, tele-consult, data sharing, family scope, communication prefs) | Capture e-consent (patient/LAR) | Mandatory scopes before Active | `POST /consents` | Family recipients restricted to scope | F-DOC |
| CC-D-05 | Longitudinal Profile | Patient row | All Section 4 sections, history toggles | View; add/annotate per role | Edits create versions + reason | `GET /patients/{id}/longitudinal` | History visible for conditions/meds/plans | F-HDR, F-TAB |
| CC-D-06 | Baseline & Risk Assessment | Enrolment flow | Programme-specific baseline form, risk tools | Enter/confirm; calculate tool scores | Range checks; tool name/version stored | `POST /observations`, `/riskassessments` | Calculated scores match reference vectors | F-VT, F-CHK |
| CC-D-07 | Medication Reconciliation | Enrolment, post-acute review, scheduled review | Sources side by side (patient-reported, previous Rx, discharge) | Continue/stop/modify/flag; sign | Allergy/interaction checks; signing requires reasons for changes | `POST /medrec` | Plan can't be signed without reconciliation | F-MAR |
| CC-D-08 | Care Plan Builder (Draft → Sign) | Enrolment / review | 16 sections (Section 5.1), goal schema, programme template, optional AI draft | Edit, assign owners, sign | AI content labelled; targets need clinician entry; mandatory next-review date | `POST/PUT /careplans` (versioned) | Signing creates schedule; old version kept | F-STEP, F-CHK, F-CTA |
| CC-D-09 | Monitoring Plan & Targets | Care plan | Parameters, source, frequency, target band, consequential flag, review owner | Set/modify | Out-of-safe-bounds needs second sign-off; audit | `PUT /careplans/{id}/monitoring` | Change reaches the rule engine ≤ 60 s | F-VT |
| CC-D-10 | Longitudinal Trends | Profile / alert | Section 7.3 components | Annotate; change range; export | No interpolation; n/period on averages | `GET /observations?...` | Missing periods visible as gaps | F-CHART |
| CC-D-11 | Chronic Alert Inbox & Detail | Alerts tab (filter CC) | Alerts by class E/U/R/A/T; rule rationale; data | Ack, contact, task, escalate, close (criteria) | E never actionable here except "Open emergency"; low score never hides | `GET/POST /alerts` | Closure blocked without criteria | F-ALR |
| CC-D-12 | Reassessment Decision (Pathway D) | Alert / worklist ReassessmentRequired | Summary, triggers, recent trends, patient-reported symptoms | Manage in CCM (update plan) / Urgent visit / **Assess for Virtual IPD → D-04** / ED referral | Requires documented clinical assessment; **no AI-only admission** | `POST /cc/reassessments` | T4 only via D-04 pass | F-CHK, F-CTA |
| CC-D-13 | Post-Acute Review | Discharge notice | Discharge summary, med changes, plan diff | Reconcile, update plan → Active | Mandatory reconciliation | `POST /cc/postacute` | Plan v(n+1) created | F-MAR, F-DOC |
| CC-D-14 | Referral & MDT | Profile / plan | Referral package, status, recommendations | Create referral; authorise/decline recommendation | Mandatory package fields | `POST /servicerequests`, `/tasks` | Recommendation ≠ order until authorised | F-CHAT, F-PILL |
| CC-D-15 | Scheduled Review (tele/in-person) | Calendar | Since-last-review summary (AI-07 draft), goals progress | Document review, update goals/plan, next review | Sign-off; AI draft labelled | `POST /encounters`, `/compositions` | Review closes the due task | F-TAB |
| CC-D-16 | Programme Outcomes (my panel) | More menu | Section 14 metrics for the clinician's panel | View; drill-down | Shows denominators and data-sufficiency | `GET /cc/metrics` | Metrics match definitions v-x | F-CHART |

### 15.3 Professional Caregiver / Nurse (Phase 2) — `CC-N-xx` (extends the *Caregiver Flow* Figma)

| ID | Screen | Entry | Data | Actions & permissions | Validation / safety | APIs | AC | Figma reuse |
|---|---|---|---|---|---|---|---|---|
| CC-N-01 | My Day (CCM + VIPD visits) | Home | Route, visits with type (CCM/VIPD), tasks with required qualification | Start visit, navigate | Tasks above the user's qualification are locked | `GET /visits?date` | Locked tasks can't be completed | F-NAV, F-PILL (verify) |
| CC-N-02 | Visit Check-in & Identity Verification | Visit | Patient photo, ID checks | Verify (QR/DOB/ABHA) | Can't document before verification | `POST /visits/{id}/checkin` | Mismatch → stop + report | F-HDR |
| CC-N-03 | Observations & Symptom Check | Visit | Programme-specific form; device auto-import | Capture; flag | Range checks; source recorded (nurse) | `POST /observations` | Readings marked "nurse-measured" | F-VT |
| CC-N-04 | Device Setup & Troubleshooting | Visit / technical alert | Device list, pairing, test reading | Pair, replace, return | Asset scan; test reading required | `POST /devices/pair` | Test reading received before close | F-CHK |
| CC-N-05 | Medication Review Support | Visit | Current list, pill-pack photo | Record what the patient takes; flag discrepancies | Data gathering only; no changes | `POST /medrec/observations` | Discrepancy → clinician task | F-MAR |
| CC-N-06 | Education Session | Visit | Assigned modules | Mark delivered; teach-back check | Approved content only | `POST /education/events` | Completion logged per module | F-CHK |
| CC-N-07 | Functional / Fall / Wound Assessment | Visit (if in plan) | Scored tools; wound photo | Score; photo (chart storage) | Qualification check; photo consent | `POST /questionnaireresponses`, `/media` | Score saved with tool version | F-CHK |
| CC-N-08 | Care-Plan Task Completion | Visit | Due tasks | Complete/not done (reason) | — | `PATCH /tasks/{id}` | Not-done needs a reason | F-CHK |
| CC-N-09 | Escalate to Clinician (SBAR) | Any | SBAR auto-filled | Send urgent/routine; call | Emergency → emergency pathway button | `POST /escalations` | Recipient ack tracked | F-ALR, F-CTA |
| CC-N-10 | Visit Note & Handover | End visit | Summary | Sign; next visit | Mandatory fields | `POST /compositions` | Visit can't close unsigned | F-DOC |
| CC-N-11 | Adherence & Data-Gap Outreach | Worklist | Patients with A-class alerts | Call/message, record outcome | No clinical advice beyond scripts | `GET /alerts?class=A` | Outcome recorded | F-ALR |
| CC-N-12 | Offline Sync Status | Header | Pending uploads | Retry | No silent data loss | Local queue | Unsynced count visible | — |

### 15.4 Patient / Family (Phase 3) — `CC-P-xx` (extends the *Instant Service* / patient Figma)

| ID | Screen | Purpose | Key data / actions | Safety / validation | AC |
|---|---|---|---|---|---|
| CC-P-01 | Chronic Care Home | Today at a glance | Today's tasks, next appointment, last readings (with freshness), **Emergency help** | No risk scores shown as diagnosis | Emergency button on every screen |
| CC-P-02 | My Conditions | Understand conditions | Confirmed conditions, plain-language explanations (approved library) | Provisional diagnoses labelled | — |
| CC-P-03 | My Care Plan | See the plan | Goals, schedule, team, review date (read-only) | Shows version/date signed | Matches the active signed version |
| CC-P-04 | Today's Tasks | Do today's tasks | Measurements, meds, exercises, education | — | Completion syncs ≤ 60 s online |
| CC-P-05 | My Vitals & Trends | Track readings | Charts with *clinician* targets, gaps visible | "Your target set by Dr X"; no interpolation | Missing shown as missing |
| CC-P-06 | Add Reading (manual / device) | Enter data | Guided measurement (e.g. BP technique), device auto-capture | Range checks; measurement time required | Source = patient/caregiver |
| CC-P-07 | Medication Schedule | Take meds | Schedule, Taken / Missed / Skipped (reason), side-effect report | Section 9.2 states; no double-dose advice | "Opened" ≠ "Taken" |
| CC-P-08 | Symptom Diary | Report symptoms | Programme symptom check; free text | Emergency symptoms show the **Call 108/112 + notify team** screen immediately | E-trigger reaches the command centre ≤ 10 s |
| CC-P-09 | Appointments & Consultations | Manage visits | Upcoming/past, join video, reschedule | — | — |
| CC-P-10 | Lab & Diagnostic Schedule & Results | Tests | Due tests, booking, released results with clinician comment | Results released per clinician policy | — |
| CC-P-11 | Device Status | Keep devices working | Battery, last sync, help | — | — |
| CC-P-12 | Diet & Nutrition Plan | Follow diet | Dietitian plan, regional foods | Dietitian-authored only | — |
| CC-P-13 | Physio & Activity Plan | Exercise | Video exercises, logs, pain check | Stop-and-report instructions | — |
| CC-P-14 | Care Team & Contacts | Reach the team | Team, message, call; hours | Banner: "Not for emergencies" | — |
| CC-P-15 | Warning Symptoms & Emergency Help | Act fast | Personal action plan (green/amber/red), 108/112, nearest ED | Always accessible offline | Works offline |
| CC-P-16 | Education Library | Learn | Assigned modules, language | Approved content only | — |
| CC-P-17 | Progress Towards Goals | Motivation | Goal status (Section 5.2 outcome scale) | "Not assessable" when data is insufficient | No promises of outcome |
| CC-P-18 | Consent & Family Access | Control data | Who sees what; add/revoke family; download data | DPDP rights (access, correction, withdrawal) | Revocation effective ≤ 5 min |

*Family/caregiver role:* same app, role `FAMILY`, sees only consented scopes. Can add readings and confirm doses on the patient's behalf, and these are labelled "entered by [name]".

### 15.5 Allied Professionals (Phase 4) — `CC-A-xx`

| ID | Role | Screen | Key content | Safety / AC |
|---|---|---|---|---|
| CC-A-01 | All allied | Referral Inbox | Referral package, accept/decline | Decline needs a reason |
| CC-A-02 | Dietitian | Nutrition Assessment | Anthropometry, diet history, renal/diabetic constraints | Uses latest labs with dates |
| CC-A-03 | Dietitian | Diet Plan Builder | Plan → patient CC-P-12 | Conflicts with the medical plan flagged (e.g. K⁺ in CKD) |
| CC-A-04 | Physiotherapist | Functional Assessment | Validated scales, goals | Tool version stored |
| CC-A-05 | Physiotherapist | Exercise Programme Builder | Exercises, progression → CC-P-13 | Contraindication checklist |
| CC-A-06 | Pharmacist | Medication Review | Polypharmacy, interactions, adherence data | **Recommendations only** → doctor authorisation |
| CC-A-07 | All allied | Session Note & Recommendations | Note, recommendations to the plan | Recommendation ≠ plan change until authorised |
| CC-A-08 | All allied | My Caseload & Outcomes | Panel, scores over time | Denominators shown |

### 15.6 Specialist & Programme Admin — `CC-S-xx`, `CC-M-xx`

| ID | Role | Screen | Notes |
|---|---|---|---|
| CC-S-01 | Specialist | Referral Review (consult) | Longitudinal package, video consult, report |
| CC-S-02 | Specialist | Recommendations & Delegated Orders | Delegation flag set by the responsible clinician |
| CC-M-01 | Programme manager | Programme Configuration | `PlanDefinition` versions, approval workflow (CGC sign-off) |
| CC-M-02 | Programme manager | Alert Rule & Service Policy Config | Section 8.2 schema; SP timers; approval required to publish |
| CC-M-03 | Programme manager | Enrolment & Capacity | Panels per clinician/nurse, waitlists |
| CC-M-04 | Quality lead | Quality & Equity Dashboard | Section 14 metrics, stratified |
| CC-M-05 | Admin | Education Content Library | Upload, clinical review, publish, versions |

**Total Domain 2 screens: 16 (Doctor) + 12 (Nurse) + 18 (Patient/Family) + 8 (Allied) + 2 (Specialist) + 5 (Admin) = 61.**

---

## 16. Role-Permission Matrix (Domain 2)

Legend: **C** create · **R** read · **U** update · **S** sign/authorise · **—** none · *(s)* = within consent/assignment scope

| Capability | Resp. clinician | Other doctor (on-call) | Specialist | Nurse (RN) | Care assistant | Dietitian / Physio | Pharmacist | Patient | Family | Prog. manager | Admin |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Enrol / close enrolment | C S | C S | — | R | — | — | — | R (withdraw) | R(s) | R | — |
| Care plan | C U **S** | U S (cover) | R, recommend | R, U tasks | R tasks | R, U own section (recommend) | R, recommend | R | R(s) | R | — |
| Monitoring targets | C U **S** | U S | recommend | R | — | — | — | R | R(s) | — | — |
| Orders / prescriptions | C S | C S | C S if delegated | — | — | — | recommend | — | — | — | — |
| Med reconciliation | C U S | C U S | R | C U (gather) | — | — | C U (recommend) | C (report) | C (report)(s) | — | — |
| Observations | C R | C R | R | C R | C R | R | R | C R | C R(s) | — | — |
| Alerts – acknowledge/close | C U | C U | R | C U (A/T, U per policy) | R (A only) | R | R | — | — | R (analytics) | — |
| Reassessment → Virtual IPD | **S** | **S** | recommend | trigger T3 | trigger T3 | trigger T3 | trigger T3 | report symptoms | report | — | — |
| Referrals | C S | C S | accept, report | C (nursing referrals) | — | accept, report | accept, report | R | R(s) | R | — |
| Consent & family access | R | R | — | assist capture | — | — | — | C U (revoke) | R own | R | — |
| Programme / rule config | R | R | — | — | — | — | — | — | — | C U (publish after CGC **S**) | — |
| Content library | R | R | R | R | R | C (draft) | C (draft) | R | R | U | C U |
| Audit logs | R own actions | R own | R own | R own | R own | R own | R own | access history (DPDP) | — | R | R (security) |

---

## 17. Platform Updates Required (Domain 1 → Domain 2 integration)

### 17.1 Alert & Escalation Engine
- Adds **scheduled/batch evaluation** (daily or hourly windows, data-sufficiency checks, missed-measurement jobs) next to the real-time stream path used by Virtual IPD.
- Adds severity classes E/U/R/A/T, the `SP-*` service-policy timers, and a rule registry with versioning and approval state. Only *approved* rules are executable.
- **Emergency bypass**: patient/caregiver E-symptom → command centre queue (Domain 1, Red tier) at the highest priority.

### 17.2 IoT/RPM Architecture
- Supports low-frequency consumer-grade but validated devices (BP, glucometer, CGM via vendor cloud, scale, peak-flow) as well as the Virtual IPD devices.
- **Device validation registry** (clinical validation status, e.g. validated BP device lists). Only registry devices can feed clinical rules.
- Device lifecycle: assigned → active → returned/lost. The data-gap logic is aware of the device state.

### 17.3 Data Model & APIs (additions)

| Resource / endpoint | Purpose |
|---|---|
| `EpisodeOfCare` types `CCM`, `RPM` (Pathway D); status per Section 2.3 | Enrolment state |
| `PlanDefinition` (programme), `CarePlan` (versioned), `Goal`, `List` (med-rec) | Programme & plan |
| `GET /cc/programmes`, `POST /cc/enrolments`, `PATCH /cc/enrolments/{id}/status` (transition with reason, validated against Section 2.4) | Enrolment |
| `POST/PUT /careplans` (version), `PUT /careplans/{id}/monitoring` | Plan |
| `GET /cc/worklists`, `GET /cc/patients?filters` | Dashboard |
| `POST /cc/reassessments`, `POST /cc/postacute` | Pathway D |
| `GET/POST /alerts` (class, ruleId, ruleVersion, closureCriteria) | Alerts |
| `POST /dose-events` (state per Section 9.2) | Adherence |
| `GET /cc/metrics?metricId&version` | Quality |
| `GET /rules`, `POST /rules/{id}/approve` | Rule governance |
| Webhooks/ADT: `encounter.admitted`, `encounter.discharged` from partner hospitals | Triggers T5/T6 |

### 17.4 Patient Lifecycle (unified across Domains 1 and 2)

```
Referral ─▶ RPM (Path D) ───────────┐
    │                               ▼
    └─▶ CCM Enrolled ─▶ Active ◀─▶ ReassessmentRequired ─▶ Virtual IPD (Encounter HH) ─▶ Post-Acute Review ─▶ Active
                         │                     │                                 ▲
                         │                     └─▶ ED / Hospital ────────────────┘
                         └─▶ Graduated / Withdrawn / Closed
Emergency (any point) ─▶ Command Centre + 108/112 (bypass)
```

---

## 18. Clinical Safety Requirements & Test Cases (Domain 2)

| ID | Requirement | Test case (summary) | Priority |
|---|---|---|---|
| CC-SR-01 | Emergency symptoms bypass CCM | Patient selects "chest pain" in diary → emergency screen shown + command centre E-alert within ≤ 10 s; no routine task created first | P0 |
| CC-SR-02 | Low risk score never suppresses symptoms | Patient with low risk category reports worsening symptoms → U alert raised and visible | P0 |
| CC-SR-03 | No AI-only admission | AI suggests reassessment → status changes only after a human confirms; T4 impossible without D-04 pass | P0 |
| CC-SR-04 | Missing ≠ normal | Withhold readings for 3 days → chart shows gaps; goal shows "Not assessable"; no "controlled" in metrics | P0 |
| CC-SR-05 | Stale ≠ live | Disconnect device → value greys out with age label after the validity window | P0 |
| CC-SR-06 | Data gap ≠ high risk | Disconnected device only → patient appears in Data-gap list, risk category unchanged | P0 |
| CC-SR-07 | Dose-event integrity | Open reminder without tapping "Taken" → state = NOTIFICATION_OPENED, adherence unchanged | P0 |
| CC-SR-08 | No compensatory dosing | Report a missed dose → only the clinician instruction or "contact care team" shown | P0 |
| CC-SR-09 | History preserved | Change diagnosis/target → previous version retrievable with who/when/why | P0 |
| CC-SR-10 | Plan suspension on IPD | Admit to VIPD → CCM plan Suspended; on discharge, Post-Acute Review task created; reconciliation mandatory | P0 |
| CC-SR-11 | Qualification enforcement | Care assistant tries a wound assessment → blocked | P0 |
| CC-SR-12 | Recommendation ≠ order | Pharmacist recommendation doesn't change the active med list until authorised | P0 |
| CC-SR-13 | Family scope | Family member without lab scope → lab results hidden; revocation applies ≤ 5 min | P0 |
| CC-SR-14 | Only approved rules run | A draft rule doesn't execute in production | P0 |
| CC-SR-15 | Alert closure criteria | Can't close a U alert without the documented closure fields | P1 |
| CC-SR-16 | Equity reporting | Metrics dashboard shows stratification; suppresses cells with small n | P1 |

---

## 19. Change Log to the Master Document

| Master section (Domain 1 spec) | Change |
|---|---|
| §2 Vision, Scope & Care Tiers | Adds chronic sub-variants CCM-STD/IOT/MAN/ESC. Tier T0 ("Remote Monitoring / Post-discharge") is now formalised as **Pathway D (RPM)** or the post-op/post-discharge programme. |
| §4 Clinical Operating Model | Adds the unified lifecycle (Section 17.4) and transition rules (Section 2.4) |
| §5–6 Product Suite / Apps | Adds 61 Domain 2 screens (Section 15) across Doctor, Nurse/Caregiver, Patient/Family, Allied, Specialist, Admin |
| §7 Device Ecosystem | Adds the validated low-frequency device registry and CGM via vendor cloud (Section 17.2) |
| §9 Monitoring & Escalation | Adds batch evaluation, severity classes E/U/R/A/T, service-policy timers, rule governance (Sections 8 and 17.1) |
| §10–11 Data Model & APIs | Section 17.3 additions |
| §13 Compliance | **Correction:** DPDP Rules 2025 commence in phases (Consent Managers Nov 2026; core obligations May 2027) [EV-16]. Build for full compliance at launch. |
| §17 AI/ML Roadmap | Replaced for Domain 2 by the AI register (Section 13) and its prohibitions |
| §18 Testing | Adds CC-SR-01…16 |
| §19 Roadmap | Adds Domain 2 stage gates (below) |
| §22 KPIs | Adds the Section 14 metrics framework |
| Doctor app spec (D-xx) | D-02 Dashboard gets a "Chronic Care" switch; D-03 census adds a CCM filter; D-04 Eligibility is reachable from CC-D-12 |

**Domain 2 roadmap (stage-gated):**

| Stage | Scope | Gate |
|---|---|---|
| S1 (now) | This document | **Your approval + CGC review plan** |
| S2 | CGC sign-off of 3 launch programmes (recommended: **HTN, T2DM, HF**) plus the post-discharge programme | Signed programme packs |
| Phase 1 | Doctor screens CC-D-01…16 (Figma) | Clinician usability test |
| Phase 2 | Nurse/Caregiver CC-N-01…12 | Nursing usability test |
| Phase 3 | Patient/Family CC-P-01…18 | Patient usability test (elderly, regional language) |
| Phase 4 | Allied CC-A, Specialist CC-S, Admin CC-M | — |
| Validation | End-to-end CCM ↔ VIPD journey simulation (CC-SR suite) | Safety case sign-off |

---

## 20. Evidence Register

| ID | Source | Used for |
|---|---|---|
| EV-01 | Wagner et al., *Organizing Care for Patients With Chronic Illness Revisited* — [PMC6739608](https://pmc.ncbi.nlm.nih.gov/articles/PMC6739608/) | CCM components |
| EV-02 | CCM-oriented interventions in diabetes, systematic review — [Primary Health Care Research & Development](https://resolve.cambridge.org/core/journals/primary-health-care-research-and-development/article/effectiveness-of-chronic-care-modeloriented-interventions-to-improve-quality-of-diabetes-care-a-systematic-review/3D76F1329CFFE94919CF25E477405AF9); also [Health Affairs evidence review, PMC5091929](https://pmc.ncbi.nlm.nih.gov/articles/PMC5091929/) | Which CCM components matter |
| EV-03 | WHO HEARTS technical package — [WHO](https://www.who.int/publications/i/item/WHO-NMH-NVI-18-2) | Standard protocols, team care |
| EV-04 | India Hypertension Control Initiative, protocol at scale — [PMC10959138](https://pmc.ncbi.nlm.nih.gov/articles/PMC10959138/) | India implementation |
| EV-05 | ICMR Standard Treatment Workflows (T2DM, CKD) — [ICMR STW T2DM](https://www.icmr.gov.in/icmrobject/uploads/STWs/1726567245_diabetes_mellitus_type_2.pdf), [ICMR STW CKD](https://www.icmr.gov.in/icmrobject/uploads/STWs/1784807344_chronickidneydisease-updated.pdf) | India protocols |
| EV-06 | 2025 ACC/AHA High Blood Pressure Guideline — [ACC summary](https://www.acc.org/latest-in-cardiology/articles/2025/10/01/01/new-in-clinical-guidance-hbp) | HTN targets, HBPM |
| EV-07 | Telemonitoring & HBPM network meta-analysis — [PubMed 40156340](https://pubmed.ncbi.nlm.nih.gov/40156340/) | Effect size |
| EV-08 | Self-measured home BP meta-analysis — [Hypertension Research 2024](https://www.nature.com/articles/s41440-024-01981-4) | Effect size |
| EV-09 | ADA Standards of Care 2026 — [ADA press release](https://diabetes.org/newsroom/press-releases/american-diabetes-association-releases-standards-care-diabetes-2026) | Diabetes programme |
| EV-10 | ADA 2026 §6 Glycemic goals — [PMC12690178](https://pmc.ncbi.nlm.nih.gov/articles/PMC12690178); §7 Technology — [PMC12690173](https://pmc.ncbi.nlm.nih.gov/articles/PMC12690173/) | CGM metrics, hypoglycaemia |
| EV-11 | HF telemonitoring modalities meta-analysis (2026) — [npj Digital Medicine](https://www.nature.com/articles/s41746-026-02415-w) | HF RPM benefit |
| EV-12 | HF telemonitoring systematic review (heterogeneous/neutral) — [PMC13338606](https://pmc.ncbi.nlm.nih.gov/articles/PMC13338606/) | Balanced claims |
| EV-13 | ESC 2023 Focused Update of 2021 HF guidelines — [summary, PMC11562572](https://pmc.ncbi.nlm.nih.gov/articles/PMC11562572/) | GDMT |
| EV-14 | GOLD 2026 COPD report — [Guideline Central](https://www.guidelinecentral.com/guideline/2231686/), [Healio](https://www.healio.com/news/pulmonology/20251117/2026-gold-report-addresses-disease-activity-technology-exacerbations-in-copd) | COPD programme |
| EV-15 | KDIGO 2024 CKD guideline — [KDIGO](https://kdigo.org/guidelines/ckd-evaluation-and-management/), [NKF heat map](https://www.kidney.org/sites/default/files/2026-03/441-0291_2602-heatmap_card-final.pdf) | CKD monitoring frequency |
| EV-16 | DPDP Rules 2025 phased commencement — [PwC India](https://www.pwc.in/assets/pdfs/news-alert/regulatory-insights/2025/pwc_india_regulatory_insights_16_november_2025_meity_notifies_digital_personal_data_protection_rules_2025.pdf), [Deloitte India](https://www.deloitte.com/in/en/services/consulting/about/indias-dpdp-rules-2025-leading-digital-privacy-compliance.html) | Compliance timing |
| EV-17 | CMS CY2026 PFS RPM changes (99445, 99470) — [Nixon Law Group](https://www.nixonlawgroup.com/resources/cms-finalizes-2026-remote-monitoring-reimbursement-updates-what-changed-for-rpm-and-rtm), [CMS MM14315](https://www.cms.gov/files/document/mm14315-medicare-physician-fee-schedule-final-rule-summary-cy-2026.pdf) | Future US billing data capture |
| EV-TBD | Stroke, Parkinson's, MSK/RA, obesity, thyroid, frailty/CGA, asthma (GINA), post-op, CAD/cardiac rehab | **Clinical leads to attach before programme approval** |

*Content from sources was summarised and rephrased for compliance with licensing restrictions.*

---

## 21. Decisions Needed for Approval (Step 4)

| # | Decision | Recommendation |
|---|---|---|
| 1 | Launch programmes for Phase 1 | **HTN, T2DM, HF + Post-discharge continuity** (strongest evidence and India burden; reuses Domain 1 devices) |
| 2 | Protocol basis | ICMR STWs / national programme protocols as the default, with partner-hospital overrides via CGC |
| 3 | Where Doctor CCM screens live | Inside the existing Doctor app (shared patient record), with a Virtual Ward ↔ Chronic Care switch |
| 4 | "Caregiver Flow" Figma scope | Confirm whether it covers **professional caregivers (nurse/attendant)**, family caregivers, or both. The spec assumes professional = CC-N and family = CC-P role. |
| 5 | Service-policy timers (ack deadlines) | Operations + CGC set them per class/programme before build of the alert engine |
| 6 | Figma access | Share view access (or exported frames/library) so the reuse column can be verified and Phase 1 screens built with existing components |
| 7 | Clinical Governance Committee | Name the members and the sign-off process for programme packs and rules |

---
*This specification is a product and technical design document. All clinical content is draft, and the MYDR24 Clinical Governance Committee and regulatory counsel must approve it before use with patients.*

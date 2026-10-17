# MYDR24 Unified Healthcare Ecosystem — Master Specification v3.0

**Acute Care · Chronic Care · Virtual Hospitalization (Virtual IPD) · Remote Patient Monitoring & Elderly Care**

| Item | Detail |
|---|---|
| Document type | Consolidated Stage-1 master specification. **For review and explicit approval.** |
| Version / date | v3.0-draft · 17 October 2026 |
| Supersedes | Master v2.0 + Domain 2 v2.1 (now included as annexes) |
| Primary market | India (designed to extend to other regions) |
| Design source of truth | Existing MYDR24 Figma files (*Caregiver Flow Final*, *MVP-1 Instant Service Flow*), **not verified: no access (Section 17)** |
| Clinical content status | **Draft.** Every threshold, interval, triage rule and programme must be approved by the MYDR24 Clinical Governance Committee (CGC). |
| Screen generation | **On hold until this document is explicitly approved** (Section 21) |

### How to read this document — statement labels

| Label | Meaning |
|---|---|
| **[E]** Evidence | Backed by a cited source (Evidence Register, Section 23) |
| **[P]** Proposal | Our recommended design. Needs approval. |
| **[A]** Assumption | Taken as true for design purposes. Needs confirmation. |
| **[D]** Decision needed | Open item, listed in Section 22 |

### Document map

| Part | Content |
|---|---|
| **Main body (§1–§23)** | Unified ecosystem: four pathways, shared record, transitions, Acute Care (new), Chronic Care, Virtual IPD, RPM/Elderly (new), unified dashboard, alert engine, governance, data/FHIR/APIs, security, design audit, complete screen inventory, Phase-1 Doctor app screen plan, acceptance tests, roadmap, decisions, evidence |
| **Annex A** | Evidence & market research: Virtual Hospitalization |
| **Annex B** | Platform & mobile ecosystem specification (architecture, devices, tech stack, NFRs, budget) |
| **Annex C** | Doctor app — Virtual IPD screen specification D-01…D-32 |
| **Annex D** | Chronic Care Management & Longitudinal RPM domain specification (CC-*) |

---

## 1. Executive Summary

MYDR24 will run **one longitudinal patient record** and **one authorised clinical team structure** across **four distinct clinical pathways**:

| Pathway | Code | One-line purpose |
|---|---|---|
| **A — Acute Care** | `ACU` | Timely assessment and treatment of new or worsening problems, with an episode that is opened and closed |
| **B — Chronic Care Management** | `CCM` | Planned, long-term, programme-based management of chronic conditions |
| **C — Virtual Hospitalization / Virtual IPD** | `VIPD` | Inpatient-level hospital-at-home care for selected, formally admitted patients |
| **D — Remote Patient Monitoring / Elderly Care** | `RPM` | Device-based or manual observation and elderly support without necessarily treating, enrolling or admitting |

**Design principles:**
1. **Pathway ≠ diagnosis.** An acute illness doesn't automatically mean Virtual IPD, and a chronic condition doesn't make someone an inpatient. A clinician's assessment, safety criteria and the actual care capability available decide the pathway. [P]
2. **Separate lifecycles, shared record.** Each pathway has its own episode, eligibility, monitoring plan, care plan and closure. Every episode writes to the same record. [P]
3. **Explicit, clinician-governed transitions.** Every pathway change records the initiating event, rationale, authorising professional, timestamp, receiving pathway, outstanding tasks and handover status. AI can suggest a transition but can never carry one out. [P]
4. **Emergencies bypass everything.** Emergency symptoms or requests go to the emergency pathway at once. They never wait for routine timers, worklists or AI scoring. [P]
5. **Honest service claims.** Monitoring isn't presented as continuous clinical supervision unless staffing and response coverage actually support it (Section 8.3). [P]
6. **Nothing invented.** Thresholds, response times and triage logic come from validated guidance plus CGC-approved configuration. This document only defines *where* they plug in. [P]
7. **One design system.** The existing MYDR24 Figma theme is kept. New needs are met with documented, compatible component extensions (Section 17). [P]

---

## 2. Scope & Pathway Definitions

### 2.1 Pathway Comparison

| Attribute | A — Acute (ACU) | B — Chronic (CCM) | C — Virtual IPD (VIPD) | D — RPM / Elderly (RPM) |
|---|---|---|---|---|
| Entry | Patient symptom report, referral, CCM/RPM trigger | Referral, post-discharge identification, enrolment | Formal admission after eligibility assessment (D-04) | Device enrolment order or elderly-care subscription with a clinician-approved plan |
| Eligibility owner | Triage protocol + clinician | Programme criteria + responsible clinician | Admitting doctor against VIPD criteria (clinical, staffing, equipment, home) | Ordering clinician (clinical rules); care coordinator (service) |
| Care plan | Acute treatment plan (short) | Longitudinal individual care plan (versioned) | Inpatient-level care plan, order sets | Monitoring plan + alert rules + notification preferences |
| Clinical cadence | As clinically required; follow-up and safety-net | Scheduled reviews per programme | Structured morning, evening and clinically required night reviews; nursing visits | Scheduled review of data per service level |
| Monitoring | Ad hoc observations; optional short-term device | Manual and/or IoT per programme | IoT and/or manual per tier (T1–T3) | Scheduled/continuous per device capability |
| Typical length | Days | Months–years | Days (≈ 3–14) | Weeks–ongoing |
| Closure | Resolved / referred / escalated / transitioned | Graduated / withdrawn / closed | Discharge / transfer | Ended / transitioned |
| Primary FHIR | `EpisodeOfCare(type=ACU)` + `Encounter` | `EpisodeOfCare(type=CCM)` + `CarePlan` | `Encounter(class=HH)` + `EpisodeOfCare(type=VIPD)` | `EpisodeOfCare(type=RPM)` + `DeviceUseStatement`/`Device` |
| Annex detail | **New in this document (§5)** | Annex D | Annexes B and C | **New in this document (§8)** |

### 2.2 Concurrency Rules (which episodes may be active together)

| Combination | Allowed? | Rule |
|---|---|---|
| CCM + ACU | ✅ | Typical when a chronic patient has a new acute problem. CCM stays Active and the ACU episode is linked. CCM alerts carry on. [P] |
| CCM + VIPD | ⚠ | CCM is **suspended, not closed**. VIPD orders take precedence. A Post-Acute Review is required before CCM resumes (Annex D §2.4). [P] |
| ACU → VIPD | ✅ (transition) | The ACU episode closes with outcome "Admitted to VIPD" and is linked to the new VIPD encounter. [P] |
| RPM + CCM | ✅ | The RPM monitoring plan is merged into the CCM monitoring plan. Duplicate rules are reconciled, with **one** rule owner per parameter. [P] |
| RPM + VIPD | ⚠ | RPM rules are paused for parameters the VIPD monitors and resume at VIPD discharge. [P] |
| Two VIPD encounters | ✖ | Only one active admission at a time. |
| Two ACU episodes | ✅ (if different problems) | Each has its own problem, clinician and closure. [P] |

### 2.3 Out of Scope (v3.0)
- Paediatric and obstetric pathways (need separate triage and programmes). [D]
- Mental-health crisis pathways beyond emergency referral. [D]
- Diagnosis or treatment decided autonomously by AI (prohibited, §10.6).

---

## 3. Shared Longitudinal Patient Record

All four pathways read and write the same record. The full field list and FHIR mapping are in **Annex D §4**. In brief:

| Domain | Contents | Pathway-specific notes |
|---|---|---|
| Identity & demographics | Verified identity (ABHA/Aadhaar-verified flag, method, date) | Required before treatment orders in all pathways |
| History, allergies, problems | Conditions with status history; allergy/ADR | Acute problems are coded with onset and resolution; chronic problems are linked to programmes |
| Medications | History, current orders, reconciliation snapshots (`List`) | Reconciliation required at every pathway entry and exit [P] |
| Observations & trends | With provenance (device/manual/lab), freshness state | Freshness rules per pathway (Annex D §7.2) |
| Results | Labs, imaging, POC | Acknowledgement tracked per result |
| Notes & consultations | SOAP, reviews, specialist reports | Linked to episode |
| Specialist recommendations | Stored apart from orders | Need authorisation to become orders |
| Care plans & goals | Versioned; never overwritten | One per episode type |
| Nursing records | Visits, eMAR, assessments | Qualification captured |
| IoT devices | Assignments, lifecycle, readings | Device validation registry |
| Alerts & escalations | Event log with event type (§10) | Shared infrastructure |
| Referrals & transfers | `ServiceRequest`, handover bundles | — |
| Admissions & discharges | VIPD encounters, hospital ADT feeds | — |
| Follow-up plans | `Appointment`, `Task` | — |
| Consent, permissions, audit | Consent ledger per scope and pathway; `AuditEvent`; `Provenance` | DPDP-aligned (§16) |

**Rule [P]:** every record carries the **current pathway(s) and responsible clinician**. These show on the patient header of every screen (component `PathwayChip`, §17.4).

---

## 4. Care Transitions

### 4.1 Mandatory Transition Record (every transition)

| Field | Description |
|---|---|
| Initiating event | Alert ID, patient request, clinician decision, discharge notice, etc. |
| Clinical rationale | Structured reason + free text |
| Authorising professional | Name, role, registration number |
| Timestamp | Initiated / authorised / completed |
| From → To pathway | Episode IDs |
| Outstanding tasks | Pending results, meds, visits, devices |
| Handover status | Not required / Pending / Sent / Accepted (receiver, time) |
| Patient/family informed | Yes/No + channel |
| Consent | Consent check for the receiving pathway |

FHIR representation [P]: a `Task` (code=`pathway-transition`) with `focus` = new episode, `basedOn` = trigger, plus `Provenance` for authorisation and a `Composition` for any handover.

### 4.2 Transition Matrix

| # | Transition | Who may initiate | Who must authorise | Mandatory checks | System effects |
|---|---|---|---|---|---|
| TR-01 | CCM → Acute assessment | Rule engine (suggestion), any care-team member, patient | Clinician opening the ACU episode | Red-flag screen first (§5.3) | ACU episode linked; CCM stays Active |
| TR-02 | Acute → Routine follow-up | Treating clinician | Treating clinician | Safety-net advice documented; follow-up booked | ACU closed "Resolved – follow-up" |
| TR-03 | Acute → Virtual IPD assessment | Treating clinician | **Admitting VIPD doctor** after D-04 | VIPD eligibility (clinical, staffing, equipment, home), consent | ACU closed "Admitted VIPD"; VIPD encounter opened |
| TR-04 | Chronic → Virtual IPD assessment | Rule (suggestion), care team | Admitting VIPD doctor after D-04 | As TR-03 | CCM suspended (Annex D T4) |
| TR-05 | Virtual IPD → Chronic follow-up | Discharging doctor | Discharging doctor + CCM responsible clinician acceptance | Discharge summary, med reconciliation, CCM plan review | CCM resumes as a new plan version |
| TR-06 | Virtual IPD → Routine monitoring (RPM) | Discharging doctor | Discharging doctor; RPM ordering clinician named | Monitoring plan + review owner + service level | RPM episode opened (e.g. 14-day post-discharge) |
| TR-07 | Acute → Emergency hospital transfer | Any clinician; patient/caregiver SOS | **No authorisation delay**: emergency first, documentation after | Emergency pathway (§12) | ACU closed "Transferred"; handover bundle |
| TR-08 | Chronic → Emergency hospital transfer | As TR-07 | As TR-07 | As TR-07 | CCM suspended for hospital |
| TR-09 | Post-discharge → Chronic Care or RPM | Discharging team / CCM intake | Responsible clinician (CCM) or ordering clinician (RPM) | Eligibility; consent | New episode |
| TR-10 | RPM → Acute / Chronic / VIPD | Assigned professional | Clinician per receiving pathway | As receiving pathway | RPM continues or pauses per §2.2 |
| TR-11 | Any → Closed/Withdrawn | Clinician; patient (withdrawal) | Clinician (closure); patient (withdrawal) | Handover letter if care transfers | Devices/tasks stopped |

**Prohibitions [P]:**
- AI can't admit, discharge, close or transfer anyone.
- No transition can complete with an unacknowledged critical alert unless the transition *is* the emergency response.
- Every transition shows up as an event on the patient timeline.

---

## 5. Pathway A — Acute Care (new)

### 5.1 Evidence Basis for Triage Design

| Finding | Source | Implication |
|---|---|---|
| Structured ED triage systems have moderate, context-dependent accuracy, and clinically important under-triage is still possible. | [E] EV-31, EV-32 | Triage output **supports** clinicians, never replaces them. Track under-triage as a safety KPI. |
| The Manchester Triage System showed low safety in one review because of under-triage. | [E] EV-33 | Validate any protocol locally before use. |
| The **AIIMS Triage Protocol (ATP)** was developed in India by Delphi consensus and prospectively validated for ED mortality/ICU admission. | [E] EV-34, EV-35 | A candidate basis for in-person and nurse triage. **It wasn't validated for remote/tele-triage.** [A] |
| Online symptom checkers vary widely: triage accuracy roughly 49–90% and low diagnostic accuracy. | [E] EV-36 | **Patient-facing symptom checkers can't decide home-treatment suitability.** They only screen for red flags and route to a human. |
| NMC Telemedicine Practice Guidelines 2020: in emergencies, teleconsultation should be limited to first aid, life-saving advice, referral and counselling when in-person care is available. | [E] EV-37 | Acute tele-consults must route emergencies to in-person or emergency services. |

**[D] Decision:** choose the approved remote-triage protocol. Options: (a) adapt ATP for tele-triage with local validation; (b) license a validated telephone-triage system; (c) a CGC-authored protocol with prospective audit. *Recommendation:* (a) plus mandatory clinician review, with an audit of under-triage events.

### 5.2 Acute Care Workflow (13 steps)

| Step | Description | Actor | System support | Screen IDs |
|---|---|---|---|---|
| 1 | Patient reports symptoms, or a referral/CCM/RPM trigger arrives | Patient, family, clinician, rule engine | Symptom intake; referral inbox | AC-P-01, AC-D-01 |
| 2 | Identity and relevant consent verified | Coordinator / clinician | ABHA/OTP check; tele-consult consent | AC-D-02 |
| 3 | **Immediate emergency red-flag screen** | System (CGC-approved list) + triage nurse | Red-flag positive → **Emergency pathway now** (§12) | AC-P-02, AC-D-02 |
| 4 | Urgency category selected using the approved triage protocol | Triage nurse/clinician | Protocol engine (versioned); category + target time from service policy | AC-D-03 |
| 5 | Qualified clinician review as required | Doctor | Queue by urgency; SLA timers | AC-D-04 |
| 6 | History, meds, allergies, observations collected | Doctor/nurse/patient | Pre-filled from longitudinal record; med reconciliation | AC-D-04, AC-D-05 |
| 7 | Examination, tests, diagnostics ordered | Doctor | Video exam guide; field-nurse visit; CPOE/labs | AC-D-06 |
| 8 | Assessment and treatment plan recorded | Doctor | Structured acute note (problem, differential, plan, risk) | AC-D-07 |
| 9 | Prescriptions authorised by a qualified professional | Doctor (RMP) | e-Rx with registration number, digital signature, NMC drug-list checks | D-17 (shared) |
| 10 | Nursing, home-care or specialist services arranged | Doctor/coordinator | Service request; dispatch | AC-D-08 |
| 11 | Follow-up and safety-net instructions documented | Doctor | Safety-net templates (CGC-approved), follow-up booking | AC-D-09 |
| 12 | Reassessment when indicated | Doctor/nurse | Scheduled reassessment task; patient check-in | AC-D-10 |
| 13 | Close: resolved / referred / escalated (VIPD, hospital) | Doctor | Closure form; transition record (§4) | AC-D-11 |

### 5.3 Red-Flag Screening (structure only — content is CGC-owned)

| Element | Specification |
|---|---|
| Source | CGC-approved red-flag list, versioned, with evidence reference per item [D] |
| Examples (illustrative, **not a protocol**) | Suspected stroke signs; chest pain suggesting ACS; severe breathing difficulty; major bleeding; severe altered consciousness/unresponsiveness; seizure; anaphylaxis signs; severe injury |
| Behaviour | Any positive item → emergency screen with **Call 108/112**, simultaneous command-centre E-event, caregiver guidance. **Nothing waits for further questions.** |
| Uncertainty | "Not sure" counts as positive for routing to an immediate human call-back [P] |
| Audit | Every screen result is stored with protocol version |

### 5.4 Exception Pathways (mandatory)

| Exception | Detection | Required handling [P] (timings from service policy) |
|---|---|---|
| **Deterioration during consultation** | Clinician observes it, or vitals cross a critical rule mid-call | One-tap *Emergency* from the consult screen (D-25 equivalent); keep the patient on the line; dispatch; notify ED; document after |
| **Can't contact patient** (call/video fails, no answer) | Missed call-back, no response to an urgent task | Retry ladder (alternate number → caregiver → emergency contact) → field-team welfare visit if risk warrants → police/emergency services per CGC policy. Each attempt timestamped. |
| **Home-care arrangement fails** (nurse unavailable, device not delivered, caregiver absent) | Dispatch failure, task overdue | Re-plan: alternative provider, or upgrade to an in-person facility visit, or hospital. The doctor must re-confirm the plan is still safe. |
| **Emergency resources unavailable** (ambulance delay, ED diversion) | Dispatch ETA beyond policy, or decline | Escalate to on-call doctor and ops lead; alternative transport/facility list; continuous tele-support; incident report |
| **Patient declines advice** (e.g. refuses transfer) | Clinician records it | Capacity assessment note, informed-refusal documentation, safety-net, scheduled re-contact, senior review |
| **Diagnostic delay** (lab not collected/reported) | Overdue result task | Escalate to coordinator; clinician decides whether the plan is still safe |

### 5.5 Acute Episode Status Model

| From | Event | To |
|---|---|---|
| (start) | Symptom report / referral | Intake |
| Intake | Red flag positive | **EmergencyRouted** (terminal for ACU; emergency episode continues) |
| Intake | Red flags negative | Triaged (urgency category) |
| Triaged | Clinician picks up | InAssessment |
| InAssessment | Plan signed | Treatment |
| Treatment | Reassessment due | Reassessment |
| Reassessment | Improving | Treatment / ReadyToClose |
| Reassessment | Worsening | Escalated (VIPD assessment / hospital / specialist) |
| ReadyToClose | Closure form signed | Closed (Resolved / Referred / Transitioned) |
| Any | Can't contact patient | ContactFailure (exception ladder) |

---

## 6. Pathway B — Chronic Care Management (summary)

**Full specification: Annex D.** The brief's 17-step workflow maps to Annex D like this:

| Step | Description | Annex D section | Screens |
|---|---|---|---|
| 1 | Referral, enrolment, post-discharge identification | §2.3–2.4, TR-09 | CC-D-03 |
| 2 | Diagnosis & eligibility verification | §3 | CC-D-03 |
| 3 | Baseline clinical & functional assessment | §3, §4 | CC-D-06 |
| 4 | Medication reconciliation | §9 | CC-D-07 |
| 5 | Individual care-plan creation & approval | §5 | CC-D-08 |
| 6 | Monitoring frequency & targets | §5, §7 | CC-D-09 |
| 7 | Doctor/nurse/specialist assignment | §5.1 #16, §11 | CC-D-08 |
| 8 | IoT setup or manual instructions | §7, §17.2 | CC-N-04, CC-P-06 |
| 9 | Scheduled observations & symptom reporting | §7 | CC-P-04/06/08 |
| 10 | Adherence & side effects | §9 | CC-P-07 |
| 11 | Lab & diagnostic follow-up | §6 worklists | CC-D-02 |
| 12 | Planned doctor & MDT reviews | §11 | CC-D-15, CC-D-14 |
| 13 | Care-plan progress evaluation | §5.2 | CC-D-15 |
| 14 | Worsening symptoms / abnormal trends | §8 | CC-D-11 |
| 15 | Reassessment & escalation | §2.4 T3, TR-01/04 | CC-D-12 |
| 16 | Care-plan modification by an authorised clinician | §5.3 | CC-D-08 |
| 17 | Periodic outcome assessment | §14 | CC-D-16 |

**Launch programmes recommended:** Hypertension, Type 2 Diabetes, Heart Failure, and Post-discharge continuity. These need CGC sign-off (Annex D §21). [D]

---

## 7. Pathway C — Virtual Hospitalization / Virtual IPD (summary & updates)

**Full specification: Annexes B and C.** Updates in v3.0:

| Area | Specification |
|---|---|
| Admission | Formal admission only after D-04 (clinical inclusion, hard exclusions, **staffing capacity check**, **equipment availability**, home environment, ambulance radius) and consent. An acute or chronic diagnosis alone never activates VIPD. [P] |
| Episode | Virtual ward + bed assignment; responsible doctor; care team; code status (D-07) |
| **Structured reviews** | **Morning review** (full round, plan), **evening review** (progress, overnight plan), **night review when clinically required** (by rule or nurse request). The US CMS AHCAH waiver requires daily physician evaluation and at least two in-person RN/paramedic visits a day [E] EV-38. The MYDR24 cadence is configurable per tier and set by the CGC. [P] |
| Monitoring | IoT or manual per tier; freshness rules (Annex C global rules) |
| Specialist opinions | Through the referral workflow (§13) |
| Deterioration | NEWS2 + rules; emergency bypass; escalation → transfer (D-24…D-27) |
| Discharge | 3-step discharge (D-32) → transition TR-05 / TR-06 / closed |
| Capacity guard | If staffing or equipment capacity is reached, the admission CTA is disabled with a "Capacity reached — refer" message. **No over-admission.** [P] |

---

## 8. Pathway D — Remote Patient Monitoring & Elderly Care (new)

### 8.1 Workflow

| Step | Description | Owner |
|---|---|---|
| 1 | Order/subscription: clinical question, parameters, duration, **ordering clinician**, **assigned reviewing professional** | Ordering clinician |
| 2 | Consent: device data, notifications to family (scoped), service-level disclosure (what is and isn't monitored, response hours) | Coordinator |
| 3 | Device enrolment: validated device registry, pairing, test reading | Field tech / nurse |
| 4 | Monitoring plan: measurement schedule per device capability; manual fallback | Ordering clinician |
| 5 | Alert rules: CGC-approved templates; individual thresholds set by a clinician | Ordering clinician |
| 6 | Data review per service level; freshness monitoring | Assigned professional |
| 7 | Notifications to patient and authorised family per consent | System |
| 8 | Escalation to the assigned professional, then clinician | Per rule |
| 9 | Clinical reassessment when indicated | Clinician |
| 10 | Transition to ACU / CCM / VIPD (TR-10) or end of episode | Clinician |

### 8.2 Elderly-Care Features [P]
- Scheduled wellbeing check-ins (voice/video).
- Fall-detection sensors or reports.
- Inactivity alerts (where the device supports them).
- Medication reminders (with dose-event states: Annex D §9.2).
- Caregiver burden check, cognitive-change reports, social contact log.
- One-tap emergency button (Home Hub/pendant).

### 8.3 Service Levels and Honest Claims (mandatory)

| Service level | Monitoring | Human review | Response coverage | **Allowed marketing claim** | **Prohibited claim** |
|---|---|---|---|---|---|
| RPM-L1 Self-monitoring | Device + app | Patient/family; clinician at scheduled reviews | No real-time response | "Readings shared with your doctor at your reviews" | "Monitored 24×7" |
| RPM-L2 Business-hours review | Device + rules | Assigned professional during stated hours | Stated hours only; emergencies → 108/112 | "Reviewed by our care team [hours]" | "Continuous supervision" |
| RPM-L3 Extended / 24×7 staffed | Device + rules | Command centre staffed per roster | 24×7, only when the roster and SLA are verified monthly | "24×7 monitored by clinical staff" | Any claim when coverage gaps exist |

Rules [P]:
- The service level is shown on the patient's app and in consent.
- If coverage drops (e.g. staffing gap), the system automatically shows a **coverage notice** to affected patients and routes alerts to the backup policy.

---

## 9. Unified Doctor Dashboard

### 9.1 Structure (no undifferentiated queue)
- **Top level:** pathway tabs `All · Acute · Chronic · Virtual IPD · RPM/Elderly`. Each tab has its own counts and worklists.
- **Always-visible strip:** Critical alerts & unresolved escalations, across pathways, pinned above everything.

### 9.2 Worklists

| Worklist | Pathways | Inclusion |
|---|---|---|
| Critical alerts & unresolved escalations | All | E/U class events not closed |
| Acute patients (by urgency) | ACU | Triaged, InAssessment, Reassessment |
| Chronic patients (by programme) | CCM | Active, ReassessmentRequired |
| Active Virtual IPD patients | VIPD | Admitted; NEWS2-sorted |
| RPM & elderly patients | RPM | Active; data-gap and alert badges |
| Awaiting clinical review | All | Review task due/overdue |
| Pending diagnostic results | All | Ordered, not resulted / resulted, not acknowledged |
| Upcoming consultations | All | Appointments next 24 h / 7 d |
| Specialist referrals | All | Awaiting response / recommendations to authorise |
| Medication review tasks | All | Reconciliation due, renewal requests |
| Nursing visits | All | Scheduled/overdue/failed |
| Hospital transfer coordination | ACU, VIPD, CCM | Transfer in progress |
| Discharge planning | VIPD (and ACU closure) | Discharge-ready |
| Overdue follow-ups | All | Past due date |

**Filters:** pathway, assigned clinician, urgency, care-plan status, monitoring mode (IoT/Manual/Hybrid), next review, unresolved tasks, programme, location.

**Every patient row and header shows:** `PathwayChip` (one or more), responsible clinician, urgency/severity, freshness, code status (if VIPD/elderly).

---

## 10. Alert & Event Engine (shared infrastructure, separate rule sets)

### 10.1 Event Taxonomy (distinct event types — never conflated)

| Event type | Meaning | Example | Default handling [P] |
|---|---|---|---|
| `EMERGENCY_REQUEST` | Patient/caregiver SOS or emergency symptom | Red-flag positive | **Immediate emergency routing; no ack timer wait** |
| `CLINICAL_DETERIORATION` | Clinical rule fired on valid data | NEWS2 rise; trend rule | Severity per rule |
| `CRITICAL_OBSERVATION` | Single critical value | SpO₂ below critical rule | Per rule |
| `CRITICAL_RESULT` | Lab critical value | K⁺ critical | Per lab policy |
| `ADVERSE_REACTION` | Suspected severe reaction | Anaphylaxis symptoms → emergency | Per rule |
| `REASSESSMENT_DUE` | Clinically required reassessment not done | Acute 24-h review | Clinical task |
| `DATA_MISSING` | Expected clinically important reading not received | Missed weight (HF) | Adherence/data class |
| `DEVICE_FAILURE` | Device fault, battery, sensor error | Cuff error | Technical |
| `CONNECTIVITY_LOSS` | Hub/device offline | No heartbeat | Technical → clinical only if the plan requires live data |
| `NOTIFICATION_DELIVERY_FAILURE` | Alert/notification couldn't be delivered to the recipient | Push failed, phone unreachable | **Re-route immediately to the next channel/recipient**; never counted as "acknowledged" |
| `ACK_TIMEOUT` | Recipient didn't acknowledge in time | — | Escalation sequence |
| `TASK_OVERDUE` | Care task not done | Visit missed | Coordinator |

### 10.2 Rule Sets by Pathway

| Rule set | Typical triggers (CGC to define) | Evaluation |
|---|---|---|
| **ACU** | Emergency symptoms; rapid deterioration; critical observations/results; severe adverse reactions; urgent reassessment | Real-time + task timers |
| **CCM** | Sustained deviation from baseline; outside targets; worsening symptoms; missing important observations; missed follow-ups/investigations; medication concerns; disease-specific trends | Batch windows + data-sufficiency (Annex D §8) |
| **VIPD** | NEWS2 bands, hard thresholds, trend rules, device alarms | Real-time stream (Annex B §9) |
| **RPM** | Template rules per device and service level | Real-time or batch per device; routed per service level (§8.3) |

### 10.3 Rule Definition Schema (all fields mandatory)
Trigger & rationale · clinical protocol & version · event type · severity · pathway · responsible recipient (role) + fallback · required response · acknowledgement deadline (service-policy reference) · escalation sequence · resolution criteria · suppression/de-dup rules (**never by low risk score**) · audit events · CGC approval ID/date.

### 10.4 Routing
- Route by **pathway + monitoring plan + service level + current roster**.
- If there's no rostered recipient (coverage gap), the alert goes to the **backup policy**. A `NOTIFICATION_DELIVERY_FAILURE`/coverage event is raised and the gap is logged for quality review.

### 10.5 Emergency Bypass
`EMERGENCY_REQUEST` and E-class rules skip queues and acknowledgement timers. The command-centre critical channel, the emergency guidance screen and the caregiver call all fire **in parallel**.

### 10.6 AI Boundaries (all pathways)
AI can summarise, flag, prioritise within limits, and suggest. AI **can't**:
- diagnose, prescribe, change or stop treatment;
- decide home-treatment suitability;
- suppress or downgrade alerts;
- admit, discharge or transition a patient.

Full register: Annex D §13.

---

## 11. Clinical Governance & Patient Safety

| Element | Specification |
|---|---|
| **Clinical Governance Committee (CGC)** | Medical director (chair), nursing lead, clinical safety officer, pharmacist, programme leads, quality lead, patient representative. Approves protocols, rules, thresholds, service policies and content. [D] members |
| **Clinical safety case** | Hazard log, risk controls, residual-risk acceptance, using ISO 14971 risk management and IEC 62304 / IEC 82304-1 software lifecycle and health-software safety [P]. A safety case per release. |
| **Change control** | Clinical-content changes (rules, thresholds, triage lists, education) are versioned, peer-reviewed, CGC-approved and released with an effective date. Running episodes keep a record of the version applied. |
| **Incident management** | Near-miss and adverse-event reporting from every app; root-cause analysis; reports to partner hospitals and regulators as required |
| **Audit programme** | Monthly: under-triage audit (ACU), alert ack performance, transitions without complete handover, coverage gaps (RPM-L3), medication-reconciliation completion |
| **Training & credentialing** | Role-based training; qualification stored per user; task-level qualification enforcement (Annex D §10.2) |

### 11.1 Top Hazards (initial hazard log extract)

| ID | Hazard | Cause examples | Key controls |
|---|---|---|---|
| HZ-01 | Delayed emergency response | Emergency treated as routine; notification failure | Red-flag bypass; parallel routing; `NOTIFICATION_DELIVERY_FAILURE` re-route; drills |
| HZ-02 | Under-triage in Acute Care | Unvalidated protocol; patient misreporting | Validated protocol; clinician review; "not sure" = escalate; under-triage audit |
| HZ-03 | Inappropriate home admission | Pressure on beds; capacity exceeded | D-04 hard stops; capacity guard; senior override audit |
| HZ-04 | Missing data treated as normal | UI interpolation; averages without n | Freshness states; gaps visible; "not assessable" |
| HZ-05 | Wrong patient | Similar names | Identity verification; two identifiers on every order |
| HZ-06 | Medication error across transitions | No reconciliation | Mandatory reconciliation at entry and exit |
| HZ-07 | Over-claimed monitoring | Marketing beyond coverage | Service levels (§8.3); coverage notice |
| HZ-08 | Lost handover | Transition without acceptance | Handover status required; overdue acceptance alert |
| HZ-09 | AI error influencing care | Hallucinated summary | Labelling; sign-off; prohibited actions enforced |
| HZ-10 | Privacy breach to family | Wrong consent scope | Scope enforcement; revocation ≤ 5 min |

---

## 12. Emergency Escalation & Hospital Transfer (all pathways)

| Step | Action | Notes |
|---|---|---|
| 1 | Trigger: red flag, SOS, E-rule, clinician declares emergency | Any pathway, any screen |
| 2 | Parallel: show **Call 108/112** to the patient/caregiver; command-centre critical event; on-call doctor paged | No sequential waiting |
| 3 | Code-status check (D-07) shapes guidance (Full/DNR/Limited) | |
| 4 | Dispatch: ambulance (108/112/private contract), field team if nearer | ETA tracked; resources-unavailable exception (§5.4) |
| 5 | Caregiver guidance (CPR / recovery position) only if code status allows and protocol approved | Annex C D-25 |
| 6 | Receiving ED pre-alert + handover bundle (FHIR `Bundle`) | Annex C D-27 |
| 7 | Transition record (TR-07/TR-08); episode suspended or closed | §4 |
| 8 | Post-event review: incident if any delay | §11 |

---

## 13. Specialist Consultation & Third Opinion

| Element | Specification |
|---|---|
| Request types | Specialist referral (routine/urgent), **e-consult** (asynchronous advice), **second/third opinion** (patient- or clinician-requested independent review) |
| Mandatory package | Clinical question, urgency, longitudinal summary, meds, allergies, observations, investigations, previous opinions, patient consent for sharing |
| Statuses | Draft → Sent → Accepted/Declined → Scheduled → Completed (report) → Recommendations pending authorisation → Incorporated / Not adopted (reason) |
| Third-opinion rules [P] | Reviewer is independent of the previous opinions; sees all opinions; disagreement is shown side by side; the responsible clinician documents the decision and discusses it with the patient |
| Authority | Recommendations ≠ orders until authorised by the responsible clinician (or the specialist, if formally delegated) |
| Screens | CC-D-14, CC-S-01/02, plus new **SP-D-01 Third-Opinion Request** and **SP-S-01 Third-Opinion Review** (§18) |

---

## 14. Data Model & APIs (unified)

### 14.1 Core Resources (FHIR R4 / ABDM profiles)

| Concept | Resource | Key elements |
|---|---|---|
| Patient & identity | `Patient`, `RelatedPerson`, `Provenance` | ABHA, verification |
| Pathway episode | `EpisodeOfCare` | `type` ∈ {ACU, CCM, VIPD, RPM}; `status`; `careManager`; `team`; links |
| Visit / consult / admission | `Encounter` | class AMB/VR/HH/EMER; `episodeOfCare` |
| Transition | `Task` (code=`pathway-transition`) + `Provenance` + `Composition` | §4.1 fields |
| Triage | `QuestionnaireResponse` (protocol version) + `RiskAssessment` (urgency) | Red-flag results |
| Problems | `Condition` | category problem-list/encounter-diagnosis |
| Plans & goals | `CarePlan`, `Goal`, `PlanDefinition` (programmes, order sets) | Versioned |
| Orders | `MedicationRequest`, `ServiceRequest` | Signed |
| Administration / adherence | `MedicationAdministration`; dose-event extension (Annex D §9.2) | |
| Observations | `Observation` (incl. `valueSampledData`) + `Device` | Provenance, quality, freshness |
| Results | `DiagnosticReport`, `ImagingStudy` | Ack task |
| Alerts/events | `Flag`, `DetectedIssue`, `Communication`, `CommunicationRequest` | Event type (§10.1) extension |
| Tasks | `Task` | Qualification requirement extension |
| Consent | `Consent` | Scope per pathway & family |
| Audit | `AuditEvent` | All reads/writes |

### 14.2 API Surface (additions to Annexes B and D)

| Endpoint | Purpose |
|---|---|
| `POST /episodes` · `PATCH /episodes/{id}/status` | Create/transition any pathway episode (validated against status models) |
| `POST /transitions` · `PATCH /transitions/{id}` | Transition record lifecycle (initiated → authorised → handover accepted) |
| `POST /acute/intake` · `POST /acute/{id}/redflag-screen` · `POST /acute/{id}/triage` | Acute intake, red flags, triage (protocol version required) |
| `POST /acute/{id}/closure` | Close with outcome |
| `POST /rpm/orders` · `PUT /rpm/{id}/service-level` | RPM order and service level |
| `GET /dashboard/worklists?pathway=&filters=` | Unified worklists |
| `GET/POST /events` (`eventType`, `severity`, `pathway`, `ruleId`, `ruleVersion`) | Shared event engine |
| `POST /events/{id}/ack` · `POST /events/{id}/resolve` | Ack/resolution with criteria |
| `GET /coverage/roster` | Coverage for routing and RPM-L3 claims |
| `POST /opinions` (type=referral/e-consult/second/third) | Specialist workflows |

Event streaming topics (extends Annex B §11.3): `episodes.events`, `transitions.events`, `triage.events`, `events.clinical`, `events.technical`, `events.delivery`.

---

## 15. HL7 FHIR & ABDM Interoperability

- **FHIR R4 (4.0.1)** pinned. ABDM profiles are used for health records shared via HIP/HIU (Prescription, DiagnosticReport, OPConsultation, DischargeSummary, WellnessRecord). [E] ABDM (Annex B §10.2)
- Retired STU3 resources are not used (`ReferralRequest`, `ProcedureRequest`). Mapping corrections are in Annex C Part C.
- Partner HIS: HL7 v2 ADT (admission/discharge notices trigger TR-05/08/09), ORU (results), FHIR APIs where available.
- Terminology: SNOMED CT (India has an NRC), LOINC for observations, UCUM units, and a national drug list for medications. [A] Confirm licensing.
- Claims: NHCX readiness (Annex B).

---

## 16. Security, Privacy & Consent

| Area | Specification |
|---|---|
| **DPDP Act 2023 & Rules 2025** | Rules were notified 13 Nov 2025 with phased commencement: Consent-Manager provisions from Nov 2026, core obligations from May 2027 [E] EV-16. **Build for full compliance at launch.** [P] |
| Consent scopes | Per pathway (ACU tele-consult; CCM programme; VIPD admission; RPM device data and service level), per data category, per family member; withdrawal is honoured system-wide |
| Telemedicine | NMC Telemedicine Practice Guidelines 2020: RMP identification, consent, prescribing lists, emergency limits [E] EV-37 |
| Access control | RBAC + ABAC (care-team/roster/pathway); break-glass with reason; session controls |
| Encryption & security ops | TLS 1.3/mTLS, AES-256 at rest, CERT-In incident directions, VAPT, ISO 27001 path (Annex B §13) |
| Medical-device software | CDSCO SaMD classification for alerting/triage/AI components that drive clinical action [D] |
| Data residency | India regions (Annex B §8.3) |
| Patient rights | Access, correction, erasure (with clinical-record retention limits), grievance, nominee |

---

## 17. Existing MYDR24 Design-System Audit

### 17.1 Audit Scope & Limitation (please read)
- **Figma files couldn't be opened.** Both shared links need a Figma login (HTTP 403). This audit is based **only** on the three doctor-app storyboard canvases (raster images) shared earlier.
- Colours, type sizes and spacing below are **visual observations, not verified tokens**. **Exact design fidelity isn't claimed.** [A]
- **[D]** To complete the audit: grant view access, share a Figma library export, or allow a Figma API token/MCP connection.

### 17.2 Observed Foundations (unverified)

| Foundation | Observation from canvases |
|---|---|
| Brand | "MyDoctor24 — Healthcare for Every Community" logo, green/blue cross mark |
| Primary colour | Saturated medium blue used for primary buttons, active tabs and headers |
| Status colours | Red (Critical, Red alert, Live Emergency banner), Amber/orange (Amber alerts, "Due"), Green (Stable, "Given"), Blue (Info, PRN) |
| Surfaces | White cards on a light grey/blue background, rounded corners, light shadow |
| Typography | Sans-serif; bold screen titles; medium labels; large numeric vitals |
| Navigation | Bottom tab bar (Home · Patients · Rounds/Chart · Alerts · More); back-arrow headers |
| Iconography | Outline icons; coloured document/med icons in lists |

### 17.3 Observed Components (candidate reuse)

| Component (proposed name) | Seen on | Reuse for |
|---|---|---|
| `PatientHeaderCard` | Chart, alerts, handover | All patient-context screens |
| `VitalTile` | Chart, baseline, alert detail | All vitals displays |
| `StatusPill` | Census (Stable/Critical/Pending), MAR (Given/Due/PRN) | Status everywhere |
| `AlertRow` + severity chip | Alert inbox | Event inbox (all pathways) |
| `SegmentedTabs` | Chart, consent, CPOE | Pathway tabs, sub-views |
| `Stepper` | Admission eligibility/consent | Acute intake, CCM enrolment |
| `ChecklistRow` | Eligibility, discharge checklist | Red-flag screen, closure checklists |
| `DocumentRow` (View) | Consent review | Consent scopes |
| `OrderLine` / `MARLine` | CPOE, e-Rx & MAR | Orders across pathways |
| `TrendChartCard` | Real-time vitals, progress analytics | Longitudinal trends |
| `VideoCallScreen` | Tele-round console | Acute consults, reviews |
| `ChatThread` | Care-team chat | All messaging |
| `EmergencyBanner` | Emergency console | Emergency screens |
| `BottomNav`, `PrimaryButton`, `KPIcard` | Dashboard | All |

### 17.4 Required Extensions (compatible proposals — styled from existing tokens)

| New component | Purpose | Based on | Design uncertainty |
|---|---|---|---|
| `PathwayChip` (ACU / CCM / VIPD / RPM) | Show pathway on every row and header | `StatusPill` shape, **neutral outline + icon** (so it doesn't clash with severity colours) | Icon set and label language [D] |
| `ResponsibleClinicianTag` | Show clinical responsibility | Avatar + name text style | — |
| `FreshnessIndicator` (Live/Current/Due/Missing/Stale) | Data-freshness states | Small dot + caption | Grey shade for stale |
| `DataGapBadge` | Data gap ≠ risk | Outline badge, technical blue | — |
| `CodeStatusChip` | Full/DNR/Limited | `StatusPill` | Wording per legal review |
| `ServiceLevelBadge` (RPM-L1/L2/L3) | Honest coverage display | `StatusPill` | Marketing copy approval |
| `EventClassChip` (E/U/R/A/T + technical/delivery) | Event taxonomy | Existing severity chips + new technical/delivery variants | Colour for delivery failure [D] |
| `TransitionCard` | Show initiated/authorised/handover status | Card + stepper | — |
| `RedFlagScreen` template | Emergency-first intake | `ChecklistRow` + `EmergencyBanner` | Must be usability-tested |
| `PathwayTabs` on dashboard | No undifferentiated queue | `SegmentedTabs` (scrollable) | Tab overflow on small screens |

**Rule:** no new colours, fonts or visual identity per pathway. Pathways are told apart by label and icon, not by theme. [P]

---

## 18. Complete Screen Inventory (all roles, all pathways)

### 18.1 ID Scheme

`<Pathway>-<Role>-<nn>`. Pathway: **UD** unified · **AC** acute · **CC** chronic · **D/VN/VP** virtual IPD (existing) · **RM** RPM/elderly · **SP** specialist/opinion · **EM** emergency. Role: D doctor · N nurse/professional caregiver · P patient/family · A allied · S specialist · M manager/admin.

### 18.2 Totals

| Role | Unified/shared | Acute | Chronic | Virtual IPD | RPM/Elderly | Specialist/Opinion | **Total** |
|---|---|---|---|---|---|---|---|
| Doctor | 4 (UD-D) | 11 (AC-D) | 16 (CC-D) | 32 (D-01…32) | 5 (RM-D) | 1 (SP-D) | **69** |
| Nurse / professional caregiver | 2 (UD-N) | 6 (AC-N) | 12 (CC-N) | 10 (VN) | 4 (RM-N) | — | **34** |
| Patient / family | 2 (UD-P) | 6 (AC-P) | 18 (CC-P) | 8 (VP) | 6 (RM-P) | — | **40** |
| Allied professionals | — | — | 8 (CC-A) | — | — | — | **8** |
| Specialist | — | — | 2 (CC-S) | — | — | 1 (SP-S) | **3** |
| Manager / admin | 3 (UD-M) | 1 (AC-M) | 5 (CC-M) | — | 1 (RM-M) | — | **10** |
| **Total** | **11** | **24** | **61** | **50** | **16** | **2** | **164** |

### 18.3 Per-screen Specification Standard
Every screen is specified with: Screen ID · role · purpose · entry point · data displayed · actions & permissions · validation · alert states · loading/empty/offline/error states · API dependencies · navigation · clinical safety requirements · acceptance criteria · Figma components to reuse (§17.3/17.4).
- **Global defaults** (states, audit, accessibility, freshness, emergency access) apply to all screens (Annex C B2, Annex D §15.1). Tables list only what's specific to each screen.
- **Existing detailed specs:** D-01…D-32 → Annex C; CC-* → Annex D §15.

### 18.4 New Screens — Unified (UD)

| ID | Role | Screen | Purpose | Entry | Key data / actions | Safety / validation | APIs | Acceptance criteria | Reuse |
|---|---|---|---|---|---|---|---|---|---|
| UD-D-01 | Doctor | **Unified Clinical Dashboard** | Pathway-separated worklists (§9) | Login | Pathway tabs, critical strip, worklist cards, filters | Critical strip always on top; no mixed queue | `GET /dashboard/worklists` | E/U events visible ≤ 5 s; counts per tab correct | KPIcard, PathwayTabs, AlertRow |
| UD-D-02 | Doctor | Unified Patient Header & Pathway Summary | Show all active episodes, responsibility, code status | Any patient | Episodes list, responsible clinicians, open transitions | Header present on every patient screen | `GET /patients/{id}/episodes` | Header shows ≥ 1 PathwayChip when any episode is active | PatientHeaderCard, PathwayChip |
| UD-D-03 | Doctor | Transition Request & Authorisation | Create/authorise transitions (§4) | Header action, alert, closure | TR type, rationale, receiving pathway, outstanding tasks, handover | Required fields; AI suggestion labelled; authoriser role check | `POST/PATCH /transitions` | Can't complete without the receiving acceptance where required | TransitionCard, Stepper |
| UD-D-04 | Doctor | Unified Event Inbox | All event types with filters (§10.1) | Alerts tab | Event class, type, pathway, rule, ack timer | Delivery failures shown separately; E bypass | `GET /events` | `NOTIFICATION_DELIVERY_FAILURE` never shows as acknowledged | AlertRow, EventClassChip |
| UD-N-01 | Nurse | Unified My Day | Visits across pathways | Login | Visits with PathwayChip, tasks | Qualification locks | `GET /visits` | Pathway visible per visit | PathwayChip |
| UD-N-02 | Nurse | Transition Handover Inbox | Accept handovers | Notification | Handover package | Acceptance required | `PATCH /transitions/{id}` | Overdue acceptance → alert | TransitionCard |
| UD-P-01 | Patient | Home (all my care) | Active pathways in plain language | App open | Cards per active pathway; emergency button | Service level shown for RPM | `GET /me/episodes` | Emergency reachable in 1 tap | KPIcard, EmergencyBanner |
| UD-P-02 | Patient | My Care Team & Responsibility | Who is responsible for what | Home | Clinicians per pathway, hours | "Not for emergencies" banner | `GET /me/careteam` | Matches current roster | ChatThread |
| UD-M-01 | Manager | Coverage & Roster Monitor | Verify coverage for routing and RPM-L3 claims | Admin | Roster vs required coverage | Coverage gap → coverage notice workflow | `GET /coverage/roster` | Gap creates an event within 1 min | — |
| UD-M-02 | Manager | Transition & Handover Audit | Quality review | Admin | Transitions with missing handover/fields | — | `GET /transitions?audit` | Exportable | — |
| UD-M-03 | Manager | Clinical Content & Rule Governance | Versioned protocols, rules, red-flag lists | Admin | Draft → review → CGC approve → publish | Only approved versions execute | `GET/POST /rules`, `/protocols` | Draft can't run in production | — |

### 18.5 New Screens — Acute Care (AC)

| ID | Role | Screen | Purpose | Entry | Key data / actions | Safety / validation | APIs | Acceptance criteria | Reuse |
|---|---|---|---|---|---|---|---|---|---|
| AC-D-01 | Doctor | Acute Intake Queue | New symptom reports & referrals by urgency | UD-D-01 Acute tab | Urgency, wait time vs target, red-flag result, source | Red-flag-positive cases never sit here (already routed) | `GET /acute?status=` | Sorted by urgency then wait | AlertRow, StatusPill |
| AC-D-02 | Doctor | Identity, Consent & Red-Flag Review | Steps 2–3 | Open case | Identity check, tele-consult consent, red-flag answers | Positive → Emergency (EM) immediately | `POST /acute/{id}/redflag-screen` | Emergency route ≤ 2 taps | ChecklistRow, RedFlagScreen |
| AC-D-03 | Doctor/Nurse | Triage (approved protocol) | Step 4 | AC-D-02 | Protocol questions, urgency category, rationale | Protocol version stored; clinician can up-triage freely; down-triage needs a reason | `POST /acute/{id}/triage` | Category + version saved | Stepper |
| AC-D-04 | Doctor | Acute Consultation Workspace | Steps 5–6, 8 | Queue | History, meds, allergies, observations, video, notes | Deterioration → Emergency button always visible | `GET /patients/{id}/longitudinal` | Prefilled from record | VideoCallScreen, VitalTile |
| AC-D-05 | Doctor | Acute Med Reconciliation | Step 6 | Workspace | Current meds vs reported | Required before e-Rx | `POST /medrec` | Blocks e-Rx if not done | MARLine |
| AC-D-06 | Doctor | Acute Orders (tests, visits) | Step 7 | Workspace | Labs, imaging, field visit, POC | Home-ineligible orders blocked | `POST /servicerequests` | Urgent order → field task | OrderLine |
| AC-D-07 | Doctor | Acute Assessment & Plan | Step 8 | Workspace | Problem, differential, plan, risk | Sign required | `POST /compositions` | Plan signed before closure | SegmentedTabs |
| AC-D-08 | Doctor | Arrange Services | Step 10 | Plan | Nursing/home-care/specialist requests | Provider availability check; failure → exception | `POST /servicerequests` | Failure raises a task | ChecklistRow |
| AC-D-09 | Doctor | Safety-Net & Follow-up | Step 11 | Plan | Approved safety-net template, follow-up booking | Template from approved library | `POST /appointments` | Patient receives instructions in their language | DocumentRow |
| AC-D-10 | Doctor | Reassessment & Exceptions | Step 12, §5.4 | Task | Reassessment form; contact-failure ladder; declined advice | Each attempt timestamped | `PATCH /acute/{id}` | Ladder can't be skipped without a reason | Stepper |
| AC-D-11 | Doctor | Acute Closure / Escalation | Step 13 | Workspace | Outcome: resolved / referred / VIPD assessment (→ D-04) / hospital (→ EM) | Transition record required | `POST /acute/{id}/closure` | Closure blocked with an unacknowledged critical event | TransitionCard |
| AC-N-01 | Nurse | Acute Visit | Assessment visit | My Day | Observations, exam aid, POC | Qualification | `POST /observations` | — | VitalTile |
| AC-N-02 | Nurse | Triage Call (nurse-led) | Protocol triage by phone | Queue | Protocol, urgency | As AC-D-03 | `POST /acute/{id}/triage` | — | Stepper |
| AC-N-03 | Nurse | Welfare Check (can't contact) | Contact-failure visit | Exception task | Outcome, escalation | Emergency button | `PATCH /acute/{id}` | Outcome required | EmergencyBanner |
| AC-N-04 | Nurse | Acute Medication Administration | Give prescribed meds | Task | eMAR, scan | 5 rights | `POST /medadmin` | — | MARLine |
| AC-N-05 | Nurse | Acute Escalation (SBAR) | Escalate | Any | SBAR | — | `POST /escalations` | Ack tracked | AlertRow |
| AC-N-06 | Nurse | Emergency Documentation | Record emergency events | EM | Timeline, handover | — | `POST /compositions` | — | — |
| AC-P-01 | Patient | Report Symptoms | Start acute care | Home | Symptom entry, duration, photos | Red-flag screen first | `POST /acute/intake` | Red flags shown before other questions | Stepper |
| AC-P-02 | Patient | Emergency Help (red flag) | Immediate action | Red flag positive / SOS | Call 108/112, care-team notified, guidance | Works offline (dialer) | `POST /events` (EMERGENCY) | Command-centre event ≤ 10 s | EmergencyBanner |
| AC-P-03 | Patient | Waiting & Call-back Status | Expectations | After intake | Urgency category explanation, expected contact window, "get worse? do this" | No diagnosis shown | `GET /acute/{id}` | — | StatusPill |
| AC-P-04 | Patient | Consultation (video/audio) | Consult | Notification | Video, chat | Fallback to audio/PSTN | — | — | VideoCallScreen |
| AC-P-05 | Patient | My Acute Plan & Instructions | Follow the plan | After consult | Meds, safety-net, follow-up | Plain language | `GET /acute/{id}/plan` | — | DocumentRow |
| AC-P-06 | Patient | Acute Check-in | Reassessment PROs | Scheduled | "Better / same / worse" + symptoms | "Worse" → clinical task; red flags → AC-P-02 | `POST /questionnaireresponses` | — | ChecklistRow |
| AC-M-01 | Manager | Acute Service Monitor | Wait-time vs target, under-triage audit | Admin | KPIs | — | `GET /metrics?pathway=ACU` | — | TrendChartCard |

### 18.6 New Screens — Virtual IPD Nurse & Patient (VN/VP)
*(The doctor side is D-01…D-32 in Annex C. The platform features are in Annex B §6.)*

| ID | Role | Screen | Purpose / key safety |
|---|---|---|---|
| VN-01 | Nurse | VIPD Round Schedule (morning/evening/night) | Planned visits and reviews; missed review → event |
| VN-02 | Nurse | Home Setup & Device Pairing | Kit checklist, hub test, connectivity |
| VN-03 | Nurse | VIPD Observations & NEWS2 | Auto NEWS2; escalation band shown |
| VN-04 | Nurse | eMAR (barcode) | 5 rights; high-alert double check |
| VN-05 | Nurse | IV / Infusion Record | Record-only; home-ineligible infusions blocked |
| VN-06 | Nurse | Specimen Collection | Chain of custody, POC import |
| VN-07 | Nurse | Deterioration Escalation (SBAR) | Direct to D-24/D-25 |
| VN-08 | Nurse | Shift Handover (I-PASS) | Mirrors D-28 |
| VN-09 | Nurse | Emergency & Transfer Documentation | Timeline, handover bundle |
| VN-10 | Nurse | Discharge Teaching & Device Pickup | Teach-back, asset return |
| VP-01 | Patient | My Hospital Room at Home | Plan, next visit, live vitals with freshness |
| VP-02 | Patient | Emergency / Call Nurse (SOS) | 1-tap; PSTN fallback |
| VP-03 | Patient | Medicines Today | Reminders; dose events |
| VP-04 | Patient | Video Rounds | Morning/evening rounds |
| VP-05 | Patient | Device Help | Guided fixes; technician request |
| VP-06 | Patient | My Reports | Results, prescriptions |
| VP-07 | Family | Family Updates (consented) | Scope-limited |
| VP-08 | Patient | Discharge & What Next | Summary, follow-up, red flags |

### 18.7 New Screens — RPM & Elderly Care (RM)

| ID | Role | Screen | Purpose / key safety |
|---|---|---|---|
| RM-D-01 | Doctor | RPM Order & Monitoring Plan | Clinical question, parameters, duration, reviewer, service level |
| RM-D-02 | Doctor | RPM Panel & Data Review | Patients by service level; freshness; data gaps ≠ risk |
| RM-D-03 | Doctor | RPM Patient Trends | Longitudinal charts; annotations |
| RM-D-04 | Doctor | RPM Alert Rules (patient) | Template rules + individual thresholds; CGC bounds |
| RM-D-05 | Doctor | RPM Reassessment & Transition | TR-10 to ACU/CCM/VIPD |
| RM-N-01 | Nurse | Device Enrolment & Validation | Registry check; test reading |
| RM-N-02 | Nurse | Data-Gap & Technical Outreach | Device/connectivity events (technical class) |
| RM-N-03 | Nurse | Elderly Wellbeing Check-in | Structured check; escalate |
| RM-N-04 | Nurse | Fall / Inactivity Response | Call, welfare visit, emergency |
| RM-P-01 | Patient | My Monitoring | What's monitored, by whom, when (service level) |
| RM-P-02 | Patient | Take a Reading | Guided manual/device reading |
| RM-P-03 | Patient | My Devices | Battery, sync, help |
| RM-P-04 | Patient | Reminders & Check-ins | Med reminders (dose states), wellbeing |
| RM-P-05 | Family | Family Notifications & Settings | Scoped alerts; quiet hours never mute emergencies |
| RM-P-06 | Patient | Help / Emergency Button | Pendant/Hub/app SOS |
| RM-M-01 | Manager | RPM Service-Level Compliance | Claims vs coverage; coverage notices |

### 18.8 New Screens — Specialist / Third Opinion (SP)

| ID | Role | Screen | Purpose / key safety |
|---|---|---|---|
| SP-D-01 | Doctor | Opinion Request (referral / e-consult / second / third) | Mandatory package; patient sharing consent |
| SP-S-01 | Specialist | Independent Opinion Review | Sees all prior opinions; structured response; disagreement shown side by side |

---

## 19. Phase 1 — Doctor Application Screen Plan (ready to generate once approved)

**Phase 1 scope:** 69 doctor screens. Recommended build order: 6 sprints of design + clinician testing.

| Sprint | Module | Screens |
|---|---|---|
| D1 | Unified dashboard & patient context | UD-D-01, UD-D-02, UD-D-04, D-01, D-02, D-03 |
| D2 | Acute Care workflow | AC-D-01 … AC-D-11 |
| D3 | Virtual IPD admission & ward | D-04 … D-12, D-14, D-15 |
| D4 | Assessment, documentation, orders | D-13, D-16 … D-22, AC-D-07 |
| D5 | Chronic Care & RPM | CC-D-01 … CC-D-16, RM-D-01 … RM-D-05 |
| D6 | Alerts, escalation, transfer, discharge, opinions | D-23 … D-32, UD-D-03, SP-D-01 |

**Phase 1 design deliverables (after approval):**
- Figma frames using the existing MYDR24 components and the §17.4 extensions.
- Interactive prototypes for the five critical journeys:
  1. Acute intake → red flag → emergency
  2. Acute → VIPD admission
  3. Chronic deterioration → acute episode
  4. VIPD red alert → transfer
  5. VIPD discharge → CCM/RPM
- States for every screen.
- Clinician usability test (≥ 5 doctors).

> **Status:** visual screens, mockups and code are **not generated yet**, as the document-first rule requires. Reply **"Approved"** (or list changes) and Phase 1 generation starts with Sprint D1.

---

## 20. Clinical Requirements & Acceptance Tests (cross-pathway)

*Pathway-specific tests are in Annex C (D-xx acceptance criteria) and Annex D §18 (CC-SR-01…16).*

| ID | Requirement | Acceptance test | Priority |
|---|---|---|---|
| X-01 | Emergency bypass in every pathway | Trigger red flag from AC-P-01, CC-P-08, VP-02, RM-P-06 → emergency screen + command-centre E-event ≤ 10 s; no routine task created first | P0 |
| X-02 | Separate worklists | Dashboard shows four pathway tabs; no patient list mixes pathways without a PathwayChip | P0 |
| X-03 | Pathway visible on every record | Every patient-context screen shows PathwayChip(s) + responsible clinician | P0 |
| X-04 | Transition record completeness | Attempt a transition missing rationale/authoriser → blocked | P0 |
| X-05 | No AI-executed transitions | AI suggestion produces a draft only; status unchanged until a human authorises | P0 |
| X-06 | VIPD activation only via D-04 | Acute or chronic diagnosis alone can't create a VIPD encounter (API returns 422) | P0 |
| X-07 | Capacity guard | At configured capacity, admission is disabled with a referral option | P0 |
| X-08 | Event-type separation | Simulate device failure, push failure and clinical deterioration → three different event types, different routing | P0 |
| X-09 | Delivery failure re-route | Push to on-call fails → next channel/recipient within policy; event never "acknowledged" by failure | P0 |
| X-10 | Triage protocol versioning | Every triage stores protocol ID/version; down-triage needs a reason | P0 |
| X-11 | Contact-failure ladder | No patient response → ladder steps logged; can't close the episode without an outcome | P0 |
| X-12 | Med reconciliation at transitions | ACU→VIPD, VIPD→CCM transitions need a reconciliation snapshot | P0 |
| X-13 | RPM honest claims | Patient app shows the service level; RPM-L3 badge hidden automatically when a coverage gap is detected | P0 |
| X-14 | Concurrency rules | Creating a second active VIPD encounter is rejected; CCM suspended on VIPD admission | P1 |
| X-15 | Consent per pathway | Family member with CCM-only scope can't see VIPD data | P0 |
| X-16 | Design consistency | Visual regression: new screens use only approved tokens/components (after Figma access) | P1 |
| X-17 | End-to-end journeys | The five critical journeys (§19) pass in a simulation with clinicians | P0 |

---

## 21. Implementation Roadmap

| Phase | Scope | Gate |
|---|---|---|
| **0 — Approval (now)** | This document; Figma access; CGC formation | **Explicit approval** |
| 0b — Clinical content | Triage protocol decision; red-flag list; launch programmes (HTN, T2DM, HF, post-discharge); VIPD criteria; service policies; RPM service levels | CGC sign-off packs |
| **1 — Doctor app** | 69 screens (§19) | Doctor usability test; safety review |
| **2 — Nursing/Caregiver app** | 34 screens | Nursing usability test |
| **3 — Patient/Family app** | 40 screens | Elderly + regional-language usability test |
| **4 — Allied professionals** | 8 screens (+ specialist 3) | Allied usability test |
| **5 — Integration & validation** | Cross-pathway transitions, shared record, permissions, alert ack, med/diagnostic continuity, transfer/discharge, IoT and non-IoT, safety case, E2E acceptance (§20) | Clinical safety case sign-off → pilot |
| Pilot | 1 city, 1 partner hospital, ACU + VIPD (T1) + CCM (HTN/T2DM/HF) + RPM-L2 | Safety KPIs met |

Platform build timeline, team and budget: Annex B §19–21. These need to be re-estimated for the added Acute and RPM scope. [D]

---

## 22. Assumptions & Open Decisions

| ID | Type | Item | Recommendation / note |
|---|---|---|---|
| OD-01 | [D] | Remote-triage protocol (§5.1) | Adapt ATP for tele-triage + local validation + clinician review |
| OD-02 | [D] | CGC membership & approval process | Name members; monthly cadence + urgent route |
| OD-03 | [D] | Figma access for the design audit | View access or library export |
| OD-04 | [D] | Launch programmes | HTN, T2DM, HF, post-discharge |
| OD-05 | [D] | VIPD review cadence per tier (morning/evening/night) | CGC to set; at least daily physician review |
| OD-06 | [D] | RPM service levels offered at launch | L1 + L2; L3 only with a verified 24×7 roster |
| OD-07 | [D] | Ack deadlines/escalation timers (service policies) | Ops + CGC per event class/pathway |
| OD-08 | [D] | SaMD classification for triage/alerting/AI | Early regulatory consultation |
| OD-09 | [D] | Paediatric/obstetric scope | Out of v3.0; plan v4 |
| OD-10 | [D] | Terminology licensing (SNOMED CT India) | Confirm with NRC |
| OD-11 | [A] | Partner hospital provides ED acceptance and ADT feeds | Confirm in contracts |
| OD-12 | [A] | Ambulance coverage via 108/112 + private contracts in pilot city | Confirm SLA data availability |
| OD-13 | [A] | "Caregiver Flow" Figma = professional caregiver/nurse app | Confirm |
| OD-14 | [D] | Mobile framework (brief mentions React Native; Annex B recommends Flutter) | Decide before Phase 1 build; design is framework-neutral |
| OD-15 | [D] | Budget re-estimate for Acute + RPM scope | After approval |

---

## 23. Evidence Register (master)

*EV-01…EV-17 are in Annex D §20. EV-31 onwards are listed here. Annex A has the Virtual Hospitalization market evidence.*

| ID | Source | Used for |
|---|---|---|
| EV-31 | Diagnostic accuracy of 5-level ED triage systems, systematic review & meta-analysis — [PubMed 42398236](https://pubmed.ncbi.nlm.nih.gov/42398236/) | Triage accuracy and under-triage risk |
| EV-32 | Zachariasse et al., *Performance of triage systems in emergency care*, BMJ Open 2019 — [BMJ Open](https://bmjopen.bmj.com/content/9/5/e026471) | Variable triage performance |
| EV-33 | Manchester Triage System validity/reliability review — [PubMed 24613653](https://pubmed.ncbi.nlm.nih.gov/24613653/) | Under-triage safety concern |
| EV-34 | AIIMS Triage Protocol (ATP) — [PMC7472824](https://pmc.ncbi.nlm.nih.gov/articles/PMC7472824/) | Indian triage protocol |
| EV-35 | Prospective validation of ATP — [PubMed 36353399](https://pubmed.ncbi.nlm.nih.gov/36353399/) | ATP validation (ED setting) |
| EV-36 | Diagnostic & triage accuracy of digital symptom checkers, systematic review — [npj Digital Medicine 2022](https://www.nature.com/articles/s41746-022-00667-w) | Limits of symptom checkers |
| EV-37 | Telemedicine Practice Guidelines of India 2020, implications — [PMC8106416](https://pmc.ncbi.nlm.nih.gov/articles/PMC8106416/); emergency limits summary — [Lexology](https://www.lexology.com/library/detail.aspx?g=12a2bf9c-e2ff-4445-b769-d8151df3ee2e) | Tele-consult rules |
| EV-38 | CMS Acute Hospital Care at Home (Federal Register notice, Apr 2026) — [Federal Register](https://thefederalregister.org/pdf/documents/2026-07629.pdf); [CMS QualityNet](https://qualitynet.cms.gov/publicgateway/public/acute-hospital-care-at-home) | VIPD review/visit benchmark |
| EV-01…17 | Chronic care, guidelines, DPDP, CMS RPM — Annex D §20 | Chronic Care |
| Annex A | Hospital-at-home RCTs, Medicare outcomes, NHS virtual wards | Virtual IPD |

*Content from sources was summarised and rephrased for compliance with licensing restrictions. This document is a product and technical specification, not medical advice. All clinical content must be approved by MYDR24's Clinical Governance Committee and regulatory counsel.*

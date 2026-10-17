/**
 * Demo data only (no real patients). Names and values are fictional and consistent with the
 * mock-data fix-list in the Doctor App spec (Annex C, Part E).
 */
import type { ChatMessage, ClinicalEvent, Doctor, Observation, Patient, VitalCode } from '../types/models';
import { DAY, HOUR, MIN } from '../utils/clinical';

const now = Date.now();
const t = (msAgo: number) => now - msAgo;

export const currentDoctor: Doctor = {
  name: 'Dr. Ramesh Kumar',
  role: 'DOCTOR',
  speciality: 'Intensivist · Virtual Ward Lead',
  regNo: 'REG-PLACEHOLDER-0001',
};

type Base = Partial<Record<VitalCode, number>>;

/** Builds a vitals series every `stepMin` minutes over `hours`, with gentle variation and overrides. */
function vitals(
  base: Base,
  opts: { hours?: number; stepMin?: number; lastAgoMin?: number; source?: Observation['source']; dips?: { agoMin: number; code: VitalCode; value: number }[] } = {},
): Observation[] {
  const { hours = 24, stepMin = 30, lastAgoMin = 1, source = 'DEVICE', dips = [] } = opts;
  const out: Observation[] = [];
  const units: Record<VitalCode, string> = { HR: 'bpm', SBP: 'mmHg', DBP: 'mmHg', RR: '/min', SPO2: '%', TEMP: '°F', GLU: 'mg/dL', WT: 'kg' };
  const steps = Math.floor((hours * 60) / stepMin);
  for (let s = steps; s >= 0; s--) {
    const agoMin = lastAgoMin + s * stepMin;
    (Object.keys(base) as VitalCode[]).forEach((code, idx) => {
      const b = base[code]!;
      const wiggle = code === 'TEMP' ? ((s + idx) % 5) * 0.1 - 0.2 : code === 'WT' ? 0 : (((s * 7 + idx * 3) % 5) - 2) * (code === 'SPO2' ? 0.5 : 1);
      out.push({ code, value: Math.round((b + wiggle) * 10) / 10, unit: units[code], at: t(agoMin * MIN), source });
    });
  }
  dips.forEach((d) => out.push({ code: d.code, value: d.value, unit: units[d.code], at: t(d.agoMin * MIN), source }));
  return out;
}

/** Daily readings for chronic patients (e.g. home BP once a day). */
function daily(code: VitalCode, values: number[], unit: string, source: Observation['source'] = 'PATIENT', lastDaysAgo = 0): Observation[] {
  return values.map((v, i) => ({ code, value: v, unit, at: t((lastDaysAgo + values.length - 1 - i) * DAY + 3 * HOUR), source }));
}

export const patients: Patient[] = [
  {
    id: 'p-sita',
    name: 'Sita Devi',
    age: 68,
    sex: 'F',
    uhid: 'MD24-100231',
    abha: '91-2231-4410-7782',
    diagnosis: 'Community-acquired pneumonia',
    allergies: ['Sulfonamides'],
    codeStatus: 'FULL',
    location: 'Kankarbagh, Patna',
    episodes: [{ id: 'e-sita-v', pathway: 'VIPD', status: 'ADMITTED', responsibleClinician: 'Dr. Ramesh Kumar', tier: 'T1', day: 3 }],
    observations: vitals(
      { HR: 78, SBP: 128, DBP: 82, RR: 18, SPO2: 96, TEMP: 98.4 },
      { dips: [{ agoMin: 9 * 60, code: 'SPO2', value: 88 }] },
    ),
    meds: [
      { id: 'm1', name: 'Ceftriaxone', dose: '1 g', route: 'IV', frequency: '1-0-1', status: 'GIVEN', dayOf: 'Day 3/5' },
      { id: 'm2', name: 'Paracetamol', dose: '500 mg', route: 'PO', frequency: '1-1-1', status: 'DUE', dayOf: 'Day 3/5' },
      { id: 'm3', name: 'Pantoprazole', dose: '40 mg', route: 'IV', frequency: '1-0-0', status: 'GIVEN', dayOf: 'Day 3/5' },
      { id: 'm4', name: 'Ondansetron', dose: '4 mg', route: 'IV', frequency: 'SOS', status: 'PRN' },
      { id: 'm5', name: 'Normal saline', dose: '100 mL', route: 'IV', frequency: '1-0-1', status: 'GIVEN', dayOf: 'Day 2/5' },
    ],
    labs: [
      { id: 'l1', name: 'CRP', value: '38', unit: 'mg/L', ref: '< 5', flag: 'H', at: t(6 * HOUR), acknowledged: true },
      { id: 'l2', name: 'WBC', value: '11.2', unit: '×10⁹/L', ref: '4.0–11.0', flag: 'H', at: t(6 * HOUR), acknowledged: false },
      { id: 'l3', name: 'Creatinine', value: '0.9', unit: 'mg/dL', ref: '0.6–1.1', flag: 'N', at: t(6 * HOUR), acknowledged: true },
      { id: 'l4', name: 'Chest X-ray (portable)', value: 'Right lower-zone consolidation, improving', unit: '', ref: '—', flag: 'N', at: t(20 * HOUR), acknowledged: true },
    ],
    notes: [
      { id: 'n1', kind: 'SOAP', author: 'Dr. Ramesh Kumar', at: t(14 * HOUR), summary: 'Cough better; afebrile 24 h. Continue IV ceftriaxone. Physio daily.', signed: true },
      { id: 'n2', kind: 'NURSE', author: 'Priya Nair (RN)', at: t(9 * HOUR), summary: '02:15 SpO₂ 88% → nebulisation given; 04:30 SpO₂ 95%.', signed: true },
    ],
    caregiver: [{ name: 'Suresh Yadav', relation: 'Son', phone: '+91-90000-00001', consentScopes: ['VITALS', 'MEDS', 'VIPD'] }],
    devices: [
      { id: 'd1', name: 'Vitals patch', battery: 72, lastSync: t(1 * MIN), online: true },
      { id: 'd2', name: 'BP monitor', battery: 64, lastSync: t(25 * MIN), online: true },
      { id: 'd3', name: 'Home Hub', battery: 100, lastSync: t(0.5 * MIN), online: true },
    ],
  },
  {
    id: 'p-mohan',
    name: 'Mohan Yadav',
    age: 72,
    sex: 'M',
    uhid: 'MD24-100244',
    diagnosis: 'Sepsis (urinary source)',
    allergies: [],
    codeStatus: 'FULL',
    location: 'Boring Road, Patna',
    episodes: [{ id: 'e-mohan-v', pathway: 'VIPD', status: 'ADMITTED', responsibleClinician: 'Dr. Ramesh Kumar', tier: 'T2', day: 1 }],
    observations: vitals(
      { HR: 128, SBP: 80, DBP: 50, RR: 30, SPO2: 84, TEMP: 100.4 },
      { hours: 6, stepMin: 15, dips: [{ agoMin: 0.5, code: 'SPO2', value: 84 }] },
    ),
    meds: [
      { id: 'm1', name: 'Piperacillin-tazobactam', dose: '4.5 g', route: 'IV', frequency: 'Q8H', status: 'GIVEN', dayOf: 'Day 1' },
      { id: 'm2', name: 'Paracetamol', dose: '1 g', route: 'IV', frequency: 'SOS', status: 'PRN' },
    ],
    labs: [
      { id: 'l1', name: 'Lactate (POC)', value: '4.1', unit: 'mmol/L', ref: '< 2.0', flag: 'CRIT', at: t(20 * MIN), acknowledged: false },
      { id: 'l2', name: 'Creatinine', value: '2.1', unit: 'mg/dL', ref: '0.7–1.3', flag: 'H', at: t(3 * HOUR), acknowledged: true },
    ],
    notes: [{ id: 'n1', kind: 'NURSE', author: 'Amit Verma (RN)', at: t(10 * MIN), summary: 'Patient drowsy, breathless. BP falling despite fluids.', signed: true }],
    caregiver: [{ name: 'Rekha Yadav', relation: 'Daughter', phone: '+91-90000-00002', consentScopes: ['VITALS', 'VIPD'] }],
    devices: [
      { id: 'd1', name: 'Multipara monitor', battery: 100, lastSync: t(0.2 * MIN), online: true },
      { id: 'd2', name: 'Home Hub', battery: 100, lastSync: t(0.2 * MIN), online: true },
    ],
  },
  {
    id: 'p-ram',
    name: 'Ram Prasad',
    age: 60,
    sex: 'M',
    uhid: 'MD24-100251',
    diagnosis: 'Post-op (laparoscopic cholecystectomy)',
    allergies: [],
    codeStatus: 'FULL',
    location: 'Rajendra Nagar, Patna',
    episodes: [{ id: 'e-ram-v', pathway: 'VIPD', status: 'ADMITTED', responsibleClinician: 'Dr. Ramesh Kumar', tier: 'T1', day: 1 }],
    observations: vitals({ HR: 82, SBP: 132, DBP: 84, RR: 16, SPO2: 97, TEMP: 98.6 }),
    meds: [{ id: 'm1', name: 'Paracetamol', dose: '1 g', route: 'PO', frequency: '1-1-1', status: 'DUE', dayOf: 'Day 1/3' }],
    labs: [],
    notes: [],
    caregiver: [{ name: 'Geeta Prasad', relation: 'Wife', phone: '+91-90000-00003', consentScopes: ['VITALS', 'MEDS', 'LABS', 'VIPD'] }],
    devices: [{ id: 'd1', name: 'Vitals patch', battery: 88, lastSync: t(2 * MIN), online: true }],
  },
  {
    id: 'p-sunita',
    name: 'Sunita Kumari',
    age: 72,
    sex: 'F',
    uhid: 'MD24-100198',
    diagnosis: 'Chronic respiratory failure on home ventilation',
    allergies: ['Morphine (nausea)'],
    codeStatus: 'LIMITED',
    location: 'Patliputra Colony, Patna',
    episodes: [{ id: 'e-sun-v', pathway: 'VIPD', status: 'ADMITTED', responsibleClinician: 'Dr. Ramesh Kumar', tier: 'T3', day: 4 }],
    observations: vitals({ HR: 92, SBP: 118, DBP: 74, RR: 22, SPO2: 91, TEMP: 98.8 }, { lastAgoMin: 38 }),
    meds: [{ id: 'm1', name: 'Salbutamol', dose: '2.5 mg', route: 'Neb', frequency: 'Q6H', status: 'GIVEN' }],
    labs: [],
    notes: [],
    caregiver: [{ name: 'Vikas Kumar', relation: 'Son', phone: '+91-90000-00004', consentScopes: ['VITALS'] }],
    devices: [
      { id: 'd1', name: 'Home ventilator (telemetry)', battery: 40, lastSync: t(38 * MIN), online: false },
      { id: 'd2', name: 'Home Hub', battery: 22, lastSync: t(38 * MIN), online: false },
    ],
  },
  {
    id: 'p-rajesh',
    name: 'Rajesh Sharma',
    age: 54,
    sex: 'M',
    uhid: 'MD24-090112',
    diagnosis: 'Hypertension · Type 2 diabetes',
    allergies: [],
    codeStatus: 'UNKNOWN',
    location: 'Danapur, Patna',
    episodes: [{ id: 'e-raj-c', pathway: 'CCM', status: 'ACTIVE', responsibleClinician: 'Dr. Ramesh Kumar', programme: 'Hypertension + T2DM', nextReview: now + 2 * DAY }],
    // last home readings were 3 days ago -> demonstrates "Missing / Stale" (never shown as live)
    observations: [
      ...daily('SBP', [142, 146, 139, 151, 148, 152, 149], 'mmHg', 'PATIENT', 3),
      ...daily('DBP', [90, 92, 88, 94, 93, 95, 92], 'mmHg', 'PATIENT', 3),
      ...daily('GLU', [168, 175, 160, 182, 171, 178, 185], 'mg/dL', 'PATIENT', 3),
    ],
    meds: [
      { id: 'm1', name: 'Amlodipine', dose: '5 mg', route: 'PO', frequency: '1-0-0', status: 'ACTIVE' },
      { id: 'm2', name: 'Metformin', dose: '500 mg', route: 'PO', frequency: '1-0-1', status: 'ACTIVE' },
    ],
    labs: [{ id: 'l1', name: 'HbA1c', value: '8.4', unit: '%', ref: 'Target per care plan', flag: 'H', at: t(40 * DAY), acknowledged: true }],
    notes: [{ id: 'n1', kind: 'REVIEW', author: 'Dr. Ramesh Kumar', at: t(28 * DAY), summary: 'BP above individual target. Home BP week requested; review titration.', signed: true }],
    caregiver: [],
    devices: [{ id: 'd1', name: 'BP cuff (validated)', battery: 55, lastSync: t(3 * DAY), online: true }],
  },
  {
    id: 'p-kamala',
    name: 'Kamala Iyer',
    age: 76,
    sex: 'F',
    uhid: 'MD24-080871',
    diagnosis: 'Heart failure (HFrEF)',
    allergies: ['ACE inhibitor (cough)'],
    codeStatus: 'FULL',
    location: 'Bailey Road, Patna',
    episodes: [{ id: 'e-kam-c', pathway: 'CCM', status: 'REASSESSMENT_REQUIRED', responsibleClinician: 'Dr. Ramesh Kumar', programme: 'Heart failure', nextReview: now - 1 * DAY }],
    observations: [
      ...daily('WT', [61.2, 61.0, 61.3, 61.4, 61.9, 62.6, 63.1], 'kg'),
      ...daily('SBP', [112, 110, 114, 108, 106, 104, 102], 'mmHg'),
      ...daily('HR', [74, 76, 75, 79, 84, 88, 92], 'bpm'),
    ],
    meds: [
      { id: 'm1', name: 'Sacubitril/valsartan', dose: '49/51 mg', route: 'PO', frequency: '1-0-1', status: 'ACTIVE' },
      { id: 'm2', name: 'Bisoprolol', dose: '2.5 mg', route: 'PO', frequency: '1-0-0', status: 'ACTIVE' },
      { id: 'm3', name: 'Dapagliflozin', dose: '10 mg', route: 'PO', frequency: '1-0-0', status: 'ACTIVE' },
      { id: 'm4', name: 'Furosemide', dose: '40 mg', route: 'PO', frequency: '1-0-0', status: 'ACTIVE' },
    ],
    labs: [{ id: 'l1', name: 'Potassium', value: '4.9', unit: 'mmol/L', ref: '3.5–5.1', flag: 'N', at: t(9 * DAY), acknowledged: true }],
    notes: [],
    caregiver: [{ name: 'Lakshmi Iyer', relation: 'Daughter', phone: '+91-90000-00005', consentScopes: ['VITALS', 'MEDS', 'CCM'] }],
    devices: [{ id: 'd1', name: 'Weighing scale', battery: 80, lastSync: t(21 * HOUR), online: true }],
  },
  {
    id: 'p-anil',
    name: 'Anil Verma',
    age: 34,
    sex: 'M',
    uhid: 'MD24-120004',
    diagnosis: 'Fever and productive cough for 3 days',
    allergies: [],
    codeStatus: 'UNKNOWN',
    location: 'Kankarbagh, Patna',
    episodes: [{ id: 'e-anil-a', pathway: 'ACU', status: 'TRIAGED', responsibleClinician: 'Unassigned', urgency: 'URGENT' }],
    observations: [
      { code: 'TEMP', value: 101.2, unit: '°F', at: t(25 * MIN), source: 'PATIENT' },
      { code: 'HR', value: 104, unit: 'bpm', at: t(25 * MIN), source: 'PATIENT' },
      { code: 'SPO2', value: 95, unit: '%', at: t(25 * MIN), source: 'PATIENT' },
    ],
    meds: [],
    labs: [],
    notes: [],
    caregiver: [],
    devices: [],
  },
  {
    id: 'p-fatima',
    name: 'Fatima Shaikh',
    age: 45,
    sex: 'F',
    uhid: 'MD24-120011',
    diagnosis: 'Acute abdominal pain since morning',
    allergies: ['Diclofenac'],
    codeStatus: 'UNKNOWN',
    location: 'Phulwari Sharif, Patna',
    episodes: [{ id: 'e-fat-a', pathway: 'ACU', status: 'INTAKE', responsibleClinician: 'Unassigned' }],
    observations: [],
    meds: [],
    labs: [],
    notes: [],
    caregiver: [],
    devices: [],
  },
  {
    id: 'p-gopal',
    name: 'Gopal Rao',
    age: 81,
    sex: 'M',
    uhid: 'MD24-070332',
    diagnosis: 'Frailty · lives alone · fall risk',
    allergies: [],
    codeStatus: 'FULL',
    location: 'Ashok Rajpath, Patna',
    episodes: [{ id: 'e-gop-r', pathway: 'RPM', status: 'ACTIVE', responsibleClinician: 'Dr. Ramesh Kumar', serviceLevel: 'RPM-L2' }],
    observations: [...daily('SBP', [134, 138, 131, 136, 140], 'mmHg', 'DEVICE'), ...daily('HR', [70, 72, 69, 74, 71], 'bpm', 'DEVICE')],
    meds: [{ id: 'm1', name: 'Telmisartan', dose: '40 mg', route: 'PO', frequency: '1-0-0', status: 'ACTIVE' }],
    labs: [],
    notes: [],
    caregiver: [{ name: 'Anita Rao', relation: 'Daughter (Pune)', phone: '+91-90000-00006', consentScopes: ['VITALS'] }],
    devices: [
      { id: 'd1', name: 'Fall-detection pendant', battery: 35, lastSync: t(4 * MIN), online: true },
      { id: 'd2', name: 'BP monitor', battery: 70, lastSync: t(20 * HOUR), online: true },
    ],
  },
  {
    id: 'p-meena',
    name: 'Meena Joshi',
    age: 63,
    sex: 'F',
    uhid: 'MD24-100187',
    diagnosis: 'Post-discharge (pneumonia) – 14-day monitoring',
    allergies: [],
    codeStatus: 'FULL',
    location: 'Kidwaipuri, Patna',
    episodes: [{ id: 'e-mee-r', pathway: 'RPM', status: 'ACTIVE', responsibleClinician: 'Dr. Ramesh Kumar', serviceLevel: 'RPM-L2' }],
    observations: [...daily('SPO2', [95, 96, 96, 97, 96], '%', 'DEVICE'), ...daily('TEMP', [98.6, 98.4, 98.5, 98.4, 98.6], '°F', 'DEVICE')],
    meds: [],
    labs: [],
    notes: [],
    caregiver: [],
    devices: [{ id: 'd1', name: 'Pulse oximeter', battery: 90, lastSync: t(3 * HOUR), online: true }],
  },
];

export const events: ClinicalEvent[] = [
  {
    id: 'ev1', patientId: 'p-mohan', pathway: 'VIPD', type: 'CRITICAL_OBSERVATION', cls: 'E',
    title: 'SpO₂ 84% · BP 80/50', detail: 'Sustained below critical threshold for > 60 s. NEWS2 ≥ 7.',
    ruleId: 'VIPD-SPO2-CRIT', ruleVersion: 'v1-draft', at: t(1 * MIN), status: 'OPEN',
  },
  {
    id: 'ev2', patientId: 'p-mohan', pathway: 'VIPD', type: 'CRITICAL_RESULT', cls: 'U',
    title: 'Lactate 4.1 mmol/L (critical)', detail: 'POC result – not yet acknowledged.',
    ruleId: 'LAB-CRIT', ruleVersion: 'v1-draft', at: t(20 * MIN), ackBy: now + 10 * MIN, status: 'OPEN',
  },
  {
    id: 'ev3', patientId: 'p-sunita', pathway: 'VIPD', type: 'CONNECTIVITY_LOSS', cls: 'T',
    title: 'Home Hub offline 38 min', detail: 'Ventilator telemetry not received. Hub on battery 22%.',
    ruleId: 'DEV-HUB-OFFLINE', ruleVersion: 'v1-draft', at: t(23 * MIN), ackBy: now + 2 * MIN, status: 'OPEN',
  },
  {
    id: 'ev4', patientId: 'p-kamala', pathway: 'CCM', type: 'CLINICAL_DETERIORATION', cls: 'U',
    title: 'Weight +1.9 kg in 3 days', detail: 'Above clinician-set HF threshold. HR trending up.',
    ruleId: 'HF-WT-01', ruleVersion: 'v1-draft', at: t(5 * HOUR), ackBy: now + 55 * MIN, status: 'OPEN',
  },
  {
    id: 'ev5', patientId: 'p-rajesh', pathway: 'CCM', type: 'DATA_MISSING', cls: 'A',
    title: 'No home BP for 3 days', detail: 'Measurement week incomplete (7 of 10 expected).',
    ruleId: 'GEN-MISS-A', ruleVersion: 'v1-draft', at: t(10 * HOUR), ackBy: now + 6 * HOUR, status: 'OPEN',
  },
  {
    id: 'ev6', patientId: 'p-gopal', pathway: 'RPM', type: 'NOTIFICATION_DELIVERY_FAILURE', cls: 'N',
    title: 'Family notification not delivered', detail: 'Push to Anita Rao failed (device unreachable). Re-routed to SMS.',
    ruleId: 'SYS-DELIVERY', ruleVersion: 'v1', at: t(12 * MIN), ackBy: now + 18 * MIN, status: 'OPEN',
  },
  {
    id: 'ev7', patientId: 'p-sita', pathway: 'VIPD', type: 'CRITICAL_RESULT', cls: 'R',
    title: 'WBC 11.2 – result to acknowledge', detail: 'Mildly raised, trending down.',
    ruleId: 'LAB-ACK', ruleVersion: 'v1-draft', at: t(6 * HOUR), ackBy: now + 2 * HOUR, status: 'OPEN',
  },
];

export const messages: ChatMessage[] = [
  { id: 'c1', patientId: 'p-sita', thread: 'TEAM', from: 'Priya Nair (RN)', text: 'Vitals are stable now. SpO₂ 96% on room air.', at: t(40 * MIN) },
  { id: 'c2', patientId: 'p-sita', thread: 'TEAM', from: 'Amit Verma (Physio)', text: 'Chest physiotherapy completed. Good effort.', at: t(30 * MIN) },
  { id: 'c3', patientId: 'p-sita', thread: 'FAMILY', from: 'Suresh Yadav (Son)', text: 'Thank you doctor, she ate well today.', at: t(2 * HOUR) },
];

/** Domain model for the MYDR24 Doctor app (aligned to FHIR R4 concepts in the master spec §14). */

export type Pathway = 'ACU' | 'CCM' | 'VIPD' | 'RPM';
export type Tier = 'T1' | 'T2' | 'T3';
export type CodeStatus = 'FULL' | 'DNR' | 'LIMITED' | 'UNKNOWN';
export type Sex = 'M' | 'F';

export type VitalCode = 'HR' | 'SBP' | 'DBP' | 'RR' | 'SPO2' | 'TEMP' | 'GLU' | 'WT';

export interface Observation {
  code: VitalCode;
  value: number;
  unit: string;
  /** epoch ms when measured */
  at: number;
  source: 'DEVICE' | 'NURSE' | 'PATIENT' | 'CAREGIVER' | 'LAB';
  deviceId?: string;
}

export interface Episode {
  id: string;
  pathway: Pathway;
  status: string;
  responsibleClinician: string;
  /** VIPD only */
  tier?: Tier;
  day?: number;
  /** CCM only */
  programme?: string;
  /** RPM only */
  serviceLevel?: 'RPM-L1' | 'RPM-L2' | 'RPM-L3';
  /** Acute only */
  urgency?: 'EMERGENCY' | 'URGENT' | 'SOON' | 'ROUTINE';
  nextReview?: number;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  route: string;
  frequency: string;
  status: 'GIVEN' | 'DUE' | 'MISSED' | 'PRN' | 'HELD' | 'ACTIVE';
  dayOf?: string;
  highAlert?: boolean;
}

export interface LabResult {
  id: string;
  name: string;
  value: string;
  unit: string;
  ref: string;
  flag: 'N' | 'H' | 'L' | 'CRIT';
  at: number;
  acknowledged: boolean;
}

export interface Note {
  id: string;
  kind: 'SOAP' | 'ACUTE' | 'REVIEW' | 'HANDOVER' | 'NURSE';
  author: string;
  at: number;
  summary: string;
  signed: boolean;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  sex: Sex;
  uhid: string;
  abha?: string;
  diagnosis: string;
  allergies: string[];
  codeStatus: CodeStatus;
  episodes: Episode[];
  observations: Observation[];
  meds: Medication[];
  labs: LabResult[];
  notes: Note[];
  caregiver: { name: string; relation: string; phone: string; consentScopes: ConsentScope[] }[];
  devices: { id: string; name: string; battery: number; lastSync: number; online: boolean }[];
  location: string;
}

export type ConsentScope = 'VITALS' | 'MEDS' | 'LABS' | 'NOTES' | 'VIPD' | 'CCM';

export type EventType =
  | 'EMERGENCY_REQUEST'
  | 'CLINICAL_DETERIORATION'
  | 'CRITICAL_OBSERVATION'
  | 'CRITICAL_RESULT'
  | 'ADVERSE_REACTION'
  | 'REASSESSMENT_DUE'
  | 'DATA_MISSING'
  | 'DEVICE_FAILURE'
  | 'CONNECTIVITY_LOSS'
  | 'NOTIFICATION_DELIVERY_FAILURE'
  | 'TASK_OVERDUE';

/** E emergency · U urgent · R routine · A adherence/data · T technical · N notification-delivery */
export type EventClass = 'E' | 'U' | 'R' | 'A' | 'T' | 'N';

export interface ClinicalEvent {
  id: string;
  patientId: string;
  pathway: Pathway;
  type: EventType;
  cls: EventClass;
  title: string;
  detail: string;
  ruleId: string;
  ruleVersion: string;
  at: number;
  /** epoch ms acknowledgement deadline (from service policy) – undefined for E (no waiting) */
  ackBy?: number;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  ackedBy?: string;
  resolution?: string;
  snoozedUntil?: number;
}

export interface Transition {
  id: string;
  patientId: string;
  from: Pathway | 'NONE';
  to: Pathway | 'HOSPITAL' | 'FOLLOW_UP' | 'CLOSED';
  trigger: string;
  rationale: string;
  authorisedBy: string;
  at: number;
  outstandingTasks: string[];
  handover: 'NOT_REQUIRED' | 'PENDING' | 'SENT' | 'ACCEPTED';
}

export interface ChatMessage {
  id: string;
  patientId: string;
  thread: 'TEAM' | 'FAMILY' | 'FIELD';
  from: string;
  text: string;
  at: number;
}

export interface Doctor {
  name: string;
  role: 'DOCTOR' | 'CONSULTANT' | 'ON_CALL';
  speciality: string;
  regNo: string;
}

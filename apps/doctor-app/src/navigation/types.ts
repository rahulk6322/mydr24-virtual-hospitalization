import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Pathway } from '../types/models';

/** Every route in the Doctor app. IDs in comments map to the master-spec screen inventory. */
export type RootStackParamList = {
  Login: undefined; // D-01
  Main: NavigatorScreenParams<TabParamList> | undefined; // tabs
  PatientChart: { patientId: string; tab?: 'overview' | 'vitals' | 'meds' | 'results' | 'notes' }; // D-14 + UD-D-02
  VitalsTrends: { patientId: string }; // D-15 / CC-D-10
  IcuMonitor: { patientId: string }; // D-12
  DeviceStatus: { patientId: string }; // D-10
  Results: { patientId: string }; // D-13
  // Virtual IPD admission
  Eligibility: { patientId?: string }; // D-04
  Consent: { patientId: string }; // D-05
  Baseline: { patientId: string }; // D-06
  GoalsOfCare: { patientId: string; next?: 'CareTeam' }; // D-07
  CareTeam: { patientId: string }; // D-08
  CarePlan: { patientId: string }; // D-09
  // Orders
  MedRec: { patientId: string }; // D-16 / AC-D-05
  Orders: { patientId: string }; // D-18 / D-19
  Prescription: { patientId: string }; // D-17
  // Rounds
  OvernightReview: { patientId: string }; // D-20
  TeleRound: { patientId: string }; // D-21
  SoapNote: { patientId: string; kind?: 'SOAP' | 'ACUTE' | 'REVIEW' }; // D-22 / AC-D-07 / CC-D-15
  // Alerts & escalation
  AlertDetail: { eventId: string }; // D-24
  Emergency: { patientId: string }; // D-25 / EM
  Escalation: { patientId: string; eventId?: string }; // D-26
  Handover: { patientId: string }; // D-27
  Transition: { patientId: string; from?: Pathway }; // UD-D-03
  // Team
  ShiftHandover: undefined; // D-28
  Chat: { patientId: string }; // D-29
  FamilyUpdate: { patientId: string }; // D-30
  // Discharge
  Discharge: { patientId: string }; // D-32
  // Acute
  AcuteTriage: { patientId: string }; // AC-D-02 / AC-D-03
  AcuteWorkspace: { patientId: string }; // AC-D-04 / 06 / 08 / 09
  AcuteClosure: { patientId: string }; // AC-D-11
  // Chronic
  ChronicReassess: { patientId: string }; // CC-D-12
  // More
  ScreenCatalogue: undefined;
  AuditLog: undefined;
};

export type TabParamList = {
  Home: undefined; // UD-D-01
  Patients: undefined; // D-03
  Acute: undefined; // AC-D-01
  Alerts: undefined; // UD-D-04 / D-23
  More: undefined;
};

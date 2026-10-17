/**
 * In-memory app store (React context + reducer).
 * Replace the reducer side-effects with API calls (master spec §14.2) when the backend exists.
 * Every clinical action appends an audit entry, mirroring FHIR AuditEvent.
 */
import React, { createContext, useContext, useMemo, useReducer } from 'react';
import { currentDoctor, events as seedEvents, messages as seedMessages, patients as seedPatients } from '../data/mock';
import type { ChatMessage, ClinicalEvent, Doctor, Episode, Medication, Note, Observation, Patient, Transition } from '../types/models';

export interface AuditEntry { at: number; actor: string; action: string; patientId?: string; detail?: string }

interface State {
  doctor: Doctor;
  signedIn: boolean;
  patients: Patient[];
  events: ClinicalEvent[];
  messages: ChatMessage[];
  transitions: Transition[];
  audit: AuditEntry[];
}

type Action =
  | { type: 'SIGN_IN'; role: Doctor['role'] }
  | { type: 'SIGN_OUT' }
  | { type: 'ACK_EVENT'; id: string }
  | { type: 'SNOOZE_EVENT'; id: string; minutes: number; reason: string }
  | { type: 'RESOLVE_EVENT'; id: string; resolution: string }
  | { type: 'RAISE_EVENT'; event: ClinicalEvent }
  | { type: 'ADD_NOTE'; patientId: string; note: Note }
  | { type: 'ADD_MEDS'; patientId: string; meds: Medication[] }
  | { type: 'SET_MED_STATUS'; patientId: string; medId: string; status: Medication['status'] }
  | { type: 'ACK_LAB'; patientId: string; labId: string }
  | { type: 'ADD_OBS'; patientId: string; obs: Observation[] }
  | { type: 'UPSERT_EPISODE'; patientId: string; episode: Episode }
  | { type: 'REMOVE_EPISODE'; patientId: string; episodeId: string }
  | { type: 'SET_CODE_STATUS'; patientId: string; codeStatus: Patient['codeStatus'] }
  | { type: 'RECORD_TRANSITION'; transition: Transition }
  | { type: 'SEND_MESSAGE'; message: ChatMessage }
  | { type: 'AUDIT'; entry: Omit<AuditEntry, 'at' | 'actor'> };

const initial: State = {
  doctor: currentDoctor,
  signedIn: false,
  patients: seedPatients,
  events: seedEvents,
  messages: seedMessages,
  transitions: [],
  audit: [],
};

function mapPatient(s: State, id: string, fn: (p: Patient) => Patient): Patient[] {
  return s.patients.map((p) => (p.id === id ? fn(p) : p));
}

function reducer(s: State, a: Action): State {
  const log = (action: string, patientId?: string, detail?: string): AuditEntry[] => [
    { at: Date.now(), actor: s.doctor.name, action, patientId, detail },
    ...s.audit,
  ];
  switch (a.type) {
    case 'SIGN_IN':
      return { ...s, signedIn: true, doctor: { ...s.doctor, role: a.role }, audit: log('SIGN_IN', undefined, a.role) };
    case 'SIGN_OUT':
      return { ...s, signedIn: false, audit: log('SIGN_OUT') };
    case 'ACK_EVENT':
      return {
        ...s,
        events: s.events.map((e) => (e.id === a.id ? { ...e, status: 'ACKNOWLEDGED', ackedBy: s.doctor.name } : e)),
        audit: log('ACK_EVENT', s.events.find((e) => e.id === a.id)?.patientId, a.id),
      };
    case 'SNOOZE_EVENT': {
      const ev = s.events.find((e) => e.id === a.id);
      // Safety rule: emergency/urgent events can never be snoozed.
      if (!ev || ev.cls === 'E' || ev.cls === 'U') return s;
      return {
        ...s,
        events: s.events.map((e) => (e.id === a.id ? { ...e, snoozedUntil: Date.now() + a.minutes * 60_000 } : e)),
        audit: log('SNOOZE_EVENT', ev.patientId, `${a.minutes} min · ${a.reason}`),
      };
    }
    case 'RESOLVE_EVENT':
      return {
        ...s,
        events: s.events.map((e) => (e.id === a.id ? { ...e, status: 'RESOLVED', resolution: a.resolution, ackedBy: e.ackedBy ?? s.doctor.name } : e)),
        audit: log('RESOLVE_EVENT', s.events.find((e) => e.id === a.id)?.patientId, a.resolution),
      };
    case 'RAISE_EVENT':
      return { ...s, events: [a.event, ...s.events], audit: log('RAISE_EVENT', a.event.patientId, a.event.title) };
    case 'ADD_NOTE':
      return { ...s, patients: mapPatient(s, a.patientId, (p) => ({ ...p, notes: [a.note, ...p.notes] })), audit: log('SIGN_NOTE', a.patientId, a.note.kind) };
    case 'ADD_MEDS':
      return { ...s, patients: mapPatient(s, a.patientId, (p) => ({ ...p, meds: [...p.meds, ...a.meds] })), audit: log('SIGN_ORDERS', a.patientId, a.meds.map((m) => m.name).join(', ')) };
    case 'SET_MED_STATUS':
      return {
        ...s,
        patients: mapPatient(s, a.patientId, (p) => ({ ...p, meds: p.meds.map((m) => (m.id === a.medId ? { ...m, status: a.status } : m)) })),
        audit: log('MED_STATUS', a.patientId, `${a.medId} → ${a.status}`),
      };
    case 'ACK_LAB':
      return {
        ...s,
        patients: mapPatient(s, a.patientId, (p) => ({ ...p, labs: p.labs.map((l) => (l.id === a.labId ? { ...l, acknowledged: true } : l)) })),
        audit: log('ACK_RESULT', a.patientId, a.labId),
      };
    case 'ADD_OBS':
      return { ...s, patients: mapPatient(s, a.patientId, (p) => ({ ...p, observations: [...p.observations, ...a.obs] })), audit: log('RECORD_OBS', a.patientId, a.obs.map((o) => `${o.code}=${o.value}`).join(' ')) };
    case 'UPSERT_EPISODE':
      return {
        ...s,
        patients: mapPatient(s, a.patientId, (p) => {
          const exists = p.episodes.some((e) => e.id === a.episode.id);
          return { ...p, episodes: exists ? p.episodes.map((e) => (e.id === a.episode.id ? a.episode : e)) : [...p.episodes, a.episode] };
        }),
        audit: log('EPISODE', a.patientId, `${a.episode.pathway}:${a.episode.status}`),
      };
    case 'REMOVE_EPISODE':
      return { ...s, patients: mapPatient(s, a.patientId, (p) => ({ ...p, episodes: p.episodes.filter((e) => e.id !== a.episodeId) })), audit: log('EPISODE_CLOSED', a.patientId, a.episodeId) };
    case 'SET_CODE_STATUS':
      return { ...s, patients: mapPatient(s, a.patientId, (p) => ({ ...p, codeStatus: a.codeStatus })), audit: log('CODE_STATUS', a.patientId, a.codeStatus) };
    case 'RECORD_TRANSITION':
      return { ...s, transitions: [a.transition, ...s.transitions], audit: log('TRANSITION', a.transition.patientId, `${a.transition.from} → ${a.transition.to}`) };
    case 'SEND_MESSAGE':
      return { ...s, messages: [...s.messages, a.message], audit: log('MESSAGE', a.message.patientId, a.message.thread) };
    case 'AUDIT':
      return { ...s, audit: log(a.entry.action, a.entry.patientId, a.entry.detail) };
    default:
      return s;
  }
}

interface Store extends State {
  dispatch: React.Dispatch<Action>;
  patient: (id: string) => Patient | undefined;
  openEvents: ClinicalEvent[];
}

const Ctx = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const value = useMemo<Store>(() => {
    const now = Date.now();
    return {
      ...state,
      dispatch,
      patient: (id) => state.patients.find((p) => p.id === id),
      openEvents: state.events
        .filter((e) => e.status !== 'RESOLVED' && !(e.snoozedUntil && e.snoozedUntil > now))
        .sort((a, b) => classRank[a.cls] - classRank[b.cls] || b.at - a.at),
    };
  }, [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const classRank: Record<ClinicalEvent['cls'], number> = { E: 0, U: 1, N: 2, T: 3, R: 4, A: 5 };

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside AppStoreProvider');
  return s;
}

export const uid = (p = 'id') => `${p}-${Math.random().toString(36).slice(2, 9)}`;

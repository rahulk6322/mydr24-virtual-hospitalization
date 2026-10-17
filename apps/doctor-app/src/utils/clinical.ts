import type { Observation, Pathway, Tier, VitalCode } from '../types/models';

/* ------------------------------------------------------------------ NEWS2
 * Royal College of Physicians NEWS2 (2017) scoring tables.
 * Clinical response bands are shown for decision support only; the MYDR24 Clinical
 * Governance Committee must approve the response policy that uses them.
 */
export type Consciousness = 'A' | 'NEW_CONFUSION' | 'V' | 'P' | 'U';

export interface News2Input {
  rr?: number;
  spo2?: number;
  /** use SpO2 Scale 2 (hypercapnic respiratory failure, target 88–92%) – clinician-set */
  spo2Scale2?: boolean;
  onOxygen?: boolean;
  sbp?: number;
  hr?: number;
  consciousness?: Consciousness;
  /** °C */
  tempC?: number;
}

export interface News2Result {
  total: number;
  complete: boolean;
  missing: string[];
  anySingle3: boolean;
  band: 'LOW' | 'LOW_MEDIUM' | 'MEDIUM' | 'HIGH';
  parts: Record<string, number>;
}

const scoreRR = (v: number) => (v <= 8 ? 3 : v <= 11 ? 1 : v <= 20 ? 0 : v <= 24 ? 2 : 3);
const scoreSpO2Scale1 = (v: number) => (v <= 91 ? 3 : v <= 93 ? 2 : v <= 95 ? 1 : 0);
const scoreSpO2Scale2 = (v: number, onO2: boolean) => {
  if (v <= 83) return 3;
  if (v <= 85) return 2;
  if (v <= 87) return 1;
  if (v <= 92 || !onO2) return 0;
  if (v <= 94) return 1;
  if (v <= 96) return 2;
  return 3;
};
const scoreSBP = (v: number) => (v <= 90 ? 3 : v <= 100 ? 2 : v <= 110 ? 1 : v <= 219 ? 0 : 3);
const scoreHR = (v: number) => (v <= 40 ? 3 : v <= 50 ? 1 : v <= 90 ? 0 : v <= 110 ? 1 : v <= 130 ? 2 : 3);
const scoreTemp = (v: number) => (v <= 35.0 ? 3 : v <= 36.0 ? 1 : v <= 38.0 ? 0 : v <= 39.0 ? 1 : 2);

export function news2(i: News2Input): News2Result {
  const parts: Record<string, number> = {};
  const missing: string[] = [];
  if (i.rr !== undefined) parts.RR = scoreRR(i.rr); else missing.push('RR');
  if (i.spo2 !== undefined) parts.SpO2 = i.spo2Scale2 ? scoreSpO2Scale2(i.spo2, !!i.onOxygen) : scoreSpO2Scale1(i.spo2);
  else missing.push('SpO₂');
  parts.O2 = i.onOxygen ? 2 : 0;
  if (i.sbp !== undefined) parts.SBP = scoreSBP(i.sbp); else missing.push('SBP');
  if (i.hr !== undefined) parts.HR = scoreHR(i.hr); else missing.push('HR');
  if (i.consciousness !== undefined) parts.ACVPU = i.consciousness === 'A' ? 0 : 3; else missing.push('ACVPU');
  if (i.tempC !== undefined) parts.Temp = scoreTemp(i.tempC); else missing.push('Temp');

  const total = Object.values(parts).reduce((a, b) => a + b, 0);
  const anySingle3 = Object.entries(parts).some(([k, v]) => k !== 'O2' && v === 3);
  const band: News2Result['band'] =
    total >= 7 ? 'HIGH' : total >= 5 ? 'MEDIUM' : anySingle3 ? 'LOW_MEDIUM' : 'LOW';
  return { total, complete: missing.length === 0, missing, anySingle3, band, parts };
}

export const news2BandLabel: Record<News2Result['band'], string> = {
  LOW: 'Low',
  LOW_MEDIUM: 'Low–medium (single parameter 3)',
  MEDIUM: 'Medium – urgent review',
  HIGH: 'High – emergency response',
};

export const fToC = (f: number) => Math.round(((f - 32) * 5) / 9 * 10) / 10;

/* ------------------------------------------------------------------ Freshness
 * Never show old data as live, never treat missing data as normal (master spec §7.2 Annex D).
 * Windows are configuration placeholders until the CGC approves per-programme values.
 */
export type Freshness = 'LIVE' | 'CURRENT' | 'STALE' | 'MISSING';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

export function freshnessWindow(pathway: Pathway, tier?: Tier): { live: number; valid: number } {
  switch (pathway) {
    case 'VIPD':
      return tier === 'T1' ? { live: 5 * MIN, valid: 15 * MIN } : { live: 1 * MIN, valid: 5 * MIN };
    case 'ACU':
      return { live: 5 * MIN, valid: 6 * HOUR };
    case 'RPM':
      return { live: 5 * MIN, valid: 1 * DAY };
    case 'CCM':
    default:
      return { live: 5 * MIN, valid: 3 * DAY };
  }
}

export function freshness(obs: Observation | undefined, pathway: Pathway, tier?: Tier, now = Date.now()): Freshness {
  if (!obs) return 'MISSING';
  const age = now - obs.at;
  const w = freshnessWindow(pathway, tier);
  if (age <= w.live && obs.source === 'DEVICE') return 'LIVE';
  if (age <= w.valid) return 'CURRENT';
  return 'STALE';
}

export function latest(obs: Observation[], code: VitalCode): Observation | undefined {
  return obs.filter((o) => o.code === code).sort((a, b) => b.at - a.at)[0];
}

export function series(obs: Observation[], code: VitalCode, sinceMs: number, now = Date.now()) {
  return obs.filter((o) => o.code === code && o.at >= now - sinceMs).sort((a, b) => a.at - b.at);
}

/* ------------------------------------------------------------------ Time helpers */
export function ago(at: number, now = Date.now()): string {
  const d = Math.max(0, now - at);
  if (d < MIN) return 'just now';
  if (d < HOUR) return `${Math.floor(d / MIN)} min ago`;
  if (d < DAY) return `${Math.floor(d / HOUR)} h ago`;
  return `${Math.floor(d / DAY)} d ago`;
}

export function clock(at: number): string {
  const d = new Date(at);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function dateLabel(at: number): string {
  const d = new Date(at);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function countdown(deadline: number, now = Date.now()): string {
  const s = Math.round((deadline - now) / 1000);
  if (s <= 0) return 'OVERDUE';
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export { MIN, HOUR, DAY };

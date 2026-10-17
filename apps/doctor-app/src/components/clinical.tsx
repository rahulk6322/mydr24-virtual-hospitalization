/** Clinical components: patient header, pathway chips, vitals, freshness, events, trends. */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, shadow, spacing, type } from '../theme/tokens';
import type { ClinicalEvent, CodeStatus, Episode, EventClass, Observation, Pathway, Patient, VitalCode } from '../types/models';
import { ago, countdown, freshness, type Freshness, fToC, latest, news2, type News2Result } from '../utils/clinical';
import type { RootStackParamList } from '../navigation/types';
import { Pill } from './ui';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/* ---------------------------------------------------------------- Pathway & status chips */
export const pathwayMeta: Record<Pathway, { label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  ACU: { label: 'Acute', icon: 'flash-outline' },
  CCM: { label: 'Chronic', icon: 'repeat-outline' },
  VIPD: { label: 'Virtual IPD', icon: 'bed-outline' },
  RPM: { label: 'RPM', icon: 'pulse-outline' },
};

/** Neutral outline + icon so pathway never competes with severity colours (spec §17.4). */
export function PathwayChip({ pathway, extra }: { pathway: Pathway; extra?: string }) {
  const m = pathwayMeta[pathway];
  return (
    <View style={styles.pathChip} accessibilityLabel={`Pathway ${m.label}${extra ? ' ' + extra : ''}`}>
      <Ionicons name={m.icon} size={11} color={colors.primaryDark} style={{ marginRight: 3 }} />
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primaryDark }}>{m.label}{extra ? ` · ${extra}` : ''}</Text>
    </View>
  );
}

export function episodeExtra(e: Episode): string | undefined {
  if (e.pathway === 'VIPD') return `${e.tier} · Day ${e.day}`;
  if (e.pathway === 'CCM') return e.programme;
  if (e.pathway === 'RPM') return e.serviceLevel;
  if (e.pathway === 'ACU') return e.urgency ? e.urgency.toLowerCase() : 'intake';
  return undefined;
}

export function CodeStatusChip({ status }: { status: CodeStatus }) {
  const map: Record<CodeStatus, [string, string]> = {
    FULL: ['Full code', colors.stable],
    DNR: ['DNR', colors.critical],
    LIMITED: ['Limited', colors.urgent],
    UNKNOWN: ['Code status ?', colors.textMuted],
  };
  const [l, c] = map[status];
  return <Pill label={l} color={c} icon="document-text-outline" />;
}

export function AllergyChip({ allergies }: { allergies: string[] }) {
  return allergies.length ? (
    <Pill label={`Allergy: ${allergies.join(', ')}`} color={colors.critical} icon="warning-outline" />
  ) : (
    <Pill label="NKDA" color={colors.textMuted} />
  );
}

export const clsMeta: Record<EventClass, { label: string; color: string; soft: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  E: { label: 'Emergency', color: colors.critical, soft: colors.criticalSoft, icon: 'alert-circle' },
  U: { label: 'Urgent', color: colors.urgent, soft: colors.urgentSoft, icon: 'warning' },
  R: { label: 'Routine', color: colors.advisory, soft: colors.advisorySoft, icon: 'time' },
  A: { label: 'Adherence/Data', color: colors.textMuted, soft: '#F2F4F7', icon: 'calendar-clear' },
  T: { label: 'Technical', color: colors.technical, soft: colors.technicalSoft, icon: 'hardware-chip' },
  N: { label: 'Delivery failure', color: colors.delivery, soft: colors.deliverySoft, icon: 'notifications-off' },
};

export function EventClassChip({ cls }: { cls: EventClass }) {
  const m = clsMeta[cls];
  return <Pill label={m.label} color={m.color} soft={m.soft} icon={m.icon} />;
}

/* ---------------------------------------------------------------- Patient header (UD-D-02) */
export function PatientHeader({ p, compact }: { p: Patient; compact?: boolean }) {
  const nav = useNavigation<Nav>();
  return (
    <View style={[styles.header]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar name={p.name} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={type.h2} numberOfLines={1}>{p.name}</Text>
          <Text style={type.small}>{p.age}{p.sex} · {p.uhid}{p.abha ? ' · ABHA ✓' : ''}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Emergency"
          onPress={() => nav.navigate('Emergency', { patientId: p.id })}
          style={styles.emBtn}
        >
          <Ionicons name="alert-circle" size={18} color={colors.white} />
          <Text style={{ color: colors.white, fontWeight: '800', fontSize: 12, marginLeft: 4 }}>EMERGENCY</Text>
        </Pressable>
      </View>
      {!compact ? <Text style={[type.body, { marginTop: spacing.sm, fontWeight: '600' }]}>{p.diagnosis}</Text> : null}
      <View style={styles.chips}>
        {p.episodes.map((e) => <PathwayChip key={e.id} pathway={e.pathway} extra={episodeExtra(e)} />)}
        <CodeStatusChip status={p.codeStatus} />
        <AllergyChip allergies={p.allergies} />
      </View>
      {!compact && p.episodes[0] ? (
        <Text style={[type.tiny, { marginTop: 6 }]}>Responsible: {p.episodes.map((e) => `${pathwayMeta[e.pathway].label} – ${e.responsibleClinician}`).join(' · ')}</Text>
      ) : null}
    </View>
  );
}

export function Avatar({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((s) => s[0]).slice(0, 2).join('');
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.primary, fontWeight: '800', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

/* ---------------------------------------------------------------- Freshness & vitals */
export const freshMeta: Record<Freshness, { label: string; color: string }> = {
  LIVE: { label: 'Live', color: colors.stable },
  CURRENT: { label: 'Current', color: colors.technical },
  STALE: { label: 'Stale', color: colors.stale },
  MISSING: { label: 'Missing', color: colors.critical },
};

export function FreshnessDot({ f, at }: { f: Freshness; at?: number }) {
  const m = freshMeta[f];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }} accessibilityLabel={`Data ${m.label}`}>
      <View style={[styles.dot, f === 'MISSING' ? { borderWidth: 1.5, borderColor: m.color } : { backgroundColor: m.color }]} />
      <Text style={[type.tiny, { color: m.color }]}>{m.label}{at && f !== 'MISSING' ? ` · ${ago(at)}` : ''}</Text>
    </View>
  );
}

export const vitalLabel: Record<VitalCode, string> = { HR: 'HR', SBP: 'BP', DBP: 'DBP', RR: 'RR', SPO2: 'SpO₂', TEMP: 'Temp', GLU: 'Glucose', WT: 'Weight' };

/** Simple display thresholds (draft – CGC to approve). Return colour for value. */
export function vitalTone(code: VitalCode, v: number): string {
  switch (code) {
    case 'SPO2': return v < 90 ? colors.critical : v < 94 ? colors.urgent : colors.text;
    case 'HR': return v > 130 || v < 40 ? colors.critical : v > 110 || v < 50 ? colors.urgent : colors.text;
    case 'SBP': return v <= 90 || v >= 220 ? colors.critical : v <= 100 || v >= 180 ? colors.urgent : colors.text;
    case 'RR': return v >= 25 || v <= 8 ? colors.critical : v >= 21 ? colors.urgent : colors.text;
    case 'TEMP': return v >= 102.2 || v <= 95 ? colors.critical : v >= 100.4 ? colors.urgent : colors.text;
    default: return colors.text;
  }
}

export function VitalTile({ p, code, pathway, onPress }: { p: Patient; code: VitalCode; pathway: Pathway; onPress?: () => void }) {
  const tier = p.episodes.find((e) => e.pathway === 'VIPD')?.tier;
  const o = latest(p.observations, code);
  const dbp = code === 'SBP' ? latest(p.observations, 'DBP') : undefined;
  const f = freshness(o, pathway, tier);
  const stale = f === 'STALE' || f === 'MISSING';
  const value = !o ? '—' : code === 'SBP' && dbp ? `${Math.round(o.value)}/${Math.round(dbp.value)}` : String(o.value);
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} style={styles.vital}>
      <Text style={type.small}>{vitalLabel[code]}</Text>
      <Text style={[type.vital, { color: stale ? colors.stale : o ? vitalTone(code, o.value) : colors.stale }]}>{value}</Text>
      <Text style={type.tiny}>{o?.unit ?? ''}</Text>
      <FreshnessDot f={f} at={o?.at} />
    </Pressable>
  );
}

/* ---------------------------------------------------------------- NEWS2 */
export function patientNews2(p: Patient): News2Result {
  const g = (c: VitalCode) => latest(p.observations, c)?.value;
  const t = g('TEMP');
  return news2({ rr: g('RR'), spo2: g('SPO2'), sbp: g('SBP'), hr: g('HR'), tempC: t !== undefined ? fToC(t) : undefined, consciousness: 'A', onOxygen: false });
}

export function News2Badge({ r }: { r: News2Result }) {
  const c = r.band === 'HIGH' ? colors.critical : r.band === 'MEDIUM' ? colors.urgent : r.band === 'LOW_MEDIUM' ? colors.advisory : colors.stable;
  return (
    <View style={[styles.news, { borderColor: c }]} accessibilityLabel={`NEWS2 ${r.total}${r.complete ? '' : ' incomplete'}`}>
      <Text style={{ fontSize: 9, color: c, fontWeight: '700' }}>NEWS2</Text>
      <Text style={{ fontSize: 18, color: c, fontWeight: '800' }}>{r.total}{r.complete ? '' : '*'}</Text>
    </View>
  );
}

/* ---------------------------------------------------------------- Events */
export function EventRow({ ev, patientName, onPress }: { ev: ClinicalEvent; patientName: string; onPress: () => void }) {
  const m = clsMeta[ev.cls];
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.evRow, { borderLeftColor: m.color, opacity: pressed ? 0.85 : 1 }]}>
      <View style={[styles.evIcon, { backgroundColor: m.soft }]}>
        <Ionicons name={m.icon} size={18} color={m.color} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={[type.h3, { flex: 1 }]} numberOfLines={1}>{patientName}</Text>
          <Text style={type.tiny}>{ago(ev.at)}</Text>
        </View>
        <Text style={{ color: m.color, fontWeight: '700', fontSize: 13 }} numberOfLines={1}>{ev.title}</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
          <PathwayChip pathway={ev.pathway} />
          <EventClassChip cls={ev.cls} />
          {ev.status === 'ACKNOWLEDGED' ? <Pill label="Acknowledged" color={colors.stable} /> : null}
          {ev.cls === 'E' ? <Pill label="No wait – act now" color={colors.critical} /> : ev.ackBy && ev.status === 'OPEN' ? (
            <Pill label={`Ack ${countdown(ev.ackBy)}`} color={ev.ackBy < Date.now() ? colors.critical : colors.textMuted} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

/* ---------------------------------------------------------------- Trend chart (no SVG dependency)
 * Columns are placed by time; gaps are NOT interpolated (missing data stays visible as gaps).
 */
export function TrendChart({
  data, height = 110, band, color = colors.primary, label, unit,
}: { data: Observation[]; height?: number; band?: [number, number]; color?: string; label: string; unit?: string }) {
  if (!data.length) {
    return (
      <View style={[styles.chart, { height: height + 40, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={type.small}>{label}: no readings in this period</Text>
      </View>
    );
  }
  const vals = data.map((d) => d.value);
  const min = Math.min(...vals, band ? band[0] : Infinity);
  const max = Math.max(...vals, band ? band[1] : -Infinity);
  const span = Math.max(1, max - min);
  const t0 = data[0].at;
  const t1 = data[data.length - 1].at;
  const tspan = Math.max(1, t1 - t0);
  const y = (v: number) => ((v - min) / span) * (height - 8);
  return (
    <View style={styles.chart} accessibilityLabel={`${label} trend from ${vals[0]} to ${vals[vals.length - 1]}`}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={type.h3}>{label}</Text>
        <Text style={type.small}>min {Math.min(...vals)} · max {Math.max(...vals)} {unit ?? ''} · n={vals.length}</Text>
      </View>
      <View style={{ height, marginTop: spacing.sm }}>
        {band ? (
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: y(band[0]), height: Math.max(2, y(band[1]) - y(band[0])), backgroundColor: colors.stableSoft, borderRadius: 4 }} />
        ) : null}
        {data.map((d, i) => (
          <View
            key={i}
            style={{
              position: 'absolute', left: `${((d.at - t0) / tspan) * 97}%`, bottom: y(d.value), width: 6, height: 6, borderRadius: 3,
              backgroundColor: band && (d.value < band[0] || d.value > band[1]) ? colors.urgent : color,
            }}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text style={type.tiny}>{ago(t0)}</Text>
        <Text style={type.tiny}>{band ? `Target ${band[0]}–${band[1]}` : ''}</Text>
        <Text style={type.tiny}>{ago(t1)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.md, ...shadow },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
  pathChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.card },
  emBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.critical, paddingHorizontal: 10, minHeight: 40, borderRadius: radius.sm },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 4 },
  vital: { flexBasis: '31%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, minHeight: 96 },
  news: { borderWidth: 2, borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 2, alignItems: 'center', minWidth: 56 },
  evRow: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, borderLeftWidth: 4, ...shadow },
  evIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  chart: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
});

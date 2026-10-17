/**
 * UD-D-01 Unified Clinical Dashboard (also CC-D-01 Chronic dashboard, RM-D-02 RPM panel).
 * Rule: no undifferentiated queue – pathway tabs, with a critical strip pinned above everything.
 */
import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Card, Pill, Screen, SectionTitle, Segmented } from '../../components/ui';
import { Avatar, EventRow, FreshnessDot, News2Badge, PathwayChip, episodeExtra, patientNews2 } from '../../components/clinical';
import { colors, radius, spacing, type } from '../../theme/tokens';
import { useStore } from '../../store/AppStore';
import { useRootNav } from '../../navigation/hooks';
import type { Pathway, Patient } from '../../types/models';
import { DAY, ago, dateLabel, freshness, latest } from '../../utils/clinical';

type Tab = 'ALL' | Pathway;

export default function DashboardScreen() {
  const nav = useRootNav();
  const { doctor, patients, openEvents } = useStore();
  const [tab, setTab] = useState<Tab>('ALL');

  const by = (pw: Pathway) => patients.filter((p) => p.episodes.some((e) => e.pathway === pw));
  const counts = { ACU: by('ACU').length, CCM: by('CCM').length, VIPD: by('VIPD').length, RPM: by('RPM').length };
  const critical = openEvents.filter((e) => e.cls === 'E' || e.cls === 'U');
  const name = (id: string) => patients.find((p) => p.id === id)?.name ?? id;
  const hour = new Date().getHours();

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
        <Avatar name={doctor.name} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={type.small}>{hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'} · {dateLabel(Date.now())}</Text>
          <Text style={type.h2}>{doctor.name}</Text>
          <Text style={type.tiny}>{doctor.speciality} · {doctor.role.replace('_', '-')}</Text>
        </View>
        <Pressable onPress={() => nav.navigate('ShiftHandover')} accessibilityRole="button" style={{ padding: 8 }}>
          <Ionicons name="swap-horizontal-outline" size={24} color={colors.primary} />
        </Pressable>
      </View>

      {/* Critical strip – always first, across all pathways */}
      <Card accent={critical.length ? colors.critical : colors.stable}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={type.h3}>Critical alerts & unresolved escalations</Text>
          <Pill label={`${critical.length}`} color={critical.length ? colors.critical : colors.stable} />
        </View>
        {critical.length === 0 ? <Text style={[type.small, { marginTop: 6 }]}>All clear.</Text> : null}
        <View style={{ marginTop: spacing.sm }}>
          {critical.slice(0, 3).map((ev) => (
            <EventRow key={ev.id} ev={ev} patientName={name(ev.patientId)} onPress={() => nav.navigate('AlertDetail', { eventId: ev.id })} />
          ))}
        </View>
        {critical.length > 3 ? <Text style={{ color: colors.primary, fontWeight: '600' }} onPress={() => nav.navigate('Main', { screen: 'Alerts' })}>View all {critical.length}</Text> : null}
      </Card>

      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { key: 'ALL', label: 'All' },
          { key: 'ACU', label: 'Acute', badge: counts.ACU },
          { key: 'CCM', label: 'Chronic', badge: counts.CCM },
          { key: 'VIPD', label: 'Virtual IPD', badge: counts.VIPD },
          { key: 'RPM', label: 'RPM / Elderly', badge: counts.RPM },
        ]}
      />

      {tab === 'ALL' ? <AllWorklists counts={counts} onTab={setTab} /> : null}
      {tab === 'VIPD' ? <VipdList list={by('VIPD')} /> : null}
      {tab === 'ACU' ? <AcuteList list={by('ACU')} /> : null}
      {tab === 'CCM' ? <ChronicList list={by('CCM')} /> : null}
      {tab === 'RPM' ? <RpmList list={by('RPM')} /> : null}
    </Screen>
  );
}

function AllWorklists({ counts, onTab }: { counts: Record<Pathway, number>; onTab: (t: Tab) => void }) {
  const nav = useRootNav();
  const { patients, openEvents } = useStore();
  const pendingResults = patients.reduce((n, p) => n + p.labs.filter((l) => !l.acknowledged).length, 0);
  const overdueReviews = patients.filter((p) => p.episodes.some((e) => e.nextReview && e.nextReview < Date.now())).length;
  const dischargeReady = patients.filter((p) => p.episodes.some((e) => e.pathway === 'VIPD' && (e.day ?? 0) >= 3) && patientNews2(p).total <= 2).length;
  const dataGaps = openEvents.filter((e) => e.cls === 'A' || e.cls === 'T').length;

  const tiles: { label: string; value: number; icon: React.ComponentProps<typeof Ionicons>['name']; color: string; onPress: () => void }[] = [
    { label: 'Acute', value: counts.ACU, icon: 'flash-outline', color: colors.urgent, onPress: () => onTab('ACU') },
    { label: 'Chronic', value: counts.CCM, icon: 'repeat-outline', color: colors.primary, onPress: () => onTab('CCM') },
    { label: 'Virtual IPD', value: counts.VIPD, icon: 'bed-outline', color: colors.primaryDark, onPress: () => onTab('VIPD') },
    { label: 'RPM / Elderly', value: counts.RPM, icon: 'pulse-outline', color: colors.stable, onPress: () => onTab('RPM') },
  ];
  const work: { label: string; value: number; icon: React.ComponentProps<typeof Ionicons>['name']; onPress?: () => void }[] = [
    { label: 'Pending results to acknowledge', value: pendingResults, icon: 'flask-outline', onPress: () => nav.navigate('Main', { screen: 'Patients' }) },
    { label: 'Overdue reviews / follow-ups', value: overdueReviews, icon: 'calendar-outline', onPress: () => onTab('CCM') },
    { label: 'Data gaps & device issues (not risk)', value: dataGaps, icon: 'cloud-offline-outline', onPress: () => nav.navigate('Main', { screen: 'Alerts' }) },
    { label: 'Discharge planning (VIPD)', value: dischargeReady, icon: 'exit-outline', onPress: () => onTab('VIPD') },
    { label: 'Shift handover', value: 1, icon: 'swap-horizontal-outline', onPress: () => nav.navigate('ShiftHandover') },
  ];
  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
        {tiles.map((t) => (
          <Pressable key={t.label} onPress={t.onPress} accessibilityRole="button" style={{ flexBasis: '47%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border }}>
            <Ionicons name={t.icon} size={20} color={t.color} />
            <Text style={[type.h1, { marginTop: 4 }]}>{t.value}</Text>
            <Text style={type.small}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      <SectionTitle title="Worklists" />
      {work.map((w) => (
        <Card key={w.label} onPress={w.onPress} style={{ paddingVertical: spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name={w.icon} size={20} color={colors.primary} style={{ marginRight: spacing.md }} />
            <Text style={[type.body, { flex: 1 }]}>{w.label}</Text>
            <Pill label={String(w.value)} color={w.value ? colors.primary : colors.textMuted} />
          </View>
        </Card>
      ))}
      <Card onPress={() => nav.navigate('Eligibility', {})} accent={colors.primary}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="add-circle-outline" size={22} color={colors.primary} style={{ marginRight: spacing.md }} />
          <View style={{ flex: 1 }}>
            <Text style={type.h3}>Assess new Virtual IPD admission</Text>
            <Text style={type.small}>Formal eligibility – clinical, staffing, equipment, home</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
      </Card>
    </View>
  );
}

function PatientRow({ p, right, sub }: { p: Patient; right?: React.ReactNode; sub?: string }) {
  const nav = useRootNav();
  return (
    <Card onPress={() => nav.navigate('PatientChart', { patientId: p.id })}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar name={p.name} size={38} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={type.h3}>{p.name} <Text style={type.small}>{p.age}{p.sex}</Text></Text>
          <Text style={type.small} numberOfLines={1}>{sub ?? p.diagnosis}</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            {p.episodes.map((e) => <PathwayChip key={e.id} pathway={e.pathway} extra={episodeExtra(e)} />)}
          </View>
        </View>
        {right}
      </View>
    </Card>
  );
}

function VipdList({ list }: { list: Patient[] }) {
  const nav = useRootNav();
  const sorted = useMemo(() => [...list].sort((a, b) => patientNews2(b).total - patientNews2(a).total), [list]);
  return (
    <View>
      <Banner tone="info" title="Sorted by NEWS2 (highest first)" text="* = incomplete vitals set. Tap a patient for chart, rounds and orders." />
      {sorted.map((p) => {
        const r = patientNews2(p);
        const ep = p.episodes.find((e) => e.pathway === 'VIPD')!;
        const spo2 = latest(p.observations, 'SPO2');
        return (
          <PatientRow
            key={p.id}
            p={p}
            sub={`${p.diagnosis} · SpO₂ ${spo2?.value ?? '—'}%`}
            right={
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <News2Badge r={r} />
                <FreshnessDot f={freshness(spo2, 'VIPD', ep.tier)} at={spo2?.at} />
              </View>
            }
          />
        );
      })}
      <Card onPress={() => nav.navigate('Eligibility', {})}>
        <Text style={{ color: colors.primary, fontWeight: '700' }}>+ Assess new admission</Text>
      </Card>
    </View>
  );
}

function AcuteList({ list }: { list: Patient[] }) {
  const nav = useRootNav();
  return (
    <View>
      {list.map((p) => {
        const ep = p.episodes.find((e) => e.pathway === 'ACU')!;
        return (
          <PatientRow
            key={p.id}
            p={p}
            right={
              <Pressable onPress={() => nav.navigate(ep.status === 'INTAKE' ? 'AcuteTriage' : 'AcuteWorkspace', { patientId: p.id })} style={{ padding: 6 }}>
                <Pill label={ep.status === 'INTAKE' ? 'Red-flag screen' : ep.urgency ?? ep.status} color={ep.status === 'INTAKE' ? colors.critical : colors.urgent} />
              </Pressable>
            }
          />
        );
      })}
    </View>
  );
}

function ChronicList({ list }: { list: Patient[] }) {
  const nav = useRootNav();
  return (
    <View>
      <Banner tone="info" title="Clinical risk and data gaps are shown separately" text="A missing reading or offline device never makes a patient 'high risk' on its own." />
      {list.map((p) => {
        const ep = p.episodes.find((e) => e.pathway === 'CCM')!;
        const lastAny = [...p.observations].sort((a, b) => b.at - a.at)[0];
        const gap = !lastAny || Date.now() - lastAny.at > 2 * DAY;
        const overdue = !!ep.nextReview && ep.nextReview < Date.now();
        return (
          <PatientRow
            key={p.id}
            p={p}
            sub={`${ep.programme} · next review ${ep.nextReview ? (overdue ? 'OVERDUE' : 'in ' + Math.ceil((ep.nextReview - Date.now()) / DAY) + ' d') : '—'}`}
            right={
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                {ep.status === 'REASSESSMENT_REQUIRED' ? (
                  <Pressable onPress={() => nav.navigate('ChronicReassess', { patientId: p.id })}>
                    <Pill label="Reassess" color={colors.urgent} icon="alert" />
                  </Pressable>
                ) : <Pill label="Active" color={colors.stable} />}
                {gap ? <Pill label={`Data gap · ${lastAny ? ago(lastAny.at) : 'none'}`} color={colors.technical} icon="cloud-offline-outline" /> : null}
              </View>
            }
          />
        );
      })}
    </View>
  );
}

function RpmList({ list }: { list: Patient[] }) {
  return (
    <View>
      <Banner tone="warn" title="RPM-L2: reviewed during staffed hours only" text="Not continuous supervision. Emergencies go to 108/112 and the command centre." />
      {list.map((p) => {
        const ep = p.episodes.find((e) => e.pathway === 'RPM')!;
        const low = p.devices.filter((d) => d.battery < 40);
        return (
          <PatientRow
            key={p.id}
            p={p}
            right={
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Pill label={ep.serviceLevel ?? 'RPM'} color={colors.stable} />
                {low.length ? <Pill label={`${low[0].name} ${low[0].battery}%`} color={colors.technical} icon="battery-dead-outline" /> : null}
              </View>
            }
          />
        );
      })}
    </View>
  );
}

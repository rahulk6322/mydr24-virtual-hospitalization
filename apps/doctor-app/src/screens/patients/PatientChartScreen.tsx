/** D-14 Unified Patient Chart with UD-D-02 header; pathway-aware quick actions. */
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Button, Card, KeyValue, Pill, Screen, SectionTitle, Segmented } from '../../components/ui';
import { News2Badge, PatientHeader, VitalTile, patientNews2 } from '../../components/clinical';
import { colors, radius, spacing, type } from '../../theme/tokens';
import { useStore } from '../../store/AppStore';
import { useParams, useRootNav } from '../../navigation/hooks';
import type { RootStackParamList } from '../../navigation/types';
import type { Pathway, VitalCode } from '../../types/models';
import { ago, news2BandLabel } from '../../utils/clinical';

type TabKey = NonNullable<RootStackParamList['PatientChart']['tab']>;

export default function PatientChartScreen() {
  const { patientId, tab: initial } = useParams<'PatientChart'>();
  const nav = useRootNav();
  const { patient, openEvents } = useStore();
  const p = patient(patientId);
  const [tab, setTab] = useState<TabKey>(initial ?? 'overview');
  if (!p) return <Screen><Banner tone="danger" title="Patient not found" /></Screen>;

  const primary: Pathway = p.episodes[0]?.pathway ?? 'ACU';
  const isVipd = p.episodes.some((e) => e.pathway === 'VIPD');
  const isAcute = p.episodes.some((e) => e.pathway === 'ACU');
  const isChronic = p.episodes.some((e) => e.pathway === 'CCM');
  const evs = openEvents.filter((e) => e.patientId === p.id);
  const r = patientNews2(p);
  const vitals: VitalCode[] = isVipd || isAcute ? ['SBP', 'HR', 'SPO2', 'TEMP', 'RR'] : (['SBP', 'HR', 'GLU', 'WT', 'SPO2', 'TEMP'] as VitalCode[]).filter((c) => p.observations.some((o) => o.code === c));
  const offline = p.devices.filter((d) => !d.online);

  const actions: { label: string; icon: React.ComponentProps<typeof Ionicons>['name']; go: () => void; show: boolean }[] = [
    { label: 'Tele-round', icon: 'videocam-outline', go: () => nav.navigate('TeleRound', { patientId }), show: true },
    { label: 'Note', icon: 'create-outline', go: () => nav.navigate('SoapNote', { patientId, kind: isAcute ? 'ACUTE' : isChronic ? 'REVIEW' : 'SOAP' }), show: true },
    { label: 'Orders', icon: 'list-outline', go: () => nav.navigate('Orders', { patientId }), show: true },
    { label: 'e-Rx & MAR', icon: 'medkit-outline', go: () => nav.navigate('Prescription', { patientId }), show: true },
    { label: 'ICU monitor', icon: 'pulse-outline', go: () => nav.navigate('IcuMonitor', { patientId }), show: isVipd },
    { label: 'Overnight', icon: 'moon-outline', go: () => nav.navigate('OvernightReview', { patientId }), show: isVipd },
    { label: 'Devices', icon: 'hardware-chip-outline', go: () => nav.navigate('DeviceStatus', { patientId }), show: p.devices.length > 0 },
    { label: 'Chat', icon: 'chatbubbles-outline', go: () => nav.navigate('Chat', { patientId }), show: true },
    { label: 'Family', icon: 'people-outline', go: () => nav.navigate('FamilyUpdate', { patientId }), show: p.caregiver.length > 0 },
    { label: 'Transition', icon: 'git-compare-outline', go: () => nav.navigate('Transition', { patientId, from: primary }), show: true },
    { label: 'Goals of care', icon: 'document-text-outline', go: () => nav.navigate('GoalsOfCare', { patientId }), show: true },
    { label: 'Discharge', icon: 'exit-outline', go: () => nav.navigate('Discharge', { patientId }), show: isVipd },
  ];

  return (
    <Screen>
      <PatientHeader p={p} />
      {evs.length ? (
        <Pressable onPress={() => nav.navigate('AlertDetail', { eventId: evs[0].id })}>
          <Banner tone={evs[0].cls === 'E' ? 'danger' : evs[0].cls === 'U' ? 'warn' : 'info'} title={`${evs.length} open event${evs.length > 1 ? 's' : ''}: ${evs[0].title}`} text="Tap to review and act" />
        </Pressable>
      ) : null}
      {offline.length ? <Banner tone="info" title={`${offline.map((d) => d.name).join(', ')} offline`} text="Values below may be stale – check freshness labels." /> : null}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
        {actions.filter((a) => a.show).map((a) => (
          <Pressable key={a.label} onPress={a.go} accessibilityRole="button" style={{ width: '23%', minWidth: 76, flexGrow: 1, alignItems: 'center', paddingVertical: spacing.sm, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border }}>
            <Ionicons name={a.icon} size={20} color={colors.primary} />
            <Text style={[type.tiny, { color: colors.text, marginTop: 3, textAlign: 'center' }]}>{a.label}</Text>
          </Pressable>
        ))}
      </View>

      <Segmented<TabKey>
        value={tab}
        onChange={setTab}
        options={[
          { key: 'overview', label: 'Overview' },
          { key: 'vitals', label: 'Vitals' },
          { key: 'meds', label: 'Meds', badge: p.meds.length },
          { key: 'results', label: 'Results', badge: p.labs.filter((l) => !l.acknowledged).length || undefined },
          { key: 'notes', label: 'Notes', badge: p.notes.length },
        ]}
      />

      {tab === 'overview' ? (
        <View>
          {isVipd ? (
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={type.h3}>Early warning (NEWS2)</Text>
                  <Text style={type.small}>{news2BandLabel[r.band]}{r.complete ? '' : ` · missing: ${r.missing.join(', ')}`}</Text>
                  <Text style={type.tiny}>Consciousness assumed Alert unless recorded · decision support only</Text>
                </View>
                <News2Badge r={r} />
              </View>
            </Card>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
            {vitals.map((c) => <VitalTile key={c} p={p} code={c} pathway={primary} onPress={() => nav.navigate('VitalsTrends', { patientId })} />)}
          </View>
          <Card>
            <KeyValue k="Diagnosis" v={p.diagnosis} />
            <KeyValue k="Allergies" v={p.allergies.join(', ') || 'No known drug allergies'} vColor={p.allergies.length ? colors.critical : undefined} />
            <KeyValue k="Active medications" v={`${p.meds.length}`} />
            <KeyValue k="Clinical notes" v={`${p.notes.length}`} />
            <KeyValue k="Location" v={p.location} />
            <KeyValue k="Caregiver" v={p.caregiver[0] ? `${p.caregiver[0].name} (${p.caregiver[0].relation})` : '—'} />
          </Card>
          {isAcute ? <Button label="Open acute workflow" icon="flash-outline" onPress={() => nav.navigate(p.episodes.find((e) => e.pathway === 'ACU')?.status === 'INTAKE' ? 'AcuteTriage' : 'AcuteWorkspace', { patientId })} /> : null}
          {isChronic ? <Button label="Chronic reassessment" kind="secondary" icon="repeat-outline" onPress={() => nav.navigate('ChronicReassess', { patientId })} /> : null}
        </View>
      ) : null}

      {tab === 'vitals' ? (
        <View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
            {vitals.map((c) => <VitalTile key={c} p={p} code={c} pathway={primary} />)}
          </View>
          <Button label="Open trends" icon="trending-up-outline" onPress={() => nav.navigate('VitalsTrends', { patientId })} />
        </View>
      ) : null}

      {tab === 'meds' ? (
        <View>
          {p.meds.map((m) => (
            <Card key={m.id} style={{ paddingVertical: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={type.h3}>{m.name} {m.dose} {m.route}</Text>
                  <Text style={type.small}>{m.frequency}{m.dayOf ? ` · ${m.dayOf}` : ''}</Text>
                </View>
                <Pill label={m.status} color={m.status === 'GIVEN' ? colors.stable : m.status === 'DUE' ? colors.urgent : m.status === 'MISSED' ? colors.critical : colors.technical} />
              </View>
            </Card>
          ))}
          <Button label="Medication reconciliation" kind="secondary" icon="git-merge-outline" onPress={() => nav.navigate('MedRec', { patientId })} />
        </View>
      ) : null}

      {tab === 'results' ? <ResultsInline patientId={patientId} /> : null}

      {tab === 'notes' ? (
        <View>
          <SectionTitle title="Clinical notes" action="+ New note" onAction={() => nav.navigate('SoapNote', { patientId })} />
          {p.notes.length === 0 ? <Text style={type.small}>No notes yet.</Text> : null}
          {p.notes.map((n) => (
            <Card key={n.id}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Pill label={n.kind} color={colors.primary} />
                <Text style={type.tiny}>{ago(n.at)}</Text>
              </View>
              <Text style={[type.body, { marginTop: 6 }]}>{n.summary}</Text>
              <Text style={[type.tiny, { marginTop: 4 }]}>{n.author} · {n.signed ? 'Signed' : 'Unsigned draft'}</Text>
            </Card>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

function ResultsInline({ patientId }: { patientId: string }) {
  const nav = useRootNav();
  const { patient } = useStore();
  const p = patient(patientId)!;
  return (
    <View>
      {p.labs.slice(0, 4).map((l) => (
        <Card key={l.id} accent={l.flag === 'CRIT' ? colors.critical : l.flag === 'H' || l.flag === 'L' ? colors.urgent : undefined}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={type.h3}>{l.name}</Text>
            {!l.acknowledged ? <Pill label="To acknowledge" color={colors.urgent} /> : null}
          </View>
          <Text style={type.body}>{l.value} {l.unit} <Text style={type.small}>(ref {l.ref})</Text></Text>
        </Card>
      ))}
      <Button label="All results" icon="flask-outline" onPress={() => nav.navigate('Results', { patientId })} />
      <Button label="Order labs / imaging" kind="secondary" icon="add" onPress={() => nav.navigate('Orders', { patientId })} />
    </View>
  );
}

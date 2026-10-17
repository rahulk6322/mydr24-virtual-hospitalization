/** D-24 Alert Detail (all classes). Emergency/urgent cannot be snoozed; resolution needs documented criteria. */
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Banner, Button, Card, Choice, Field, KeyValue, Screen } from '../../components/ui';
import { EventClassChip, PathwayChip, PatientHeader, TrendChart, clsMeta } from '../../components/clinical';
import { colors, spacing, type } from '../../theme/tokens';
import { useStore } from '../../store/AppStore';
import { useParams, useRootNav } from '../../navigation/hooks';
import { HOUR, ago, countdown, series } from '../../utils/clinical';
import type { VitalCode } from '../../types/models';

export default function AlertDetailScreen() {
  const { eventId } = useParams<'AlertDetail'>();
  const nav = useRootNav();
  const { events, patient, dispatch } = useStore();
  const ev = events.find((e) => e.id === eventId);
  const [snooze, setSnooze] = useState('');
  const [resolution, setResolution] = useState('');
  const [mode, setMode] = useState<'none' | 'snooze' | 'resolve'>('none');
  if (!ev) return <Screen><Banner tone="danger" title="Event not found" /></Screen>;
  const p = patient(ev.patientId)!;
  const m = clsMeta[ev.cls];
  const code: VitalCode | undefined = /SpO|SPO2/i.test(ev.title) ? 'SPO2' : /Weight/i.test(ev.title) ? 'WT' : /BP/i.test(ev.title) ? 'SBP' : undefined;
  const range = ev.pathway === 'CCM' || ev.pathway === 'RPM' ? 10 * 24 * HOUR : 2 * HOUR;
  const canSnooze = ev.cls !== 'E' && ev.cls !== 'U';
  const caregiver = p.caregiver[0];

  return (
    <Screen>
      <View style={{ backgroundColor: m.color, borderRadius: 12, padding: spacing.lg, marginBottom: spacing.md }}>
        <Text style={{ color: colors.white, fontWeight: '800', fontSize: 18 }}>{ev.title}</Text>
        <Text style={{ color: colors.white, marginTop: 4 }}>{ev.detail}</Text>
        <Text style={{ color: colors.white, marginTop: 6, fontSize: 12 }}>
          {m.label} · {ago(ev.at)}{ev.cls === 'E' ? ' · act now – no acknowledgement wait' : ev.ackBy ? ` · ack in ${countdown(ev.ackBy)}` : ''}
        </Text>
      </View>
      <PatientHeader p={p} compact />
      <Card>
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}><PathwayChip pathway={ev.pathway} /><EventClassChip cls={ev.cls} /></View>
        <KeyValue k="Event type" v={ev.type.replace(/_/g, ' ').toLowerCase()} />
        <KeyValue k="Rule" v={`${ev.ruleId} · ${ev.ruleVersion}`} />
        <KeyValue k="Status" v={ev.status} />
        {ev.ackedBy ? <KeyValue k="Acknowledged by" v={ev.ackedBy} /> : null}
      </Card>
      {code ? <TrendChart label="Trend before alert" data={series(p.observations, code, range)} unit={p.observations.find((o) => o.code === code)?.unit} /> : null}

      {ev.cls === 'E' || ev.cls === 'U' ? (
        <>
          <Button label="Open emergency console" kind="danger" icon="alert-circle" onPress={() => nav.navigate('Emergency', { patientId: p.id })} />
          <Button label="Escalation decision" icon="git-branch-outline" onPress={() => nav.navigate('Escalation', { patientId: p.id, eventId: ev.id })} />
        </>
      ) : null}
      {ev.type === 'NOTIFICATION_DELIVERY_FAILURE' ? (
        <Banner tone="info" title="Not counted as acknowledged" text={`Next channel: SMS → voice call to ${caregiver?.name ?? 'next contact'}. Delivery is tracked separately from clinical acknowledgement.`} />
      ) : null}
      <Button label="Start video call" kind="secondary" icon="videocam-outline" onPress={() => nav.navigate('TeleRound', { patientId: p.id })} />
      <Button label="Dispatch field nurse" kind="secondary" icon="car-outline" onPress={() => dispatch({ type: 'AUDIT', entry: { action: 'DISPATCH_FIELD', patientId: p.id, detail: ev.id } })} />
      {ev.status === 'OPEN' && ev.cls !== 'E' ? <Button label="Acknowledge" icon="checkmark" onPress={() => dispatch({ type: 'ACK_EVENT', id: ev.id })} /> : null}

      {canSnooze ? <Button label="Snooze (max 15 min)" kind="ghost" icon="time-outline" onPress={() => setMode('snooze')} /> : <Text style={[type.tiny, { textAlign: 'center' }]}>Emergency and urgent events cannot be snoozed.</Text>}
      <Button label="Resolve with documentation" kind="ghost" icon="checkmark-done" onPress={() => setMode('resolve')} />

      {mode === 'snooze' ? (
        <Card>
          <Field label="Snooze reason (required)" value={snooze} onChangeText={setSnooze} />
          <Button label="Snooze 15 min" disabled={snooze.trim().length < 5} onPress={() => { dispatch({ type: 'SNOOZE_EVENT', id: ev.id, minutes: 15, reason: snooze }); nav.goBack(); }} />
        </Card>
      ) : null}
      {mode === 'resolve' ? (
        <Card>
          <Choice
            value={resolution}
            onChange={setResolution}
            options={[
              { key: 'Patient assessed – managed at home with plan update', label: 'Assessed – managed at home' },
              { key: 'Escalated – transfer arranged', label: 'Escalated / transferred' },
              { key: 'Artefact / device issue confirmed – no clinical change', label: 'Artefact / device issue' },
              { key: 'Data received / task completed', label: 'Data received / task done' },
            ]}
          />
          <Button label="Resolve event" disabled={!resolution} onPress={() => { dispatch({ type: 'RESOLVE_EVENT', id: ev.id, resolution }); nav.goBack(); }} />
        </Card>
      ) : null}
    </Screen>
  );
}

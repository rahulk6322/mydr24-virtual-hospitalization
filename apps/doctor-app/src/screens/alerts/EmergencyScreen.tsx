/**
 * D-25 Emergency Response Console (redesigned). A remote doctor COORDINATES – 108/112 + paramedic +
 * caregiver guidance + ED pre-alert. Guidance depends on code status (D-07). Closing needs an outcome.
 */
import React, { useEffect, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Button, Card, Choice, Screen } from '../../components/ui';
import { PatientHeader, VitalTile } from '../../components/clinical';
import { colors, spacing, type } from '../../theme/tokens';
import { uid, useStore } from '../../store/AppStore';
import { useParams, useRootNav } from '../../navigation/hooks';
import { clock } from '../../utils/clinical';

type Step = 'ambulance' | 'nurse' | 'ed' | 'caregiver';
type Outcome = 'TRANSFERRED' | 'STABILISED' | 'DIED';

export default function EmergencyScreen() {
  const { patientId } = useParams<'Emergency'>();
  const nav = useRootNav();
  const { patient, dispatch, doctor, events } = useStore();
  const p = patient(patientId)!;
  const [start] = useState(Date.now());
  const [now, setNow] = useState(Date.now());
  const [log, setLog] = useState<{ at: number; text: string }[]>([{ at: Date.now(), text: 'Emergency console opened' }]);
  const [done, setDone] = useState<Record<Step, boolean>>({ ambulance: false, nurse: false, ed: false, caregiver: false });
  const [outcome, setOutcome] = useState<Outcome>();
  const comfort = p.codeStatus === 'DNR';

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    dispatch({ type: 'AUDIT', entry: { action: 'EMERGENCY_OPENED', patientId } });
    return () => clearInterval(id);
  }, [dispatch, patientId]);

  const act = (k: Step, text: string, tel?: string) => {
    setDone((d) => ({ ...d, [k]: true }));
    setLog((l) => [...l, { at: Date.now(), text }]);
    dispatch({ type: 'AUDIT', entry: { action: `EMERGENCY_${k.toUpperCase()}`, patientId, detail: text } });
    if (tel) Linking.openURL(`tel:${tel}`).catch(() => undefined);
  };

  const close = () => {
    if (!outcome) return;
    events.filter((e) => e.patientId === patientId && (e.cls === 'E' || e.cls === 'U') && e.status !== 'RESOLVED')
      .forEach((e) => dispatch({ type: 'RESOLVE_EVENT', id: e.id, resolution: `Emergency closed: ${outcome}` }));
    dispatch({ type: 'AUDIT', entry: { action: 'EMERGENCY_CLOSED', patientId, detail: outcome } });
    if (outcome === 'TRANSFERRED') nav.replace('Handover', { patientId });
    else {
      dispatch({ type: 'RECORD_TRANSITION', transition: { id: uid('tr'), patientId, from: p.episodes[0]?.pathway ?? 'NONE', to: p.episodes[0]?.pathway ?? 'CLOSED', trigger: 'Emergency', rationale: outcome === 'STABILISED' ? 'Stabilised at home; senior review scheduled' : 'Death – incident & certification workflow', authorisedBy: doctor.name, at: Date.now(), outstandingTasks: ['Incident review'], handover: 'NOT_REQUIRED' } });
      nav.goBack();
    }
  };

  const elapsed = Math.floor((now - start) / 1000);
  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <Screen>
      <View style={{ backgroundColor: colors.critical, borderRadius: 12, padding: spacing.md, flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
        <Ionicons name="alert-circle" size={26} color={colors.white} />
        <Text style={{ color: colors.white, fontWeight: '800', fontSize: 18, marginLeft: 8, flex: 1 }}>LIVE EMERGENCY</Text>
        <Text style={{ color: colors.white, fontWeight: '800', fontSize: 20 }}>{mmss}</Text>
      </View>
      <PatientHeader p={p} compact />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
        {(['SBP', 'HR', 'SPO2', 'RR'] as const).map((c) => <VitalTile key={c} p={p} code={c} pathway={p.episodes[0]?.pathway ?? 'ACU'} />)}
      </View>

      {comfort ? (
        <Banner tone="warn" title="DNR – comfort-care pathway" text="No CPR prompts. Contact palliative lead, support family, symptom relief per plan." />
      ) : p.codeStatus === 'LIMITED' ? (
        <Banner tone="warn" title="Limited treatment – check goals of care" text="Escalate within documented limits (e.g. no intubation)." />
      ) : p.codeStatus === 'UNKNOWN' ? (
        <Banner tone="danger" title="Code status not recorded" text="Treat as Full code until clarified." />
      ) : null}

      <Card>
        <Text style={[type.h3, { marginBottom: spacing.sm }]}>Response tracker</Text>
        {([
          ['ambulance', 'Ambulance (108 / 112)', done.ambulance ? 'Requested · ETA tracking' : 'Not requested'],
          ['nurse', 'Field nurse / paramedic', done.nurse ? 'En route' : 'Not dispatched'],
          ['ed', 'Receiving ED pre-alert', done.ed ? 'Pre-alerted with summary' : 'Pending'],
          ['caregiver', comfort ? 'Family support call' : 'Caregiver CPR / positioning guidance', done.caregiver ? 'Active' : 'Not started'],
        ] as [Step, string, string][]).map(([k, l, s]) => (
          <View key={k} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
            <Ionicons name={done[k] ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={done[k] ? colors.stable : colors.textSoft} style={{ marginRight: 8 }} />
            <Text style={[type.body, { flex: 1 }]}>{l}</Text>
            <Text style={[type.small, { color: done[k] ? colors.stable : colors.textMuted }]}>{s}</Text>
          </View>
        ))}
      </Card>

      <Button label="Call ambulance 108" kind="danger" icon="call" onPress={() => act('ambulance', 'Ambulance requested via 108; location + summary sent', '108')} />
      <Button label="Dispatch field nurse / paramedic" icon="car" onPress={() => act('nurse', 'Nearest field team dispatched')} />
      <Button label="Pre-alert receiving ED" icon="business" onPress={() => act('ed', 'Partner ED pre-alerted (FHIR handover bundle)')} />
      <Button label={comfort ? 'Call family (support)' : 'Start caregiver guidance'} kind="secondary" icon="people" onPress={() => act('caregiver', comfort ? 'Family support call started' : 'CPR / recovery-position guidance pushed to caregiver app & Home Hub', p.caregiver[0]?.phone)} />

      <Card>
        <Text style={[type.h3, { marginBottom: 6 }]}>Event log</Text>
        {log.map((l, i) => <Text key={i} style={type.small}>{clock(l.at)} · {l.text}</Text>)}
      </Card>

      <Card>
        <Text style={[type.h3, { marginBottom: 6 }]}>Close emergency – outcome required</Text>
        <Choice<Outcome> value={outcome} onChange={setOutcome} options={[{ key: 'TRANSFERRED', label: 'Transferred to hospital', hint: 'Opens hospital handover' }, { key: 'STABILISED', label: 'Stabilised at home', hint: 'Senior review + plan update' }, { key: 'DIED', label: 'Patient died', hint: 'Incident & certification workflow' }]} />
        <Button label="Close emergency" disabled={!outcome} onPress={close} />
      </Card>
    </Screen>
  );
}

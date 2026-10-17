/**
 * AC-D-04 Acute Consultation Workspace (steps 5–12) with AC-D-08 services, AC-D-09 safety-net,
 * AC-D-10 reassessment & exception pathways (deterioration, can't contact, failed home care, no resources).
 */
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Banner, Button, Card, CheckRow, Choice, KeyValue, Pill, Screen, SectionTitle } from '../../components/ui';
import { PatientHeader, VitalTile } from '../../components/clinical';
import { colors, spacing, type } from '../../theme/tokens';
import { useStore } from '../../store/AppStore';
import { useParams, useRootNav } from '../../navigation/hooks';
import { clock } from '../../utils/clinical';
import type { VitalCode } from '../../types/models';

const SERVICES = ['Field-nurse assessment visit', 'Home phlebotomy / POC tests', 'Home-care support', 'Specialist referral', 'Physiotherapy'];
const SAFETY_NET = ['Standard acute safety-net (approved template)', 'Respiratory infection safety-net', 'Fever safety-net', 'Abdominal pain safety-net'];
const LADDER = ['Call patient (primary number)', 'Call alternate number', 'Call caregiver / emergency contact', 'Field-team welfare visit', 'Emergency services per CGC policy'];
const EXCEPTIONS = [
  { key: 'HOMECARE', label: 'Home-care arrangement failed', action: 'Re-plan: alternative provider, facility visit or hospital – reconfirm safety' },
  { key: 'RESOURCE', label: 'Emergency resources unavailable / delayed', action: 'Escalate to on-call + ops lead; alternative transport/facility; continuous tele-support; incident report' },
  { key: 'DECLINE', label: 'Patient declines advice', action: 'Document capacity & informed refusal; safety-net; re-contact; senior review' },
];

export default function AcuteWorkspaceScreen() {
  const { patientId } = useParams<'AcuteWorkspace'>();
  const nav = useRootNav();
  const { patient, dispatch } = useStore();
  const p = patient(patientId)!;
  const ep = p.episodes.find((e) => e.pathway === 'ACU');
  const [services, setServices] = useState<string[]>([]);
  const [net, setNet] = useState<string>();
  const [followUp, setFollowUp] = useState<string>();
  const [attempts, setAttempts] = useState<{ step: string; at: number }[]>([]);
  const [exception, setException] = useState<string>();
  const hasAcuteNote = p.notes.some((n) => n.kind === 'ACUTE' && n.signed);
  const codes = (['TEMP', 'HR', 'SPO2', 'SBP', 'RR'] as VitalCode[]);

  const log = (action: string, detail?: string) => dispatch({ type: 'AUDIT', entry: { action, patientId, detail } });

  return (
    <Screen>
      <PatientHeader p={p} />
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: spacing.md }}>
        <Pill label={`Urgency: ${ep?.urgency ?? '—'}`} color={colors.urgent} />
        <Pill label={hasAcuteNote ? 'Plan signed' : 'Plan not signed'} color={hasAcuteNote ? colors.stable : colors.textMuted} />
      </View>

      <Button label="Patient deteriorating – EMERGENCY" kind="danger" icon="alert-circle" onPress={() => nav.navigate('Emergency', { patientId })} />

      <SectionTitle title="History & observations" />
      <Card>
        <KeyValue k="Presenting problem" v={p.diagnosis} />
        <KeyValue k="Allergies" v={p.allergies.join(', ') || 'NKDA'} vColor={p.allergies.length ? colors.critical : undefined} />
        <KeyValue k="Current medicines" v={p.meds.map((m) => m.name).join(', ') || 'None recorded'} />
        <KeyValue k="Active pathways" v={p.episodes.map((e) => e.pathway).join(', ')} />
      </Card>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
        {codes.map((c) => <VitalTile key={c} p={p} code={c} pathway="ACU" />)}
      </View>

      <SectionTitle title="Consult, examine, order" />
      <Button label="Video consultation (guided exam)" icon="videocam-outline" onPress={() => nav.navigate('TeleRound', { patientId })} />
      <Button label="Medication reconciliation" kind="secondary" icon="git-merge-outline" onPress={() => nav.navigate('MedRec', { patientId })} />
      <Button label="Order tests / visits / medicines" kind="secondary" icon="list-outline" onPress={() => nav.navigate('Orders', { patientId })} />
      <Button label={hasAcuteNote ? 'Update assessment & plan' : 'Record assessment & plan'} icon="create-outline" onPress={() => nav.navigate('SoapNote', { patientId, kind: 'ACUTE' })} />

      <SectionTitle title="Arrange services" />
      <Card>
        {SERVICES.map((s) => <CheckRow key={s} label={s} value={services.includes(s)} onChange={() => setServices((x) => (x.includes(s) ? x.filter((y) => y !== s) : [...x, s]))} />)}
        <Button label="Request selected services" kind="secondary" disabled={!services.length} onPress={() => log('ACUTE_SERVICES', services.join(', '))} />
      </Card>

      <SectionTitle title="Safety-net & follow-up" />
      <Card>
        <Choice value={net} onChange={setNet} options={SAFETY_NET.map((s) => ({ key: s, label: s }))} />
        <Text style={[type.h3, { marginVertical: spacing.sm }]}>Reassess / follow-up</Text>
        <Choice value={followUp} onChange={setFollowUp} options={[{ key: '6h', label: 'Reassess in 6 h (check-in)' }, { key: '24h', label: 'Reassess in 24 h' }, { key: '72h', label: 'Follow-up in 72 h' }]} />
        <Button label="Send instructions & book follow-up" disabled={!net || !followUp} onPress={() => log('SAFETY_NET', `${net} · ${followUp}`)} />
      </Card>

      <SectionTitle title="Cannot contact patient – retry ladder" />
      <Card>
        {LADDER.map((s, i) => {
          const done = attempts.find((a) => a.step === s);
          const enabled = i === 0 || attempts.some((a) => a.step === LADDER[i - 1]);
          return (
            <View key={s} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6 }}>
              <Text style={[type.body, { flex: 1, color: enabled ? colors.text : colors.textSoft }]}>{i + 1}. {s}</Text>
              {done ? <Pill label={clock(done.at)} color={colors.stable} /> : (
                <Text accessibilityRole="button" onPress={() => { if (!enabled) return; setAttempts((a) => [...a, { step: s, at: Date.now() }]); log('CONTACT_ATTEMPT', s); }} style={{ color: enabled ? colors.primary : colors.textSoft, fontWeight: '700' }}>Log attempt</Text>
              )}
            </View>
          );
        })}
        <Text style={type.tiny}>Steps cannot be skipped. Each attempt is timestamped in the audit log.</Text>
      </Card>

      <SectionTitle title="Other exceptions" />
      <Card>
        <Choice value={exception} onChange={setException} options={EXCEPTIONS.map((e) => ({ key: e.key, label: e.label, hint: e.action }))} />
        <Button label="Record exception & create task" kind="secondary" disabled={!exception} onPress={() => log('ACUTE_EXCEPTION', exception)} />
      </Card>

      {!hasAcuteNote ? <Banner tone="warn" title="Sign an assessment & plan before closing" /> : null}
      <Button label="Close / escalate episode" icon="exit-outline" disabled={!hasAcuteNote} onPress={() => nav.navigate('AcuteClosure', { patientId })} />
    </Screen>
  );
}

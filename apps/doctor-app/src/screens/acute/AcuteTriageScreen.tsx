/**
 * AC-D-02 Identity, Consent & Red-Flag Review + AC-D-03 Triage.
 * Any red flag (or "not sure") → emergency immediately. Down-triage needs a reason. Protocol version stored.
 * The red-flag list below is ILLUSTRATIVE – the CGC owns the approved list.
 */
import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Banner, Button, Card, CheckRow, Choice, Field, Pill, Screen, SectionTitle, Stepper } from '../../components/ui';
import { PatientHeader } from '../../components/clinical';
import { colors, spacing, type } from '../../theme/tokens';
import { uid, useStore } from '../../store/AppStore';
import { useParams, useRootNav } from '../../navigation/hooks';
import type { Episode } from '../../types/models';
import { latest } from '../../utils/clinical';

const PROTOCOL = 'MYDR24-TELETRIAGE (ATP-adapted) v0.1-DRAFT';
const RED_FLAGS = [
  'Signs of stroke (face droop, arm weakness, speech difficulty)',
  'Chest pain suggestive of heart attack',
  'Severe difficulty breathing / cannot speak in sentences',
  'Major bleeding',
  'Unresponsive / severely altered consciousness',
  'Seizure now or not recovering',
  'Signs of anaphylaxis (swelling of lips/throat, wheeze, collapse)',
  'Severe injury',
];
type Ans = 'NO' | 'YES' | 'UNSURE';
type U = NonNullable<Episode['urgency']>;
const order: U[] = ['EMERGENCY', 'URGENT', 'SOON', 'ROUTINE'];

export default function AcuteTriageScreen() {
  const { patientId } = useParams<'AcuteTriage'>();
  const nav = useRootNav();
  const { patient, dispatch, doctor } = useStore();
  const p = patient(patientId)!;
  const ep = p.episodes.find((e) => e.pathway === 'ACU');
  const [idOk, setIdOk] = useState(false);
  const [consentOk, setConsentOk] = useState(false);
  const [ans, setAns] = useState<Ans[]>(RED_FLAGS.map(() => 'NO'));
  const [answered, setAnswered] = useState<boolean[]>(RED_FLAGS.map(() => false));
  const [urgency, setUrgency] = useState<U>();
  const [downReason, setDownReason] = useState('');

  const positive = ans.some((a, i) => answered[i] && a !== 'NO');
  const allAnswered = answered.every(Boolean);

  /** Draft suggestion only – replace with the approved protocol engine. */
  const suggested: U = useMemo(() => {
    const hr = latest(p.observations, 'HR')?.value;
    const spo2 = latest(p.observations, 'SPO2')?.value;
    const t = latest(p.observations, 'TEMP')?.value;
    if ((hr && hr > 110) || (spo2 && spo2 < 94) || (t && t >= 102)) return 'URGENT';
    if (p.observations.length === 0) return 'URGENT';
    return 'SOON';
  }, [p.observations]);

  const isDown = urgency !== undefined && order.indexOf(urgency) > order.indexOf(suggested);
  const canSave = idOk && consentOk && allAnswered && !positive && !!urgency && (!isDown || downReason.trim().length >= 10);

  const routeEmergency = () => {
    dispatch({ type: 'RAISE_EVENT', event: { id: uid('ev'), patientId, pathway: 'ACU', type: 'EMERGENCY_REQUEST', cls: 'E', title: 'Red flag positive at acute intake', detail: RED_FLAGS.filter((_, i) => answered[i] && ans[i] !== 'NO').join('; '), ruleId: 'ACU-REDFLAG', ruleVersion: PROTOCOL, at: Date.now(), status: 'OPEN' } });
    if (ep) dispatch({ type: 'UPSERT_EPISODE', patientId, episode: { ...ep, status: 'EMERGENCY_ROUTED', urgency: 'EMERGENCY' } });
    nav.replace('Emergency', { patientId });
  };

  const save = () => {
    if (!ep || !urgency) return;
    dispatch({ type: 'UPSERT_EPISODE', patientId, episode: { ...ep, status: 'TRIAGED', urgency, responsibleClinician: doctor.name } });
    dispatch({ type: 'AUDIT', entry: { action: 'TRIAGE', patientId, detail: `${PROTOCOL} · suggested ${suggested} · chosen ${urgency}${isDown ? ` · down-triage: ${downReason}` : ''}` } });
    nav.replace('AcuteWorkspace', { patientId });
  };

  const setA = (i: number, a: Ans) => {
    setAns((s) => s.map((x, j) => (j === i ? a : x)));
    setAnswered((s) => s.map((x, j) => (j === i ? true : x)));
  };

  return (
    <Screen>
      <Stepper steps={['Identity', 'Red flags', 'Triage', 'Consult']} current={!idOk || !consentOk ? 0 : !allAnswered ? 1 : 2} />
      <PatientHeader p={p} />
      <Card>
        <SectionTitle title="1 · Identity & consent" />
        <CheckRow label="Identity verified (2 identifiers / ABHA OTP)" value={idOk} onChange={setIdOk} />
        <CheckRow label="Tele-consultation consent recorded" value={consentOk} onChange={setConsentOk} />
      </Card>

      <Card accent={positive ? colors.critical : undefined}>
        <SectionTitle title="2 · Emergency red flags" />
        <Text style={[type.tiny, { marginBottom: 6 }]}>Illustrative list – CGC-approved list required. “Not sure” counts as positive.</Text>
        {RED_FLAGS.map((r, i) => (
          <View key={r} style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={type.body}>{r}</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: 6 }}>
              {(['NO', 'YES', 'UNSURE'] as Ans[]).map((a) => {
                const sel = answered[i] && ans[i] === a;
                const c = a === 'NO' ? colors.stable : colors.critical;
                return (
                  <Text key={a} accessibilityRole="button" onPress={() => setA(i, a)} style={{ paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: sel ? c : colors.border, color: sel ? c : colors.text, backgroundColor: sel ? `${c}1A` : colors.card, fontWeight: '700', overflow: 'hidden' }}>
                    {a === 'UNSURE' ? 'Not sure' : a === 'NO' ? 'No' : 'Yes'}
                  </Text>
                );
              })}
            </View>
          </View>
        ))}
      </Card>

      {positive ? (
        <>
          <Banner tone="danger" title="RED FLAG – route to emergency now" text="Do not continue routine triage. Call 108/112, notify command centre, guide caregiver." />
          <Button label="Route to emergency" kind="danger" icon="alert-circle" onPress={routeEmergency} />
        </>
      ) : null}

      {!positive && allAnswered ? (
        <Card>
          <SectionTitle title="3 · Urgency (approved protocol)" />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <Text style={[type.small, { flex: 1 }]}>Protocol {PROTOCOL}</Text>
            <Pill label={`Suggested: ${suggested}`} color={colors.urgent} />
          </View>
          <Choice<U> value={urgency} onChange={setUrgency} options={[{ key: 'URGENT', label: 'Urgent', hint: 'Clinician contact – target per service policy' }, { key: 'SOON', label: 'Soon' }, { key: 'ROUTINE', label: 'Routine' }]} />
          {isDown ? <Field label="Down-triage reason (required)" value={downReason} onChangeText={setDownReason} multiline placeholder="Why is a lower urgency than suggested safe?" /> : null}
          <Button label="Save triage & open consultation" icon="arrow-forward" disabled={!canSave} onPress={save} />
        </Card>
      ) : null}
    </Screen>
  );
}

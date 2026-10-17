/**
 * D-09 Initial Care Plan & Order Set → activates the Virtual IPD encounter.
 * Records a pathway transition (UD-D-03) – ACU episode closes; CCM is SUSPENDED, never cancelled.
 */
import React, { useState } from 'react';
import { CommonActions } from '@react-navigation/native';
import { Text, View } from 'react-native';
import { Banner, Button, Card, CheckRow, Choice, Field, Screen, SectionTitle, Stepper } from '../../components/ui';
import { PatientHeader } from '../../components/clinical';
import { spacing, type } from '../../theme/tokens';
import { uid, useStore } from '../../store/AppStore';
import { useParams, useRootNav } from '../../navigation/hooks';
import type { Tier } from '../../types/models';

const ORDER_SETS = ['Community-acquired pneumonia', 'Heart-failure exacerbation', 'COPD exacerbation', 'Cellulitis', 'Complicated UTI', 'Post-operative', 'T3 Home-ICU (chronic)'];
const GOALS = ['Infection control', 'SpO₂ within patient target', 'Early mobilisation', 'Nutrition support', 'Pain controlled'];
const INTERVENTIONS = ['IV antibiotics per order set', 'Nebulisation', 'Physiotherapy daily', 'Diet plan (high protein)', 'Twice-daily nursing visits'];

export default function CarePlanScreen() {
  const { patientId } = useParams<'CarePlan'>();
  const nav = useRootNav();
  const { patient, dispatch, doctor } = useStore();
  const p = patient(patientId)!;
  const [orderSet, setOrderSet] = useState<string>();
  const [tier, setTier] = useState<Tier>('T1');
  const [days, setDays] = useState('7');
  const [goals, setGoals] = useState<string[]>([GOALS[0], GOALS[1]]);
  const [ints, setInts] = useState<string[]>([INTERVENTIONS[0], INTERVENTIONS[4]]);
  const tog = (arr: string[], set: (v: string[]) => void, x: string) => set(arr.includes(x) ? arr.filter((y) => y !== x) : [...arr, x]);

  const activate = () => {
    const now = Date.now();
    const from = p.episodes.find((e) => e.pathway === 'ACU') ? 'ACU' : p.episodes.find((e) => e.pathway === 'CCM') ? 'CCM' : 'NONE';
    p.episodes.forEach((e) => {
      if (e.pathway === 'ACU') dispatch({ type: 'REMOVE_EPISODE', patientId, episodeId: e.id });
      if (e.pathway === 'CCM') dispatch({ type: 'UPSERT_EPISODE', patientId, episode: { ...e, status: 'SUSPENDED_FOR_IPD' } });
    });
    dispatch({ type: 'UPSERT_EPISODE', patientId, episode: { id: uid('e'), pathway: 'VIPD', status: 'ADMITTED', responsibleClinician: doctor.name, tier, day: 1 } });
    dispatch({
      type: 'RECORD_TRANSITION',
      transition: {
        id: uid('tr'), patientId, from, to: 'VIPD', trigger: 'Admission eligibility passed (D-04)',
        rationale: `Order set: ${orderSet}; goals: ${goals.join(', ')}`, authorisedBy: `${doctor.name} (${doctor.regNo})`, at: now,
        outstandingTasks: ['Home setup ≤ 4 h', 'First RN visit ≤ 2 h after arrival'], handover: 'NOT_REQUIRED',
      },
    });
    nav.dispatch(CommonActions.reset({ index: 1, routes: [{ name: 'Main' }, { name: 'PatientChart', params: { patientId } }] }));
  };

  return (
    <Screen>
      <Stepper steps={['Eligibility', 'Consent', 'Baseline', 'Plan']} current={3} />
      <PatientHeader p={p} compact />
      <Card>
        <SectionTitle title="Condition order set" />
        <Choice options={ORDER_SETS.map((o) => ({ key: o, label: o }))} value={orderSet} onChange={setOrderSet} />
      </Card>
      <Card>
        <SectionTitle title="Tier & duration" />
        <Choice<Tier> value={tier} onChange={setTier} options={[{ key: 'T1', label: 'T1 · Virtual IPD (ward level)' }, { key: 'T2', label: 'T2 · High-dependency / step-down' }, { key: 'T3', label: 'T3 · Chronic Home-ICU' }]} />
        <Field label="Estimated duration" unit="days" keyboardType="numeric" value={days} onChangeText={(x) => setDays(x.replace(/\D/g, '').slice(0, 2))} />
      </Card>
      <Card>
        <SectionTitle title="Goals" />
        {GOALS.map((g) => <CheckRow key={g} label={g} value={goals.includes(g)} onChange={() => tog(goals, setGoals, g)} />)}
      </Card>
      <Card>
        <SectionTitle title="Interventions" />
        {INTERVENTIONS.map((g) => <CheckRow key={g} label={g} value={ints.includes(g)} onChange={() => tog(ints, setInts, g)} />)}
      </Card>
      {p.episodes.some((e) => e.pathway === 'CCM') ? <Banner tone="info" title="Chronic care plan will be SUSPENDED (not cancelled)" text="A post-acute review is required at Virtual IPD discharge." /> : null}
      <View style={{ marginTop: spacing.sm }}>
        <Text style={[type.tiny, { marginBottom: 4 }]}>Signing as {doctor.name} · {doctor.regNo}</Text>
        <Button label="Sign & activate Virtual IPD" icon="checkmark-circle" disabled={!orderSet || goals.length === 0} onPress={activate} />
      </View>
    </Screen>
  );
}

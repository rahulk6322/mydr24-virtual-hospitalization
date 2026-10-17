/**
 * CC-D-12 Chronic Reassessment Decision (+ CC-D-10 trends, CC-D-08 plan summary).
 * Options: manage in CCM, open Acute episode, urgent visit, assess for Virtual IPD (D-04), ED.
 * AI/rules may suggest – only a clinician decides (no AI-only admission).
 */
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Banner, Button, Card, Choice, Field, KeyValue, Pill, Screen, SectionTitle } from '../../components/ui';
import { PatientHeader, TrendChart } from '../../components/clinical';
import { colors, spacing, type } from '../../theme/tokens';
import { uid, useStore } from '../../store/AppStore';
import { useParams, useRootNav } from '../../navigation/hooks';
import { DAY, ago, series } from '../../utils/clinical';
import type { VitalCode } from '../../types/models';

type D = 'MANAGE' | 'ACUTE' | 'VISIT' | 'VIPD' | 'ED';

export default function ChronicReassessScreen() {
  const { patientId } = useParams<'ChronicReassess'>();
  const nav = useRootNav();
  const { patient, dispatch, doctor, openEvents } = useStore();
  const p = patient(patientId)!;
  const ep = p.episodes.find((e) => e.pathway === 'CCM');
  const evs = openEvents.filter((e) => e.patientId === patientId && e.pathway === 'CCM');
  const [d, setD] = useState<D>();
  const [assessment, setAssessment] = useState('');
  const codes = (['WT', 'SBP', 'HR', 'GLU'] as VitalCode[]).filter((c) => p.observations.some((o) => o.code === c));
  const last = [...p.observations].sort((a, b) => b.at - a.at)[0];

  const confirm = () => {
    dispatch({ type: 'AUDIT', entry: { action: 'CCM_REASSESSMENT', patientId, detail: `${d} · ${assessment}` } });
    if (d === 'VIPD') return nav.navigate('Eligibility', { patientId });
    if (d === 'ED') return nav.navigate('Emergency', { patientId });
    if (d === 'ACUTE') {
      dispatch({ type: 'UPSERT_EPISODE', patientId, episode: { id: uid('e'), pathway: 'ACU', status: 'INTAKE', responsibleClinician: doctor.name } });
      dispatch({ type: 'RECORD_TRANSITION', transition: { id: uid('tr'), patientId, from: 'CCM', to: 'ACU', trigger: evs[0]?.ruleId ?? 'Clinician', rationale: assessment, authorisedBy: `${doctor.name} (${doctor.regNo})`, at: Date.now(), outstandingTasks: ['Red-flag screen'], handover: 'NOT_REQUIRED' } });
      return nav.replace('AcuteTriage', { patientId });
    }
    if (ep) dispatch({ type: 'UPSERT_EPISODE', patientId, episode: { ...ep, status: 'ACTIVE', nextReview: Date.now() + (d === 'VISIT' ? 1 : 7) * DAY } });
    evs.forEach((e) => dispatch({ type: 'RESOLVE_EVENT', id: e.id, resolution: d === 'VISIT' ? 'Urgent nurse visit arranged' : 'Managed in CCM – plan updated' }));
    nav.goBack();
  };

  return (
    <Screen>
      <PatientHeader p={p} />
      {evs.map((e) => <Banner key={e.id} tone={e.cls === 'U' ? 'warn' : 'info'} title={e.title} text={`${e.detail} · rule ${e.ruleId} ${e.ruleVersion}`} />)}
      <Card>
        <KeyValue k="Programme" v={ep?.programme ?? '—'} />
        <KeyValue k="Status" v={ep?.status.replace(/_/g, ' ') ?? '—'} />
        <KeyValue k="Last reading" v={last ? ago(last.at) : 'none'} />
        <KeyValue k="Active medicines" v={p.meds.map((m) => m.name).join(', ') || '—'} />
      </Card>
      <SectionTitle title="Longitudinal trends (gaps not filled)" />
      {codes.map((c) => <TrendChart key={c} label={c === 'WT' ? 'Weight' : c === 'SBP' ? 'Systolic BP' : c === 'GLU' ? 'Glucose' : 'Heart rate'} data={series(p.observations, c, 30 * DAY)} unit={p.observations.find((o) => o.code === c)?.unit} />)}
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
          <Text style={[type.h3, { flex: 1 }]}>Decision</Text>
          <Pill label="Clinician decides" color={colors.primary} />
        </View>
        <Choice<D>
          value={d}
          onChange={setD}
          options={[
            { key: 'MANAGE', label: 'Manage within chronic care', hint: 'Update plan / medication review' },
            { key: 'VISIT', label: 'Urgent nurse visit + review in 24 h' },
            { key: 'ACUTE', label: 'Open Acute Care episode', hint: 'Chronic care stays active & linked' },
            { key: 'VIPD', label: 'Assess for Virtual IPD', hint: 'Formal eligibility (D-04)' },
            { key: 'ED', label: 'Emergency / hospital' },
          ]}
        />
        <Field label="Clinical assessment (required)" value={assessment} onChangeText={setAssessment} multiline placeholder="Symptoms, examination, reasoning" />
      </Card>
      <Button label="Confirm decision" icon="checkmark-circle" disabled={!d || assessment.trim().length < 10} onPress={confirm} />
      <Button label="Chronic review note" kind="secondary" icon="create-outline" onPress={() => nav.navigate('SoapNote', { patientId, kind: 'REVIEW' })} />
    </Screen>
  );
}

/**
 * D-32 Discharge – 3 steps: checklist → summary (sign) → continuity (TR-05 chronic / TR-06 RPM / follow-up).
 * Chronic plans suspended at admission resume as a NEW version after post-acute review.
 */
import React, { useState } from 'react';
import { CommonActions } from '@react-navigation/native';
import { Text } from 'react-native';
import { Banner, Button, Card, CheckRow, Choice, Field, KeyValue, Screen, Stepper } from '../../components/ui';
import { PatientHeader } from '../../components/clinical';
import { spacing, type } from '../../theme/tokens';
import { uid, useStore } from '../../store/AppStore';
import { useParams, useRootNav } from '../../navigation/hooks';

const CHECKS = ['Clinically stable for ≥ 24–48 h', 'Medications reconciled', 'Caregiver trained', 'Follow-up appointment booked', 'Device pickup scheduled', 'Home-care instructions given', 'Red-flag symptoms explained in patient language'];
type Next = 'CCM' | 'RPM' | 'FOLLOW_UP';

export default function DischargeScreen() {
  const { patientId } = useParams<'Discharge'>();
  const nav = useRootNav();
  const { patient, dispatch, doctor, openEvents } = useStore();
  const p = patient(patientId)!;
  const [step, setStep] = useState(0);
  const [checks, setChecks] = useState<boolean[]>(CHECKS.map(() => false));
  const [course, setCourse] = useState(`Admitted to Virtual IPD with ${p.diagnosis.toLowerCase()}. Treated per order set; clinically improved.`);
  const [next, setNext] = useState<Next>(p.episodes.some((e) => e.pathway === 'CCM') ? 'CCM' : 'RPM');
  const critical = openEvents.filter((e) => e.patientId === patientId && (e.cls === 'E' || e.cls === 'U'));
  const allChecked = checks.every(Boolean);

  const finish = () => {
    const vipd = p.episodes.find((e) => e.pathway === 'VIPD');
    if (vipd) dispatch({ type: 'REMOVE_EPISODE', patientId, episodeId: vipd.id });
    const ccm = p.episodes.find((e) => e.pathway === 'CCM');
    if (next === 'CCM') {
      if (ccm) dispatch({ type: 'UPSERT_EPISODE', patientId, episode: { ...ccm, status: 'POST_ACUTE_REVIEW' } });
      else dispatch({ type: 'UPSERT_EPISODE', patientId, episode: { id: uid('e'), pathway: 'CCM', status: 'ENROLLED', responsibleClinician: doctor.name, programme: 'Post-discharge continuity' } });
    }
    if (next === 'RPM') dispatch({ type: 'UPSERT_EPISODE', patientId, episode: { id: uid('e'), pathway: 'RPM', status: 'ACTIVE', responsibleClinician: doctor.name, serviceLevel: 'RPM-L2' } });
    dispatch({ type: 'ADD_NOTE', patientId, note: { id: uid('n'), kind: 'REVIEW', author: doctor.name, at: Date.now(), summary: `Discharge summary: ${course}`, signed: true } });
    dispatch({ type: 'RECORD_TRANSITION', transition: { id: uid('tr'), patientId, from: 'VIPD', to: next, trigger: 'Virtual IPD discharge', rationale: course, authorisedBy: `${doctor.name} (${doctor.regNo})`, at: Date.now(), outstandingTasks: ['Device pickup ≤ 24 h', '30-day follow-up schedule'], handover: next === 'FOLLOW_UP' ? 'NOT_REQUIRED' : 'PENDING' } });
    nav.dispatch(CommonActions.reset({ index: 1, routes: [{ name: 'Main' }, { name: 'PatientChart', params: { patientId } }] }));
  };

  return (
    <Screen>
      <Stepper steps={['Checklist', 'Summary', 'Continuity']} current={step} />
      <PatientHeader p={p} compact />
      {critical.length ? <Banner tone="danger" title="Open emergency/urgent events" text="Resolve them before discharge." /> : null}

      {step === 0 ? (
        <Card>
          {CHECKS.map((c, i) => <CheckRow key={c} label={c} value={checks[i]} onChange={() => setChecks((s) => s.map((v, j) => (j === i ? !v : v)))} />)}
          <Button label="Mark for discharge" icon="arrow-forward" disabled={!allChecked || critical.length > 0} onPress={() => setStep(1)} />
        </Card>
      ) : null}

      {step === 1 ? (
        <Card>
          <KeyValue k="Patient" v={`${p.name} · ${p.age}${p.sex} · ${p.uhid}`} />
          <KeyValue k="Diagnosis" v={p.diagnosis} />
          <Field label="Hospital course (edit before signing)" value={course} onChangeText={setCourse} multiline />
          <Text style={[type.h3, { marginBottom: 4 }]}>Discharge medications</Text>
          {p.meds.filter((m) => m.status !== 'HELD').map((m) => <Text key={m.id} style={type.body}>• {m.name} {m.dose} {m.route} {m.frequency}</Text>)}
          <Text style={[type.tiny, { marginTop: spacing.sm }]}>Signed summary is pushed to the patient app and ABHA (ABDM DischargeSummary) if consented.</Text>
          <Button label={`Sign summary as ${doctor.name}`} icon="create" disabled={course.trim().length < 20} onPress={() => setStep(2)} />
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <Text style={[type.h3, { marginBottom: spacing.sm }]}>Continuity after discharge</Text>
          <Choice<Next>
            value={next}
            onChange={setNext}
            options={[
              { key: 'CCM', label: 'Chronic Care follow-up', hint: 'Post-acute review → care plan new version' },
              { key: 'RPM', label: 'Remote monitoring 14 days (RPM-L2)', hint: 'Reviewer + service level assigned' },
              { key: 'FOLLOW_UP', label: 'Routine follow-up only' },
            ]}
          />
          <Button label="Complete discharge" icon="checkmark-circle" onPress={finish} />
        </Card>
      ) : null}
    </Screen>
  );
}

/**
 * UD-D-03 Pathway Transition Request & Authorisation (master spec §4).
 * Mandatory: trigger, rationale, authoriser, outstanding tasks, handover status.
 * Virtual IPD can only be entered via D-04 eligibility; emergencies go straight to the console.
 */
import React, { useState } from 'react';
import { Text } from 'react-native';
import { Banner, Button, Card, CheckRow, Choice, Field, Screen } from '../../components/ui';
import { PatientHeader, pathwayMeta } from '../../components/clinical';
import { spacing, type } from '../../theme/tokens';
import { uid, useStore } from '../../store/AppStore';
import { useParams, useRootNav } from '../../navigation/hooks';
import type { Transition } from '../../types/models';

type To = 'ACU' | 'CCM' | 'VIPD' | 'RPM' | 'FOLLOW_UP' | 'HOSPITAL' | 'CLOSED';
const TASKS = ['Pending results', 'Medication reconciliation', 'Device return / reassignment', 'Follow-up appointment', 'Family informed'];

export default function TransitionScreen() {
  const { patientId, from } = useParams<'Transition'>();
  const nav = useRootNav();
  const { patient, dispatch, doctor } = useStore();
  const p = patient(patientId)!;
  const [to, setTo] = useState<To>();
  const [trigger, setTrigger] = useState('');
  const [rationale, setRationale] = useState('');
  const [tasks, setTasks] = useState<string[]>([]);
  const [handover, setHandover] = useState(true);
  const [done, setDone] = useState(false);

  const fromPw = from ?? p.episodes[0]?.pathway;
  const ok = !!to && trigger.trim().length >= 3 && rationale.trim().length >= 10;

  const authorise = () => {
    if (to === 'VIPD') return nav.navigate('Eligibility', { patientId });
    if (to === 'HOSPITAL') return nav.navigate('Emergency', { patientId });
    const now = Date.now();
    if (to === 'ACU' || to === 'CCM' || to === 'RPM') {
      dispatch({
        type: 'UPSERT_EPISODE', patientId,
        episode: { id: uid('e'), pathway: to, status: to === 'ACU' ? 'INTAKE' : 'ACTIVE', responsibleClinician: doctor.name, programme: to === 'CCM' ? 'To be assigned at enrolment' : undefined, serviceLevel: to === 'RPM' ? 'RPM-L2' : undefined },
      });
    }
    if ((to === 'FOLLOW_UP' || to === 'CLOSED') && fromPw) {
      const e = p.episodes.find((x) => x.pathway === fromPw);
      if (e) dispatch({ type: 'REMOVE_EPISODE', patientId, episodeId: e.id });
    }
    const t: Transition = {
      id: uid('tr'), patientId, from: fromPw ?? 'NONE', to: to!, trigger, rationale,
      authorisedBy: `${doctor.name} (${doctor.regNo})`, at: now, outstandingTasks: tasks, handover: handover ? 'PENDING' : 'NOT_REQUIRED',
    };
    dispatch({ type: 'RECORD_TRANSITION', transition: t });
    setDone(true);
  };

  return (
    <Screen>
      <PatientHeader p={p} compact />
      <Card>
        <Text style={type.small}>From</Text>
        <Text style={type.h3}>{fromPw ? pathwayMeta[fromPw].label : 'No active episode'}</Text>
      </Card>
      <Card>
        <Text style={[type.h3, { marginBottom: spacing.sm }]}>To</Text>
        <Choice<To>
          value={to}
          onChange={setTo}
          options={[
            { key: 'ACU', label: 'Acute Care assessment', hint: 'Chronic stays active and linked' },
            { key: 'VIPD', label: 'Virtual IPD assessment', hint: 'Opens formal eligibility (D-04) – not direct admission' },
            { key: 'CCM', label: 'Chronic Care follow-up', hint: 'Enrolment & care plan required' },
            { key: 'RPM', label: 'Routine monitoring (RPM)', hint: 'Monitoring plan + reviewer + service level' },
            { key: 'FOLLOW_UP', label: 'Routine follow-up (close current episode)' },
            { key: 'HOSPITAL', label: 'Emergency hospital transfer', hint: 'Emergency first – documentation after' },
            { key: 'CLOSED', label: 'Close / withdraw' },
          ]}
        />
      </Card>
      <Card>
        <Field label="Initiating event" value={trigger} onChangeText={setTrigger} placeholder="e.g. HF weight alert HF-WT-01, patient request" />
        <Field label="Clinical rationale (required)" value={rationale} onChangeText={setRationale} multiline />
        <Text style={[type.h3, { marginBottom: 4 }]}>Outstanding tasks</Text>
        {TASKS.map((x) => <CheckRow key={x} label={x} value={tasks.includes(x)} onChange={() => setTasks((s) => (s.includes(x) ? s.filter((y) => y !== x) : [...s, x]))} />)}
        <CheckRow label="Handover to receiving team required" value={handover} onChange={setHandover} />
      </Card>
      <Banner tone="info" title={`Authorising as ${doctor.name}`} text={`${doctor.regNo} · AI suggestions can never complete a transition.`} />
      {done ? <Banner tone="success" title="Transition recorded" text={handover ? 'Handover pending acceptance by the receiving team.' : 'No handover required.'} /> : null}
      <Button label={to === 'VIPD' ? 'Continue to eligibility' : to === 'HOSPITAL' ? 'Open emergency console' : 'Authorise transition'} icon="git-compare-outline" disabled={!ok || done} onPress={authorise} />
    </Screen>
  );
}

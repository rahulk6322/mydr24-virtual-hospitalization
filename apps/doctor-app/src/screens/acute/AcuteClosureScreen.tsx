/**
 * AC-D-11 Acute Closure / Escalation. Closure blocked while a critical event is unacknowledged.
 * VIPD → formal eligibility (D-04); hospital → emergency console. Transition record always written.
 */
import React, { useState } from 'react';
import { CommonActions } from '@react-navigation/native';
import { Text } from 'react-native';
import { Banner, Button, Card, Choice, Field, Screen } from '../../components/ui';
import { PatientHeader } from '../../components/clinical';
import { spacing, type } from '../../theme/tokens';
import { uid, useStore } from '../../store/AppStore';
import { useParams, useRootNav } from '../../navigation/hooks';

type O = 'RESOLVED' | 'REFERRED' | 'VIPD' | 'HOSPITAL' | 'CHRONIC';

export default function AcuteClosureScreen() {
  const { patientId } = useParams<'AcuteClosure'>();
  const nav = useRootNav();
  const { patient, dispatch, doctor, openEvents } = useStore();
  const p = patient(patientId)!;
  const ep = p.episodes.find((e) => e.pathway === 'ACU');
  const [o, setO] = useState<O>();
  const [note, setNote] = useState('');
  const blocking = openEvents.filter((e) => e.patientId === patientId && (e.cls === 'E' || e.cls === 'U') && e.status === 'OPEN');

  const confirm = () => {
    if (o === 'VIPD') return nav.navigate('Eligibility', { patientId });
    if (o === 'HOSPITAL') return nav.navigate('Emergency', { patientId });
    if (ep) dispatch({ type: 'REMOVE_EPISODE', patientId, episodeId: ep.id });
    if (o === 'CHRONIC') dispatch({ type: 'UPSERT_EPISODE', patientId, episode: { id: uid('e'), pathway: 'CCM', status: 'REFERRED', responsibleClinician: doctor.name, programme: 'To be assigned' } });
    dispatch({
      type: 'RECORD_TRANSITION',
      transition: { id: uid('tr'), patientId, from: 'ACU', to: o === 'CHRONIC' ? 'CCM' : o === 'RESOLVED' ? 'FOLLOW_UP' : 'CLOSED', trigger: 'Acute episode closure', rationale: `${o}: ${note}`, authorisedBy: `${doctor.name} (${doctor.regNo})`, at: Date.now(), outstandingTasks: o === 'REFERRED' ? ['Specialist acceptance'] : ['Follow-up check-in'], handover: o === 'REFERRED' || o === 'CHRONIC' ? 'PENDING' : 'NOT_REQUIRED' },
    });
    nav.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Main', params: { screen: 'Acute' } }] }));
  };

  return (
    <Screen>
      <PatientHeader p={p} compact />
      {blocking.length ? <Banner tone="danger" title="Unacknowledged emergency/urgent event" text="Acknowledge or resolve it before closing (escalation is still allowed)." /> : null}
      <Card>
        <Text style={[type.h3, { marginBottom: spacing.sm }]}>Outcome</Text>
        <Choice<O>
          value={o}
          onChange={setO}
          options={[
            { key: 'RESOLVED', label: 'Resolved – routine follow-up', hint: 'Safety-net documented' },
            { key: 'REFERRED', label: 'Referred to specialist' },
            { key: 'CHRONIC', label: 'Refer to Chronic Care programme' },
            { key: 'VIPD', label: 'Assess for Virtual IPD', hint: 'Opens formal eligibility – not direct admission' },
            { key: 'HOSPITAL', label: 'Hospital / emergency transfer' },
          ]}
        />
        <Field label="Closure note" value={note} onChangeText={setNote} multiline />
      </Card>
      <Button
        label={o === 'VIPD' ? 'Continue to eligibility' : o === 'HOSPITAL' ? 'Open emergency console' : 'Close episode'}
        icon="checkmark-circle"
        disabled={!o || (o !== 'HOSPITAL' && o !== 'VIPD' && (blocking.length > 0 || note.trim().length < 5))}
        onPress={confirm}
      />
    </Screen>
  );
}

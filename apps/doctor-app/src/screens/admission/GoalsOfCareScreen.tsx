/** D-07 Goals of Care & Code Status – drives what the Emergency console offers (D-25). */
import React, { useState } from 'react';
import { Text } from 'react-native';
import { Banner, Button, Card, CheckRow, Choice, Field, Screen } from '../../components/ui';
import { PatientHeader } from '../../components/clinical';
import { spacing, type } from '../../theme/tokens';
import { useStore } from '../../store/AppStore';
import { useParams, useRootNav } from '../../navigation/hooks';
import type { CodeStatus } from '../../types/models';

export default function GoalsOfCareScreen() {
  const { patientId, next } = useParams<'GoalsOfCare'>();
  const nav = useRootNav();
  const { patient, dispatch } = useStore();
  const p = patient(patientId)!;
  const [status, setStatus] = useState<CodeStatus | undefined>(p.codeStatus === 'UNKNOWN' ? undefined : p.codeStatus);
  const [icu, setIcu] = useState(true);
  const [surrogate, setSurrogate] = useState(p.caregiver[0] ? `${p.caregiver[0].name} (${p.caregiver[0].relation})` : '');
  const [note, setNote] = useState('');
  const ok = !!status && (status === 'FULL' || note.trim().length >= 10);

  return (
    <Screen>
      <PatientHeader p={p} compact />
      <Card>
        <Text style={[type.h3, { marginBottom: spacing.sm }]}>Code status</Text>
        <Choice<CodeStatus>
          value={status}
          onChange={setStatus}
          options={[
            { key: 'FULL', label: 'Full code', hint: 'All resuscitation measures' },
            { key: 'LIMITED', label: 'Limited treatment', hint: 'Specify limits below (e.g. no intubation)' },
            { key: 'DNR', label: 'Do not resuscitate (DNR)', hint: 'Comfort-focused emergency pathway' },
          ]}
        />
        <CheckRow label="Escalation ceiling includes transfer to hospital ICU" value={icu} onChange={setIcu} />
      </Card>
      <Card>
        <Field label="Surrogate decision-maker" value={surrogate} onChangeText={setSurrogate} />
        <Field label={`Discussion note${status && status !== 'FULL' ? ' (required)' : ''}`} value={note} onChangeText={setNote} multiline placeholder="Who was present, what was discussed, patient wishes" />
      </Card>
      <Banner tone="info" title="Shown on every patient screen" text="The emergency console adapts to this status. Re-confirm on any tier change." />
      <Button
        label={next === 'CareTeam' ? 'Save & continue' : 'Save code status'}
        icon="checkmark"
        disabled={!ok}
        onPress={() => {
          dispatch({ type: 'SET_CODE_STATUS', patientId, codeStatus: status! });
          dispatch({ type: 'AUDIT', entry: { action: 'GOALS_OF_CARE', patientId, detail: `${status} · ICU ceiling ${icu ? 'yes' : 'no'} · ${surrogate}` } });
          if (next === 'CareTeam') nav.navigate('CareTeam', { patientId });
          else nav.goBack();
        }}
      />
    </Screen>
  );
}

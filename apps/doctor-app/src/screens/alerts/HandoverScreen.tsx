/** D-27 Hospital Transfer Handover – FHIR document bundle to receiving facility; records TR-07/TR-08. */
import React, { useState } from 'react';
import { CommonActions } from '@react-navigation/native';
import { Text } from 'react-native';
import { Banner, Button, Card, CheckRow, Choice, KeyValue, Screen } from '../../components/ui';
import { PatientHeader, patientNews2 } from '../../components/clinical';
import { colors, spacing, type } from '../../theme/tokens';
import { uid, useStore } from '../../store/AppStore';
import { useParams, useRootNav } from '../../navigation/hooks';
import { latest } from '../../utils/clinical';

const HOSPITALS = ['City Care Hospital, Patna (partner ED · ICU beds available)', 'AIIMS Patna (tertiary)', 'Paras HMRI (private)'];

export default function HandoverScreen() {
  const { patientId } = useParams<'Handover'>();
  const nav = useRootNav();
  const { patient, dispatch, doctor } = useStore();
  const p = patient(patientId)!;
  const [hosp, setHosp] = useState<string>();
  const [att, setAtt] = useState({ summary: true, vitals: true, labs: true, meds: true, ecg: false });
  const [sent, setSent] = useState(false);
  const g = (c: Parameters<typeof latest>[1]) => latest(p.observations, c)?.value;

  const send = () => {
    const from = p.episodes[0]?.pathway ?? 'NONE';
    p.episodes.forEach((e) => {
      if (e.pathway === 'ACU' || e.pathway === 'VIPD') dispatch({ type: 'REMOVE_EPISODE', patientId, episodeId: e.id });
      if (e.pathway === 'CCM' || e.pathway === 'RPM') dispatch({ type: 'UPSERT_EPISODE', patientId, episode: { ...e, status: 'SUSPENDED_FOR_HOSPITAL' } });
    });
    dispatch({
      type: 'RECORD_TRANSITION',
      transition: {
        id: uid('tr'), patientId, from, to: 'HOSPITAL', trigger: 'Escalation / emergency', rationale: 'Home care no longer appropriate',
        authorisedBy: `${doctor.name} (${doctor.regNo})`, at: Date.now(), outstandingTasks: ['Device pickup', 'Family informed', 'Discharge notice → post-acute review'], handover: 'SENT',
      },
    });
    setSent(true);
  };

  return (
    <Screen>
      <PatientHeader p={p} compact />
      <Card>
        <Text style={[type.h3, { marginBottom: 6 }]}>Handover summary</Text>
        <KeyValue k="Diagnosis" v={p.diagnosis} />
        <KeyValue k="Current vitals" v={`BP ${g('SBP') ?? '—'}/${g('DBP') ?? '—'} · HR ${g('HR') ?? '—'} · SpO₂ ${g('SPO2') ?? '—'}% · RR ${g('RR') ?? '—'}`} />
        <KeyValue k="NEWS2" v={String(patientNews2(p).total)} />
        <KeyValue k="Medications" v={`${p.meds.length} active`} />
        <KeyValue k="Allergies" v={p.allergies.join(', ') || 'NKDA'} vColor={p.allergies.length ? colors.critical : undefined} />
        <KeyValue k="Code status" v={p.codeStatus} />
        <KeyValue k="Recent events" v={p.notes[0]?.summary ?? '—'} />
      </Card>
      <Card>
        <Text style={[type.h3, { marginBottom: spacing.sm }]}>Receiving hospital</Text>
        <Choice value={hosp} onChange={setHosp} options={HOSPITALS.map((h) => ({ key: h, label: h }))} />
      </Card>
      <Card>
        <Text style={[type.h3, { marginBottom: 4 }]}>Attachments</Text>
        {(Object.keys(att) as (keyof typeof att)[]).map((k) => (
          <CheckRow key={k} label={{ summary: 'Clinical summary', vitals: 'Latest vitals & trends', labs: 'Lab reports', meds: 'Medication list & MAR', ecg: 'ECG / imaging' }[k]} value={att[k]} onChange={(v) => setAtt((a) => ({ ...a, [k]: v }))} />
        ))}
      </Card>
      {sent ? (
        <>
          <Banner tone="success" title="Handover package sent" text="Awaiting acceptance from receiving ED. Fallback: secure PDF link + phone call." />
          <Button label="Back to dashboard" onPress={() => nav.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Main' }] }))} />
        </>
      ) : (
        <Button label="Send handover package" icon="send" disabled={!hosp || !att.summary} onPress={send} />
      )}
    </Screen>
  );
}

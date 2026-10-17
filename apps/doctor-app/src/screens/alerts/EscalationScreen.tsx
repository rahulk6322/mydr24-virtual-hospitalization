/** D-26 Escalation Decision – continue at home, upgrade tier, or transfer (opens D-27). */
import React, { useState } from 'react';
import { Text } from 'react-native';
import { Banner, Button, Card, Choice, Field, Screen } from '../../components/ui';
import { PatientHeader, patientNews2 } from '../../components/clinical';
import { spacing, type } from '../../theme/tokens';
import { useStore } from '../../store/AppStore';
import { useParams, useRootNav } from '../../navigation/hooks';

type D = 'CONTINUE' | 'UPGRADE' | 'TRANSFER';
const REASONS = ['Haemodynamic instability', 'Respiratory failure', 'Neurological change', 'Patient / family request', 'Device or home failure', 'Other'];

export default function EscalationScreen() {
  const { patientId, eventId } = useParams<'Escalation'>();
  const nav = useRootNav();
  const { patient, dispatch, events } = useStore();
  const p = patient(patientId)!;
  const r = patientNews2(p);
  const [d, setD] = useState<D | undefined>(r.band === 'HIGH' ? 'TRANSFER' : undefined);
  const [reason, setReason] = useState<string>();
  const [note, setNote] = useState('');
  const ev = events.find((e) => e.id === eventId);
  const ok = !!d && !!reason && (reason !== 'Other' || note.trim().length > 5);

  const confirm = () => {
    dispatch({ type: 'AUDIT', entry: { action: 'ESCALATION_DECISION', patientId, detail: `${d} · ${reason} · ${note}` } });
    if (ev) dispatch({ type: 'ACK_EVENT', id: ev.id });
    if (d === 'TRANSFER') nav.replace('Handover', { patientId });
    else if (d === 'UPGRADE') {
      const vipd = p.episodes.find((e) => e.pathway === 'VIPD');
      if (vipd) dispatch({ type: 'UPSERT_EPISODE', patientId, episode: { ...vipd, tier: vipd.tier === 'T1' ? 'T2' : vipd.tier } });
      nav.goBack();
    } else nav.navigate('Orders', { patientId });
  };

  return (
    <Screen>
      <PatientHeader p={p} compact />
      <Card>
        <Text style={type.h3}>Current status</Text>
        <Text style={type.body}>{ev ? ev.title : 'Clinician-initiated escalation'} · NEWS2 {r.total}{r.complete ? '' : '*'}</Text>
      </Card>
      {r.band === 'HIGH' ? <Banner tone="danger" title="Recommendation: transfer to hospital" text="High NEWS2 band. Rule-based suggestion – the doctor decides." /> : null}
      <Card>
        <Text style={[type.h3, { marginBottom: spacing.sm }]}>Decision</Text>
        <Choice<D> value={d} onChange={setD} options={[{ key: 'CONTINUE', label: 'Continue home care with new orders' }, { key: 'UPGRADE', label: 'Upgrade tier / urgent field visit', hint: 'e.g. T1 → T2 monitoring' }, { key: 'TRANSFER', label: 'Transfer to hospital', hint: 'Opens handover package' }]} />
      </Card>
      <Card>
        <Text style={[type.h3, { marginBottom: spacing.sm }]}>Reason</Text>
        <Choice value={reason} onChange={setReason} options={REASONS.map((x) => ({ key: x, label: x }))} />
        <Field label="Notes" value={note} onChangeText={setNote} multiline />
      </Card>
      <Button label="Confirm escalation" icon="checkmark-circle" disabled={!ok} onPress={confirm} />
    </Screen>
  );
}

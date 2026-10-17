/** D-30 Family Update – only consented recipients; report sharing respects consent scope (DPDP). */
import React, { useState } from 'react';
import { Text } from 'react-native';
import { Banner, Button, Card, CheckRow, Choice, Field, Screen } from '../../components/ui';
import { PatientHeader } from '../../components/clinical';
import { spacing, type } from '../../theme/tokens';
import { uid, useStore } from '../../store/AppStore';
import { useParams } from '../../navigation/hooks';

const TEMPLATES: Record<string, string> = {
  Stable: 'is stable and responding well to treatment. Next review at the evening round.',
  Improving: 'is improving. Oxygen levels and temperature are better today.',
  'Plan change': 'has a change in the treatment plan. The doctor will explain on the next call.',
  'Discharge plan': 'is likely to be discharged from Virtual IPD soon. We will share instructions.',
};

export default function FamilyUpdateScreen() {
  const { patientId } = useParams<'FamilyUpdate'>();
  const { patient, dispatch, doctor } = useStore();
  const p = patient(patientId)!;
  const consented = p.caregiver.filter((c) => c.consentScopes.length > 0);
  const [tpl, setTpl] = useState<string>('Stable');
  const [text, setText] = useState(`${p.name.split(' ')[0]} ${TEMPLATES.Stable}`);
  const [to, setTo] = useState<string[]>(consented.map((c) => c.name));
  const [reports, setReports] = useState(false);
  const [sent, setSent] = useState(false);
  const labsAllowed = consented.filter((c) => to.includes(c.name)).every((c) => c.consentScopes.includes('LABS'));

  return (
    <Screen>
      <PatientHeader p={p} compact />
      {consented.length === 0 ? <Banner tone="danger" title="No consented family recipients" text="Capture a family data-sharing scope (D-05) before sending updates." /> : null}
      <Card>
        <Text style={[type.h3, { marginBottom: spacing.sm }]}>Template</Text>
        <Choice value={tpl} onChange={(k) => { setTpl(k); setText(`${p.name.split(' ')[0]} ${TEMPLATES[k]}`); }} options={Object.keys(TEMPLATES).map((k) => ({ key: k, label: k }))} />
        <Field label="Message (editable, plain language)" value={text} onChangeText={setText} multiline />
      </Card>
      <Card>
        <Text style={[type.h3, { marginBottom: 4 }]}>Recipients (consented only)</Text>
        {consented.map((c) => (
          <CheckRow key={c.name} label={`${c.name} (${c.relation})`} hint={`Scopes: ${c.consentScopes.join(', ')}`} value={to.includes(c.name)} onChange={() => setTo((s) => (s.includes(c.name) ? s.filter((x) => x !== c.name) : [...s, c.name]))} />
        ))}
        <CheckRow label="Include latest reports" hint={labsAllowed ? 'Allowed by consent' : 'Blocked – a recipient lacks LABS scope'} value={reports && labsAllowed} onChange={setReports} disabled={!labsAllowed} />
      </Card>
      {sent ? <Banner tone="success" title="Update sent" text="Via app push; WhatsApp/SMS link fallback. Delivery failures appear as separate events." /> : null}
      <Button
        label="Send update"
        icon="send"
        disabled={to.length === 0 || !text.trim() || sent}
        onPress={() => {
          dispatch({ type: 'SEND_MESSAGE', message: { id: uid('c'), patientId, thread: 'FAMILY', from: doctor.name, text, at: Date.now() } });
          dispatch({ type: 'AUDIT', entry: { action: 'FAMILY_UPDATE', patientId, detail: `${to.join(', ')}${reports && labsAllowed ? ' + reports' : ''}` } });
          setSent(true);
        }}
      />
    </Screen>
  );
}

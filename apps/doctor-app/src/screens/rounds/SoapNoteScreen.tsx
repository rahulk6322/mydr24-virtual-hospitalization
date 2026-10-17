/**
 * D-22 SOAP Progress Note (also AC-D-07 acute assessment, CC-D-15 chronic review).
 * Objective auto-fills from latest vitals; optional AI draft is clearly labelled and must be edited/signed.
 */
import React, { useMemo, useState } from 'react';
import { Text } from 'react-native';
import { Banner, Button, Card, Field, Screen, Segmented } from '../../components/ui';
import { PatientHeader, patientNews2 } from '../../components/clinical';
import { type } from '../../theme/tokens';
import { uid, useStore } from '../../store/AppStore';
import { useParams, useRootNav } from '../../navigation/hooks';
import { latest } from '../../utils/clinical';

type K = 'S' | 'O' | 'A' | 'P';

export default function SoapNoteScreen() {
  const { patientId, kind = 'SOAP' } = useParams<'SoapNote'>();
  const nav = useRootNav();
  const { patient, dispatch, doctor } = useStore();
  const p = patient(patientId)!;

  const objective = useMemo(() => {
    const g = (c: Parameters<typeof latest>[1]) => latest(p.observations, c);
    const parts = [
      g('SBP') && g('DBP') ? `BP ${Math.round(g('SBP')!.value)}/${Math.round(g('DBP')!.value)}` : null,
      g('HR') ? `HR ${g('HR')!.value}` : null,
      g('RR') ? `RR ${g('RR')!.value}` : null,
      g('SPO2') ? `SpO₂ ${g('SPO2')!.value}%` : null,
      g('TEMP') ? `Temp ${g('TEMP')!.value}°F` : null,
    ].filter(Boolean);
    const r = patientNews2(p);
    const labs = p.labs.slice(0, 3).map((l) => `${l.name} ${l.value}${l.unit ? ' ' + l.unit : ''}`).join('; ');
    return `${parts.join(', ')}${parts.length ? ` · NEWS2 ${r.total}${r.complete ? '' : '*'}` : ''}${labs ? `\nRecent results: ${labs}` : ''}`;
  }, [p]);

  const [tab, setTab] = useState<K>('S');
  const [s, setS] = useState('');
  const [o, setO] = useState(objective);
  const [a, setA] = useState('');
  const [pl, setPl] = useState('');
  const [aiUsed, setAiUsed] = useState(false);

  const aiDraft = () => {
    setAiUsed(true);
    setA((x) => x || `[AI DRAFT – verify] ${p.diagnosis}. Trend reviewed; see objective data.`);
    setPl((x) => x || '[AI DRAFT – verify] Continue current plan; reassess at next round.');
  };
  const ok = s.trim() && a.trim() && pl.trim() && !/\[AI DRAFT/.test(a + pl);

  const sign = () => {
    dispatch({ type: 'ADD_NOTE', patientId, note: { id: uid('n'), kind, author: doctor.name, at: Date.now(), summary: `${a.trim()} | Plan: ${pl.trim()}`, signed: true } });
    nav.goBack();
  };

  const title = kind === 'ACUTE' ? 'Acute assessment & plan' : kind === 'REVIEW' ? 'Chronic care review' : 'SOAP progress note';

  return (
    <Screen>
      <PatientHeader p={p} compact />
      <Text style={[type.h3, { marginBottom: 8 }]}>{title}</Text>
      <Segmented<K> value={tab} onChange={setTab} options={[{ key: 'S', label: 'Subjective' }, { key: 'O', label: 'Objective' }, { key: 'A', label: 'Assessment' }, { key: 'P', label: 'Plan' }]} />
      <Card>
        {tab === 'S' ? <Field label="Subjective" value={s} onChangeText={setS} multiline placeholder="Patient-reported symptoms, concerns, caregiver report" /> : null}
        {tab === 'O' ? <Field label="Objective (auto-filled – editable)" value={o} onChangeText={setO} multiline /> : null}
        {tab === 'A' ? <Field label="Assessment" value={a} onChangeText={setA} multiline placeholder="Problem, differential, severity, response to treatment" /> : null}
        {tab === 'P' ? <Field label="Plan" value={pl} onChangeText={setPl} multiline placeholder="Treatment, orders, monitoring, follow-up, safety-net" /> : null}
      </Card>
      {aiUsed ? <Banner tone="warn" title="AI draft inserted" text="Edit the text and remove the [AI DRAFT] markers before signing. The clinician is accountable for the signed note." /> : null}
      <Button label="AI draft assessment & plan" kind="ghost" icon="sparkles-outline" onPress={aiDraft} />
      <Button label="Convert plan to orders" kind="secondary" icon="list-outline" onPress={() => nav.navigate('Orders', { patientId })} />
      <Button label={`Sign note as ${doctor.name}`} icon="create" disabled={!ok} onPress={sign} />
    </Screen>
  );
}

/** D-06 Baseline Assessment – vitals entry with live NEWS2 (RCP 2017), range validation, ACVPU, O₂. */
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Banner, Button, Card, CheckRow, Choice, Field, Screen, Stepper } from '../../components/ui';
import { News2Badge, PatientHeader } from '../../components/clinical';
import { spacing, type } from '../../theme/tokens';
import { useStore } from '../../store/AppStore';
import { useParams, useRootNav } from '../../navigation/hooks';
import { type Consciousness, fToC, news2, news2BandLabel } from '../../utils/clinical';
import type { Observation, VitalCode } from '../../types/models';

const LIMITS: Record<string, [number, number]> = { sbp: [50, 260], dbp: [30, 160], hr: [20, 250], rr: [4, 60], spo2: [50, 100], temp: [90, 110], wt: [20, 250] };

export default function BaselineScreen() {
  const { patientId } = useParams<'Baseline'>();
  const nav = useRootNav();
  const { patient, dispatch } = useStore();
  const p = patient(patientId)!;
  const [v, setV] = useState<Record<string, string>>({ sbp: '', dbp: '', hr: '', rr: '', spo2: '', temp: '', wt: '' });
  const [acvpu, setAcvpu] = useState<Consciousness>('A');
  const [onO2, setOnO2] = useState(false);
  const [scale2, setScale2] = useState(false);
  const [pain, setPain] = useState('');

  const num = (k: string) => (v[k] === '' ? undefined : Number(v[k]));
  const err = (k: string) => {
    const n = num(k);
    if (n === undefined) return undefined;
    if (Number.isNaN(n)) return 'Numbers only';
    const [lo, hi] = LIMITS[k];
    return n < lo || n > hi ? `Outside plausible range ${lo}–${hi} – recheck` : undefined;
  };
  const anyErr = Object.keys(LIMITS).some((k) => !!err(k));
  const t = num('temp');
  const r = news2({ rr: num('rr'), spo2: num('spo2'), spo2Scale2: scale2, onOxygen: onO2, sbp: num('sbp'), hr: num('hr'), consciousness: acvpu, tempC: t !== undefined ? fToC(t) : undefined });

  const save = () => {
    const now = Date.now();
    const map: [string, VitalCode, string][] = [['sbp', 'SBP', 'mmHg'], ['dbp', 'DBP', 'mmHg'], ['hr', 'HR', 'bpm'], ['rr', 'RR', '/min'], ['spo2', 'SPO2', '%'], ['temp', 'TEMP', '°F'], ['wt', 'WT', 'kg']];
    const obs: Observation[] = map.filter(([k]) => num(k) !== undefined).map(([k, code, unit]) => ({ code, value: num(k)!, unit, at: now, source: 'NURSE' }));
    dispatch({ type: 'ADD_OBS', patientId, obs });
    dispatch({ type: 'AUDIT', entry: { action: 'BASELINE', patientId, detail: `NEWS2 ${r.total} · ACVPU ${acvpu} · O2 ${onO2} · pain ${pain || '—'}` } });
    nav.navigate('GoalsOfCare', { patientId, next: 'CareTeam' });
  };

  const F = (k: string, label: string, unit: string) => (
    <View style={{ flexBasis: '47%', flexGrow: 1 }}>
      <Field label={label} unit={unit} value={v[k]} keyboardType="numeric" onChangeText={(x) => setV((s) => ({ ...s, [k]: x.replace(/[^0-9.]/g, '') }))} error={err(k)} />
    </View>
  );

  return (
    <Screen>
      <Stepper steps={['Eligibility', 'Consent', 'Baseline', 'Plan']} current={2} />
      <PatientHeader p={p} compact />
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={type.h3}>Live NEWS2</Text>
            <Text style={type.small}>{r.complete ? news2BandLabel[r.band] : `Incomplete – missing ${r.missing.join(', ')}`}</Text>
          </View>
          <News2Badge r={r} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {F('sbp', 'Systolic BP', 'mmHg')}{F('dbp', 'Diastolic BP', 'mmHg')}{F('hr', 'Heart rate', 'bpm')}{F('rr', 'Resp. rate', '/min')}
          {F('spo2', 'SpO₂', '%')}{F('temp', 'Temperature', '°F')}{F('wt', 'Weight', 'kg')}
          <View style={{ flexBasis: '47%', flexGrow: 1 }}>
            <Field label="Pain score" unit="/10" value={pain} keyboardType="numeric" onChangeText={(x) => setPain(x.replace(/\D/g, '').slice(0, 2))} />
          </View>
        </View>
        <CheckRow label="On supplemental oxygen" value={onO2} onChange={setOnO2} />
        <CheckRow label="Use SpO₂ Scale 2 (clinician-confirmed hypercapnic failure, target 88–92%)" value={scale2} onChange={setScale2} />
      </Card>
      <Card>
        <Text style={[type.h3, { marginBottom: spacing.sm }]}>Consciousness (ACVPU)</Text>
        <Choice<Consciousness>
          value={acvpu}
          onChange={setAcvpu}
          options={[{ key: 'A', label: 'Alert' }, { key: 'NEW_CONFUSION', label: 'New confusion' }, { key: 'V', label: 'Responds to voice' }, { key: 'P', label: 'Responds to pain' }, { key: 'U', label: 'Unresponsive' }]}
        />
      </Card>
      {r.band === 'HIGH' ? <Banner tone="danger" title="NEWS2 ≥ 7 – re-check Virtual IPD suitability" text="High score at baseline usually means hospital-level care. Consider escalation instead of admission." /> : null}
      <Button label="Save baseline & continue" icon="save-outline" disabled={anyErr || !r.complete} onPress={save} />
      {!r.complete ? <Text style={[type.tiny, { textAlign: 'center' }]}>Complete all NEWS2 parameters to continue</Text> : null}
    </Screen>
  );
}

/**
 * D-04 Admission Eligibility (fixed): any HARD exclusion blocks admission.
 * Soft criteria can be overridden only by the admitting doctor with a written reason (audited).
 * Also enforces the capacity guard (master spec §7): no over-admission.
 */
import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Banner, Button, Card, CheckRow, Choice, Field, Screen, SectionTitle, Stepper } from '../../components/ui';
import { PatientHeader } from '../../components/clinical';
import { colors, spacing, type } from '../../theme/tokens';
import { useStore } from '../../store/AppStore';
import { useParams, useRootNav } from '../../navigation/hooks';

/** Draft lists from Annex B Appendix A – CGC must approve before clinical use. */
const INCLUSION = [
  'Requires inpatient-level care for an approved condition',
  'Haemodynamically stable (per CGC criteria)',
  'NEWS2 within admission threshold',
  'Diagnosis clear and treatment plan defined',
];
const HARD_EXCLUSIONS = [
  'Needs vasopressors',
  'Needs blood products',
  'Needs new NIV / invasive ventilation',
  'Continuous high-risk infusion (heparin / insulin drip)',
  'Active bleeding',
  'Unstable arrhythmia',
];
const HOME = [
  'Inside ambulance radius of partner ED (≤ 30–45 min)',
  'Reliable power (or UPS) and mobile network verified',
  'Caregiver available (mandatory for T2/T3)',
  'Safe home environment',
];
const CAPACITY = { beds: 6, nurseSlots: 6, kits: 5 };

export default function EligibilityScreen() {
  const { patientId: initialId } = useParams<'Eligibility'>();
  const nav = useRootNav();
  const { patients, dispatch } = useStore();
  const candidates = patients.filter((p) => !p.episodes.some((e) => e.pathway === 'VIPD'));
  const [pid, setPid] = useState<string | undefined>(initialId ?? candidates[0]?.id);
  const p = patients.find((x) => x.id === pid);

  const [inc, setInc] = useState<boolean[]>(INCLUSION.map(() => false));
  const [exc, setExc] = useState<boolean[]>(HARD_EXCLUSIONS.map(() => false));
  const [home, setHome] = useState<boolean[]>(HOME.map(() => false));
  const [override, setOverride] = useState('');

  const vipdCount = patients.filter((x) => x.episodes.some((e) => e.pathway === 'VIPD')).length;
  const capacityOk = vipdCount < CAPACITY.beds && vipdCount < CAPACITY.nurseSlots && vipdCount < CAPACITY.kits;
  const anyExclusion = exc.some(Boolean);
  const softUnmet = inc.filter((x) => !x).length + home.filter((x) => !x).length;
  const overrideOk = softUnmet === 0 || override.trim().length >= 15;
  const canProceed = !!p && capacityOk && !anyExclusion && overrideOk;

  const reason = useMemo(() => {
    if (!p) return 'Select the referred patient';
    if (!capacityOk) return 'Capacity reached – refer to IPD/partner hospital';
    if (anyExclusion) return 'Hard exclusion present – Virtual IPD not permitted';
    if (!overrideOk) return `${softUnmet} criteria unmet – document an override reason (≥ 15 characters)`;
    return '';
  }, [p, capacityOk, anyExclusion, overrideOk, softUnmet]);

  const toggle = (arr: boolean[], set: (v: boolean[]) => void, i: number) => set(arr.map((v, j) => (j === i ? !v : v)));

  return (
    <Screen>
      <Stepper steps={['Eligibility', 'Consent', 'Baseline', 'Plan']} current={0} />
      {!initialId ? (
        <Card>
          <SectionTitle title="Referred patient" />
          <Choice options={candidates.map((c) => ({ key: c.id, label: `${c.name} · ${c.age}${c.sex}`, hint: c.diagnosis }))} value={pid} onChange={setPid} />
        </Card>
      ) : p ? <PatientHeader p={p} /> : null}

      <Card accent={capacityOk ? colors.stable : colors.critical}>
        <Text style={type.h3}>Capacity check</Text>
        <Text style={type.small}>Virtual beds {vipdCount}/{CAPACITY.beds} · nurse slots {vipdCount}/{CAPACITY.nurseSlots} · device kits {vipdCount}/{CAPACITY.kits}</Text>
        {!capacityOk ? <Text style={{ color: colors.critical, fontWeight: '700', marginTop: 4 }}>Capacity reached – admission disabled.</Text> : null}
      </Card>

      <Card>
        <SectionTitle title="Clinical inclusion" />
        {INCLUSION.map((l, i) => <CheckRow key={l} label={l} value={inc[i]} onChange={() => toggle(inc, setInc, i)} />)}
      </Card>
      <Card accent={anyExclusion ? colors.critical : undefined}>
        <SectionTitle title="Hard exclusions (tick if present)" />
        {HARD_EXCLUSIONS.map((l, i) => <CheckRow key={l} label={l} tone="danger" value={exc[i]} onChange={() => toggle(exc, setExc, i)} />)}
      </Card>
      <Card>
        <SectionTitle title="Home & social" />
        {HOME.map((l, i) => <CheckRow key={l} label={l} value={home[i]} onChange={() => toggle(home, setHome, i)} />)}
      </Card>

      {softUnmet > 0 && !anyExclusion ? (
        <Field label="Doctor override reason (audited)" value={override} onChangeText={setOverride} multiline placeholder="Why is home admission still safe despite unmet criteria?" />
      ) : null}

      {reason ? <Banner tone={anyExclusion || !capacityOk ? 'danger' : 'warn'} title={reason} /> : <Banner tone="success" title="Eligible for Virtual IPD" />}

      <View style={{ gap: spacing.sm }}>
        <Button
          label="Proceed to consent"
          icon="arrow-forward"
          disabled={!canProceed}
          testID="eligibility-proceed"
          onPress={() => {
            if (!p) return;
            if (softUnmet > 0) dispatch({ type: 'AUDIT', entry: { action: 'ELIGIBILITY_OVERRIDE', patientId: p.id, detail: override } });
            nav.navigate('Consent', { patientId: p.id });
          }}
        />
        <Button label="Refer to IPD / ICU instead" kind="secondary" icon="business-outline" onPress={() => p && nav.navigate('Handover', { patientId: p.id })} disabled={!p} />
      </View>
    </Screen>
  );
}

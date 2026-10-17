/** D-16 / AC-D-05 / CC-D-07 Medication Reconciliation – required at every pathway entry & exit. */
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Banner, Button, Card, Pill, Screen } from '../../components/ui';
import { PatientHeader } from '../../components/clinical';
import { colors, spacing, type } from '../../theme/tokens';
import { useStore } from '../../store/AppStore';
import { useParams } from '../../navigation/hooks';

type Decision = 'CONTINUE' | 'STOP' | 'MODIFY' | undefined;

export default function MedRecScreen() {
  const { patientId } = useParams<'MedRec'>();
  const { patient, dispatch } = useStore();
  const p = patient(patientId)!;
  const [dec, setDec] = useState<Record<string, Decision>>({});
  const [signed, setSigned] = useState(false);
  const all = p.meds.length > 0 && p.meds.every((m) => dec[m.id]);

  const opt = (id: string, d: Exclude<Decision, undefined>, color: string) => (
    <Text
      key={d}
      accessibilityRole="button"
      onPress={() => setDec((s) => ({ ...s, [id]: d }))}
      style={{ paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: dec[id] === d ? color : colors.border, backgroundColor: dec[id] === d ? `${color}1A` : colors.card, color: dec[id] === d ? color : colors.text, fontWeight: '600', fontSize: 12, overflow: 'hidden' }}
    >
      {d}
    </Text>
  );

  return (
    <Screen>
      <PatientHeader p={p} compact />
      <Banner tone="info" title="Sources: patient-reported · previous prescriptions · discharge summary" text="Decide every line. Changes need a reason in the signed note." />
      {signed ? <Banner tone="success" title="Reconciliation signed" text="Snapshot stored (FHIR List) and linked to the current episode." /> : null}
      {p.meds.length === 0 ? <Text style={type.small}>No medications recorded. Ask patient/caregiver for home medicines.</Text> : null}
      {p.meds.map((m) => (
        <Card key={m.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[type.h3, { flex: 1 }]}>{m.name} {m.dose} {m.route} {m.frequency}</Text>
            {m.highAlert ? <Pill label="High-alert" color={colors.urgent} /> : null}
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
            {opt(m.id, 'CONTINUE', colors.stable)}{opt(m.id, 'MODIFY', colors.urgent)}{opt(m.id, 'STOP', colors.critical)}
          </View>
        </Card>
      ))}
      <Button
        label="Sign reconciliation"
        icon="checkmark-done"
        disabled={!all || signed}
        onPress={() => {
          p.meds.filter((m) => dec[m.id] === 'STOP').forEach((m) => dispatch({ type: 'SET_MED_STATUS', patientId, medId: m.id, status: 'HELD' }));
          dispatch({ type: 'AUDIT', entry: { action: 'MED_RECONCILIATION', patientId, detail: p.meds.map((m) => `${m.name}:${dec[m.id]}`).join(', ') } });
          setSigned(true);
        }}
      />
    </Screen>
  );
}

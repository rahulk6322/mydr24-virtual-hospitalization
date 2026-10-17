/** D-13 Results Viewer – critical values must be acknowledged; acknowledgement is audited. */
import React from 'react';
import { Text, View } from 'react-native';
import { Banner, Button, Card, Empty, Pill, Screen } from '../../components/ui';
import { PatientHeader } from '../../components/clinical';
import { colors, type } from '../../theme/tokens';
import { useStore } from '../../store/AppStore';
import { useParams } from '../../navigation/hooks';
import { ago } from '../../utils/clinical';

export default function ResultsScreen() {
  const { patientId } = useParams<'Results'>();
  const { patient, dispatch, events } = useStore();
  const p = patient(patientId)!;
  const pending = p.labs.filter((l) => !l.acknowledged);

  const ack = (labId: string, name: string) => {
    dispatch({ type: 'ACK_LAB', patientId, labId });
    // close the matching result event if present
    events.filter((e) => e.patientId === patientId && e.type === 'CRITICAL_RESULT' && e.title.includes(name.split(' ')[0]) && e.status !== 'RESOLVED')
      .forEach((e) => dispatch({ type: 'RESOLVE_EVENT', id: e.id, resolution: 'Result acknowledged and reviewed' }));
  };

  return (
    <Screen>
      <PatientHeader p={p} compact />
      {pending.length ? <Banner tone="warn" title={`${pending.length} result(s) awaiting acknowledgement`} text="Unacknowledged critical results escalate per service policy." /> : null}
      {p.labs.length === 0 ? <Empty icon="flask-outline" title="No results yet" /> : null}
      {[...p.labs].sort((a, b) => Number(a.acknowledged) - Number(b.acknowledged) || b.at - a.at).map((l) => (
        <Card key={l.id} accent={l.flag === 'CRIT' ? colors.critical : l.flag !== 'N' ? colors.urgent : undefined}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[type.h3, { flex: 1 }]}>{l.name}</Text>
            <Pill label={l.flag === 'CRIT' ? 'CRITICAL' : l.flag === 'N' ? 'Normal' : l.flag === 'H' ? 'High' : 'Low'} color={l.flag === 'CRIT' ? colors.critical : l.flag === 'N' ? colors.stable : colors.urgent} />
          </View>
          <Text style={[type.body, { marginTop: 4, fontWeight: '600' }]}>{l.value} {l.unit}</Text>
          <Text style={type.small}>Reference {l.ref} · {ago(l.at)}</Text>
          {!l.acknowledged ? <Button label="Acknowledge result" kind={l.flag === 'CRIT' ? 'danger' : 'primary'} icon="checkmark-done" onPress={() => ack(l.id, l.name)} /> : <Text style={[type.tiny, { marginTop: 4, color: colors.stable }]}>Acknowledged</Text>}
        </Card>
      ))}
    </Screen>
  );
}

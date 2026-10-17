/** D-28 Shift Handover (I-PASS). Outgoing doctor cannot end shift until every patient is handed over. */
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Banner, Button, Card, CheckRow, Field, Pill, Screen } from '../../components/ui';
import { PathwayChip, patientNews2 } from '../../components/clinical';
import { colors, spacing, type } from '../../theme/tokens';
import { useStore } from '../../store/AppStore';

export default function ShiftHandoverScreen() {
  const { patients, openEvents, dispatch, doctor } = useStore();
  const mine = patients.filter((p) => p.episodes.some((e) => e.responsibleClinician === doctor.name && e.pathway !== 'ACU'));
  const [actions, setActions] = useState<Record<string, string>>({});
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const [receiver, setReceiver] = useState('Dr. Priya Sharma (night)');
  const [accepted, setAccepted] = useState(false);
  const all = mine.every((p) => ready[p.id]);

  return (
    <Screen>
      <Card>
        <Field label="Receiving doctor" value={receiver} onChangeText={setReceiver} />
        <Text style={type.small}>I-PASS: Illness severity · Patient summary · Action list · Situation awareness · Synthesis by receiver</Text>
      </Card>
      {mine.map((p) => {
        const evs = openEvents.filter((e) => e.patientId === p.id);
        const r = patientNews2(p);
        const sev = evs.some((e) => e.cls === 'E') ? 'Unstable' : evs.some((e) => e.cls === 'U') || r.total >= 5 ? 'Watcher' : 'Stable';
        return (
          <Card key={p.id} accent={sev === 'Unstable' ? colors.critical : sev === 'Watcher' ? colors.urgent : colors.stable}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={type.h3}>{p.name}</Text>
              <Pill label={`I: ${sev}`} color={sev === 'Unstable' ? colors.critical : sev === 'Watcher' ? colors.urgent : colors.stable} />
            </View>
            <View style={{ flexDirection: 'row', gap: 6, marginVertical: 4, flexWrap: 'wrap' }}>{p.episodes.map((e) => <PathwayChip key={e.id} pathway={e.pathway} />)}</View>
            <Text style={type.small}>P: {p.diagnosis}{evs.length ? ` · open: ${evs.map((e) => e.title).join('; ')}` : ''}</Text>
            <Field label="A/S: actions & contingency" value={actions[p.id] ?? ''} onChangeText={(t) => setActions((a) => ({ ...a, [p.id]: t }))} placeholder="If X happens, do Y" multiline />
            <CheckRow label="Ready to hand over" value={!!ready[p.id]} onChange={(v) => setReady((s) => ({ ...s, [p.id]: v }))} />
          </Card>
        );
      })}
      {accepted ? <Banner tone="success" title={`Handover accepted by ${receiver}`} text="Alerts now route to the receiving doctor." /> : null}
      <View style={{ marginTop: spacing.sm }}>
        <Button label="Send handover & request acceptance" icon="swap-horizontal" disabled={!all || accepted} onPress={() => { dispatch({ type: 'AUDIT', entry: { action: 'SHIFT_HANDOVER', detail: `${mine.length} patients → ${receiver}` } }); setAccepted(true); }} />
        {!all ? <Text style={[type.tiny, { textAlign: 'center' }]}>Mark every patient ready before ending your shift.</Text> : null}
      </View>
    </Screen>
  );
}

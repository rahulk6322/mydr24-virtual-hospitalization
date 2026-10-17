/**
 * AC-D-01 Acute Intake Queue. Unscreened cases are first (red-flag screen required).
 * Red-flag-positive cases never wait here – they are routed to emergency immediately.
 */
import React from 'react';
import { Text, View } from 'react-native';
import { Banner, Button, Card, Empty, Pill, Screen, SectionTitle } from '../../components/ui';
import { Avatar } from '../../components/clinical';
import { colors, spacing, type } from '../../theme/tokens';
import { useStore } from '../../store/AppStore';
import { useRootNav } from '../../navigation/hooks';
import type { Episode } from '../../types/models';
import { ago, latest } from '../../utils/clinical';

const rank: Record<NonNullable<Episode['urgency']>, number> = { EMERGENCY: 0, URGENT: 1, SOON: 2, ROUTINE: 3 };
/** Target contact times are placeholders until the service policy is approved. */
const target: Record<NonNullable<Episode['urgency']>, string> = { EMERGENCY: 'now', URGENT: '≤ 30 min (draft)', SOON: '≤ 2 h (draft)', ROUTINE: '≤ 24 h (draft)' };

export default function AcuteQueueScreen() {
  const nav = useRootNav();
  const { patients } = useStore();
  const acute = patients
    .map((p) => ({ p, e: p.episodes.find((x) => x.pathway === 'ACU') }))
    .filter((x): x is { p: (typeof patients)[number]; e: Episode } => !!x.e);
  const intake = acute.filter((x) => x.e.status === 'INTAKE');
  const triaged = acute.filter((x) => x.e.status !== 'INTAKE').sort((a, b) => rank[a.e.urgency ?? 'ROUTINE'] - rank[b.e.urgency ?? 'ROUTINE']);

  return (
    <Screen>
      <Banner tone="info" title="Triage supports – never replaces – clinical judgement" text="Protocol: CGC-approved remote-triage protocol (draft placeholder). Symptom checkers cannot decide home-treatment suitability." />
      <SectionTitle title={`Awaiting red-flag screen (${intake.length})`} />
      {intake.length === 0 ? <Text style={[type.small, { marginBottom: spacing.md }]}>None.</Text> : null}
      {intake.map(({ p }) => (
        <Card key={p.id} accent={colors.critical}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Avatar name={p.name} size={38} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={type.h3}>{p.name} <Text style={type.small}>{p.age}{p.sex}</Text></Text>
              <Text style={type.small}>{p.diagnosis}</Text>
            </View>
          </View>
          <Button label="Screen red flags now" kind="danger" icon="alert-circle-outline" onPress={() => nav.navigate('AcuteTriage', { patientId: p.id })} />
        </Card>
      ))}

      <SectionTitle title={`Triaged – by urgency (${triaged.length})`} />
      {triaged.length === 0 ? <Empty title="No triaged acute cases" /> : null}
      {triaged.map(({ p, e }) => {
        const lastObs = [...p.observations].sort((a, b) => b.at - a.at)[0];
        const t = latest(p.observations, 'TEMP');
        return (
          <Card key={p.id} onPress={() => nav.navigate('AcuteWorkspace', { patientId: p.id })} accent={e.urgency === 'URGENT' ? colors.urgent : colors.primary}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Avatar name={p.name} size={38} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={type.h3}>{p.name} <Text style={type.small}>{p.age}{p.sex}</Text></Text>
                <Text style={type.small} numberOfLines={1}>{p.diagnosis}{t ? ` · T ${t.value}°F` : ''}</Text>
                <Text style={type.tiny}>Target contact {target[e.urgency ?? 'ROUTINE']} · reported {lastObs ? ago(lastObs.at) : '—'} · {e.responsibleClinician}</Text>
              </View>
              <Pill label={e.urgency ?? 'ROUTINE'} color={e.urgency === 'URGENT' ? colors.urgent : colors.primary} />
            </View>
          </Card>
        );
      })}
      <Text style={[type.tiny, { textAlign: 'center', marginTop: spacing.md }]}>New acute problem for a chronic or RPM patient? Open the patient → Transition → Acute Care.</Text>
    </Screen>
  );
}

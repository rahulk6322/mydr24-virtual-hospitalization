/** Audit log & transition register (mirrors FHIR AuditEvent / pathway-transition Task). */
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Card, Empty, Pill, Screen, Segmented } from '../../components/ui';
import { colors, type } from '../../theme/tokens';
import { useStore } from '../../store/AppStore';
import { ago, clock } from '../../utils/clinical';

export default function AuditLogScreen() {
  const { audit, transitions, patients } = useStore();
  const [tab, setTab] = useState<'AUDIT' | 'TRANSITIONS'>('AUDIT');
  const name = (id?: string) => (id ? patients.find((p) => p.id === id)?.name ?? id : '—');
  return (
    <Screen>
      <Segmented value={tab} onChange={setTab} options={[{ key: 'AUDIT', label: 'Audit', badge: audit.length }, { key: 'TRANSITIONS', label: 'Transitions', badge: transitions.length }]} />
      {tab === 'AUDIT' ? (
        audit.length === 0 ? <Empty icon="document-outline" title="No actions yet" /> : audit.map((a, i) => (
          <Card key={i} style={{ paddingVertical: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[type.h3, { fontSize: 13 }]}>{a.action}</Text>
              <Text style={type.tiny}>{clock(a.at)}</Text>
            </View>
            <Text style={type.small}>{a.actor} · {name(a.patientId)}</Text>
            {a.detail ? <Text style={type.tiny}>{a.detail}</Text> : null}
          </Card>
        ))
      ) : transitions.length === 0 ? <Empty icon="git-compare-outline" title="No transitions yet" /> : transitions.map((t) => (
        <Card key={t.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={type.h3}>{name(t.patientId)}: {t.from} → {t.to}</Text>
            <Pill label={t.handover} color={t.handover === 'PENDING' ? colors.urgent : colors.stable} />
          </View>
          <Text style={type.small}>Trigger: {t.trigger}</Text>
          <Text style={type.small}>Rationale: {t.rationale}</Text>
          <Text style={type.tiny}>Authorised by {t.authorisedBy} · {ago(t.at)}</Text>
          {t.outstandingTasks.length ? <Text style={type.tiny}>Outstanding: {t.outstandingTasks.join(', ')}</Text> : null}
        </Card>
      ))}
    </Screen>
  );
}

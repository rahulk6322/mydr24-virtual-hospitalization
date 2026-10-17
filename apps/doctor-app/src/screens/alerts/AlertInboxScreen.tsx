/**
 * UD-D-04 Unified Event Inbox / D-23 Alert Inbox.
 * Explicit buttons only (no swipe-to-acknowledge). Emergency events have no ack timer – act now.
 * Device, delivery-failure and clinical events are separate classes.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Button, Empty, Screen, Segmented } from '../../components/ui';
import { EventRow } from '../../components/clinical';
import { spacing } from '../../theme/tokens';
import { useStore } from '../../store/AppStore';
import { useRootNav } from '../../navigation/hooks';
import type { EventClass } from '../../types/models';

type F = 'ALL' | EventClass;

export default function AlertInboxScreen() {
  const nav = useRootNav();
  const { openEvents, patients, dispatch } = useStore();
  const [f, setF] = useState<F>('ALL');
  const count = (c: EventClass) => openEvents.filter((e) => e.cls === c).length;
  const list = openEvents.filter((e) => f === 'ALL' || e.cls === f);
  const name = (id: string) => patients.find((p) => p.id === id)?.name ?? id;

  return (
    <Screen>
      <Segmented<F>
        value={f}
        onChange={setF}
        options={[
          { key: 'ALL', label: 'All', badge: openEvents.length },
          { key: 'E', label: 'Emergency', badge: count('E') },
          { key: 'U', label: 'Urgent', badge: count('U') },
          { key: 'R', label: 'Routine', badge: count('R') },
          { key: 'A', label: 'Data', badge: count('A') },
          { key: 'T', label: 'Technical', badge: count('T') },
          { key: 'N', label: 'Delivery', badge: count('N') },
        ]}
      />
      {list.length === 0 ? <Empty title="All clear" text="No open events in this filter." /> : null}
      {list.map((ev) => (
        <View key={ev.id} style={{ marginBottom: spacing.sm }}>
          <EventRow ev={ev} patientName={name(ev.patientId)} onPress={() => nav.navigate('AlertDetail', { eventId: ev.id })} />
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: -4 }}>
            {ev.cls === 'E' ? (
              <Button label="Open emergency console" kind="danger" icon="alert-circle" style={{ flex: 1 }} onPress={() => nav.navigate('Emergency', { patientId: ev.patientId })} />
            ) : (
              <>
                <Button label={ev.status === 'ACKNOWLEDGED' ? 'Acknowledged' : 'Acknowledge'} kind="secondary" icon="checkmark" style={{ flex: 1 }} disabled={ev.status === 'ACKNOWLEDGED'} onPress={() => dispatch({ type: 'ACK_EVENT', id: ev.id })} />
                <Button label="Open" icon="open-outline" style={{ flex: 1 }} onPress={() => nav.navigate('AlertDetail', { eventId: ev.id })} />
              </>
            )}
          </View>
        </View>
      ))}
    </Screen>
  );
}

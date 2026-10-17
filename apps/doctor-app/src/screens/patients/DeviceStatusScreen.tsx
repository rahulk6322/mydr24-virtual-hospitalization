/** D-10 Device & Connectivity Status – technical events stay separate from clinical deterioration. */
import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Button, Card, Pill, Screen } from '../../components/ui';
import { PatientHeader } from '../../components/clinical';
import { colors, spacing, type } from '../../theme/tokens';
import { uid, useStore } from '../../store/AppStore';
import { useParams } from '../../navigation/hooks';
import { ago } from '../../utils/clinical';

export default function DeviceStatusScreen() {
  const { patientId } = useParams<'DeviceStatus'>();
  const { patient, dispatch, doctor } = useStore();
  const p = patient(patientId)!;
  const offline = p.devices.filter((d) => !d.online);

  const requestTech = () =>
    dispatch({
      type: 'RAISE_EVENT',
      event: {
        id: uid('ev'), patientId, pathway: p.episodes[0]?.pathway ?? 'RPM', type: 'DEVICE_FAILURE', cls: 'T',
        title: 'Technician visit requested', detail: `Requested by ${doctor.name}`, ruleId: 'MANUAL', ruleVersion: '—',
        at: Date.now(), ackBy: Date.now() + 30 * 60_000, status: 'OPEN',
      },
    });

  return (
    <Screen>
      <PatientHeader p={p} compact />
      {offline.length ? (
        <Banner tone="info" title="Technical issue – not a clinical score" text="Device/connectivity loss is a separate event type. It escalates clinically only if the monitoring plan requires live data." />
      ) : <Banner tone="success" title="All devices online" />}
      {p.devices.map((d) => (
        <Card key={d.id} accent={d.online ? colors.stable : colors.technical}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name={d.name.includes('Hub') ? 'wifi-outline' : 'hardware-chip-outline'} size={22} color={d.online ? colors.stable : colors.technical} style={{ marginRight: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Text style={type.h3}>{d.name}</Text>
              <Text style={type.small}>Last sync {ago(d.lastSync)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Pill label={d.online ? 'Online' : 'Offline'} color={d.online ? colors.stable : colors.technical} />
              <Pill label={`Battery ${d.battery}%`} color={d.battery < 30 ? colors.critical : d.battery < 50 ? colors.urgent : colors.textMuted} />
            </View>
          </View>
        </Card>
      ))}
      <Button label="Request technician visit" icon="construct-outline" onPress={requestTech} />
      <Button label="Call patient / caregiver" kind="secondary" icon="call-outline" onPress={() => dispatch({ type: 'AUDIT', entry: { action: 'CALL_PATIENT', patientId } })} />
    </Screen>
  );
}

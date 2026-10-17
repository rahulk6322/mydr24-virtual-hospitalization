/**
 * D-12 ICU Monitoring Dashboard – live numerics + simulated waveform strip + ventilator telemetry.
 * VIEW-ONLY: there is deliberately no remote device control (spec Annex C A2 #3).
 * The waveform here is a demo animation; real waveforms come from the Home Hub stream.
 */
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Banner, Button, Card, KeyValue, Screen } from '../../components/ui';
import { FreshnessDot, PatientHeader, vitalTone } from '../../components/clinical';
import { colors, radius, spacing } from '../../theme/tokens';
import { useStore } from '../../store/AppStore';
import { useParams, useRootNav } from '../../navigation/hooks';
import { freshness, latest } from '../../utils/clinical';
import type { VitalCode } from '../../types/models';

const ecg = [0, 0, 1, 0, -1, 9, -3, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0];
const pleth = [0, 2, 5, 7, 6, 4, 3, 3.5, 2.5, 1.5, 0.8, 0.3, 0, 0, 0, 0, 0, 0];

function Wave({ shape, color, label, value, scale }: { shape: number[]; color: string; label: string; value: string; scale: number }) {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setOffset((o) => (o + 1) % shape.length), 100);
    return () => clearInterval(id);
  }, [shape.length]);
  const points = Array.from({ length: 54 }, (_, i) => shape[(i + offset) % shape.length]);
  return (
    <View style={{ backgroundColor: '#0B1220', borderRadius: radius.sm, padding: spacing.sm, marginBottom: spacing.sm }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color, fontWeight: '700', fontSize: 12 }}>{label}</Text>
        <Text style={{ color, fontWeight: '800', fontSize: 20 }}>{value}</Text>
      </View>
      <View style={{ height: 54, flexDirection: 'row', alignItems: 'center' }}>
        {points.map((v, i) => (
          <View key={i} style={{ flex: 1, height: 54, justifyContent: 'center' }}>
            <View style={{ height: 2, backgroundColor: color, transform: [{ translateY: -v * scale }] }} />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function IcuMonitorScreen() {
  const { patientId } = useParams<'IcuMonitor'>();
  const nav = useRootNav();
  const { patient } = useStore();
  const p = patient(patientId)!;
  const tier = p.episodes.find((e) => e.pathway === 'VIPD')?.tier;
  const v = (c: VitalCode) => latest(p.observations, c);
  const hr = v('HR'); const spo2 = v('SPO2'); const sbp = v('SBP'); const dbp = v('DBP'); const rr = v('RR'); const temp = v('TEMP');
  const f = freshness(spo2, 'VIPD', tier);
  const vent = p.devices.find((d) => d.name.toLowerCase().includes('ventilator'));
  const stale = f === 'STALE' || f === 'MISSING';

  return (
    <Screen>
      <PatientHeader p={p} compact />
      {stale ? <Banner tone="warn" title="Data not live" text="Waveforms paused – last valid data is shown greyed. Check device & hub connectivity." /> : null}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 6 }}>
        <FreshnessDot f={f} at={spo2?.at} />
      </View>
      {!stale ? (
        <>
          <Wave shape={ecg} color="#32D583" label="ECG II" value={`${hr?.value ?? '—'}`} scale={2.4} />
          <Wave shape={pleth} color="#2E90FA" label="SpO₂ pleth" value={`${spo2?.value ?? '—'}%`} scale={3} />
        </>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
        {[
          ['NIBP', sbp && dbp ? `${Math.round(sbp.value)}/${Math.round(dbp.value)}` : '—', sbp ? vitalTone('SBP', sbp.value) : colors.stale],
          ['RR', `${rr?.value ?? '—'}`, rr ? vitalTone('RR', rr.value) : colors.stale],
          ['Temp °F', `${temp?.value ?? '—'}`, temp ? vitalTone('TEMP', temp.value) : colors.stale],
        ].map(([l, val, c]) => (
          <View key={l} style={{ flex: 1, minWidth: 100, backgroundColor: '#0B1220', borderRadius: radius.sm, padding: spacing.md }}>
            <Text style={{ color: '#98A2B3', fontSize: 12 }}>{l}</Text>
            <Text style={{ color: stale ? colors.stale : c === colors.text ? '#F2F4F7' : c, fontSize: 22, fontWeight: '800' }}>{val}</Text>
          </View>
        ))}
      </View>
      {vent ? (
        <Card accent={vent.online ? colors.stable : colors.technical}>
          <Text style={{ fontWeight: '700', marginBottom: 6 }}>Ventilator telemetry (read-only)</Text>
          <KeyValue k="Mode" v="Pressure support (demo)" />
          <KeyValue k="FiO₂ / PEEP" v="0.35 / 6 cmH₂O" />
          <KeyValue k="Vt / RR" v="410 mL / 22" />
          <KeyValue k="Connection" v={vent.online ? 'Online' : 'OFFLINE – data stale'} vColor={vent.online ? colors.stable : colors.critical} />
          <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 6 }}>Settings changes are ordered to the on-site nurse/RT – no remote control.</Text>
        </Card>
      ) : null}
      <Button label="Open alarm & trend view" kind="secondary" icon="trending-up-outline" onPress={() => nav.navigate('VitalsTrends', { patientId })} />
      <Button label="Device & connectivity status" kind="ghost" icon="hardware-chip-outline" onPress={() => nav.navigate('DeviceStatus', { patientId })} />
    </Screen>
  );
}

/**
 * D-21 Tele-Round Console. Video is a placeholder: integrate a WebRTC SDK (e.g. LiveKit / Agora / 100ms).
 * Live vitals overlay, participants, fallback to audio / PSTN, and one-tap emergency.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, vitalTone } from '../../components/clinical';
import { colors, radius, spacing } from '../../theme/tokens';
import { useStore } from '../../store/AppStore';
import { useParams, useRootNav } from '../../navigation/hooks';
import { latest } from '../../utils/clinical';
import type { VitalCode } from '../../types/models';

export default function TeleRoundScreen() {
  const { patientId } = useParams<'TeleRound'>();
  const nav = useRootNav();
  const { patient, dispatch } = useStore();
  const p = patient(patientId)!;
  const [sec, setSec] = useState(0);
  const [muted, setMuted] = useState(false);
  const [video, setVideo] = useState(true);
  const [overlay, setOverlay] = useState(true);
  const [audioOnly, setAudioOnly] = useState(false);

  useEffect(() => {
    dispatch({ type: 'AUDIT', entry: { action: 'TELEROUND_START', patientId } });
    const id = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [dispatch, patientId]);

  const end = () => {
    dispatch({ type: 'AUDIT', entry: { action: 'TELEROUND_END', patientId, detail: `${sec}s` } });
    nav.replace('SoapNote', { patientId, kind: 'SOAP' });
  };
  const v = (c: VitalCode) => latest(p.observations, c);
  const sbp = v('SBP'); const dbp = v('DBP');
  const overlayItems: [string, string, string][] = [
    ['HR', `${v('HR')?.value ?? '—'}`, v('HR') ? vitalTone('HR', v('HR')!.value) : colors.stale],
    ['SpO₂', `${v('SPO2')?.value ?? '—'}%`, v('SPO2') ? vitalTone('SPO2', v('SPO2')!.value) : colors.stale],
    ['BP', sbp && dbp ? `${Math.round(sbp.value)}/${Math.round(dbp.value)}` : '—', sbp ? vitalTone('SBP', sbp.value) : colors.stale],
  ];
  const ctrl = (icon: React.ComponentProps<typeof Ionicons>['name'], label: string, onPress: () => void, bg = 'rgba(255,255,255,0.15)') => (
    <Pressable key={label} onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={{ alignItems: 'center', width: 64 }}>
      <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={24} color={colors.white} />
      </View>
      <Text style={{ color: colors.white, fontSize: 11, marginTop: 4 }}>{label}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0B1220' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md }}>
        <Pressable onPress={() => nav.goBack()} hitSlop={12}><Ionicons name="chevron-back" size={26} color={colors.white} /></Pressable>
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={{ color: colors.white, fontWeight: '700', fontSize: 16 }}>{p.name}</Text>
          <Text style={{ color: '#98A2B3', fontSize: 12 }}>{audioOnly ? 'Audio only' : 'Video'} · {String(Math.floor(sec / 60)).padStart(2, '0')}:{String(sec % 60).padStart(2, '0')} · nurse at home + family</Text>
        </View>
        <Pressable onPress={() => nav.navigate('Emergency', { patientId })} style={{ backgroundColor: colors.critical, paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.sm }}>
          <Text style={{ color: colors.white, fontWeight: '800', fontSize: 12 }}>EMERGENCY</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1, margin: spacing.md, borderRadius: radius.lg, backgroundColor: '#1D2939', alignItems: 'center', justifyContent: 'center' }}>
        {video && !audioOnly ? <Avatar name={p.name} size={120} /> : <Ionicons name="mic" size={64} color="#98A2B3" />}
        <Text style={{ color: '#98A2B3', marginTop: spacing.md, fontSize: 12 }}>Video stream placeholder – WebRTC SDK integration point</Text>
        <View style={{ position: 'absolute', top: 12, right: 12, width: 84, height: 112, borderRadius: radius.md, backgroundColor: '#344054', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#D0D5DD', fontSize: 11 }}>You</Text>
        </View>
        {overlay ? (
          <View style={{ position: 'absolute', left: 12, bottom: 12, flexDirection: 'row', gap: 8 }}>
            {overlayItems.map(([l, val, c]) => (
              <View key={l} style={{ backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: radius.sm, paddingHorizontal: 10, paddingVertical: 6 }}>
                <Text style={{ color: '#98A2B3', fontSize: 10 }}>{l}</Text>
                <Text style={{ color: c === colors.text ? colors.white : c, fontWeight: '800', fontSize: 16 }}>{val}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: spacing.lg }}>
        {ctrl(muted ? 'mic-off' : 'mic', muted ? 'Unmute' : 'Mute', () => setMuted((m) => !m))}
        {ctrl(video ? 'videocam' : 'videocam-off', 'Video', () => setVideo((m) => !m))}
        {ctrl('pulse', overlay ? 'Hide vitals' : 'Vitals', () => setOverlay((o) => !o))}
        {ctrl('call', audioOnly ? 'Video' : 'Audio only', () => setAudioOnly((a) => !a))}
        {ctrl('call', 'End', end, colors.critical)}
      </View>
    </SafeAreaView>
  );
}

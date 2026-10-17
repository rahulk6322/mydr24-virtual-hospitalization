/** D-20 Overnight / Since-Last-Seen Review – events, notes and trend since last review. */
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Button, Card, Screen, SectionTitle } from '../../components/ui';
import { PatientHeader, TrendChart } from '../../components/clinical';
import { colors, spacing, type } from '../../theme/tokens';
import { useStore } from '../../store/AppStore';
import { useParams, useRootNav } from '../../navigation/hooks';
import { HOUR, clock, series } from '../../utils/clinical';

export default function OvernightReviewScreen() {
  const { patientId } = useParams<'OvernightReview'>();
  const nav = useRootNav();
  const { patient, events, dispatch } = useStore();
  const p = patient(patientId)!;
  const [reviewed, setReviewed] = useState(false);
  const since = Date.now() - 12 * HOUR;

  const spo2 = series(p.observations, 'SPO2', 12 * HOUR);
  const lows = spo2.filter((o) => o.value < 92);
  const timeline = [
    ...events.filter((e) => e.patientId === patientId && e.at >= since).map((e) => ({ at: e.at, text: e.title, icon: 'alert-circle' as const, color: colors.urgent })),
    ...p.notes.filter((n) => n.at >= since).map((n) => ({ at: n.at, text: `${n.kind}: ${n.summary}`, icon: 'document-text' as const, color: colors.primary })),
    ...lows.map((o) => ({ at: o.at, text: `SpO₂ dropped to ${o.value}%`, icon: 'water' as const, color: colors.critical })),
  ].sort((a, b) => a.at - b.at);

  return (
    <Screen>
      <PatientHeader p={p} compact />
      <TrendChart label="SpO₂ – last 12 h" data={spo2} band={[94, 100]} unit="%" />
      <SectionTitle title="Clinical events" />
      <Card>
        {timeline.length === 0 ? <Text style={type.small}>No events since last review.</Text> : null}
        {timeline.map((t, i) => (
          <View key={i} style={{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: i < timeline.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
            <Text style={[type.small, { width: 48, fontWeight: '700' }]}>{clock(t.at)}</Text>
            <Ionicons name={t.icon} size={16} color={t.color} style={{ marginRight: spacing.sm, marginTop: 1 }} />
            <Text style={[type.body, { flex: 1 }]}>{t.text}</Text>
          </View>
        ))}
      </Card>
      {reviewed ? <Banner tone="success" title="Marked as reviewed" text="Unseen-events badge cleared for you only." /> : null}
      <Button label="Mark as reviewed" icon="checkmark-done" disabled={reviewed} onPress={() => { dispatch({ type: 'AUDIT', entry: { action: 'OVERNIGHT_REVIEWED', patientId } }); setReviewed(true); }} />
      <Button label="Start morning round" kind="secondary" icon="videocam-outline" onPress={() => nav.navigate('TeleRound', { patientId })} />
    </Screen>
  );
}

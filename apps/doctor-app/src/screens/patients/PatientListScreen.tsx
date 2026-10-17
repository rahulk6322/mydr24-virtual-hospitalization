/** D-03 Patient Queue / Census & Filters – search, pathway filter, acuity sort. */
import React, { useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Empty, Pill, Screen, Segmented } from '../../components/ui';
import { Avatar, News2Badge, PathwayChip, episodeExtra, patientNews2 } from '../../components/clinical';
import { colors, radius, spacing, type } from '../../theme/tokens';
import { classRank, useStore } from '../../store/AppStore';
import { useRootNav } from '../../navigation/hooks';
import type { Pathway } from '../../types/models';

type F = 'ALL' | Pathway | 'ALERTS';

export default function PatientListScreen() {
  const nav = useRootNav();
  const { patients, openEvents } = useStore();
  const [q, setQ] = useState('');
  const [f, setF] = useState<F>('ALL');

  const worstCls = (id: string) => {
    const evs = openEvents.filter((e) => e.patientId === id);
    return evs.length ? evs.reduce((a, b) => (classRank[a.cls] <= classRank[b.cls] ? a : b)).cls : undefined;
  };

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return patients
      .filter((p) => !term || p.name.toLowerCase().includes(term) || p.uhid.toLowerCase().includes(term) || (p.abha ?? '').includes(term))
      .filter((p) => (f === 'ALL' ? true : f === 'ALERTS' ? !!worstCls(p.id) : p.episodes.some((e) => e.pathway === f)))
      .sort((a, b) => {
        const ra = worstCls(a.id); const rb = worstCls(b.id);
        const ca = ra ? classRank[ra] : 9; const cb = rb ? classRank[rb] : 9;
        return ca - cb || patientNews2(b).total - patientNews2(a).total;
      });
  }, [patients, openEvents, q, f]); // worstCls only reads openEvents

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, marginBottom: spacing.md }}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput value={q} onChangeText={setQ} placeholder="Search by name, UHID or ABHA" placeholderTextColor={colors.textSoft} accessibilityLabel="Search patients" style={{ flex: 1, minHeight: 46, marginLeft: 8, fontSize: 15, color: colors.text }} />
      </View>
      <Segmented<F>
        value={f}
        onChange={setF}
        options={[
          { key: 'ALL', label: 'All', badge: patients.length },
          { key: 'ALERTS', label: 'Alerts' },
          { key: 'VIPD', label: 'Virtual IPD' },
          { key: 'ACU', label: 'Acute' },
          { key: 'CCM', label: 'Chronic' },
          { key: 'RPM', label: 'RPM' },
        ]}
      />
      {list.length === 0 ? <Empty icon="search" title="No matching patients" text="Try a different name, UHID or filter." /> : null}
      {list.map((p) => {
        const w = worstCls(p.id);
        const r = patientNews2(p);
        const hasVitals = p.episodes.some((e) => e.pathway === 'VIPD');
        return (
          <Card key={p.id} onPress={() => nav.navigate('PatientChart', { patientId: p.id })} accent={w === 'E' ? colors.critical : w === 'U' ? colors.urgent : undefined}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Avatar name={p.name} size={40} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={type.h3}>{p.name} <Text style={type.small}>{p.age}{p.sex} · {p.uhid}</Text></Text>
                <Text style={type.small} numberOfLines={1}>{p.diagnosis}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {p.episodes.map((e) => <PathwayChip key={e.id} pathway={e.pathway} extra={episodeExtra(e)} />)}
                  {w === 'E' ? <Pill label="Critical" color={colors.critical} /> : w === 'U' ? <Pill label="Urgent" color={colors.urgent} /> : null}
                </View>
              </View>
              {hasVitals ? <News2Badge r={r} /> : null}
            </View>
          </Card>
        );
      })}
    </Screen>
  );
}

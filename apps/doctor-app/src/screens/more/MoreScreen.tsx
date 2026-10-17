/** More menu – profile, shift tools, governance views, sign out. */
import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, KeyValue, Screen } from '../../components/ui';
import { Avatar } from '../../components/clinical';
import { colors, spacing, type } from '../../theme/tokens';
import { useStore } from '../../store/AppStore';
import { useRootNav } from '../../navigation/hooks';

export default function MoreScreen() {
  const nav = useRootNav();
  const { doctor, dispatch, transitions, audit } = useStore();
  const items: { label: string; icon: React.ComponentProps<typeof Ionicons>['name']; go: () => void; sub?: string }[] = [
    { label: 'Shift handover (I-PASS)', icon: 'swap-horizontal-outline', go: () => nav.navigate('ShiftHandover') },
    { label: 'Assess Virtual IPD admission', icon: 'bed-outline', go: () => nav.navigate('Eligibility', {}) },
    { label: 'Screen catalogue (spec traceability)', icon: 'albums-outline', go: () => nav.navigate('ScreenCatalogue') },
    { label: 'Audit log', icon: 'shield-checkmark-outline', go: () => nav.navigate('AuditLog'), sub: `${audit.length} entries · ${transitions.length} transitions` },
  ];
  return (
    <Screen>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar name={doctor.name} size={52} />
          <View style={{ marginLeft: spacing.md, flex: 1 }}>
            <Text style={type.h2}>{doctor.name}</Text>
            <Text style={type.small}>{doctor.speciality}</Text>
          </View>
        </View>
        <KeyValue k="Role" v={doctor.role.replace('_', '-')} />
        <KeyValue k="Registration no." v={doctor.regNo} />
      </Card>
      {items.map((i) => (
        <Card key={i.label} onPress={i.go}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name={i.icon} size={22} color={colors.primary} style={{ marginRight: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Text style={type.h3}>{i.label}</Text>
              {i.sub ? <Text style={type.small}>{i.sub}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        </Card>
      ))}
      <Text style={[type.tiny, { textAlign: 'center', marginVertical: spacing.md }]}>MyDoctor24 Doctor · v0.1 demo build · fictional data only · not for clinical use</Text>
      <Button label="Sign out" kind="ghost" icon="log-out-outline" onPress={() => dispatch({ type: 'SIGN_OUT' })} />
    </Screen>
  );
}

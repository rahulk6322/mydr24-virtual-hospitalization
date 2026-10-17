/** D-08 Care-Team Assignment – primary doctor and command-centre nurse are mandatory. */
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Banner, Button, Card, Pill, Screen, Stepper } from '../../components/ui';
import { Avatar, PatientHeader } from '../../components/clinical';
import { colors, spacing, type } from '../../theme/tokens';
import { useStore } from '../../store/AppStore';
import { useParams, useRootNav } from '../../navigation/hooks';

const ROLES: { key: string; label: string; mandatory: boolean; options: string[] }[] = [
  { key: 'md', label: 'Primary doctor', mandatory: true, options: ['Dr. Ramesh Kumar', 'Dr. Priya Sharma'] },
  { key: 'cc', label: 'Command-centre nurse', mandatory: true, options: ['Priya Nair (RN)', 'Kavita Singh (RN)'] },
  { key: 'field', label: 'Field nurse', mandatory: false, options: ['Amit Verma (RN)', 'Neha Gupta (RN)'] },
  { key: 'physio', label: 'Physiotherapist', mandatory: false, options: ['Amit Verma (Physio)'] },
  { key: 'diet', label: 'Dietitian', mandatory: false, options: ['Neha Gupta (Dietitian)'] },
  { key: 'spec', label: 'Specialist on call', mandatory: false, options: ['Dr. A. Khan (Pulmonology)', 'Dr. S. Rao (Cardiology)'] },
];

export default function CareTeamScreen() {
  const { patientId } = useParams<'CareTeam'>();
  const nav = useRootNav();
  const { patient, doctor, dispatch } = useStore();
  const p = patient(patientId)!;
  const [team, setTeam] = useState<Record<string, string | undefined>>({ md: doctor.name });
  const missing = ROLES.filter((r) => r.mandatory && !team[r.key]);

  const cycle = (key: string, options: string[]) => {
    const i = team[key] ? options.indexOf(team[key]!) : -1;
    setTeam((t) => ({ ...t, [key]: i + 1 < options.length ? options[i + 1] : undefined }));
  };

  return (
    <Screen>
      <Stepper steps={['Eligibility', 'Consent', 'Baseline', 'Plan']} current={3} />
      <PatientHeader p={p} compact />
      {ROLES.map((r) => (
        <Card key={r.key}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {team[r.key] ? <Avatar name={team[r.key]!} size={36} /> : <View style={{ width: 36 }} />}
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text style={type.small}>{r.label}{r.mandatory ? ' *' : ''}</Text>
              <Text style={[type.h3, !team[r.key] && { color: colors.textSoft }]}>{team[r.key] ?? 'Not assigned'}</Text>
            </View>
            <Pressable onPress={() => cycle(r.key, r.options)} accessibilityRole="button" style={{ padding: 6 }}>
              <Pill label={team[r.key] ? 'Change' : r.mandatory ? 'Assign' : 'Optional'} color={team[r.key] ? colors.primary : r.mandatory ? colors.urgent : colors.textMuted} />
            </Pressable>
          </View>
        </Card>
      ))}
      {missing.length ? <Banner tone="warn" title={`Assign: ${missing.map((m) => m.label).join(', ')}`} /> : null}
      <Button
        label="Assign care team"
        icon="people"
        disabled={missing.length > 0}
        onPress={() => {
          dispatch({ type: 'AUDIT', entry: { action: 'CARE_TEAM', patientId, detail: Object.entries(team).filter(([, v]) => v).map(([k, v]) => `${k}:${v}`).join(' · ') } });
          nav.navigate('CarePlan', { patientId });
        }}
      />
    </Screen>
  );
}

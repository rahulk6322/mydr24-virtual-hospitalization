/**
 * Screen catalogue – traceability from master-spec screen IDs (§18) to implemented routes.
 * "Built" = implemented in this build; "Planned" = in the 69-screen Phase-1 inventory, not yet built.
 */
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Card, Pill, Screen, Segmented } from '../../components/ui';
import { colors, type } from '../../theme/tokens';
import { useStore } from '../../store/AppStore';
import { useRootNav } from '../../navigation/hooks';
import type { RootStackParamList } from '../../navigation/types';

type Entry = { id: string; name: string; route?: keyof RootStackParamList | 'TAB' };

export const CATALOGUE: { group: string; items: Entry[] }[] = [
  { group: 'Unified', items: [
    { id: 'UD-D-01', name: 'Unified clinical dashboard', route: 'TAB' }, { id: 'UD-D-02', name: 'Patient header & pathway summary', route: 'PatientChart' },
    { id: 'UD-D-03', name: 'Transition request & authorisation', route: 'Transition' }, { id: 'UD-D-04', name: 'Unified event inbox', route: 'TAB' },
  ] },
  { group: 'Virtual IPD', items: [
    { id: 'D-01', name: 'Login & role', route: 'Login' }, { id: 'D-02', name: 'Doctor dashboard', route: 'TAB' }, { id: 'D-03', name: 'Patient census & filters', route: 'TAB' },
    { id: 'D-04', name: 'Admission eligibility', route: 'Eligibility' }, { id: 'D-05', name: 'Consent review', route: 'Consent' }, { id: 'D-06', name: 'Baseline assessment', route: 'Baseline' },
    { id: 'D-07', name: 'Goals of care & code status', route: 'GoalsOfCare' }, { id: 'D-08', name: 'Care-team assignment', route: 'CareTeam' }, { id: 'D-09', name: 'Initial care plan', route: 'CarePlan' },
    { id: 'D-10', name: 'Device & connectivity', route: 'DeviceStatus' }, { id: 'D-11', name: 'Alarm thresholds profile' }, { id: 'D-12', name: 'ICU monitoring dashboard', route: 'IcuMonitor' },
    { id: 'D-13', name: 'Results viewer', route: 'Results' }, { id: 'D-14', name: 'Unified patient chart', route: 'PatientChart' }, { id: 'D-15', name: 'Real-time vitals & trends', route: 'VitalsTrends' },
    { id: 'D-16', name: 'Medication reconciliation', route: 'MedRec' }, { id: 'D-17', name: 'e-Prescription & MAR', route: 'Prescription' }, { id: 'D-18', name: 'Order entry (CPOE)', route: 'Orders' },
    { id: 'D-19', name: 'Lab & imaging orders', route: 'Orders' }, { id: 'D-20', name: 'Overnight review', route: 'OvernightReview' }, { id: 'D-21', name: 'Tele-round console', route: 'TeleRound' },
    { id: 'D-22', name: 'SOAP progress note', route: 'SoapNote' }, { id: 'D-23', name: 'Alert inbox', route: 'TAB' }, { id: 'D-24', name: 'Alert detail', route: 'AlertDetail' },
    { id: 'D-25', name: 'Emergency response console', route: 'Emergency' }, { id: 'D-26', name: 'Escalation decision', route: 'Escalation' }, { id: 'D-27', name: 'Hospital handover', route: 'Handover' },
    { id: 'D-28', name: 'Shift handover (I-PASS)', route: 'ShiftHandover' }, { id: 'D-29', name: 'Care-team chat', route: 'Chat' }, { id: 'D-30', name: 'Family update', route: 'FamilyUpdate' },
    { id: 'D-31', name: 'Progress analytics & history' }, { id: 'D-32', name: 'Discharge (3-step)', route: 'Discharge' },
  ] },
  { group: 'Acute Care', items: [
    { id: 'AC-D-01', name: 'Acute intake queue', route: 'TAB' }, { id: 'AC-D-02', name: 'Identity, consent & red flags', route: 'AcuteTriage' }, { id: 'AC-D-03', name: 'Triage (approved protocol)', route: 'AcuteTriage' },
    { id: 'AC-D-04', name: 'Acute consultation workspace', route: 'AcuteWorkspace' }, { id: 'AC-D-05', name: 'Acute med reconciliation', route: 'MedRec' }, { id: 'AC-D-06', name: 'Acute orders', route: 'Orders' },
    { id: 'AC-D-07', name: 'Acute assessment & plan', route: 'SoapNote' }, { id: 'AC-D-08', name: 'Arrange services', route: 'AcuteWorkspace' }, { id: 'AC-D-09', name: 'Safety-net & follow-up', route: 'AcuteWorkspace' },
    { id: 'AC-D-10', name: 'Reassessment & exceptions', route: 'AcuteWorkspace' }, { id: 'AC-D-11', name: 'Acute closure / escalation', route: 'AcuteClosure' },
  ] },
  { group: 'Chronic Care', items: [
    { id: 'CC-D-01', name: 'Chronic dashboard', route: 'TAB' }, { id: 'CC-D-02', name: 'Worklist / patient list', route: 'TAB' }, { id: 'CC-D-03', name: 'Referral & screening' },
    { id: 'CC-D-04', name: 'Enrolment consent & family access' }, { id: 'CC-D-05', name: 'Longitudinal profile' }, { id: 'CC-D-06', name: 'Baseline & risk' },
    { id: 'CC-D-07', name: 'Medication reconciliation', route: 'MedRec' }, { id: 'CC-D-08', name: 'Care plan builder' }, { id: 'CC-D-09', name: 'Monitoring plan & targets' },
    { id: 'CC-D-10', name: 'Longitudinal trends', route: 'VitalsTrends' }, { id: 'CC-D-11', name: 'Chronic alert inbox', route: 'TAB' }, { id: 'CC-D-12', name: 'Reassessment decision', route: 'ChronicReassess' },
    { id: 'CC-D-13', name: 'Post-acute review' }, { id: 'CC-D-14', name: 'Referral & MDT' }, { id: 'CC-D-15', name: 'Scheduled review', route: 'SoapNote' }, { id: 'CC-D-16', name: 'Programme outcomes' },
  ] },
  { group: 'RPM & Opinion', items: [
    { id: 'RM-D-01', name: 'RPM order & monitoring plan' }, { id: 'RM-D-02', name: 'RPM panel & data review', route: 'TAB' }, { id: 'RM-D-03', name: 'RPM patient trends', route: 'VitalsTrends' },
    { id: 'RM-D-04', name: 'RPM alert rules (patient)' }, { id: 'RM-D-05', name: 'RPM reassessment & transition', route: 'Transition' }, { id: 'SP-D-01', name: 'Opinion request (referral / 2nd / 3rd)' },
  ] },
];

export default function ScreenCatalogueScreen() {
  const nav = useRootNav();
  const { patients } = useStore();
  const [f, setF] = useState<'ALL' | 'BUILT' | 'PLANNED'>('ALL');
  const all = CATALOGUE.flatMap((g) => g.items);
  const built = all.filter((i) => i.route).length;
  const demoPatient = patients.find((p) => p.id === 'p-sita')!.id;

  const open = (e: Entry) => {
    if (!e.route || e.route === 'TAB' || e.route === 'Login') return;
    const r = e.route;
    if (r === 'ShiftHandover' || r === 'ScreenCatalogue' || r === 'AuditLog') return nav.navigate(r);
    if (r === 'Eligibility') return nav.navigate('Eligibility', {});
    if (r === 'AlertDetail') return nav.navigate('AlertDetail', { eventId: 'ev1' });
    const pid = r.startsWith('Acute') ? 'p-anil' : r === 'ChronicReassess' ? 'p-kamala' : demoPatient;
    // Remaining routes all take { patientId } – demo navigation with a sample patient.
    (nav.navigate as (name: string, params: { patientId: string }) => void)(r, { patientId: pid });
  };

  return (
    <Screen>
      <Text style={[type.small, { marginBottom: 8 }]}>{built} of {all.length} Phase-1 doctor screens built in this release (multi-screen routes cover several IDs).</Text>
      <Segmented value={f} onChange={setF} options={[{ key: 'ALL', label: 'All' }, { key: 'BUILT', label: 'Built' }, { key: 'PLANNED', label: 'Planned' }]} />
      {CATALOGUE.map((g) => {
        const items = g.items.filter((i) => f === 'ALL' || (f === 'BUILT' ? !!i.route : !i.route));
        if (!items.length) return null;
        return (
          <View key={g.group}>
            <Text style={[type.h3, { marginVertical: 8 }]}>{g.group}</Text>
            {items.map((i) => (
              <Card key={i.id} onPress={i.route && i.route !== 'TAB' && i.route !== 'Login' ? () => open(i) : undefined} style={{ paddingVertical: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[type.small, { width: 72, fontWeight: '700' }]}>{i.id}</Text>
                  <Text style={[type.body, { flex: 1 }]}>{i.name}</Text>
                  <Pill label={i.route ? (i.route === 'TAB' ? 'Tab' : 'Built') : 'Planned'} color={i.route ? colors.stable : colors.textMuted} />
                </View>
              </Card>
            ))}
          </View>
        );
      })}
    </Screen>
  );
}

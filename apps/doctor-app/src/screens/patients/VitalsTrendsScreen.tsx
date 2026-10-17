/** D-15 Real-Time Vitals & Trends (also CC-D-10 Longitudinal Trends). Gaps are never interpolated. */
import React, { useState } from 'react';
import { Text } from 'react-native';
import { Banner, Screen, Segmented } from '../../components/ui';
import { PatientHeader, TrendChart, vitalLabel } from '../../components/clinical';
import { useStore } from '../../store/AppStore';
import { useParams } from '../../navigation/hooks';
import type { VitalCode } from '../../types/models';
import { DAY, HOUR, series } from '../../utils/clinical';
import { colors, type } from '../../theme/tokens';

type Range = '1h' | '6h' | '24h' | '7d' | '30d';
const rangeMs: Record<Range, number> = { '1h': HOUR, '6h': 6 * HOUR, '24h': DAY, '7d': 7 * DAY, '30d': 30 * DAY };

/** Display bands only – patient-specific targets come from the signed care plan / threshold profile. */
const bands: Partial<Record<VitalCode, [number, number]>> = { SPO2: [94, 100], HR: [51, 90], SBP: [111, 139], RR: [12, 20], TEMP: [97, 99.5], GLU: [80, 180] };

export default function VitalsTrendsScreen() {
  const { patientId } = useParams<'VitalsTrends'>();
  const { patient } = useStore();
  const p = patient(patientId)!;
  const isLong = p.episodes.some((e) => e.pathway === 'CCM' || e.pathway === 'RPM');
  const [range, setRange] = useState<Range>(isLong ? '7d' : '24h');
  const codes = (['SPO2', 'HR', 'SBP', 'DBP', 'RR', 'TEMP', 'GLU', 'WT'] as VitalCode[]).filter((c) => p.observations.some((o) => o.code === c));

  return (
    <Screen>
      <PatientHeader p={p} compact />
      <Segmented<Range> value={range} onChange={setRange} options={(['1h', '6h', '24h', '7d', '30d'] as Range[]).map((k) => ({ key: k, label: k }))} />
      <Banner tone="info" title="Green band = display reference" text="Patient-specific targets are set in the care plan / alarm thresholds. Orange points are outside the band. Gaps mean no data – they are not filled in." />
      {codes.map((c) => (
        <TrendChart key={c} label={vitalLabel[c] === 'DBP' ? 'Diastolic BP' : vitalLabel[c]} data={series(p.observations, c, rangeMs[range])} band={bands[c]} unit={p.observations.find((o) => o.code === c)?.unit} />
      ))}
      <Text style={[type.tiny, { color: colors.textMuted }]}>Source of each point is stored (device / nurse / patient). Export available in the full build.</Text>
    </Screen>
  );
}

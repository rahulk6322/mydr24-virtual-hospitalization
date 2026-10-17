/** D-05 Consent Review – granular scopes (DPDP), patient or legally authorised representative (LAR). */
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Button, Card, CheckRow, Choice, Screen, Segmented, Stepper } from '../../components/ui';
import { PatientHeader } from '../../components/clinical';
import { colors, spacing, type } from '../../theme/tokens';
import { useStore } from '../../store/AppStore';
import { useParams, useRootNav } from '../../navigation/hooks';

const DOCS = [
  { key: 'vipd', label: 'Virtual hospitalization consent', mandatory: true },
  { key: 'tele', label: 'Tele-consultation consent (NMC Telemedicine Guidelines)', mandatory: true },
  { key: 'data', label: 'Data sharing & privacy notice (DPDP) – in patient language', mandatory: true },
  { key: 'emerg', label: 'Emergency & hospital transfer consent', mandatory: true },
  { key: 'family', label: 'Family data-sharing scope (who sees what)', mandatory: false },
  { key: 'record', label: 'Video recording of rounds (optional)', mandatory: false },
];

export default function ConsentScreen() {
  const { patientId } = useParams<'Consent'>();
  const nav = useRootNav();
  const { patient, dispatch } = useStore();
  const p = patient(patientId)!;
  const [who, setWho] = useState<'PATIENT' | 'LAR'>('PATIENT');
  const [signed, setSigned] = useState<Record<string, boolean>>({});
  const [method, setMethod] = useState<'AADHAAR' | 'OTP' | 'DRAWN'>();
  const [confirm, setConfirm] = useState(false);
  const mandatoryOk = DOCS.filter((d) => d.mandatory).every((d) => signed[d.key]);
  const ok = mandatoryOk && !!method && confirm;

  return (
    <Screen>
      <Stepper steps={['Eligibility', 'Consent', 'Baseline', 'Plan']} current={1} />
      <PatientHeader p={p} compact />
      <Segmented value={who} onChange={setWho} options={[{ key: 'PATIENT', label: 'Patient consent' }, { key: 'LAR', label: 'Family / LAR consent' }]} />
      <Card>
        {DOCS.map((d) => (
          <View key={d.key} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="document-text" size={20} color={colors.critical} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <CheckRow label={`${d.label}${d.mandatory ? ' *' : ''}`} value={!!signed[d.key]} onChange={(v) => setSigned((s) => ({ ...s, [d.key]: v }))} hint={signed[d.key] ? `Signed ${new Date().toLocaleTimeString()}` : 'View & sign'} />
            </View>
          </View>
        ))}
      </Card>
      <Card>
        <Text style={[type.h3, { marginBottom: spacing.sm }]}>e-Sign method</Text>
        <Choice options={[{ key: 'AADHAAR', label: 'Aadhaar e-Sign' }, { key: 'OTP', label: 'Mobile OTP' }, { key: 'DRAWN', label: 'Drawn signature + witness' }]} value={method} onChange={setMethod} />
        <CheckRow label={`I confirm consent was obtained from the ${who === 'PATIENT' ? 'patient' : 'legally authorised representative'} after explanation in their language.`} value={confirm} onChange={setConfirm} />
      </Card>
      {!signed.family ? <Banner tone="info" title="No family scope signed" text="Family updates (D-30) will be unavailable until a family data-sharing scope is signed." /> : null}
      <Button
        label="Confirm & continue"
        icon="arrow-forward"
        disabled={!ok}
        onPress={() => {
          dispatch({ type: 'AUDIT', entry: { action: 'CONSENT_SIGNED', patientId, detail: `${who} · ${method} · ${Object.keys(signed).filter((k) => signed[k]).join(',')}` } });
          nav.navigate('Baseline', { patientId });
        }}
      />
      {!mandatoryOk ? <Text style={[type.tiny, { textAlign: 'center' }]}>* mandatory before monitoring can start</Text> : null}
    </Screen>
  );
}

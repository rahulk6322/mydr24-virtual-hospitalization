/**
 * D-17 e-Prescription & MAR – RMP identity + registration number + digital signature on every e-Rx
 * (NMC Telemedicine Practice Guidelines 2020). Status distinguishes Given / Due / Missed / PRN / Held.
 */
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Button, Card, CheckRow, KeyValue, Pill, Screen, Segmented } from '../../components/ui';
import { PatientHeader } from '../../components/clinical';
import { colors, spacing, type } from '../../theme/tokens';
import { useStore } from '../../store/AppStore';
import { useParams, useRootNav } from '../../navigation/hooks';
import type { Medication } from '../../types/models';

const statusColor: Record<Medication['status'], string> = { GIVEN: colors.stable, DUE: colors.urgent, MISSED: colors.critical, PRN: colors.technical, HELD: colors.textMuted, ACTIVE: colors.primary };

export default function PrescriptionScreen() {
  const { patientId } = useParams<'Prescription'>();
  const nav = useRootNav();
  const { patient, doctor, dispatch } = useStore();
  const p = patient(patientId)!;
  const [tab, setTab] = useState<'ACTIVE' | 'ALL'>('ACTIVE');
  const [ack, setAck] = useState(false);
  const [sent, setSent] = useState(false);
  const list = tab === 'ACTIVE' ? p.meds.filter((m) => m.status !== 'HELD') : p.meds;

  return (
    <Screen>
      <PatientHeader p={p} compact />
      <Segmented value={tab} onChange={setTab} options={[{ key: 'ACTIVE', label: 'Active' }, { key: 'ALL', label: 'All' }]} />
      {list.map((m) => (
        <Card key={m.id} accent={statusColor[m.status]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="medkit" size={20} color={statusColor[m.status]} style={{ marginRight: spacing.md }} />
            <View style={{ flex: 1 }}>
              <Text style={type.h3}>{m.name} {m.dose} {m.route}</Text>
              <Text style={type.small}>{m.frequency}{m.dayOf ? ` · ${m.dayOf}` : ''}{m.highAlert ? ' · high-alert' : ''}</Text>
            </View>
            <Pill label={m.status} color={statusColor[m.status]} />
          </View>
        </Card>
      ))}
      <Card>
        <Text style={[type.h3, { marginBottom: 4 }]}>e-Prescription details</Text>
        <KeyValue k="Prescriber" v={doctor.name} />
        <KeyValue k="Registration no." v={doctor.regNo} />
        <KeyValue k="Patient" v={`${p.name} · ${p.age}${p.sex} · ${p.uhid}`} />
        <KeyValue k="Allergies" v={p.allergies.join(', ') || 'NKDA'} vColor={p.allergies.length ? colors.critical : undefined} />
        <KeyValue k="Pharmacy" v="Partner pharmacy (nearest)" />
        <CheckRow label="Drugs comply with NMC telemedicine prescribing lists for this consultation type" value={ack} onChange={setAck} />
      </Card>
      {sent ? <Banner tone="success" title="e-Prescription signed and sent" text="Delivery tracking appears in the patient's app. Copy pushed to ABHA (if consented)." /> : null}
      <Button label="Sign & send e-Prescription" icon="send" disabled={!ack || sent || list.length === 0} onPress={() => { dispatch({ type: 'AUDIT', entry: { action: 'ERX_SIGNED', patientId, detail: list.map((m) => m.name).join(', ') } }); setSent(true); }} />
      <Button label="Add / change orders" kind="secondary" icon="add" onPress={() => nav.navigate('Orders', { patientId })} />
    </Screen>
  );
}

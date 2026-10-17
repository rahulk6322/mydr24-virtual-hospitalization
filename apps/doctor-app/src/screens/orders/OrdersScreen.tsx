/**
 * D-18 / D-19 Order Entry (CPOE) – medications, labs, imaging, nursing.
 * Safety checks: allergy, duplicate therapy, high-alert double confirmation, home-ineligible block.
 */
import React, { useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Button, Card, CheckRow, Pill, Screen, SectionTitle, Segmented } from '../../components/ui';
import { PatientHeader } from '../../components/clinical';
import { colors, radius, spacing, type } from '../../theme/tokens';
import { uid, useStore } from '../../store/AppStore';
import { useParams, useRootNav } from '../../navigation/hooks';
import { FORMULARY, IMAGING, LABS, NURSING, allergyConflict, type DrugItem } from '../../data/formulary';

type Tab = 'MEDS' | 'LABS' | 'IMAGING' | 'NURSING';

export default function OrdersScreen() {
  const { patientId } = useParams<'Orders'>();
  const nav = useRootNav();
  const { patient, dispatch, doctor } = useStore();
  const p = patient(patientId)!;
  // Every MYDR24 pathway delivers care at home, so home-ineligible therapies are always blocked here.
  const isHome = true;
  const [tab, setTab] = useState<Tab>('MEDS');
  const [q, setQ] = useState('');
  const [cart, setCart] = useState<DrugItem[]>([]);
  const [svc, setSvc] = useState<string[]>([]);
  const [urgent, setUrgent] = useState(false);
  const [confirmHigh, setConfirmHigh] = useState(false);
  const [done, setDone] = useState<string>();

  const results = useMemo(() => FORMULARY.filter((d) => d.name.toLowerCase().includes(q.trim().toLowerCase())), [q]);
  const highInCart = cart.some((d) => d.highAlert);
  const canSign = (cart.length > 0 || svc.length > 0) && (!highInCart || confirmHigh);

  const addDrug = (d: DrugItem) => {
    if (d.homeIneligible && isHome) return;
    if (allergyConflict(d, p.allergies)) return;
    if (cart.some((c) => c.id === d.id)) return;
    setCart((c) => [...c, d]);
  };

  const sign = () => {
    if (cart.length) {
      dispatch({ type: 'ADD_MEDS', patientId, meds: cart.map((d) => ({ id: uid('m'), name: d.name, dose: d.defaultDose, route: d.route, frequency: d.frequency, status: 'DUE', highAlert: d.highAlert })) });
    }
    if (svc.length) dispatch({ type: 'AUDIT', entry: { action: 'SERVICE_ORDERS', patientId, detail: `${urgent ? 'URGENT ' : ''}${svc.join(', ')}` } });
    setDone(`${cart.length} medication(s) and ${svc.length} service order(s) signed by ${doctor.name}${urgent ? ' · urgent field task created' : ''}`);
    setCart([]); setSvc([]); setConfirmHigh(false);
  };

  const svcList = tab === 'LABS' ? LABS : tab === 'IMAGING' ? IMAGING : NURSING;

  return (
    <Screen>
      <PatientHeader p={p} compact />
      {done ? <Banner tone="success" title="Orders signed" text={done} /> : null}
      <Segmented<Tab> value={tab} onChange={setTab} options={[{ key: 'MEDS', label: 'Medications' }, { key: 'LABS', label: 'Labs' }, { key: 'IMAGING', label: 'Imaging' }, { key: 'NURSING', label: 'Nursing / visits' }]} />

      {tab === 'MEDS' ? (
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.md, marginBottom: spacing.md }}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput value={q} onChangeText={setQ} placeholder="Search formulary…" placeholderTextColor={colors.textSoft} style={{ flex: 1, minHeight: 46, marginLeft: 8, fontSize: 15, color: colors.text }} accessibilityLabel="Search medications" />
          </View>
          {results.map((d) => {
            const allergy = allergyConflict(d, p.allergies);
            const blocked = d.homeIneligible && isHome;
            const dup = p.meds.some((m) => m.name === d.name);
            const inCart = cart.some((c) => c.id === d.id);
            return (
              <Card key={d.id} accent={blocked || allergy ? colors.critical : d.highAlert ? colors.urgent : undefined} onPress={() => addDrug(d)}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[type.h3, (blocked || allergy) && { color: colors.textSoft }]}>{d.name}</Text>
                    <Text style={type.small}>{d.defaultDose} · {d.route} · {d.frequency}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {d.highAlert ? <Pill label="High-alert" color={colors.urgent} icon="warning-outline" /> : null}
                      {blocked ? <Pill label="Requires hospital admission" color={colors.critical} icon="ban-outline" /> : null}
                      {allergy ? <Pill label={`Allergy conflict: ${allergy}`} color={colors.critical} icon="alert-circle-outline" /> : null}
                      {dup ? <Pill label="Already prescribed – duplicate?" color={colors.advisory} /> : null}
                    </View>
                  </View>
                  <Ionicons name={inCart ? 'checkmark-circle' : blocked || allergy ? 'close-circle-outline' : 'add-circle-outline'} size={26} color={inCart ? colors.stable : blocked || allergy ? colors.critical : colors.primary} />
                </View>
              </Card>
            );
          })}
        </View>
      ) : (
        <Card>
          <CheckRow label="Urgent (creates field task with SLA)" value={urgent} onChange={setUrgent} />
          {svcList.map((x) => (
            <CheckRow key={x} label={x} value={svc.includes(x)} onChange={() => setSvc((s) => (s.includes(x) ? s.filter((y) => y !== x) : [...s, x]))} hint={x.includes('requires transfer') ? 'Needs transport to a centre' : undefined} />
          ))}
        </Card>
      )}

      <SectionTitle title={`Order cart (${cart.length + svc.length})`} />
      <Card>
        {cart.length + svc.length === 0 ? <Text style={type.small}>No items yet. Tap items above to add.</Text> : null}
        {cart.map((d) => (
          <View key={d.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
            <Text style={type.body}>{d.name} {d.defaultDose} {d.route} {d.frequency}</Text>
            <Text style={{ color: colors.critical }} onPress={() => setCart((c) => c.filter((x) => x.id !== d.id))}>Remove</Text>
          </View>
        ))}
        {svc.map((x) => <Text key={x} style={[type.body, { paddingVertical: 4 }]}>• {x}</Text>)}
        {highInCart ? <CheckRow label="I confirm high-alert medication dose, route and monitoring (second check)" value={confirmHigh} onChange={setConfirmHigh} /> : null}
      </Card>
      <Button label="Review & sign orders" icon="create-outline" disabled={!canSign} onPress={sign} />
      <Button label="Go to e-Prescription & MAR" kind="secondary" icon="medkit-outline" onPress={() => nav.navigate('Prescription', { patientId })} />
    </Screen>
  );
}

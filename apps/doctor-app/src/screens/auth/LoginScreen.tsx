/** D-01 Login & Role Selection – MFA (OTP) + role context. Demo OTP: any 6 digits. */
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Button, Field } from '../../components/ui';
import { colors, radius, spacing, type } from '../../theme/tokens';
import { useStore } from '../../store/AppStore';
import type { Doctor } from '../../types/models';

const roles: { key: Doctor['role']; title: string; sub: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'DOCTOR', title: 'Doctor / Intensivist', sub: 'Virtual IPD · Acute · Chronic · RPM', icon: 'medkit-outline' },
  { key: 'CONSULTANT', title: 'Consultant', sub: 'Specialist consults & opinions', icon: 'school-outline' },
  { key: 'ON_CALL', title: 'On-call Doctor', sub: 'Emergency & alert cover', icon: 'call-outline' },
];

export default function LoginScreen() {
  const { dispatch } = useStore();
  const [role, setRole] = useState<Doctor['role']>('DOCTOR');
  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [attempts, setAttempts] = useState(0);
  const locked = attempts >= 5;
  const mobileOk = /^\d{10}$/.test(mobile);

  const verify = () => {
    if (/^\d{6}$/.test(otp)) dispatch({ type: 'SIGN_IN', role });
    else setAttempts((a) => a + 1);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
          <View style={{ alignItems: 'center', marginVertical: spacing.xxl }}>
            <View style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="add" size={44} color={colors.white} />
            </View>
            <Text style={[type.h1, { marginTop: spacing.md, color: colors.primary }]}>MyDoctor24</Text>
            <Text style={type.small}>Doctor Login · Clinical Command Access</Text>
          </View>

          <Text style={[type.h3, { marginBottom: spacing.sm }]}>Select role</Text>
          {roles.map((r) => {
            const sel = r.key === role;
            return (
              <Pressable
                key={r.key}
                onPress={() => setRole(r.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: sel }}
                style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: sel ? colors.primary : colors.border, backgroundColor: sel ? colors.primarySoft : colors.card, marginBottom: spacing.sm }}
              >
                <Ionicons name={r.icon} size={22} color={colors.primary} style={{ marginRight: spacing.md }} />
                <View style={{ flex: 1 }}>
                  <Text style={[type.body, { fontWeight: '700' }]}>{r.title}</Text>
                  <Text style={type.small}>{r.sub}</Text>
                </View>
                <Ionicons name={sel ? 'radio-button-on' : 'radio-button-off'} size={20} color={sel ? colors.primary : colors.textSoft} />
              </Pressable>
            );
          })}

          <View style={{ marginTop: spacing.lg }}>
            <Field label="Registered mobile number" value={mobile} onChangeText={(t) => setMobile(t.replace(/\D/g, '').slice(0, 10))} keyboardType="phone-pad" placeholder="10-digit mobile" error={mobile && !mobileOk ? 'Enter 10 digits' : undefined} />
            {otpSent ? (
              <Field label="One-time password (MFA)" value={otp} onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))} keyboardType="numeric" placeholder="6-digit OTP" error={attempts ? `Incorrect OTP (${attempts}/5)` : undefined} />
            ) : null}
            {locked ? <Banner tone="danger" title="Account locked" text="Too many attempts. Contact the MYDR24 admin desk." /> : null}
            {!otpSent ? (
              <Button label="Send OTP" icon="lock-closed-outline" disabled={!mobileOk} onPress={() => setOtpSent(true)} />
            ) : (
              <Button label="Verify & Continue" icon="shield-checkmark-outline" disabled={locked || otp.length !== 6} onPress={verify} />
            )}
            <Text style={[type.tiny, { textAlign: 'center', marginTop: spacing.md }]}>
              Demo build · any 6-digit OTP works · sessions time out after 15 min idle · all access is audited
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

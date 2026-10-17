/** Generic UI primitives derived from the MyDoctor24 visual language (see theme/tokens.ts note). */
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing, TOUCH, type } from '../theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export function Screen({ children, scroll = true, padded = true }: { children: React.ReactNode; scroll?: boolean; padded?: boolean }) {
  const inner = <View style={[padded && styles.pad]}>{children}</View>;
  return scroll ? (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
      {inner}
    </ScrollView>
  ) : (
    <View style={[styles.screen, padded && styles.pad, { flex: 1 }]}>{children}</View>
  );
}

export function Card({ children, style, onPress, accent }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void; accent?: string }) {
  const body = (
    <View style={[styles.card, accent ? { borderLeftWidth: 4, borderLeftColor: accent } : null, style]}>{children}</View>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={type.h3}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={12} accessibilityRole="button">
          <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 13 }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

type BtnKind = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
export function Button({
  label, onPress, kind = 'primary', icon, disabled, loading, style, testID,
}: { label: string; onPress: () => void; kind?: BtnKind; icon?: IconName; disabled?: boolean; loading?: boolean; style?: ViewStyle; testID?: string }) {
  const bg = { primary: colors.primary, secondary: colors.primarySoft, danger: colors.critical, ghost: 'transparent', success: colors.stable }[kind];
  const fg = kind === 'secondary' || kind === 'ghost' ? colors.primary : colors.white;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1, borderWidth: kind === 'ghost' ? 1 : 0, borderColor: colors.primary },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <View style={styles.row}>
          {icon ? <Ionicons name={icon} size={18} color={fg} style={{ marginRight: 6 }} /> : null}
          <Text style={{ color: fg, fontWeight: '700', fontSize: 15 }}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Pill({ label, color, soft, icon }: { label: string; color: string; soft?: string; icon?: IconName }) {
  return (
    <View style={[styles.pill, { backgroundColor: soft ?? `${color}1A`, borderColor: soft ? 'transparent' : `${color}55` }]}>
      {icon ? <Ionicons name={icon} size={11} color={color} style={{ marginRight: 3 }} /> : null}
      <Text style={{ color, fontSize: 11, fontWeight: '700' }} numberOfLines={1}>{label}</Text>
    </View>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { key: T; label: string; badge?: number }[]; value: T; onChange: (k: T) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
      <View style={styles.segment}>
        {options.map((o) => {
          const active = o.key === value;
          return (
            <Pressable
              key={o.key}
              onPress={() => onChange(o.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={[styles.segItem, active && { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: active ? colors.white : colors.text, fontWeight: '600', fontSize: 13 }}>
                {o.label}{o.badge !== undefined ? ` (${o.badge})` : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <View style={[styles.row, { marginBottom: spacing.lg }]}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={s}>
            <View style={{ alignItems: 'center', width: 64 }}>
              <View style={[styles.stepDot, (done || active) && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                {done ? <Ionicons name="checkmark" size={14} color={colors.white} /> : (
                  <Text style={{ color: active ? colors.white : colors.textMuted, fontWeight: '700', fontSize: 12 }}>{i + 1}</Text>
                )}
              </View>
              <Text style={[type.tiny, { marginTop: 4, textAlign: 'center', color: active ? colors.primary : colors.textMuted }]}>{s}</Text>
            </View>
            {i < steps.length - 1 ? <View style={[styles.stepLine, done && { backgroundColor: colors.primary }]} /> : null}
          </React.Fragment>
        );
      })}
    </View>
  );
}

export function CheckRow({
  label, value, onChange, hint, tone = 'neutral', disabled,
}: { label: string; value: boolean; onChange?: (v: boolean) => void; hint?: string; tone?: 'neutral' | 'danger'; disabled?: boolean }) {
  const onColor = tone === 'danger' ? colors.critical : colors.primary;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled || !onChange}
      onPress={() => onChange?.(!value)}
      style={styles.checkRow}
    >
      <View style={[styles.box, value && { backgroundColor: onColor, borderColor: onColor }]}>
        {value ? <Ionicons name={tone === 'danger' ? 'close' : 'checkmark'} size={14} color={colors.white} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[type.body, tone === 'danger' && value && { color: colors.critical, fontWeight: '600' }]}>{label}</Text>
        {hint ? <Text style={type.small}>{hint}</Text> : null}
      </View>
    </Pressable>
  );
}

export function Field({
  label, value, onChangeText, placeholder, multiline, keyboardType, unit, error, testID,
}: {
  label: string; value: string; onChangeText: (t: string) => void; placeholder?: string; multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'phone-pad'; unit?: string; error?: string; testID?: string;
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={[type.small, { marginBottom: 4, fontWeight: '600', color: colors.text }]}>{label}</Text>
      <View style={[styles.input, error ? { borderColor: colors.critical } : null, multiline && { minHeight: 88, alignItems: 'flex-start' }]}>
        <TextInput
          testID={testID}
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSoft}
          multiline={multiline}
          keyboardType={keyboardType}
          style={{ flex: 1, fontSize: 15, color: colors.text, paddingVertical: 10, textAlignVertical: multiline ? 'top' : 'center' }}
        />
        {unit ? <Text style={type.small}>{unit}</Text> : null}
      </View>
      {error ? <Text style={{ color: colors.critical, fontSize: 12, marginTop: 3 }}>{error}</Text> : null}
    </View>
  );
}

export function Banner({ tone, title, text, icon }: { tone: 'info' | 'warn' | 'danger' | 'success'; title: string; text?: string; icon?: IconName }) {
  const map = {
    info: [colors.technical, colors.technicalSoft, 'information-circle'],
    warn: [colors.urgent, colors.urgentSoft, 'warning'],
    danger: [colors.critical, colors.criticalSoft, 'alert-circle'],
    success: [colors.stable, colors.stableSoft, 'checkmark-circle'],
  } as const;
  const [c, soft, ic] = map[tone];
  return (
    <View accessibilityRole="alert" style={[styles.banner, { backgroundColor: soft, borderColor: `${c}55` }]}>
      <Ionicons name={icon ?? ic} size={20} color={c} style={{ marginRight: 8, marginTop: 1 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: c, fontWeight: '700', fontSize: 13.5 }}>{title}</Text>
        {text ? <Text style={{ color: colors.text, fontSize: 12.5, marginTop: 2 }}>{text}</Text> : null}
      </View>
    </View>
  );
}

export function Empty({ icon = 'checkmark-done-circle', title, text }: { icon?: IconName; title: string; text?: string }) {
  return (
    <View style={{ alignItems: 'center', padding: spacing.xxl }}>
      <Ionicons name={icon} size={44} color={colors.stable} />
      <Text style={[type.h3, { marginTop: spacing.sm }]}>{title}</Text>
      {text ? <Text style={[type.small, { textAlign: 'center', marginTop: 4 }]}>{text}</Text> : null}
    </View>
  );
}

export function KeyValue({ k, v, vColor }: { k: string; v: string; vColor?: string }) {
  return (
    <View style={styles.kv}>
      <Text style={type.small}>{k}</Text>
      <Text style={[type.body, { fontWeight: '600', color: vColor ?? colors.text, flexShrink: 1, textAlign: 'right' }]}>{v}</Text>
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function Choice<T extends string>({ options, value, onChange }: { options: { key: T; label: string; hint?: string }[]; value: T | undefined; onChange: (k: T) => void }) {
  return (
    <View>
      {options.map((o) => {
        const sel = o.key === value;
        return (
          <Pressable key={o.key} onPress={() => onChange(o.key)} accessibilityRole="radio" accessibilityState={{ selected: sel }} style={[styles.choice, sel && { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}>
            <Ionicons name={sel ? 'radio-button-on' : 'radio-button-off'} size={20} color={sel ? colors.primary : colors.textSoft} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[type.body, { fontWeight: '600' }]}>{o.label}</Text>
              {o.hint ? <Text style={type.small}>{o.hint}</Text> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  pad: { padding: spacing.lg },
  card: { backgroundColor: colors.card, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.md, ...shadow },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm, marginBottom: spacing.sm },
  btn: { minHeight: TOUCH, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, marginVertical: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center' },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, borderWidth: 1, alignSelf: 'flex-start' },
  segment: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.md, padding: 4, borderWidth: 1, borderColor: colors.border },
  segItem: { paddingHorizontal: 14, minHeight: 36, justifyContent: 'center', borderRadius: radius.sm },
  stepDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.border, marginTop: -16 },
  checkRow: { flexDirection: 'row', alignItems: 'center', minHeight: TOUCH, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.textSoft, marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  input: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 12, backgroundColor: colors.card },
  banner: { flexDirection: 'row', borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  kv: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 },
  choice: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.card, minHeight: TOUCH },
});

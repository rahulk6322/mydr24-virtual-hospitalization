/** D-29 Care-Team Chat – patient-context threads. Not for emergencies (banner links to D-25). */
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Banner, Segmented } from '../../components/ui';
import { colors, radius, spacing, type } from '../../theme/tokens';
import { uid, useStore } from '../../store/AppStore';
import { useParams, useRootNav } from '../../navigation/hooks';
import { clock } from '../../utils/clinical';
import type { ChatMessage } from '../../types/models';

export default function ChatScreen() {
  const { patientId } = useParams<'Chat'>();
  const nav = useRootNav();
  const { messages, dispatch, doctor, patient } = useStore();
  const p = patient(patientId)!;
  const [thread, setThread] = useState<ChatMessage['thread']>('TEAM');
  const [text, setText] = useState('');
  const familyAllowed = p.caregiver.some((c) => c.consentScopes.length > 0);
  const list = messages.filter((m) => m.patientId === patientId && m.thread === thread);

  const send = () => {
    if (!text.trim()) return;
    dispatch({ type: 'SEND_MESSAGE', message: { id: uid('c'), patientId, thread, from: doctor.name, text: text.trim(), at: Date.now() } });
    setText('');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }} keyboardVerticalOffset={90}>
      <View style={{ padding: spacing.lg, paddingBottom: 0 }}>
        <Text style={[type.h3, { marginBottom: 8 }]}>{p.name}</Text>
        <Segmented value={thread} onChange={setThread} options={[{ key: 'TEAM', label: 'Team' }, { key: 'FAMILY', label: 'Family' }, { key: 'FIELD', label: 'Field team' }]} />
        <Pressable onPress={() => nav.navigate('Emergency', { patientId })}>
          <Banner tone="danger" title="Not for emergencies" text="Tap here to open the emergency console instead." />
        </Pressable>
        {thread === 'FAMILY' && !familyAllowed ? <Banner tone="warn" title="No family consent scope" text="Family messaging is disabled for this patient." /> : null}
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg }}>
        {list.length === 0 ? <Text style={[type.small, { textAlign: 'center' }]}>No messages yet.</Text> : null}
        {list.map((m) => {
          const mine = m.from === doctor.name;
          return (
            <View key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '82%', backgroundColor: mine ? colors.primary : colors.card, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm }}>
              {!mine ? <Text style={[type.tiny, { fontWeight: '700', color: colors.primary }]}>{m.from}</Text> : null}
              <Text style={{ color: mine ? colors.white : colors.text, fontSize: 14 }}>{m.text}</Text>
              <Text style={{ color: mine ? '#D1E0FF' : colors.textSoft, fontSize: 10, marginTop: 3, textAlign: 'right' }}>{clock(m.at)}</Text>
            </View>
          );
        })}
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.md, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border }}>
        <TextInput value={text} onChangeText={setText} editable={thread !== 'FAMILY' || familyAllowed} placeholder="Type a message…" placeholderTextColor={colors.textSoft} accessibilityLabel="Message" style={{ flex: 1, minHeight: 44, fontSize: 15, color: colors.text }} />
        <Pressable onPress={send} accessibilityRole="button" accessibilityLabel="Send" style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="send" size={18} color={colors.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

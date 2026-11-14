import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Send,
  X,
} from 'lucide-react-native';
import { THEME, getThemeColors, FONTS } from '../theme/theme';
import { useKhataStore } from '../store/useKhataStore';
import { Header } from '../components/common/Header';
import { WireframeSimpleStarIcon } from '../components/common/WireframeIcons';
import {
  generateLedgerInsight,
  AppStateSnapshot,
} from '../services/aiService';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export default function AiAssistantScreen() {
  const router = useRouter();
  const { parties, business, cashbookEntries, bills, ledgerEntries, isDarkMode } = useKhataStore();
  const colors = getThemeColors(isDarkMode);

  const [inputQuery, setInputQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const ownerGreeting = business.ownerName ? `Hello ${business.ownerName}!` : 'Hello!';
  const businessDisplayName = business.name || 'your store';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: `${ownerGreeting} I am Lekha AI, connected to your live business ledger for ${businessDisplayName}. I have indexed ${parties.length} accounts and ${cashbookEntries.length} cashbook entries in real-time. Ask me about balances, dues, or cashflow!`,
      timestamp: 'Just now',
    },
  ]);

  const quickPrompts = [
    'How much total balance is due today?',
    `Show ${businessDisplayName} balance sheet`,
    'Who has the highest pending balance?',
    'Summarize cash in vs cash out',
  ];

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim() || isThinking) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q.trim(),
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsThinking(true);

    const snapshot: AppStateSnapshot = {
      business,
      parties,
      cashbookEntries,
      bills,
      ledgerEntries,
    };

    try {
      const responseText = await generateLedgerInsight(q.trim(), snapshot);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: responseText,
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: 'Sorry, I encountered an issue analyzing the ledger records. Please try again.',
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgCanvas }]} edges={['top']}>
      {/* Clean Minimalist Header */}
      <Header
        title="Lekha AI"
        subtitle={`${businessDisplayName} • Live`}
        showBack
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatList}
          renderItem={({ item }) => {
            const isUser = item.sender === 'user';
            return (
              <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAi]}>
                {!isUser && (
                  <View
                    style={[
                      styles.avatarCircle,
                      {
                        backgroundColor: colors.bgSecondary,
                        borderColor: colors.border,
                        borderWidth: 1,
                      },
                    ]}
                  >
                    <WireframeSimpleStarIcon size={14} color={colors.textPrimary} strokeWidth={1.8} />
                  </View>
                )}
                <View
                  style={[
                    styles.msgBubble,
                    isUser
                      ? [styles.userBubble, { backgroundColor: colors.textPrimary }]
                      : [styles.aiBubble, { backgroundColor: colors.bgCard, borderColor: colors.border }],
                  ]}
                >
                  <Text
                    style={[
                      styles.msgText,
                      { color: isUser ? colors.bgCanvas : colors.textPrimary },
                    ]}
                  >
                    {item.text}
                  </Text>
                </View>
              </View>
            );
          }}
          ListFooterComponent={
            isThinking ? (
              <View style={[styles.msgRow, styles.msgRowAi]}>
                <View
                  style={[
                    styles.avatarCircle,
                    {
                      backgroundColor: colors.bgSecondary,
                      borderColor: colors.border,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <WireframeSimpleStarIcon size={14} color={colors.textPrimary} strokeWidth={1.8} />
                </View>
                <View
                  style={[
                    styles.msgBubble,
                    styles.aiBubble,
                    { backgroundColor: colors.bgCard, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.thinkingRow}>
                    <ActivityIndicator size="small" color={colors.textPrimary} />
                    <Text style={[styles.thinkingText, { color: colors.textSecondary }]}>
                      Querying live ledger with Google AI Studio...
                    </Text>
                  </View>
                </View>
              </View>
            ) : undefined
          }
        />

        {/* Suggested Queries at the Bottom (above input box) */}
        <View style={styles.bottomPromptsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bottomPromptsScroll}
          >
            {quickPrompts.map((p, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleSend(p)}
                style={[
                  styles.promptPill,
                  { backgroundColor: colors.bgCard, borderColor: colors.border },
                ]}
                activeOpacity={0.7}
              >
                <Text style={[styles.promptText, { color: colors.textPrimary }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Large Prominent Floating Input Bar matching user specifications */}
        <View style={[styles.floatingInputWrapper, { backgroundColor: colors.bgCanvas }]}>
          <View
            style={[
              styles.inputCard,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              },
            ]}
          >
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder={`Ask Lekha AI about ${businessDisplayName}...`}
              placeholderTextColor={colors.textMuted}
              value={inputQuery}
              onChangeText={setInputQuery}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
            />
            <TouchableOpacity
              onPress={() => handleSend()}
              disabled={!inputQuery.trim() || isThinking}
              style={[
                styles.sendBtn,
                {
                  backgroundColor:
                    inputQuery.trim() && !isThinking ? colors.textPrimary : colors.bgSecondary,
                },
              ]}
              activeOpacity={0.8}
            >
              <Send
                size={16}
                color={inputQuery.trim() && !isThinking ? colors.bgCanvas : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  chatList: {
    padding: 16,
    gap: 12,
    paddingBottom: 8,
  },
  bottomPromptsSection: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  bottomPromptsScroll: {
    gap: 8,
    paddingHorizontal: 4,
  },
  promptPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  promptText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  msgRow: {
    flexDirection: 'row',
    gap: 10,
    maxWidth: '85%',
  },
  msgRowUser: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  msgRowAi: {
    alignSelf: 'flex-start',
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  msgBubble: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  msgText: {
    fontSize: 15,
    fontFamily: FONTS.regular,
    lineHeight: 22,
  },
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thinkingText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  floatingInputWrapper: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONTS.regular,
    paddingVertical: 0,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  modalDesc: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
  modalInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  modalSaveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    minWidth: 100,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  MessageSquare,
  CheckCircle2,
  BellRing,
  Languages,
  Send,
  Zap,
} from 'lucide-react-native';
import { THEME } from '../theme/theme';
import { useKhataStore } from '../store/useKhataStore';
import { Header } from '../components/common/Header';
import { CustomToggle } from '../components/common/CustomToggle';

export default function SmsSettingsScreen() {
  const router = useRouter();
  const {
    smsAlerts,
    paymentConfirmationSms,
    dailySummarySms,
    updateSettings,
    business,
    isDarkMode,
  } = useKhataStore();

  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const languages = ['English', 'Hindi', 'Hinglish', 'Marathi', 'Gujarati'];

  const bgCanvas = isDarkMode ? THEME.colors.dark.bgCanvas : THEME.colors.bgCanvas;
  const bgCard = isDarkMode ? THEME.colors.dark.bgCard : THEME.colors.bgCard;
  const border = isDarkMode ? THEME.colors.dark.border : THEME.colors.border;
  const textPrimary = isDarkMode ? THEME.colors.dark.textPrimary : THEME.colors.textPrimary;
  const textMuted = isDarkMode ? THEME.colors.dark.textMuted : THEME.colors.textMuted;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgCanvas }]} edges={['top']}>
      <Header
        title="SMS Settings"
        subtitle="Automated Reminders & WhatsApp Alerts"
        showBack
      />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={[styles.banner, { backgroundColor: THEME.colors.primaryBg, borderColor: THEME.colors.primaryBorder }]}>
          <Zap size={22} color={THEME.colors.primary} />
          <View style={styles.bannerTexts}>
            <Text style={[styles.bannerTitle, { color: THEME.colors.primary }]}>Free Unlimited SMS Alerts</Text>
            <Text style={[styles.bannerSub, { color: THEME.colors.textSecondary }]}>
              Businesses using automated reminders collect payments 3x faster with zero follow-up friction.
            </Text>
          </View>
        </View>

        {/* Settings Group matching sms-settings.html */}
        <View style={[styles.settingsGroup, { backgroundColor: bgCard, borderColor: border }]}>
          {/* 1. Customer SMS alerts */}
          <View style={[styles.row, { borderBottomColor: border }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: THEME.colors.primaryBg }]}>
                <MessageSquare size={18} color={THEME.colors.primary} />
              </View>
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: textPrimary }]}>Customer SMS alerts</Text>
                <Text style={[styles.rowSub, { color: textMuted }]}>
                  Send instant payment reminders and receipts to customers
                </Text>
              </View>
            </View>
            <CustomToggle
              value={smsAlerts}
              onValueChange={(val) => updateSettings({ smsAlerts: val })}
            />
          </View>

          {/* 2. Payment Confirmation SMS */}
          <View style={[styles.row, { borderBottomColor: border }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: THEME.colors.successBg }]}>
                <CheckCircle2 size={18} color={THEME.colors.success} />
              </View>
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: textPrimary }]}>Payment Confirmation SMS</Text>
                <Text style={[styles.rowSub, { color: textMuted }]}>
                  Auto-send SMS when payment is credited to your ledger
                </Text>
              </View>
            </View>
            <CustomToggle
              value={paymentConfirmationSms}
              onValueChange={(val) => updateSettings({ paymentConfirmationSms: val })}
            />
          </View>

          {/* 3. Daily Summary SMS */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: THEME.colors.pinkBg }]}>
                <BellRing size={18} color={THEME.colors.pink} />
              </View>
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: textPrimary }]}>Daily Summary SMS</Text>
                <Text style={[styles.rowSub, { color: textMuted }]}>
                  Receive business closing balance at 9:00 PM daily
                </Text>
              </View>
            </View>
            <CustomToggle
              value={dailySummarySms}
              onValueChange={(val) => updateSettings({ dailySummarySms: val })}
            />
          </View>
        </View>

        {/* SMS Language & Template Section */}
        <View style={[styles.langCard, { backgroundColor: bgCard, borderColor: border }]}>
          <View style={styles.langHeader}>
            <Languages size={18} color={THEME.colors.primary} />
            <Text style={[styles.langTitle, { color: textPrimary }]}>Reminder Message Language</Text>
          </View>
          <Text style={[styles.langSub, { color: textMuted }]}>
            Select the preferred language for customer payment notification SMS & WhatsApp text.
          </Text>

          <View style={styles.langChipsRow}>
            {languages.map((lang) => {
              const isSelected = selectedLanguage === lang;
              return (
                <TouchableOpacity
                  key={lang}
                  onPress={() => setSelectedLanguage(lang)}
                  style={[
                    styles.langChip,
                    {
                      backgroundColor: isSelected ? THEME.colors.primary : isDarkMode ? '#334155' : '#F1F5F9',
                      borderColor: isSelected ? THEME.colors.primary : border,
                    },
                  ]}
                >
                  <Text style={[styles.langChipText, { color: isSelected ? '#FFFFFF' : textPrimary }]}>
                    {lang}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Sample Preview */}
          <View style={[styles.previewBox, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC' }]}>
            <Text style={[styles.previewLabel, { color: textMuted }]}>Sample Message Template Preview:</Text>
            <Text style={[styles.previewText, { color: textPrimary }]}>
              {selectedLanguage === 'Hindi'
                ? `नमस्ते! ${business.name || 'हमारी दुकान'} से आपका बकाया देय है। कृपया इस लिंक पर भुगतान करें: https://khata.page.link/pay`
                : `Dear Customer, your pending balance with ${business.name || 'our business'} is due today. Pay securely: https://khata.page.link/pay`}
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    marginBottom: 16,
  },
  bannerTexts: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  bannerSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  settingsGroup: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTexts: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  rowSub: {
    fontSize: 11,
    marginTop: 2,
  },
  langCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  langHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  langTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  langSub: {
    fontSize: 11,
    marginBottom: 12,
  },
  langChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  langChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  langChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewBox: {
    padding: 12,
    borderRadius: 14,
    gap: 6,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  previewText: {
    fontSize: 12,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});

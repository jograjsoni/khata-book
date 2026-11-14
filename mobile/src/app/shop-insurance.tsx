import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  Download,
  AlertTriangle,
  Flame,
  Lock,
  CloudRain,
  Coins,
} from 'lucide-react-native';
import { THEME } from '../theme/theme';
import { useKhataStore } from '../store/useKhataStore';
import { Header } from '../components/common/Header';

export default function ShopInsuranceScreen() {
  const router = useRouter();
  const { isDarkMode } = useKhataStore();

  const handleDownloadPolicy = () => {
    Alert.alert('Coverage Brochure', 'Comprehensive Business Asset Protection brochure downloaded.');
  };

  const handleClaimHelpline = () => {
    Linking.openURL('tel:1800118485');
  };

  const handleApplyQuote = () => {
    Alert.alert(
      'Quote Requested',
      'Our insurance partner will review your business profile and contact you within 24 hours with a customized shop protection quote.'
    );
  };

  const bgCanvas = isDarkMode ? THEME.colors.dark.bgCanvas : THEME.colors.bgCanvas;
  const bgCard = isDarkMode ? THEME.colors.dark.bgCard : THEME.colors.bgCard;
  const border = isDarkMode ? THEME.colors.dark.border : THEME.colors.border;
  const textPrimary = isDarkMode ? THEME.colors.dark.textPrimary : THEME.colors.textPrimary;
  const textMuted = isDarkMode ? THEME.colors.dark.textMuted : THEME.colors.textMuted;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgCanvas }]} edges={['top']}>
      <Header
        title="Shop Insurance"
        subtitle="Business Protection & Asset Cover"
        showBack
      />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Coverage Overview Card */}
        <View style={[styles.policyCard, { backgroundColor: bgCard, borderColor: border }]}>
          <View style={styles.policyTop}>
            <View style={styles.policyLeft}>
              <View style={[styles.iconCircle, { backgroundColor: THEME.colors.primaryBg }]}>
                <ShieldCheck size={22} color={THEME.colors.primary} />
              </View>
              <View style={styles.policyDetails}>
                <Text style={[styles.policyName, { color: textPrimary }]}>
                  Comprehensive Store & Asset Protection
                </Text>
                <View style={styles.statusPillsRow}>
                  <View style={[styles.statusPill, { backgroundColor: THEME.colors.primaryBg }]}>
                    <Text style={[styles.statusPillText, { color: THEME.colors.primary }]}>
                      Available Plan
                    </Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: THEME.colors.successBg }]}>
                    <Text style={[styles.statusPillText, { color: THEME.colors.success }]}>
                      IRDAI Approved
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Coverage Numbers */}
          <Text style={[styles.sectionTitle, { color: textPrimary, marginTop: 16 }]}>
            Plan Highlights
          </Text>

          <View style={styles.coverageGrid}>
            <View style={[styles.covBox, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: border }]}>
              <Text style={[styles.covLabel, { color: textMuted }]}>Maximum Sum Insured</Text>
              <Text style={[styles.covAmount, { color: THEME.colors.primary }]}>Up to ₹ 15 Lakhs</Text>
            </View>

            <View style={[styles.covBox, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: border }]}>
              <Text style={[styles.covLabel, { color: textMuted }]}>Starting Premium</Text>
              <Text style={[styles.covAmount, { color: THEME.colors.pink }]}>From ₹ 12 / day</Text>
            </View>

            <View style={[styles.covBoxFull, { backgroundColor: isDarkMode ? '#1E293B' : '#F8FAFC', borderColor: border }]}>
              <Text style={[styles.covLabel, { color: textMuted }]}>Coverage Tenure</Text>
              <Text style={[styles.covTextVal, { color: textPrimary }]}>
                12 Months Full Asset & Peril Coverage (Auto-Renewable)
              </Text>
            </View>
          </View>
        </View>

        {/* Protection Coverage List */}
        <View style={[styles.protectionCard, { backgroundColor: bgCard, borderColor: border }]}>
          <Text style={[styles.protTitle, { color: textPrimary }]}>Protection Inclusions</Text>

          {[
            {
              icon: Flame,
              color: '#EA580C',
              bg: '#FFEDD5',
              title: 'Fire & Allied Perils',
              desc: 'Coverage for stock, counter fixtures, and electronics up to ₹ 10 Lakhs.',
            },
            {
              icon: Lock,
              color: '#0284C7',
              bg: '#E0F2FE',
              title: 'Burglary & Forced Entry Theft',
              desc: 'Protection against broken locks, theft of goods up to ₹ 3 Lakhs.',
            },
            {
              icon: CloudRain,
              color: '#059669',
              bg: '#D1FAE5',
              title: 'Natural Calamities & Floods',
              desc: 'Cover for monsoon water ingress, storm damage up to ₹ 2 Lakhs.',
            },
            {
              icon: Coins,
              color: '#D97706',
              bg: '#FEF3C7',
              title: 'Cash in Safe & Transit',
              desc: 'Loss of money from counter safe during business hours up to ₹ 50,000.',
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <View key={idx} style={styles.inclusionRow}>
                <View style={[styles.inclusionIconCircle, { backgroundColor: item.bg }]}>
                  <Icon size={18} color={item.color} />
                </View>
                <View style={styles.inclusionTexts}>
                  <Text style={[styles.incTitle, { color: textPrimary }]}>{item.title}</Text>
                  <Text style={[styles.incDesc, { color: textMuted }]}>{item.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={handleClaimHelpline}
            style={[styles.claimBtn, { backgroundColor: THEME.colors.primaryBg, borderColor: THEME.colors.primaryBorder }]}
            activeOpacity={0.8}
          >
            <PhoneCall size={16} color={THEME.colors.primary} />
            <Text style={[styles.claimBtnText, { color: THEME.colors.primary }]}>Advisor Helpline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleApplyQuote}
            style={[styles.downloadBtn, { backgroundColor: THEME.colors.primary }]}
            activeOpacity={0.8}
          >
            <ShieldCheck size={16} color="#FFFFFF" />
            <Text style={styles.downloadBtnText}>Get Free Quote</Text>
          </TouchableOpacity>
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
  policyCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  policyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  policyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  policyDetails: {
    flex: 1,
  },
  policyName: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  coverageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  covBox: {
    width: '48%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  covBoxFull: {
    width: '100%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  covLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  covAmount: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  covTextVal: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  protectionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 14,
    marginBottom: 16,
  },
  protTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  inclusionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  inclusionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inclusionTexts: {
    flex: 1,
  },
  incTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  incDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  claimBtn: {
    flex: 1.2,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
  },
  claimBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  downloadBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  downloadBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

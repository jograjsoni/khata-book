import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Share2,
  Clock,
} from 'lucide-react-native';
import { THEME, getThemeColors, FONTS } from '../theme/theme';
import { useKhataStore } from '../store/useKhataStore';
import { Header } from '../components/common/Header';
import {
  WireframeCoinIcon,
  WireframeMessageSquareIcon,
  WireframeBankIcon,
  WireframeQrIcon,
  WireframeSimpleStarIcon,
} from '../components/common/WireframeIcons';

export default function RewardsScreen() {
  const router = useRouter();
  const { business, isDarkMode } = useKhataStore();
  const colors = getThemeColors(isDarkMode);

  const coinBalance = business.rewardCoins ?? 0;

  const rewardVouchers = [
    {
      id: 'r1',
      title: '100 Free SMS Reminders',
      cost: 150,
      desc: 'Send automated recovery SMS via fast server gateway',
      iconType: 'sms' as const,
    },
    {
      id: 'r2',
      title: '₹ 50 Bank Cashback',
      cost: 250,
      desc: `Instant direct deposit into your linked ${business.bankName || 'bank'} account`,
      iconType: 'bank' as const,
    },
    {
      id: 'r3',
      title: 'Custom Business QR Standee',
      cost: 500,
      desc: 'Get a laminated branded UPI QR stand delivered to your shop',
      iconType: 'qr' as const,
    },
  ];

  const handleRedeem = (item: typeof rewardVouchers[0]) => {
    if (coinBalance < item.cost) {
      Alert.alert(
        'Insufficient Coins',
        `You need ${item.cost - coinBalance} more Khata Coins to redeem ${item.title}. Keep recording transactions to earn coins!`
      );
      return;
    }
    Alert.alert('Redeem Voucher', `Redeem ${item.title} for ${item.cost} Khata Coins?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Redeem Now',
        onPress: () => {
          Alert.alert('Success!', `${item.title} has been redeemed successfully.`);
        },
      },
    ]);
  };

  const renderVoucherIcon = (type: 'sms' | 'bank' | 'qr') => {
    switch (type) {
      case 'sms':
        return <WireframeMessageSquareIcon size={20} color={colors.textPrimary} strokeWidth={1.8} />;
      case 'bank':
        return <WireframeBankIcon size={20} color={colors.textPrimary} strokeWidth={1.8} />;
      case 'qr':
        return <WireframeQrIcon size={20} color={colors.textPrimary} strokeWidth={1.8} />;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgCanvas }]} edges={['top']}>
      <Header title="Khata Rewards" subtitle="Coins & Cashback" showBack />

      <ScrollView style={styles.body} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Coin Card */}
        <View style={[styles.coinCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.coinHeaderRow}>
            <View style={[styles.coinIconBadge, { backgroundColor: colors.bgSecondary, borderColor: colors.border, borderWidth: 1 }]}>
              <WireframeCoinIcon size={28} color="#CA8A04" strokeWidth={2} />
            </View>
            <View style={styles.coinTexts}>
              <Text style={[styles.coinLabel, { color: colors.textSecondary }]}>Available Balance</Text>
              <Text style={[styles.coinBalance, { color: colors.textPrimary }]}>
                {coinBalance} <Text style={{ fontSize: 16, fontFamily: FONTS.medium, color: '#CA8A04' }}>Coins</Text>
              </Text>
            </View>
          </View>
          <Text style={[styles.coinValueText, { color: colors.textSecondary }]}>
            Worth approximately ₹ {(coinBalance * 0.2).toFixed(0)} in merchant benefits
          </Text>
        </View>

        {/* How to earn coins banner */}
        <View style={[styles.earnBanner, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <WireframeSimpleStarIcon size={18} color={colors.primary} strokeWidth={1.8} />
          <Text style={[styles.earnText, { color: colors.textPrimary }]}>
            Earn 10 coins for every ₹ 1,000 payment collected via UPI QR.
          </Text>
        </View>

        {/* Redeemable Rewards Section */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Redeem Rewards</Text>

        <View style={styles.vouchersList}>
          {rewardVouchers.map((voucher) => (
            <View
              key={voucher.id}
              style={[styles.voucherCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            >
              {/* Clean flat black-and-white icon container */}
              <View style={[styles.voucherIconBox, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                {renderVoucherIcon(voucher.iconType)}
              </View>

              <View style={styles.voucherInfo}>
                <Text style={[styles.voucherTitle, { color: colors.textPrimary }]}>{voucher.title}</Text>
                <Text style={[styles.voucherDesc, { color: colors.textSecondary }]}>{voucher.desc}</Text>
                <View style={styles.costBadge}>
                  <WireframeCoinIcon size={12} color="#CA8A04" strokeWidth={1.8} />
                  <Text style={styles.costText}>{voucher.cost} Coins</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleRedeem(voucher)}
                style={[
                  styles.redeemBtn,
                  { backgroundColor: coinBalance >= voucher.cost ? colors.primary : colors.bgSecondary },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.redeemBtnText,
                    { color: coinBalance >= voucher.cost ? colors.primaryForeground : colors.textMuted },
                  ]}
                >
                  Redeem
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  body: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40, gap: 16 },
  coinCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  coinHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  coinIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coinTexts: { gap: 2 },
  coinLabel: { fontSize: 12, fontFamily: FONTS.medium },
  coinBalance: { fontSize: 32, fontFamily: FONTS.bold },
  coinValueText: { fontSize: 13, fontFamily: FONTS.regular },
  earnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  earnText: { fontSize: 12, fontFamily: FONTS.medium, flex: 1 },
  sectionTitle: { fontSize: 15, fontFamily: FONTS.bold, marginTop: 4 },
  vouchersList: { gap: 12 },
  voucherCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  voucherIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherInfo: { flex: 1, gap: 3 },
  voucherTitle: { fontSize: 14, fontFamily: FONTS.bold },
  voucherDesc: { fontSize: 11, fontFamily: FONTS.regular },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  costText: { fontSize: 11, fontFamily: FONTS.bold, color: '#CA8A04' },
  redeemBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  redeemBtnText: { fontSize: 12, fontFamily: FONTS.bold },
});

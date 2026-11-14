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
  ChevronRight,
  BookOpen,
  Wallet,
  FileText,
  Package,
  Users,
  Link,
  Shield,
  ShieldCheck,
  Settings as SettingsIcon,
  Lock,
  Info,
} from 'lucide-react-native';
import { getThemeColors, FONTS } from '../../theme/theme';
import { useKhataStore } from '../../store/useKhataStore';
import { api } from '../../services/apiService';
import { Header } from '../../components/common/Header';
import { WireframeSignOutIcon, WireframeBookIcon } from '../../components/common/WireframeIcons';
import { LocationSelectorModal } from '../../components/modals/LocationSelectorModal';
import { CustomToggle } from '../../components/common/CustomToggle';
import permissionService from '../../services/permissionService';

export default function SettingsScreen() {
  const router = useRouter();
  const { business, smsAlerts, appLockEnabled, pin, updateSettings, isDarkMode } = useKhataStore();
  const colors = getThemeColors(isDarkMode);

  const [locationModalVisible, setLocationModalVisible] = useState(false);

  const handleToggleAppLock = async (val: boolean) => {
    if (val && (!pin || pin.length !== 4)) {
      Alert.alert(
        '4-Digit PIN Required',
        'Please configure your 4-digit security PIN before enabling App Lock.',
        [
          { text: 'Set PIN', onPress: () => router.push('/app-lock-settings') },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }
    if (val) {
      await permissionService.authenticateWithBiometrics(
        'Verify Fingerprint or Face ID to enable App Lock'
      );
    }
    updateSettings({ appLockEnabled: val });
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      `Are you sure you want to log out of ${business.name || 'your merchant account'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await api.logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  // 7 Quick Action Cards matching settings.html 3_cardgrid
  const storeActions = [
    {
      title: 'Passbook',
      sub: 'All transactions',
      icon: WireframeBookIcon,
      route: '/passbook',
    },
    {
      title: 'Cashbox',
      sub: 'Cash in hand',
      icon: Wallet,
      route: '/cashbook',
    },
    {
      title: 'Bills',
      sub: 'Invoices & receipts',
      icon: FileText,
      route: '/bills',
    },
    {
      title: 'Items',
      sub: 'Inventory stock',
      icon: Package,
      route: '/items',
    },
    {
      title: 'Staff',
      sub: 'Salary & attendance',
      icon: Users,
      route: '/staff',
    },
    {
      title: 'Collection',
      sub: 'Payment links',
      icon: Link,
      route: '/payment-links',
    },
    {
      title: 'Shop Insurance',
      sub: 'Store & asset cover',
      icon: Shield,
      route: '/shop-insurance',
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgCanvas }]} edges={['top']}>
      {/* 0_appbar: Header matching settings.html */}
      <Header
        showBusinessBrand
        onLocationPress={() => setLocationModalVisible(true)}
      />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1_statuscard: Profile Status Card matching settings.html */}
        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Top Row: Avatar + Name/Edit + Sub */}
          <View style={styles.profileTopRow}>
            <View
              style={[
                styles.profileAvatar,
                {
                  backgroundColor: colors.bgSecondary,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.profileAvatarText, { color: colors.textPrimary }]}>
                {business.name
                  ? business.name
                      .split(' ')
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'KH'}
              </Text>
            </View>

            <View style={styles.profileMeta}>
              <View style={styles.nameAndEditRow}>
                <Text
                  style={[styles.profileBusinessTitle, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {business.name || 'My Khata'}
                </Text>
                <TouchableOpacity
                  onPress={() => router.push('/edit-business-profile')}
                  style={[
                    styles.editGhostBtn,
                    {
                      borderColor: colors.border,
                      backgroundColor: 'transparent',
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.editGhostText, { color: colors.textPrimary }]}>
                    Edit
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.profileOwnerSub, { color: colors.textSecondary }]}>
                {business.ownerName || 'Merchant'}
              </Text>
            </View>
          </View>

          {/* Divider & Profile Strength Bar with dynamic colors matching user requirements */}
          {(() => {
            const strength = business.profileStrength ?? 0;
            const strengthColor =
              strength < 50
                ? '#dc2626' // Red
                : strength < 85
                ? '#d97706' // Yellow / Amber
                : '#16a34a'; // Green

            const strengthStatus =
              strength < 50
                ? 'Needs Attention'
                : strength < 85
                ? 'Good'
                : 'Complete';

            return (
              <View style={[styles.strengthDivider, { borderTopColor: colors.border }]}>
                <View style={styles.strengthTextRow}>
                  <Text style={[styles.strengthLabel, { color: colors.textSecondary }]}>
                    Profile Strength: {strengthStatus} ({strength}%)
                  </Text>
                  <Text style={[styles.strengthPct, { color: strengthColor }]}>
                    {strength}%
                  </Text>
                </View>
                <View style={[styles.progressTrack, { backgroundColor: colors.bgSecondary }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${strength}%`,
                        backgroundColor: strengthColor,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })()}
        </View>

        {/* 2_banner: Collect money directly into bank account banner matching settings.html */}
        <View
          style={[
            styles.bannerCard,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.bannerLeftRow}>
            <Info size={16} color={colors.textSecondary} style={{ marginTop: 2 }} />
            <Text style={[styles.bannerMessage, { color: colors.textPrimary }]}>
              Collect money directly into your bank account
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/payment-settings')}
            style={[
              styles.proceedBtn,
              {
                borderColor: colors.border,
                backgroundColor: 'transparent',
              },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.proceedBtnText, { color: colors.textPrimary }]}>
              PROCEED
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3_cardgrid: Store Management 3-column Grid matching settings.html */}
        <View style={styles.gridContainer}>
          {storeActions.map((action, idx) => {
            const IconComponent = action.icon;
            return (
              <TouchableOpacity
                key={idx}
                onPress={() => router.push(action.route as any)}
                style={[
                  styles.gridItemCard,
                  {
                    backgroundColor: colors.bgCard,
                    borderColor: colors.border,
                  },
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.gridIconWrap}>
                  <IconComponent size={20} color={colors.textPrimary} strokeWidth={1.5} />
                </View>
                <Text
                  style={[styles.gridTitle, { color: colors.textPrimary }]}
                  numberOfLines={1}
                >
                  {action.title}
                </Text>
                <Text
                  style={[styles.gridSub, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {action.sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 4_settingsgroup: Settings Group matching settings.html */}
        <View
          style={[
            styles.settingsGroupCard,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          {/* SMS Settings Row */}
          <TouchableOpacity
            onPress={() => router.push('/sms-settings')}
            style={styles.settingRow}
            activeOpacity={0.7}
          >
            <View style={styles.settingRowLeft}>
              <SettingsIcon size={16} color={colors.textSecondary} strokeWidth={1.5} />
              <View style={styles.settingTextCol}>
                <Text style={[styles.settingRowTitle, { color: colors.textPrimary }]}>
                  SMS Settings
                </Text>
                <Text style={[styles.settingRowSub, { color: colors.textSecondary }]}>
                  Customer SMS alerts
                </Text>
              </View>
            </View>
            <View style={styles.settingRowRight}>
              <Text style={[styles.settingValueText, { color: colors.textSecondary }]}>
                {smsAlerts ? 'Enabled' : 'Disabled'}
              </Text>
              <ChevronRight size={15} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <View style={[styles.rowDivider, { borderTopColor: colors.border }]} />

          {/* Payment Settings Row */}
          <TouchableOpacity
            onPress={() => router.push('/payment-settings')}
            style={styles.settingRow}
            activeOpacity={0.7}
          >
            <View style={styles.settingRowLeft}>
              <SettingsIcon size={16} color={colors.textSecondary} strokeWidth={1.5} />
              <View style={styles.settingTextCol}>
                <Text style={[styles.settingRowTitle, { color: colors.textPrimary }]}>
                  Payment Settings
                </Text>
                <Text style={[styles.settingRowSub, { color: colors.textSecondary }]}>
                  Configure QR and gateway
                </Text>
              </View>
            </View>
            <View style={styles.settingRowRight}>
              <Text style={[styles.settingValueText, { color: colors.textSecondary }]}>
                UPI & QR
              </Text>
              <ChevronRight size={15} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <View style={[styles.rowDivider, { borderTopColor: colors.border }]} />

          {/* App Lock Row with Switch */}
          <View style={styles.settingRow}>
            <View style={styles.settingRowLeft}>
              <Lock size={16} color={colors.textSecondary} strokeWidth={1.5} />
              <View style={styles.settingTextCol}>
                <Text style={[styles.settingRowTitle, { color: colors.textPrimary }]}>
                  App Lock
                </Text>
                <Text style={[styles.settingRowSub, { color: colors.textSecondary }]}>
                  Biometric security
                </Text>
              </View>
            </View>
            <CustomToggle
              value={appLockEnabled}
              onValueChange={handleToggleAppLock}
            />
          </View>

          <View style={[styles.rowDivider, { borderTopColor: colors.border }]} />

          {/* Permissions & Device Hardware Row */}
          <TouchableOpacity
            onPress={() => router.push('/permissions')}
            style={styles.settingRow}
            activeOpacity={0.7}
          >
            <View style={styles.settingRowLeft}>
              <ShieldCheck size={16} color={colors.primary} strokeWidth={1.5} />
              <View style={styles.settingTextCol}>
                <Text style={[styles.settingRowTitle, { color: colors.textPrimary }]}>
                  Permissions & Hardware Access
                </Text>
                <Text style={[styles.settingRowSub, { color: colors.textSecondary }]}>
                  Camera, SMS, Phone, Nearby, GPS & Sensors
                </Text>
              </View>
            </View>
            <View style={styles.settingRowRight}>
              <Text style={[styles.settingValueText, { color: colors.success, fontFamily: FONTS.semiBold }]}>
                Real Native
              </Text>
              <ChevronRight size={15} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <View style={[styles.rowDivider, { borderTopColor: colors.border }]} />

          {/* Sign Out Row matching settings.html btn-sign-out */}
          <TouchableOpacity
            onPress={handleSignOut}
            style={[styles.settingRow, styles.signOutRow]}
            activeOpacity={0.7}
          >
            <View style={styles.settingRowLeft}>
              <View style={styles.signOutIconBox}>
                <WireframeSignOutIcon size={18} color="#dc2626" strokeWidth={2} />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={[styles.signOutTitle, { color: '#dc2626' }]}>
                  Sign Out
                </Text>
                <Text style={[styles.signOutSub, { color: colors.textSecondary }]}>
                  Log out of {business.name ? business.name : 'account'}
                </Text>
              </View>
            </View>
            <ChevronRight size={15} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Location Modal */}
      <LocationSelectorModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
      />
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
    paddingTop: 8,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  profileCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  profileAvatarText: {
    fontFamily: FONTS.bold,
    fontSize: 17,
  },
  profileMeta: {
    flex: 1,
  },
  nameAndEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileBusinessTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    flex: 1,
    marginRight: 8,
  },
  editGhostBtn: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editGhostText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  profileOwnerSub: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  strengthDivider: {
    borderTopWidth: 1,
    marginTop: 14,
    paddingTop: 10,
  },
  strengthTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  strengthLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  strengthPct: {
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  bannerCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  bannerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  bannerMessage: {
    fontSize: 12.5,
    fontFamily: FONTS.medium,
    flex: 1,
  },
  proceedBtn: {
    height: 30,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedBtnText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  gridItemCard: {
    width: '31%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  gridIconWrap: {
    marginBottom: 8,
  },
  gridTitle: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    marginBottom: 2,
  },
  gridSub: {
    fontSize: 10.5,
    fontFamily: FONTS.regular,
  },
  settingsGroupCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 6,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingTextCol: {
    flex: 1,
  },
  settingRowTitle: {
    fontSize: 13.5,
    fontFamily: FONTS.semiBold,
  },
  settingRowSub: {
    fontSize: 11.5,
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
  settingRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingValueText: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  rowDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  signOutRow: {
    paddingVertical: 10,
  },
  signOutIconBox: {
    width: 32,
    height: 32,
    borderRadius: 14,
    backgroundColor: 'rgba(220,38,38,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutTitle: {
    fontSize: 13.5,
    fontFamily: FONTS.bold,
  },
  signOutSub: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 1,
  },
});

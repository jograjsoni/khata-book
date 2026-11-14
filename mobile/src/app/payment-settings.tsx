import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Settings,
  Store,
  CreditCard,
  Building2,
  ChevronRight,
  X,
  Check,
} from 'lucide-react-native';
import { THEME, getThemeColors, FONTS } from '../theme/theme';
import { useKhataStore } from '../store/useKhataStore';
import { Header } from '../components/common/Header';
import { QrCodeModal } from '../components/modals/QrCodeModal';
import { CustomToggle } from '../components/common/CustomToggle';

export default function PaymentSettingsScreen() {
  const router = useRouter();
  const { business, updateBusiness, isDarkMode } = useKhataStore();
  const colors = getThemeColors(isDarkMode);

  const [upiId, setUpiId] = useState(business.upiId || '');
  const [upiModalVisible, setUpiModalVisible] = useState(false);
  const [tempUpi, setTempUpi] = useState(business.upiId || '');
  const [gatewayEnabled, setGatewayEnabled] = useState(true);
  const [autoSettlement, setAutoSettlement] = useState(true);
  const [qrModalVisible, setQrModalVisible] = useState(false);

  const handleSaveUpi = () => {
    if (!tempUpi.trim() || !tempUpi.includes('@')) {
      Alert.alert('Invalid UPI ID', 'Please enter a valid UPI address (e.g. business@okhdfcbank).');
      return;
    }
    updateBusiness({ upiId: tempUpi.trim() });
    setUpiId(tempUpi.trim());
    setUpiModalVisible(false);
    Alert.alert('UPI ID Updated', 'Your direct settlement UPI address has been saved.');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgCanvas }]} edges={['top']}>
      {/* App Bar matching payment-settings.html __header */}
      <Header
        title="Payment Settings"
        showBack
      />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Settings Group Card matching payment-settings.html settingsgroup */}
        <View
          style={[
            styles.settingsCard,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Row 0: Primary UPI ID */}
          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => {
              setTempUpi(upiId);
              setUpiModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Settings size={18} color={colors.textPrimary} strokeWidth={1.6} />
              <View style={styles.textStack}>
                <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                  Primary UPI ID
                </Text>
                <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>
                  Used for receiving instant settlements directly into your bank account
                </Text>
              </View>
            </View>

            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: colors.textSecondary }]} numberOfLines={1}>
                {upiId}
              </Text>
              <ChevronRight size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          {/* Row 1: Store QR Code */}
          <TouchableOpacity
            style={styles.rowItem}
            onPress={() => setQrModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <Store size={18} color={colors.textPrimary} strokeWidth={1.6} />
              <View style={styles.textStack}>
                <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                  Store QR Code
                </Text>
                <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>
                  Display dynamic QR code at checkout counter for scanning
                </Text>
              </View>
            </View>

            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: '#16a34a', fontFamily: FONTS.semiBold }]}>
                Active
              </Text>
              <ChevronRight size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          {/* Row 2: Payment Gateway */}
          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <CreditCard size={18} color={colors.textPrimary} strokeWidth={1.6} />
              <View style={styles.textStack}>
                <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                  Payment Gateway
                </Text>
                <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>
                  Accept credit cards, debit cards, and net banking online
                </Text>
              </View>
            </View>

            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: colors.textSecondary }]}>
                Razorpay
              </Text>
              <CustomToggle
                value={gatewayEnabled}
                onValueChange={setGatewayEnabled}
              />
            </View>
          </View>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          {/* Row 3: Bank Account Settlement */}
          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <Building2 size={18} color={colors.textPrimary} strokeWidth={1.6} />
              <View style={styles.textStack}>
                <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                  Bank Account Settlement
                </Text>
                <Text style={[styles.rowDesc, { color: colors.textSecondary }]}>
                  Direct RTGS/NEFT settlement to verified merchant account
                </Text>
              </View>
            </View>

            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: colors.textSecondary }]}>
                Auto
              </Text>
              <CustomToggle
                value={autoSettlement}
                onValueChange={setAutoSettlement}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Edit UPI Modal */}
      <Modal
        visible={upiModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setUpiModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Edit Primary UPI ID
              </Text>
              <TouchableOpacity
                onPress={() => setUpiModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              Enter your UPI VPA handle for receiving settlements directly into your linked bank account.
            </Text>

            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: colors.bgSecondary,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              value={tempUpi}
              onChangeText={setTempUpi}
              placeholder="e.g. business@okhdfcbank"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setUpiModalVisible(false)}
                style={[
                  styles.cancelBtn,
                  { borderColor: colors.border, backgroundColor: colors.bgSecondary },
                ]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveUpi}
                style={[styles.saveBtn, { backgroundColor: colors.textPrimary }]}
              >
                <Text style={[styles.saveBtnText, { color: colors.bgCanvas }]}>Save UPI ID</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Store QR Code Modal */}
      <QrCodeModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  body: { flex: 1 },
  scrollContent: {
    padding: 16,
  },
  settingsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  textStack: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
  },
  rowDesc: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 16,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowValue: {
    fontSize: 12.5,
    fontFamily: FONTS.medium,
    maxWidth: 120,
  },
  separator: {
    height: 1,
    marginHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  modalDesc: {
    fontSize: 12.5,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
  modalInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
});

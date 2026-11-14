import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  Lock,
  Fingerprint,
  Clock,
  KeyRound,
  ShieldCheck,
  ChevronRight,
  X,
} from 'lucide-react-native';
import { THEME } from '../theme/theme';
import { useKhataStore } from '../store/useKhataStore';
import { Header } from '../components/common/Header';
import { CustomToggle } from '../components/common/CustomToggle';

export default function AppLockSettingsScreen() {
  const router = useRouter();
  const {
    business,
    appLockEnabled,
    biometricUnlock,
    autoLockTimeout,
    pin,
    updateSettings,
    isDarkMode,
  } = useKhataStore();

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [supportedBiometrics, setSupportedBiometrics] = useState<string>('Biometrics');

  useEffect(() => {
    // Check supported biometric types on mount
    (async () => {
      try {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setSupportedBiometrics('Fingerprint / Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setSupportedBiometrics('Fingerprint');
        }
      } catch (err) {
        // Safe fallback
      }
    })();
  }, []);

  const timeoutOptions = ['Immediately', 'After 1 minute', 'After 5 minutes', 'After 15 minutes'];

  const handleToggleLock = async (val: boolean) => {
    if (val) {
      if (!pin || pin.length !== 4) {
        Alert.alert(
          '4-Digit PIN Required',
          'You must set a 4-digit security PIN before enabling App Lock.',
          [
            { text: 'Set PIN', onPress: () => setPinModalVisible(true) },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }
      updateSettings({ appLockEnabled: true });
    } else {
      if (biometricUnlock) {
        try {
          const res = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Verify biometric identity to disable App Lock',
            cancelLabel: 'Cancel',
          });
          if (!res.success) {
            return;
          }
        } catch {
          // Continue
        }
      }
      updateSettings({ appLockEnabled: false });
    }
  };

  const handleToggleBiometric = async (val: boolean) => {
    if (val) {
      // 1. Mandatory 4-digit PIN check
      if (!pin || pin.length !== 4) {
        Alert.alert(
          'Mandatory 4-Digit PIN Required',
          'You must configure a 4-digit security PIN first before enabling biometric authentication.',
          [
            { text: 'Set PIN Now', onPress: () => setPinModalVisible(true) },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      // 2. Real-time hardware check
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        if (!hasHardware) {
          Alert.alert(
            'Hardware Unavailable',
            'This device does not support biometric authentication hardware.'
          );
          return;
        }

        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!isEnrolled) {
          Alert.alert(
            'No Biometrics Enrolled',
            'No fingerprint or face data is enrolled on your device. Please configure biometrics in your phone system settings first.'
          );
          return;
        }

        // 3. Real-time live biometric authentication prompt
        const authResult = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Scan fingerprint or face to verify identity',
          fallbackLabel: 'Use PIN',
          cancelLabel: 'Cancel',
          disableDeviceFallback: false,
        });

        if (authResult.success) {
          updateSettings({ biometricUnlock: true, appLockEnabled: true });
          Alert.alert(
            'Biometrics Verified',
            'Fingerprint and Face biometric unlock is now active and verified.'
          );
        } else {
          Alert.alert('Authentication Cancelled', 'Biometric scan was not confirmed.');
        }
      } catch (err: any) {
        Alert.alert('Biometric Error', err?.message || 'Failed to authenticate biometrics.');
      }
    } else {
      updateSettings({ biometricUnlock: false });
    }
  };

  const handleSavePin = () => {
    if (newPin.length !== 4) {
      Alert.alert('Invalid PIN', 'Security PIN must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'Confirmation PIN does not match.');
      return;
    }

    updateSettings({ pin: newPin, appLockEnabled: true });
    setPinModalVisible(false);
    setNewPin('');
    setConfirmPin('');
    Alert.alert('PIN Updated', 'Your 4-digit security PIN has been set successfully.');
  };

  const bgCanvas = isDarkMode ? THEME.colors.dark.bgCanvas : THEME.colors.bgCanvas;
  const bgCard = isDarkMode ? THEME.colors.dark.bgCard : THEME.colors.bgCard;
  const border = isDarkMode ? THEME.colors.dark.border : THEME.colors.border;
  const textPrimary = isDarkMode ? THEME.colors.dark.textPrimary : THEME.colors.textPrimary;
  const textMuted = isDarkMode ? THEME.colors.dark.textMuted : THEME.colors.textMuted;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgCanvas }]} edges={['top']}>
      <Header
        title="App Lock Settings"
        subtitle="Security & PIN Protection"
        showBack
      />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={[styles.banner, { backgroundColor: THEME.colors.primaryBg, borderColor: THEME.colors.primaryBorder }]}>
          <ShieldCheck size={24} color={THEME.colors.primary} />
          <View style={styles.bannerTexts}>
            <Text style={[styles.bannerTitle, { color: THEME.colors.primary }]}>Protect Your Ledger Books</Text>
            <Text style={[styles.bannerSub, { color: THEME.colors.textSecondary }]}>
              Keep confidential party transactions and cash balances secure with biometrics and PIN.
            </Text>
          </View>
        </View>

        {/* Settings Group matching app-lock-settings.html */}
        <View style={[styles.settingsGroup, { backgroundColor: bgCard, borderColor: border }]}>
          {/* 1. App Lock */}
          <View style={[styles.row, { borderBottomColor: border }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Lock size={18} color="#DC2626" />
              </View>
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: textPrimary }]}>App Lock</Text>
                <Text style={[styles.rowSub, { color: textMuted }]}>
                  Require 4-digit PIN or {supportedBiometrics} to open {business.name || 'your store'}
                </Text>
              </View>
            </View>
            <CustomToggle
              value={appLockEnabled}
              onValueChange={handleToggleLock}
            />
          </View>

          {/* 2. Biometric Unlock */}
          <View style={[styles.row, { borderBottomColor: border }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: THEME.colors.primaryBg }]}>
                <Fingerprint size={18} color={THEME.colors.primary} />
              </View>
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: textPrimary }]}>Biometric Unlock</Text>
                <Text style={[styles.rowSub, { color: textMuted }]}>
                  Use {supportedBiometrics} for instant one-touch ledger access
                </Text>
              </View>
            </View>
            <CustomToggle
              value={biometricUnlock}
              onValueChange={handleToggleBiometric}
              disabled={!appLockEnabled}
            />
          </View>

          {/* 3. Auto-Lock Timeout */}
          <View style={[styles.row, { borderBottomColor: border, flexDirection: 'column', alignItems: 'flex-start' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Clock size={18} color="#D97706" />
              </View>
              <View>
                <Text style={[styles.rowTitle, { color: textPrimary }]}>Auto-Lock Timeout</Text>
                <Text style={[styles.rowSub, { color: textMuted }]}>
                  Lock app when switched to background
                </Text>
              </View>
            </View>

            <View style={styles.timeoutOptionsRow}>
              {timeoutOptions.map((opt) => {
                const isSelected = autoLockTimeout === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => updateSettings({ autoLockTimeout: opt })}
                    style={[
                      styles.timeoutPill,
                      {
                        backgroundColor: isSelected ? THEME.colors.primary : isDarkMode ? '#334155' : '#F1F5F9',
                        borderColor: isSelected ? THEME.colors.primary : border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.timeoutText,
                        { color: isSelected ? '#FFFFFF' : textPrimary, fontWeight: isSelected ? '700' : '500' },
                      ]}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* 4. Set / Change PIN */}
          <TouchableOpacity
            onPress={() => setPinModalVisible(true)}
            style={styles.row}
            activeOpacity={0.7}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconCircle, { backgroundColor: THEME.colors.pinkBg }]}>
                <KeyRound size={18} color={THEME.colors.pink} />
              </View>
              <View style={styles.rowTexts}>
                <Text style={[styles.rowTitle, { color: textPrimary }]}>Change 4-Digit Security PIN</Text>
                <Text style={[styles.rowSub, { color: textMuted }]}>Current PIN: • • • •</Text>
              </View>
            </View>
            <ChevronRight size={16} color={textMuted} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Set PIN Modal */}
      <Modal visible={pinModalVisible} transparent animationType="slide" onRequestClose={() => setPinModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: bgCard }]}>
            <View style={[styles.modalHeader, { borderBottomColor: border }]}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Set 4-Digit PIN</Text>
              <TouchableOpacity
                onPress={() => setPinModalVisible(false)}
                style={[styles.closeBtn, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}
              >
                <X size={18} color={textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalLabel, { color: textMuted }]}>Enter New 4-Digit PIN</Text>
              <TextInput
                style={[styles.pinInput, { color: textPrimary, borderColor: border }]}
                placeholder="• • • •"
                placeholderTextColor={textMuted}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                value={newPin}
                onChangeText={setNewPin}
              />

              <Text style={[styles.modalLabel, { color: textMuted, marginTop: 14 }]}>
                Confirm 4-Digit PIN
              </Text>
              <TextInput
                style={[styles.pinInput, { color: textPrimary, borderColor: border }]}
                placeholder="• • • •"
                placeholderTextColor={textMuted}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
                value={confirmPin}
                onChangeText={setConfirmPin}
              />

              <TouchableOpacity
                onPress={handleSavePin}
                style={[styles.savePinBtn, { backgroundColor: THEME.colors.primary }]}
                activeOpacity={0.85}
              >
                <Text style={styles.savePinBtnText}>SAVE SECURITY PIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
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
  timeoutOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
  },
  timeoutPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  timeoutText: {
    fontSize: 11,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  pinInput: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    fontSize: 22,
    textAlign: 'center',
    letterSpacing: 8,
  },
  savePinBtn: {
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  savePinBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

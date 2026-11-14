import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  AppState,
  AppStateStatus,
  Vibration,
  Platform,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Lock, Fingerprint, Delete, ShieldCheck } from 'lucide-react-native';
import { useKhataStore } from '../../store/useKhataStore';
import { THEME, FONTS, getThemeColors } from '../../theme/theme';

export const AppLockGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { appLockEnabled, biometricUnlock, pin, business, isDarkMode } = useKhataStore();
  const colors = getThemeColors(isDarkMode);

  // App is locked if lock is enabled
  const [isLocked, setIsLocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const appState = useRef(AppState.currentState);

  const attemptBiometricAuth = useCallback(async () => {
    if (!biometricUnlock) return;
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) return;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Unlock ${business.name || 'Ledger'}`,
        fallbackLabel: 'Enter PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsLocked(false);
        setEnteredPin('');
        setErrorMessage('');
      }
    } catch {
      // User can still enter PIN
    }
  }, [biometricUnlock, business.name]);

  useEffect(() => {
    if (appLockEnabled) {
      setIsLocked(true);
      attemptBiometricAuth();
    } else {
      setIsLocked(false);
    }
  }, [appLockEnabled]);

  // Handle app going to background and resuming
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current &&
        /inactive|background/.test(appState.current) &&
        nextAppState === 'active' &&
        appLockEnabled
      ) {
        setIsLocked(true);
        setEnteredPin('');
        setErrorMessage('');
        attemptBiometricAuth();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [appLockEnabled, attemptBiometricAuth]);

  const handleKeyPress = (num: string) => {
    if (enteredPin.length >= 4) return;
    const nextPin = enteredPin + num;
    setEnteredPin(nextPin);
    setErrorMessage('');

    if (nextPin.length === 4) {
      if (nextPin === (pin || '1234')) {
        // Success
        setIsLocked(false);
        setEnteredPin('');
        setErrorMessage('');
      } else {
        // Mismatch
        Vibration.vibrate(100);
        setErrorMessage('Incorrect PIN. Please try again.');
        setTimeout(() => {
          setEnteredPin('');
        }, 400);
      }
    }
  };

  const handleDelete = () => {
    if (enteredPin.length > 0) {
      setEnteredPin(enteredPin.slice(0, -1));
      setErrorMessage('');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {children}

      <Modal
        visible={isLocked && appLockEnabled}
        animationType="fade"
        transparent={false}
        statusBarTranslucent
      >
        <View style={[styles.container, { backgroundColor: colors.bgCanvas }]}>
          {/* Header Branding */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder }]}>
              <Lock size={28} color={colors.primary} />
            </View>
            <Text style={[styles.brandTitle, { color: colors.textPrimary }]}>
              {business.name || 'My Business'}
            </Text>
            <Text style={[styles.brandSubtitle, { color: colors.textSecondary }]}>
              Enter 4-Digit Security PIN
            </Text>
          </View>

          {/* 4-PIN Indicators */}
          <View style={styles.pinDotsRow}>
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = enteredPin.length > idx;
              return (
                <View
                  key={idx}
                  style={[
                    styles.pinDot,
                    {
                      borderColor: errorMessage ? '#dc2626' : isFilled ? colors.primary : colors.border,
                      backgroundColor: errorMessage ? '#fee2e2' : isFilled ? colors.primary : colors.bgCard,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Error Message */}
          <View style={styles.errorContainer}>
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : (
              <Text style={[styles.hintText, { color: colors.textMuted }]}>
                {biometricUnlock ? 'Use PIN or Fingerprint / Face ID' : 'Secured with Khata App Lock'}
              </Text>
            )}
          </View>

          {/* Keypad */}
          <View style={styles.keypadContainer}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
            ].map((row, rIdx) => (
              <View key={rIdx} style={styles.keypadRow}>
                {row.map((digit) => (
                  <TouchableOpacity
                    key={digit}
                    onPress={() => handleKeyPress(digit)}
                    style={[styles.keypadBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                    activeOpacity={0.65}
                  >
                    <Text style={[styles.keypadDigit, { color: colors.textPrimary }]}>{digit}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            {/* Bottom Row: Biometrics, 0, Backspace */}
            <View style={styles.keypadRow}>
              {biometricUnlock ? (
                <TouchableOpacity
                  onPress={attemptBiometricAuth}
                  style={[styles.keypadBtn, { backgroundColor: colors.primaryBg, borderColor: colors.primaryBorder }]}
                  activeOpacity={0.65}
                >
                  <Fingerprint size={24} color={colors.primary} />
                </TouchableOpacity>
              ) : (
                <View style={[styles.keypadBtn, { borderColor: 'transparent', backgroundColor: 'transparent' }]} />
              )}

              <TouchableOpacity
                onPress={() => handleKeyPress('0')}
                style={[styles.keypadBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                activeOpacity={0.65}
              >
                <Text style={[styles.keypadDigit, { color: colors.textPrimary }]}>0</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleDelete}
                style={[styles.keypadBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                activeOpacity={0.65}
              >
                <Delete size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Security Note */}
          <View style={styles.footer}>
            <ShieldCheck size={14} color={colors.textMuted} />
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              Hardware Encrypted Security
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    marginBottom: 6,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 14,
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  pinDotsRow: {
    flexDirection: 'row',
    gap: 18,
    marginVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  errorContainer: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  errorText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    color: '#dc2626',
  },
  hintText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  keypadContainer: {
    width: '100%',
    maxWidth: 300,
    gap: 16,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  keypadBtn: {
    flex: 1,
    aspectRatio: 1.15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  keypadDigit: {
    fontSize: 24,
    fontFamily: FONTS.semiBold,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 36,
  },
  footerText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
});

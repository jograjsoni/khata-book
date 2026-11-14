import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { KeyRound, Mail, Lock, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react-native';
import { THEME, getThemeColors, FONTS } from '../theme/theme';
import { useKhataStore } from '../store/useKhataStore';
import { Header } from '../components/common/Header';
import { api } from '../services/apiService';
import { sileo } from '../components/common/SileoNotification';
import { ScalePressable } from '../components/common/ScalePressable';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { isDarkMode } = useKhataStore();
  const colors = getThemeColors(isDarkMode);

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!emailOrPhone.trim()) {
      sileo.warning('Required', 'Please enter your registered mobile number or email.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.forgotPassword(emailOrPhone.trim());
      setSent(true);
      if (res.otp) {
        setOtp(res.otp);
        sileo.info('Verification OTP Sent', `Code: ${res.otp} (Valid for 15 mins)`);
      } else {
        sileo.success('OTP Dispatched', `A 6-digit code was sent to ${emailOrPhone.trim()}`);
      }
    } catch (err: any) {
      sileo.error('Request Failed', err?.message || 'Failed to dispatch verification OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp.trim()) {
      sileo.warning('OTP Required', 'Please enter the 6-digit verification code.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      sileo.warning('New Password Required', 'Please enter a password with at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword({
        emailOrPhone: emailOrPhone.trim(),
        otp: otp.trim(),
        newPassword,
      });
      sileo.success('Password Updated', 'Your password was reset successfully. Please sign in.');
      setTimeout(() => {
        router.replace('/login');
      }, 700);
    } catch (err: any) {
      sileo.error('Reset Failed', err?.message || 'Failed to reset password. Please check your OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgCanvas }]} edges={['top']}>
      <Header title="Reset Password" subtitle="Account Recovery" showBack />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={[styles.tileBadge, { backgroundColor: colors.bgSecondary }]}>
              <KeyRound size={22} color={colors.primary} />
            </View>

            <Text style={[styles.headline, { color: colors.textPrimary }]}>
              {sent ? 'Verify OTP Code' : 'Forgot Password?'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {sent
                ? 'Enter the 6-digit OTP code sent to your mobile to create a new password.'
                : 'Enter your registered mobile number or email to receive password reset instructions.'}
            </Text>

            {!sent ? (
              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                  Registered Mobile or Email
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: colors.bgCanvas, borderColor: colors.border },
                  ]}
                >
                  <Mail size={16} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="Phone number or email"
                    placeholderTextColor={colors.textMuted}
                    value={emailOrPhone}
                    onChangeText={setEmailOrPhone}
                    keyboardType="default"
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ) : (
              <>
                <View style={styles.formField}>
                  <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                    6-Digit OTP Code
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: colors.bgCanvas, borderColor: colors.border },
                    ]}
                  >
                    <KeyRound size={16} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.textInput, { color: colors.textPrimary }]}
                      placeholder="Enter 6-digit OTP"
                      placeholderTextColor={colors.textMuted}
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <View style={styles.formField}>
                  <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                    New Password
                  </Text>
                  <View
                    style={[
                      styles.inputContainer,
                      { backgroundColor: colors.bgCanvas, borderColor: colors.border },
                    ]}
                  >
                    <Lock size={16} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.textInput, { color: colors.textPrimary }]}
                      placeholder="Enter new strong password"
                      placeholderTextColor={colors.textMuted}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                    />
                  </View>
                </View>
              </>
            )}

            <ScalePressable
              onPress={sent ? handleResetPassword : handleSendOtp}
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              scaleTo={0.96}
              disabled={loading}
            >
              <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                {loading
                  ? 'Processing...'
                  : sent
                  ? 'Reset Password & Sign In'
                  : 'Send Recovery OTP'}
              </Text>
            </ScalePressable>

            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backBtn, { borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.backBtnText, { color: colors.textSecondary }]}>
                Back to Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 16 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 22,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  tileBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  headline: { fontSize: 22, fontFamily: FONTS.bold },
  subtitle: { fontSize: 13, fontFamily: FONTS.regular, lineHeight: 18 },
  formField: { gap: 6 },
  fieldLabel: { fontSize: 13, fontFamily: FONTS.semiBold },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 10,
  },
  textInput: { flex: 1, fontSize: 14, fontFamily: FONTS.regular },
  primaryBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryBtnText: { fontSize: 14, fontFamily: FONTS.bold },
  backBtn: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: { fontSize: 13, fontFamily: FONTS.medium },
});

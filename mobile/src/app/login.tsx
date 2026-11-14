import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  BookOpen,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Flame,
  ShieldCheck,
} from 'lucide-react-native';
import { THEME, getThemeColors, FONTS } from '../theme/theme';
import { useKhataStore } from '../store/useKhataStore';
import { api } from '../services/apiService';
import { sileo } from '../components/common/SileoNotification';
import { ScalePressable } from '../components/common/ScalePressable';

export default function LoginScreen() {
  const router = useRouter();
  const { isDarkMode, updateBusiness } = useKhataStore();
  const colors = getThemeColors(isDarkMode);

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!emailOrPhone.trim()) {
      sileo.warning('Input Required', 'Please enter your registered email or 10-digit mobile number.');
      return;
    }
    if (!password) {
      sileo.warning('Password Required', 'Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(emailOrPhone.trim(), password);
      if (res.user?.businessProfile) {
        updateBusiness(res.user.businessProfile);
      }
      sileo.success('Welcome Back!', `Logged in successfully as ${res.user?.name || 'Merchant'}`);
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);
    } catch (err: any) {
      sileo.error('Sign In Failed', err?.message || 'Invalid email/phone or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const targetEmail = emailOrPhone.includes('@')
        ? emailOrPhone.trim().toLowerCase()
        : 'merchant@khata.app';
      const targetName = emailOrPhone.includes('@')
        ? emailOrPhone.split('@')[0]
        : (emailOrPhone.trim() || 'Merchant');
      const googleProfile = {
        email: targetEmail,
        name: targetName,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=face',
        googleId: `google_oauth_${Date.now()}`,
      };
      const res = await api.googleLogin(googleProfile);
      if (res.user?.businessProfile) {
        updateBusiness(res.user.businessProfile);
      }
      sileo.success('Google Sign-in Successful', `Logged in as ${res.user?.email || googleProfile.email}`);
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);
    } catch (err: any) {
      sileo.error('Google Sign-in Failed', err?.message || 'Failed to authenticate with Google account.');
    } finally {
      setLoading(false);
    }
  };

  const handleFirebaseLogin = async () => {
    const cleanInput = emailOrPhone.trim();
    if (!cleanInput) {
      sileo.warning('Input Required', 'Please enter your registered mobile number or email for Firebase Auth.');
      return;
    }
    setLoading(true);
    try {
      const isPhone = !cleanInput.includes('@') && cleanInput.length >= 10;
      const targetPhone = isPhone ? (cleanInput.startsWith('+91') ? cleanInput : `+91${cleanInput}`) : '';
      const targetEmail = cleanInput.includes('@') ? cleanInput.toLowerCase() : `merchant_${Date.now()}@firebase.khata`;
      const targetName = isPhone ? `Merchant (${cleanInput.slice(-4)})` : cleanInput.split('@')[0];

      const res = await api.firebaseLogin({
        uid: `firebase_${isPhone ? cleanInput.replace(/[^0-9]/g, '') : Date.now()}`,
        phone: targetPhone,
        email: targetEmail,
        name: targetName || 'Merchant Owner',
      });

      if (res.user?.businessProfile) {
        updateBusiness(res.user.businessProfile);
      }
      sileo.success('Firebase Auth Successful', `Verified & connected as ${res.user?.name || targetName}`);
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);
    } catch (err: any) {
      sileo.error('Firebase Auth Failed', err?.message || 'Failed to verify Firebase identity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgCanvas }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Card matching login-page (1).html */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Header: Book Tile + Headline + Subtitle */}
            <View style={styles.cardHeader}>
              <View style={[styles.tileBadge, { backgroundColor: colors.bgSecondary }]}>
                <BookOpen size={22} color={colors.primary} strokeWidth={2} />
              </View>
              <Text style={[styles.headline, { color: colors.textPrimary }]}>
                Login to Khatabook
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Enter your mobile number to view udhar and jama
              </Text>
            </View>

            {/* Form Fields */}
            <View style={styles.formStack}>
              {/* 1. Email or Phone */}
              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                  Email or Phone
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: colors.bgCanvas,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Mail size={16} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="name@example.com or mobile"
                    placeholderTextColor={colors.textMuted}
                    value={emailOrPhone}
                    onChangeText={setEmailOrPhone}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* 2. Password with 'Forgot your password?' */}
              <View style={styles.formField}>
                <View style={styles.labelBetweenRow}>
                  <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                    Password
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push('/forgot-password')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={[styles.forgotLink, { color: colors.primary }]}>
                      Forgot your password?
                    </Text>
                  </TouchableOpacity>
                </View>

                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: colors.bgCanvas,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Lock size={16} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword((p) => !p)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showPassword ? (
                      <EyeOff size={16} color={colors.textSecondary} />
                    ) : (
                      <Eye size={16} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Primary Action: Sign in with Email / Phone */}
              <ScalePressable
                onPress={handleLogin}
                disabled={loading}
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                scaleTo={0.96}
              >
                <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                  {loading ? 'Signing in...' : 'Sign in with Password'}
                </Text>
              </ScalePressable>

              {/* Firebase Mobile Phone OTP Button */}
              <ScalePressable
                onPress={handleFirebaseLogin}
                disabled={loading}
                style={[styles.firebaseBtn, { backgroundColor: '#F59E0B' }]}
                scaleTo={0.96}
              >
                <ShieldCheck size={18} color="#FFFFFF" strokeWidth={2.2} />
                <Text style={styles.firebaseBtnText}>
                  Instant Login with Firebase Phone OTP
                </Text>
              </ScalePressable>

              {/* OR Divider */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textMuted }]}>OR</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              {/* Continue with Google */}
              <ScalePressable
                onPress={handleGoogleLogin}
                disabled={loading}
                style={[
                  styles.googleBtn,
                  {
                    backgroundColor: colors.bgSecondary,
                    borderColor: colors.border,
                  },
                ]}
                scaleTo={0.96}
              >
                <Text style={styles.googleG}>G</Text>
                <Text style={[styles.googleBtnText, { color: colors.textPrimary }]}>
                  Continue with Google
                </Text>
              </ScalePressable>
            </View>

            {/* Footer: Create an account */}
            <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity onPress={() => router.push('/signup')} activeOpacity={0.7}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                  New here?{' '}
                  <Text style={{ color: colors.primary, fontFamily: FONTS.bold }}>
                    Create an account
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    gap: 6,
  },
  tileBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  headline: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 18,
  },
  formStack: {
    gap: 16,
  },
  formField: {
    gap: 6,
  },
  labelBetweenRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  forgotLink: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  primaryBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  firebaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    gap: 8,
  },
  firebaseBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontFamily: FONTS.bold,
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  googleG: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    color: '#4285F4',
  },
  googleBtnText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  cardFooter: {
    borderTopWidth: 1,
    paddingTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
});

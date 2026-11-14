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
import {
  BookOpen,
  User,
  Building,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react-native';
import { getThemeColors, FONTS } from '../theme/theme';
import { useKhataStore } from '../store/useKhataStore';
import { api } from '../services/apiService';
import { sileo } from '../components/common/SileoNotification';
import { ScalePressable } from '../components/common/ScalePressable';

export default function SignupScreen() {
  const router = useRouter();
  const { isDarkMode, updateBusiness } = useKhataStore();
  const colors = getThemeColors(isDarkMode);

  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      sileo.warning('Name Required', 'Please enter your full name.');
      return;
    }
    if (!phone.trim() || phone.replace(/[^0-9]/g, '').length < 10) {
      sileo.warning('Mobile Required', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      sileo.warning('Email Required', 'Please enter a valid business email address.');
      return;
    }
    if (!password || password.length < 6) {
      sileo.warning('Password Weak', 'Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      sileo.warning('Password Mismatch', 'Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = `+91${phone.replace(/[^0-9]/g, '').slice(-10)}`;
      const res = await api.register({
        name: name.trim(),
        businessName: businessName.trim() || `${name.trim()}'s Business`,
        phone: cleanPhone,
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.user?.businessProfile) {
        updateBusiness(res.user.businessProfile);
      }

      sileo.success('Account Created!', `Welcome to Digital Khata, ${name.trim()}!`);
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);
    } catch (err: any) {
      sileo.error('Registration Failed', err?.message || 'Unable to create account. Please try again.');
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
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Header Badge & Title */}
            <View style={styles.cardHeader}>
              <View style={[styles.tileBadge, { backgroundColor: colors.primary }]}>
                <BookOpen size={24} color={colors.primaryForeground} strokeWidth={2.4} />
              </View>
              <Text style={[styles.headline, { color: colors.textPrimary }]}>
                Create Merchant Account
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Start managing books, customers, suppliers, and UPI settlements effortlessly.
              </Text>
            </View>

            {/* Form Fields */}
            <View style={styles.formStack}>
              {/* Full Name */}
              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Full Name</Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: colors.bgSecondary, borderColor: colors.border },
                  ]}
                >
                  <User size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="Merchant Owner Name"
                    placeholderTextColor={colors.textMuted}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Business Name */}
              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                  Business / Shop Name
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: colors.bgSecondary, borderColor: colors.border },
                  ]}
                >
                  <Building size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="e.g. Apex Traders & Hardware"
                    placeholderTextColor={colors.textMuted}
                    value={businessName}
                    onChangeText={setBusinessName}
                  />
                </View>
              </View>

              {/* Mobile Phone */}
              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                  Mobile Phone Number
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: colors.bgSecondary, borderColor: colors.border },
                  ]}
                >
                  <Phone size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="10-digit mobile number"
                    placeholderTextColor={colors.textMuted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Email Address */}
              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                  Business Email
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: colors.bgSecondary, borderColor: colors.border },
                  ]}
                >
                  <Mail size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="name@business.com"
                    placeholderTextColor={colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Password</Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: colors.bgSecondary, borderColor: colors.border },
                  ]}
                >
                  <Lock size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="At least 6 characters"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={colors.textSecondary} />
                    ) : (
                      <Eye size={18} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                  Confirm Password
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    { backgroundColor: colors.bgSecondary, borderColor: colors.border },
                  ]}
                >
                  <Lock size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="Re-enter password"
                    placeholderTextColor={colors.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                  />
                </View>
              </View>

              {/* Submit Button */}
              <ScalePressable
                onPress={handleRegister}
                disabled={loading}
                style={[
                  styles.primaryBtn,
                  { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 },
                ]}
                scaleTo={0.96}
              >
                <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                  {loading ? 'Creating Account...' : 'Create Merchant Account'}
                </Text>
                <ArrowRight size={18} color={colors.primaryForeground} strokeWidth={2.2} />
              </ScalePressable>
            </View>

            {/* Footer: Sign in link */}
            <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity onPress={() => router.replace('/login')} activeOpacity={0.7}>
                <Text style={[styles.footerText, { color: colors.textSecondary }]}>
                  Already have an account?{' '}
                  <Text style={{ color: colors.primary, fontFamily: FONTS.bold }}>
                    Sign in here
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
    paddingVertical: 24,
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
    gap: 14,
  },
  formField: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  primaryBtnText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
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

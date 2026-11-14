import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Building2,
  User,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  QrCode,
  BadgeAlert,
  Trash2,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Mail,
  Landmark,
  Check,
  X,
} from 'lucide-react-native';
import { THEME, FONTS, getThemeColors } from '../theme/theme';
import { useKhataStore } from '../store/useKhataStore';
import { Header } from '../components/common/Header';
import { verifyPanWithApi, ValidationResult } from '../services/idValidationService';

export default function EditBusinessProfileScreen() {
  const router = useRouter();
  const { business, updateBusiness, isDarkMode } = useKhataStore();
  const colors = getThemeColors(isDarkMode);

  const [name, setName] = useState(business.name || '');
  const [ownerName, setOwnerName] = useState(business.ownerName || '');
  const [email, setEmail] = useState(business.email || '');
  const [category, setCategory] = useState(business.category || 'Wholesale & Retail');
  const [pan, setPan] = useState(business.pan || '');
  const [gstin, setGstin] = useState(business.gstin || '');
  const [phone, setPhone] = useState(business.phone || '');
  const [address, setAddress] = useState(business.address || '');
  const [businessType, setBusinessType] = useState(business.businessType || 'Wholesale & Retail');

  // Separated Bank Details
  const [bankName, setBankName] = useState(business.bankName || '');
  const [accountNumber, setAccountNumber] = useState(business.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(business.ifscCode || '');

  const [upiId, setUpiId] = useState(business.upiId || '');
  const [regNumber, setRegNumber] = useState(business.registrationNumber || '');

  // Category dropdown modal state
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  // PAN validation state
  const [panValidation, setPanValidation] = useState<ValidationResult>({
    isValid: !!business.pan,
    status: business.pan ? 'valid' : 'idle',
    message: business.pan ? 'Valid PAN' : '',
    entityType: business.pan ? 'Individual / Taxpayer' : undefined,
  });
  const [isValidatingPan, setIsValidatingPan] = useState(false);

  const categories = [
    'Wholesale & Retail',
    'Kirana & Grocery',
    'Electronics & Mobile',
    'Clothing & Garments',
    'Hardware & Sanitaryware',
    'Pharmacy & Medical',
    'Restaurant & Cafe',
    'FMCG Distributor',
    'General Store',
    'Other',
  ];

  const handlePanChange = async (text: string) => {
    const clean = text.toUpperCase();
    setPan(clean);
    if (clean.length === 10) {
      setIsValidatingPan(true);
      const res = await verifyPanWithApi(clean);
      setPanValidation(res);
      setIsValidatingPan(false);
    } else if (clean.length > 0) {
      setPanValidation({
        isValid: false,
        status: 'invalid',
        message: `10 characters required (${clean.length}/10)`,
      });
    } else {
      setPanValidation({
        isValid: false,
        status: 'idle',
        message: '',
      });
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Business name cannot be blank.');
      return;
    }
    if (!ownerName.trim()) {
      Alert.alert('Required', 'Owner name cannot be blank.');
      return;
    }

    const combinedBankAccount = `${bankName.trim()} · A/C ${accountNumber.trim()} · IFSC ${ifscCode.trim()}`;

    updateBusiness({
      name: name.trim(),
      ownerName: ownerName.trim(),
      email: email.trim(),
      category,
      pan: pan.trim(),
      gstin: gstin.trim(),
      phone: phone.trim(),
      address: address.trim(),
      businessType,
      bankName: bankName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim(),
      bankAccount: combinedBankAccount,
      upiId: upiId.trim(),
      registrationNumber: regNumber.trim(),
    });

    Alert.alert('Profile Saved', 'Your business profile has been updated.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your business account? This will erase all ledger data permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Action Restricted', 'Account deletion requires contacting Khata support.');
          },
        },
      ]
    );
  };

  // Dynamic red/green required star helper
  const renderStar = (isFilled: boolean) => (
    <Text style={{ color: isFilled ? '#16a34a' : '#ef4444', fontWeight: '700', fontSize: 14 }}>
      {' '}*
    </Text>
  );

  const bgCanvas = isDarkMode ? THEME.colors.dark.bgCanvas : THEME.colors.bgCanvas;
  const bgCard = isDarkMode ? THEME.colors.dark.bgCard : THEME.colors.bgCard;
  const border = isDarkMode ? THEME.colors.dark.border : THEME.colors.border;
  const textPrimary = isDarkMode ? THEME.colors.dark.textPrimary : THEME.colors.textPrimary;
  const textMuted = isDarkMode ? THEME.colors.dark.textMuted : THEME.colors.textMuted;

  const isBankComplete = Boolean(bankName.trim() && accountNumber.trim() && ifscCode.trim());

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgCanvas }]} edges={['top']}>
      <Header
        title="Edit Business Profile"
        subtitle="Edit Business Details"
        showBack
      />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Logo Avatar Upload */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>
              {name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'BP'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => Alert.alert('Upload Logo', 'Logo picker opened.')}
            style={[styles.uploadLogoBtn, { backgroundColor: THEME.colors.primaryBg }]}
          >
            <UploadCloud size={14} color={THEME.colors.primary} />
            <Text style={[styles.uploadLogoText, { color: THEME.colors.primary }]}>Upload Logo</Text>
          </TouchableOpacity>
        </View>

        {/* 1. Business Name * */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: textPrimary }]}>
            Business Name
            {renderStar(name.trim().length > 0)}
          </Text>
          <View style={[styles.inputRow, { backgroundColor: bgCard, borderColor: border }]}>
            <Building2 size={18} color={THEME.colors.primary} />
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Modern Enterprises"
              placeholderTextColor={textMuted}
            />
          </View>
          <Text style={[styles.hint, { color: textMuted }]}>Name printed on invoices and ledgers</Text>
        </View>

        {/* 2. Owner Name * */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: textPrimary }]}>
            Owner Name
            {renderStar(ownerName.trim().length > 0)}
          </Text>
          <View style={[styles.inputRow, { backgroundColor: bgCard, borderColor: border }]}>
            <User size={18} color={THEME.colors.primary} />
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              value={ownerName}
              onChangeText={setOwnerName}
              placeholder="Enter owner name"
              placeholderTextColor={textMuted}
            />
          </View>
          <Text style={[styles.hint, { color: textMuted }]}>Primary contact for account recovery</Text>
        </View>

        {/* 3. Email Address * with Dynamic Star */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: textPrimary }]}>
            Email Address
            {renderStar(email.trim().length > 0)}
          </Text>
          <View style={[styles.inputRow, { backgroundColor: bgCard, borderColor: border }]}>
            <Mail size={18} color={THEME.colors.primary} />
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="e.g. contact@business.com"
              placeholderTextColor={textMuted}
            />
          </View>
          <Text style={[styles.hint, { color: textMuted }]}>
            For automated payment statements and ledger invoices
          </Text>
        </View>

        {/* 4. Business Category (Dropdown Input Box with Arrow) */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: textPrimary }]}>Business Category</Text>
          <TouchableOpacity
            onPress={() => setCategoryModalVisible(true)}
            style={[
              styles.inputRow,
              { backgroundColor: bgCard, borderColor: border, justifyContent: 'space-between' },
            ]}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <Building2 size={18} color={THEME.colors.primary} />
              <Text style={[styles.categoryValueText, { color: textPrimary }]}>
                {category || 'Select Category'}
              </Text>
            </View>
            <ChevronDown size={18} color={textMuted} />
          </TouchableOpacity>
          <Text style={[styles.hint, { color: textMuted }]}>Choose your store or enterprise category</Text>
        </View>

        {/* 5. PAN Card (with Live API Validation) */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: textPrimary }]}>
              PAN Card (Business / Proprietor)
              {renderStar(panValidation.isValid)}
            </Text>
            {isValidatingPan && <ActivityIndicator size="small" color={THEME.colors.primary} />}
          </View>
          <View
            style={[
              styles.inputRow,
              {
                backgroundColor: bgCard,
                borderColor: panValidation.status === 'invalid' ? '#ef4444' : border,
              },
            ]}
          >
            <CreditCard size={18} color={THEME.colors.primary} />
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              placeholder="ABCDE1234F"
              placeholderTextColor={textMuted}
              autoCapitalize="characters"
              maxLength={10}
              value={pan}
              onChangeText={handlePanChange}
            />
            {panValidation.status === 'valid' && (
              <CheckCircle2 size={18} color="#16a34a" />
            )}
            {panValidation.status === 'invalid' && (
              <AlertCircle size={18} color="#ef4444" />
            )}
          </View>
          {panValidation.message ? (
            <Text
              style={[
                styles.validationMessage,
                { color: panValidation.isValid ? '#16a34a' : '#ef4444' },
              ]}
            >
              {panValidation.message}
            </Text>
          ) : (
            <Text style={[styles.hint, { color: textMuted }]}>
              10-character Permanent Account Number verified via Income Tax API
            </Text>
          )}
        </View>

        {/* 6. GSTIN (optional) */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: textPrimary }]}>GSTIN (Optional)</Text>
          <View style={[styles.inputRow, { backgroundColor: bgCard, borderColor: border }]}>
            <FileText size={18} color={textMuted} />
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              placeholder="27AAAAA0000A1Z5"
              placeholderTextColor={textMuted}
              autoCapitalize="characters"
              value={gstin}
              onChangeText={setGstin}
            />
          </View>
          <Text style={[styles.hint, { color: textMuted }]}>
            15-digit Goods and Services Tax Identification Number
          </Text>
        </View>

        {/* 7. Phone Number * */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: textPrimary }]}>
            Phone Number
            {renderStar(phone.trim().length > 0)}
          </Text>
          <View style={[styles.inputRow, { backgroundColor: bgCard, borderColor: border }]}>
            <Phone size={18} color={THEME.colors.primary} />
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+91 10-digit mobile number"
              placeholderTextColor={textMuted}
            />
          </View>
          <Text style={[styles.hint, { color: textMuted }]}>Primary business contact number</Text>
        </View>

        {/* 8. Business Address * */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: textPrimary }]}>
            Business Address
            {renderStar(address.trim().length > 0)}
          </Text>
          <View style={[styles.inputRow, { backgroundColor: bgCard, borderColor: border, height: 60 }]}>
            <MapPin size={18} color={THEME.colors.primary} />
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              value={address}
              onChangeText={setAddress}
              multiline
              placeholder="Full shop / warehouse address"
              placeholderTextColor={textMuted}
            />
          </View>
          <Text style={[styles.hint, { color: textMuted }]}>Full address for customer bills & receipts</Text>
        </View>

        {/* 9. Enter Bank Account Details (Separated into 3 Individual Boxes) */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: textPrimary }]}>
              Enter Bank Account Details
              {renderStar(isBankComplete)}
            </Text>
            <Text
              style={[
                styles.statusHint,
                { color: isBankComplete ? '#16a34a' : '#ef4444' },
              ]}
            >
              {isBankComplete ? 'Complete' : 'Required'}
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            {/* Box 1: Bank Name */}
            <View style={[styles.inputRow, { backgroundColor: bgCard, borderColor: border }]}>
              <Landmark size={18} color={THEME.colors.primary} />
              <TextInput
                style={[styles.input, { color: textPrimary }]}
                placeholder="Bank Name (e.g. HDFC Bank, SBI)"
                placeholderTextColor={textMuted}
                value={bankName}
                onChangeText={setBankName}
              />
            </View>

            {/* Box 2: Account Number */}
            <View style={[styles.inputRow, { backgroundColor: bgCard, borderColor: border }]}>
              <CreditCard size={18} color={THEME.colors.primary} />
              <TextInput
                style={[styles.input, { color: textPrimary }]}
                placeholder="Account Number (e.g. 1234567890)"
                placeholderTextColor={textMuted}
                keyboardType="numeric"
                value={accountNumber}
                onChangeText={setAccountNumber}
              />
            </View>

            {/* Box 3: IFSC Code */}
            <View style={[styles.inputRow, { backgroundColor: bgCard, borderColor: border }]}>
              <FileText size={18} color={THEME.colors.primary} />
              <TextInput
                style={[styles.input, { color: textPrimary }]}
                placeholder="IFSC Code (e.g. HDFC0001234)"
                placeholderTextColor={textMuted}
                autoCapitalize="characters"
                value={ifscCode}
                onChangeText={(t) => setIfscCode(t.toUpperCase())}
              />
            </View>
          </View>
          <Text style={[styles.hint, { color: textMuted }]}>
            Linked for direct customer collection & QR payments
          </Text>
        </View>

        {/* 10. UPI ID */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: textPrimary }]}>UPI ID</Text>
          <View style={[styles.inputRow, { backgroundColor: bgCard, borderColor: border }]}>
            <QrCode size={18} color={textMuted} />
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              value={upiId}
              onChangeText={setUpiId}
              placeholder="e.g. merchant@okhdfcbank"
              placeholderTextColor={textMuted}
            />
          </View>
          <Text style={[styles.hint, { color: textMuted }]}>For instant zero-fee QR code settlements</Text>
        </View>

        {/* 11. Registration Number */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: textPrimary }]}>Registration Number (Optional)</Text>
          <View style={[styles.inputRow, { backgroundColor: bgCard, borderColor: border }]}>
            <BadgeAlert size={18} color={textMuted} />
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              value={regNumber}
              onChangeText={setRegNumber}
              placeholder="e.g. REG2026-10001"
              placeholderTextColor={textMuted}
            />
          </View>
          <Text style={[styles.hint, { color: textMuted }]}>Official government license or registration</Text>
        </View>

        {/* Delete Account */}
        <TouchableOpacity
          onPress={handleDeleteAccount}
          style={styles.deleteBtn}
          activeOpacity={0.7}
        >
          <Trash2 size={16} color={THEME.colors.danger} />
          <Text style={styles.deleteBtnText}>Delete Business Account</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer Bar */}
      <View style={[styles.footerBar, { backgroundColor: bgCard, borderTopColor: border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.cancelBtn, { borderColor: border }]}
        >
          <Text style={[styles.cancelBtnText, { color: textPrimary }]}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveBtn, { backgroundColor: THEME.colors.primary }]}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>Save Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Category Dropdown Modal */}
      <Modal
        visible={categoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: bgCard, borderColor: border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: border }]}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Select Business Category</Text>
              <TouchableOpacity
                onPress={() => setCategoryModalVisible(false)}
                style={[styles.modalCloseBtn, { backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9' }]}
              >
                <X size={16} color={textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {categories.map((c) => {
                const isSelected = category === c;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => {
                      setCategory(c);
                      setCategoryModalVisible(false);
                    }}
                    style={[
                      styles.categoryOption,
                      {
                        backgroundColor: isSelected
                          ? (isDarkMode ? '#1e3a5f' : '#f0fdf4')
                          : 'transparent',
                        borderColor: isSelected ? '#16a34a' : border,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        {
                          color: isSelected ? '#16a34a' : textPrimary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {c}
                    </Text>
                    {isSelected && <Check size={18} color="#16a34a" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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
  logoSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    fontFamily: FONTS.bold,
  },
  uploadLogoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  uploadLogoText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    marginBottom: 6,
  },
  statusHint: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
  },
  validationMessage: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONTS.regular,
  },
  categoryValueText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
  hint: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    marginTop: 10,
  },
  deleteBtnText: {
    color: THEME.colors.danger,
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  footerBar: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  saveBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  categoryOptionText: {
    fontSize: 14,
    fontFamily: FONTS.medium,
  },
});

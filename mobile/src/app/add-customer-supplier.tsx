import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User,
  Mail,
  Phone,
  FileText,
  Home,
  MapPin,
  Check,
  UploadCloud,
  CheckCircle2,
} from 'lucide-react-native';
import { THEME } from '../theme/theme';
import { useKhataStore } from '../store/useKhataStore';
import { Header } from '../components/common/Header';

export default function AddCustomerSupplierScreen() {
  const router = useRouter();
  const { addParty, business, isDarkMode } = useKhataStore();

  const [accountType, setAccountType] = useState<'customer' | 'supplier'>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [building, setBuilding] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState(business.city || '');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [sameShipping, setSameShipping] = useState(true);
  const [logoUploaded, setLogoUploaded] = useState(false);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Name Required', `Please enter the ${accountType} name.`);
      return;
    }
    if (!phone.trim() || phone.replace(/[^0-9]/g, '').length < 10) {
      Alert.alert('Phone Required', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    const fullAddress = [building, street, city, state, pincode].filter(Boolean).join(', ');

    const newId = addParty({
      name: name.trim(),
      phone: `+91 ${phone.replace(/[^0-9]/g, '').slice(-10)}`,
      email: email.trim() || undefined,
      type: accountType,
      balance: 0,
      balanceType: 'settled',
      lastTxDate: 'Just added',
      status: 'No Due Date',
      address: fullAddress || undefined,
      gstin: gstin.trim() || undefined,
    });

    Alert.alert(
      `${accountType === 'customer' ? 'Customer' : 'Supplier'} Created`,
      `${name.trim()} has been saved successfully.`,
      [
        {
          text: 'Open Ledger',
          onPress: () => router.replace(`/party/${newId}`),
        },
        {
          text: 'Done',
          onPress: () => router.back(),
        },
      ]
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
        title="Add Customer / Supplier"
        subtitle="Customer / Supplier Details"
        showBack
      />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Account Type Toggle matching add-customer-supplier.html */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: textPrimary }]}>Account Type</Text>
          <View style={[styles.typeToggleRow, { backgroundColor: bgCard, borderColor: border }]}>
            <TouchableOpacity
              onPress={() => setAccountType('customer')}
              style={[
                styles.typeBtn,
                accountType === 'customer' && { backgroundColor: THEME.colors.primary },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  { color: accountType === 'customer' ? '#FFFFFF' : textPrimary },
                ]}
              >
                Customer (You will get)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setAccountType('supplier')}
              style={[
                styles.typeBtn,
                accountType === 'supplier' && { backgroundColor: THEME.colors.pink },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  { color: accountType === 'supplier' ? '#FFFFFF' : textPrimary },
                ]}
              >
                Supplier (You will give)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Customer Photo / Logo */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: textPrimary }]}>Photo / Logo</Text>
          <TouchableOpacity
            onPress={() => setLogoUploaded(!logoUploaded)}
            style={[styles.uploadBox, { backgroundColor: bgCard, borderColor: border }]}
            activeOpacity={0.7}
          >
            <UploadCloud size={24} color={logoUploaded ? THEME.colors.success : THEME.colors.primary} />
            <Text style={[styles.uploadTitle, { color: textPrimary }]}>
              {logoUploaded ? 'Logo Uploaded ✓' : 'Upload Image'}
            </Text>
            <Text style={[styles.hint, { color: textMuted }]}>
              PNG, JPG up to 5MB (Optional)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Name */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: textPrimary }]}>
            {accountType === 'customer' ? 'Customer' : 'Supplier'} Name *
          </Text>
          <View style={[styles.inputRow, { backgroundColor: bgCard, borderColor: border }]}>
            <User size={18} color={THEME.colors.primary} />
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              placeholder="Enter party / business name"
              placeholderTextColor={textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>
          <Text style={[styles.hint, { color: textMuted }]}>Enter full trading name or individual name</Text>
        </View>

        {/* Email */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: textPrimary }]}>Email Address</Text>
          <View style={[styles.inputRow, { backgroundColor: bgCard, borderColor: border }]}>
            <Mail size={18} color={textMuted} />
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              placeholder="name@example.com"
              placeholderTextColor={textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <Text style={[styles.hint, { color: textMuted }]}>Optional for sending invoices and statements</Text>
        </View>

        {/* Mobile Number */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: textPrimary }]}>Mobile Number *</Text>
          <View style={[styles.inputRow, { backgroundColor: bgCard, borderColor: border }]}>
            <Phone size={18} color={THEME.colors.primary} />
            <Text style={[styles.prefix, { color: textPrimary }]}>+91</Text>
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              placeholder="10-digit mobile number"
              placeholderTextColor={textMuted}
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />
          </View>
          <Text style={[styles.hint, { color: textMuted }]}>Used for sending payment reminder SMS</Text>
        </View>

        {/* GSTIN */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: textPrimary }]}>GSTIN (Optional)</Text>
          <View style={[styles.inputRow, { backgroundColor: bgCard, borderColor: border }]}>
            <FileText size={18} color={textMuted} />
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              placeholder="22AAAAA0000A1Z5"
              placeholderTextColor={textMuted}
              autoCapitalize="characters"
              value={gstin}
              onChangeText={setGstin}
            />
          </View>
          <Text style={[styles.hint, { color: textMuted }]}>15-digit GST identification number</Text>
        </View>

        {/* Address Fields matching add-customer-supplier.html */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.label, { color: textPrimary }]}>Billing Address</Text>
          
          <View style={[styles.inputRow, { backgroundColor: bgCard, borderColor: border, marginBottom: 8 }]}>
            <Home size={18} color={textMuted} />
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              placeholder="Flat / Building Number"
              placeholderTextColor={textMuted}
              value={building}
              onChangeText={setBuilding}
            />
          </View>

          <View style={[styles.inputRow, { backgroundColor: bgCard, borderColor: border, marginBottom: 8 }]}>
            <MapPin size={18} color={textMuted} />
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              placeholder="Area Location / Street"
              placeholderTextColor={textMuted}
              value={street}
              onChangeText={setStreet}
            />
          </View>

          <View style={styles.multiRow}>
            <View style={[styles.inputRow, { flex: 1, backgroundColor: bgCard, borderColor: border }]}>
              <TextInput
                style={[styles.input, { color: textPrimary }]}
                placeholder="City"
                placeholderTextColor={textMuted}
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={[styles.inputRow, { flex: 1, backgroundColor: bgCard, borderColor: border }]}>
              <TextInput
                style={[styles.input, { color: textPrimary }]}
                placeholder="State"
                placeholderTextColor={textMuted}
                value={state}
                onChangeText={setState}
              />
            </View>
          </View>

          <View style={[styles.inputRow, { backgroundColor: bgCard, borderColor: border, marginTop: 8 }]}>
            <MapPin size={18} color={textMuted} />
            <TextInput
              style={[styles.input, { color: textPrimary }]}
              placeholder="Pincode (e.g. 400001)"
              placeholderTextColor={textMuted}
              keyboardType="numeric"
              maxLength={6}
              value={pincode}
              onChangeText={setPincode}
            />
          </View>
        </View>

        {/* Shipping address same as billing */}
        <TouchableOpacity
          onPress={() => setSameShipping(!sameShipping)}
          style={styles.checkboxRow}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: sameShipping ? THEME.colors.primary : 'transparent',
                borderColor: sameShipping ? THEME.colors.primary : border,
              },
            ]}
          >
            {sameShipping && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
          </View>
          <Text style={[styles.checkboxLabel, { color: textPrimary }]}>
            Shipping address same as billing address
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Action Bar */}
      <View style={[styles.footerBar, { backgroundColor: bgCard, borderTopColor: border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.cancelBtn, { borderColor: border }]}
        >
          <Text style={[styles.cancelBtnText, { color: textPrimary }]}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          style={[
            styles.saveBtn,
            {
              backgroundColor:
                accountType === 'customer' ? THEME.colors.primary : THEME.colors.pink,
            },
          ]}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>
            Save {accountType === 'customer' ? 'Customer' : 'Supplier'}
          </Text>
        </TouchableOpacity>
      </View>
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
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  typeToggleRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  uploadBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 4,
  },
  uploadTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  hint: {
    fontSize: 11,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  prefix: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  multiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '500',
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
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1.6,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

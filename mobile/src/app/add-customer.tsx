import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Image,
  ScrollView,
  Platform,
  Alert,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Contacts from 'expo-contacts';
import * as ImagePicker from 'expo-image-picker';
import {
  Search,
  Plus,
  ArrowLeft,
  X,
  Camera,
  Check,
  User,
  Phone,
  Mail,
  Receipt,
  Home,
  MapPin,
  Building,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { THEME, getThemeColors, FONTS } from '../theme/theme';
import { useKhataStore } from '../store/useKhataStore';
import {
  verifyAadhaarWithApi,
  verifyPanWithApi,
  ValidationResult,
} from '../services/idValidationService';

const ALPHABETS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface SimpleContact {
  id: string;
  name: string;
  phone: string;
  photoUri?: string | null;
}

export default function AddCustomerScreen() {
  const router = useRouter();
  const { addParty, isDarkMode } = useKhataStore();
  const colors = getThemeColors(isDarkMode);

  const [searchQuery, setSearchQuery] = useState('');
  const [contactsSynced, setContactsSynced] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactsList, setContactsList] = useState<SimpleContact[]>([]);

  // Modal State - strictly starts as false
  const [modalVisible, setModalVisible] = useState(false);

  // Full customer/supplier fields matching add-customer-supplier.html
  const [accountType, setAccountType] = useState<'customer' | 'supplier'>('customer');
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [balanceType, setBalanceType] = useState<'get' | 'give'>('get');
  const [creditLimit, setCreditLimit] = useState('');
  const [gstin, setGstin] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [pan, setPan] = useState('');

  // Live Aadhaar & PAN verification states
  const [aadhaarValidation, setAadhaarValidation] = useState<ValidationResult>({
    isValid: false,
    status: 'idle',
    message: '',
  });
  const [isValidatingAadhaar, setIsValidatingAadhaar] = useState(false);

  const [panValidation, setPanValidation] = useState<ValidationResult>({
    isValid: false,
    status: 'idle',
    message: '',
  });
  const [isValidatingPan, setIsValidatingPan] = useState(false);

  const handleAadhaarChange = async (text: string) => {
    const digits = text.replace(/[^0-9]/g, '').slice(0, 12);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    setAadhaar(formatted);

    if (digits.length === 12) {
      setIsValidatingAadhaar(true);
      const res = await verifyAadhaarWithApi(digits);
      setAadhaarValidation(res);
      setIsValidatingAadhaar(false);
    } else if (digits.length > 0) {
      setAadhaarValidation({
        isValid: false,
        status: 'invalid',
        message: `${digits.length}/12 digits entered`,
      });
    } else {
      setAadhaarValidation({
        isValid: false,
        status: 'idle',
        message: '',
      });
    }
  };

  const handlePanChange = async (text: string) => {
    const clean = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
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
        message: `${clean.length}/10 characters entered`,
      });
    } else {
      setPanValidation({
        isValid: false,
        status: 'idle',
        message: '',
      });
    }
  };
  const [flatBuilding, setFlatBuilding] = useState('');
  const [areaStreet, setAreaStreet] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [saveToPhoneContacts, setSaveToPhoneContacts] = useState(true);
  const [custPhotoUri, setCustPhotoUri] = useState<string | null>(null);

  const renderStar = (isFilled: boolean) => (
    <Text style={{ color: isFilled ? '#16a34a' : '#ef4444', fontWeight: '700' }}> *</Text>
  );

  const flatListRef = useRef<FlatList>(null);

  const loadDeviceContacts = useCallback(async () => {
    try {
      setLoadingContacts(true);
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name, Contacts.Fields.Image],
      });
      if (data && data.length > 0) {
        const formatted: SimpleContact[] = data
          .filter((c) => c.name && c.phoneNumbers && c.phoneNumbers.length > 0)
          .map((c, i) => ({
            id: c.id || `contact-${i}`,
            name: c.name || 'Unnamed',
            phone: c.phoneNumbers![0].number || '',
            photoUri: (c as any).image?.uri,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        setContactsList(formatted);
      } else {
        setContactsList([]);
      }
      setContactsSynced(true);
    } catch (err) {
      setContactsSynced(false);
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  // System permission auto-request flow on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Contacts.getPermissionsAsync();
        if (status === 'granted') {
          await loadDeviceContacts();
        } else {
          const req = await Contacts.requestPermissionsAsync();
          if (req.status === 'granted') {
            await loadDeviceContacts();
          }
        }
      } catch {
        // Fallback
      }
    })();
  }, [loadDeviceContacts]);

  // Sync phone contacts: native device permissions with seamless web/preview fallback
  const handleAllowSync = async () => {
    try {
      setLoadingContacts(true);
      if (Platform.OS !== 'web') {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status === 'granted') {
          const { data } = await Contacts.getContactsAsync({
            fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name, Contacts.Fields.Image],
          });
          if (data && data.length > 0) {
            const formatted: SimpleContact[] = data
              .filter((c) => c.name && c.phoneNumbers && c.phoneNumbers.length > 0)
              .map((c, i) => ({
                id: c.id || `contact-${i}`,
                name: c.name || 'Unnamed',
                phone: c.phoneNumbers![0].number || '',
                photoUri: (c as any).image?.uri,
              }))
              .sort((a, b) => a.name.localeCompare(b.name));
            setContactsList(formatted);
            setContactsSynced(true);
            return;
          }
        }
      }

      setContactsList([]);
      setContactsSynced(true);
    } catch {
      setContactsList([]);
      setContactsSynced(true);
    } finally {
      setLoadingContacts(false);
    }
  };

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contactsList;
    const q = searchQuery.toLowerCase();
    return contactsList.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)
    );
  }, [contactsList, searchQuery]);

  const handleOpenModal = (contact?: SimpleContact) => {
    if (contact) {
      setCustName(contact.name);
      setCustPhone(contact.phone.replace(/[^0-9]/g, '').slice(-10));
      setCustPhotoUri(contact.photoUri || null);
    } else {
      setCustName('');
      setCustEmail('');
      setCustPhone('');
      setOpeningBalance('');
      setCreditLimit('');
      setGstin('');
      setAadhaar('');
      setPan('');
      setAadhaarValidation({ isValid: false, status: 'idle', message: '' });
      setPanValidation({ isValid: false, status: 'idle', message: '' });
      setFlatBuilding('');
      setAreaStreet('');
      setCity('');
      setStateName('');
      setPincode('');
      setCustPhotoUri(null);
    }
    setModalVisible(true);
  };

  const handlePickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera roll permission is required to select a photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCustPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };

  const handleSaveCustomer = async () => {
    if (!custName.trim()) {
      Alert.alert('Required Field', 'Please enter customer / supplier name.');
      return;
    }

    const cleanPhone = custPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    const parsedBalance = parseFloat(openingBalance.replace(/[^0-9.]/g, '')) || 0;
    const parsedLimit = parseFloat(creditLimit.replace(/[^0-9.]/g, '')) || 50000;

    const fullAddress = [flatBuilding, areaStreet, city, stateName, pincode]
      .filter((s) => s.trim().length > 0)
      .join(', ');

    // 1. Add party to live Khata store
    addParty({
      name: custName.trim(),
      phone: `+91 ${cleanPhone.slice(-10, -5)} ${cleanPhone.slice(-5)}`,
      email: custEmail.trim() || undefined,
      aadhaar: aadhaar.replace(/\s+/g, '') || undefined,
      pan: pan.trim().toUpperCase() || undefined,
      type: accountType,
      balance: parsedBalance,
      balanceType: parsedBalance === 0 ? 'settled' : balanceType,
      lastTxDate: 'Just now',
      status: parsedBalance > 0 ? 'Due Today' : 'Settled',
      address: fullAddress || undefined,
      gstin: gstin.trim().toUpperCase() || undefined,
      creditLimit: parsedLimit,
      riskLevel: 'Low',
    });

    // 2. Also save to phone contacts if checked
    if (saveToPhoneContacts && Platform.OS !== 'web') {
      try {
        const { status } = await Contacts.requestPermissionsAsync();
        if (status === 'granted') {
          const contactData: any = {
            name: custName.trim(),
            firstName: custName.trim(),
            contactType: Contacts.ContactTypes.Person,
            phoneNumbers: [
              {
                label: 'mobile',
                number: `+91${cleanPhone.slice(-10)}`,
              },
            ],
          };
          await Contacts.addContactAsync(contactData);
        }
      } catch (err) {
        // Safe fallback
      }
    }

    setModalVisible(false);
    Alert.alert('Success', `${custName.trim()} has been added successfully.`);
    router.replace('/(tabs)');
  };

  const handleScrollToLetter = (letter: string) => {
    const idx = filteredContacts.findIndex((c) =>
      c.name.trim().toUpperCase().startsWith(letter)
    );
    if (idx !== -1 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: idx, animated: true });
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgCanvas }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.headerContainer, { backgroundColor: colors.bgCanvas, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtnBox, { backgroundColor: colors.bgSecondary }]}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Add Customer</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            Choose from phonebook or enter manually
          </Text>
        </View>
      </View>

      {/* Top Search & Add New Customer Button */}
      <View style={[styles.topControlsSection, { backgroundColor: colors.bgCanvas, borderBottomColor: colors.border }]}>
        {/* Rounded Search Bar */}
        <View style={[styles.roundedSearchBar, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <Search size={16} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search by name or mobile number..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Add New Customer Button (Single Plus Icon & Text "Add New Customer") */}
        <TouchableOpacity
          onPress={() => handleOpenModal()}
          style={[
            styles.dashedAddBtn,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
          activeOpacity={0.8}
        >
          <Plus size={18} color={colors.textPrimary} strokeWidth={2.2} />
          <Text style={[styles.dashedAddText, { color: colors.textPrimary }]}>
            Add New Customer
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Container */}
      <View style={styles.mainContainer}>
        {!contactsSynced ? (
          /* State 1: Permission Prompt Card */
          <View style={[styles.permissionCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={[styles.permissionIconCircle, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <Phone size={24} color={colors.textPrimary} />
            </View>
            <Text style={[styles.permissionTitle, { color: colors.textPrimary }]}>
              Quick Add From Contacts
            </Text>
            <Text style={[styles.permissionDesc, { color: colors.textSecondary }]}>
              Sync your phonebook to quickly select existing contacts without re-typing their details.
            </Text>
            <TouchableOpacity
              onPress={handleAllowSync}
              style={[styles.allowBtn, { backgroundColor: colors.textPrimary }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.allowBtnText, { color: colors.bgCanvas }]}>
                {loadingContacts ? 'Syncing Contacts...' : 'Allow Contact Access'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* State 2: A-Z Contact Directory */
          <View style={{ flex: 1 }}>
            <View style={styles.listHeaderRow}>
              <Text style={[styles.listHeaderTitle, { color: colors.textSecondary }]}>
                PHONEBOOK CONTACTS ({filteredContacts.length})
              </Text>
            </View>

            <View style={{ flex: 1, flexDirection: 'row' }}>
              <FlatList
                ref={flatListRef}
                data={filteredContacts}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleOpenModal(item)}
                    style={[styles.contactRow, { borderBottomColor: colors.border }]}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.contactAvatar, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                      {item.photoUri ? (
                        <Image source={{ uri: item.photoUri }} style={styles.contactAvatarImg} />
                      ) : (
                        <Text style={[styles.contactInitials, { color: colors.textPrimary }]}>
                          {item.name
                            .split(' ')
                            .map((w: string) => w[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.contactInfoCol}>
                      <Text style={[styles.contactName, { color: colors.textPrimary }]}>{item.name}</Text>
                      <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>{item.phone}</Text>
                    </View>
                    <View style={[styles.selectCircle, { borderColor: colors.border }]}>
                      <Plus size={14} color={colors.textSecondary} />
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={{ padding: 32, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 14, fontFamily: FONTS.semiBold, color: colors.textPrimary, marginBottom: 6 }}>
                      No contacts found
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: FONTS.regular, color: colors.textSecondary, textAlign: 'center', marginBottom: 16 }}>
                      Tap "Add New Customer" above to enter customer or supplier details manually.
                    </Text>
                  </View>
                }
              />

              {/* A-Z Alphabet Index Bar */}
              <View style={styles.alphaIndexBar}>
                {ALPHABETS.map((letter) => (
                  <TouchableOpacity
                    key={letter}
                    onPress={() => handleScrollToLetter(letter)}
                    hitSlop={{ top: 2, bottom: 2, left: 6, right: 6 }}
                  >
                    <Text style={[styles.alphaLetter, { color: colors.textSecondary }]}>
                      {letter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}
      </View>

      {/* FULL Customer & Supplier Details Modal matching add-customer-supplier.html */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable
            style={[styles.modalBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Grab handle indicator */}
            <View style={[styles.grabHandle, { backgroundColor: colors.border }]} />

            {/* Modal Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                  Customer / Supplier Details
                </Text>
                <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
                  Add full commercial profile to ledger
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 520 }}
              contentContainerStyle={{ padding: 18, gap: 16 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* 1. Account Type Selector */}
              <View>
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Account Type</Text>
                <View style={styles.typeCluster}>
                  <TouchableOpacity
                    onPress={() => setAccountType('customer')}
                    style={[
                      styles.typeOptionBtn,
                      {
                        backgroundColor: accountType === 'customer' ? colors.bgSecondary : colors.bgCanvas,
                        borderColor: accountType === 'customer' ? colors.textPrimary : colors.border,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.radioCircle, { borderColor: accountType === 'customer' ? colors.textPrimary : colors.border }]}>
                      {accountType === 'customer' && <View style={[styles.radioDot, { backgroundColor: colors.textPrimary }]} />}
                    </View>
                    <Text style={[styles.typeOptionText, { color: colors.textPrimary }]}>
                      Customer (You will get)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setAccountType('supplier')}
                    style={[
                      styles.typeOptionBtn,
                      {
                        backgroundColor: accountType === 'supplier' ? colors.bgSecondary : colors.bgCanvas,
                        borderColor: accountType === 'supplier' ? colors.textPrimary : colors.border,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.radioCircle, { borderColor: accountType === 'supplier' ? colors.textPrimary : colors.border }]}>
                      {accountType === 'supplier' && <View style={[styles.radioDot, { backgroundColor: colors.textPrimary }]} />}
                    </View>
                    <Text style={[styles.typeOptionText, { color: colors.textPrimary }]}>
                      Supplier (You will give)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 2. Customer Photo / Logo */}
              <View>
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Customer Photo / Logo</Text>
                <View style={styles.photoPickerRow}>
                  <TouchableOpacity
                    onPress={handlePickPhoto}
                    style={[
                      styles.avatarPickerCircle,
                      {
                        backgroundColor: colors.bgSecondary,
                        borderColor: colors.border,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    {custPhotoUri ? (
                      <Image source={{ uri: custPhotoUri }} style={styles.avatarPickerImg} />
                    ) : (
                      <Camera size={22} color={colors.textSecondary} strokeWidth={1.8} />
                    )}
                  </TouchableOpacity>
                  <View style={{ flex: 1, gap: 3 }}>
                    <TouchableOpacity
                      onPress={handlePickPhoto}
                      style={[styles.uploadImageBtn, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.uploadImageText, { color: colors.textPrimary }]}>Upload Image</Text>
                    </TouchableOpacity>
                    <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                      PNG, JPG up to 5MB (Optional)
                    </Text>
                  </View>
                </View>
              </View>

              {/* 3. Customer / Supplier Name */}
              <View>
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                  Customer / Supplier Name
                  {renderStar(custName.trim().length > 0)}
                </Text>
                <View style={[styles.fieldInputRow, { backgroundColor: colors.bgCanvas, borderColor: colors.border }]}>
                  <User size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="Enter party / business name"
                    placeholderTextColor={colors.textMuted}
                    value={custName}
                    onChangeText={setCustName}
                  />
                </View>
                <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                  Enter full trading name or individual name
                </Text>
              </View>

              {/* 4. Email Address */}
              <View>
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                  Email Address
                  {custEmail.trim().length > 0 && renderStar(custEmail.includes('@'))}
                </Text>
                <View style={[styles.fieldInputRow, { backgroundColor: colors.bgCanvas, borderColor: colors.border }]}>
                  <Mail size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="name@example.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={custEmail}
                    onChangeText={setCustEmail}
                  />
                </View>
                <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                  Optional for sending invoices and statements
                </Text>
              </View>

              {/* 5. Mobile Number */}
              <View>
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                  Mobile Number
                  {renderStar(custPhone.replace(/[^0-9]/g, '').length >= 10)}
                </Text>
                <View style={[styles.fieldInputRow, { backgroundColor: colors.bgCanvas, borderColor: colors.border }]}>
                  <Text style={[styles.countryCodeText, { color: colors.textSecondary }]}>+91</Text>
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="10-digit mobile number"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={custPhone}
                    onChangeText={setCustPhone}
                  />
                </View>
                <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                  Used for sending payment reminder SMS
                </Text>
              </View>

              {/* 6. Opening Balance & Balance Type */}
              <View>
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Opening Balance</Text>
                <View style={[styles.fieldInputRow, { backgroundColor: colors.bgCanvas, borderColor: colors.border }]}>
                  <Text style={[styles.rupeeSymbol, { color: colors.textSecondary }]}>₹</Text>
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="0.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={openingBalance}
                    onChangeText={setOpeningBalance}
                  />
                </View>
                <View style={[styles.balanceTypeCluster, { marginTop: 8 }]}>
                  <TouchableOpacity
                    onPress={() => setBalanceType('get')}
                    style={[
                      styles.balOptionPill,
                      {
                        backgroundColor: balanceType === 'get' ? colors.bgSecondary : colors.bgCanvas,
                        borderColor: balanceType === 'get' ? colors.success : colors.border,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.radioCircle, { borderColor: balanceType === 'get' ? colors.success : colors.border }]}>
                      {balanceType === 'get' && <View style={[styles.radioDot, { backgroundColor: colors.success }]} />}
                    </View>
                    <Text style={[styles.balOptionText, { color: colors.textPrimary }]}>You will get</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setBalanceType('give')}
                    style={[
                      styles.balOptionPill,
                      {
                        backgroundColor: balanceType === 'give' ? colors.bgSecondary : colors.bgCanvas,
                        borderColor: balanceType === 'give' ? colors.destructive : colors.border,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.radioCircle, { borderColor: balanceType === 'give' ? colors.destructive : colors.border }]}>
                      {balanceType === 'give' && <View style={[styles.radioDot, { backgroundColor: colors.destructive }]} />}
                    </View>
                    <Text style={[styles.balOptionText, { color: colors.textPrimary }]}>You will give</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 7. Credit Limit */}
              <View>
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Credit Limit</Text>
                <View style={[styles.fieldInputRow, { backgroundColor: colors.bgCanvas, borderColor: colors.border }]}>
                  <Text style={[styles.rupeeSymbol, { color: colors.textSecondary }]}>₹</Text>
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="50,000"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    value={creditLimit}
                    onChangeText={setCreditLimit}
                  />
                </View>
                <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                  Set maximum outstanding credit ceiling
                </Text>
              </View>

              {/* 8. GSTIN */}
              <View>
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>GSTIN (Optional)</Text>
                <View style={[styles.fieldInputRow, { backgroundColor: colors.bgCanvas, borderColor: colors.border }]}>
                  <Receipt size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="22AAAAA0000A1Z5"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                    maxLength={15}
                    value={gstin}
                    onChangeText={setGstin}
                  />
                </View>
                <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                  15-digit GST identification number
                </Text>
              </View>

              {/* 9. Aadhaar Card (with Live API Verification) */}
              <View>
                <View style={styles.labelWithBadgeRow}>
                  <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                    Aadhaar Card (Optional)
                    {aadhaar.trim().length > 0 && renderStar(aadhaarValidation.isValid)}
                  </Text>
                  {isValidatingAadhaar && <ActivityIndicator size="small" color={colors.primary} />}
                </View>
                <View
                  style={[
                    styles.fieldInputRow,
                    {
                      backgroundColor: colors.bgCanvas,
                      borderColor: aadhaarValidation.status === 'invalid' ? '#ef4444' : colors.border,
                    },
                  ]}
                >
                  <ShieldCheck size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="12-digit Aadhaar (e.g. 5489 1234 5678)"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    maxLength={14}
                    value={aadhaar}
                    onChangeText={handleAadhaarChange}
                  />
                  {aadhaarValidation.status === 'valid' && (
                    <CheckCircle2 size={18} color="#16a34a" />
                  )}
                  {aadhaarValidation.status === 'invalid' && (
                    <AlertCircle size={18} color="#ef4444" />
                  )}
                </View>
                {aadhaarValidation.message ? (
                  <Text
                    style={[
                      styles.validationHint,
                      { color: aadhaarValidation.isValid ? '#16a34a' : '#ef4444' },
                    ]}
                  >
                    {aadhaarValidation.message}
                  </Text>
                ) : (
                  <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                    UIDAI 12-digit unique identity number with Verhoeff checksum
                  </Text>
                )}
              </View>

              {/* 10. PAN Card (with Live API Verification) */}
              <View>
                <View style={styles.labelWithBadgeRow}>
                  <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>
                    PAN Card (Optional)
                    {pan.trim().length > 0 && renderStar(panValidation.isValid)}
                  </Text>
                  {isValidatingPan && <ActivityIndicator size="small" color={colors.primary} />}
                </View>
                <View
                  style={[
                    styles.fieldInputRow,
                    {
                      backgroundColor: colors.bgCanvas,
                      borderColor: panValidation.status === 'invalid' ? '#ef4444' : colors.border,
                    },
                  ]}
                >
                  <CreditCard size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="10-character PAN (e.g. ABCDE1234F)"
                    placeholderTextColor={colors.textMuted}
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
                      styles.validationHint,
                      { color: panValidation.isValid ? '#16a34a' : '#ef4444' },
                    ]}
                  >
                    {panValidation.message}
                  </Text>
                ) : (
                  <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                    10-digit Income Tax Permanent Account Number
                  </Text>
                )}
              </View>

              {/* 9. Billing Address */}
              <View style={{ gap: 8 }}>
                <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Address</Text>
                <View style={[styles.fieldInputRow, { backgroundColor: colors.bgCanvas, borderColor: colors.border }]}>
                  <Home size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="Flat / Building Number"
                    placeholderTextColor={colors.textMuted}
                    value={flatBuilding}
                    onChangeText={setFlatBuilding}
                  />
                </View>
                <View style={[styles.fieldInputRow, { backgroundColor: colors.bgCanvas, borderColor: colors.border }]}>
                  <MapPin size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="Area Location / Street"
                    placeholderTextColor={colors.textMuted}
                    value={areaStreet}
                    onChangeText={setAreaStreet}
                  />
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={[styles.fieldInputRow, { flex: 1, backgroundColor: colors.bgCanvas, borderColor: colors.border }]}>
                    <Building size={16} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.textInput, { color: colors.textPrimary }]}
                      placeholder="City"
                      placeholderTextColor={colors.textMuted}
                      value={city}
                      onChangeText={setCity}
                    />
                  </View>
                  <View style={[styles.fieldInputRow, { flex: 1, backgroundColor: colors.bgCanvas, borderColor: colors.border }]}>
                    <TextInput
                      style={[styles.textInput, { color: colors.textPrimary }]}
                      placeholder="State"
                      placeholderTextColor={colors.textMuted}
                      value={stateName}
                      onChangeText={setStateName}
                    />
                  </View>
                </View>
                <View style={[styles.fieldInputRow, { backgroundColor: colors.bgCanvas, borderColor: colors.border }]}>
                  <MapPin size={18} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, { color: colors.textPrimary }]}
                    placeholder="Pincode"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    maxLength={6}
                    value={pincode}
                    onChangeText={setPincode}
                  />
                </View>
                <Text style={[styles.helpText, { color: colors.textSecondary }]}>
                  Billing or shipping address
                </Text>
              </View>

              {/* 10. Checkboxes */}
              <TouchableOpacity
                onPress={() => setSameAsBilling(!sameAsBilling)}
                style={styles.checkboxRow}
                activeOpacity={0.7}
              >
                <View style={[styles.checkboxBox, sameAsBilling && { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary }]}>
                  {sameAsBilling && <Check size={12} color={colors.bgCanvas} strokeWidth={3} />}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>
                  Shipping address same as billing address
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSaveToPhoneContacts(!saveToPhoneContacts)}
                style={styles.checkboxRow}
                activeOpacity={0.7}
              >
                <View style={[styles.checkboxBox, saveToPhoneContacts && { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary }]}>
                  {saveToPhoneContacts && <Check size={12} color={colors.bgCanvas} strokeWidth={3} />}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.textPrimary }]}>
                  Also save to Phone Contacts automatically
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Modal Action Bar */}
            <View style={[styles.modalFooter, { borderTopColor: colors.border, backgroundColor: colors.bgSecondary }]}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalCancelBtn, { borderColor: colors.border, backgroundColor: colors.bgCard }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalCancelText, { color: colors.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveCustomer}
                style={[styles.modalSaveBtn, { backgroundColor: colors.textPrimary }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.modalSaveText, { color: colors.bgCanvas }]}>
                  Save Customer
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerContainer: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtnBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: { flex: 1 },
  headerTitle: { fontSize: 16, fontFamily: FONTS.bold },
  headerSub: { fontSize: 11, fontFamily: FONTS.regular },
  topControlsSection: { padding: 14, gap: 10, borderBottomWidth: 1 },
  roundedSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 42,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, fontFamily: FONTS.regular },
  dashedAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    gap: 8,
  },
  dashedAddText: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    letterSpacing: 0.2,
  },
  mainContainer: { flex: 1 },
  permissionCard: {
    margin: 20,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  permissionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: { fontSize: 16, fontFamily: FONTS.bold },
  permissionDesc: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 18,
  },
  allowBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 6,
    width: '100%',
    alignItems: 'center',
  },
  allowBtnText: { fontSize: 13, fontFamily: FONTS.bold },
  listHeaderRow: { paddingHorizontal: 16, paddingVertical: 10 },
  listHeaderTitle: { fontSize: 11, fontFamily: FONTS.bold, letterSpacing: 0.5 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  contactAvatarImg: { width: '100%', height: '100%' },
  contactInitials: { fontSize: 13, fontFamily: FONTS.bold },
  contactInfoCol: { flex: 1, gap: 2 },
  contactName: { fontSize: 14, fontFamily: FONTS.bold },
  contactPhone: { fontSize: 12, fontFamily: FONTS.regular },
  selectCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alphaIndexBar: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  alphaLetter: { fontSize: 10, fontFamily: FONTS.semiBold, paddingVertical: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  grabHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 16, fontFamily: FONTS.bold },
  modalSub: { fontSize: 11, fontFamily: FONTS.regular },
  closeBtn: { padding: 4 },
  fieldLabel: { fontSize: 13, fontFamily: FONTS.semiBold, marginBottom: 6 },
  labelWithBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  validationHint: {
    fontSize: 11,
    fontFamily: FONTS.medium,
    marginTop: 4,
  },
  fieldInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
    gap: 8,
  },
  textInput: { flex: 1, fontSize: 13, fontFamily: FONTS.regular },
  helpText: { fontSize: 11, fontFamily: FONTS.regular, marginTop: 4 },
  countryCodeText: { fontSize: 13, fontFamily: FONTS.bold },
  rupeeSymbol: { fontSize: 14, fontFamily: FONTS.bold },
  typeCluster: { flexDirection: 'row', gap: 10 },
  typeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  typeOptionText: { fontSize: 11.5, fontFamily: FONTS.medium, flex: 1 },
  radioCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: { width: 8, height: 8, borderRadius: 4 },
  photoPickerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarPickerCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarPickerImg: { width: '100%', height: '100%' },
  uploadImageBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  uploadImageText: { fontSize: 12, fontFamily: FONTS.medium },
  balanceTypeCluster: { flexDirection: 'row', gap: 10 },
  balOptionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  balOptionText: { fontSize: 12, fontFamily: FONTS.medium },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: { fontSize: 12, fontFamily: FONTS.medium },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 13, fontFamily: FONTS.semiBold },
  modalSaveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalSaveText: { fontSize: 14, fontFamily: FONTS.bold },
});

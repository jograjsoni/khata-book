import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import {
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Camera,
  Image as ImageIcon,
  Trash2,
  Paperclip,
  Check,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME, getThemeColors, FONTS } from '../../theme/theme';
import { useKhataStore, Party } from '../../store/useKhataStore';
import { sileo } from '../common/SileoNotification';
import { ScalePressable } from '../common/ScalePressable';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  party: Party | null;
  initialType?: 'gave' | 'got';
}

type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
type BankTransferType = 'IMPS' | 'NEFT' | 'RTGS' | 'Net Banking';

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  onClose,
  party,
  initialType = 'got',
}) => {
  const insets = useSafeAreaInsets();
  const { addLedgerEntry, isDarkMode } = useKhataStore();
  const colors = getThemeColors(isDarkMode);

  // Type is locked to the action the user tapped (You gave / You got)
  const [txType, setTxType] = useState<'gave' | 'got'>(initialType);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [mode, setMode] = useState<PaymentMode>('UPI');
  const [utrNumber, setUtrNumber] = useState('');
  const [bankType, setBankType] = useState<BankTransferType>('IMPS');
  const [bankDetails, setBankDetails] = useState('');
  const [chequeDetails, setChequeDetails] = useState('');
  const [billPhoto, setBillPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setTxType(initialType);
      setAmount('');
      setNote('');
      setUtrNumber('');
      setBankDetails('');
      setChequeDetails('');
      setBillPhoto(null);
    }
  }, [visible, initialType]);

  const handlePickImage = async () => {
    Alert.alert(
      'Attach Bill / Photo',
      'Choose attachment source:',
      [
        {
          text: 'Camera',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              sileo.warning('Camera Permission', 'Please allow camera access to take photo.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled && result.assets?.[0]?.uri) {
              setBillPhoto(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Photo Gallery',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled && result.assets?.[0]?.uri) {
              setBillPhoto(result.assets[0].uri);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSave = async () => {
    const num = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (!num || isNaN(num) || num <= 0) {
      sileo.warning('Invalid Amount', 'Please enter a positive numeric amount.');
      return;
    }

    if (!party) {
      sileo.error('Selection Error', 'No party was selected.');
      return;
    }

    // Construct metadata note string
    let fullNote = note.trim();
    if (mode === 'UPI' && utrNumber.trim()) {
      fullNote = fullNote ? `${fullNote} (UTR: ${utrNumber.trim()})` : `UPI Ref: ${utrNumber.trim()}`;
    } else if (mode === 'Bank Transfer' && bankDetails.trim()) {
      fullNote = fullNote
        ? `${fullNote} (${bankType}: ${bankDetails.trim()})`
        : `${bankType}: ${bankDetails.trim()}`;
    } else if (mode === 'Cheque' && chequeDetails.trim()) {
      fullNote = fullNote
        ? `${fullNote} (Cheque: ${chequeDetails.trim()})`
        : `Cheque No: ${chequeDetails.trim()}`;
    }

    if (!fullNote) {
      fullNote = txType === 'got' ? 'Payment Received' : 'Udhar / Credit Given';
    }

    setSubmitting(true);
    try {
      await addLedgerEntry({
        partyId: party.id,
        amount: num,
        type: txType,
        date: new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
        note: fullNote,
        mode: mode === 'UPI' ? 'UPI Transfer' : mode,
        verified: true,
        billPhoto: billPhoto || undefined,
        utr: utrNumber.trim() || undefined,
        bankDetails: mode === 'Bank Transfer' ? `${bankType} - ${bankDetails.trim()}` : undefined,
      });

      const formattedAmt = `₹${num.toLocaleString('en-IN')}`;
      sileo.success(
        txType === 'got' ? 'Payment Received' : 'Credit Given',
        `${formattedAmt} recorded for ${party.name}`
      );

      onClose();
    } catch (err: any) {
      sileo.error('Transaction Failed', err?.message || 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const bg = colors.bgCard;
  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const textMuted = colors.textMuted;
  const border = colors.border;
  const isGave = txType === 'gave';
  const typeColor = isGave ? colors.destructive : colors.success;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable
            style={[
              styles.content,
              {
                backgroundColor: bg,
                borderColor: border,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: border }]}>
              <View>
                <Text style={[styles.title, { color: textPrimary }]}>
                  {isGave ? 'You Gave (Debit - Out)' : 'You Got (Credit - In)'}
                </Text>
                {party ? (
                  <Text style={[styles.subtitle, { color: textMuted }]}>{party.name}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeButton, { backgroundColor: colors.bgSecondary }]}
              >
                <X size={18} color={textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {/* Locked Type Banner: User CANNOT accidentally toggle to the wrong type */}
              <View
                style={[
                  styles.lockedTypeBanner,
                  {
                    backgroundColor: isGave ? 'rgba(239, 68, 68, 0.10)' : 'rgba(16, 185, 129, 0.10)',
                    borderColor: isGave ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)',
                  },
                ]}
              >
                {isGave ? (
                  <ArrowUpRight size={16} color={colors.destructive} strokeWidth={2.2} />
                ) : (
                  <ArrowDownLeft size={16} color={colors.success} strokeWidth={2.2} />
                )}
                <Text
                  style={[
                    styles.lockedTypeText,
                    { color: isGave ? colors.destructive : colors.success },
                  ]}
                >
                  {isGave
                    ? 'Recording Money Given to Customer (You Gave)'
                    : 'Recording Payment Received from Customer (You Got)'}
                </Text>
              </View>

              {/* Amount input */}
              <View style={styles.amountContainer}>
                <Text style={[styles.currencySymbol, { color: typeColor }]}>₹</Text>
                <TextInput
                  style={[styles.amountInput, { color: textPrimary }]}
                  placeholder="0"
                  placeholderTextColor={textMuted}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                  autoFocus
                />
              </View>

              {/* Payment Mode Selector */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>Payment Mode</Text>
                <View style={styles.modeRow}>
                  {(['UPI', 'Cash', 'Bank Transfer', 'Cheque'] as PaymentMode[]).map((m) => {
                    const active = mode === m;
                    return (
                      <ScalePressable
                        key={m}
                        onPress={() => setMode(m)}
                        style={[
                          styles.modeChip,
                          active
                            ? { backgroundColor: colors.primary, borderColor: colors.primary }
                            : { backgroundColor: colors.bgSecondary, borderColor: border },
                        ]}
                      >
                        <Text
                          style={[
                            styles.modeText,
                            {
                              color: active ? colors.primaryForeground : textPrimary,
                              fontFamily: active ? FONTS.bold : FONTS.medium,
                            },
                          ]}
                        >
                          {m}
                        </Text>
                      </ScalePressable>
                    );
                  })}
                </View>
              </View>

              {/* Conditional Field: UPI UTR Number */}
              {mode === 'UPI' && (
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: textSecondary }]}>
                    UPI Reference / UTR Number
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.bgSecondary,
                        color: textPrimary,
                        borderColor: border,
                      },
                    ]}
                    placeholder="Enter 12-digit UPI UTR / Ref No. (Optional)"
                    placeholderTextColor={textMuted}
                    value={utrNumber}
                    onChangeText={setUtrNumber}
                    keyboardType="numeric"
                    maxLength={16}
                  />
                </View>
              )}

              {/* Conditional Field: Bank Transfer Sub-modes & Reference */}
              {mode === 'Bank Transfer' && (
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: textSecondary }]}>Transfer Type</Text>
                  <View style={[styles.modeRow, { marginBottom: 10 }]}>
                    {(['IMPS', 'NEFT', 'RTGS', 'Net Banking'] as BankTransferType[]).map((bt) => {
                      const active = bankType === bt;
                      return (
                        <TouchableOpacity
                          key={bt}
                          onPress={() => setBankType(bt)}
                          style={[
                            styles.subModeChip,
                            active
                              ? { backgroundColor: colors.primary, borderColor: colors.primary }
                              : { backgroundColor: colors.bgSecondary, borderColor: border },
                          ]}
                        >
                          <Text
                            style={[
                              styles.subModeText,
                              { color: active ? colors.primaryForeground : textPrimary },
                            ]}
                          >
                            {bt}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[styles.fieldLabel, { color: textSecondary }]}>
                    Bank Details / Ref ID
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.bgSecondary,
                        color: textPrimary,
                        borderColor: border,
                      },
                    ]}
                    placeholder="e.g. HDFC Bank, Txn Ref / A/C No."
                    placeholderTextColor={textMuted}
                    value={bankDetails}
                    onChangeText={setBankDetails}
                  />
                </View>
              )}

              {/* Conditional Field: Cheque Number */}
              {mode === 'Cheque' && (
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: textSecondary }]}>Cheque Details</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: colors.bgSecondary,
                        color: textPrimary,
                        borderColor: border,
                      },
                    ]}
                    placeholder="Enter Cheque No. & Bank Name"
                    placeholderTextColor={textMuted}
                    value={chequeDetails}
                    onChangeText={setChequeDetails}
                  />
                </View>
              )}

              {/* Note input */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>Note / Description</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.bgSecondary,
                      color: textPrimary,
                      borderColor: border,
                    },
                  ]}
                  placeholder={
                    isGave ? 'e.g. Grocery items, goods credit' : 'e.g. Weekly settlement, cash payment'
                  }
                  placeholderTextColor={textMuted}
                  value={note}
                  onChangeText={setNote}
                />
              </View>

              {/* Attach Bill / Photo Section */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: textSecondary }]}>Bill / Receipt Photo</Text>
                {billPhoto ? (
                  <View style={[styles.photoPreviewCard, { borderColor: border }]}>
                    <Image source={{ uri: billPhoto }} style={styles.photoPreview} />
                    <View style={styles.photoInfo}>
                      <Text style={[styles.photoAttachedText, { color: colors.success }]}>
                        ✓ Photo attached
                      </Text>
                      <TouchableOpacity
                        onPress={() => setBillPhoto(null)}
                        style={[styles.removePhotoBtn, { backgroundColor: colors.destructiveBg }]}
                      >
                        <Trash2 size={14} color={colors.destructive} />
                        <Text style={[styles.removePhotoText, { color: colors.destructive }]}>
                          Remove
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handlePickImage}
                    style={[
                      styles.attachBtn,
                      {
                        backgroundColor: colors.bgSecondary,
                        borderColor: border,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Camera size={18} color={textSecondary} />
                    <Text style={[styles.attachBtnText, { color: textPrimary }]}>
                      Attach Bill / Photo
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Save Button */}
              <ScalePressable
                onPress={handleSave}
                disabled={submitting}
                style={[
                  styles.saveButton,
                  { backgroundColor: typeColor },
                  submitting && { opacity: 0.6 },
                ]}
              >
                <Text style={styles.saveButtonText}>
                  {submitting ? 'Saving Entry...' : `Save ₹ ${amount || '0'} Entry`}
                </Text>
              </ScalePressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 16.5,
  },
  subtitle: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  lockedTypeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  lockedTypeText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    flex: 1,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  currencySymbol: {
    fontFamily: FONTS.bold,
    fontSize: 32,
    marginRight: 6,
  },
  amountInput: {
    fontFamily: FONTS.bold,
    fontSize: 38,
    minWidth: 100,
    textAlign: 'center',
  },
  fieldGroup: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  fieldLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    marginBottom: 6,
  },
  textInput: {
    fontFamily: FONTS.regular,
    fontSize: 13.5,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  modeText: {
    fontSize: 11.5,
  },
  subModeChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  subModeText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
  },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  attachBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12.5,
  },
  photoPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  photoPreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  photoInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  photoAttachedText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
  },
  removePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  removePhotoText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
  },
  saveButton: {
    marginHorizontal: 20,
    marginTop: 6,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 14.5,
    letterSpacing: 0.3,
  },
});

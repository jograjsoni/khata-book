import React, { useState } from 'react';
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
} from 'react-native';
import { X, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
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

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  onClose,
  party,
  initialType = 'got',
}) => {
  const { addLedgerEntry, isDarkMode } = useKhataStore();
  const colors = getThemeColors(isDarkMode);

  const [txType, setTxType] = useState<'gave' | 'got'>(initialType);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [mode, setMode] = useState<'Cash' | 'UPI Transfer' | 'Bank Transfer'>('UPI Transfer');
  const [submitting, setSubmitting] = useState(false);

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
        note: note.trim() || (txType === 'got' ? 'Payment Received' : 'Udhar / Credit Given'),
        mode,
        verified: true,
      });

      const formattedAmt = `₹${num.toLocaleString('en-IN')}`;
      sileo.success(
        txType === 'got' ? 'Payment Received' : 'Credit Given',
        `${formattedAmt} recorded for ${party.name}`
      );

      setAmount('');
      setNote('');
      onClose();
    } catch (err: any) {
      sileo.error('Transaction Failed', err?.message || 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const bg = colors.bgCard;
  const textPrimary = colors.textPrimary;
  const textMuted = colors.textMuted;
  const border = colors.border;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable
            style={[styles.content, { backgroundColor: bg, borderColor: border }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: border }]}>
              <View>
                <Text style={[styles.title, { color: textPrimary }]}>
                  {txType === 'got' ? 'Record Payment In (+)' : 'Record Udhar Given (-)'}
                </Text>
                {party ? (
                  <Text style={[styles.subtitle, { color: textMuted }]}>{party.name}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.closeButton,
                  { backgroundColor: colors.bgSecondary },
                ]}
              >
                <X size={18} color={textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Type Switcher */}
            <View style={styles.switchRow}>
              <ScalePressable
                onPress={() => setTxType('got')}
                style={[
                  styles.switchBtn,
                  txType === 'got'
                    ? { backgroundColor: colors.success }
                    : { backgroundColor: colors.bgSecondary },
                ]}
              >
                <ArrowDownLeft
                  size={16}
                  color={txType === 'got' ? '#FFFFFF' : colors.success}
                />
                <Text
                  style={[
                    styles.switchText,
                    { color: txType === 'got' ? '#FFFFFF' : textPrimary },
                  ]}
                >
                  You Got (In)
                </Text>
              </ScalePressable>

              <ScalePressable
                onPress={() => setTxType('gave')}
                style={[
                  styles.switchBtn,
                  txType === 'gave'
                    ? { backgroundColor: colors.destructive }
                    : { backgroundColor: colors.bgSecondary },
                ]}
              >
                <ArrowUpRight
                  size={16}
                  color={txType === 'gave' ? '#FFFFFF' : colors.destructive}
                />
                <Text
                  style={[
                    styles.switchText,
                    { color: txType === 'gave' ? '#FFFFFF' : textPrimary },
                  ]}
                >
                  You Gave (Out)
                </Text>
              </ScalePressable>
            </View>

            {/* Amount input */}
            <View style={styles.amountContainer}>
              <Text
                style={[
                  styles.currencySymbol,
                  { color: txType === 'got' ? colors.success : colors.destructive },
                ]}
              >
                ₹
              </Text>
              <TextInput
                style={[
                  styles.amountInput,
                  {
                    color: txType === 'got' ? colors.success : colors.destructive,
                  },
                ]}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </View>

            {/* Note input */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: textMuted }]}>
                Add Note / Bill Number (Optional)
              </Text>
              <TextInput
                style={[
                  styles.noteInput,
                  {
                    backgroundColor: colors.bgInput,
                    borderColor: border,
                    color: textPrimary,
                  },
                ]}
                placeholder="e.g. Invoice #1042 or Goods delivered"
                placeholderTextColor={textMuted}
                value={note}
                onChangeText={setNote}
              />
            </View>

            {/* Payment Mode */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: textMuted }]}>Payment Method</Text>
              <View style={styles.modeRow}>
                {(['UPI Transfer', 'Cash', 'Bank Transfer'] as const).map((m) => {
                  const isSelected = mode === m;
                  return (
                    <ScalePressable
                      key={m}
                      onPress={() => setMode(m)}
                      style={[
                        styles.modeChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.bgSecondary,
                          borderColor: isSelected
                            ? colors.primary
                            : border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.modeText,
                          {
                            color: isSelected ? colors.primaryForeground : textPrimary,
                            fontWeight: isSelected ? '700' : '500',
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

            {/* Save Button */}
            <ScalePressable
              onPress={handleSave}
              disabled={submitting}
              style={[
                styles.saveButton,
                {
                  backgroundColor:
                    txType === 'got' ? colors.success : colors.destructive,
                  opacity: submitting ? 0.7 : 1,
                  ...THEME.shadows.md,
                },
              ]}
            >
              <Text style={styles.saveButtonText}>
                {submitting ? 'RECORDING...' : 'SAVE TRANSACTION'}
              </Text>
            </ScalePressable>
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
    paddingBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 17,
  },
  subtitle: {
    fontFamily: FONTS.medium,
    fontSize: 12.5,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  switchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  switchText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  currencySymbol: {
    fontFamily: FONTS.bold,
    fontSize: 34,
    marginRight: 6,
  },
  amountInput: {
    fontFamily: FONTS.bold,
    fontSize: 40,
    minWidth: 100,
    textAlign: 'center',
  },
  fieldGroup: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12.5,
    marginBottom: 6,
  },
  noteInput: {
    fontFamily: FONTS.regular,
    fontSize: 14,
    borderRadius: 14,
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
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  modeText: {
    fontFamily: FONTS.medium,
    fontSize: 12.5,
  },
  saveButton: {
    marginHorizontal: 20,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontFamily: FONTS.bold,
    fontSize: 15,
    letterSpacing: 0.5,
  },
});

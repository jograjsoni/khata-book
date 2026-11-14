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
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Camera,
  FileText,
  Delete,
  Check,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { getThemeColors, FONTS } from '../theme/theme';
import { useKhataStore } from '../store/useKhataStore';
import permissionService from '../services/permissionService';

export default function EditTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    type?: string;
    name?: string;
    amount?: string;
    note?: string;
    partyId?: string;
  }>();

  const { isDarkMode, addLedgerEntry, parties } = useKhataStore();
  const colors = getThemeColors(isDarkMode);

  const isGave = params.type === 'gave';
  const matchedParty = parties.find(
    (p) => p.id === params.partyId || (params.name && p.name.toLowerCase() === params.name.toLowerCase())
  );
  const partyName = params.name || (matchedParty ? matchedParty.name : 'Account');

  const [amountExpr, setAmountExpr] = useState(params.amount || '0');
  const [note, setNote] = useState(params.note || '');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [dateStr, setDateStr] = useState(
    new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  );

  const themeColor = isGave ? colors.destructive : colors.success;

  const handleKeyPress = (val: string) => {
    if (val === 'C') {
      setAmountExpr('0');
      return;
    }
    if (val === '=') {
      try {
        const sanitized = amountExpr.replace(/×/g, '*').replace(/÷/g, '/');
        const evaluated = Function(`"use strict"; return (${sanitized})`)();
        setAmountExpr(String(Math.round(evaluated)));
      } catch {
        // Keep as is on error
      }
      return;
    }
    if (val === 'M+' || val === 'M-') {
      return;
    }

    if (amountExpr === '0' && !isNaN(Number(val))) {
      setAmountExpr(val);
    } else {
      setAmountExpr((prev) => prev + val);
    }
  };

  const handleBackspace = () => {
    if (amountExpr.length > 1) {
      setAmountExpr((prev) => prev.slice(0, -1));
    } else {
      setAmountExpr('0');
    }
  };

  const handleAddPhoto = () => {
    if (attachments.length >= 4) {
      Alert.alert('Limit Reached', 'You can attach up to 4 bills/photos only.');
      return;
    }

    Alert.alert(
      'Attach Bill or Receipt',
      'Choose how you want to add this bill document:',
      [
        {
          text: 'Take Photo (Camera)',
          onPress: async () => {
            const granted = await permissionService.requestCameraPermission();
            if (!granted) {
              Alert.alert('Camera Permission Required', 'Please allow camera access to take bill photos.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ['images', 'videos'],
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled && result.assets?.[0]?.uri) {
              setAttachments((prev) => [...prev, result.assets[0].uri]);
            }
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled && result.assets?.[0]?.uri) {
              setAttachments((prev) => [...prev, result.assets[0].uri]);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleAddPdf = () => {
    if (attachments.length >= 4) {
      Alert.alert('Limit Reached', 'You can attach up to 4 bills only.');
      return;
    }
    // Simulate PDF bill attachment
    setAttachments((prev) => [...prev, `bill_document_${Date.now()}.pdf`]);
    Alert.alert('Bill Attached', 'PDF document added successfully.');
  };

  const handleSave = () => {
    let numericAmount = 0;
    try {
      const sanitized = amountExpr.replace(/×/g, '*').replace(/÷/g, '/');
      numericAmount = Number(Function(`"use strict"; return (${sanitized})`)());
    } catch {
      numericAmount = parseFloat(amountExpr) || 0;
    }

    if (!numericAmount || numericAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    if (matchedParty) {
      addLedgerEntry({
        partyId: matchedParty.id,
        type: isGave ? 'gave' : 'got',
        amount: Math.round(numericAmount),
        note: note.trim() || (isGave ? 'Goods sold on credit' : 'Payment received'),
        date: dateStr,
        mode: 'UPI Transfer',
        verified: true,
      });
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}

    Alert.alert('Saved', `Entry for ₹ ${Math.round(numericAmount).toLocaleString('en-IN')} recorded successfully!`, [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgCanvas }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.bgSecondary }]}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {isGave ? `You Gave to ${partyName}` : `You Got from ${partyName}`}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Add Khata Transaction
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Amount Box */}
        <View style={[styles.amountBox, { borderColor: themeColor, backgroundColor: colors.bgCard }]}>
          <Text style={[styles.currencySymbol, { color: themeColor }]}>₹</Text>
          <Text style={[styles.amountDisplay, { color: themeColor }]} numberOfLines={1}>
            {amountExpr}
          </Text>
          <TouchableOpacity onPress={handleBackspace} style={styles.backspaceBtn} activeOpacity={0.7}>
            <Delete size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Date Selector & Mode */}
        <View style={styles.metaRow}>
          <View style={[styles.metaField, { backgroundColor: colors.bgSecondary }]}>
            <Calendar size={16} color={colors.textSecondary} />
            <Text style={[styles.metaFieldText, { color: colors.textPrimary }]}>{dateStr}</Text>
          </View>
          <View style={[styles.metaField, { backgroundColor: colors.bgSecondary }]}>
            <Text style={[styles.metaFieldText, { color: colors.textPrimary }]}>UPI / Cash</Text>
          </View>
        </View>

        {/* Note Input */}
        <View style={[styles.noteContainer, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <TextInput
            placeholder="Add note (Items name, Bill #, etc.)..."
            placeholderTextColor={colors.textSecondary}
            value={note}
            onChangeText={setNote}
            style={[styles.noteInput, { color: colors.textPrimary }]}
          />
        </View>

        {/* Attach Bill Section (Max 4) */}
        <View style={[styles.attachSection, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={styles.attachHeader}>
            <Text style={[styles.attachTitle, { color: colors.textPrimary }]}>Attach Bill (Max 4)</Text>
            <Text style={[styles.attachCount, { color: colors.textSecondary }]}>
              {attachments.length} / 4 Attached
            </Text>
          </View>
          <View style={styles.attachButtonsRow}>
            <TouchableOpacity
              onPress={handleAddPhoto}
              style={[styles.attachBtn, { backgroundColor: colors.bgSecondary }]}
              activeOpacity={0.7}
            >
              <Camera size={16} color={colors.textPrimary} />
              <Text style={[styles.attachBtnText, { color: colors.textPrimary }]}>Add Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAddPdf}
              style={[styles.attachBtn, { backgroundColor: colors.bgSecondary }]}
              activeOpacity={0.7}
            >
              <FileText size={16} color={colors.textPrimary} />
              <Text style={[styles.attachBtnText, { color: colors.textPrimary }]}>Add PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calculator Keypad */}
        <View style={styles.keypadGrid}>
          {/* Row 1: C, M+, M-, ÷ */}
          <View style={styles.keypadRow}>
            <TouchableOpacity onPress={() => handleKeyPress('C')} style={[styles.keyBtn, styles.opKey, { backgroundColor: colors.bgSecondary }]}>
              <Text style={[styles.keyText, { color: themeColor }]}>C</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleKeyPress('M+')} style={[styles.keyBtn, styles.opKey, { backgroundColor: colors.bgSecondary }]}>
              <Text style={[styles.keyText, { color: colors.textSecondary }]}>M+</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleKeyPress('M-')} style={[styles.keyBtn, styles.opKey, { backgroundColor: colors.bgSecondary }]}>
              <Text style={[styles.keyText, { color: colors.textSecondary }]}>M-</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleKeyPress('÷')} style={[styles.keyBtn, styles.opKey, { backgroundColor: colors.bgSecondary }]}>
              <Text style={[styles.keyText, { color: colors.textPrimary }]}>÷</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2: 7, 8, 9, × */}
          <View style={styles.keypadRow}>
            <TouchableOpacity onPress={() => handleKeyPress('7')} style={[styles.keyBtn, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.keyText, { color: colors.textPrimary }]}>7</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleKeyPress('8')} style={[styles.keyBtn, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.keyText, { color: colors.textPrimary }]}>8</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleKeyPress('9')} style={[styles.keyBtn, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.keyText, { color: colors.textPrimary }]}>9</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleKeyPress('×')} style={[styles.keyBtn, styles.opKey, { backgroundColor: colors.bgSecondary }]}>
              <Text style={[styles.keyText, { color: colors.textPrimary }]}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Row 3: 4, 5, 6, - */}
          <View style={styles.keypadRow}>
            <TouchableOpacity onPress={() => handleKeyPress('4')} style={[styles.keyBtn, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.keyText, { color: colors.textPrimary }]}>4</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleKeyPress('5')} style={[styles.keyBtn, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.keyText, { color: colors.textPrimary }]}>5</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleKeyPress('6')} style={[styles.keyBtn, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.keyText, { color: colors.textPrimary }]}>6</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleKeyPress('-')} style={[styles.keyBtn, styles.opKey, { backgroundColor: colors.bgSecondary }]}>
              <Text style={[styles.keyText, { color: colors.textPrimary }]}>-</Text>
            </TouchableOpacity>
          </View>

          {/* Row 4: 1, 2, 3, + */}
          <View style={styles.keypadRow}>
            <TouchableOpacity onPress={() => handleKeyPress('1')} style={[styles.keyBtn, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.keyText, { color: colors.textPrimary }]}>1</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleKeyPress('2')} style={[styles.keyBtn, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.keyText, { color: colors.textPrimary }]}>2</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleKeyPress('3')} style={[styles.keyBtn, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.keyText, { color: colors.textPrimary }]}>3</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleKeyPress('+')} style={[styles.keyBtn, styles.opKey, { backgroundColor: colors.bgSecondary }]}>
              <Text style={[styles.keyText, { color: colors.textPrimary }]}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Row 5: 0, ., %, = */}
          <View style={styles.keypadRow}>
            <TouchableOpacity onPress={() => handleKeyPress('0')} style={[styles.keyBtn, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.keyText, { color: colors.textPrimary }]}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleKeyPress('.')} style={[styles.keyBtn, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.keyText, { color: colors.textPrimary }]}>.</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleKeyPress('%')} style={[styles.keyBtn, { backgroundColor: colors.bgCard }]}>
              <Text style={[styles.keyText, { color: colors.textPrimary }]}>%</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleKeyPress('=')} style={[styles.keyBtn, { backgroundColor: themeColor }]}>
              <Text style={[styles.keyText, { color: '#FFFFFF', fontWeight: 'bold' }]}>=</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Fixed Bottom Save Button */}
      <View style={[styles.bottomBar, { backgroundColor: colors.bgCanvas, borderTopColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveBtn, { backgroundColor: themeColor }]}
          activeOpacity={0.85}
        >
          <Check size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.saveBtnText}>SAVE ENTRY</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  currencySymbol: {
    fontSize: 28,
    fontFamily: FONTS.bold,
  },
  amountDisplay: {
    flex: 1,
    fontSize: 32,
    fontFamily: FONTS.bold,
  },
  backspaceBtn: {
    padding: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  metaField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  metaFieldText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  noteContainer: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  noteInput: {
    height: 42,
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  attachSection: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  attachHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  attachTitle: {
    fontSize: 12,
    fontFamily: FONTS.bold,
  },
  attachCount: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  attachButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  attachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 14,
  },
  attachBtnText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  keypadGrid: {
    marginTop: 16,
    gap: 8,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 8,
  },
  keyBtn: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opKey: {},
  keyText: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  saveBtn: {
    height: 50,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
});

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Minus,
  Search,
  X,
  BookOpen,
} from 'lucide-react-native';
import { THEME, getThemeColors, FONTS } from '../theme/theme';
import { useKhataStore, CashbookEntry } from '../store/useKhataStore';
import { Header } from '../components/common/Header';
import { sileo } from '../components/common/SileoNotification';
import { ScalePressable } from '../components/common/ScalePressable';

export default function CashbookScreen() {
  const router = useRouter();
  const { cashbookEntries, addCashbookEntry, business, fetchCashbook, isDarkMode } = useKhataStore();
  const colors = getThemeColors(isDarkMode);

  useEffect(() => {
    fetchCashbook();
  }, [fetchCashbook]);

  const [activeFilter, setActiveFilter] = useState<'all' | 'in' | 'out'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick entry modal
  const [modalVisible, setModalVisible] = useState(false);
  const [entryType, setEntryType] = useState<'in' | 'out'>('in');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [mode, setMode] = useState<'UPI Transfer' | 'Cash' | 'Bank Transfer'>('Cash');

  // Filter entries
  const filteredEntries = useMemo(() => {
    let list = cashbookEntries;
    if (activeFilter === 'in') list = list.filter((e) => e.type === 'in');
    else if (activeFilter === 'out') list = list.filter((e) => e.type === 'out');

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.subtitle.toLowerCase().includes(q) ||
          e.mode.toLowerCase().includes(q)
      );
    }
    return list;
  }, [cashbookEntries, activeFilter, searchQuery]);

  // Aggregate stats
  const totalCashIn = cashbookEntries
    .filter((e) => e.type === 'in')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalCashOut = cashbookEntries
    .filter((e) => e.type === 'out')
    .reduce((sum, e) => sum + e.amount, 0);

  const netInHand = totalCashIn - totalCashOut;

  const handleSaveEntry = async () => {
    const val = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (!val || isNaN(val) || val <= 0) {
      sileo.warning('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    if (!title.trim()) {
      sileo.warning('Party or Note Required', 'Please enter who paid or what this entry is for.');
      return;
    }

    await addCashbookEntry({
      title: title.trim(),
      subtitle: subtitle.trim() || (entryType === 'in' ? 'Cash Received' : 'Expense / Payment Paid'),
      amount: val,
      type: entryType,
      date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      time: 'Just now',
      mode,
      status: 'Verified',
    });

    sileo.success(
      entryType === 'in' ? 'Cash In Recorded' : 'Cash Out Recorded',
      `₹${val.toLocaleString('en-IN')} saved successfully.`
    );

    setModalVisible(false);
    setAmount('');
    setTitle('');
    setSubtitle('');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgCanvas }]} edges={['top']}>
      <Header
        title="Cashbook"
        subtitle="Daily Cash-In & Cash-Out Ledger"
        showBack
      />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Filter Chips: All Transactions, Cash In, Cash Out */}
        <View style={styles.filterChipsRow}>
          {[
            { id: 'all', label: 'All Transactions' },
            { id: 'in', label: 'Cash In' },
            { id: 'out', label: 'Cash Out' },
          ].map((f) => {
            const isSelected = activeFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setActiveFilter(f.id as any)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.bgCard,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected ? colors.primaryForeground : colors.textPrimary,
                      fontWeight: isSelected ? '600' : '500',
                    },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Stat Row - Centered without icon badge for balanced left-right alignment */}
        <View style={styles.statRow}>
          <View style={[styles.statBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>Total Cash In</Text>
            <Text style={[styles.statBoxAmount, { color: '#16a34a' }]}>
              ₹ {totalCashIn.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[styles.statBoxLabel, { color: colors.textSecondary }]}>Total Cash Out</Text>
            <Text style={[styles.statBoxAmount, { color: '#dc2626' }]}>
              ₹ {totalCashOut.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Net in Hand Banner */}
        <View style={[styles.netInHandBar, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
          <Text style={[styles.netInHandLabel, { color: colors.textSecondary }]}>
            Net Cash Balance in Hand:
          </Text>
          <Text style={[styles.netInHandValue, { color: colors.textPrimary }]}>
            ₹ {netInHand.toLocaleString('en-IN')}
          </Text>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <Search size={15} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder="Search entries by party or reason..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Entries List */}
        <View style={styles.listContainer}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Cash Transactions ({filteredEntries.length})
          </Text>

          {filteredEntries.length === 0 ? (
            <View style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 14, fontFamily: FONTS.semiBold, color: colors.textPrimary, marginBottom: 4 }}>
                No cash transactions recorded yet
              </Text>
              <Text style={{ fontSize: 12, fontFamily: FONTS.regular, color: colors.textSecondary, textAlign: 'center' }}>
                Use the + Cash In and - Cash Out buttons below to record daily cash flow.
              </Text>
            </View>
          ) : (
            filteredEntries.map((entry) => {
              const isIn = entry.type === 'in';
              return (
                <View
                  key={entry.id}
                  style={[styles.entryCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                >
                  <View style={styles.entryLeft}>
                    <View
                      style={[
                        styles.entryIconBadge,
                        {
                          backgroundColor: isIn
                            ? colors.successBg
                            : colors.destructiveBg,
                        },
                      ]}
                    >
                      {isIn ? (
                        <ArrowDownLeft size={16} color={colors.success} />
                      ) : (
                        <ArrowUpRight size={16} color={colors.destructive} />
                      )}
                    </View>
                    <View style={styles.entryTexts}>
                      <Text style={[styles.entryTitle, { color: colors.textPrimary }]}>
                        {entry.title}
                      </Text>
                      <Text style={[styles.entrySub, { color: colors.textSecondary }]}>
                        {entry.subtitle}
                      </Text>
                      <Text style={[styles.entryMeta, { color: colors.textMuted }]}>
                        {entry.date} · {entry.mode} · {entry.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.entryRight}>
                    <Text
                      style={[
                        styles.entryAmount,
                        { color: isIn ? colors.success : colors.destructive },
                      ]}
                    >
                      {isIn ? '+' : '-'} ₹ {entry.amount.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Activity Audit Timeline derived dynamically */}
        <View style={styles.timelineSection}>
          <Text style={[styles.timelineTitle, { color: colors.textPrimary }]}>
            Activity Audit Timeline
          </Text>

          {cashbookEntries.length === 0 ? (
            <View style={{ paddingVertical: 16 }}>
              <Text style={{ fontSize: 12, fontFamily: FONTS.regular, color: colors.textSecondary }}>
                No audit activity recorded yet. Entries will be tracked here.
              </Text>
            </View>
          ) : (
            cashbookEntries.slice(0, 8).map((entry, idx, arr) => {
              const isLast = idx === arr.length - 1;
              const isIn = entry.type === 'in';
              const serialNo = `#0${idx + 1}`;
              const actor = business.ownerName || 'Merchant';
              const action = isIn ? 'recorded cash-in' : 'recorded cash-out';
              const target = `₹ ${entry.amount.toLocaleString('en-IN')} · ${entry.title}`;
              const time = entry.time || entry.date || 'Just now';
              const statusTag = `● ${entry.mode} • ${entry.status}`;

              return (
                <View key={entry.id} style={styles.timelineRow}>
                  {/* Left column: Serial Number badge + connecting vertical line */}
                  <View style={styles.timelineTrackCol}>
                    <View
                      style={[
                        styles.serialBadge,
                        {
                          backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.serialText,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {serialNo}
                      </Text>
                    </View>
                    {!isLast && (
                      <View
                        style={[
                          styles.trackLine,
                          {
                            backgroundColor: isDarkMode ? '#3f3f46' : '#e2e8f0',
                          },
                        ]}
                      />
                    )}
                  </View>

                  {/* Right column: Content, Time & Status */}
                  <View style={[styles.timelineBody, { paddingBottom: isLast ? 8 : 20 }]}>
                    <View style={styles.timelineHeaderRow}>
                      <Text style={[styles.timelineActorText, { color: colors.textPrimary }]}>
                        {actor}{' '}
                        <Text style={{ color: colors.textSecondary, fontWeight: '400' }}>
                          {action}
                        </Text>
                      </Text>
                      <Text style={[styles.timelineTimeText, { color: colors.textMuted }]}>
                        {time}
                      </Text>
                    </View>

                    <Text style={[styles.timelineTargetText, { color: colors.textPrimary }]}>
                      {target}
                    </Text>

                    <Text
                      style={[
                        styles.timelineStatusTag,
                        {
                          color: isIn ? '#16a34a' : '#dc2626',
                        },
                      ]}
                    >
                      {statusTag}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Sticky Action Buttons: "+ CASH IN" & "- CASH OUT" */}
      <View
        style={[
          styles.bottomActionBar,
          {
            backgroundColor: colors.bgCard,
            borderTopColor: colors.border,
          },
        ]}
      >
        <ScalePressable
          onPress={() => {
            setEntryType('in');
            setModalVisible(true);
          }}
          style={[styles.cashInBtn, { backgroundColor: colors.success }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.actionBtnText}>CASH IN</Text>
          </View>
        </ScalePressable>

        <ScalePressable
          onPress={() => {
            setEntryType('out');
            setModalVisible(true);
          }}
          style={[styles.cashOutBtn, { backgroundColor: colors.destructive }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Minus size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.actionBtnText}>CASH OUT</Text>
          </View>
        </ScalePressable>
      </View>

      {/* Modal for adding Cash In / Out */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bgCard }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {entryType === 'in' ? 'Record Cash In' : 'Record Cash Out'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.closeBtn, { backgroundColor: colors.bgSecondary }]}
              >
                <X size={16} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Amount (₹) *</Text>
              <TextInput
                style={[
                  styles.modalAmountInput,
                  { color: entryType === 'in' ? colors.success : colors.destructive },
                ]}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Party / Description *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.bgSecondary, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder={entryType === 'in' ? 'Received from (Customer / Source)' : 'Paid to (Vendor / Expense)'}
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Remark / Invoice Note</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.bgSecondary, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="e.g. Full settlement, Advance, or Stationery"
                placeholderTextColor={colors.textMuted}
                value={subtitle}
                onChangeText={setSubtitle}
              />

              <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Payment Method</Text>
              <View style={styles.modeChipsRow}>
                {(['Cash', 'UPI Transfer', 'Bank Transfer'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setMode(m)}
                    style={[
                      styles.modeSelectChip,
                      {
                        backgroundColor: mode === m ? colors.primary : colors.bgSecondary,
                        borderColor: mode === m ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.modeSelectText, { color: mode === m ? colors.primaryForeground : colors.textPrimary }]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleSaveEntry}
                style={[
                  styles.modalSubmitBtn,
                  { backgroundColor: entryType === 'in' ? colors.success : colors.destructive },
                ]}
                activeOpacity={0.85}
              >
                <Text style={styles.modalSubmitText}>
                  SAVE {entryType.toUpperCase()} ENTRY
                </Text>
              </TouchableOpacity>
            </View>
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
  filterChipsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statBoxLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    marginBottom: 6,
    textAlign: 'center',
  },
  statBoxAmount: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    textAlign: 'center',
  },
  netInHandBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  netInHandLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  netInHandValue: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  listContainer: {
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONTS.semiBold,
    marginBottom: 4,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  entryIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryTexts: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  entrySub: {
    fontSize: 11,
    marginTop: 1,
  },
  entryMeta: {
    fontSize: 10,
    marginTop: 2,
  },
  entryRight: {
    alignItems: 'flex-end',
  },
  entryAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  timelineSection: {
    paddingHorizontal: 4,
    paddingVertical: 12,
    marginTop: 6,
  },
  timelineTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    marginBottom: 14,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  timelineTrackCol: {
    alignItems: 'center',
    width: 34,
  },
  serialBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serialText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 0.2,
  },
  trackLine: {
    width: 2,
    flex: 1,
    minHeight: 24,
    marginVertical: 4,
    borderRadius: 1,
  },
  timelineBody: {
    flex: 1,
    gap: 3,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineActorText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  timelineTimeText: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  timelineTargetText: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    marginTop: 1,
  },
  timelineStatusTag: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    marginTop: 3,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
  },
  cashInBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 0,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  cashOutBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 0,
    shadowColor: '#dc2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  modalAmountInput: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalInput: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    fontSize: 13,
    marginBottom: 12,
  },
  modeChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modeSelectChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  modeSelectText: {
    fontSize: 11,
    fontWeight: '500',
  },
  modalSubmitBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

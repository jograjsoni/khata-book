import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, ChevronDown, Check, X } from 'lucide-react-native';
import { getThemeColors, FONTS } from '../../theme/theme';
import { useKhataStore } from '../../store/useKhataStore';
import { Header } from '../../components/common/Header';
import { useRouter } from 'expo-router';

interface ReportTransaction {
  id: string;
  partyId?: string;
  party: string;
  date: string;
  type: 'Paid' | 'Pending';
  amount: string;
  status: 'Paid' | 'Pending';
}

export default function ReportsScreen() {
  const router = useRouter();
  const { parties, ledgerEntries, cashbookEntries, isDarkMode, fetchInitialData } = useKhataStore();
  const colors = getThemeColors(isDarkMode);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const now = new Date();
  const currentMonthYear = now.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  const todayFormatted = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const firstDayFormatted = `01/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  const [activeDateFilter, setActiveDateFilter] = useState<'Today' | 'This Week' | 'This Month' | 'Custom'>('Today');
  const [dateRangeModalVisible, setDateRangeModalVisible] = useState(false);
  const [selectedRangeLabel, setSelectedRangeLabel] = useState(`This Month (${currentMonthYear})`);
  const [datePickerTab, setDatePickerTab] = useState<'presets' | 'custom'>('presets');
  const [fromDate, setFromDate] = useState(firstDayFormatted);
  const [toDate, setToDate] = useState(todayFormatted);

  const dateFilterChips: Array<'Today' | 'This Week' | 'This Month' | 'Custom'> = [
    'Today',
    'This Week',
    'This Month',
    'Custom',
  ];

  const dateRangePresets = useMemo(() => {
    const todayStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const currentYear = now.getFullYear();
    const nextYear = currentYear + 1;
    return [
      { label: 'Today', range: todayStr },
      { label: 'This Week', range: 'Last 7 Days' },
      { label: 'Last Week', range: 'Prior 7 Days' },
      { label: `This Month (${currentMonthYear})`, range: `01 ${currentMonthYear} - End` },
      { label: 'Previous Month', range: 'Past 30 Days' },
      { label: 'Current Quarter', range: 'Last 90 Days' },
      { label: `FY ${currentYear} - ${nextYear}`, range: `01 Apr ${currentYear} - 31 Mar ${nextYear}` },
    ];
  }, [currentMonthYear]);

  // Dynamic calculations: Zero hardcoded mock numbers
  const customers = useMemo(() => parties.filter((p) => p.type === 'customer'), [parties]);
  const suppliers = useMemo(() => parties.filter((p) => p.type === 'supplier'), [parties]);

  const youWillGet = useMemo(
    () => parties.filter((p) => p.balanceType === 'get').reduce((sum, p) => sum + p.balance, 0),
    [parties]
  );
  const youWillGive = useMemo(
    () => parties.filter((p) => p.balanceType === 'give').reduce((sum, p) => sum + p.balance, 0),
    [parties]
  );
  const netBalance = youWillGet - youWillGive;

  const totalInward = useMemo(() => {
    const fromLedger = ledgerEntries.filter((e) => e.type === 'got').reduce((sum, e) => sum + e.amount, 0);
    const fromCashbook = cashbookEntries.filter((e) => e.type === 'in').reduce((sum, e) => sum + e.amount, 0);
    return fromLedger + fromCashbook;
  }, [ledgerEntries, cashbookEntries]);

  const totalOutward = useMemo(() => {
    const fromLedger = ledgerEntries.filter((e) => e.type === 'gave').reduce((sum, e) => sum + e.amount, 0);
    const fromCashbook = cashbookEntries.filter((e) => e.type === 'out').reduce((sum, e) => sum + e.amount, 0);
    return fromLedger + fromCashbook;
  }, [ledgerEntries, cashbookEntries]);

  const collectionRate = useMemo(() => {
    const totalVolume = totalInward + totalOutward;
    if (totalVolume <= 0) return '0.0%';
    return `${((totalInward / totalVolume) * 100).toFixed(1)}%`;
  }, [totalInward, totalOutward]);

  // 2x2 Dynamic Stats Grid
  const statsGrid = [
    {
      id: 'net-balance',
      label: 'Net Balance',
      value: `₹ ${Math.abs(netBalance).toLocaleString('en-IN')}`,
      delta: netBalance > 0 ? 'Receivable' : netBalance < 0 ? 'Payable' : 'Settled',
      isPositive: netBalance >= 0,
    },
    {
      id: 'total-inward',
      label: 'Total Inward',
      value: `₹ ${totalInward.toLocaleString('en-IN')}`,
      delta: `${ledgerEntries.filter((e) => e.type === 'got').length} In`,
      isPositive: true,
    },
    {
      id: 'total-outward',
      label: 'Total Outward',
      value: `₹ ${totalOutward.toLocaleString('en-IN')}`,
      delta: `${ledgerEntries.filter((e) => e.type === 'gave').length} Out`,
      isPositive: false,
    },
    {
      id: 'collection-rate',
      label: 'Collection Rate',
      value: collectionRate,
      delta: `${parties.length} accounts`,
      isPositive: true,
    },
  ];

  // Weekly Cash Flow Analytics bars calculated dynamically
  const chartDays = useMemo(() => {
    const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const todayIdx = (now.getDay() + 6) % 7;
    const todayDayName = dayLabels[todayIdx];
    const yesterdayDayName = dayLabels[(todayIdx + 6) % 7];

    const buckets: Record<string, { inAmt: number; outAmt: number }> = {
      Mon: { inAmt: 0, outAmt: 0 },
      Tue: { inAmt: 0, outAmt: 0 },
      Wed: { inAmt: 0, outAmt: 0 },
      Thu: { inAmt: 0, outAmt: 0 },
      Fri: { inAmt: 0, outAmt: 0 },
      Sat: { inAmt: 0, outAmt: 0 },
      Sun: { inAmt: 0, outAmt: 0 },
    };

    const resolveDay = (dateStr: string): string => {
      if (!dateStr) return todayDayName;
      const lower = dateStr.toLowerCase();
      if (lower.includes('today') || lower.includes('just now')) return todayDayName;
      if (lower.includes('yesterday')) return yesterdayDayName;
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          return dayLabels[(d.getDay() + 6) % 7];
        }
      } catch {}
      return todayDayName;
    };

    for (const entry of ledgerEntries) {
      const targetDay = resolveDay(entry.date);
      if (entry.type === 'got') buckets[targetDay].inAmt += entry.amount;
      else buckets[targetDay].outAmt += entry.amount;
    }

    for (const entry of cashbookEntries) {
      const targetDay = resolveDay(entry.date);
      if (entry.type === 'in') buckets[targetDay].inAmt += entry.amount;
      else buckets[targetDay].outAmt += entry.amount;
    }

    const maxVal = Math.max(
      ...dayLabels.map((d) => Math.max(buckets[d].inAmt, buckets[d].outAmt)),
      1
    );

    return dayLabels.map((day) => ({
      day,
      inPct: maxVal > 1 ? Math.min(100, Math.round((buckets[day].inAmt / maxVal) * 100)) : 0,
      outPct: maxVal > 1 ? Math.min(100, Math.round((buckets[day].outAmt / maxVal) * 100)) : 0,
    }));
  }, [ledgerEntries, cashbookEntries]);

  // Recent Transactions derived dynamically from real ledger transactions
  const transactions = useMemo<ReportTransaction[]>(() => {
    return ledgerEntries.slice(0, 10).map((tx) => {
      const party = parties.find((p) => p.id === tx.partyId);
      const isPaid = tx.type === 'got';
      return {
        id: tx.id,
        partyId: tx.partyId,
        party: party ? party.name : 'Ledger Account',
        date: tx.date || 'Recent',
        type: isPaid ? 'Paid' : 'Pending',
        amount: `₹ ${tx.amount.toLocaleString('en-IN')}`,
        status: isPaid ? 'Paid' : 'Pending',
      };
    });
  }, [ledgerEntries, parties]);

  const dateRangeOptions = [
    'Today',
    'Nov 1 - 13',
    'Last 7 Days',
    'This Month (Nov 2026)',
    'Previous Month (Oct 2026)',
    'FY 2026 - 2027',
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgCanvas }]} edges={['top']}>
      {/* App Bar Header: Back button + Financial Reports + 3 circular icons */}
      <Header
        title="Financial Reports"
        showBack
        onBack={() => router.push('/(tabs)')}
      />

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1_filterchips: Rounded Badges Row matching reports.html */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsRow}
          >
            {dateFilterChips.map((chip) => {
              const isSelected = activeDateFilter === chip;
              return (
                <TouchableOpacity
                  key={chip}
                  onPress={() => {
                    setActiveDateFilter(chip);
                    if (chip === 'This Week') {
                      setSelectedRangeLabel('This Week (08 Nov - 14 Nov)');
                      setDatePickerTab('presets');
                      setDateRangeModalVisible(true);
                    } else if (chip === 'This Month') {
                      setSelectedRangeLabel('This Month (Nov 2026)');
                      setDatePickerTab('presets');
                      setDateRangeModalVisible(true);
                    } else if (chip === 'Custom') {
                      setDatePickerTab('custom');
                      setDateRangeModalVisible(true);
                    }
                  }}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: isSelected ? colors.primary : colors.bgCard,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  {chip === 'Today' ? (
                    <Calendar
                      size={14}
                      color={isSelected ? colors.primaryForeground : colors.textSecondary}
                      style={{ marginRight: 4 }}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.filterChipText,
                      {
                        color: isSelected ? colors.primaryForeground : colors.textPrimary,
                        fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                      },
                    ]}
                  >
                    {chip}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* 2_statrow: 2x2 Stats Grid matching reports.html */}
        <View style={styles.statsGrid}>
          {statsGrid.map((stat) => (
            <View
              key={stat.id}
              style={[
                styles.statCard,
                {
                  backgroundColor: colors.bgCard,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {stat.label}
              </Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {stat.value}
              </Text>
              <View style={styles.deltaWrapper}>
                <View
                  style={[
                    styles.deltaBadge,
                    {
                      backgroundColor: colors.bgSecondary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.deltaText,
                      {
                        color: stat.isPositive ? '#16a34a' : '#dc2626',
                      },
                    ]}
                  >
                    {stat.delta}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* 3_chart: Weekly Cash Flow Analytics & Trends Card matching reports.html */}
        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Chart Header */}
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
              Weekly Cash Flow Analytics & Trends
            </Text>
            <TouchableOpacity
              onPress={() => setDateRangeModalVisible(true)}
              style={[
                styles.dateRangePickerBtn,
                { borderColor: colors.border, backgroundColor: 'transparent' },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.dateRangePickerText, { color: colors.textPrimary }]}>
                {selectedRangeLabel}
              </Text>
              <ChevronDown size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Bar Chart Graphics (Mon, Tue, Wed, Fri, Sat, Sun) */}
          <View style={styles.chartGraphicsContainer}>
            {chartDays.map((col) => (
              <View key={col.day} style={styles.chartCol}>
                <View style={styles.colBarsGroup}>
                  {/* Green Inward bar */}
                  <View
                    style={[
                      styles.barStick,
                      {
                        height: `${col.inPct}%`,
                        backgroundColor: '#2E7D32',
                      },
                    ]}
                  />
                  {/* Red Outward bar */}
                  <View
                    style={[
                      styles.barStick,
                      {
                        height: `${col.outPct}%`,
                        backgroundColor: '#C62828',
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.chartDayText, { color: colors.textSecondary }]}>
                  {col.day}
                </Text>
              </View>
            ))}
          </View>

          {/* Chart Legend matching reports.html */}
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#2E7D32' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                Inward Collected
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#C62828' }]} />
              <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                Outward Paid
              </Text>
            </View>
          </View>
        </View>

        {/* 4_table: Recent Transactions Data Table matching reports.html */}
        <View style={styles.tableSection}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableTitle, { color: colors.textPrimary }]}>
              Recent Transactions
            </Text>
            <Text style={[styles.tableSubText, { color: colors.textSecondary }]}>
              Showing {transactions.length} entries
            </Text>
          </View>

          <View
            style={[
              styles.dataTableCard,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              },
            ]}
          >
            {/* Table Column Headers */}
            <View
              style={[
                styles.tableHeaderCols,
                {
                  backgroundColor: colors.bgSecondary,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.thCol, styles.colParty, { color: colors.textSecondary }]}>
                Party Name
              </Text>
              <Text style={[styles.thCol, styles.colDate, { color: colors.textSecondary }]}>
                Date
              </Text>
              <Text style={[styles.thCol, styles.colType, { color: colors.textSecondary }]}>
                Type
              </Text>
              <Text
                style={[
                  styles.thCol,
                  styles.colAmount,
                  { color: colors.textSecondary, textAlign: 'right' },
                ]}
              >
                Amount
              </Text>
              <Text
                style={[
                  styles.thCol,
                  styles.colStatus,
                  { color: colors.textSecondary, textAlign: 'center' },
                ]}
              >
                Status
              </Text>
            </View>

            {/* Table Rows or Clean Dynamic Empty State */}
            {transactions.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 14, fontFamily: FONTS.semiBold, color: colors.textPrimary, marginBottom: 4 }}>
                  No transactions recorded yet
                </Text>
                <Text style={{ fontSize: 12, fontFamily: FONTS.regular, color: colors.textSecondary, textAlign: 'center' }}>
                  Audited financial ledger records and settlements will appear here.
                </Text>
              </View>
            ) : (
              transactions.map((tx, idx) => {
                const isLast = idx === transactions.length - 1;
                const isPending = tx.status === 'Pending';
                const statusColor = isPending ? '#dc2626' : '#16a34a';

                return (
                  <TouchableOpacity
                    key={tx.id}
                    style={[
                      styles.tableRow,
                      {
                        borderBottomColor: colors.border,
                        borderBottomWidth: isLast ? 0 : 1,
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      if (tx.partyId) {
                        router.push(`/party/${tx.partyId}`);
                      }
                    }}
                  >
                    <Text
                      style={[styles.tdCol, styles.colParty, { color: colors.textPrimary }]}
                      numberOfLines={1}
                    >
                      {tx.party}
                    </Text>
                    <Text style={[styles.tdCol, styles.colDate, { color: colors.textSecondary }]}>
                      {tx.date}
                    </Text>
                    <Text
                      style={[
                        styles.tdCol,
                        styles.colType,
                        {
                          color: statusColor,
                          fontFamily: FONTS.semiBold,
                        },
                      ]}
                    >
                      {tx.type}
                    </Text>
                    <Text
                      style={[
                        styles.tdCol,
                        styles.colAmount,
                        {
                          color: statusColor,
                          textAlign: 'right',
                          fontFamily: FONTS.bold,
                        },
                      ]}
                    >
                      {tx.amount}
                    </Text>
                    <View style={[styles.colStatus, { alignItems: 'center', justifyContent: 'center' }]}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontFamily: FONTS.bold,
                          color: statusColor,
                        }}
                      >
                        {tx.status}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Date Range Modal with Custom Range and Quick Presets */}
      <Modal
        visible={dateRangeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDateRangeModalVisible(false)}
      >
        <Pressable
          style={styles.modalScrim}
          onPress={() => setDateRangeModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: colors.bgCard, borderColor: colors.border },
            ]}
          >
            <View style={[styles.modalHeaderRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Select Date Range
              </Text>
              <TouchableOpacity
                onPress={() => setDateRangeModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Tab switch between Presets and Custom Dates */}
            <View style={[styles.pickerTabRow, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => setDatePickerTab('presets')}
                style={[
                  styles.pickerTabBtn,
                  datePickerTab === 'presets' && { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.pickerTabText,
                    { color: datePickerTab === 'presets' ? colors.primaryForeground : colors.textPrimary },
                  ]}
                >
                  Quick Presets
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setDatePickerTab('custom')}
                style={[
                  styles.pickerTabBtn,
                  datePickerTab === 'custom' && { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.pickerTabText,
                    { color: datePickerTab === 'custom' ? colors.primaryForeground : colors.textPrimary },
                  ]}
                >
                  Custom Range
                </Text>
              </TouchableOpacity>
            </View>

            {datePickerTab === 'presets' ? (
              <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
                {dateRangePresets.map((opt) => {
                  const isSelected = selectedRangeLabel === opt.label || selectedRangeLabel.includes(opt.label);
                  return (
                    <TouchableOpacity
                      key={opt.label}
                      onPress={() => {
                        setSelectedRangeLabel(`${opt.label} (${opt.range})`);
                        setDateRangeModalVisible(false);
                      }}
                      style={[
                        styles.modalOption,
                        { borderBottomColor: colors.border },
                      ]}
                    >
                      <View>
                        <Text
                          style={[
                            styles.modalOptionText,
                            {
                              color: isSelected ? colors.primary : colors.textPrimary,
                              fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                            },
                          ]}
                        >
                          {opt.label}
                        </Text>
                        <Text style={[styles.modalOptionSub, { color: colors.textSecondary }]}>
                          {opt.range}
                        </Text>
                      </View>
                      {isSelected && <Check size={16} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.customDateContainer}>
                <View style={styles.dateInputGroup}>
                  <Text style={[styles.dateInputLabel, { color: colors.textSecondary }]}>Start Date (From)</Text>
                  <View style={[styles.dateInputRow, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                    <Calendar size={16} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.dateInput, { color: colors.textPrimary }]}
                      value={fromDate}
                      onChangeText={setFromDate}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                <View style={styles.dateInputGroup}>
                  <Text style={[styles.dateInputLabel, { color: colors.textSecondary }]}>End Date (To)</Text>
                  <View style={[styles.dateInputRow, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
                    <Calendar size={16} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.dateInput, { color: colors.textPrimary }]}
                      value={toDate}
                      onChangeText={setToDate}
                      placeholder="DD/MM/YYYY"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setSelectedRangeLabel(`${fromDate} - ${toDate}`);
                    setActiveDateFilter('Custom');
                    setDateRangeModalVisible(false);
                  }}
                  style={[styles.applyDateBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={[styles.applyDateText, { color: colors.primaryForeground }]}>
                    Apply Custom Range
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Pressable>
        </Pressable>
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
    paddingTop: 8,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  filterSection: {
    marginBottom: 12,
  },
  filterChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  statCard: {
    width: '48%',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  deltaWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deltaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  deltaText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
  },
  chartCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  chartTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    flex: 1,
    marginRight: 8,
  },
  dateRangePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  dateRangePickerText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  chartGraphicsContainer: {
    height: 185,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 4,
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 4,
  },
  colBarsGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    height: 150,
    width: '100%',
    justifyContent: 'center',
  },
  barStick: {
    width: 14,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  chartDayText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    marginTop: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
  tableSection: {
    marginBottom: 16,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tableTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  tableSubText: {
    fontSize: 12.5,
    fontFamily: FONTS.regular,
  },
  dataTableCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tableHeaderCols: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  thCol: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    letterSpacing: 0.2,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  tdCol: {
    fontSize: 13.5,
    fontFamily: FONTS.regular,
  },
  colParty: {
    flex: 2.3,
  },
  colDate: {
    flex: 1.3,
  },
  colType: {
    flex: 1.3,
  },
  colAmount: {
    flex: 1.6,
  },
  colStatus: {
    flex: 1.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
  },
  modalScrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
  },
  modalCloseBtn: {
    padding: 4,
  },
  pickerTabRow: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 2,
    marginBottom: 12,
  },
  pickerTabBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerTabText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  modalOptionSub: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 2,
  },
  customDateContainer: {
    gap: 12,
    paddingVertical: 6,
  },
  dateInputGroup: {
    gap: 4,
  },
  dateInputLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  dateInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  dateInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
  },
  applyDateBtn: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  applyDateText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalOptionText: {
    fontSize: 14,
  },
});

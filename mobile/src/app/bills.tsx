import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  FileText,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Calendar,
  Share2,
} from 'lucide-react-native';
import { THEME } from '../theme/theme';
import { useKhataStore, Bill } from '../store/useKhataStore';
import { Header } from '../components/common/Header';

export default function BillsScreen() {
  const router = useRouter();
  const { bills, addBill, updateBillStatus, isDarkMode } = useKhataStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Paid' | 'Overdue'>('All');

  // New Bill modal
  const [modalVisible, setModalVisible] = useState(false);
  const [billNum, setBillNum] = useState(`INV-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [partyName, setPartyName] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<Bill['status']>('Pending');
  const [itemsSummary, setItemsSummary] = useState('');

  // Filter bills
  const filteredBills = useMemo(() => {
    let list = bills;
    if (activeTab !== 'All') {
      list = list.filter((b) => b.status === activeTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (b) =>
          b.billNumber.toLowerCase().includes(q) ||
          b.partyName.toLowerCase().includes(q) ||
          b.amount.toString().includes(q)
      );
    }
    return list;
  }, [bills, activeTab, searchQuery]);

  // Aggregate stats matching bills.html
  const pendingTotal = bills
    .filter((b) => b.status === 'Pending')
    .reduce((sum, b) => sum + b.amount, 0);

  const paidTotal = bills
    .filter((b) => b.status === 'Paid')
    .reduce((sum, b) => sum + b.amount, 0);

  const overdueTotal = bills
    .filter((b) => b.status === 'Overdue')
    .reduce((sum, b) => sum + b.amount, 0);

  const handleCreateBill = () => {
    const val = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (!val || isNaN(val) || val <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid bill amount.');
      return;
    }
    if (!partyName.trim()) {
      Alert.alert('Vendor/Client Required', 'Please enter vendor or customer name.');
      return;
    }

    addBill({
      billNumber: billNum.trim(),
      partyName: partyName.trim(),
      amount: val,
      status,
      date: 'Today, Just now',
      dueDate: 'In 7 days',
      itemsSummary: itemsSummary.trim() || 'General merchandise',
    });

    setModalVisible(false);
    setAmount('');
    setPartyName('');
    setItemsSummary('');
    setBillNum(`INV-2026-${Math.floor(100 + Math.random() * 900)}`);
    Alert.alert('Bill Created', `Invoice ${billNum} saved successfully.`);
  };

  const bgCanvas = isDarkMode ? THEME.colors.dark.bgCanvas : THEME.colors.bgCanvas;
  const bgCard = isDarkMode ? THEME.colors.dark.bgCard : THEME.colors.bgCard;
  const border = isDarkMode ? THEME.colors.dark.border : THEME.colors.border;
  const textPrimary = isDarkMode ? THEME.colors.dark.textPrimary : THEME.colors.textPrimary;
  const textMuted = isDarkMode ? THEME.colors.dark.textMuted : THEME.colors.textMuted;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgCanvas }]} edges={['top']}>
      <Header
        title="Business Bills & Invoices"
        subtitle={`${bills.length} invoices generated`}
        showBack
        rightAction={
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={[styles.headerNewBtn, { backgroundColor: THEME.colors.primary }]}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.headerNewBtnText}>New Bill</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: bgCard, borderColor: border }]}>
          <Search size={16} color={textMuted} />
          <TextInput
            style={[styles.searchInput, { color: textPrimary }]}
            placeholder="Search bills by vendor, number or amount"
            placeholderTextColor={textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* 3 Summary Cards matching bills.html */}
        <View style={styles.summaryRow}>
          {/* Pending */}
          <TouchableOpacity
            onPress={() => setActiveTab(activeTab === 'Pending' ? 'All' : 'Pending')}
            style={[
              styles.summaryCard,
              { backgroundColor: bgCard, borderColor: border },
              activeTab === 'Pending' && { borderColor: THEME.colors.warning, borderWidth: 2 },
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.summaryCardHeader}>
              <Text style={[styles.summaryCardLabel, { color: textMuted }]}>Pending</Text>
              <Clock size={14} color={THEME.colors.warning} />
            </View>
            <Text style={[styles.summaryCardAmount, { color: THEME.colors.warning }]}>
              ₹ {pendingTotal.toLocaleString('en-IN')}
            </Text>
          </TouchableOpacity>

          {/* Paid */}
          <TouchableOpacity
            onPress={() => setActiveTab(activeTab === 'Paid' ? 'All' : 'Paid')}
            style={[
              styles.summaryCard,
              { backgroundColor: bgCard, borderColor: border },
              activeTab === 'Paid' && { borderColor: THEME.colors.success, borderWidth: 2 },
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.summaryCardHeader}>
              <Text style={[styles.summaryCardLabel, { color: textMuted }]}>Paid</Text>
              <CheckCircle2 size={14} color={THEME.colors.success} />
            </View>
            <Text style={[styles.summaryCardAmount, { color: THEME.colors.success }]}>
              ₹ {paidTotal.toLocaleString('en-IN')}
            </Text>
          </TouchableOpacity>

          {/* Overdue */}
          <TouchableOpacity
            onPress={() => setActiveTab(activeTab === 'Overdue' ? 'All' : 'Overdue')}
            style={[
              styles.summaryCard,
              { backgroundColor: bgCard, borderColor: border },
              activeTab === 'Overdue' && { borderColor: THEME.colors.pink, borderWidth: 2 },
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.summaryCardHeader}>
              <Text style={[styles.summaryCardLabel, { color: textMuted }]}>Overdue</Text>
              <AlertTriangle size={14} color={THEME.colors.pink} />
            </View>
            <Text style={[styles.summaryCardAmount, { color: THEME.colors.pink }]}>
              ₹ {overdueTotal.toLocaleString('en-IN')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Toolbar info */}
        <View style={styles.toolbarRow}>
          <Text style={[styles.invoiceCount, { color: textMuted }]}>
            {filteredBills.length} invoices found
          </Text>
          <View style={styles.sortIndicator}>
            <ArrowUpDown size={12} color={textMuted} />
            <Text style={[styles.sortIndicatorText, { color: textMuted }]}>Newest First</Text>
          </View>
        </View>

        {/* Invoices List matching table in bills.html */}
        <View style={styles.billsList}>
          {filteredBills.length === 0 ? (
            <View style={[styles.billCard, { backgroundColor: bgCard, borderColor: border, padding: 32, alignItems: 'center', justifyContent: 'center' }]}>
              <FileText size={32} color={THEME.colors.primary} style={{ marginBottom: 10 }} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: textPrimary, marginBottom: 4 }}>
                No Bills or Invoices Found
              </Text>
              <Text style={{ fontSize: 12, color: textMuted, textAlign: 'center', marginBottom: 14 }}>
                Create and track digital invoices, payment statuses, and due dates effortlessly.
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: THEME.colors.primary }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 12 }}>Create First Bill</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredBills.map((b) => {
            const isPaid = b.status === 'Paid';
            const isOverdue = b.status === 'Overdue';
            const isPending = b.status === 'Pending';

            return (
              <View
                key={b.id}
                style={[styles.billCard, { backgroundColor: bgCard, borderColor: border }]}
              >
                <View style={styles.billTopRow}>
                  <View style={styles.billIdRow}>
                    <FileText size={16} color={THEME.colors.primary} />
                    <Text style={[styles.billNumber, { color: textPrimary }]}>{b.billNumber}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: isPaid
                          ? THEME.colors.successBg
                          : isOverdue
                          ? THEME.colors.pinkBg
                          : THEME.colors.warningBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        {
                          color: isPaid
                            ? THEME.colors.success
                            : isOverdue
                            ? THEME.colors.pink
                            : THEME.colors.warning,
                        },
                      ]}
                    >
                      {b.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.billMiddleRow}>
                  <View>
                    <Text style={[styles.vendorName, { color: textPrimary }]}>{b.partyName}</Text>
                    {b.itemsSummary ? (
                      <Text style={[styles.itemsSummary, { color: textMuted }]}>{b.itemsSummary}</Text>
                    ) : null}
                    <Text style={[styles.billDate, { color: textMuted }]}>{b.date}</Text>
                  </View>

                  <Text style={[styles.billAmount, { color: textPrimary }]}>
                    ₹ {b.amount.toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={[styles.billActionRow, { borderTopColor: border }]}>
                  {b.status !== 'Paid' ? (
                    <TouchableOpacity
                      onPress={() => updateBillStatus(b.id, 'Paid')}
                      style={[styles.markPaidBtn, { backgroundColor: THEME.colors.successBg }]}
                    >
                      <CheckCircle2 size={13} color={THEME.colors.success} />
                      <Text style={[styles.markPaidText, { color: THEME.colors.success }]}>
                        Mark as Paid
                      </Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    onPress={() => Alert.alert('Share Invoice', `Sharing ${b.billNumber} with ${b.partyName}`)}
                    style={[styles.shareInvoiceBtn, { backgroundColor: THEME.colors.primaryBg }]}
                  >
                    <Share2 size={13} color={THEME.colors.primary} />
                    <Text style={[styles.shareInvoiceText, { color: THEME.colors.primary }]}>
                      Share PDF
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* New Bill Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: bgCard }]}>
            <View style={[styles.modalHeader, { borderBottomColor: border }]}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Create New Bill / Invoice</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalCloseBtn, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}
              >
                <X size={18} color={textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalLabel, { color: textMuted }]}>Invoice Number</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: isDarkMode ? '#334155' : '#F8FAFC', borderColor: border, color: textPrimary }]}
                value={billNum}
                onChangeText={setBillNum}
              />

              <Text style={[styles.modalLabel, { color: textMuted }]}>Vendor / Customer Name *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: isDarkMode ? '#334155' : '#F8FAFC', borderColor: border, color: textPrimary }]}
                placeholder="e.g. Alex Morgan or Taylor Kim"
                placeholderTextColor={textMuted}
                value={partyName}
                onChangeText={setPartyName}
              />

              <Text style={[styles.modalLabel, { color: textMuted }]}>Amount (₹) *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: isDarkMode ? '#334155' : '#F8FAFC', borderColor: border, color: textPrimary }]}
                placeholder="0"
                placeholderTextColor={textMuted}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <Text style={[styles.modalLabel, { color: textMuted }]}>Item Summary</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: isDarkMode ? '#334155' : '#F8FAFC', borderColor: border, color: textPrimary }]}
                placeholder="e.g. 5 bags Basmati Rice, 2 Tins Oil"
                placeholderTextColor={textMuted}
                value={itemsSummary}
                onChangeText={setItemsSummary}
              />

              <Text style={[styles.modalLabel, { color: textMuted }]}>Initial Status</Text>
              <View style={styles.statusChipsRow}>
                {(['Pending', 'Paid', 'Overdue'] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setStatus(s)}
                    style={[
                      styles.statusSelectChip,
                      {
                        backgroundColor: status === s ? THEME.colors.primary : isDarkMode ? '#334155' : '#F1F5F9',
                        borderColor: status === s ? THEME.colors.primary : border,
                      },
                    ]}
                  >
                    <Text style={[styles.statusSelectText, { color: status === s ? '#FFFFFF' : textPrimary }]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleCreateBill}
                style={[styles.submitBillBtn, { backgroundColor: THEME.colors.primary }]}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBillText}>SAVE INVOICE</Text>
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
  headerNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  headerNewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryCardLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  summaryCardAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  invoiceCount: {
    fontSize: 12,
    fontWeight: '500',
  },
  sortIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortIndicatorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  billsList: {
    gap: 12,
  },
  billCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  billTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  billNumber: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  billMiddleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  itemsSummary: {
    fontSize: 11,
    marginTop: 2,
  },
  billDate: {
    fontSize: 11,
    marginTop: 2,
  },
  billAmount: {
    fontSize: 17,
    fontWeight: '800',
  },
  billActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  markPaidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  markPaidText: {
    fontSize: 11,
    fontWeight: '700',
  },
  shareInvoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
  },
  shareInvoiceText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    fontSize: 14,
    marginBottom: 12,
  },
  statusChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  statusSelectChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  statusSelectText: {
    fontSize: 12,
    fontWeight: '600',
  },
  submitBillBtn: {
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

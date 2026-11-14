import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Link2,
  Search,
  Filter,
  Plus,
  Share2,
  Copy,
  Clock,
  CheckCircle2,
  X,
  CreditCard,
  QrCode,
} from 'lucide-react-native';
import { THEME } from '../theme/theme';
import { useKhataStore, PaymentLink } from '../store/useKhataStore';
import { Header } from '../components/common/Header';

export default function PaymentLinksScreen() {
  const router = useRouter();
  const { paymentLinks, addPaymentLink, business, isDarkMode } = useKhataStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [methods, setMethods] = useState('UPI QR & NetBanking');

  const filteredLinks = useMemo(() => {
    let list = paymentLinks;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.customerName.toLowerCase().includes(q) ||
          l.amount.toString().includes(q)
      );
    }
    return list;
  }, [paymentLinks, searchQuery]);

  const handleCreate = () => {
    const val = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (!val || isNaN(val) || val <= 0) {
      Alert.alert('Amount Required', 'Please enter payment link amount.');
      return;
    }
    if (!customerName.trim()) {
      Alert.alert('Customer Name Required', 'Please enter customer name.');
      return;
    }

    addPaymentLink({
      title: title.trim() || `${customerName} Collection Request`,
      customerName: customerName.trim(),
      amount: val,
      status: 'Active',
      methods,
      createdDate: new Date().toLocaleDateString('en-IN', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
      }),
      linkUrl: `https://khata.page.link/pay-${Date.now().toString().slice(-4)}`,
    });

    setModalVisible(false);
    setAmount('');
    setCustomerName('');
    setTitle('');
    Alert.alert('Payment Link Created', 'Shareable collection link generated.');
  };

  const handleShareLink = async (link: PaymentLink) => {
    try {
      const bizName = business.name || 'Merchant';
      await Share.share({
        message: `Payment request of ₹ ${link.amount.toLocaleString(
          'en-IN'
        )} from ${bizName} for ${link.title}.\nPay securely via: ${link.linkUrl}`,
      });
    } catch {}
  };

  const bgCanvas = isDarkMode ? THEME.colors.dark.bgCanvas : THEME.colors.bgCanvas;
  const bgCard = isDarkMode ? THEME.colors.dark.bgCard : THEME.colors.bgCard;
  const border = isDarkMode ? THEME.colors.dark.border : THEME.colors.border;
  const textPrimary = isDarkMode ? THEME.colors.dark.textPrimary : THEME.colors.textPrimary;
  const textMuted = isDarkMode ? THEME.colors.dark.textMuted : THEME.colors.textMuted;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgCanvas }]} edges={['top']}>
      <Header
        title="Payment Links"
        subtitle="Digital Collections & Instant Reminders"
        showBack
        rightAction={
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={[styles.headerCreateBtn, { backgroundColor: THEME.colors.primary }]}
            activeOpacity={0.8}
          >
            <Plus size={16} color="#FFFFFF" />
            <Text style={styles.headerCreateText}>Create Link</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: bgCard, borderColor: border }]}>
          <Search size={16} color={textMuted} />
          <TextInput
            style={[styles.searchInput, { color: textPrimary }]}
            placeholder="Search payment links by customer or amount"
            placeholderTextColor={textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Toolbar info */}
        <View style={styles.toolbarRow}>
          <Text style={[styles.countText, { color: textMuted }]}>
            {filteredLinks.length} active collection links
          </Text>
          <Text style={[styles.sortText, { color: textMuted }]}>Newest</Text>
        </View>

        {/* Links list matching payment-links.html */}
        <View style={styles.linksList}>
          {filteredLinks.length === 0 ? (
            <View style={[styles.linkCard, { backgroundColor: bgCard, borderColor: border, padding: 32, alignItems: 'center', justifyContent: 'center' }]}>
              <Link2 size={32} color={THEME.colors.primary} style={{ marginBottom: 10 }} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: textPrimary, marginBottom: 4 }}>
                No Payment Links Created
              </Text>
              <Text style={{ fontSize: 12, color: textMuted, textAlign: 'center', marginBottom: 14 }}>
                Generate shareable UPI collection links for your customers and get paid instantly.
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: THEME.colors.primary }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 12 }}>Create First Link</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredLinks.map((link) => {
            const isActive = link.status === 'Active';
            return (
              <View
                key={link.id}
                style={[styles.linkCard, { backgroundColor: bgCard, borderColor: border }]}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardTopLeft}>
                    <View
                      style={[
                        styles.linkIconCircle,
                        {
                          backgroundColor: isActive
                            ? THEME.colors.primaryBg
                            : '#F1F5F9',
                        },
                      ]}
                    >
                      <Link2
                        size={18}
                        color={isActive ? THEME.colors.primary : textMuted}
                      />
                    </View>
                    <View style={styles.cardHeadings}>
                      <Text style={[styles.linkTitle, { color: textPrimary }]}>{link.title}</Text>
                      <Text style={[styles.customerSub, { color: textMuted }]}>
                        {link.customerName}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: isActive
                          ? THEME.colors.successBg
                          : '#FEE2E2',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: isActive
                            ? THEME.colors.success
                            : THEME.colors.danger,
                        },
                      ]}
                    >
                      {link.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardMid}>
                  <Text style={[styles.methodsText, { color: textMuted }]}>{link.methods}</Text>
                  <Text style={[styles.amountText, { color: THEME.colors.primary }]}>
                    ₹ {link.amount.toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={[styles.cardFooter, { borderTopColor: border }]}>
                  <Text style={[styles.dateText, { color: textMuted }]}>
                    Created {link.createdDate}
                  </Text>

                  <View style={styles.actionsGroup}>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert('Link Copied', link.linkUrl);
                      }}
                      style={[styles.copyBtn, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}
                    >
                      <Copy size={13} color={textPrimary} />
                      <Text style={[styles.btnLabel, { color: textPrimary }]}>Copy</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleShareLink(link)}
                      style={[styles.shareBtn, { backgroundColor: THEME.colors.primaryBg }]}
                    >
                      <Share2 size={13} color={THEME.colors.primary} />
                      <Text style={[styles.btnLabel, { color: THEME.colors.primary }]}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Create Link Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: bgCard }]}>
            <View style={[styles.modalHeader, { borderBottomColor: border }]}>
              <Text style={[styles.modalTitle, { color: textPrimary }]}>Create Payment Link</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[styles.modalCloseBtn, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}
              >
                <X size={18} color={textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalLabel, { color: textMuted }]}>Customer Name *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: isDarkMode ? '#334155' : '#F8FAFC', borderColor: border, color: textPrimary }]}
                placeholder="Enter customer name"
                placeholderTextColor={textMuted}
                value={customerName}
                onChangeText={setCustomerName}
              />

              <Text style={[styles.modalLabel, { color: textMuted }]}>Title / Purpose</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: isDarkMode ? '#334155' : '#F8FAFC', borderColor: border, color: textPrimary }]}
                placeholder="e.g. Invoice #1042 Settlement"
                placeholderTextColor={textMuted}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={[styles.modalLabel, { color: textMuted }]}>Amount (₹) *</Text>
              <TextInput
                style={[styles.modalInput, { backgroundColor: isDarkMode ? '#334155' : '#F8FAFC', borderColor: border, color: textPrimary }]}
                placeholder="Enter amount (e.g. 5000)"
                placeholderTextColor={textMuted}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />

              <Text style={[styles.modalLabel, { color: textMuted }]}>Payment Channels</Text>
              <View style={styles.channelsRow}>
                {['UPI QR & NetBanking', 'Credit Card & Debit Card', 'UPI Autopay'].map((ch) => (
                  <TouchableOpacity
                    key={ch}
                    onPress={() => setMethods(ch)}
                    style={[
                      styles.channelChip,
                      {
                        backgroundColor: methods === ch ? THEME.colors.primary : isDarkMode ? '#334155' : '#F1F5F9',
                        borderColor: methods === ch ? THEME.colors.primary : border,
                      },
                    ]}
                  >
                    <Text style={[styles.channelText, { color: methods === ch ? '#FFFFFF' : textPrimary }]}>
                      {ch}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                onPress={handleCreate}
                style={[styles.submitLinkBtn, { backgroundColor: THEME.colors.primary }]}
                activeOpacity={0.85}
              >
                <Text style={styles.submitLinkText}>GENERATE PAYMENT LINK</Text>
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
  headerCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  headerCreateText: {
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
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  toolbarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  countText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sortText: {
    fontSize: 12,
    fontWeight: '500',
  },
  linksList: {
    gap: 10,
  },
  linkCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  linkIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeadings: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  customerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardMid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  methodsText: {
    fontSize: 11,
  },
  amountText: {
    fontSize: 17,
    fontWeight: '800',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  dateText: {
    fontSize: 11,
  },
  actionsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  btnLabel: {
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
  channelsRow: {
    gap: 8,
    marginBottom: 20,
  },
  channelChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  channelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  submitLinkBtn: {
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLinkText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

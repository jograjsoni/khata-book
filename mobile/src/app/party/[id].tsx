import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Share,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Phone,
  MessageSquare,
  FileText,
  Share2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Edit2,
  Plus,
} from 'lucide-react-native';
import { THEME, getThemeColors, FONTS } from '../../theme/theme';
import { useKhataStore } from '../../store/useKhataStore';
import { Header } from '../../components/common/Header';
import { AddTransactionModal } from '../../components/modals/AddTransactionModal';
import { ScalePressable } from '../../components/common/ScalePressable';
import {
  WireframeWhatsAppIcon,
  WireframePhoneIcon,
} from '../../components/common/WireframeIcons';
import permissionService from '../../services/permissionService';

export default function PartyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { parties, ledgerEntries, business, fetchTransactions, isDarkMode } = useKhataStore();
  const colors = getThemeColors(isDarkMode);

  const [txModalVisible, setTxModalVisible] = useState(false);
  const [txModalType, setTxModalType] = useState<'gave' | 'got'>('got');
  const [editingEntry, setEditingEntry] = useState<any>(null);

  const party = parties.find((p) => p.id === id);

  useEffect(() => {
    if (id) {
      fetchTransactions(id);
    }
  }, [id, fetchTransactions]);

  const partyEntries = useMemo(() => {
    return party ? ledgerEntries.filter((e) => e.partyId === party.id) : [];
  }, [party, ledgerEntries]);

  // Calculate totals 100% mathematically
  const totalGave = useMemo(
    () => partyEntries.filter((e) => e.type === 'gave').reduce((sum, e) => sum + e.amount, 0),
    [partyEntries]
  );
  const totalGot = useMemo(
    () => partyEntries.filter((e) => e.type === 'got').reduce((sum, e) => sum + e.amount, 0),
    [partyEntries]
  );
  const balanceToReceive = totalGave - totalGot;

  const isGet = party ? party.balanceType === 'get' && party.balance > 0 : false;
  const isGive = party ? party.balanceType === 'give' && party.balance > 0 : false;

  // Calculate exact running balance for each entry
  const entryRunningBalances = useMemo(() => {
    let current = party ? party.balance : 0;
    const balances: Record<string, number> = {};
    const isCustomer = party ? party.type === 'customer' : true;

    for (const entry of partyEntries) {
      balances[entry.id] = current;
      const delta = isCustomer
        ? (entry.type === 'gave' ? entry.amount : -entry.amount)
        : (entry.type === 'got' ? entry.amount : -entry.amount);
      current = Math.abs(current - delta);
    }
    return balances;
  }, [party, partyEntries]);

  if (!party) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgCanvas }]} edges={['top']}>
        <Header title="Party Not Found" showBack onBack={() => router.replace('/(tabs)')} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <Text style={{ fontSize: 16, fontFamily: FONTS.bold, color: colors.textPrimary, marginBottom: 8 }}>
            Account Not Found
          </Text>
          <Text style={{ fontSize: 13, fontFamily: FONTS.regular, color: colors.textSecondary, textAlign: 'center', marginBottom: 20 }}>
            This customer or supplier account may have been removed or does not exist.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 14, backgroundColor: colors.primary }}
          >
            <Text style={{ color: colors.primaryForeground, fontFamily: FONTS.semiBold }}>
              Return to Home
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleCall = async () => {
    await permissionService.directCall(party.phone);
  };

  const handleSendSms = async () => {
    const bizName = business.name || 'our business';
    const upiPart = business.upiId ? ` Settle via UPI: ${business.upiId}.` : '';
    const text = `Dear ${party.name}, gentle reminder that your pending balance with ${bizName} is ₹ ${party.balance.toLocaleString('en-IN')}.${upiPart} Thank you!`;
    await permissionService.sendDirectSms(party.phone, text);
  };

  const handleWhatsApp = () => {
    const bizName = business.name || 'our business';
    const upiPart = business.upiId ? ` Please settle via UPI: ${business.upiId}.` : '';
    const text = encodeURIComponent(
      `Dear ${party.name}, gentle reminder that your pending balance with ${bizName} is ₹ ${party.balance.toLocaleString('en-IN')}.${upiPart} Thank you!`
    );
    Linking.openURL(`whatsapp://send?phone=${party.phone.replace(/[^0-9]/g, '')}&text=${text}`).catch(() => {
      Alert.alert('WhatsApp', 'WhatsApp is not installed. Sending SMS instead.');
    });
  };

  const handleShareStatement = async () => {
    try {
      const bizName = business.name || 'Merchant';
      await Share.share({
        message: `Statement for ${party.name} from ${bizName}\nCurrent Balance: ₹ ${party.balance.toLocaleString('en-IN')}\nStatus: ${party.status}\nReconciled on KhataApp.`,
      });
    } catch {}
  };

  const handleEditCustomerProfile = () => {
    router.push({
      pathname: '/add-customer',
      params: { edit: 'true', name: party.name, phone: party.phone, id: party.id },
    });
  };

  const handleOpenTransaction = (type: 'gave' | 'got', entry?: any) => {
    setTxModalType(type);
    setEditingEntry(entry || null);
    setTxModalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgCanvas }]} edges={['top']}>
      {/* Header with Profile Edit & Share */}
      <Header
        title={party.name}
        subtitle={party.phone}
        showBack
        rightAction={
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              onPress={handleEditCustomerProfile}
              style={[styles.headerProfileBtn, { backgroundColor: colors.bgSecondary }]}
              activeOpacity={0.7}
            >
              <Edit2 size={13} color={colors.textPrimary} />
              <Text style={[styles.headerProfileText, { color: colors.textPrimary }]}>Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShareStatement}
              style={[styles.headerShareBtn, { backgroundColor: colors.bgSecondary }]}
              activeOpacity={0.7}
            >
              <Share2 size={16} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Net Balance Card - Completely Borderless */}
        <View style={[styles.balanceCard, { backgroundColor: colors.bgSecondary }]}>
          <View style={styles.balanceHeaderRow}>
            <View>
              <Text style={[styles.balanceHeaderLabel, { color: colors.textSecondary }]}>
                NET BALANCE
              </Text>
              <Text
                style={[
                  styles.balanceAmount,
                  { color: isGet ? colors.success : isGive ? colors.destructive : colors.textPrimary },
                ]}
              >
                ₹ {party.balance.toLocaleString('en-IN')}
              </Text>
              <Text
                style={[
                  styles.balanceStatusLabel,
                  { color: isGet ? colors.success : isGive ? colors.destructive : colors.textSecondary },
                ]}
              >
                {isGet ? 'You Will Get' : isGive ? 'You Will Give' : 'Settled Balance'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              {/* Dynamic Due Status */}
              <Text style={styles.dueTodayText}>{party.status || 'Active'}</Text>
              <Text style={[styles.lastActiveText, { color: colors.textSecondary }]}>
                Last entry: {party.lastTxDate || (partyEntries[0]?.date) || 'No entries yet'}
              </Text>
            </View>
          </View>

          {/* Quick Action Buttons */}
          <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
            <ScalePressable
              onPress={handleCall}
              style={[styles.actionBtn, { backgroundColor: colors.bgCard }]}
              scaleTo={0.95}
            >
              <WireframePhoneIcon size={16} color={colors.textPrimary} strokeWidth={1.8} />
              <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>Call</Text>
            </ScalePressable>

            <ScalePressable
              onPress={handleSendSms}
              style={[styles.actionBtn, { backgroundColor: colors.bgCard }]}
              scaleTo={0.95}
            >
              <MessageSquare size={16} color={colors.textPrimary} strokeWidth={1.8} />
              <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>SMS</Text>
            </ScalePressable>

            <ScalePressable
              onPress={handleWhatsApp}
              style={[styles.actionBtn, { backgroundColor: colors.bgCard }]}
              scaleTo={0.95}
            >
              <WireframeWhatsAppIcon size={17} color={colors.textPrimary} />
              <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>WhatsApp</Text>
            </ScalePressable>

            <ScalePressable
              onPress={handleShareStatement}
              style={[styles.actionBtn, { backgroundColor: colors.bgCard }]}
              scaleTo={0.95}
            >
              <FileText size={16} color={colors.textPrimary} />
              <Text style={[styles.actionBtnText, { color: colors.textPrimary }]}>Report</Text>
            </ScalePressable>
          </View>
        </View>

        {/* Transaction Overview Card - Completely Borderless */}
        <View style={[styles.overviewCard, { backgroundColor: colors.bgSecondary }]}>
          <Text style={[styles.overviewTitle, { color: colors.textSecondary }]}>
            TRANSACTION OVERVIEW
          </Text>
          <View style={styles.overviewGrid}>
            <View style={styles.overviewCol}>
              <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Total You Gave</Text>
              <Text style={[styles.overviewVal, { color: colors.destructive }]}>
                ₹ {totalGave.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={[styles.overviewDivider, { backgroundColor: colors.border }]} />
            <View style={styles.overviewCol}>
              <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Total You Got</Text>
              <Text style={[styles.overviewVal, { color: colors.success }]}>
                ₹ {totalGot.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={[styles.overviewDivider, { backgroundColor: colors.border }]} />
            <View style={styles.overviewCol}>
              <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>
                {party.type === 'customer'
                  ? isGet
                    ? 'Balance to Receive'
                    : isGive
                    ? 'Advance Received'
                    : 'Settled Balance'
                  : isGive
                  ? 'Balance to Pay'
                  : isGet
                  ? 'Advance Paid'
                  : 'Settled Balance'}
              </Text>
              <Text
                style={[
                  styles.overviewVal,
                  {
                    color: isGet ? colors.success : isGive ? colors.destructive : colors.textPrimary,
                  },
                ]}
              >
                ₹ {party.balance.toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* Section Heading: ENTRIES */}
        <View style={styles.entriesSectionHeader}>
          <Text style={[styles.entriesSectionTitle, { color: colors.textPrimary }]}>ENTRIES</Text>
          <View style={styles.entriesLegend}>
            <Text style={[styles.legendText, { color: colors.destructive }]}>
              {party.type === 'customer' ? 'YOU GAVE' : 'YOU PAID'}
            </Text>
            <Text style={[styles.legendText, { color: colors.success }]}>
              {party.type === 'customer' ? 'YOU GOT' : 'PURCHASED'}
            </Text>
          </View>
        </View>

        {/* Entries Feed - Completely Borderless with Soft Background & Rounded Edit Entry Buttons */}
        <View style={styles.entriesContainer}>
          {partyEntries.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.bgSecondary }]}>
              <Text style={[styles.emptyCardText, { color: colors.textSecondary }]}>
                No transaction entries recorded yet. Tap buttons below to record.
              </Text>
            </View>
          ) : (
            partyEntries.map((entry) => {
              const isGot = entry.type === 'got';
              const runningBal = entryRunningBalances[entry.id] ?? party.balance;
              return (
                <View
                  key={entry.id}
                  style={[styles.entryCard, { backgroundColor: colors.bgSecondary }]}
                >
                  <View style={styles.entryLeftCol}>
                    <View style={styles.entryTitleRow}>
                      <Text style={[styles.entryTitle, { color: colors.textPrimary }]}>
                        {party.type === 'customer'
                          ? isGot
                            ? 'Payment Received'
                            : 'Credit Sale'
                          : isGot
                          ? 'Purchase / Goods In'
                          : 'Payment Made'}
                      </Text>
                      <View
                        style={[
                          styles.statusPill,
                          {
                            backgroundColor: isGot ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusPillText,
                            { color: isGot ? colors.success : colors.destructive },
                          ]}
                        >
                          {party.type === 'customer'
                            ? isGot
                              ? 'You Got'
                              : 'You Gave'
                            : isGot
                            ? 'Goods In'
                            : 'You Paid'}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.entrySubtitle, { color: colors.textSecondary }]}>
                      {entry.note ||
                        (party.type === 'customer'
                          ? isGot
                            ? 'Payment Received'
                            : 'Udhar / Goods given'
                          : isGot
                          ? 'Purchased goods on credit'
                          : 'Payment cleared to supplier')}
                    </Text>
                    <Text style={[styles.entryDateText, { color: colors.textSecondary }]}>
                      {entry.date} · {entry.mode || 'Cash/UPI'}
                    </Text>

                    {/* Clean & Prominent Simple Edit Icon Button */}
                    <TouchableOpacity
                      onPress={() => handleOpenTransaction(entry.type, entry)}
                      style={[styles.editIconBtn, { backgroundColor: colors.bgSecondary }]}
                      activeOpacity={0.6}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityLabel="Edit Entry"
                    >
                      <Edit2 size={16} color={colors.textPrimary} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>

                  {/* Right side: Amount and Balance */}
                  <View style={styles.entryRightCol}>
                    <Text
                      style={[
                        styles.entryAmountText,
                        { color: isGot ? colors.success : colors.destructive },
                      ]}
                    >
                      {isGot ? '+' : '-'} ₹ {entry.amount.toLocaleString('en-IN')}
                    </Text>
                    <Text
                      style={[
                        styles.entryTypeLabel,
                        { color: isGot ? colors.success : colors.destructive },
                      ]}
                    >
                      {isGot ? 'You Got' : 'You Gave'}
                    </Text>
                    <Text style={[styles.entryRunningBal, { color: colors.textSecondary }]}>
                      Bal. ₹ {runningBal.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Fixed Sticky Action Bar: "+ YOU GAVE ₹" & "+ YOU GOT ₹" */}
      <View style={[styles.stickyFooter, { backgroundColor: colors.bgCanvas, borderTopColor: colors.border }]}>
        <ScalePressable
          onPress={() => handleOpenTransaction('gave')}
          style={[styles.gaveBtn, { backgroundColor: colors.destructive }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.footerBtnText}>YOU GAVE ₹</Text>
          </View>
        </ScalePressable>

        <ScalePressable
          onPress={() => handleOpenTransaction('got')}
          style={[styles.gotBtn, { backgroundColor: colors.success }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.footerBtnText}>YOU GOT ₹</Text>
          </View>
        </ScalePressable>
      </View>

      <AddTransactionModal
        visible={txModalVisible}
        onClose={() => setTxModalVisible(false)}
        party={party}
        initialType={txModalType}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  headerProfileText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  headerShareBtn: {
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  /* Borderless Net Balance Card */
  balanceCard: {
    padding: 18,
    borderRadius: 16,
    marginBottom: 14,
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  balanceHeaderLabel: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 32,
    fontFamily: FONTS.bold,
    marginVertical: 2,
  },
  balanceStatusLabel: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  dueTodayText: {
    fontSize: 13,
    fontFamily: FONTS.bold,
    color: '#dc2626',
  },
  lastActiveText: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  actionBtnText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  /* Borderless Transaction Overview Card */
  overviewCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
  },
  overviewTitle: {
    fontSize: 11,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  overviewGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overviewCol: {
    flex: 1,
  },
  overviewLabel: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  overviewVal: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    marginTop: 2,
  },
  overviewDivider: {
    width: 1,
    height: 28,
    marginHorizontal: 8,
  },
  /* Entries Section Header */
  entriesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginTop: 4,
  },
  entriesSectionTitle: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  entriesLegend: {
    flexDirection: 'row',
    gap: 16,
  },
  legendText: {
    fontSize: 11,
    fontFamily: FONTS.bold,
  },
  /* Borderless Entries Feed */
  entriesContainer: {
    gap: 12,
    marginTop: 8,
  },
  entryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  entryLeftCol: {
    flex: 1,
    minWidth: 0,
  },
  entryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryTitle: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: FONTS.bold,
  },
  entrySubtitle: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
  entryDateText: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
  /* Clean & Prominent Simple Edit Icon Button */
  editIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  entryRightCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  entryAmountText: {
    fontSize: 17,
    fontFamily: FONTS.bold,
  },
  entryTypeLabel: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
    marginTop: 2,
  },
  entryRunningBal: {
    fontSize: 11,
    fontFamily: FONTS.regular,
    marginTop: 4,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyCardText: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    textAlign: 'center',
  },
  /* Fixed Sticky Bottom Action Bar */
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  gaveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
  },
  gotBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 3,
  },
  footerBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
});

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  BookOpen,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Share2,
  Calendar,
  CheckCircle2,
} from 'lucide-react-native';
import { THEME } from '../theme/theme';
import { useKhataStore } from '../store/useKhataStore';
import { Header } from '../components/common/Header';

interface PassbookItem {
  id: string;
  party: string;
  person: string;
  time: string;
  amount: number;
  type: 'inward' | 'outward';
  mode: string;
  txnId: string;
}

export default function PassbookScreen() {
  const router = useRouter();
  const { ledgerEntries, cashbookEntries, parties, business, isDarkMode } = useKhataStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filterOptions = [
    'All Transactions',
    'Inward',
    'Outward',
    'UPI',
    'Cash',
    'Bank Transfer',
  ];

  // Dynamic passbook entries derived from real transactions and cashbook
  const passbookData = useMemo<PassbookItem[]>(() => {
    const list: PassbookItem[] = [];

    // From real ledger transactions
    for (const tx of ledgerEntries) {
      const party = parties.find((p) => p.id === tx.partyId);
      list.push({
        id: tx.id,
        party: party ? party.name : 'Ledger Account',
        person: business.ownerName || 'Merchant',
        time: tx.date || 'Recent',
        amount: tx.amount,
        type: tx.type === 'got' ? 'inward' : 'outward',
        mode: tx.mode || 'Cash',
        txnId: `#TXN-${tx.id.slice(-4).toUpperCase()}`,
      });
    }

    // From cashbook entries
    for (const cb of cashbookEntries) {
      if (!list.some((item) => item.id === cb.id)) {
        list.push({
          id: cb.id,
          party: cb.title,
          person: business.ownerName || 'Merchant',
          time: cb.time ? `${cb.date}, ${cb.time}` : cb.date,
          amount: cb.amount,
          type: cb.type === 'in' ? 'inward' : 'outward',
          mode: cb.mode || 'Cash',
          txnId: `#CB-${cb.id.slice(-4).toUpperCase()}`,
        });
      }
    }

    return list;
  }, [ledgerEntries, cashbookEntries, parties, business.ownerName]);

  const filteredEntries = useMemo(() => {
    let list = passbookData;

    if (activeFilter === 'Inward') {
      list = list.filter((e) => e.type === 'inward');
    } else if (activeFilter === 'Outward') {
      list = list.filter((e) => e.type === 'outward');
    } else if (activeFilter === 'UPI' || activeFilter === 'Cash' || activeFilter === 'Bank Transfer') {
      list = list.filter((e) => e.mode.toLowerCase().includes(activeFilter.toLowerCase()));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.party.toLowerCase().includes(q) ||
          e.person.toLowerCase().includes(q) ||
          e.txnId.toLowerCase().includes(q)
      );
    }

    return list;
  }, [passbookData, activeFilter, searchQuery]);

  // Exact mathematical totals
  const totalInward = useMemo(
    () => passbookData.filter((e) => e.type === 'inward').reduce((sum, e) => sum + e.amount, 0),
    [passbookData]
  );
  const totalOutward = useMemo(
    () => passbookData.filter((e) => e.type === 'outward').reduce((sum, e) => sum + e.amount, 0),
    [passbookData]
  );
  const netCashFlow = totalInward - totalOutward;
  const totalEntries = passbookData.length;

  const handleShare = async () => {
    const bizName = business.name || 'Merchant';
    await Share.share({
      message: `${bizName} - Official Passbook Bank Statement\nTotal Inward: ₹ ${totalInward.toLocaleString('en-IN')}\nTotal Outward: ₹ ${totalOutward.toLocaleString('en-IN')}\nNet Cash Flow: ₹ ${netCashFlow.toLocaleString('en-IN')}`,
    });
  };

  const bgCanvas = isDarkMode ? THEME.colors.dark.bgCanvas : THEME.colors.bgCanvas;
  const bgCard = isDarkMode ? THEME.colors.dark.bgCard : THEME.colors.bgCard;
  const border = isDarkMode ? THEME.colors.dark.border : THEME.colors.border;
  const textPrimary = isDarkMode ? THEME.colors.dark.textPrimary : THEME.colors.textPrimary;
  const textMuted = isDarkMode ? THEME.colors.dark.textMuted : THEME.colors.textMuted;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: bgCanvas }]} edges={['top']}>
      <Header
        title="Passbook"
        subtitle="Account Statement & Verified Ledger"
        showBack
        rightAction={
          <TouchableOpacity
            onPress={handleShare}
            style={[styles.shareBtn, { backgroundColor: THEME.colors.primaryBg }]}
          >
            <Share2 size={16} color={THEME.colors.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={[styles.searchBar, { backgroundColor: bgCard, borderColor: border }]}>
          <Search size={16} color={textMuted} />
          <TextInput
            style={[styles.searchInput, { color: textPrimary }]}
            placeholder="Search passbook entries by ID or party"
            placeholderTextColor={textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {filterOptions.map((f) => {
            const isSelected = activeFilter === f || (f === 'All Transactions' && activeFilter === 'All');
            return (
              <TouchableOpacity
                key={f}
                onPress={() => setActiveFilter(f === 'All Transactions' ? 'All' : f)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected
                      ? THEME.colors.primary
                      : isDarkMode
                      ? '#334155'
                      : '#FFFFFF',
                    borderColor: isSelected ? THEME.colors.primary : border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected ? '#FFFFFF' : textPrimary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 4 Stat Cards calculated dynamically */}
        <View style={styles.statGrid}>
          <View style={[styles.statBox, { backgroundColor: bgCard, borderColor: border }]}>
            <Text style={[styles.statLabel, { color: textMuted }]}>Total Inward</Text>
            <Text style={[styles.statVal, { color: THEME.colors.success }]}>
              ₹ {totalInward.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: bgCard, borderColor: border }]}>
            <Text style={[styles.statLabel, { color: textMuted }]}>Total Outward</Text>
            <Text style={[styles.statVal, { color: THEME.colors.pink }]}>
              ₹ {totalOutward.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: bgCard, borderColor: border }]}>
            <Text style={[styles.statLabel, { color: textMuted }]}>Net Cash Flow</Text>
            <Text style={[styles.statVal, { color: THEME.colors.primary }]}>
              ₹ {netCashFlow.toLocaleString('en-IN')}
            </Text>
          </View>

          <View style={[styles.statBox, { backgroundColor: bgCard, borderColor: border }]}>
            <Text style={[styles.statLabel, { color: textMuted }]}>Total Entries</Text>
            <Text style={[styles.statVal, { color: textPrimary }]}>{totalEntries}</Text>
          </View>
        </View>

        {/* Entries Table */}
        <View style={styles.entriesList}>
          <Text style={[styles.listHeader, { color: textPrimary }]}>
            Verified Statements ({filteredEntries.length})
          </Text>

          {filteredEntries.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: bgCard, borderColor: border }]}>
              <Text style={[styles.emptyTitle, { color: textPrimary }]}>
                No passbook transactions found
              </Text>
              <Text style={[styles.emptySub, { color: textMuted }]}>
                Verified ledger receipts, payments, and bank settlements will appear here.
              </Text>
            </View>
          ) : (
            filteredEntries.map((item) => {
              const isInward = item.type === 'inward';
              return (
                <View
                  key={item.id}
                  style={[styles.entryCard, { backgroundColor: bgCard, borderColor: border }]}
                >
                  <View style={styles.entryLeft}>
                    <View
                      style={[
                        styles.iconCircle,
                        {
                          backgroundColor: isInward ? THEME.colors.successBg : THEME.colors.pinkBg,
                        },
                      ]}
                    >
                      {isInward ? (
                        <ArrowDownLeft size={16} color={THEME.colors.success} />
                      ) : (
                        <ArrowUpRight size={16} color={THEME.colors.pink} />
                      )}
                    </View>

                    <View style={styles.entryInfo}>
                      <Text style={[styles.partyName, { color: textPrimary }]}>{item.party}</Text>
                      <Text style={[styles.personText, { color: textMuted }]}>
                        {item.person} · {item.txnId}
                      </Text>
                      <Text style={[styles.timeText, { color: textMuted }]}>
                        {item.time} · {item.mode}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.entryRight}>
                    <Text
                      style={[
                        styles.amountText,
                        {
                          color: isInward ? THEME.colors.success : THEME.colors.pink,
                        },
                      ]}
                    >
                      {isInward ? '+' : '-'} ₹ {item.amount.toLocaleString('en-IN')}
                    </Text>

                    <View style={styles.badgeRow}>
                      <CheckCircle2 size={11} color={THEME.colors.success} />
                      <Text style={[styles.verifiedBadge, { color: THEME.colors.success }]}>
                        Verified
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  },
  shareBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  filterScroll: {
    marginTop: 12,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterChipText: {
    fontSize: 12,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '700',
  },
  entriesList: {
    gap: 10,
  },
  listHeader: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  entryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  entryInfo: {
    flex: 1,
  },
  partyName: {
    fontSize: 14,
    fontWeight: '600',
  },
  personText: {
    fontSize: 11,
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
    marginTop: 2,
  },
  entryRight: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  verifiedBadge: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
  },
});

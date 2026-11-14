import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  ListFilter,
  Plus,
  ChevronRight,
  Users,
} from 'lucide-react-native';
import {
  WireframeTabReports,
  WireframeBookIcon,
} from '../../components/common/WireframeIcons';
import { THEME, getThemeColors, FONTS } from '../../theme/theme';
import { useKhataStore, Party } from '../../store/useKhataStore';
import { Header } from '../../components/common/Header';
import { ScalePressable } from '../../components/common/ScalePressable';
import { FilterSortModal } from '../../components/modals/FilterSortModal';
import { LocationSelectorModal } from '../../components/modals/LocationSelectorModal';
import { AddTransactionModal } from '../../components/modals/AddTransactionModal';

export default function HomeScreen() {
  const router = useRouter();
  const { parties, isDarkMode, fetchInitialData, isLoading, pendingSyncCount } = useKhataStore();
  const colors = getThemeColors(isDarkMode);

  const [activeTab, setActiveTab] = useState<'customer' | 'supplier'>('customer');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Most Recent');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  }, [fetchInitialData]);

  // Modals
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [txModalVisible, setTxModalVisible] = useState(false);
  const [selectedPartyForTx, setSelectedPartyForTx] = useState<Party | null>(null);

  // Filter and sort parties
  const filteredParties = useMemo(() => {
    let list = parties.filter((p) => p.type === activeTab);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.phone.toLowerCase().includes(q) ||
          (p.address && p.address.toLowerCase().includes(q))
      );
    }

    if (selectedFilter !== 'All') {
      if (selectedFilter === 'You will get') {
        list = list.filter((p) => p.balanceType === 'get' && p.balance > 0);
      } else if (selectedFilter === 'You will give') {
        list = list.filter((p) => p.balanceType === 'give' && p.balance > 0);
      } else if (selectedFilter === 'Settled') {
        list = list.filter((p) => p.balance === 0 || p.balanceType === 'settled');
      } else if (selectedFilter === 'Due Today') {
        list = list.filter((p) => p.status === 'Due Today');
      } else if (selectedFilter === 'Upcoming') {
        list = list.filter((p) => p.status === 'Upcoming');
      } else if (selectedFilter === 'No Due Date') {
        list = list.filter((p) => p.status === 'No Due Date');
      }
    }

    // Sort
    if (selectedSort === 'Highest Amount') {
      list.sort((a, b) => b.balance - a.balance);
    } else if (selectedSort === 'Least Amount') {
      list.sort((a, b) => a.balance - b.balance);
    } else if (selectedSort === 'By Name (A-Z)') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (selectedSort === 'Oldest') {
      list.reverse();
    }

    return list;
  }, [parties, activeTab, searchQuery, selectedFilter, selectedSort]);

  // Aggregate numbers
  const customersList = parties.filter((p) => p.type === 'customer');
  const suppliersList = parties.filter((p) => p.type === 'supplier');

  const youWillGetTotal = parties.reduce(
    (sum, p) => (p.balanceType === 'get' ? sum + p.balance : sum),
    0
  );
  const youWillGiveTotal = parties.reduce(
    (sum, p) => (p.balanceType === 'give' ? sum + p.balance : sum),
    0
  );
  const netBalance = youWillGetTotal - youWillGiveTotal;

  const currentTabBalance = activeTab === 'customer'
    ? customersList.reduce((sum, p) => (p.balanceType === 'get' ? sum + p.balance : p.balanceType === 'give' ? sum - p.balance : sum), 0)
    : suppliersList.reduce((sum, p) => (p.balanceType === 'give' ? sum + p.balance : p.balanceType === 'get' ? sum - p.balance : sum), 0);

  // Customer Card matching wireframe with spring physics & memoization
  const renderPartyItem = useCallback(
    ({ item }: { item: Party }) => {
      const isGet = item.balanceType === 'get' && item.balance > 0;
      const isGive = item.balanceType === 'give' && item.balance > 0;
      const isSettled = item.balance === 0 || item.balanceType === 'settled';

      return (
        <ScalePressable
          style={[
            styles.partyCard,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
          scaleTo={0.98}
          onPress={() => router.push(`/party/${item.id}`)}
        >
          {/* Greyscale Avatar Circle */}
          <View
            style={[
              styles.avatarCircle,
              {
                backgroundColor: colors.bgSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            <Text style={[styles.avatarText, { color: colors.textPrimary }]}>
              {item.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </Text>
          </View>

          <View style={styles.partyDetails}>
            {/* Row 1: Name on Left, Amount on Right */}
            <View style={styles.partyRowBetween}>
              <Text style={[styles.partyName, { color: colors.textPrimary }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text
                style={[
                  styles.partyAmount,
                  {
                    color: isGet ? colors.success : isGive ? colors.destructive : colors.textPrimary,
                  },
                ]}
              >
                {isSettled ? '₹ 0' : `₹ ${item.balance.toLocaleString('en-IN')}`}
              </Text>
            </View>

            {/* Row 2: Subtitle on Left, Balance Label on Right */}
            <View style={[styles.partyRowBetween, { marginTop: 4 }]}>
              <Text style={[styles.partySub, { color: colors.textSecondary }]}>
                {item.lastTxDate} • {item.phone}
              </Text>
              <Text
                style={[
                  styles.partyAmountLabel,
                  {
                    color: isGet ? colors.success : isGive ? colors.destructive : colors.textSecondary,
                  },
                ]}
              >
                {isGet ? 'You will get' : isGive ? 'You will give' : 'Settled'}
              </Text>
            </View>

            {/* Row 3: Due Status */}
            {item.status ? (
              <View style={{ marginTop: 6 }}>
                <Text
                  style={[
                    styles.dueStatusText,
                    {
                      color:
                        item.status === 'Due Today'
                          ? colors.destructive
                          : item.status.toLowerCase().includes('due in') ||
                            item.status.toLowerCase().includes('upcoming') ||
                            item.status.toLowerCase().includes('days')
                          ? colors.warning
                          : item.status === 'Settled'
                          ? colors.success
                          : colors.textSecondary,
                    },
                  ]}
                >
                  {item.status}
                </Text>
              </View>
            ) : null}
          </View>
        </ScalePressable>
      );
    },
    [colors, router]
  );

  const keyExtractor = useCallback((item: Party) => item.id, []);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgCanvas }]} edges={['top']}>
      {/* App Bar with Location and 3 borderless icons */}
      <Header
        showLocation
        onLocationPress={() => setLocationModalVisible(true)}
      />

      {/* Tabs: CUSTOMERS (24) vs SUPPLIERS (12) matching home.html 1_tabs */}
      <View
        style={[
          styles.tabsHeader,
          {
            backgroundColor: colors.bgCanvas,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => setActiveTab('customer')}
          style={[
            styles.mainTabBtn,
            activeTab === 'customer' && [
              styles.mainTabBtnActive,
              { borderBottomColor: colors.textPrimary },
            ],
          ]}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.mainTabText,
              {
                color: activeTab === 'customer' ? colors.textPrimary : colors.textSecondary,
                fontFamily: activeTab === 'customer' ? FONTS.bold : FONTS.medium,
              },
            ]}
          >
            CUSTOMERS
          </Text>
          <View
            style={[
              styles.countPill,
              activeTab === 'customer'
                ? { backgroundColor: colors.bgSecondary }
                : { borderWidth: 1, borderColor: colors.border, backgroundColor: 'transparent' },
            ]}
          >
            <Text
              style={[
                styles.countText,
                {
                  color: activeTab === 'customer' ? colors.textPrimary : colors.textSecondary,
                  fontFamily: FONTS.semiBold,
                },
              ]}
            >
              {customersList.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('supplier')}
          style={[
            styles.mainTabBtn,
            activeTab === 'supplier' && [
              styles.mainTabBtnActive,
              { borderBottomColor: colors.textPrimary },
            ],
          ]}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.mainTabText,
              {
                color: activeTab === 'supplier' ? colors.textPrimary : colors.textSecondary,
                fontFamily: activeTab === 'supplier' ? FONTS.bold : FONTS.medium,
              },
            ]}
          >
            SUPPLIERS
          </Text>
          <View
            style={[
              styles.countPill,
              activeTab === 'supplier'
                ? { backgroundColor: colors.bgSecondary }
                : { borderWidth: 1, borderColor: colors.border, backgroundColor: 'transparent' },
            ]}
          >
            <Text
              style={[
                styles.countText,
                {
                  color: activeTab === 'supplier' ? colors.textPrimary : colors.textSecondary,
                  fontFamily: FONTS.semiBold,
                },
              ]}
            >
              {suppliersList.length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Main Body */}
      <View style={styles.body}>
        {/* Status Card (Net Balance) matching home.html 2_statuscard */}
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: colors.bgCard,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Card Top: Tile + Title + Net Balance */}
          <View style={styles.statusCardTop}>
            <View style={[styles.statusTile, { backgroundColor: colors.bgSecondary }]}>
              <WireframeTabReports size={22} color={colors.textPrimary} strokeWidth={1.8} />
            </View>

            <View style={styles.statusContent}>
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
                {activeTab === 'customer' ? 'Net Customer Balance' : 'Net Supplier Balance'}
              </Text>
              <Text style={[styles.netBalanceAmount, { color: colors.textPrimary }]}>
                ₹ {Math.abs(currentTabBalance).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>

          {/* Corner-to-Corner Give & Get Simple Text (No Inner Borders) */}
          <View style={styles.giveGetTextRow}>
            <Text style={[styles.giveGetLabel, { color: colors.textSecondary }]}>
              You will give:{' '}
              <Text style={{ color: colors.destructive, fontFamily: FONTS.bold }}>
                ₹ {youWillGiveTotal.toLocaleString('en-IN')}
              </Text>
            </Text>

            <Text style={[styles.giveGetLabel, { color: colors.textSecondary }]}>
              You will get:{' '}
              <Text style={{ color: colors.success, fontFamily: FONTS.bold }}>
                ₹ {youWillGetTotal.toLocaleString('en-IN')}
              </Text>
            </Text>
          </View>

          {/* Full-width sleek action button matching wu-btn--default */}
          <ScalePressable
            onPress={() => router.push('/(tabs)/reports')}
            style={[
              styles.viewReportsBtn,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              },
            ]}
            scaleTo={0.98}
          >
            <Text style={[styles.viewReportsText, { color: colors.textPrimary }]}>
              View Reports
            </Text>
          </ScalePressable>
        </View>

        {/* Control Row: Search, Filters, Cashbook */}
        <View style={styles.controlRow}>
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              },
            ]}
          >
            <Search size={15} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder={`Search ${activeTab === 'customer' ? 'Customer' : 'Supplier'}...`}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScalePressable
            onPress={() => setFilterModalVisible(true)}
            style={[
              styles.controlBtn,
              {
                backgroundColor:
                  selectedFilter !== 'All' ? colors.primary : colors.bgCard,
                borderColor: colors.border,
              },
            ]}
            scaleTo={0.95}
          >
            <ListFilter
              size={15}
              color={selectedFilter !== 'All' ? colors.primaryForeground : colors.textPrimary}
            />
            <Text
              style={[
                styles.controlBtnText,
                {
                  color: selectedFilter !== 'All' ? colors.primaryForeground : colors.textPrimary,
                },
              ]}
            >
              Filters
            </Text>
          </ScalePressable>

          <ScalePressable
            onPress={() => router.push('/cashbook')}
            style={[
              styles.controlBtn,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
              },
            ]}
            scaleTo={0.95}
          >
            <WireframeBookIcon size={15} color={colors.textPrimary} />
            <Text style={[styles.controlBtnText, { color: colors.textPrimary }]}>Cashbook</Text>
          </ScalePressable>
        </View>

        {/* Section Header: ACTIVE CUSTOMERS (3) matching home.html */}
        <View style={styles.listSectionHeader}>
          <Text style={[styles.listSectionTitle, { color: colors.textSecondary }]}>
            ACTIVE {activeTab.toUpperCase()}S ({filteredParties.length})
          </Text>
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={[styles.clearText, { color: colors.textSecondary }]}>Clear to Empty</Text>
          </TouchableOpacity>
        </View>

        {/* List Content */}
        <FlatList
          data={filteredParties}
          keyExtractor={keyExtractor}
          renderItem={renderPartyItem}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          contentContainerStyle={[
            styles.listContent,
            filteredParties.length === 0 && { flexGrow: 1, justifyContent: 'center' },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerState}>
              <View style={[styles.emptyIconCircle, { backgroundColor: colors.bgSecondary }]}>
                <Users size={36} color={colors.textSecondary} />
              </View>
              <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>
                No {activeTab}s found
              </Text>
              <Text style={[styles.stateDesc, { color: colors.textSecondary }]}>
                Add {activeTab}s & collect payments faster with automated reminders
              </Text>
              <TouchableOpacity
                onPress={() =>
                  router.push(activeTab === 'customer' ? '/add-customer' : '/add-customer-supplier')
                }
                style={[styles.emptyAddBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.85}
              >
                <Plus size={16} color={colors.primaryForeground} strokeWidth={2.5} />
                <Text style={[styles.emptyAddBtnText, { color: colors.primaryForeground }]}>
                  Add {activeTab === 'customer' ? 'Customer' : 'Supplier'}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>

      {/* Floating Action Button for Add Customer / Supplier at bottom: 94px */}
      <ScalePressable
        onPress={() =>
          router.push(activeTab === 'customer' ? '/add-customer' : '/add-customer-supplier')
        }
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
          },
        ]}
        scaleTo={0.94}
      >
        <Plus size={18} color={colors.primaryForeground} strokeWidth={2.5} />
        <Text style={[styles.fabText, { color: colors.primaryForeground }]}>
          Add {activeTab === 'customer' ? 'Customer' : 'Supplier'}
        </Text>
      </ScalePressable>

      {/* Modals */}
      <FilterSortModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        selectedFilter={selectedFilter}
        selectedSort={selectedSort}
        onApply={(filter, sort) => {
          setSelectedFilter(filter);
          setSelectedSort(sort);
        }}
      />

      <LocationSelectorModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
      />

      <AddTransactionModal
        visible={txModalVisible}
        onClose={() => setTxModalVisible(false)}
        party={selectedPartyForTx}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  tabsHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 8,
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  mainTabBtnActive: {
    borderBottomWidth: 2,
  },
  mainTabText: {
    fontSize: 13,
    letterSpacing: 0.5,
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 14,
  },
  countText: {
    fontSize: 11,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  statusCard: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    marginBottom: 14,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  statusCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  statusTile: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContent: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    letterSpacing: 0.2,
  },
  netBalanceAmount: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    marginTop: 2,
    marginBottom: 0,
  },
  giveGetTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 4,
  },
  giveGetLabel: {
    fontSize: 12.5,
    fontFamily: FONTS.medium,
    letterSpacing: 0.1,
  },
  giveAmount: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  getAmount: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  viewReportsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  viewReportsText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  controlRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.regular,
    padding: 0,
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    height: 42,
    gap: 6,
  },
  controlBtnText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  listContent: {
    paddingBottom: 110,
  },
  partyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  partyDetails: {
    flex: 1,
    minWidth: 0,
  },
  partyRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partyName: {
    fontSize: 15,
    fontFamily: FONTS.bold,
    flex: 1,
    marginRight: 8,
  },
  partyAmount: {
    fontSize: 15,
    fontFamily: FONTS.bold,
  },
  partySub: {
    fontSize: 12,
    fontFamily: FONTS.regular,
  },
  partyAmountLabel: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
  },
  dueStatusText: {
    fontSize: 11,
    fontFamily: FONTS.semiBold,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stateTitle: {
    fontSize: 16,
    fontFamily: FONTS.bold,
    marginBottom: 6,
  },
  stateDesc: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 280,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 999,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
  fab: {
    position: 'absolute',
    bottom: 94,
    right: 20,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 999,
  },
  fabText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  listSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  listSectionTitle: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    letterSpacing: 0.5,
  },
  clearText: {
    fontSize: 11,
    fontFamily: FONTS.medium,
  },
});

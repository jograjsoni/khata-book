import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { THEME, getThemeColors, FONTS } from '../theme/theme';
import { useKhataStore } from '../store/useKhataStore';
import { Header } from '../components/common/Header';
import {
  WireframeSimpleStarIcon,
  WireframePaymentIcon,
  WireframeDueAlertIcon,
  WireframeMessageSquareIcon,
  WireframeShieldIcon,
} from '../components/common/WireframeIcons';

interface NotificationItem {
  id: string;
  type: 'payment' | 'due' | 'system' | 'sms' | 'ai';
  title: string;
  message: string;
  time: string;
  read: boolean;
  amount?: number;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { parties, ledgerEntries, bills, isDarkMode } = useKhataStore();
  const colors = getThemeColors(isDarkMode);

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [readIds, setReadIds] = useState<string[]>([]);

  const dynamicNotifications = useMemo<NotificationItem[]>(() => {
    const list: NotificationItem[] = [];

    // Due today parties
    const dueParties = parties.filter((p) => p.status === 'Due Today' && p.balance > 0);
    dueParties.forEach((p, idx) => {
      const nid = `due-${p.id}-${idx}`;
      list.push({
        id: nid,
        type: 'due',
        title: 'Payment Due Today',
        message: `Reminder: ₹ ${p.balance.toLocaleString('en-IN')} pending from ${p.name}.`,
        time: p.lastTxDate || 'Today',
        read: readIds.includes(nid),
        amount: p.balance,
      });
    });

    // Recent payments received
    const recentPayments = ledgerEntries.filter((e) => e.type === 'got').slice(0, 4);
    recentPayments.forEach((e) => {
      const nid = `pay-${e.id}`;
      const party = parties.find((p) => p.id === e.partyId);
      list.push({
        id: nid,
        type: 'payment',
        title: 'Payment Received',
        message: `${party ? party.name : 'Customer'} settled ₹ ${e.amount.toLocaleString('en-IN')} via ${e.mode}.`,
        time: e.date || 'Recent',
        read: readIds.includes(nid),
        amount: e.amount,
      });
    });

    // Overdue bills
    const overdueBills = bills.filter((b) => b.status === 'Overdue');
    overdueBills.forEach((b) => {
      const nid = `bill-${b.id}`;
      list.push({
        id: nid,
        type: 'due',
        title: 'Invoice Overdue',
        message: `Bill #${b.billNumber} for ${b.partyName} of ₹ ${b.amount.toLocaleString('en-IN')} is overdue.`,
        time: b.dueDate || 'Overdue',
        read: readIds.includes(nid),
        amount: b.amount,
      });
    });

    if (parties.length > 0 || ledgerEntries.length > 0) {
      list.push({
        id: 'sys-sync',
        type: 'system',
        title: 'Cloud Ledger Backup',
        message: 'Your accounts, bills, and transactions have been securely synced with the server.',
        time: 'Today',
        read: readIds.includes('sys-sync'),
      });
    }

    return list;
  }, [parties, ledgerEntries, bills, readIds]);

  const filtered = dynamicNotifications.filter((n) => (activeTab === 'unread' ? !n.read : true));

  const markAllAsRead = () => {
    setReadIds(dynamicNotifications.map((n) => n.id));
  };

  const renderIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'payment':
        return <WireframePaymentIcon size={18} color={colors.textPrimary} strokeWidth={1.8} />;
      case 'due':
        return <WireframeDueAlertIcon size={18} color={colors.textPrimary} strokeWidth={1.8} />;
      case 'ai':
        // Clean Simple Star icon requested by user
        return <WireframeSimpleStarIcon size={18} color={colors.textPrimary} strokeWidth={1.8} />;
      case 'sms':
        return <WireframeMessageSquareIcon size={18} color={colors.textPrimary} strokeWidth={1.8} />;
      case 'system':
        return <WireframeShieldIcon size={18} color={colors.textPrimary} strokeWidth={1.8} />;
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bgCanvas }]} edges={['top']}>
      <Header
        title="Notifications"
        subtitle="Alerts & Reminders"
        showBack
        rightAction={
          <TouchableOpacity onPress={markAllAsRead} style={styles.markReadBtn} activeOpacity={0.7}>
            <Text style={[styles.markReadText, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        }
      />

      {/* Filter Tabs */}
      <View style={[styles.tabsRow, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('all')}
          style={[styles.tabBtn, activeTab === 'all' && [styles.tabBtnActive, { borderBottomColor: colors.primary }]]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'all' ? colors.primary : colors.textSecondary,
                fontFamily: activeTab === 'all' ? FONTS.bold : FONTS.medium,
              },
            ]}
          >
            All Alerts ({dynamicNotifications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('unread')}
          style={[styles.tabBtn, activeTab === 'unread' && [styles.tabBtnActive, { borderBottomColor: colors.primary }]]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: activeTab === 'unread' ? colors.primary : colors.textSecondary,
                fontFamily: activeTab === 'unread' ? FONTS.bold : FONTS.medium,
              },
            ]}
          >
            Unread ({dynamicNotifications.filter((n) => !n.read).length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.notificationCard,
              {
                backgroundColor: item.read ? colors.bgCard : (isDarkMode ? '#1e293b' : '#f8fafc'),
                borderColor: item.read ? colors.border : (isDarkMode ? '#334155' : '#cbd5e1'),
              },
            ]}
            onPress={() => {
              if (item.type === 'ai') {
                router.push('/ai-assistant');
              }
            }}
            activeOpacity={0.75}
          >
            {/* Flat black-and-white icon container */}
            <View style={[styles.iconCircle, { backgroundColor: colors.bgSecondary, borderColor: colors.border }]}>
              {renderIcon(item.type)}
            </View>

            <View style={styles.contentCol}>
              <View style={styles.titleRow}>
                <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                <Text style={[styles.itemTime, { color: colors.textMuted }]}>{item.time}</Text>
              </View>
              <Text style={[styles.itemMsg, { color: colors.textSecondary }]}>{item.message}</Text>
              {item.amount ? (
                <Text style={[styles.amountTag, { color: colors.textPrimary }]}>
                  Amount: <Text style={{ color: colors.textPrimary, fontFamily: FONTS.bold }}>₹ {item.amount.toLocaleString('en-IN')}</Text>
                </Text>
              ) : null}
            </View>

            {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, fontFamily: FONTS.semiBold, color: colors.textPrimary, marginBottom: 4 }}>
              No notifications
            </Text>
            <Text style={{ fontSize: 12, fontFamily: FONTS.regular, color: colors.textSecondary, textAlign: 'center' }}>
              New alerts for due payments, collections, and backups will appear here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  markReadBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  markReadText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tabBtn: {
    paddingVertical: 12,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 13,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCol: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: FONTS.bold,
  },
  itemTime: {
    fontSize: 11,
    fontFamily: FONTS.regular,
  },
  itemMsg: {
    fontSize: 12,
    fontFamily: FONTS.regular,
    lineHeight: 17,
  },
  amountTag: {
    fontSize: 12,
    fontFamily: FONTS.medium,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    alignSelf: 'center',
  },
});

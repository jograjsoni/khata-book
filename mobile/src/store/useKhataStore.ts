import { create } from 'zustand';
import { api } from '../services/apiService';
import { sqliteService } from '../services/sqliteService';

export interface Party {
  id: string;
  name: string;
  phone: string;
  email?: string;
  pan?: string;
  aadhaar?: string;
  type: 'customer' | 'supplier';
  balance: number; // positive = you will get / give depending on type
  balanceType: 'get' | 'give' | 'settled';
  lastTxDate: string;
  status: 'Due Today' | 'Upcoming' | 'No Due Date' | 'Settled' | 'Pending' | 'Due in 3 days' | string;
  address?: string;
  gstin?: string;
  creditLimit?: number;
  riskLevel?: 'Low' | 'Medium' | 'High';
  businessHours?: string;
}

export interface LedgerEntry {
  id: string;
  partyId: string;
  amount: number;
  type: 'gave' | 'got'; // gave = debit/cash out, got = credit/cash in
  date: string;
  note: string;
  mode: 'Cash' | 'UPI Transfer' | 'Bank Transfer' | string;
  verified: boolean;
  billPhoto?: string;
  utr?: string;
  bankDetails?: string;
}

export interface CashbookEntry {
  id: string;
  title: string;
  partyName?: string;
  subtitle: string;
  amount: number;
  type: 'in' | 'out';
  date: string;
  time: string;
  mode: 'UPI Transfer' | 'Cash' | 'Bank Transfer';
  status: 'Verified' | 'Paid' | 'Pending';
}

export interface Bill {
  id: string;
  billNumber: string;
  partyName: string;
  amount: number;
  status: 'Pending' | 'Paid' | 'Overdue';
  date: string;
  dueDate: string;
  itemsSummary?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  shelf: string;
  category: string;
  stock: number;
  unit: string;
  price: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface PaymentLink {
  id: string;
  title: string;
  customerName: string;
  amount: number;
  status: 'Active' | 'Expired';
  methods: string;
  createdDate: string;
  linkUrl: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  salary: number;
  salaryPeriod: string;
  joinedDate: string;
  attendance: 'Present' | 'Absent' | 'On Leave';
  salaryStatus: 'Paid' | 'Unpaid';
  phone?: string;
}

export interface BusinessProfile {
  name: string;
  ownerName: string;
  category: string;
  gstin: string;
  pan?: string;
  email?: string;
  phone: string;
  address: string;
  city: string;
  businessType: string;
  bankAccount: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId: string;
  registrationNumber: string;
  profileStrength: number;
  rewardCoins: number;
}

export function calculateProfileStrength(profile: BusinessProfile): number {
  const fields = [
    profile.name,
    profile.ownerName,
    profile.phone,
    profile.email,
    profile.category,
    profile.address,
    profile.city,
    profile.bankName || profile.bankAccount,
    profile.accountNumber,
    profile.ifscCode,
    profile.upiId,
    profile.gstin || profile.pan,
  ];
  const filled = fields.filter((f) => f && f.toString().trim().length > 0).length;
  return Math.round((filled / fields.length) * 100);
}

export const DEFAULT_BUSINESS: BusinessProfile = {
  name: 'My Khata Business',
  ownerName: 'Merchant Owner',
  category: 'Wholesale & Retail',
  gstin: '',
  pan: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  businessType: 'Retailer',
  bankAccount: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  upiId: '',
  registrationNumber: '',
  profileStrength: 50,
  rewardCoins: 100,
};

export interface KhataState {
  business: BusinessProfile;
  parties: Party[];
  ledgerEntries: LedgerEntry[];
  cashbookEntries: CashbookEntry[];
  bills: Bill[];
  items: InventoryItem[];
  paymentLinks: PaymentLink[];
  staff: StaffMember[];
  isLoading: boolean;
  error: string | null;
  pendingSyncCount: number;

  // Settings
  smsAlerts: boolean;
  paymentConfirmationSms: boolean;
  dailySummarySms: boolean;
  appLockEnabled: boolean;
  biometricUnlock: boolean;
  autoLockTimeout: string;
  pin: string;
  isDarkMode: boolean;

  // Sync actions
  fetchInitialData: () => Promise<void>;
  fetchParties: (type?: 'customer' | 'supplier', search?: string) => Promise<void>;
  fetchTransactions: (partyId?: string) => Promise<void>;
  fetchCashbook: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  syncPendingQueue: () => Promise<void>;

  // Local & Persisted Actions
  toggleDarkMode: () => void;
  updateBusiness: (updates: Partial<BusinessProfile>) => void;
  addParty: (party: Omit<Party, 'id'>) => string;
  updateParty: (id: string, updates: Partial<Party>) => void;
  deleteParty: (id: string) => Promise<void>;
  addLedgerEntry: (entry: Omit<LedgerEntry, 'id'>) => Promise<void>;
  addCashbookEntry: (entry: Omit<CashbookEntry, 'id'>) => Promise<void>;
  addBill: (bill: Omit<Bill, 'id'>) => void;
  updateBillStatus: (id: string, status: Bill['status']) => void;
  addItem: (item: Omit<InventoryItem, 'id'>) => void;
  addPaymentLink: (link: Omit<PaymentLink, 'id'>) => void;
  updateStaffAttendance: (id: string, attendance: StaffMember['attendance']) => void;
  toggleStaffSalaryStatus: (id: string) => void;
  addStaff: (member: Omit<StaffMember, 'id'>) => void;
  updateSettings: (updates: Partial<{
    smsAlerts: boolean;
    paymentConfirmationSms: boolean;
    dailySummarySms: boolean;
    appLockEnabled: boolean;
    biometricUnlock: boolean;
    autoLockTimeout: string;
    pin: string;
  }>) => void;
  addRewardCoins: (amount: number) => void;
}

export const useKhataStore = create<KhataState>((set, get) => ({
  business: DEFAULT_BUSINESS,
  parties: [],
  ledgerEntries: [],
  cashbookEntries: [],
  bills: [],
  items: [],
  paymentLinks: [],
  staff: [],
  isLoading: false,
  error: null,
  pendingSyncCount: 0,

  smsAlerts: true,
  paymentConfirmationSms: true,
  dailySummarySms: false,
  appLockEnabled: false,
  biometricUnlock: true,
  autoLockTimeout: 'Immediately',
  pin: '1234',
  isDarkMode: false,

  fetchInitialData: async () => {
    set({ isLoading: true, error: null });

    // Step 1: Instantly hydrate from local SQLite persistence (zero latency launch)
    try {
      await sqliteService.init();
      const [localParties, localLedger, localCashbook, localProfile, pendingCount] = await Promise.all([
        sqliteService.getParties(),
        sqliteService.getTransactions(),
        sqliteService.getCashbook(),
        sqliteService.getProfile(),
        sqliteService.getPendingSyncCount(),
      ]);

      const initialUpdates: Partial<KhataState> = {
        pendingSyncCount: pendingCount,
      };

      if (localParties && localParties.length > 0) {
        initialUpdates.parties = localParties;
      }
      if (localLedger && localLedger.length > 0) {
        initialUpdates.ledgerEntries = localLedger;
      }
      if (localCashbook && localCashbook.length > 0) {
        initialUpdates.cashbookEntries = localCashbook;
      }
      if (localProfile) {
        initialUpdates.business = localProfile;
      }

      set(initialUpdates);
    } catch (e: any) {
      console.warn('[store] SQLite hydration warning:', e?.message);
    }

    // Step 2: Background sync with backend API (pull latest data & reconcile)
    try {
      const [profileRes, partiesRes, txRes, cashbookRes] = await Promise.allSettled([
        api.getProfile(),
        api.getParties(),
        api.getTransactions(),
        api.getCashbook(),
      ]);

      const updates: Partial<KhataState> = { isLoading: false };

      if (profileRes.status === 'fulfilled' && profileRes.value?.user?.businessProfile) {
        const bp = profileRes.value.user.businessProfile;
        const merged: BusinessProfile = {
          ...DEFAULT_BUSINESS,
          ...bp,
          ownerName: profileRes.value.user.name || bp.ownerName || '',
          email: profileRes.value.user.email || bp.email || '',
          phone: profileRes.value.user.phone || bp.phone || '',
        };
        merged.profileStrength = calculateProfileStrength(merged);
        updates.business = merged;
        sqliteService.saveProfile(merged).catch(() => {});
      }

      if (partiesRes.status === 'fulfilled' && Array.isArray(partiesRes.value?.data)) {
        updates.parties = partiesRes.value.data;
        // Persist fresh server state to SQLite
        for (const p of partiesRes.value.data) {
          sqliteService.saveParty(p, 'synced').catch(() => {});
        }
      }

      if (txRes.status === 'fulfilled' && Array.isArray(txRes.value?.data)) {
        updates.ledgerEntries = txRes.value.data;
      }

      if (cashbookRes.status === 'fulfilled' && Array.isArray(cashbookRes.value?.data)) {
        updates.cashbookEntries = cashbookRes.value.data;
      }

      set(updates);

      // Attempt to sync any pending offline queue items
      get().syncPendingQueue();
    } catch (err: any) {
      console.warn('[store] fetchInitialData network notice (running offline):', err.message);
      set({ isLoading: false });
    }
  },

  syncPendingQueue: async () => {
    try {
      const queue = await sqliteService.getSyncQueueItems();
      if (!queue || queue.length === 0) {
        set({ pendingSyncCount: 0 });
        return;
      }

      for (const item of queue) {
        try {
          const payload = JSON.parse(item.payload);
          if (item.entityType === 'party' && item.action === 'create') {
            await api.createParty(payload);
            await sqliteService.removeSyncQueueItem(item.id);
          } else if (item.entityType === 'party' && item.action === 'update') {
            await api.updateParty(item.entityId, payload);
            await sqliteService.removeSyncQueueItem(item.id);
          } else if (item.entityType === 'party' && item.action === 'delete') {
            await api.deleteParty(item.entityId);
            await sqliteService.removeSyncQueueItem(item.id);
          } else if (item.entityType === 'ledger' && item.action === 'create') {
            await api.addTransaction({
              id: payload.id,
              partyId: payload.partyId,
              amount: payload.amount,
              type: payload.type,
              note: payload.note,
              mode: payload.mode,
              billPhoto: payload.billPhoto,
              date: payload.date,
            });
            await sqliteService.removeSyncQueueItem(item.id);
          } else if (item.entityType === 'cashbook' && item.action === 'create') {
            await api.addCashbook({
              id: payload.id,
              title: payload.title,
              subtitle: payload.subtitle,
              amount: payload.amount,
              type: payload.type,
              mode: payload.mode,
            });
            await sqliteService.removeSyncQueueItem(item.id);
          } else if (item.entityType === 'profile' && item.action === 'update') {
            await api.updateProfile(payload);
            await sqliteService.removeSyncQueueItem(item.id);
          }
        } catch (syncErr) {
          // If network error during sync, stop and retry on next cycle
          break;
        }
      }

      const remaining = await sqliteService.getPendingSyncCount();
      set({ pendingSyncCount: remaining });
    } catch (err) {
      console.warn('[store] syncPendingQueue error:', err);
    }
  },

  fetchParties: async (type, search) => {
    try {
      const local = await sqliteService.getParties(type, search);
      if (local && local.length > 0) {
        set({ parties: local });
      }

      const res = await api.getParties(type, search);
      if (res?.data && Array.isArray(res.data)) {
        set({ parties: res.data });
        for (const p of res.data) {
          sqliteService.saveParty(p, 'synced').catch(() => {});
        }
      }
    } catch (err: any) {
      console.warn('[store] fetchParties notice:', err.message);
    }
  },

  fetchTransactions: async (partyId) => {
    try {
      const local = await sqliteService.getTransactions(partyId);
      if (local && local.length > 0) {
        if (partyId) {
          set((state) => ({
            ledgerEntries: [
              ...state.ledgerEntries.filter((e) => e.partyId !== partyId),
              ...local,
            ],
          }));
        } else {
          set({ ledgerEntries: local });
        }
      }

      const res = await api.getTransactions(partyId);
      if (res?.data && Array.isArray(res.data)) {
        if (partyId) {
          set((state) => ({
            ledgerEntries: [
              ...state.ledgerEntries.filter((e) => e.partyId !== partyId),
              ...res.data,
            ],
          }));
        } else {
          set({ ledgerEntries: res.data });
        }
      }
    } catch (err: any) {
      console.warn('[store] fetchTransactions notice:', err.message);
    }
  },

  fetchCashbook: async () => {
    try {
      const local = await sqliteService.getCashbook();
      if (local && local.length > 0) {
        set({ cashbookEntries: local });
      }

      const res = await api.getCashbook();
      if (res?.data && Array.isArray(res.data)) {
        set({ cashbookEntries: res.data });
      }
    } catch (err: any) {
      console.warn('[store] fetchCashbook notice:', err.message);
    }
  },

  fetchProfile: async () => {
    try {
      const local = await sqliteService.getProfile();
      if (local) {
        set({ business: local });
      }

      const res = await api.getProfile();
      if (res?.user?.businessProfile) {
        const bp = res.user.businessProfile;
        set((state) => {
          const merged: BusinessProfile = {
            ...state.business,
            ...bp,
            ownerName: res.user.name || bp.ownerName || state.business.ownerName,
            email: res.user.email || bp.email || state.business.email,
            phone: res.user.phone || bp.phone || state.business.phone,
          };
          merged.profileStrength = calculateProfileStrength(merged);
          sqliteService.saveProfile(merged).catch(() => {});
          return { business: merged };
        });
      }
    } catch (err: any) {
      console.warn('[store] fetchProfile notice:', err.message);
    }
  },

  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

  updateBusiness: (updates) => {
    set((state) => {
      const next = { ...state.business, ...updates };
      next.profileStrength = calculateProfileStrength(next);
      sqliteService.saveProfile(next).catch(() => {});
      return { business: next };
    });
    api.updateProfile(updates)
      .then(() => {
        sqliteService.removeSyncQueueItemByEntity('profile', 'active_profile').catch(() => {});
      })
      .catch((err) => {
        console.warn('[store] Failed to persist profile to backend (queued offline):', err.message);
        sqliteService.enqueueSync('profile', 'active_profile', 'update', updates).catch(() => {});
        set((state) => ({ pendingSyncCount: state.pendingSyncCount + 1 }));
      });
  },

  addParty: (newParty) => {
    const tempId = `party-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fullParty: Party = {
      id: tempId,
      ...newParty,
    };

    // Instant local state update
    set((state) => ({
      parties: [fullParty, ...state.parties],
    }));

    // Persist to local SQLite
    sqliteService.saveParty(fullParty, 'pending').catch(() => {});

    // Asynchronously sync to backend API (transmitting exact ID so offline references remain valid)
    api.createParty(fullParty)
      .then((res) => {
        const partyId = res?.data?.id || tempId;
        const serverParty: Party = { ...fullParty, id: partyId };
        if (partyId !== tempId) {
          set((state) => ({
            parties: state.parties.map((p) => (p.id === tempId ? serverParty : p)),
          }));
          sqliteService.deleteParty(tempId).catch(() => {});
        }
        sqliteService.saveParty(serverParty, 'synced').catch(() => {});
        sqliteService.removeSyncQueueItemByEntity('party', tempId).catch(() => {});
      })
      .catch((err) => {
        console.warn('[store] Saved party locally (queued offline for remote sync):', err.message);
        sqliteService.enqueueSync('party', tempId, 'create', fullParty).catch(() => {});
        set((state) => ({ pendingSyncCount: state.pendingSyncCount + 1 }));
      });

    return tempId;
  },

  updateParty: (id, updates) => {
    set((state) => {
      const updatedList = state.parties.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates };
          sqliteService.saveParty(updated, 'pending').catch(() => {});
          return updated;
        }
        return p;
      });
      return { parties: updatedList };
    });

    api.updateParty(id, updates)
      .then(() => {
        const p = get().parties.find((party) => party.id === id);
        if (p) sqliteService.saveParty(p, 'synced').catch(() => {});
        sqliteService.removeSyncQueueItemByEntity('party', id).catch(() => {});
      })
      .catch((err) => {
        console.warn('[store] Updated party locally (queued offline for remote sync):', err.message);
        sqliteService.enqueueSync('party', id, 'update', updates).catch(() => {});
        set((state) => ({ pendingSyncCount: state.pendingSyncCount + 1 }));
      });
  },

  deleteParty: async (id) => {
    set((state) => ({
      parties: state.parties.filter((p) => p.id !== id),
      ledgerEntries: state.ledgerEntries.filter((e) => e.partyId !== id),
    }));

    // Cascade delete in SQLite
    await sqliteService.deleteParty(id);

    api.deleteParty(id)
      .then(() => {
        sqliteService.removeSyncQueueItemByEntity('party', id).catch(() => {});
      })
      .catch((err: any) => {
        console.warn('[store] Deleted party locally, queued for remote sync:', err.message);
        sqliteService.enqueueSync('party', id, 'delete', { id }).catch(() => {});
        set((state) => ({ pendingSyncCount: state.pendingSyncCount + 1 }));
      });
  },

  /**
   * ACID-Safe Offline-First Ledger Transaction
   */
  addLedgerEntry: async (entry) => {
    const currentState = get();
    const party = currentState.parties.find((p) => p.id === entry.partyId);

    if (!party) {
      console.warn('[store] Cannot record transaction: party not found for id', entry.partyId);
      return;
    }

    try {
      // 1. Execute ACID transaction in local SQLite with balance recalculation & rollback safety
      const { transaction: txEntry, updatedParty } = await sqliteService.addTransactionWithACID(
        entry,
        party
      );

      // 2. Immediately update in-memory state for instant UI responsiveness
      set((state) => ({
        ledgerEntries: [txEntry, ...state.ledgerEntries],
        parties: state.parties.map((p) => (p.id === entry.partyId ? updatedParty : p)),
        pendingSyncCount: state.pendingSyncCount + 1,
      }));

      // 3. Sync to backend API if connection available
      api.addTransaction({
        id: txEntry.id,
        partyId: entry.partyId,
        amount: entry.amount,
        type: entry.type,
        note: entry.note,
        mode: entry.mode,
        billPhoto: entry.billPhoto,
        date: entry.date,
      })
        .then((res) => {
          // Remove from SQLite sync_queue upon successful delivery so it is never duplicated!
          sqliteService.removeSyncQueueItemByEntity('ledger', txEntry.id).catch(() => {});
          if (res?.updatedParty) {
            set((state) => ({
              parties: state.parties.map((p) =>
                p.id === entry.partyId
                  ? {
                      ...p,
                      ...res.updatedParty,
                      balance: Math.abs(res.updatedParty.balance),
                    }
                  : p
              ),
              pendingSyncCount: Math.max(0, state.pendingSyncCount - 1),
            }));
          } else {
            set((state) => ({ pendingSyncCount: Math.max(0, state.pendingSyncCount - 1) }));
          }
        })
        .catch((err) => {
          console.warn('[store] Transaction saved offline in SQLite (will sync when online):', err.message);
        });
    } catch (err: any) {
      console.error('[store] ACID Transaction failed and was rolled back:', err);
    }
  },

  addCashbookEntry: async (entry) => {
    try {
      const fullEntry = await sqliteService.addCashbookEntry(entry);

      set((state) => ({
        cashbookEntries: [fullEntry, ...state.cashbookEntries],
        pendingSyncCount: state.pendingSyncCount + 1,
      }));

      api.addCashbook({
        id: fullEntry.id,
        title: entry.title,
        subtitle: entry.subtitle,
        amount: entry.amount,
        type: entry.type,
        mode: entry.mode,
      })
        .then(() => {
          // Remove from SQLite sync_queue upon successful delivery so it is never duplicated!
          sqliteService.removeSyncQueueItemByEntity('cashbook', fullEntry.id).catch(() => {});
          set((state) => ({ pendingSyncCount: Math.max(0, state.pendingSyncCount - 1) }));
        })
        .catch((err) => {
          console.warn('[store] Cashbook entry saved offline in SQLite:', err.message);
        });
    } catch (err: any) {
      console.error('[store] Failed to add cashbook entry to SQLite:', err);
    }
  },

  addBill: (bill) =>
    set((state) => ({
      bills: [{ id: `b_${Date.now()}`, ...bill }, ...state.bills],
    })),

  updateBillStatus: (id, status) =>
    set((state) => ({
      bills: state.bills.map((b) => (b.id === id ? { ...b, status } : b)),
    })),

  addItem: (item) =>
    set((state) => ({
      items: [{ id: `i_${Date.now()}`, ...item }, ...state.items],
    })),

  addPaymentLink: (link) =>
    set((state) => ({
      paymentLinks: [{ id: `pl_${Date.now()}`, ...link }, ...state.paymentLinks],
    })),

  updateStaffAttendance: (id, attendance) =>
    set((state) => ({
      staff: state.staff.map((s) => (s.id === id ? { ...s, attendance } : s)),
    })),

  toggleStaffSalaryStatus: (id) =>
    set((state) => ({
      staff: state.staff.map((s) =>
        s.id === id ? { ...s, salaryStatus: s.salaryStatus === 'Paid' ? 'Unpaid' : 'Paid' } : s
      ),
    })),

  addStaff: (member) =>
    set((state) => ({
      staff: [{ id: `s_${Date.now()}`, ...member }, ...state.staff],
    })),

  updateSettings: (updates) =>
    set((state) => ({ ...state, ...updates })),

  addRewardCoins: (amount) =>
    set((state) => ({
      business: { ...state.business, rewardCoins: state.business.rewardCoins + amount },
    })),
}));

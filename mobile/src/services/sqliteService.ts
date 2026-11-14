/**
 * Khata Offline-First SQLite Local Persistence Engine
 * Uses Expo SQLite (modern next-gen API with WAL mode and ACID transaction guarantees).
 * Provides seamless offline ledger mutations, instant local boot hydration,
 * rollback-safe accounting transactions, and background queue synchronization with the backend API.
 */
import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';
import type {
  Party,
  LedgerEntry,
  CashbookEntry,
  BusinessProfile,
} from '../store/useKhataStore';

const DB_NAME = 'khata_ledger_v2.db';

const FALLBACK_DEFAULT_BUSINESS: BusinessProfile = {
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

export interface SyncQueueItem {
  id: number;
  entityType: 'party' | 'ledger' | 'cashbook' | 'profile';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  payload: string;
  attempts: number;
  lastAttempt: string | null;
  createdAt: string;
}

class SQLitePersistenceService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  // In-memory web fallback store if running in standard web browser
  private webStore = {
    parties: new Map<string, Party>(),
    ledger: new Map<string, LedgerEntry>(),
    cashbook: new Map<string, CashbookEntry>(),
    profile: { ...FALLBACK_DEFAULT_BUSINESS },
    syncQueue: [] as SyncQueueItem[],
  };

  /**
   * Initializes SQLite database, enables WAL (Write-Ahead Logging) and creates tables.
   */
  public async init(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        if (Platform.OS === 'web') {
          this.isInitialized = true;
          return;
        }

        this.db = await SQLite.openDatabaseAsync(DB_NAME);

        // Enable Write-Ahead Logging for high-concurrency read/write performance & foreign keys
        await this.db.execAsync(`
          PRAGMA journal_mode = WAL;
          PRAGMA foreign_keys = ON;

          CREATE TABLE IF NOT EXISTS parties (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT,
            pan TEXT,
            aadhaar TEXT,
            type TEXT NOT NULL,
            balance REAL NOT NULL DEFAULT 0,
            balanceType TEXT NOT NULL DEFAULT 'settled',
            lastTxDate TEXT,
            status TEXT,
            address TEXT,
            gstin TEXT,
            creditLimit REAL,
            riskLevel TEXT,
            businessHours TEXT,
            syncStatus TEXT DEFAULT 'synced',
            updatedAt TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS ledger_entries (
            id TEXT PRIMARY KEY NOT NULL,
            partyId TEXT NOT NULL,
            amount REAL NOT NULL,
            type TEXT NOT NULL,
            date TEXT NOT NULL,
            note TEXT,
            mode TEXT,
            verified INTEGER DEFAULT 1,
            billPhoto TEXT,
            syncStatus TEXT DEFAULT 'synced',
            createdAt TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS cashbook_entries (
            id TEXT PRIMARY KEY NOT NULL,
            title TEXT NOT NULL,
            subtitle TEXT,
            amount REAL NOT NULL,
            type TEXT NOT NULL,
            date TEXT,
            time TEXT,
            mode TEXT,
            status TEXT,
            syncStatus TEXT DEFAULT 'synced',
            createdAt TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS business_profile (
            id TEXT PRIMARY KEY NOT NULL,
            profileJson TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS sync_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entityType TEXT NOT NULL,
            entityId TEXT NOT NULL,
            action TEXT NOT NULL,
            payload TEXT NOT NULL,
            attempts INTEGER DEFAULT 0,
            lastAttempt TEXT,
            createdAt TEXT NOT NULL
          );

          CREATE INDEX IF NOT EXISTS idx_ledger_partyId ON ledger_entries(partyId);
          CREATE INDEX IF NOT EXISTS idx_parties_type ON parties(type);
          CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(createdAt);
        `);

        this.isInitialized = true;
        console.log('[SQLite] Khata offline-first database initialized successfully with WAL & ACID support.');
      } catch (err) {
        console.warn('[SQLite] Failed to initialize SQLite native DB, falling back to memory:', err);
        this.isInitialized = true;
      }
    })();

    return this.initPromise;
  }

  /* ─── Business Profile Operations ─── */
  public async getProfile(): Promise<BusinessProfile | null> {
    await this.init();
    if (Platform.OS === 'web' || !this.db) {
      return this.webStore.profile;
    }

    try {
      const row = await this.db.getFirstAsync<{ profileJson: string }>(
        'SELECT profileJson FROM business_profile WHERE id = ?',
        ['active_profile']
      );
      if (row && row.profileJson) {
        return JSON.parse(row.profileJson);
      }
    } catch (err) {
      console.warn('[SQLite] getProfile error:', err);
    }
    return null;
  }

  public async saveProfile(profile: BusinessProfile): Promise<void> {
    await this.init();
    if (Platform.OS === 'web' || !this.db) {
      this.webStore.profile = { ...profile };
      return;
    }

    try {
      const json = JSON.stringify(profile);
      await this.db.runAsync(
        `INSERT INTO business_profile (id, profileJson, updatedAt) 
         VALUES (?, ?, ?) 
         ON CONFLICT(id) DO UPDATE SET profileJson = excluded.profileJson, updatedAt = excluded.updatedAt`,
        ['active_profile', json, new Date().toISOString()]
      );
    } catch (err) {
      console.warn('[SQLite] saveProfile error:', err);
    }
  }

  /* ─── Parties Operations ─── */
  public async getParties(type?: 'customer' | 'supplier', search?: string): Promise<Party[]> {
    await this.init();
    if (Platform.OS === 'web' || !this.db) {
      let list = Array.from(this.webStore.parties.values());
      if (type) list = list.filter((p) => p.type === type);
      if (search) {
        const q = search.toLowerCase();
        list = list.filter((p) => p.name.toLowerCase().includes(q) || p.phone.includes(q));
      }
      return list;
    }

    try {
      let sql = 'SELECT * FROM parties WHERE 1=1';
      const params: any[] = [];

      if (type) {
        sql += ' AND type = ?';
        params.push(type);
      }

      if (search && search.trim()) {
        sql += ' AND (LOWER(name) LIKE ? OR phone LIKE ?)';
        const query = `%${search.trim().toLowerCase()}%`;
        params.push(query, query);
      }

      sql += ' ORDER BY updatedAt DESC';

      const rows = await this.db.getAllAsync<any>(sql, params);
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        phone: r.phone,
        email: r.email || undefined,
        pan: r.pan || undefined,
        aadhaar: r.aadhaar || undefined,
        type: r.type,
        balance: Number(r.balance) || 0,
        balanceType: r.balanceType,
        lastTxDate: r.lastTxDate || 'Just added',
        status: r.status || 'No Due Date',
        address: r.address || undefined,
        gstin: r.gstin || undefined,
        creditLimit: r.creditLimit ? Number(r.creditLimit) : undefined,
        riskLevel: r.riskLevel || 'Low',
        businessHours: r.businessHours || undefined,
      }));
    } catch (err) {
      console.warn('[SQLite] getParties error:', err);
      return [];
    }
  }

  public async saveParty(party: Party, syncStatus = 'synced'): Promise<void> {
    await this.init();
    if (Platform.OS === 'web' || !this.db) {
      this.webStore.parties.set(party.id, party);
      return;
    }

    try {
      const now = new Date().toISOString();
      await this.db.runAsync(
        `INSERT INTO parties (
          id, name, phone, email, pan, aadhaar, type, balance, balanceType, 
          lastTxDate, status, address, gstin, creditLimit, riskLevel, businessHours, syncStatus, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          phone = excluded.phone,
          email = excluded.email,
          pan = excluded.pan,
          aadhaar = excluded.aadhaar,
          type = excluded.type,
          balance = excluded.balance,
          balanceType = excluded.balanceType,
          lastTxDate = excluded.lastTxDate,
          status = excluded.status,
          address = excluded.address,
          gstin = excluded.gstin,
          creditLimit = excluded.creditLimit,
          riskLevel = excluded.riskLevel,
          businessHours = excluded.businessHours,
          syncStatus = excluded.syncStatus,
          updatedAt = excluded.updatedAt`,
        [
          party.id,
          party.name,
          party.phone,
          party.email || null,
          party.pan || null,
          party.aadhaar || null,
          party.type,
          party.balance,
          party.balanceType,
          party.lastTxDate,
          party.status,
          party.address || null,
          party.gstin || null,
          party.creditLimit || null,
          party.riskLevel || 'Low',
          party.businessHours || null,
          syncStatus,
          now,
        ]
      );
    } catch (err) {
      console.warn('[SQLite] saveParty error:', err);
    }
  }

  public async deleteParty(id: string): Promise<void> {
    await this.init();
    if (Platform.OS === 'web' || !this.db) {
      this.webStore.parties.delete(id);
      for (const [k, v] of this.webStore.ledger.entries()) {
        if (v.partyId === id) this.webStore.ledger.delete(k);
      }
      return;
    }

    try {
      await this.db.withTransactionAsync(async () => {
        if (!this.db) return;
        await this.db.runAsync('DELETE FROM ledger_entries WHERE partyId = ?', [id]);
        await this.db.runAsync('DELETE FROM parties WHERE id = ?', [id]);
        await this.db.runAsync(
          'INSERT INTO sync_queue (entityType, entityId, action, payload, createdAt) VALUES (?, ?, ?, ?, ?)',
          ['party', id, 'delete', JSON.stringify({ id }), new Date().toISOString()]
        );
      });
    } catch (err) {
      console.warn('[SQLite] deleteParty error:', err);
    }
  }

  /* ─── Ledger & Transactions Operations with ACID Consistency ─── */
  public async getTransactions(partyId?: string): Promise<LedgerEntry[]> {
    await this.init();
    if (Platform.OS === 'web' || !this.db) {
      let list = Array.from(this.webStore.ledger.values());
      if (partyId) list = list.filter((e) => e.partyId === partyId);
      return list.sort((a, b) => (b.date > a.date ? 1 : -1));
    }

    try {
      let sql = 'SELECT * FROM ledger_entries';
      const params: any[] = [];
      if (partyId) {
        sql += ' WHERE partyId = ?';
        params.push(partyId);
      }
      sql += ' ORDER BY createdAt DESC';

      const rows = await this.db.getAllAsync<any>(sql, params);
      return rows.map((r) => ({
        id: r.id,
        partyId: r.partyId,
        amount: Number(r.amount) || 0,
        type: r.type,
        date: r.date,
        note: r.note || '',
        mode: r.mode || 'Cash',
        verified: r.verified === 1,
        billPhoto: r.billPhoto || undefined,
      }));
    } catch (err) {
      console.warn('[SQLite] getTransactions error:', err);
      return [];
    }
  }

  /**
   * ACID-Compliant Transaction Execution:
   * 1. Recomputes mathematically exact party balance.
   * 2. Inserts ledger row.
   * 3. Updates party row.
   * 4. Enqueues sync operation.
   * If ANY step fails, automatic rollback protects database integrity!
   */
  public async addTransactionWithACID(
    entry: Omit<LedgerEntry, 'id'>,
    currentParty: Party
  ): Promise<{ transaction: LedgerEntry; updatedParty: Party }> {
    await this.init();

    const txId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const txEntry: LedgerEntry = { id: txId, ...entry };
    const numAmount = Math.abs(Number(entry.amount));

    // Calculate updated party balance based on customer vs supplier accounting principles
    const isCustomer = currentParty.type === 'customer';
    let signed = 0;

    if (isCustomer) {
      signed = currentParty.balanceType === 'give' ? -Math.abs(currentParty.balance) : currentParty.balanceType === 'get' ? Math.abs(currentParty.balance) : 0;
      signed += (entry.type === 'gave' ? numAmount : -numAmount);
    } else {
      signed = currentParty.balanceType === 'get' ? -Math.abs(currentParty.balance) : currentParty.balanceType === 'give' ? Math.abs(currentParty.balance) : 0;
      signed += (entry.type === 'got' ? numAmount : -numAmount);
    }

    const newBalance = Math.abs(signed);
    const balType: Party['balanceType'] = isCustomer
      ? signed > 0 ? 'get' : signed < 0 ? 'give' : 'settled'
      : signed > 0 ? 'give' : signed < 0 ? 'get' : 'settled';

    const updatedParty: Party = {
      ...currentParty,
      balance: newBalance,
      balanceType: balType,
      status: signed > 0 ? 'Due Today' : signed < 0 ? 'Upcoming' : 'Settled',
      lastTxDate: 'Just now',
    };

    if (Platform.OS === 'web' || !this.db) {
      this.webStore.ledger.set(txId, txEntry);
      this.webStore.parties.set(currentParty.id, updatedParty);
      this.webStore.syncQueue.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        entityType: 'ledger',
        entityId: txId,
        action: 'create',
        payload: JSON.stringify(txEntry),
        attempts: 0,
        lastAttempt: null,
        createdAt: new Date().toISOString(),
      });
      return { transaction: txEntry, updatedParty };
    }

    const now = new Date().toISOString();

    // Atomic transaction block with automatic rollback on error
    await this.db.withTransactionAsync(async () => {
      if (!this.db) return;

      // 1. Ensure Party exists in SQLite parties table
      await this.db.runAsync(
        `INSERT INTO parties (
          id, name, phone, email, pan, aadhaar, type, balance, balanceType, 
          lastTxDate, status, address, gstin, creditLimit, riskLevel, businessHours, syncStatus, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          balance = excluded.balance,
          balanceType = excluded.balanceType,
          status = excluded.status,
          lastTxDate = excluded.lastTxDate,
          updatedAt = excluded.updatedAt`,
        [
          updatedParty.id,
          updatedParty.name,
          updatedParty.phone,
          updatedParty.email || null,
          updatedParty.pan || null,
          updatedParty.aadhaar || null,
          updatedParty.type,
          updatedParty.balance,
          updatedParty.balanceType,
          updatedParty.lastTxDate,
          updatedParty.status,
          updatedParty.address || null,
          updatedParty.gstin || null,
          updatedParty.creditLimit || null,
          updatedParty.riskLevel || 'Low',
          updatedParty.businessHours || null,
          'pending',
          now,
        ]
      );

      // 2. Insert Ledger Entry
      await this.db.runAsync(
        `INSERT INTO ledger_entries (id, partyId, amount, type, date, note, mode, verified, billPhoto, syncStatus, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          txId,
          entry.partyId,
          numAmount,
          entry.type,
          entry.date,
          entry.note || '',
          entry.mode || 'Cash',
          entry.verified ? 1 : 0,
          entry.billPhoto || null,
          'pending',
          now,
        ]
      );

      // 3. Enqueue for background API synchronization
      await this.db.runAsync(
        `INSERT INTO sync_queue (entityType, entityId, action, payload, createdAt)
         VALUES (?, ?, ?, ?, ?)`,
        ['ledger', txId, 'create', JSON.stringify(txEntry), now]
      );
    });

    return { transaction: txEntry, updatedParty };
  }

  /* ─── Cashbook Operations ─── */
  public async getCashbook(): Promise<CashbookEntry[]> {
    await this.init();
    if (Platform.OS === 'web' || !this.db) {
      return Array.from(this.webStore.cashbook.values()).reverse();
    }

    try {
      const rows = await this.db.getAllAsync<any>(
        'SELECT * FROM cashbook_entries ORDER BY createdAt DESC'
      );
      return rows.map((r) => ({
        id: r.id,
        title: r.title,
        subtitle: r.subtitle || '',
        amount: Number(r.amount) || 0,
        type: r.type,
        date: r.date || 'Today',
        time: r.time || '',
        mode: r.mode || 'Cash',
        status: r.status || 'Verified',
      }));
    } catch (err) {
      console.warn('[SQLite] getCashbook error:', err);
      return [];
    }
  }

  public async addCashbookEntry(entry: Omit<CashbookEntry, 'id'>): Promise<CashbookEntry> {
    await this.init();
    const id = `cb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fullEntry: CashbookEntry = { id, ...entry };
    const now = new Date().toISOString();

    if (Platform.OS === 'web' || !this.db) {
      this.webStore.cashbook.set(id, fullEntry);
      this.webStore.syncQueue.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        entityType: 'cashbook',
        entityId: id,
        action: 'create',
        payload: JSON.stringify(fullEntry),
        attempts: 0,
        lastAttempt: null,
        createdAt: now,
      });
      return fullEntry;
    }

    await this.db.withTransactionAsync(async () => {
      if (!this.db) return;
      await this.db.runAsync(
        `INSERT INTO cashbook_entries (id, title, subtitle, amount, type, date, time, mode, status, syncStatus, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          entry.title,
          entry.subtitle || '',
          entry.amount,
          entry.type,
          entry.date || 'Today',
          entry.time || '',
          entry.mode || 'Cash',
          entry.status || 'Verified',
          'pending',
          now,
        ]
      );

      await this.db.runAsync(
        `INSERT INTO sync_queue (entityType, entityId, action, payload, createdAt)
         VALUES (?, ?, ?, ?, ?)`,
        ['cashbook', id, 'create', JSON.stringify(fullEntry), now]
      );
    });

    return fullEntry;
  }

  /* ─── Sync Queue & Reconciliation ─── */
  public async getPendingSyncCount(): Promise<number> {
    await this.init();
    if (Platform.OS === 'web' || !this.db) {
      return this.webStore.syncQueue.length;
    }
    try {
      const row = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM sync_queue'
      );
      return row?.count || 0;
    } catch {
      return 0;
    }
  }

  public async getSyncQueueItems(): Promise<SyncQueueItem[]> {
    await this.init();
    if (Platform.OS === 'web' || !this.db) {
      return this.webStore.syncQueue;
    }
    try {
      const rows = await this.db.getAllAsync<any>(
        'SELECT * FROM sync_queue ORDER BY id ASC LIMIT 50'
      );
      return rows.map((r) => ({
        id: r.id,
        entityType: r.entityType,
        entityId: r.entityId,
        action: r.action,
        payload: r.payload,
        attempts: r.attempts,
        lastAttempt: r.lastAttempt,
        createdAt: r.createdAt,
      }));
    } catch {
      return [];
    }
  }

  public async enqueueSync(
    entityType: 'party' | 'ledger' | 'cashbook' | 'profile',
    entityId: string,
    action: 'create' | 'update' | 'delete',
    payload: any
  ): Promise<void> {
    await this.init();
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const now = new Date().toISOString();

    if (Platform.OS === 'web' || !this.db) {
      this.webStore.syncQueue = this.webStore.syncQueue.filter(
        (q) => !(q.entityType === entityType && q.entityId === entityId && q.action === action)
      );
      this.webStore.syncQueue.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        entityType,
        entityId,
        action,
        payload: payloadStr,
        attempts: 0,
        lastAttempt: null,
        createdAt: now,
      });
      return;
    }

    try {
      await this.db.runAsync(
        'DELETE FROM sync_queue WHERE entityType = ? AND entityId = ? AND action = ?',
        [entityType, entityId, action]
      );
      await this.db.runAsync(
        'INSERT INTO sync_queue (entityType, entityId, action, payload, createdAt) VALUES (?, ?, ?, ?, ?)',
        [entityType, entityId, action, payloadStr, now]
      );
    } catch (err) {
      console.warn('[SQLite] enqueueSync error:', err);
    }
  }

  public async removeSyncQueueItem(id: number): Promise<void> {
    await this.init();
    if (Platform.OS === 'web' || !this.db) {
      this.webStore.syncQueue = this.webStore.syncQueue.filter((q) => q.id !== id);
      return;
    }
    try {
      await this.db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
    } catch (err) {
      console.warn('[SQLite] removeSyncQueueItem error:', err);
    }
  }

  public async removeSyncQueueItemByEntity(entityType: string, entityId: string): Promise<void> {
    await this.init();
    if (Platform.OS === 'web' || !this.db) {
      this.webStore.syncQueue = this.webStore.syncQueue.filter(
        (q) => !(q.entityType === entityType && q.entityId === entityId)
      );
      return;
    }
    try {
      await this.db.runAsync(
        'DELETE FROM sync_queue WHERE entityType = ? AND entityId = ?',
        [entityType, entityId]
      );
    } catch (err) {
      console.warn('[SQLite] removeSyncQueueItemByEntity error:', err);
    }
  }
}

export const sqliteService = new SQLitePersistenceService();

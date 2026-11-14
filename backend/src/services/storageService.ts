import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mongoose from 'mongoose';

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
  avatarUrl?: string;
}

export interface UserRecord {
  id: string;
  email: string;
  phone: string;
  name: string;
  avatarUrl?: string;
  passwordHash?: string;
  googleId?: string;
  businessProfile: BusinessProfile;
  resetOtp?: string;
  resetOtpExpiry?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PartyRecord {
  id: string;
  userId: string;
  name: string;
  phone: string;
  type: 'customer' | 'supplier';
  balance: number;
  balanceType: 'get' | 'give' | 'settled';
  lastTxDate: string;
  status: string;
  address?: string;
  gstin?: string;
  pan?: string;
  aadhaar?: string;
  creditLimit?: number;
  riskLevel?: 'Low' | 'Medium' | 'High';
  businessHours?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionRecord {
  id: string;
  userId: string;
  partyId: string;
  amount: number;
  type: 'gave' | 'got';
  date: string;
  note: string;
  mode: 'Cash' | 'UPI Transfer' | 'Bank Transfer';
  verified: boolean;
  billPhoto?: string;
  prevHash: string;
  hash: string;
  createdAt: string;
}

export interface CashbookRecord {
  id: string;
  userId: string;
  title: string;
  subtitle: string;
  amount: number;
  type: 'in' | 'out';
  date: string;
  time: string;
  mode: 'UPI Transfer' | 'Cash' | 'Bank Transfer';
  status: 'Verified' | 'Paid' | 'Pending';
  createdAt: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  parties: PartyRecord[];
  transactions: TransactionRecord[];
  cashbook: CashbookRecord[];
}

const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'khata_store.json');

// Mongoose Schemas (for MongoDB when connected)
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  phone: { type: String, default: '' },
  name: { type: String, required: true },
  avatarUrl: { type: String, default: '' },
  passwordHash: { type: String },
  googleId: { type: String, index: true },
  businessProfile: { type: Object, default: {} },
  resetOtp: { type: String },
  resetOtpExpiry: { type: Number },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
});

const PartySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  type: { type: String, required: true, enum: ['customer', 'supplier'] },
  balance: { type: Number, default: 0 },
  balanceType: { type: String, default: 'settled', enum: ['get', 'give', 'settled'] },
  lastTxDate: { type: String, default: 'Just added' },
  status: { type: String, default: 'No Due Date' },
  address: { type: String, default: '' },
  gstin: { type: String, default: '' },
  pan: { type: String, default: '' },
  aadhaar: { type: String, default: '' },
  creditLimit: { type: Number },
  riskLevel: { type: String, default: 'Low' },
  businessHours: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
});

const TransactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  partyId: { type: String, required: true, index: true },
  amount: { type: Number, required: true },
  type: { type: String, required: true, enum: ['gave', 'got'] },
  date: { type: String, required: true },
  note: { type: String, default: '' },
  mode: { type: String, default: 'Cash' },
  verified: { type: Boolean, default: true },
  billPhoto: { type: String },
  prevHash: { type: String, default: '0000000000000000' },
  hash: { type: String, required: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

const CashbookSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  amount: { type: Number, required: true },
  type: { type: String, required: true, enum: ['in', 'out'] },
  date: { type: String, default: 'Today' },
  time: { type: String },
  mode: { type: String, default: 'Cash' },
  status: { type: String, default: 'Verified' },
  createdAt: { type: String, default: () => new Date().toISOString() },
});

export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
export const PartyModel = mongoose.models.Party || mongoose.model('Party', PartySchema);
export const TransactionModel = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
export const CashbookModel = mongoose.models.Cashbook || mongoose.model('Cashbook', CashbookSchema);

class StorageService {
  private db: DatabaseSchema = {
    users: [],
    parties: [],
    transactions: [],
    cashbook: [],
  };

  private isMongoConnected = false;

  constructor() {
    this.ensureDirectory();
    this.loadFromDisk();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(raw);
      } else {
        this.seedInitialData();
        this.saveToDisk();
      }
    } catch (err) {
      console.warn('[storage] Error loading database file, initializing clean state:', err);
      this.seedInitialData();
      this.saveToDisk();
    }
  }

  private saveToDisk() {
    try {
      const data = JSON.stringify(this.db, null, 2);
      const tempPath = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempPath, data, 'utf-8');
      try {
        fs.renameSync(tempPath, DB_FILE);
      } catch {
        fs.writeFileSync(DB_FILE, data, 'utf-8');
        try {
          fs.unlinkSync(tempPath);
        } catch {}
      }
    } catch (err) {
      console.error('[storage] Failed to write database file:', err);
    }
  }

  public setMongoConnected(connected: boolean) {
    this.isMongoConnected = connected;
    if (connected) {
      this.syncDiskToMongo();
    }
  }

  private async syncDiskToMongo() {
    if (!this.isMongoConnected) return;
    try {
      for (const u of this.db.users) {
        await UserModel.findOneAndUpdate({ id: u.id }, u, { upsert: true });
      }
      for (const p of this.db.parties) {
        await PartyModel.findOneAndUpdate({ id: p.id }, p, { upsert: true });
      }
      for (const t of this.db.transactions) {
        await TransactionModel.findOneAndUpdate({ id: t.id }, t, { upsert: true });
      }
      for (const c of this.db.cashbook) {
        await CashbookModel.findOneAndUpdate({ id: c.id }, c, { upsert: true });
      }
      console.log('[storage] Synced in-memory/disk store to MongoDB successfully.');
    } catch (err) {
      console.warn('[storage] Background sync to MongoDB warning:', err);
    }
  }

  private seedInitialData() {
    const defaultUserId = 'user_default';
    const defaultUser: UserRecord = {
      id: defaultUserId,
      email: '',
      phone: '',
      name: 'Merchant',
      avatarUrl: '',
      businessProfile: {
        name: 'My Khata',
        ownerName: 'Merchant',
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
        profileStrength: 0,
        rewardCoins: 0,
        avatarUrl: '',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.db = {
      users: [defaultUser],
      parties: [],
      transactions: [],
      cashbook: [],
    };
  }

  public calculateHash(prevHash: string, userId: string, partyId: string, amount: number, type: string, date: string): string {
    const raw = `${prevHash}|${userId}|${partyId}|${amount}|${type}|${date}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /* ─── User Operations (Unified Google + Email Identity) ─── */
  public async findUserByEmail(email: string): Promise<UserRecord | null> {
    const normalized = email.trim().toLowerCase();
    const u = this.db.users.find((user) => user.email.toLowerCase() === normalized);
    return u || null;
  }

  public async findUserById(id: string): Promise<UserRecord | null> {
    const u = this.db.users.find((user) => user.id === id);
    return u || null;
  }

  public async saveUser(user: UserRecord): Promise<UserRecord> {
    const idx = this.db.users.findIndex((u) => u.id === user.id);
    user.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      this.db.users[idx] = user;
    } else {
      this.db.users.unshift(user);
    }
    this.saveToDisk();

    if (this.isMongoConnected) {
      try {
        await UserModel.findOneAndUpdate({ id: user.id }, user, { upsert: true });
      } catch (err) {
        console.warn('[storage] Mongo user save error:', err);
      }
    }
    return user;
  }

  /* ─── Party Operations ─── */
  public async getPartiesByUser(userId: string, type?: string, search?: string): Promise<PartyRecord[]> {
    let list = this.db.parties.filter((p) => p.userId === userId);
    if (type) {
      list = list.filter((p) => p.type === type);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.phone.includes(q));
    }
    return list;
  }

  public async getPartyById(userId: string, partyId: string): Promise<PartyRecord | null> {
    const p = this.db.parties.find((party) => party.userId === userId && party.id === partyId);
    return p || null;
  }

  public async saveParty(party: PartyRecord): Promise<PartyRecord> {
    const idx = this.db.parties.findIndex((p) => p.id === party.id);
    party.updatedAt = new Date().toISOString();
    if (idx >= 0) {
      this.db.parties[idx] = party;
    } else {
      this.db.parties.unshift(party);
    }
    this.saveToDisk();

    if (this.isMongoConnected) {
      try {
        await PartyModel.findOneAndUpdate({ id: party.id }, party, { upsert: true });
      } catch (err) {
        console.warn('[storage] Mongo party save error:', err);
      }
    }
    return party;
  }

  public async deleteParty(userId: string, partyId: string): Promise<boolean> {
    const initialLen = this.db.parties.length;
    this.db.parties = this.db.parties.filter((p) => !(p.userId === userId && p.id === partyId));
    this.db.transactions = this.db.transactions.filter((t) => !(t.userId === userId && t.partyId === partyId));
    this.saveToDisk();

    if (this.isMongoConnected) {
      try {
        await PartyModel.deleteOne({ userId, id: partyId });
        await TransactionModel.deleteMany({ userId, partyId });
      } catch (err) {
        console.warn('[storage] Mongo party delete error:', err);
      }
    }
    return this.db.parties.length < initialLen;
  }

  /* ─── Transaction Operations with Ledger Math ─── */
  public async getTransactionsByUser(userId: string, partyId?: string): Promise<TransactionRecord[]> {
    let list = this.db.transactions.filter((t) => t.userId === userId);
    if (partyId) {
      list = list.filter((t) => t.partyId === partyId);
    }
    return list;
  }

  public async getLatestTransaction(userId: string): Promise<TransactionRecord | null> {
    const userTx = this.db.transactions.filter((t) => t.userId === userId);
    return userTx.length > 0 ? userTx[0] : null;
  }

  public async addTransaction(entry: Omit<TransactionRecord, 'hash' | 'prevHash' | 'createdAt'>): Promise<{
    transaction: TransactionRecord;
    updatedParty: PartyRecord;
  }> {
    const party = await this.getPartyById(entry.userId, entry.partyId);
    if (!party) {
      throw new Error(`Party not found with id: ${entry.partyId}`);
    }

    // Idempotency: if transaction already exists, return without double-counting
    const existing = this.db.transactions.find((t) => t.id === entry.id);
    if (existing) {
      return {
        transaction: existing,
        updatedParty: party,
      };
    }

    const latest = await this.getLatestTransaction(entry.userId);
    const prevHash = latest ? latest.hash : '00000000000000000000000000000000';
    const hash = this.calculateHash(prevHash, entry.userId, entry.partyId, entry.amount, entry.type, entry.date);

    const tx: TransactionRecord = {
      ...entry,
      prevHash,
      hash,
      createdAt: new Date().toISOString(),
    };

    this.db.transactions.unshift(tx);

    // Exact Mathematical Accounting:
    // For Customer:
    //   Gave (Debit/credit extended) -> Customer owes merchant -> Balance increases (get)
    //   Got (Credit/payment received) -> Customer pays back -> Balance decreases
    // For Supplier:
    //   Got (Purchased on credit) -> Merchant owes supplier -> Balance increases (give)
    //   Gave (Payment made to supplier) -> Merchant clears debt -> Balance decreases
    const numAmount = Math.abs(Number(entry.amount));

    if (party.type === 'customer') {
      let signed = party.balanceType === 'give' ? -Math.abs(party.balance) : party.balanceType === 'get' ? Math.abs(party.balance) : 0;
      signed += (entry.type === 'gave' ? numAmount : -numAmount);
      party.balance = Math.abs(signed);
      party.balanceType = signed > 0 ? 'get' : signed < 0 ? 'give' : 'settled';
      party.status = signed > 0 ? 'Due Today' : signed < 0 ? 'Upcoming' : 'Settled';
    } else {
      // supplier
      let signed = party.balanceType === 'get' ? -Math.abs(party.balance) : party.balanceType === 'give' ? Math.abs(party.balance) : 0;
      signed += (entry.type === 'got' ? numAmount : -numAmount);
      party.balance = Math.abs(signed);
      party.balanceType = signed > 0 ? 'give' : signed < 0 ? 'get' : 'settled';
      party.status = signed > 0 ? 'Due Today' : signed < 0 ? 'Upcoming' : 'Settled';
    }

    party.lastTxDate = 'Just now';
    await this.saveParty(party);
    this.saveToDisk();

    if (this.isMongoConnected) {
      try {
        await TransactionModel.create(tx);
      } catch (err) {
        console.warn('[storage] Mongo transaction create error:', err);
      }
    }

    return { transaction: tx, updatedParty: party };
  }

  /* ─── Cashbook Operations ─── */
  public async getCashbookByUser(userId: string): Promise<CashbookRecord[]> {
    return this.db.cashbook.filter((c) => c.userId === userId);
  }

  public async addCashbookEntry(entry: Omit<CashbookRecord, 'createdAt'>): Promise<CashbookRecord> {
    // Idempotency: if cashbook entry already exists, return existing
    const existing = this.db.cashbook.find((c) => c.id === entry.id);
    if (existing) {
      return existing;
    }

    const cb: CashbookRecord = {
      ...entry,
      createdAt: new Date().toISOString(),
    };
    this.db.cashbook.unshift(cb);
    this.saveToDisk();

    if (this.isMongoConnected) {
      try {
        await CashbookModel.create(cb);
      } catch (err) {
        console.warn('[storage] Mongo cashbook create error:', err);
      }
    }
    return cb;
  }
}

export const storage = new StorageService();

/**
 * Production Google AI Studio Integration for Khata Mobile App
 * Uses official @google/generative-ai SDK.
 * Zero hardcoded data. 100% dynamic RAG over real-time app state.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as SecureStore from 'expo-secure-store';
import {
  Party,
  CashbookEntry,
  BusinessProfile,
  Bill,
  LedgerEntry,
} from '../store/useKhataStore';

const GEMINI_KEY_STORAGE = 'KHATA_GOOGLE_STUDIO_API_KEY';
const CANDIDATE_MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-flash-latest'];
const DEFAULT_MODEL = 'gemini-2.5-flash';

export interface AppStateSnapshot {
  business: BusinessProfile;
  parties: Party[];
  cashbookEntries: CashbookEntry[];
  bills?: Bill[];
  ledgerEntries?: LedgerEntry[];
}

/**
 * Resilient multi-model execution: automatically tries active Google AI Studio models
 */
async function generateWithModelFallback(
  genAI: GoogleGenerativeAI,
  prompt: string,
  config?: any
): Promise<string> {
  let lastError: any = null;
  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        ...(config ? { generationConfig: config } : {}),
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (text && text.trim()) return text.trim();
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${modelName} failed, trying next candidate:`, err?.message);
    }
  }
  throw lastError || new Error('All Gemini candidate models failed.');
}

/**
 * Retrieves the stored Google AI Studio API key securely
 */
export async function getStoredApiKey(): Promise<string> {
  try {
    const stored = await SecureStore.getItemAsync(GEMINI_KEY_STORAGE);
    if (stored && stored.trim().length > 0) return stored.trim();
  } catch (e) {
    // SecureStore fallback
  }
  return process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
}

/**
 * Saves Google AI Studio key securely with device-level encryption
 */
export async function saveStoredApiKey(key: string): Promise<void> {
  try {
    if (!key.trim()) {
      await SecureStore.deleteItemAsync(GEMINI_KEY_STORAGE);
    } else {
      await SecureStore.setItemAsync(GEMINI_KEY_STORAGE, key.trim());
    }
  } catch (e) {
    console.warn('Could not save API key to SecureStore:', e);
  }
}

/**
 * Validates Google AI Studio Gemini API Key connectivity
 */
export async function testGeminiApiKey(
  apiKey: string
): Promise<{ success: boolean; message: string }> {
  if (!apiKey || apiKey.trim().length < 10) {
    return { success: false, message: 'Please enter a valid Google AI Studio API key.' };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const text = await generateWithModelFallback(genAI, 'Respond with "READY" to verify API connection.');

    if (text) {
      return {
        success: true,
        message: 'Google AI Studio Gemini API successfully verified and active!',
      };
    }
    return { success: false, message: 'Empty response from Google AI Studio.' };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Failed to authenticate with Google AI Studio.',
    };
  }
}

/**
 * Dynamic RAG Retriever: Filters and extracts real-time relevant chunks
 * based on user query tokens and active business entities.
 */
function retrieveRAGContext(query: string, snapshot: AppStateSnapshot) {
  const q = query.toLowerCase().trim();
  const queryTokens = q.split(/\s+/).filter((t) => t.length > 2);

  // Matched Parties
  const matchedParties = snapshot.parties.filter((p) => {
    const nameLower = p.name.toLowerCase();
    const phone = p.phone || '';
    if (q.includes(nameLower)) return true;
    return queryTokens.some((token) => nameLower.includes(token) || phone.includes(token));
  });

  // Parties with Pending Dues
  const dueParties = snapshot.parties.filter((p) => {
    const s = (p.status || '').toLowerCase();
    return s.includes('due') || s.includes('today') || s.includes('overdue');
  });

  // Matched Cashbook transactions
  const matchedCashbook = snapshot.cashbookEntries.filter((c) => {
    const title = c.title.toLowerCase();
    const sub = (c.subtitle || '').toLowerCase();
    return queryTokens.some((t) => title.includes(t) || sub.includes(t));
  });

  // Aggregate stats
  const totalReceivables = snapshot.parties
    .filter((p) => p.balanceType === 'get')
    .reduce((sum, p) => sum + p.balance, 0);

  const totalPayables = snapshot.parties
    .filter((p) => p.balanceType === 'give')
    .reduce((sum, p) => sum + p.balance, 0);

  const netBalance = totalReceivables - totalPayables;

  const totalCashIn = snapshot.cashbookEntries
    .filter((c) => c.type === 'in')
    .reduce((sum, c) => sum + c.amount, 0);

  const totalCashOut = snapshot.cashbookEntries
    .filter((c) => c.type === 'out')
    .reduce((sum, c) => sum + c.amount, 0);

  return {
    businessName: snapshot.business.name || 'My Business',
    businessCategory: snapshot.business.category || 'Trading/Services',
    totalReceivables,
    totalPayables,
    netBalance,
    totalCashIn,
    totalCashOut,
    matchedParties,
    dueParties,
    matchedCashbook,
  };
}

/**
 * 1. Lekha AI: App-wide Interactive Assistant with Live Google AI Studio Call
 */
export async function generateLedgerInsight(
  query: string,
  snapshot: AppStateSnapshot
): Promise<string> {
  const apiKey = await getStoredApiKey();
  const rag = retrieveRAGContext(query, snapshot);

  if (apiKey && apiKey.length > 10) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);

      const prompt = `
You are Lekha AI, the dedicated, intelligent financial advisor embedded inside the Khata app for "${rag.businessName}".
Respond in clear, professional English. Never make up numbers. Only use the real-time store figures provided below.

LIVE STORE LEDGER DATA:
- Business: ${rag.businessName} (${rag.businessCategory})
- Net Reconciled Balance: ₹ ${rag.netBalance.toLocaleString('en-IN')}
- Total You Will Get (Receivables): ₹ ${rag.totalReceivables.toLocaleString('en-IN')} across ${snapshot.parties.filter((p) => p.type === 'customer').length} customers
- Total You Will Give (Payables): ₹ ${rag.totalPayables.toLocaleString('en-IN')} across ${snapshot.parties.filter((p) => p.type === 'supplier').length} suppliers
- Cash in Hand: ₹ ${(rag.totalCashIn - rag.totalCashOut).toLocaleString('en-IN')} (Total In: ₹ ${rag.totalCashIn.toLocaleString('en-IN')}, Total Out: ₹ ${rag.totalCashOut.toLocaleString('en-IN')})

MATCHED PARTIES FROM RAG SEARCH:
${
  rag.matchedParties.length > 0
    ? rag.matchedParties
        .map(
          (p) =>
            `• ${p.name} (${p.type}): Balance ₹${p.balance.toLocaleString('en-IN')} (${p.balanceType === 'get' ? 'You will get' : 'You will give'}), Status: ${p.status}, Phone: ${p.phone || 'N/A'}`
        )
        .join('\n')
    : 'No party names directly matching the query.'
}

PARTIES WITH DUES:
${
  rag.dueParties.length > 0
    ? rag.dueParties
        .slice(0, 5)
        .map((p) => `• ${p.name}: ₹${p.balance.toLocaleString('en-IN')} (${p.status})`)
        .join('\n')
    : 'No overdue or due-today accounts.'
}

CASHBOOK RECORDS:
${
  rag.matchedCashbook.length > 0
    ? rag.matchedCashbook
        .slice(0, 4)
        .map((c) => `• ${c.date} | ${c.title}: ₹${c.amount.toLocaleString('en-IN')} (${c.type.toUpperCase()})`)
        .join('\n')
    : 'No matching cash transactions.'
}

MERCHANT'S QUESTION: "${query}"

Provide a crisp, helpful, and 100% accurate response directly addressing their question.
`;

      const text = await generateWithModelFallback(genAI, prompt, {
        temperature: 0.1,
        maxOutputTokens: 600,
      });
      if (text && text.trim()) return text.trim();
    } catch (e) {
      console.warn('Google AI Studio live call error, falling back to dynamic local RAG engine:', e);
    }
  }

  // Pure Dynamic Local RAG Engine (Zero hardcoding - calculated directly from live state)
  return executeDynamicLocalRag(query, snapshot, rag);
}

/**
 * 2. Real-time Customer/Supplier Party Risk Analysis via Google AI Studio
 */
export async function generatePartyRiskSummary(
  party: Party,
  businessName: string
): Promise<string> {
  const apiKey = await getStoredApiKey();

  if (apiKey && apiKey.length > 10) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);

      const prompt = `
For business "${businessName}", evaluate account:
Party: ${party.name} (${party.type})
Balance: ₹ ${party.balance.toLocaleString('en-IN')} (${party.balanceType})
Status: ${party.status}
Credit Limit: ₹ ${party.creditLimit ? party.creditLimit.toLocaleString('en-IN') : 'Not Set'}
Provide a 2-sentence actionable credit assessment in English.
`;
      const resText = await generateWithModelFallback(genAI, prompt);
      if (resText && resText.trim()) return resText.trim();
    } catch (e) {
      console.warn('Google AI Studio party evaluation error:', e);
    }
  }

  // Dynamic fallback
  const limitUsed = party.creditLimit && party.creditLimit > 0
    ? Math.round((party.balance / party.creditLimit) * 100)
    : null;

  return `${party.name} has an outstanding balance of ₹ ${party.balance.toLocaleString('en-IN')} (${party.status}). ${
    limitUsed !== null ? `Account utilization is at ${limitUsed}% of limit.` : 'Regular account standing.'
  }`;
}

/**
 * 3. Smart WhatsApp Payment Reminder Drafter
 */
export async function generateSmartReminderDraft(
  party: Party,
  businessName: string,
  tone: 'polite' | 'urgent' | 'formal' = 'polite'
): Promise<string> {
  const apiKey = await getStoredApiKey();

  if (apiKey && apiKey.length > 10) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);

      const prompt = `
Write a ${tone} payment reminder message in English for WhatsApp from "${businessName}" to customer "${party.name}".
Outstanding Amount: ₹ ${party.balance.toLocaleString('en-IN')}.
Due Status: ${party.status}.
Keep it concise, friendly, and include business name.
`;
      const res = await generateWithModelFallback(genAI, prompt);
      if (res && res.trim()) return res.trim();
    } catch (e) {
      console.warn('Google AI Studio reminder generator error:', e);
    }
  }

  // Dynamic fallback
  if (tone === 'urgent') {
    return `Urgent Payment Reminder: Dear ${party.name}, a payment of ₹ ${party.balance.toLocaleString('en-IN')} to ${businessName} is currently ${party.status}. Kindly clear the balance today. Thank you.`;
  }
  return `Dear ${party.name}, gentle reminder from ${businessName} that your pending balance is ₹ ${party.balance.toLocaleString('en-IN')} (${party.status}). Kindly arrange for payment at your earliest convenience. Thank you!`;
}

/**
 * Local Dynamic RAG Engine: Computes exact figures from live state with ZERO hardcoded names or amounts
 */
function executeDynamicLocalRag(
  query: string,
  snapshot: AppStateSnapshot,
  rag: ReturnType<typeof retrieveRAGContext>
): string {
  const q = query.toLowerCase().trim();
  const businessName = rag.businessName;

  // 1. Matched party query
  if (rag.matchedParties.length > 0) {
    const p = rag.matchedParties[0];
    const relation =
      p.balanceType === 'get'
        ? `owes you ₹ ${p.balance.toLocaleString('en-IN')}`
        : p.balanceType === 'give'
        ? `is to be paid ₹ ${p.balance.toLocaleString('en-IN')}`
        : 'is completely settled (₹ 0 balance)';

    const phoneText = p.phone ? ` • Contact: ${p.phone}` : '';
    const limitText = p.creditLimit ? ` • Credit Limit: ₹ ${p.creditLimit.toLocaleString('en-IN')}` : '';

    return `${p.name} (${p.type}): Currently ${relation}.\n• Payment Status: ${p.status || 'Active'}${phoneText}${limitText}.\n• Last recorded transaction: ${p.lastTxDate || 'Recently'}.`;
  }

  // 2. Dues / Today
  if (q.includes('due') || q.includes('today') || q.includes('overdue')) {
    if (rag.dueParties.length > 0) {
      const sumDue = rag.dueParties.reduce((s, p) => s + p.balance, 0);
      const items = rag.dueParties
        .slice(0, 4)
        .map((p) => `• ${p.name}: ₹ ${p.balance.toLocaleString('en-IN')} (${p.status})`)
        .join('\n');
      return `For ${businessName}, ${rag.dueParties.length} account(s) have payments due totaling ₹ ${sumDue.toLocaleString('en-IN')}:\n${items}\nSending automated WhatsApp reminders will accelerate collections.`;
    }
    return `For ${businessName}, no pending customer collections are marked as Due Today. All current accounts are on track.`;
  }

  // 3. Top debtors / Highest balance
  if (q.includes('highest') || q.includes('top') || q.includes('max') || q.includes('debtor')) {
    const topDebtors = [...snapshot.parties]
      .filter((p) => p.balanceType === 'get' && p.balance > 0)
      .sort((a, b) => b.balance - a.balance);

    if (topDebtors.length > 0) {
      const top = topDebtors[0];
      const list = topDebtors
        .slice(0, 3)
        .map((p, i) => `${i + 1}. ${p.name}: ₹ ${p.balance.toLocaleString('en-IN')}`)
        .join('\n');
      return `Highest pending balance in ${businessName} is with ${top.name} at ₹ ${top.balance.toLocaleString('en-IN')} (${top.status}).\nTop outstanding accounts:\n${list}`;
    }
    return `No outstanding customer balances found in ${businessName}.`;
  }

  // 4. Cashbook
  if (q.includes('cash') || q.includes('cashbook') || q.includes('flow')) {
    const netCash = rag.totalCashIn - rag.totalCashOut;
    return `Cashbook Summary for ${businessName}:\n• Total Cash In: ₹ ${rag.totalCashIn.toLocaleString('en-IN')}\n• Total Cash Out: ₹ ${rag.totalCashOut.toLocaleString('en-IN')}\n• Net Cash Balance: ₹ ${netCash.toLocaleString('en-IN')}\n• Total Recorded Entries: ${snapshot.cashbookEntries.length}.`;
  }

  // 5. Total balance sheet
  return `Live Ledger Summary for ${businessName}:\n• Net Reconciled Balance: ₹ ${rag.netBalance.toLocaleString('en-IN')}\n• Total Receivables: ₹ ${rag.totalReceivables.toLocaleString('en-IN')} (from ${snapshot.parties.filter((p) => p.type === 'customer').length} customers)\n• Total Payables: ₹ ${rag.totalPayables.toLocaleString('en-IN')} (to ${snapshot.parties.filter((p) => p.type === 'supplier').length} suppliers)\n• Net Cash in Hand: ₹ ${(rag.totalCashIn - rag.totalCashOut).toLocaleString('en-IN')}\nAsk me about any specific customer name, due collections, or cash flow trends.`;
}

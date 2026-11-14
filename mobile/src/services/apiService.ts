/**
 * Khata Production API Client
 * Connects Expo React Native mobile application to the secure Express + MongoDB backend.
 * Implements hardened JWT storage via expo-secure-store, automated device session provisioning,
 * token payload expiration checking, rate-limit 429 decoding, and resilient network fallbacks.
 */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';

function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:4000';
  }
  // Robust remote Cloudflare Tunnel for real devices across any Wi-Fi or cellular network
  return 'https://triangle-processed-stuff-qui.trycloudflare.com';
}

const BASE_URL = getApiBaseUrl();
const TOKEN_KEY = 'khata_jwt_token_secure_v2';
const USER_KEY = 'khata_auth_user_secure_v2';
const DEVICE_ID_KEY = 'khata_device_unique_id';

export interface DecodedTokenPayload {
  userId: string;
  email: string;
  name?: string;
  isGuest?: boolean;
  exp?: number;
  iat?: number;
  iss?: string;
  aud?: string;
}

class ApiService {
  private token: string | null = null;
  private tokenLoadPromise: Promise<string | null> | null = null;
  private deviceId: string | null = null;

  constructor() {
    this.ensureTokenLoaded().catch(() => {});
  }

  /**
 * Decodes JWT payload with full UTF-8 Unicode decoding to inspect expiration & claims
 */
  public parseTokenPayload(token: string): DecodedTokenPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      let jsonStr: string;
      if (typeof Buffer !== 'undefined') {
        jsonStr = Buffer.from(base64, 'base64').toString('utf-8');
      } else {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        jsonStr = new TextDecoder('utf-8').decode(bytes);
      }
      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  }

  /**
   * Retrieves or generates a persistent device UUID
   */
  public async getDeviceId(): Promise<string> {
    if (this.deviceId) return this.deviceId;
    try {
      if (Platform.OS !== 'web') {
        const stored = await SecureStore.getItemAsync(DEVICE_ID_KEY);
        if (stored) {
          this.deviceId = stored;
          return stored;
        }
      }
    } catch {}

    const newId = `device_${Crypto.randomUUID().replace(/-/g, '').substring(0, 16)}`;
    this.deviceId = newId;

    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(DEVICE_ID_KEY, newId);
      }
    } catch {}

    return newId;
  }

  /**
   * Ensures token is fully loaded from SecureStore before any request executes
   */
  public async ensureTokenLoaded(): Promise<string | null> {
    if (this.token) {
      // Validate that token is not expired
      const payload = this.parseTokenPayload(this.token);
      if (payload?.exp && Date.now() >= payload.exp * 1000 - 60000) {
        // Expired or expiring within 60s
        await this.clearAuthToken();
      } else {
        return this.token;
      }
    }

    if (this.tokenLoadPromise) return this.tokenLoadPromise;

    this.tokenLoadPromise = (async () => {
      try {
        let storedToken: string | null = null;
        if (Platform.OS !== 'web') {
          storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        } else if (typeof window !== 'undefined' && window.localStorage) {
          storedToken = window.localStorage.getItem(TOKEN_KEY);
        }

        if (storedToken) {
          const payload = this.parseTokenPayload(storedToken);
          if (payload?.exp && Date.now() >= payload.exp * 1000 - 60000) {
            await this.clearAuthToken();
            storedToken = null;
          }
        }

        this.token = storedToken;
        return storedToken;
      } catch {
        return null;
      } finally {
        this.tokenLoadPromise = null;
      }
    })();

    return this.tokenLoadPromise;
  }

  public async setAuthToken(token: string) {
    this.token = token;
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.setItemAsync(TOKEN_KEY, token);
      } else if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(TOKEN_KEY, token);
      }
    } catch {}
  }

  public async clearAuthToken() {
    this.token = null;
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
      } else if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
      }
    } catch {}
  }

  /**
   * Ensures an active authenticated session exists.
   * If not logged in, provisions a cryptographically signed device session from backend.
   */
  public async ensureAuthenticated(): Promise<string> {
    const existing = await this.ensureTokenLoaded();
    if (existing) return existing;

    try {
      const devId = await this.getDeviceId();
      const res = await fetch(`${BASE_URL}/api/auth/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Bypass-Tunnel-Reminder': 'true',
        },
        body: JSON.stringify({ deviceId: devId }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          await this.setAuthToken(data.token);
          if (data.user) {
            try {
              if (Platform.OS !== 'web') {
                await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
              }
            } catch {}
          }
          return data.token;
        }
      }
    } catch (err: any) {
      console.warn('[api] Failed to provision device session:', err?.message);
    }

    return '';
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    await this.ensureTokenLoaded();

    // If still no token and not hitting auth endpoints, provision device session
    if (!this.token && !endpoint.startsWith('/api/auth/login') && !endpoint.startsWith('/api/auth/register') && !endpoint.startsWith('/api/auth/session')) {
      await this.ensureAuthenticated();
    }

    const url = `${BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Bypass-Tunnel-Reminder': 'true',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Handle Rate Limit 429
        if (response.status === 429) {
          const retryAfter = data.retryAfterSeconds || response.headers.get('retry-after') || 'a few moments';
          throw new Error(
            data.error || `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`
          );
        }

        // Handle Token Expired 401
        if (response.status === 401 && (data.code === 'TOKEN_EXPIRED' || data.code === 'INVALID_TOKEN')) {
          await this.clearAuthToken();
          // Attempt silent session re-acquisition once
          if (!endpoint.startsWith('/api/auth/')) {
            const newToken = await this.ensureAuthenticated();
            if (newToken) {
              headers['Authorization'] = `Bearer ${newToken}`;
              const retryRes = await fetch(url, { ...options, headers });
              if (retryRes.ok) return (await retryRes.json()) as T;
            }
          }
        }

        throw new Error(data.error || `HTTP ${response.status}: Failed to execute request`);
      }

      return data;
    } catch (err: any) {
      console.warn(`[api] Request error for ${endpoint}:`, err.message);
      throw err;
    }
  }

  /* ─── Authentication Endpoints ─── */
  public async login(emailOrPhone: string, password: string) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrPhone, password }),
    });
    if (data.token) {
      await this.setAuthToken(data.token);
      try {
        if (Platform.OS !== 'web') {
          await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
        } else if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
      } catch {}
    }
    return data;
  }

  public async googleLogin(payload: { email: string; name: string; avatarUrl?: string; googleId?: string }) {
    const data = await this.request('/api/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.token) {
      await this.setAuthToken(data.token);
      try {
        if (Platform.OS !== 'web') {
          await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
        } else if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
      } catch {}
    }
    return data;
  }

  public async firebaseLogin(payload: {
    uid?: string;
    idToken?: string;
    phone?: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
    businessName?: string;
  }) {
    const data = await this.request('/api/auth/firebase', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.token) {
      await this.setAuthToken(data.token);
      try {
        if (Platform.OS !== 'web') {
          await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
        } else if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
      } catch {}
    }
    return data;
  }

  public async register(payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    businessName?: string;
  }) {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.token) {
      await this.setAuthToken(data.token);
      try {
        if (Platform.OS !== 'web') {
          await SecureStore.setItemAsync(USER_KEY, JSON.stringify(data.user));
        } else if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
      } catch {}
    }
    return data;
  }

  public async logout() {
    await this.clearAuthToken();
    try {
      if (Platform.OS !== 'web') {
        await SecureStore.deleteItemAsync(USER_KEY);
      } else if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(USER_KEY);
      }
    } catch {}
  }

  public async forgotPassword(emailOrPhone: string) {
    return this.request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ emailOrPhone }),
    });
  }

  public async resetPassword(payload: { emailOrPhone: string; otp: string; newPassword: string }) {
    return this.request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getProfile() {
    return this.request('/api/auth/me');
  }

  public async updateProfile(profileData: any) {
    return this.request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  /* ─── Parties (Customers & Suppliers) ─── */
  public async getParties(type?: 'customer' | 'supplier', search?: string) {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (search) params.append('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/api/parties${qs}`);
  }

  public async getParty(id: string) {
    return this.request(`/api/parties/${id}`);
  }

  public async createParty(partyData: any) {
    return this.request('/api/parties', {
      method: 'POST',
      body: JSON.stringify(partyData),
    });
  }

  public async updateParty(id: string, updates: any) {
    return this.request(`/api/parties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  public async deleteParty(id: string) {
    return this.request(`/api/parties/${id}`, {
      method: 'DELETE',
    });
  }

  /* ─── Ledger Transactions ─── */
  public async getTransactions(partyId?: string) {
    const qs = partyId ? `?partyId=${partyId}` : '';
    return this.request(`/api/transactions${qs}`);
  }

  public async addTransaction(txData: {
    id?: string;
    partyId: string;
    amount: number;
    type: 'gave' | 'got';
    note?: string;
    mode?: string;
    billPhoto?: string;
    date?: string;
  }) {
    return this.request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(txData),
    });
  }

  /* ─── Cashbook ─── */
  public async getCashbook() {
    return this.request('/api/cashbook');
  }

  public async addCashbook(entry: {
    id?: string;
    title: string;
    subtitle?: string;
    amount: number;
    type: 'in' | 'out';
    mode?: string;
  }) {
    return this.request('/api/cashbook', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  /* ─── Reports & Analytics ─── */
  public async getAnalytics() {
    return this.request('/api/reports/analytics');
  }
}

export const api = new ApiService();

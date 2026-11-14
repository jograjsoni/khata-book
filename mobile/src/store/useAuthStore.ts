/**
 * Auth store – Zustand store for Firebase Authentication state.
 * Safely guards @react-native-firebase/auth for compatibility with both Expo Go and standalone builds.
 */
import { create } from 'zustand';

let authModule: any = null;
try {
  authModule = require('@react-native-firebase/auth').default;
} catch {
  // Running in Expo Go or environment without native Firebase linked
}

interface AuthState {
  firebaseUser: any | null;
  isLoggedIn: boolean;
  isLoading: boolean;

  setUser: (user: any | null) => void;
  signOut: () => Promise<void>;
  initAuth: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  isLoggedIn: true, // Default to true on clean slate
  isLoading: false,

  setUser: (user: any | null) => {
    set({
      firebaseUser: user,
      isLoggedIn: !!user,
      isLoading: false,
    });
  },

  signOut: async () => {
    try {
      if (authModule) {
        await authModule().signOut();
      }
    } catch {}
    set({
      firebaseUser: null,
      isLoggedIn: false,
    });
  },

  initAuth: () => {
    if (!authModule) {
      set({ isLoading: false });
      return () => {};
    }

    let unsubscribe = () => {};
    try {
      unsubscribe = authModule().onAuthStateChanged((user: any | null) => {
        if (user) {
          set({
            firebaseUser: user,
            isLoggedIn: true,
            isLoading: false,
          });
        } else {
          set({ isLoading: false });
        }
      });
    } catch (err) {
      console.warn('[auth] Firebase onAuthStateChanged failed:', err);
      set({ isLoading: false });
    }

    return unsubscribe;
  },
}));

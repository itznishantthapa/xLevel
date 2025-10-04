import { create } from 'zustand';
import {
  deleteUser,
  getStoredUser,
  getUser,
  googleLoginUser,
  googleSignupUser,
  appleSignupUser,
  loginUser,
  refreshUserData,
  signupUser,
  updateUser
} from '../service/authService';
import { performLogout } from '../service/logoutService';
import { queryClient } from '../lib/queryClient';


/**
 * Authentication Store
 * Manages user authentication state and related operations using Zustand.
 * Handles user login, signup, logout, and role-based access control.
 */
export const useAuthStore = create((set) => ({
  // Authentication State
  user: null,
  isAuthenticated: true,
  isAdmin: false,
  isCustomer: false,
  isInitialized: false,

  /**
   * Initializes authentication state from stored user data
   * @returns {Promise<void>}
   */
  initAuth: async () => {
    const user = await getStoredUser();
    set({
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isCustomer: user?.role === 'customer',
      isInitialized: true
    });
  },

  /**
   * Handles user login and updates authentication state
   * @param {Object} payload - Login credentials
   * @returns {Promise<void>}
   */
  login: async (payload) => {
    const user = await loginUser(payload);
    set({
      user,
      isAuthenticated: true,
      isAdmin: user?.role === 'admin',
      isCustomer: user?.role === 'customer',
      isInitialized: true
    });
    
  },

  /**
   * Handles new user signup and updates authentication state
   * @param {Object} payload - Signup data
   * @returns {Promise<void>}
   */
  signup: async (payload) => {
    const user = await signupUser(payload);
    set({
      user,
      isAuthenticated: true,
      isAdmin: user?.role === 'admin',
      isCustomer: user?.role === 'customer',
      isInitialized: true
    });
  },

  /**
   * Handles Google signup and updates authentication state
   * @param {Object} payload - Google signup data
   * @returns {Promise<void>}
   */
  google_signup: async (payload) => {
    const user = await googleSignupUser(payload);
    if (!user) return;
    set({
      user,
      isAuthenticated: true,
      isAdmin: user?.role === 'admin',
      isCustomer: user?.role === 'customer',
      isInitialized: true
    });
  },

  /**
   * Handles Apple signup and updates authentication state
   * @param {Object} payload - Apple signup data
   * @returns {Promise<void>}
   */
  apple_signup: async (payload) => {
    const user = await appleSignupUser(payload);
    if (!user) return;
    set({
      user,
      isAuthenticated: true,
      isAdmin: user?.role === 'admin',
      isCustomer: user?.role === 'customer',
      isInitialized: true
    });
  },

  /**
   * Updates user profile information
   * @param {Object} payload - Updated user data
   * @returns {Promise<void>}
   */
  update_user: async (payload) => {
    const user = await updateUser(payload);
    set({ user });
  },

  /**
   * Deletes user account
   * @returns {Promise<void>}
   */
  delete_user: async (payload) => {
   const response = await deleteUser(payload);
    if (response.status === 200) {
      await performLogout(false);
         set({
      user: null,
      isAdmin: false,
      isCustomer: false,
      isAuthenticated: false,
      isInitialized: true
    });
     }
  },

  /**
   * Refreshes user data from the backend
   * @returns {Promise<void>}
   */
  get_user: async () => {
    const user = await getUser();
    set({ user });
  },

  /**
   * Updates user wallet balance without full API call
   * @param {number} newWalletBalance - New wallet balance
   */
  update_wallet_balance: (newWalletBalance) => {
    set((state) => ({
      user: state.user ? {
        ...state.user,
        wallet_balance: newWalletBalance
      } : state.user
    }));
  },

  /**
   * Updates user data from ads response
   * @param {Object} adsData - Response data from ads API
   */
  update_user_from_ads: (adsData) => {
    set((state) => ({
      user: state.user ? {
        ...state.user,
        wallet_balance: adsData.wallet_balance,
        ads_count: adsData.ads_count,
        user_access_code: adsData.user_access_code
      } : state.user
    }));
  },

  /**
   * Handles user logout and resets authentication state
   * @returns {Promise<void>}
   */
  logout: async () => {
    await performLogout();
    set({
      user: null,
      isAdmin: false,
      isCustomer: false,
      isAuthenticated: false,
      isInitialized: true
    });
  }
}));
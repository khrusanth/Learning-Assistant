/**
 * Application Context & State Management
 * Single source of truth — backed by the JSON DB service.
 */
import { createContext, useReducer, useContext, useCallback, useEffect } from 'react';
import * as db from '../services/db';

// ─── Actions ───────────────────────────────────────────────────
const ACTIONS = {
  SET_TOPICS: 'SET_TOPICS',
  SET_STATS: 'SET_STATS',
  SET_DARK_MODE: 'SET_DARK_MODE',
  SET_CURRENT_PAGE: 'SET_CURRENT_PAGE',
  SET_SEARCH: 'SET_SEARCH',
  SHOW_TOAST: 'SHOW_TOAST',
  HIDE_TOAST: 'HIDE_TOAST',
  SHOW_CONFIRM: 'SHOW_CONFIRM',
  HIDE_CONFIRM: 'HIDE_CONFIRM',
  SET_LOADING: 'SET_LOADING',
};

// ─── Initial State ─────────────────────────────────────────────
const getInitialDarkMode = () => {
  const stored = localStorage.getItem('la-dark-mode');
  if (stored !== null) return stored === 'true';
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
};

const initialState = {
  topics: [],
  stats: db.getStats(),
  darkMode: getInitialDarkMode(),
  currentPage: 'dashboard',
  searchQuery: '',
  toast: null,
  confirmDialog: null,
  isLoading: true,
};

// ─── Reducer ───────────────────────────────────────────────────
const reducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_TOPICS:
      return { ...state, topics: action.payload };
    case ACTIONS.SET_STATS:
      return { ...state, stats: action.payload };
    case ACTIONS.SET_DARK_MODE: {
      const dark = action.payload;
      localStorage.setItem('la-dark-mode', dark);
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      return { ...state, darkMode: dark };
    }
    case ACTIONS.SET_CURRENT_PAGE:
      return { ...state, currentPage: action.payload };
    case ACTIONS.SET_SEARCH:
      return { ...state, searchQuery: action.payload };
    case ACTIONS.SHOW_TOAST:
      return { ...state, toast: action.payload };
    case ACTIONS.HIDE_TOAST:
      return { ...state, toast: null };
    case ACTIONS.SHOW_CONFIRM:
      return { ...state, confirmDialog: action.payload };
    case ACTIONS.HIDE_CONFIRM:
      return { ...state, confirmDialog: null };
    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

// ─── Context ───────────────────────────────────────────────────
const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Initialize: load data from DB and apply theme
  useEffect(() => {
    const topics = db.getAllTopics();
    const stats = db.getStats();
    dispatch({ type: ACTIONS.SET_TOPICS, payload: topics });
    dispatch({ type: ACTIONS.SET_STATS, payload: stats });
    dispatch({ type: ACTIONS.SET_LOADING, payload: false });

    // Apply theme on mount
    document.documentElement.setAttribute(
      'data-theme',
      getInitialDarkMode() ? 'dark' : 'light'
    );
  }, []);

  // ─── Convenience dispatchers ─────────────────────────────

  /** Reload topics from DB into state */
  const refreshTopics = useCallback(() => {
    dispatch({ type: ACTIONS.SET_TOPICS, payload: db.getAllTopics() });
  }, []);

  /** Reload stats from DB into state */
  const refreshStats = useCallback(() => {
    dispatch({ type: ACTIONS.SET_STATS, payload: db.getStats() });
  }, []);

  /** Show a toast notification */
  const showToast = useCallback((message, type = 'success') => {
    dispatch({ type: ACTIONS.SHOW_TOAST, payload: { message, type, id: Date.now() } });
  }, []);

  /** Hide the current toast */
  const hideToast = useCallback(() => {
    dispatch({ type: ACTIONS.HIDE_TOAST });
  }, []);

  /** Show a confirmation dialog (returns a promise) */
  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      dispatch({
        type: ACTIONS.SHOW_CONFIRM,
        payload: {
          message,
          onConfirm: () => {
            dispatch({ type: ACTIONS.HIDE_CONFIRM });
            resolve(true);
          },
          onCancel: () => {
            dispatch({ type: ACTIONS.HIDE_CONFIRM });
            resolve(false);
          },
        },
      });
    });
  }, []);

  /** Navigate to a page */
  const navigate = useCallback((page) => {
    dispatch({ type: ACTIONS.SET_CURRENT_PAGE, payload: page });
  }, []);

  /** Set search query */
  const setSearch = useCallback((q) => {
    dispatch({ type: ACTIONS.SET_SEARCH, payload: q });
  }, []);

  /** Toggle dark mode */
  const toggleDarkMode = useCallback(() => {
    dispatch({ type: ACTIONS.SET_DARK_MODE, payload: !state.darkMode });
  }, [state.darkMode]);

  const value = {
    state,
    dispatch,
    actions: ACTIONS,
    refreshTopics,
    refreshStats,
    showToast,
    hideToast,
    confirm,
    navigate,
    setSearch,
    toggleDarkMode,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};

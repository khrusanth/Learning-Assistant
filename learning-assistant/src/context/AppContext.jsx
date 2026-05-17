/**
 * Global App Context for state management
 */
import React, { createContext, useReducer, useCallback, useEffect } from 'react';

export const AppContext = createContext();

const initialState = {
  topics: [],
  progress: {},
  achievements: [],
  revisions: [],
  stats: {
    totalXP: 0,
    level: 1,
    streak: 0,
    totalCompleted: 0,
    lastActivityDate: null,
  },
  isLoading: false,
  error: null,
  darkMode: localStorage.getItem('darkMode') === 'true',
  folderSelected: false,
};

const actions = {
  SET_TOPICS: 'SET_TOPICS',
  ADD_TOPIC: 'ADD_TOPIC',
  UPDATE_TOPIC: 'UPDATE_TOPIC',
  DELETE_TOPIC: 'DELETE_TOPIC',
  SET_PROGRESS: 'SET_PROGRESS',
  SET_ACHIEVEMENTS: 'SET_ACHIEVEMENTS',
  SET_REVISIONS: 'SET_REVISIONS',
  SET_STATS: 'SET_STATS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  TOGGLE_DARK_MODE: 'TOGGLE_DARK_MODE',
  SET_FOLDER_SELECTED: 'SET_FOLDER_SELECTED',
  RESET_STATE: 'RESET_STATE',
};

const reducer = (state, action) => {
  switch (action.type) {
    case actions.SET_TOPICS:
      return { ...state, topics: action.payload };
    case actions.ADD_TOPIC:
      return { ...state, topics: [...state.topics, action.payload] };
    case actions.UPDATE_TOPIC:
      return {
        ...state,
        topics: state.topics.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };
    case actions.DELETE_TOPIC:
      return {
        ...state,
        topics: state.topics.filter((t) => t.id !== action.payload),
      };
    case actions.SET_PROGRESS:
      return { ...state, progress: action.payload };
    case actions.SET_ACHIEVEMENTS:
      return { ...state, achievements: action.payload };
    case actions.SET_REVISIONS:
      return { ...state, revisions: action.payload };
    case actions.SET_STATS:
      return { ...state, stats: action.payload };
    case actions.SET_LOADING:
      return { ...state, isLoading: action.payload };
    case actions.SET_ERROR:
      return { ...state, error: action.payload };
    case actions.TOGGLE_DARK_MODE:
      const newDarkMode = !state.darkMode;
      localStorage.setItem('darkMode', newDarkMode);
      document.documentElement.classList.toggle('dark', newDarkMode);
      return { ...state, darkMode: newDarkMode };
    case actions.SET_FOLDER_SELECTED:
      return { ...state, folderSelected: action.payload };
    case actions.RESET_STATE:
      return initialState;
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load data on mount (simplified, no file access yet)
  useEffect(() => {
    const loadData = async () => {
      dispatch({ type: actions.SET_LOADING, payload: true });
      try {
        // Initialize from localStorage if available
        const savedTopics = localStorage.getItem('topics');
        const savedStats = localStorage.getItem('stats');
        
        if (savedTopics) {
          dispatch({ type: actions.SET_TOPICS, payload: JSON.parse(savedTopics) });
        }
        if (savedStats) {
          dispatch({ type: actions.SET_STATS, payload: JSON.parse(savedStats) });
        }
        
        console.log('App data loaded');
      } catch (err) {
        console.error('Error loading app data', err);
        dispatch({ type: actions.SET_ERROR, payload: err.message });
      } finally {
        dispatch({ type: actions.SET_LOADING, payload: false });
      }
    };

    loadData();
  }, []);

  // Auto-save to localStorage
  useEffect(() => {
    if (state.topics.length > 0) {
      localStorage.setItem('topics', JSON.stringify(state.topics));
    }
  }, [state.topics]);

  useEffect(() => {
    if (state.stats) {
      localStorage.setItem('stats', JSON.stringify(state.stats));
    }
  }, [state.stats]);

  // Context value
  const value = {
    state,
    dispatch,
    actions,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = React.useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

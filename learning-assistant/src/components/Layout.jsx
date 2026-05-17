import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Moon, Sun } from 'lucide-react';
import '../styles/Layout.css';

export const Layout = ({ children }) => {
  const { state, dispatch, actions } = useAppContext();

  return (
    <div className={`app-layout ${state.darkMode ? 'dark' : 'light'}`}>
      <div className="layout-container">
        <header className="app-header">
          <div className="header-content">
            <h1 className="app-title">📚 Learning Assistant</h1>
            <button
              className="theme-toggle"
              onClick={() => dispatch({ type: actions.TOGGLE_DARK_MODE })}
              aria-label="Toggle dark mode"
            >
              {state.darkMode ? <Sun size={24} /> : <Moon size={24} />}
            </button>
          </div>
        </header>
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
};

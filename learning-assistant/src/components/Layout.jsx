/**
 * Application Shell Layout
 * Sidebar + top bar + content area.
 */
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Sidebar } from './Sidebar';
import { Toast } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';
import { Menu } from 'lucide-react';

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  learningTree: 'Learning Tree',
  settings: 'Settings',
};

export const Layout = ({ children }) => {
  const { state } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="app-main">
        <header className="app-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn-icon mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <span className="topbar-title">
              {PAGE_TITLES[state.currentPage] || 'Dashboard'}
            </span>
          </div>
          <div className="topbar-actions">
            {/* Placeholder for future actions like notifications */}
          </div>
        </header>

        <main className="app-content">{children}</main>
      </div>

      <Toast />
      <ConfirmDialog />
    </div>
  );
};

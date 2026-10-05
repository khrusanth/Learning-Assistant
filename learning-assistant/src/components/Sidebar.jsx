/**
 * Sidebar Navigation Component
 */
import React from 'react';
import { useAppContext } from '../context/AppContext';
import {
  LayoutDashboard,
  GitBranch,
  Settings,
  BookOpen,
  Moon,
  Sun,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'learningTree', label: 'Learning Tree', icon: GitBranch },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar = ({ isOpen, onClose }) => {
  const { state, navigate, toggleDarkMode } = useAppContext();

  const handleNav = (pageId) => {
    navigate(pageId);
    onClose?.();
  };

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <BookOpen size={20} />
          </div>
          <span className="sidebar-brand">LearnAssist</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${state.currentPage === item.id ? 'active' : ''}`}
              onClick={() => handleNav(item.id)}
            >
              <span className="nav-icon">
                <item.icon size={20} />
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={toggleDarkMode}>
            <span className="nav-icon">
              {state.darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </span>
            {state.darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </aside>
    </>
  );
};

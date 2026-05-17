/**
 * Settings Page
 */
import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { requestFolderAccess, getFolderHandle } from '../utils/fileSystem';
import { exportDataAsCSV } from '../utils/dataManager';
import { getLogs, getErrorLogs, clearLogs } from '../utils/logger';
import { Settings, Download, Folder, Moon, Sun, Trash2 } from 'lucide-react';
import '../styles/SettingsPage.css';

export const SettingsPage = () => {
  const { state, dispatch, actions } = useAppContext();
  const [logs, setLogs] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [isSavingData, setIsSavingData] = useState(false);

  const handleChangeFolderLocation = async () => {
    try {
      const handle = await requestFolderAccess();
      if (handle) {
        dispatch({ type: actions.SET_FOLDER_SELECTED, payload: true });
        alert('✅ Folder location changed successfully!');
      }
    } catch (err) {
      console.error('Error changing folder:', err);
      alert('❌ Error selecting folder');
    }
  };

  const handleExportData = async () => {
    try {
      setIsSavingData(true);
      await exportDataAsCSV(state.topics);
      alert('✅ Data exported as CSV backup!');
    } catch (err) {
      alert('❌ Error exporting data: ' + err.message);
    } finally {
      setIsSavingData(false);
    }
  };

  const handleViewLogs = async () => {
    try {
      const logContent = await getLogs();
      setLogs(logContent);
      setShowLogs(true);
    } catch (err) {
      alert('Error loading logs');
    }
  };

  const handleClearLogs = async () => {
    if (confirm('Are you sure you want to clear all logs?')) {
      try {
        await clearLogs();
        setLogs('');
        alert('✅ Logs cleared!');
      } catch (err) {
        alert('Error clearing logs');
      }
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p className="text-muted">Manage your application preferences</p>
      </div>

      <div className="settings-grid">
        {/* Data & Storage */}
        <div className="settings-card">
          <div className="card-header">
            <h3>
              <Folder size={24} />
              Data & Storage
            </h3>
          </div>
          <div className="card-content">
            <div className="setting-item">
              <div className="setting-label">
                <span className="label-title">Data Folder Location</span>
                <span className="label-desc">Select where to save your learning data</span>
              </div>
              <button className="btn btn-secondary" onClick={handleChangeFolderLocation}>
                Change Location
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-label">
                <span className="label-title">Export Data as CSV</span>
                <span className="label-desc">Backup your topics as a CSV file</span>
              </div>
              <button
                className="btn btn-secondary"
                onClick={handleExportData}
                disabled={isSavingData}
              >
                <Download size={18} />
                {isSavingData ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>

        {/* Theme */}
        <div className="settings-card">
          <div className="card-header">
            <h3>
              {state.darkMode ? <Moon size={24} /> : <Sun size={24} />}
              Theme
            </h3>
          </div>
          <div className="card-content">
            <div className="setting-item">
              <div className="setting-label">
                <span className="label-title">Dark Mode</span>
                <span className="label-desc">
                  {state.darkMode ? 'Dark mode is enabled' : 'Dark mode is disabled'}
                </span>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() =>
                  dispatch({ type: actions.TOGGLE_DARK_MODE })
                }
              >
                {state.darkMode ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="settings-card">
          <div className="card-header">
            <h3>
              <Settings size={24} />
              Application Logs
            </h3>
          </div>
          <div className="card-content">
            <div className="setting-item">
              <div className="setting-label">
                <span className="label-title">View Logs</span>
                <span className="label-desc">Check application activity and debug information</span>
              </div>
              <button className="btn btn-secondary" onClick={handleViewLogs}>
                View Logs
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-label">
                <span className="label-title">Clear All Logs</span>
                <span className="label-desc">Permanently delete all log files</span>
              </div>
              <button className="btn btn-danger" onClick={handleClearLogs}>
                <Trash2 size={18} />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="settings-card">
          <div className="card-header">
            <h3>About</h3>
          </div>
          <div className="card-content">
            <div className="about-content">
              <p>
                <strong>Learning Assistant</strong>
              </p>
              <p>Version 1.0.0</p>
              <p>A modern learning management system to organize, track, and improve your learning journey.</p>
              <p className="mt-4">
                <strong>Features:</strong>
              </p>
              <ul>
                <li>Hierarchical learning tree structure</li>
                <li>Progress tracking and analytics</li>
                <li>Spaced repetition for revisions</li>
                <li>Gamification with XP and levels</li>
                <li>Local file-based data persistence</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Modal */}
      {showLogs && (
        <div className="modal-overlay" onClick={() => setShowLogs(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Application Logs</h2>
              <button
                className="modal-close"
                onClick={() => setShowLogs(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <pre className="logs-content">{logs || 'No logs available'}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Settings Page
 * Data management, theme toggle, import/export, about.
 */
import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import * as db from '../services/db';
import { Database, Download, Upload, Moon, Sun, Trash2, Info } from 'lucide-react';

export const SettingsPage = () => {
  const { state, showToast, confirm, toggleDarkMode, refreshTopics, refreshStats } = useAppContext();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportJSON = () => {
    setIsExporting(true);
    try {
      db.downloadJSON();
      showToast('Data exported as JSON', 'success');
    } catch (err) {
      showToast('Export failed: ' + err.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    try {
      db.exportAsCSV();
      showToast('Data exported as CSV', 'success');
    } catch (err) {
      showToast('Export failed: ' + err.message, 'error');
    }
  };

  const handleImportJSON = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await db.importFromJSON(file);
      refreshTopics();
      refreshStats();
      showToast('Data imported successfully', 'success');
      event.target.value = '';
    } catch (err) {
      showToast('Import failed: ' + err.message, 'error');
    }
  };

  const handleResetData = async () => {
    const confirmed = await confirm('This will permanently delete ALL your data. Are you sure?');
    if (!confirmed) return;
    db.resetDB();
    refreshTopics();
    refreshStats();
    showToast('All data has been reset', 'info');
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="text-muted">Manage your data and preferences.</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* Data & Storage */}
        <div className="settings-card">
          <div className="settings-card-header">
            <h3><Database size={20} /> Data & Storage</h3>
          </div>
          <div className="settings-card-body">
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-title">Export as JSON</div>
                <div className="setting-desc">Download a full backup of your data</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleExportJSON} disabled={isExporting}>
                <Download size={16} /> {isExporting ? 'Exporting...' : 'Export JSON'}
              </button>
            </div>
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-title">Export as CSV</div>
                <div className="setting-desc">Download topics as a spreadsheet</div>
              </div>
              <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
                <Download size={16} /> Export CSV
              </button>
            </div>
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-title">Import JSON Backup</div>
                <div className="setting-desc">Restore from a previously exported file</div>
              </div>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
                <Upload size={16} /> Import
                <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="settings-card">
          <div className="settings-card-header">
            <h3>{state.darkMode ? <Moon size={20} /> : <Sun size={20} />} Appearance</h3>
          </div>
          <div className="settings-card-body">
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-title">Dark Mode</div>
                <div className="setting-desc">
                  {state.darkMode ? 'Dark theme is active' : 'Light theme is active'}
                </div>
              </div>
              <button
                className={`theme-toggle ${state.darkMode ? 'active' : ''}`}
                onClick={toggleDarkMode}
                aria-label="Toggle dark mode"
              />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="settings-card">
          <div className="settings-card-header">
            <h3><Trash2 size={20} /> Danger Zone</h3>
          </div>
          <div className="settings-card-body">
            <div className="setting-row">
              <div className="setting-info">
                <div className="setting-title">Reset All Data</div>
                <div className="setting-desc">Permanently delete all topics, stats, and achievements</div>
              </div>
              <button className="btn btn-danger btn-sm" onClick={handleResetData}>
                <Trash2 size={16} /> Reset Everything
              </button>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="settings-card">
          <div className="settings-card-header">
            <h3><Info size={20} /> About</h3>
          </div>
          <div className="settings-card-body">
            <div className="about-content">
              <p><strong>Learning Assistant</strong> v2.0.0</p>
              <p style={{ marginTop: '0.5rem' }}>
                A modern learning management system to organize, track, and master your learning journey.
              </p>
              <ul>
                <li>Hierarchical topic tree with progress tracking</li>
                <li>Dashboard with analytics and insights</li>
                <li>XLSX/CSV import and JSON export</li>
                <li>Dark mode support</li>
                <li>Persistent localStorage-backed database</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

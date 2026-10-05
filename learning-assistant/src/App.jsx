/**
 * App Root Component
 * Renders the layout shell and routes to the active page.
 */
import React from 'react';
import { useAppContext } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { LearningTreePage } from './pages/LearningTreePage';
import { SettingsPage } from './pages/SettingsPage';
import './index.css';

const pages = {
  dashboard: Dashboard,
  learningTree: LearningTreePage,
  settings: SettingsPage,
};

function App() {
  const { state } = useAppContext();

  if (state.isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading your data...</p>
      </div>
    );
  }

  const PageComponent = pages[state.currentPage] || Dashboard;

  return (
    <Layout>
      <PageComponent />
    </Layout>
  );
}

export default App;

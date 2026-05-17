/**
 * Main App Component
 */
import React, { useState, useEffect } from 'react';
import { useAppContext } from './context/AppContext';
import { useTopics } from './hooks/useCustom';
import { requestFolderAccess } from './utils/fileSystem';
import { logger } from './utils/logger';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { LearningTreePage } from './pages/LearningTreePage';
import { SettingsPage } from './pages/SettingsPage';
import { Modal } from './components/Modal';
import './styles/Global.css';
import './App.css';

function App() {
  const { state, dispatch, actions } = useAppContext();
  const { addTopic, updateTopic, addSubtopic } = useTopics();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [modalState, setModalState] = useState({ isOpen: false, type: null, data: null });
  const [formData, setFormData] = useState({ title: '', description: '' });

  // Request folder access on first load
  useEffect(() => {
    const initApp = async () => {
      if (!state.folderSelected && !localStorage.getItem('folderAccessGranted')) {
        try {
          const handle = await requestFolderAccess();
          if (handle) {
            localStorage.setItem('folderAccessGranted', 'true');
            dispatch({ type: actions.SET_FOLDER_SELECTED, payload: true });
            logger.success('Folder access granted');
          }
        } catch (err) {
          logger.error('Folder access cancelled', err);
        }
      }
    };

    initApp();
  }, [state.folderSelected, dispatch, actions]);

  const showModal = (type, data = {}) => {
    setModalState({ isOpen: true, type, data });
    setFormData({ title: data.title || '', description: data.description || '' });
  };

  const closeModal = () => {
    setModalState({ isOpen: false, type: null, data: null });
    setFormData({ title: '', description: '' });
  };

  const handleSaveModal = () => {
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    try {
      if (modalState.type === 'addTopic') {
        addTopic({
          title: formData.title,
          description: formData.description,
          status: 'Not Started',
        });
        logger.success('Topic added', { title: formData.title });
      } else if (modalState.type === 'editTopic') {
        updateTopic(modalState.data.id, {
          title: formData.title,
          description: formData.description,
        });
        logger.success('Topic updated', { id: modalState.data.id });
      } else if (modalState.type === 'addSubtopic') {
        addSubtopic(modalState.data.parentId, {
          title: formData.title,
          description: formData.description,
          status: 'Not Started',
        });
        logger.success('Subtopic added', { title: formData.title });
      }

      closeModal();
      alert('✅ Saved successfully!');
    } catch (err) {
      logger.error('Error saving', err);
      alert('❌ Error: ' + err.message);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'learningTree':
        return <LearningTreePage onShowModal={showModal} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard />;
    }
  };

  if (state.isLoading) {
    return (
      <Layout>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </Layout>
    );
  }

  if (state.error) {
    return (
      <Layout>
        <div className="error-state">
          <h2>❌ Error</h2>
          <p>{state.error}</p>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Reload App
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="app-container">
        {/* Navigation */}
        <nav className="app-nav">
          <button
            className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={`nav-link ${currentPage === 'learningTree' ? 'active' : ''}`}
            onClick={() => setCurrentPage('learningTree')}
          >
            🌳 Learning Tree
          </button>
          <button
            className={`nav-link ${currentPage === 'settings' ? 'active' : ''}`}
            onClick={() => setCurrentPage('settings')}
          >
            ⚙️ Settings
          </button>
        </nav>

        {/* Page Content */}
        <div className="page-content">
          {renderPage()}
        </div>

        {/* Modal */}
        {modalState.isOpen && (
          <Modal
            type={modalState.type}
            data={modalState.data}
            formData={formData}
            onFormChange={(e) =>
              setFormData({
                ...formData,
                [e.target.name]: e.target.value,
              })
            }
            onSave={handleSaveModal}
            onClose={closeModal}
          />
        )}
      </div>
    </Layout>
  );
}

export default App;

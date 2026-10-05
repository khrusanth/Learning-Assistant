import { useCallback, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Check,
  FileUp,
  Layers3,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useTopics } from '../hooks/useTopics';
import { Modal } from '../components/Modal';
import { RoadmapNode } from '../components/RoadmapNode';
import { EmptyState } from '../components/EmptyState';
import { parseXLSXFile } from '../utils/xlsxParser';
import { logger } from '../utils/logger';
import { formatRoadmapTitle } from '../utils/formatRoadmapTitle';

function getLeafProgress(topic, topicsByParent) {
  const children = topicsByParent.get(topic.id) || [];
  if (children.length === 0) {
    return {
      total: 1,
      completed: topic.status === 'Completed' || topic.status === 'Mastered' ? 1 : 0,
    };
  }
  return children.reduce(
    (progress, child) => {
      const childProgress = getLeafProgress(child, topicsByParent);
      return {
        total: progress.total + childProgress.total,
        completed: progress.completed + childProgress.completed,
      };
    },
    { total: 0, completed: 0 }
  );
}

function matchesTopic(topic, topicsByParent, query) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return true;
  if (
    topic.title.toLocaleLowerCase().includes(normalized) ||
    topic.description?.toLocaleLowerCase().includes(normalized)
  ) {
    return true;
  }
  return (topicsByParent.get(topic.id) || []).some((child) =>
    matchesTopic(child, topicsByParent, normalized)
  );
}

export const LearningTreePage = () => {
  const { showToast, confirm } = useAppContext();
  const {
    topics,
    addTopic,
    updateTopic,
    deleteTopic,
    addSubtopic,
    changeStatus,
    importTopics,
  } = useTopics();
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [selectedRootId, setSelectedRootId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('addTopic');
  const [modalData, setModalData] = useState({});
  const [formData, setFormData] = useState({ title: '', description: '' });

  const topicsByParent = useMemo(() => {
    const map = new Map();
    for (const topic of topics) {
      if (!topic.parent) continue;
      const children = map.get(topic.parent) || [];
      children.push(topic);
      map.set(topic.parent, children);
    }
    return map;
  }, [topics]);
  const roots = useMemo(() => topics.filter((topic) => !topic.parent), [topics]);
  const matchingRoots = useMemo(
    () => roots.filter((root) => matchesTopic(root, topicsByParent, searchQuery)),
    [roots, topicsByParent, searchQuery]
  );
  const selectedRoot =
    matchingRoots.find((root) => root.id === selectedRootId) || matchingRoots[0] || null;

  const allLeafProgress = useMemo(
    () =>
      roots.reduce(
        (progress, root) => {
          const rootProgress = getLeafProgress(root, topicsByParent);
          return {
            total: progress.total + rootProgress.total,
            completed: progress.completed + rootProgress.completed,
          };
        },
        { total: 0, completed: 0 }
      ),
    [roots, topicsByParent]
  );
  const selectedProgress = selectedRoot
    ? getLeafProgress(selectedRoot, topicsByParent)
    : { total: 0, completed: 0 };
  const percentComplete = allLeafProgress.total
    ? Math.round((allLeafProgress.completed / allLeafProgress.total) * 100)
    : 0;

  const openModal = (type, data = {}) => {
    setModalType(type);
    setModalData(data);
    setFormData({ title: data.title || '', description: data.description || '' });
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setFormData({ title: '', description: '' });
  };
  const handleSave = () => {
    if (!formData.title.trim()) return;
    try {
      if (modalType === 'addTopic') {
        addTopic({ title: formData.title.trim(), description: formData.description.trim() });
        showToast('Roadmap section created', 'success');
      } else if (modalType === 'editTopic') {
        updateTopic(modalData.id, {
          title: formData.title.trim(),
          description: formData.description.trim(),
        });
        showToast('Topic updated', 'success');
      } else {
        addSubtopic(modalData.parentId, {
          title: formData.title.trim(),
          description: formData.description.trim(),
        });
        showToast('Subtopic added', 'success');
      }
      closeModal();
    } catch (error) {
      showToast(error.message, 'error');
    }
  };
  const handleImport = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setIsImporting(true);
      try {
        const parsed = await parseXLSXFile(file);
        importTopics(parsed);
        showToast(`Imported ${parsed.length} topics`, 'success');
      } catch (error) {
        logger.error('Import failed', error);
        showToast(`Import failed: ${error.message}`, 'error');
      } finally {
        setIsImporting(false);
        event.target.value = '';
      }
    },
    [importTopics, showToast]
  );
  const handleDelete = useCallback(
    async (topicId) => {
      const topic = topics.find((item) => item.id === topicId);
      const confirmed = await confirm(
        `Delete "${topic?.title || 'this topic'}" and all of its nested topics?`
      );
      if (!confirmed) return;
      deleteTopic(topicId);
      showToast('Topic and its subtopics deleted', 'success');
    },
    [confirm, deleteTopic, showToast, topics]
  );
  const getModalTitle = () => {
    if (modalType === 'addTopic') return 'Add roadmap section';
    if (modalType === 'editTopic') return 'Edit topic';
    return `Add a subtopic to ${modalData.parentTitle || 'this topic'}`;
  };
  const topicCount = (root) => getLeafProgress(root, topicsByParent).total;

  return (
    <div className="roadmap-page">
      <header className="roadmap-page-header">
        <div>
          <div className="eyebrow"><Sparkles size={14} /> YOUR LEARNING PLAN</div>
          <h1>Java full-stack roadmap</h1>
          <p>One clear path from programming fundamentals to production-ready projects.</p>
        </div>
        <div className="roadmap-header-actions">
          <label className="btn btn-secondary roadmap-import-btn">
            <FileUp size={17} />
            {isImporting ? 'Importing…' : 'Import topics'}
            <input
              type="file"
              accept=".xlsx,.csv,.xls"
              onChange={handleImport}
              disabled={isImporting}
              aria-label="Import topics from a spreadsheet"
            />
          </label>
          <button className="btn btn-primary" onClick={() => openModal('addTopic')}>
            <Plus size={17} /> Add section
          </button>
        </div>
      </header>

      <section className="roadmap-overview" aria-label="Roadmap progress">
        <div className="roadmap-overview-copy">
          <span className="roadmap-overview-kicker">KEEP YOUR MOMENTUM</span>
          <h2>{percentComplete === 0 ? 'Your next chapter starts here.' : 'You’re making progress.'}</h2>
          <p>Work through one concept at a time. Your progress is saved automatically.</p>
        </div>
        <div className="roadmap-progress-ring" style={{ '--progress': `${percentComplete}%` }}>
          <div>
            <strong>{percentComplete}%</strong>
            <span>complete</span>
          </div>
        </div>
        <div className="roadmap-overview-stats">
          <div><BookOpen size={18} /><strong>{roots.length}</strong><span>sections</span></div>
          <div><Layers3 size={18} /><strong>{allLeafProgress.total}</strong><span>concepts</span></div>
          <div><Check size={18} /><strong>{allLeafProgress.completed}</strong><span>completed</span></div>
        </div>
      </section>

      <section className="roadmap-explorer" aria-label="Explore roadmap">
        <aside className="roadmap-section-panel">
          <div className="roadmap-panel-heading">
            <div>
              <span className="eyebrow">ROADMAP INDEX</span>
              <h2>Sections</h2>
            </div>
            <span className="roadmap-section-total">{matchingRoots.length}</span>
          </div>
          <label className="search-wrapper roadmap-search">
            <Search size={17} className="search-icon" />
            <input
              className="form-input"
              type="search"
              placeholder="Find a topic…"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              aria-label="Search roadmap topics"
            />
          </label>
          <nav className="roadmap-section-list" aria-label="Roadmap sections">
            {matchingRoots.map((root) => {
              const progress = getLeafProgress(root, topicsByParent);
              const percentage = progress.total
                ? Math.round((progress.completed / progress.total) * 100)
                : 0;
              const selected = selectedRoot?.id === root.id;
              return (
                <button
                  key={root.id}
                  className={`roadmap-section-item ${selected ? 'selected' : ''}`}
                  onClick={() => setSelectedRootId(root.id)}
                  aria-current={selected ? 'page' : undefined}
                >
                  <span className="roadmap-section-number">
                    {String(roots.indexOf(root) + 1).padStart(2, '0')}
                  </span>
                  <span className="roadmap-section-details">
                    <strong>{formatRoadmapTitle(root.title)}</strong>
                    <span>{progress.completed} of {progress.total} concepts</span>
                    <span className="roadmap-section-track">
                      <span style={{ width: `${percentage}%` }} />
                    </span>
                  </span>
                  <span className="roadmap-section-percent">{percentage}%</span>
                </button>
              );
            })}
            {matchingRoots.length === 0 && (
              <p className="roadmap-no-results">No matching sections. Try another search.</p>
            )}
          </nav>
        </aside>

        <section className="roadmap-content-panel" aria-label="Selected roadmap section">
          {selectedRoot ? (
            <>
              <div className="roadmap-content-header">
                <div>
                  <span className="eyebrow">SECTION {String(roots.indexOf(selectedRoot) + 1).padStart(2, '0')}</span>
                  <h2>{formatRoadmapTitle(selectedRoot.title)}</h2>
                  <p>
                    {selectedRoot.description ||
                      'Explore the concepts below. Expand a group to reveal its topics.'}
                  </p>
                </div>
                <div className="roadmap-section-summary">
                  <strong>{selectedProgress.completed}<span> / {selectedProgress.total}</span></strong>
                  <span>concepts completed</span>
                </div>
              </div>
              <div className="roadmap-content-progress">
                <div>
                  <span>Section progress</span>
                  <strong>
                    {selectedProgress.total
                      ? Math.round((selectedProgress.completed / selectedProgress.total) * 100)
                      : 0}%
                  </strong>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${selectedProgress.total
                        ? (selectedProgress.completed / selectedProgress.total) * 100
                        : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div className="roadmap-tree">
                {(topicsByParent.get(selectedRoot.id) || [])
                  .filter((topic) => matchesTopic(topic, topicsByParent, searchQuery))
                  .map((topic) => (
                    <RoadmapNode
                      key={topic.id}
                      topic={topic}
                      topicsByParent={topicsByParent}
                      query={searchQuery}
                      onEdit={(item) => openModal('editTopic', item)}
                      onDelete={handleDelete}
                      onAddChild={(item) =>
                        openModal('addSubtopic', { parentId: item.id, parentTitle: item.title })
                      }
                      onStatusChange={changeStatus}
                    />
                  ))}
              </div>
              <button
                className="roadmap-add-link"
                onClick={() =>
                  openModal('addSubtopic', {
                    parentId: selectedRoot.id,
                    parentTitle: selectedRoot.title,
                  })
                }
              >
                <Plus size={16} /> Add a topic to this section
              </button>
            </>
          ) : (
            <EmptyState
              icon={BookOpen}
              title={searchQuery ? 'No topics found' : 'Your roadmap is empty'}
              description={
                searchQuery
                  ? 'Try a broader search to find a topic.'
                  : 'Create a section or import a spreadsheet to get started.'
              }
              action={
                !searchQuery && (
                  <button className="btn btn-primary" onClick={() => openModal('addTopic')}>
                    <Plus size={17} /> Add section
                  </button>
                )
              }
            />
          )}
          {selectedRoot && (
            <div className="roadmap-content-footer">
              <span><Check size={14} /> Your changes save automatically</span>
              <span>{topicCount(selectedRoot)} concepts in this section</span>
              <ArrowUpRight size={15} />
            </div>
          )}
        </section>
      </section>

      <Modal
        isOpen={modalOpen}
        title={getModalTitle()}
        onClose={closeModal}
        footer={
          <>
            <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={!formData.title.trim()}>
              Save topic
            </button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label" htmlFor="topic-title">Title *</label>
          <input
            id="topic-title"
            className="form-input"
            type="text"
            value={formData.title}
            onChange={(event) => setFormData({ ...formData, title: event.target.value })}
            placeholder="e.g. Java Fundamentals"
            autoFocus
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="topic-desc">Description</label>
          <textarea
            id="topic-desc"
            className="form-textarea"
            value={formData.description}
            onChange={(event) => setFormData({ ...formData, description: event.target.value })}
            placeholder="A short note about what you’ll learn"
          />
        </div>
      </Modal>
    </div>
  );
};

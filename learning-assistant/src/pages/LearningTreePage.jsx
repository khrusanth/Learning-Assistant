/**
 * Learning Tree Page
 */
import React, { useState, useCallback } from 'react';
import { useTopics } from '../hooks/useCustom';
import { LearningTree } from '../components/LearningTree';
import { Plus, Upload } from 'lucide-react';
import { parseXLSXFile } from '../utils/xlsxParser';
import { logger } from '../utils/logger';
import '../styles/LearningTreePage.css';

export const LearningTreePage = ({ onShowModal }) => {
  const { topics, addTopic, updateTopic, deleteTopic, addSubtopic } = useTopics();
  const [isImporting, setIsImporting] = useState(false);

  const handleImportXLSX = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsImporting(true);
      try {
        const importedTopics = await parseXLSXFile(file);

        // Add imported topics
        importedTopics.forEach((topic) => {
          // If it's a root topic
          if (!topic.parent) {
            addTopic({
              title: topic.title,
              description: topic.description,
              status: 'Not Started',
            });
          }
        });

        logger.success('Topics imported successfully', {
          count: importedTopics.length,
        });
        alert(`✅ Imported ${importedTopics.length} topics!`);
      } catch (err) {
        logger.error('Error importing topics', err);
        alert('❌ Error importing topics: ' + err.message);
      } finally {
        setIsImporting(false);
      }
    },
    [addTopic]
  );

  const handleAddTopic = () => {
    onShowModal('addTopic', {});
  };

  const handleEditTopic = (topic) => {
    onShowModal('editTopic', topic);
  };

  const handleDeleteTopic = (topicId) => {
    if (confirm('Are you sure you want to delete this topic and all its children?')) {
      deleteTopic(topicId);
      logger.info('Topic deleted', { topicId });
    }
  };

  const handleAddChild = (parentTopic) => {
    onShowModal('addSubtopic', { parentId: parentTopic.id, parentTitle: parentTopic.title });
  };

  return (
    <div className="learning-tree-page">
      <div className="page-header">
        <div>
          <h1>Learning Tree</h1>
          <p className="text-muted">Organize and manage your learning topics</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={handleAddTopic}>
            <Plus size={18} />
            Add Topic
          </button>
          <label className="btn btn-secondary">
            <Upload size={18} />
            Import XLSX
            <input
              type="file"
              accept=".xlsx"
              onChange={handleImportXLSX}
              style={{ display: 'none' }}
              disabled={isImporting}
            />
          </label>
        </div>
      </div>

      <LearningTree
        topics={topics}
        onEdit={handleEditTopic}
        onDelete={handleDeleteTopic}
        onAddChild={handleAddChild}
      />
    </div>
  );
};

/**
 * Tree Node Component for hierarchical display
 */
import React, { useState } from 'react';
import { ChevronDown, Plus, Edit2, Trash2 } from 'lucide-react';
import { TopicCard } from './TopicCard';
import '../styles/TreeNode.css';

export const TreeNode = ({
  topic,
  allTopics,
  level = 0,
  onEdit,
  onDelete,
  onAddChild,
  onStatusChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  const children = allTopics.filter((t) => t.parent === topic.id);
  const hasChildren = children.length > 0;

  return (
    <div className={`tree-node level-${level}`}>
      <div className="tree-node-header">
        {hasChildren && (
          <button
            className={`toggle-btn ${isExpanded ? 'expanded' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label="Toggle expand"
          >
            <ChevronDown size={20} />
          </button>
        )}
        {!hasChildren && <div className="toggle-placeholder"></div>}

        <div className="node-content">
          <TopicCard
            topic={topic}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            compact={level > 0}
          />
        </div>

        <button
          className="btn-icon add-btn"
          onClick={() => onAddChild(topic)}
          title="Add subtopic"
        >
          <Plus size={18} />
        </button>
      </div>

      {hasChildren && isExpanded && (
        <div className="tree-children">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              topic={child}
              allTopics={allTopics}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Learning Tree Component
 */
export const LearningTree = ({
  topics,
  onEdit,
  onDelete,
  onAddChild,
  onStatusChange,
}) => {
  const rootTopics = topics.filter((t) => !t.parent);

  if (rootTopics.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📚</div>
        <div className="empty-state-title">No Topics Yet</div>
        <div className="empty-state-description">
          Import topics from XLSX or create your first topic to get started
        </div>
      </div>
    );
  }

  return (
    <div className="learning-tree">
      {rootTopics.map((topic) => (
        <TreeNode
          key={topic.id}
          topic={topic}
          allTopics={topics}
          level={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
};

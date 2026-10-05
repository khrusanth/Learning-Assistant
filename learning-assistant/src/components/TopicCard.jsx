/**
 * Topic Card for the Learning Tree.
 * Displays a root topic with its subtopics, progress bar, and actions.
 */
import { useState } from 'react';
import {
  ChevronDown,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Circle,
} from 'lucide-react';

const StatusIcon = ({ status, size = 18 }) => {
  const isComplete = status === 'Completed' || status === 'Mastered';
  return isComplete ? (
    <CheckCircle2 size={size} className="icon-completed" />
  ) : (
    <Circle size={size} className="icon-pending" />
  );
};

const SubtopicRow = ({ topic, allTopics, onEdit, onDelete, onStatusChange }) => {
  const children = allTopics.filter((child) => child.parent === topic.id);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="subtopic-node">
      <div className="subtopic-row">
        {children.length > 0 && (
          <button
            className="subtopic-expand-btn"
            onClick={() => setExpanded(!expanded)}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${topic.title}`}
            aria-expanded={expanded}
          >
            <ChevronDown
              size={15}
              className={`toggle-chevron ${expanded ? 'expanded' : ''}`}
            />
          </button>
        )}
        {children.length === 0 && <span className="subtopic-expand-placeholder" />}
        <button
          className="topic-status-btn"
          onClick={() =>
            onStatusChange(
              topic.id,
              topic.status === 'Completed' ? 'Not Started' : 'Completed'
            )
          }
          aria-label={`Toggle ${topic.title} completion`}
        >
          <StatusIcon status={topic.status} size={16} />
        </button>
        <div className="subtopic-info">
          <div className="subtopic-title">{topic.title}</div>
          {topic.description && <div className="subtopic-desc">{topic.description}</div>}
        </div>
        <div className="subtopic-actions">
          <button className="btn-icon" onClick={() => onEdit(topic)} aria-label="Edit">
            <Edit3 size={14} />
          </button>
          <button className="btn-icon danger" onClick={() => onDelete(topic.id)} aria-label="Delete">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {expanded && children.length > 0 && (
        <div className="nested-subtopics-list">
          {children.map((child) => (
            <SubtopicRow
              key={child.id}
              topic={child}
              allTopics={allTopics}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const TopicCard = ({
  topic,
  allTopics,
  onEdit,
  onDelete,
  onAddChild,
  onStatusChange,
}) => {
  const [expanded, setExpanded] = useState(true);
  const children = allTopics.filter((t) => t.parent === topic.id);
  const hasChildren = children.length > 0;
  const completedCount = children.filter(
    (c) => c.status === 'Completed' || c.status === 'Mastered'
  ).length;
  const progressPct = hasChildren
    ? Math.round((completedCount / children.length) * 100)
    : 0;

  return (
    <div className="topic-card">
      {/* Header */}
      <div className="topic-card-header">
        <div className="topic-header-left">
          <button
            className="topic-status-btn"
            onClick={() =>
              onStatusChange(
                topic.id,
                topic.status === 'Completed' ? 'Not Started' : 'Completed'
              )
            }
            aria-label={`Toggle ${topic.title} completion`}
          >
            <StatusIcon status={topic.status} size={20} />
          </button>
          <div className="topic-info">
            <h3 className="topic-title">{topic.title}</h3>
            {topic.description && <p className="topic-desc">{topic.description}</p>}
          </div>
        </div>
        <div className="topic-actions">
          <button className="btn-icon" onClick={() => onEdit(topic)} aria-label="Edit topic">
            <Edit3 size={16} />
          </button>
          <button className="btn-icon danger" onClick={() => onDelete(topic.id)} aria-label="Delete topic">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Progress */}
      {hasChildren && (
        <div className="topic-progress-section">
          <div className="topic-progress-info">
            <span>Progress</span>
            <span>{completedCount} / {children.length} completed</span>
          </div>
          <div className="progress-track">
            <div
              className={`progress-fill ${progressPct === 100 ? 'success' : ''}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtopics */}
      {hasChildren && (
        <div className="subtopics-section">
          <button
            className="subtopics-toggle"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronDown
              size={16}
              className={`toggle-chevron ${expanded ? 'expanded' : ''}`}
            />
            <span>Subtopics ({children.length})</span>
          </button>
          {expanded && (
            <div className="subtopics-list">
              {children.map((child) => (
                <SubtopicRow
                  key={child.id}
                  topic={child}
                  allTopics={allTopics}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onStatusChange={onStatusChange}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="topic-card-footer">
        <button className="btn-add-subtopic" onClick={() => onAddChild(topic)}>
          <Plus size={14} />
          Add Subtopic
        </button>
      </div>
    </div>
  );
};

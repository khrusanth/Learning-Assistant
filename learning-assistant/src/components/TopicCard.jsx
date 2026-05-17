/**
 * Topic Card Component
 */
import React from 'react';
import { CheckCircle2, Circle, AlertCircle, Trash2, Edit2 } from 'lucide-react';
import { CompletionStatus } from '../utils/businessLogic';
import '../styles/TopicCard.css';

export const TopicCard = ({
  topic,
  onEdit,
  onDelete,
  onStatusChange,
  onClick,
  compact = false,
}) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case CompletionStatus.COMPLETED:
      case CompletionStatus.MASTERED:
        return <CheckCircle2 size={20} className="text-success" />;
      case CompletionStatus.IN_PROGRESS:
        return <AlertCircle size={20} className="text-warning" />;
      default:
        return <Circle size={20} className="text-muted" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case CompletionStatus.COMPLETED:
        return 'success';
      case CompletionStatus.MASTERED:
        return 'primary';
      case CompletionStatus.IN_PROGRESS:
        return 'warning';
      case CompletionStatus.NEEDS_REVISION:
        return 'danger';
      default:
        return 'primary';
    }
  };

  if (compact) {
    return (
      <div className="topic-card-compact" onClick={onClick}>
        <div className="compact-header">
          <span className="compact-title">{topic.title}</span>
          <span className="compact-progress">{topic.progress}%</span>
        </div>
        <div className="compact-progress-bar">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${topic.progress}%` }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="topic-card" onClick={onClick}>
      <div className="card-header">
        <div className="header-content">
          {getStatusIcon(topic.status)}
          <div>
            <h3 className="card-title">{topic.title}</h3>
            {topic.description && (
              <p className="card-description">{topic.description}</p>
            )}
          </div>
        </div>
        <div className="card-actions">
          <button
            className="btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(topic);
            }}
            aria-label="Edit topic"
          >
            <Edit2 size={18} />
          </button>
          <button
            className="btn-icon danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(topic.id);
            }}
            aria-label="Delete topic"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="card-body">
        <div className="status-badge">
          <span className={`badge badge-${getStatusColor(topic.status)}`}>
            {topic.status}
          </span>
        </div>

        <div className="progress-section">
          <div className="progress-header">
            <span>Progress</span>
            <span className="progress-value">{topic.progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${topic.progress}%` }}></div>
          </div>
        </div>

        {topic.confidence > 0 && (
          <div className="confidence-section">
            <span>Confidence: {topic.confidence}%</span>
          </div>
        )}

        {topic.tags && topic.tags.length > 0 && (
          <div className="tags-section">
            {topic.tags.map((tag, idx) => (
              <span key={idx} className="badge badge-primary">
                {tag}
              </span>
            ))}
          </div>
        )}

        {topic.resources && topic.resources.length > 0 && (
          <div className="resources-count">
            📎 {topic.resources.length} resource(s)
          </div>
        )}
      </div>
    </div>
  );
};

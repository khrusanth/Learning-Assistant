import { useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Folder,
  FolderOpen,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';

export const RoadmapNode = ({
  topic,
  topicsByParent,
  query,
  level = 0,
  onEdit,
  onDelete,
  onAddChild,
  onStatusChange,
}) => {
  const [expanded, setExpanded] = useState(false);
  const children = useMemo(
    () => topicsByParent.get(topic.id) || [],
    [topic.id, topicsByParent]
  );
  const hasChildren = children.length > 0;
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleChildren = useMemo(
    () =>
      normalizedQuery
        ? children.filter((child) => {
            const matches = (node) => {
              if (
                node.title.toLocaleLowerCase().includes(normalizedQuery) ||
                node.description?.toLocaleLowerCase().includes(normalizedQuery)
              ) {
                return true;
              }
              return (topicsByParent.get(node.id) || []).some(matches);
            };
            return matches(child);
          })
        : children,
    [children, normalizedQuery, topicsByParent]
  );
  const completedLeaves = (node) => {
    const descendants = topicsByParent.get(node.id) || [];
    if (descendants.length === 0) {
      return node.status === 'Completed' || node.status === 'Mastered' ? 1 : 0;
    }
    return descendants.reduce((count, child) => count + completedLeaves(child), 0);
  };
  const totalLeaves = (node) => {
    const descendants = topicsByParent.get(node.id) || [];
    if (descendants.length === 0) return 1;
    return descendants.reduce((count, child) => count + totalLeaves(child), 0);
  };
  const leafTotal = hasChildren ? visibleChildren.reduce((count, child) => count + totalLeaves(child), 0) : 0;
  const leafDone = hasChildren ? visibleChildren.reduce((count, child) => count + completedLeaves(child), 0) : 0;
  const open = expanded || Boolean(normalizedQuery && visibleChildren.length > 0);
  const completed = topic.status === 'Completed' || topic.status === 'Mastered';

  return (
    <div className={`roadmap-node ${level === 0 ? 'roadmap-node-root' : ''}`}>
      <div className={`roadmap-node-row ${hasChildren ? 'has-children' : ''}`}>
        <button
          className={`roadmap-node-disclosure ${hasChildren ? '' : 'is-placeholder'}`}
          onClick={() => hasChildren && setExpanded(!open)}
          aria-label={`${open ? 'Collapse' : 'Expand'} ${topic.title}`}
          aria-expanded={hasChildren ? open : undefined}
          disabled={!hasChildren}
        >
          {hasChildren && (open ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
        </button>
        {hasChildren ? (
          <span className="roadmap-node-status roadmap-node-folder" aria-hidden="true">
            {open ? <FolderOpen size={16} /> : <Folder size={16} />}
          </span>
        ) : (
          <button
            className={`roadmap-node-status ${completed ? 'is-complete' : ''}`}
            onClick={() => onStatusChange(topic.id, completed ? 'Not Started' : 'Completed')}
            aria-label={`${completed ? 'Mark incomplete' : 'Mark complete'}: ${topic.title}`}
            title={completed ? 'Mark as not started' : 'Mark as complete'}
          >
            {completed ? <Check size={14} /> : <Circle size={16} />}
          </button>
        )}
        <button
          className="roadmap-node-label"
          onClick={() => hasChildren && setExpanded(!open)}
          aria-expanded={hasChildren ? open : undefined}
        >
          <span className="roadmap-node-title">{topic.title}</span>
          {topic.description && <span className="roadmap-node-description">{topic.description}</span>}
        </button>
        {hasChildren && (
          <span className="roadmap-node-count">
            {leafDone > 0 ? `${leafDone} / ` : ''}{leafTotal}
          </span>
        )}
        <div className="roadmap-node-actions">
          <button
            className="btn-icon"
            onClick={() => onAddChild(topic)}
            aria-label={`Add a topic under ${topic.title}`}
            title="Add subtopic"
          >
            <Plus size={15} />
          </button>
          <button className="btn-icon" onClick={() => onEdit(topic)} aria-label={`Edit ${topic.title}`}>
            <Pencil size={14} />
          </button>
          <button
            className="btn-icon danger"
            onClick={() => onDelete(topic.id)}
            aria-label={`Delete ${topic.title}`}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {open && visibleChildren.length > 0 && (
        <div className="roadmap-node-children" role="group">
          {visibleChildren.map((child) => (
            <RoadmapNode
              key={child.id}
              topic={child}
              topicsByParent={topicsByParent}
              query={query}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
      {open && visibleChildren.length === 0 && hasChildren && (
        <div className="roadmap-node-empty"><FolderOpen size={15} /> No matching subtopics</div>
      )}
    </div>
  );
};

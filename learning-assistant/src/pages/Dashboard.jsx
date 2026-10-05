import { useMemo } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Circle,
  Layers3,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useTopics } from '../hooks/useTopics';
import { formatRoadmapTitle } from '../utils/formatRoadmapTitle';

const isComplete = (topic) => topic.status === 'Completed' || topic.status === 'Mastered';

function getProgress(topic, childrenByParent) {
  const children = childrenByParent.get(topic.id) || [];
  if (!children.length) return { total: 1, completed: isComplete(topic) ? 1 : 0 };
  return children.reduce(
    (progress, child) => {
      const childProgress = getProgress(child, childrenByParent);
      return {
        total: progress.total + childProgress.total,
        completed: progress.completed + childProgress.completed,
      };
    },
    { total: 0, completed: 0 }
  );
}

function findNextTopic(topic, childrenByParent, ancestors = []) {
  const path = [...ancestors, topic.title];
  const children = childrenByParent.get(topic.id) || [];
  if (!children.length) return isComplete(topic) ? null : { topic, path };
  for (const child of children) {
    const next = findNextTopic(child, childrenByParent, path);
    if (next) return next;
  }
  return null;
}

export const Dashboard = () => {
  const { state, navigate } = useAppContext();
  const { topics, stats } = state;
  const { changeStatus } = useTopics();
  const childrenByParent = useMemo(() => {
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
  const progress = useMemo(
    () =>
      roots.reduce(
        (total, root) => {
          const section = getProgress(root, childrenByParent);
          return {
            total: total.total + section.total,
            completed: total.completed + section.completed,
          };
        },
        { total: 0, completed: 0 }
      ),
    [childrenByParent, roots]
  );
  const nextUp = useMemo(
    () => roots.map((root) => findNextTopic(root, childrenByParent)).find(Boolean),
    [childrenByParent, roots]
  );
  const sections = useMemo(
    () =>
      roots
        .map((root) => {
          const section = getProgress(root, childrenByParent);
          return {
            ...root,
            ...section,
            percentage: section.total ? Math.round((section.completed / section.total) * 100) : 0,
          };
        })
        .sort((a, b) => a.percentage - b.percentage)
        .slice(0, 6),
    [childrenByParent, roots]
  );
  const percentage = progress.total ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <div className="dashboard-page">
      <header className="dashboard-heading">
        <div>
          <span className="eyebrow"><Sparkles size={14} /> YOUR LEARNING SPACE</span>
          <h1>Good to see you.</h1>
          <p>Small steps add up. Pick up where you left off.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('learningTree')}>
          Explore roadmap <ArrowRight size={16} />
        </button>
      </header>

      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <span className="dashboard-hero-kicker">JAVA FULL-STACK ROADMAP</span>
          <h2>{percentage ? `${percentage}% of your roadmap complete` : 'Build your skills, layer by layer.'}</h2>
          <p>
            {progress.completed} of {progress.total} concepts complete across {roots.length} learning sections.
            Your progress is saved as you go.
          </p>
          <div className="dashboard-hero-track">
            <span style={{ width: `${percentage}%` }} />
          </div>
          <button className="dashboard-hero-link" onClick={() => navigate('learningTree')}>
            Open your roadmap <ArrowRight size={16} />
          </button>
        </div>
        <div className="dashboard-hero-mark" aria-hidden="true">
          <div className="dashboard-mark-orbit">
            <Target size={42} strokeWidth={1.4} />
          </div>
          <span>Keep going</span>
        </div>
      </section>

      <section className="dashboard-stats" aria-label="Learning statistics">
        <article className="dashboard-stat">
          <span className="dashboard-stat-icon"><BookOpen size={18} /></span>
          <div><strong>{roots.length}</strong><span>Learning sections</span></div>
        </article>
        <article className="dashboard-stat">
          <span className="dashboard-stat-icon"><Layers3 size={18} /></span>
          <div><strong>{progress.total}</strong><span>Concepts to explore</span></div>
        </article>
        <article className="dashboard-stat">
          <span className="dashboard-stat-icon dashboard-stat-icon-green"><CheckCircle2 size={18} /></span>
          <div><strong>{progress.completed}</strong><span>Concepts completed</span></div>
        </article>
        <article className="dashboard-stat">
          <span className="dashboard-stat-icon dashboard-stat-icon-gold"><Trophy size={18} /></span>
          <div><strong>{stats.level}</strong><span>Current level</span></div>
        </article>
      </section>

      <div className="dashboard-lower-grid">
        <section className="dashboard-panel dashboard-next-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span className="eyebrow">A GOOD PLACE TO START</span>
              <h2>Up next</h2>
            </div>
            <Circle size={19} />
          </div>
          {nextUp ? (
            <>
              <div className="dashboard-next-path">
                {nextUp.path.map(formatRoadmapTitle).join('  /  ')}
              </div>
              <h3>{nextUp.topic.title}</h3>
              <p>{nextUp.topic.description || 'A new concept on your Java full-stack journey.'}</p>
              <button
                className="btn btn-primary dashboard-complete-btn"
                onClick={() => changeStatus(nextUp.topic.id, 'Completed')}
              >
                <Check size={16} /> Mark as complete
              </button>
            </>
          ) : (
            <div className="dashboard-all-done">
              <CheckCircle2 size={25} />
              <strong>You’ve completed every concept.</strong>
              <span>Explore a section to review or add more topics.</span>
            </div>
          )}
        </section>

        <section className="dashboard-panel dashboard-sections-panel">
          <div className="dashboard-panel-heading">
            <div>
              <span className="eyebrow">YOUR PROGRESS</span>
              <h2>Sections to focus on</h2>
            </div>
            <button
              className="dashboard-text-link"
              onClick={() => navigate('learningTree')}
              aria-label="View all roadmap sections"
            >
              View all <ArrowRight size={15} />
            </button>
          </div>
          <div className="dashboard-section-list">
            {sections.map((section) => (
              <button
                className="dashboard-section-row"
                key={section.id}
                onClick={() => navigate('learningTree')}
              >
                <span className="dashboard-section-name">{formatRoadmapTitle(section.title)}</span>
                <span className="dashboard-section-track">
                  <span style={{ width: `${section.percentage}%` }} />
                </span>
                <span className="dashboard-section-value">{section.percentage}%</span>
              </button>
            ))}
            {sections.length === 0 && <p className="text-muted">Your roadmap sections will appear here.</p>}
          </div>
        </section>
      </div>
    </div>
  );
};

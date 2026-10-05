/**
 * JSON Database Service
 * Single localStorage-backed store for all application data.
 * Every mutation auto-persists immediately.
 */

const DB_KEY = 'learning-assistant-db';

const DEFAULT_DB = {
  topics: [],
  stats: {
    totalXP: 0,
    level: 1,
    streak: 0,
    totalCompleted: 0,
    lastActivityDate: null,
  },
  achievements: [],
  meta: {
    version: '2.0.0',
    createdAt: new Date().toISOString(),
    lastModified: null,
  },
};

/** Generate a unique ID */
const generateId = () =>
  `topic_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

/** Read the full database from localStorage */
export const getDB = () => {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return structuredClone(DEFAULT_DB);
    const parsed = JSON.parse(raw);
    // Merge with defaults so new fields are always present
    return {
      ...structuredClone(DEFAULT_DB),
      ...parsed,
      stats: { ...DEFAULT_DB.stats, ...(parsed.stats || {}) },
      meta: { ...DEFAULT_DB.meta, ...(parsed.meta || {}) },
    };
  } catch {
    return structuredClone(DEFAULT_DB);
  }
};

/** Write the full database to localStorage */
export const saveDB = (db) => {
  try {
    db.meta.lastModified = new Date().toISOString();
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (err) {
    console.error('[DB] Failed to save:', err);
  }
};

// ─── Topic CRUD ────────────────────────────────────────────────

/** Get all topics */
export const getAllTopics = () => getDB().topics;

/** Replace all topics (used for bulk operations like import) */
export const setAllTopics = (topics) => {
  const db = getDB();
  db.topics = topics;
  saveDB(db);
  return topics;
};

/** Add a new root topic or standalone topic */
export const addTopic = (data) => {
  const db = getDB();
  const topic = {
    id: generateId(),
    title: data.title || 'Untitled',
    description: data.description || '',
    status: data.status || 'Not Started',
    progress: data.progress || 0,
    confidence: data.confidence || 0,
    parent: data.parent || null,
    children: data.children || [],
    tags: data.tags || [],
    notes: data.notes || '',
    resources: data.resources || [],
    revisions: data.revisions || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
  };
  db.topics.push(topic);
  saveDB(db);
  return topic;
};

/** Update a topic by ID (partial update) */
export const updateTopic = (id, updates) => {
  const db = getDB();
  const idx = db.topics.findIndex((t) => t.id === id);
  if (idx === -1) throw new Error(`Topic not found: ${id}`);
  db.topics[idx] = {
    ...db.topics[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveDB(db);
  return db.topics[idx];
};

/** Delete a topic and all its descendants recursively */
export const deleteTopic = (id) => {
  const db = getDB();
  const idsToDelete = new Set();

  const collectDescendants = (topicId) => {
    idsToDelete.add(topicId);
    db.topics
      .filter((t) => t.parent === topicId)
      .forEach((child) => collectDescendants(child.id));
  };

  collectDescendants(id);

  // Remove the topic from its parent's children array
  const topic = db.topics.find((t) => t.id === id);
  if (topic && topic.parent) {
    const parent = db.topics.find((t) => t.id === topic.parent);
    if (parent) {
      parent.children = parent.children.filter((cid) => cid !== id);
    }
  }

  db.topics = db.topics.filter((t) => !idsToDelete.has(t.id));
  saveDB(db);
};

/** Add a subtopic under a parent */
export const addSubtopic = (parentId, data) => {
  const db = getDB();
  const parentIdx = db.topics.findIndex((t) => t.id === parentId);
  if (parentIdx === -1) throw new Error(`Parent not found: ${parentId}`);

  const child = {
    id: generateId(),
    title: data.title || 'Untitled',
    description: data.description || '',
    status: data.status || 'Not Started',
    progress: 0,
    confidence: 0,
    parent: parentId,
    children: [],
    tags: [],
    notes: '',
    resources: [],
    revisions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
  };

  db.topics[parentIdx].children = [
    ...(db.topics[parentIdx].children || []),
    child.id,
  ];
  db.topics[parentIdx].updatedAt = new Date().toISOString();
  db.topics.push(child);
  saveDB(db);
  return child;
};

// ─── Stats ─────────────────────────────────────────────────────

/** Get user stats */
export const getStats = () => getDB().stats;

/** Update stats (partial merge) */
export const updateStats = (updates) => {
  const db = getDB();
  db.stats = { ...db.stats, ...updates };
  saveDB(db);
  return db.stats;
};

// ─── Achievements ──────────────────────────────────────────────

export const getAchievements = () => getDB().achievements;

export const addAchievement = (data) => {
  const db = getDB();
  const achievement = {
    id: `ach_${Date.now()}`,
    ...data,
    unlockedAt: new Date().toISOString(),
  };
  db.achievements.push(achievement);
  saveDB(db);
  return achievement;
};

// ─── Import / Export / Reset ───────────────────────────────────

/** Import topics from an array (e.g. from XLSX or sample data) */
export const importTopics = (topicsArray) => {
  const db = getDB();
  db.topics = [...db.topics, ...topicsArray];
  saveDB(db);
  return db.topics;
};

/** Export the full DB as a downloadable JSON string */
export const exportAsJSON = () => {
  return JSON.stringify(getDB(), null, 2);
};

/** Trigger a browser download of the DB */
export const downloadJSON = () => {
  const json = exportAsJSON();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `learning-assistant-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/** Import from a JSON file (returns a promise) */
export const importFromJSON = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.topics) {
          saveDB({ ...getDB(), ...data, meta: { ...getDB().meta, ...data.meta } });
          resolve(data);
        } else {
          reject(new Error('Invalid backup file: no topics found'));
        }
      } catch (err) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

/** Reset the entire database */
export const resetDB = () => {
  localStorage.removeItem(DB_KEY);
};

/** Convert topics to CSV for export */
export const exportAsCSV = () => {
  const topics = getAllTopics();
  const headers = ['ID', 'Title', 'Description', 'Parent', 'Status', 'Progress', 'Confidence', 'CreatedAt'];
  const rows = topics.map((t) => [
    t.id,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.parent || '',
    t.status,
    t.progress,
    t.confidence,
    t.createdAt,
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `learning-assistant-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

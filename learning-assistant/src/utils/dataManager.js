/**
 * CSV/JSON utilities for data persistence
 */
import { writeFile, readFile, fileExists } from './fileSystem';
import { logger } from './logger';

const TOPICS_FILE = 'topics.json';
const PROGRESS_FILE = 'progress.json';
const ACHIEVEMENTS_FILE = 'achievements.json';
const REVISION_FILE = 'revisions.json';
const USER_STATS_FILE = 'user-stats.json';

/**
 * Parse XLSX data structure to topics
 * Expected format from XLSX:
 * Column 1: Topic/Category (main topics)
 * Column 2: Subtopic (child topics)
 */
export const parseXLSXData = (xlsxData) => {
  const topics = [];
  let currentTopic = null;
  const uniqueTopics = new Map();

  // xlsxData should be array of rows
  for (const row of xlsxData) {
    const mainTopic = row[0];
    const subTopic = row[1];

    // Skip empty rows
    if (!mainTopic && !subTopic) continue;

    // New main topic
    if (mainTopic && !subTopic) {
      const topicName = mainTopic.toString().trim();
      if (!uniqueTopics.has(topicName)) {
        currentTopic = {
          id: generateId(),
          title: topicName,
          description: '',
          parent: null,
          children: [],
          status: 'Not Started',
          progress: 0,
          confidence: 0,
          tags: [],
          notes: '',
          resources: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: null,
          revisions: [],
        };
        topics.push(currentTopic);
        uniqueTopics.set(topicName, currentTopic);
      } else {
        currentTopic = uniqueTopics.get(topicName);
      }
    }
    // Subtopic
    else if (subTopic && currentTopic) {
      const subTopicName = subTopic.toString().trim();
      const childTopic = {
        id: generateId(),
        title: subTopicName,
        description: '',
        parent: currentTopic.id,
        children: [],
        status: 'Not Started',
        progress: 0,
        confidence: 0,
        tags: [],
        notes: '',
        resources: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completedAt: null,
        revisions: [],
      };
      currentTopic.children.push(childTopic.id);
      topics.push(childTopic);
    }
  }

  return topics;
};

// Generate unique ID
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Load all data from files
export const loadAllData = async () => {
  try {
    const data = {
      topics: [],
      progress: {},
      achievements: [],
      revisions: [],
      stats: {},
    };

    // Load topics
    try {
      const topicsContent = await readFile(TOPICS_FILE);
      data.topics = JSON.parse(topicsContent);
      logger.info('Topics loaded', { count: data.topics.length });
    } catch (err) {
      logger.info('Topics file not found, will create on save');
    }

    // Load progress
    try {
      const progressContent = await readFile(PROGRESS_FILE);
      data.progress = JSON.parse(progressContent);
      logger.info('Progress loaded');
    } catch (err) {
      logger.info('Progress file not found');
    }

    // Load achievements
    try {
      const achievementsContent = await readFile(ACHIEVEMENTS_FILE);
      data.achievements = JSON.parse(achievementsContent);
      logger.info('Achievements loaded');
    } catch (err) {
      logger.info('Achievements file not found');
    }

    // Load revisions
    try {
      const revisionsContent = await readFile(REVISION_FILE);
      data.revisions = JSON.parse(revisionsContent);
      logger.info('Revisions loaded');
    } catch (err) {
      logger.info('Revisions file not found');
    }

    // Load user stats
    try {
      const statsContent = await readFile(USER_STATS_FILE);
      data.stats = JSON.parse(statsContent);
      logger.info('User stats loaded');
    } catch (err) {
      logger.info('User stats file not found');
    }

    return data;
  } catch (err) {
    logger.error('Error loading data', err);
    throw err;
  }
};

// Save topics
export const saveTopics = async (topics) => {
  try {
    await writeFile(TOPICS_FILE, JSON.stringify(topics, null, 2));
    logger.success('Topics saved', { count: topics.length });
  } catch (err) {
    logger.error('Error saving topics', err);
    throw err;
  }
};

// Save progress
export const saveProgress = async (progress) => {
  try {
    await writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
    logger.info('Progress saved');
  } catch (err) {
    logger.error('Error saving progress', err);
    throw err;
  }
};

// Save achievements
export const saveAchievements = async (achievements) => {
  try {
    await writeFile(ACHIEVEMENTS_FILE, JSON.stringify(achievements, null, 2));
    logger.info('Achievements saved');
  } catch (err) {
    logger.error('Error saving achievements', err);
    throw err;
  }
};

// Save revisions
export const saveRevisions = async (revisions) => {
  try {
    await writeFile(REVISION_FILE, JSON.stringify(revisions, null, 2));
    logger.info('Revisions saved');
  } catch (err) {
    logger.error('Error saving revisions', err);
    throw err;
  }
};

// Save user stats
export const saveUserStats = async (stats) => {
  try {
    await writeFile(USER_STATS_FILE, JSON.stringify(stats, null, 2));
    logger.info('User stats saved');
  } catch (err) {
    logger.error('Error saving stats', err);
    throw err;
  }
};

// Convert topics to CSV format
export const topicsToCSV = (topics) => {
  const headers = [
    'ID',
    'Title',
    'Parent',
    'Status',
    'Progress',
    'Confidence',
    'Tags',
    'CreatedAt',
    'UpdatedAt',
  ];
  const rows = topics.map((topic) => [
    topic.id,
    topic.title,
    topic.parent || '',
    topic.status,
    topic.progress,
    topic.confidence,
    topic.tags.join(';'),
    topic.createdAt,
    topic.updatedAt,
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
        .join(',')
    )
    .join('\n');

  return csv;
};

// Export data as CSV backup
export const exportDataAsCSV = async (topics) => {
  try {
    const csv = topicsToCSV(topics);
    await writeFile('topics-backup.csv', csv);
    logger.success('Data exported as CSV');
    return csv;
  } catch (err) {
    logger.error('Error exporting data', err);
    throw err;
  }
};

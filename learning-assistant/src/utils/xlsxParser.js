/**
 * XLSX / CSV parser for flat topic/subtopic sheets and grouped roadmap sheets.
 */
import * as XLSX from 'xlsx';
import { logger } from './logger.js';

const HEADER_NAMES = {
  root: new Set(['topic', 'main', 'category', 'topicname', 'maintopic']),
  group: new Set(['subtopic', 'sub', 'subtopicname', 'group', 'section']),
  concept: new Set(['concept', 'item', 'detail', 'learningobjective']),
  description: new Set(['description', 'explanation', 'notes']),
};

const generateId = () =>
  `imp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

const normalize = (value) =>
  String(value ?? '')
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]/g, '');

const text = (value) => String(value ?? '').trim();

function createTopicObj(title, parentId, description = '') {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title,
    description,
    status: 'Not Started',
    progress: 0,
    confidence: 0,
    parent: parentId,
    children: [],
    tags: [],
    notes: '',
    resources: [],
    revisions: [],
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };
}

/**
 * Parse XLSX or CSV sheets using Topic/Subtopic columns, Sub Topic/Concept
 * columns, or the grouped outline layout used by the organized roadmap.
 */
export const parseXLSXFile = async (file) => {
  logger.info('Parsing file', { name: file.name, size: file.size });

  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const allTopics = [];
  const topicsByParentAndTitle = new Map();

  const addOrGetTopic = (title, parentId = null, description = '') => {
    const cleanTitle = text(title);
    if (!cleanTitle) return null;

    const key = `${parentId || 'root'}|${normalize(cleanTitle)}`;
    const existing = topicsByParentAndTitle.get(key);
    if (existing) {
      if (description && !existing.description) existing.description = description;
      return existing;
    }

    const topic = createTopicObj(cleanTitle, parentId, text(description));
    topicsByParentAndTitle.set(key, topic);
    allTopics.push(topic);
    if (parentId) {
      const parent = allTopics.find((item) => item.id === parentId);
      if (!parent) throw new Error(`Could not find parent topic "${parentId}"`);
      parent.children.push(topic.id);
    }
    return topic;
  };

  const getHeaderIndexes = (row) => {
    const indexes = {};
    row.forEach((cell, index) => {
      const header = normalize(cell);
      for (const [key, names] of Object.entries(HEADER_NAMES)) {
        if (indexes[key] === undefined && names.has(header)) indexes[key] = index;
      }
    });
    return indexes;
  };

  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      defval: '',
      blankrows: false,
    });
    if (!rows.length) continue;

    const headers = getHeaderIndexes(rows[0]);
    const hasRoot = headers.root !== undefined;
    const hasGroup = headers.group !== undefined;
    const hasConcept = headers.concept !== undefined;
    const hasRecognizedHeader = hasRoot || hasGroup || hasConcept;

    if (hasRecognizedHeader) {
      for (const row of rows.slice(1)) {
        const rootTitle = hasRoot ? text(row[headers.root]) : '';
        const groupTitle = hasGroup ? text(row[headers.group]) : '';
        const conceptTitle = hasConcept ? text(row[headers.concept]) : '';
        const description =
          headers.description === undefined ? '' : text(row[headers.description]);
        if (!rootTitle && !groupTitle && !conceptTitle) continue;

        if (hasRoot && !rootTitle && (groupTitle || conceptTitle)) {
          throw new Error(
            `Sheet "${sheetName}" has a topic row without a root topic. Add a value in the Topic column.`
          );
        }
        const root = addOrGetTopic(rootTitle || sheetName);
        if (!root) continue;

        if (groupTitle) {
          const group = addOrGetTopic(groupTitle, root.id);
          if (conceptTitle) addOrGetTopic(conceptTitle, group.id, description);
        } else if (conceptTitle) {
          addOrGetTopic(conceptTitle, root.id, description);
        } else if (description && !root.description) {
          root.description = description;
        }
      }
      logger.info(`Parsed sheet "${sheetName}"`, {
        topics: allTopics.length,
        format: 'tabular',
      });
      continue;
    }

    let currentRoot = null;
    let currentGroup = null;
    for (const [rowIndex, row] of rows.entries()) {
      const first = row[0];
      const second = text(row[1]);
      const firstText = text(first);
      const remainingEmpty = row.slice(1).every((cell) => !text(cell));

      if (!firstText && !second) continue;
      if (
        rowIndex === 0 &&
        firstText &&
        normalize(firstText) === normalize(sheetName) &&
        remainingEmpty
      ) {
        currentRoot = addOrGetTopic(sheetName);
        continue;
      }

      if (typeof first === 'number' && second && currentRoot && currentGroup) {
        addOrGetTopic(second, currentGroup.id, text(row[2]));
        continue;
      }
      if (typeof first === 'string' && firstText && second && row.length <= 2) {
        const root = addOrGetTopic(firstText);
        addOrGetTopic(second, root.id);
        continue;
      }
      if (firstText && remainingEmpty) {
        if (!currentRoot) currentRoot = addOrGetTopic(sheetName);
        if (normalize(firstText) === normalize(sheetName)) continue;
        currentGroup = addOrGetTopic(firstText, currentRoot.id);
        continue;
      }

      throw new Error(
        `Unsupported row in sheet "${sheetName}" (row ${rowIndex + 1}). ` +
          'Use Topic/Subtopic columns, Sub Topic/Concept columns, or the numbered grouped-outline format.'
      );
    }
    logger.info(`Parsed sheet "${sheetName}"`, {
      topics: allTopics.length,
      format: 'grouped outline',
    });
  }

  if (allTopics.length === 0) {
    throw new Error(
      'No topics found. Check that the workbook has headers and at least one non-empty topic row.'
    );
  }

  logger.success('File parsed successfully', { total: allTopics.length });
  return allTopics;
};

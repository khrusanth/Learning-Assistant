import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import XLSX from 'xlsx';

const files = process.argv.slice(2);
if (files.length === 0) {
  throw new Error(
    'Provide the roadmap outline and optional workbooks: node generate-data.js <outline.txt> [roadmap.xlsx ...]'
  );
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const roots = [];
const nodesById = new Map();
let idCounter = 1;
const now = new Date().toISOString();

const workbookTargets = {
  'Java Core': {
    root: '2. JAVA PROGRAMMING',
    groups: {
      'OOP Concepts': 'Object-Oriented Programming',
      'JVM & Multithreading': 'Multithreading & Concurrency',
      'Multithreading & JVM': 'Multithreading & Concurrency',
    },
  },
  'Spring Boot': {
    root: '5. SPRING FRAMEWORK & SPRING BOOT',
    groups: {
      'Security & Monitoring': 'Spring Security',
      'Monitoring & Logging': 'Monitoring & Logging',
    },
  },
  Angular: { root: '4. FRONTEND DEVELOPMENT', groups: { 'Angular Basics': 'Angular' } },
  React: { root: '4. FRONTEND DEVELOPMENT', groups: { 'React Basics': 'React', 'Advanced Concepts': 'React' } },
  Database: { root: '6. DATABASES', groups: { 'SQL Concepts': 'SQL', Optimization: 'Database Optimization', 'Database Migration': 'Database Migration' } },
  'DevOps & Build': { root: '7. BUILD TOOLS', groups: { Maven: 'Maven', 'Build Tools': 'Frontend Build Tools' } },
  'DevOps & Deployment': { root: '7. BUILD TOOLS', groups: { 'Build Tools': 'Frontend Build Tools' } },
  'Messaging & Cloud': { root: '16. MESSAGING', groups: { Kafka: 'Apache Kafka' } },
  Testing: { root: '18. TESTING', groups: { 'Backend Testing': 'Unit Testing', 'Frontend Testing': 'Frontend Testing' } },
  'Professional Skills': { root: '22. PROFESSIONAL DEVELOPMENT', groups: {} },
  'Testing & Professional Skills': { root: '18. TESTING', groups: { Testing: 'Unit Testing', 'Professional Engineering': 'Code Reviews' } },
};

const cleanLabel = (label) =>
  label
    .replace(/^\d+(?:\.\d+)*\.?\s+/, '')
    .replace(/\s*[⭐]+\s*$/, '')
    .trim();

function makeId() {
  return `topic_${String(idCounter++).padStart(4, '0')}`;
}

function makeNode(title, parent = null) {
  const node = {
    id: makeId(),
    title,
    description: '',
    status: 'Not Started',
    progress: 0,
    confidence: 0,
    parent,
    children: [],
    tags: [],
    notes: '',
    resources: [],
    revisions: [],
    createdAt: now,
    updatedAt: now,
    completedAt: null,
  };
  nodesById.set(node.id, node);
  return node;
}

function parseOutline(filePath) {
  const stack = [];
  const foundRoots = [];
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^([ │]*)(?:├|└)── (.+)$/);
    if (!match) continue;
    const level = match[1].length / 4;
    const title = cleanLabel(match[2]);
    const node = makeNode(title);

    if (level === 0) {
      foundRoots.push(node);
    } else {
      const parent = stack[level - 1];
      if (!parent) {
        throw new Error(`Invalid outline hierarchy before "${title}" in ${filePath}`);
      }
      node.parent = parent.id;
      parent.children.push(node.id);
    }
    stack[level] = node;
    stack.length = level + 1;
    roots.push(...(level === 0 ? [node] : []));
  }
  if (foundRoots.length === 0) {
    throw new Error(`No roadmap outline entries found in ${filePath}`);
  }
  return foundRoots;
}

function findNodeInTree(nodes, predicate) {
  for (const node of nodes) {
    if (!node) continue;
    if (predicate(node)) return node;
    const found = findNodeInTree(
      node.children.map((childId) => nodesById.get(childId)),
      predicate
    );
    if (found) return found;
  }
  return null;
}

function addWorkbookConcept(sheetName, groupName, conceptName) {
  const target = workbookTargets[sheetName];
  const rootTitle = cleanLabel(target?.root || sheetName);
  const root =
    roots.find((node) => node.title.toLocaleLowerCase() === rootTitle.toLocaleLowerCase()) ||
    roots.find((node) => node.title.toLocaleLowerCase().includes(rootTitle.toLocaleLowerCase()));
  if (!root) {
    throw new Error(`No outline section found for workbook sheet "${sheetName}"`);
  }

  const conceptTitle = conceptName.trim();
  if (
    !conceptTitle ||
    findNodeInTree(roots, (node) => node.title.toLocaleLowerCase() === conceptTitle.toLocaleLowerCase())
  ) {
    return;
  }

  const targetGroupTitle = target?.groups[groupName] || groupName;
  let group = findNodeInTree([root], (node) => {
    const rootGroup = node.parent === root.id;
    return rootGroup && node.title.toLocaleLowerCase() === targetGroupTitle.toLocaleLowerCase();
  });
  if (!group) {
    group = makeNode(targetGroupTitle, root.id);
    root.children.push(group.id);
  }
  const concept = makeNode(conceptTitle, group.id);
  group.children.push(concept.id);
}

function parseWorkbook(filePath) {
  const workbook = XLSX.readFile(filePath);
  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      defval: '',
    });
    const header = rows[0] || [];
    if (
      String(header[0]).trim().toLowerCase() === 'sub topic' &&
      String(header[1]).trim().toLowerCase() === 'concept'
    ) {
      for (const row of rows.slice(1)) {
        if (row[0] && row[1]) {
          addWorkbookConcept(sheetName, String(row[0]).trim(), String(row[1]));
        }
      }
      continue;
    }

    let currentGroup = '';
    for (const row of rows) {
      const label = String(row[0] ?? '').trim();
      const concept = String(row[1] ?? '').trim();
      if (!label && !concept) continue;
      if (typeof row[0] === 'number' && concept && currentGroup) {
        addWorkbookConcept(sheetName, currentGroup, concept);
      } else if (label && !concept && label !== sheetName) {
        currentGroup = label;
      } else if (label && concept) {
        throw new Error(
          `Unrecognized row in "${sheetName}" in ${filePath}: ${JSON.stringify(row)}`
        );
      }
    }
  }
}

const outlinePath = path.resolve(files[0]);
if (!fs.existsSync(outlinePath) || path.extname(outlinePath).toLocaleLowerCase() !== '.txt') {
  throw new Error(`The first input must be a readable .txt roadmap outline: ${outlinePath}`);
}
parseOutline(outlinePath);

for (const file of files.slice(1)) {
  const filePath = path.resolve(file);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Roadmap workbook not found: ${filePath}`);
  }
  parseWorkbook(filePath);
}

const allTopics = [];
function flatten(node) {
  allTopics.push(node);
  for (const childId of node.children) {
    const child = nodesById.get(childId);
    if (child) flatten(child);
  }
}
for (const root of roots) flatten(root);

const outPath = path.join(__dirname, 'src', 'data', 'sampleData.json');
fs.writeFileSync(outPath, `${JSON.stringify(allTopics, null, 2)}\n`);
console.log(
  `Generated ${allTopics.length} topics across ${roots.length} sections from ${files.length} source files -> ${outPath}`
);

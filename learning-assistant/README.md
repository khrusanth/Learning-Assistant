# LearnAssist

LearnAssist is a local-first Java full-stack learning tracker. Browse a
hierarchical roadmap, search topics, mark concepts complete, and track your
progress on the dashboard. Your topics and preferences are saved in the
browser's local storage.

The generated roadmap is intentionally excluded from Git but stays in your
local `src/data/sampleData.json` file. The local Vite development server reads
that file when a browser profile has no saved topics, so a fresh local browser
profile gets your roadmap automatically. If the local file is not present, the
app starts empty and you can import a spreadsheet. Production builds do not
bundle this private local roadmap.

## Run the application

1. Install [Node.js](https://nodejs.org/) (Node 20.19+ or 22.12+).
2. Open a terminal in the `learning-assistant` folder.
3. Install dependencies and start Vite:

   ```sh
   npm install
   npm run dev
   ```

4. Open the local URL printed by Vite, usually <http://localhost:5173/>.

To create a production build, run `npm run build` from the same folder.

## Import topics and subtopics

1. Open **Learning Tree**.
2. Select **Import topics** and choose a `.xlsx`, `.xls`, or `.csv` file.
3. The app reads each worksheet (or the CSV sheet), builds the parent/child
   topic tree, and adds the imported topics to the current roadmap.
4. Search for a section or concept to check the imported hierarchy. Use the
   disclosure arrows to expand nested topics.

Import adds topics; it does not replace existing data. Importing the same
workbook again may create another copy of its topics, so import each file once.
Use **Settings → Export as JSON** to back up your local data before clearing
browser storage or moving to another browser.

### Supported spreadsheet formats

Use one of the following layouts. Header names are case-insensitive; spaces
and punctuation are ignored.

#### 1. Topic and subtopic columns

Use this format for a flat parent/child list. Repeat the topic name for every
subtopic row:

| Topic | Subtopic | Description (optional) |
| --- | --- | --- |
| Java Programming | Classes and Objects | Model data and behavior |
| Java Programming | Constructors | Initialize new objects |
| Spring Boot | Dependency Injection | Provide dependencies to components |

Accepted topic headers include `Topic`, `Main`, `Category`, `Topic Name`, and
`Main Topic`. Accepted subtopic headers include `Subtopic`, `Sub`, `Sub Topic`,
`Subtopic Name`, `Group`, and `Section`.

#### 2. Sub Topic and Concept columns

Use one worksheet per top-level section. Each distinct subtopic becomes a
child of the worksheet's name, and each concept becomes a child of its
subtopic:

| Sub Topic | Concept |
| --- | --- |
| OOP Concepts | Encapsulation |
| OOP Concepts | Inheritance |
| Collections | ArrayList |

An optional `Description`, `Explanation`, or `Notes` column is attached to
each concept.

#### 3. Numbered grouped outline

The organized roadmap workbook layout is also supported. Put the section
title in the first row, group headings in column A, and numbered concepts in
the next rows:

| Column A | Column B |
| --- | --- |
| Java Core | |
| | |
| OOP Concepts | |
| 1 | Encapsulation |
| 2 | Inheritance |
| Collections | |
| 1 | ArrayList |

Each worksheet becomes a root topic. Text-only rows in column A start a group;
numbered rows use column B as concepts within the current group. Blank rows
are ignored.

### Import behavior and troubleshooting

- Repeated topic and subtopic names within the same parent are grouped instead
  of repeated; the same name under different parents remains a separate topic.
- A row with a subtopic or concept but no required parent is rejected with an
  error message rather than silently skipped.
- Ensure the first row contains supported column headers for tabular formats.
- For grouped outlines, keep concepts directly below their group heading and
  put the concept title in column B.
- If a file has no recognizable headers or topic rows, the app reports that
  it could not find topics.

## Local data

Topics are stored per browser in local storage and are not synced to GitHub.
The local roadmap JSON is ignored by Git, so committing or pulling code does
not remove it or upload it. To recreate it from your own outline and workbooks,
run this from the `learning-assistant` folder:

```sh
node generate-data.js <outline.txt> [expanded-roadmap.xlsx] [organized-roadmap.xlsx]
```

**Settings** provides JSON backup import/export, CSV export, theme settings,
and a reset action. Resetting browser data does not change the local roadmap
file; restarting the development app will load it again if it is present.

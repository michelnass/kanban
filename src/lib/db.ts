import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

const useKV = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

// Local fallback DB
const dataDir = process.env.DATA_DIR || process.cwd();
const localDbPath = path.join(dataDir, 'data.json');

const DEFAULT_COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done', title: 'Done' }
];

function initLocalDb() {
  if (!fs.existsSync(localDbPath)) {
    fs.writeFileSync(localDbPath, JSON.stringify({ boards: {} }), 'utf-8');
  }
}

async function getLocalDb() {
  initLocalDb();
  const data = fs.readFileSync(localDbPath, 'utf-8');
  return JSON.parse(data);
}

async function saveLocalDb(data: any) {
  try {
    fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save local db', err);
  }
}

export async function getBoard(id: string) {
  let boardData: any;

  if (useKV) {
    const data = await kv.get(`board:${id}`);
    if (data) {
      boardData = data;
    }
  } else {
    const db = await getLocalDb();
    boardData = db.boards[id];
  }

  if (!boardData) {
    boardData = {
      columns: DEFAULT_COLUMNS,
      items: [
        { id: '1', columnId: 'todo', content: 'Create project plan' },
        { id: '2', columnId: 'todo', content: 'Design mockup' },
        { id: '3', columnId: 'in-progress', content: 'Setup Next.js environment' },
      ],
      history: []
    };
    await saveBoard(id, boardData.columns, boardData.items, boardData.history);
  }

  // Migration for older boards structure missing columns
  if (!boardData.columns) {
    boardData.columns = DEFAULT_COLUMNS;
    await saveBoard(id, boardData.columns, boardData.items, boardData.history);
  }

  return boardData;
}

export async function saveBoard(id: string, columns: any[], items: any[], history: any[]) {
  const boardData = { columns, items, history };

  if (useKV) {
    await kv.set(`board:${id}`, boardData);
  } else {
    const db = await getLocalDb();
    db.boards[id] = boardData;
    await saveLocalDb(db);
  }
}

import { put, list } from '@vercel/blob';
import fs from 'fs';
import path from 'path';

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

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

  if (useBlob) {
    try {
      // Find the specific blob URL from the store
      const { blobs } = await list({ prefix: `board_${id}.json` });
      if (blobs.length > 0) {
        // Cache bypass is critical when updating Vercel Blobs frequently
        const response = await fetch(`${blobs[0].url}?t=${Date.now()}`, { cache: 'no-store' });
        if (response.ok) {
          boardData = await response.json();
        }
      }
    } catch (e) {
      console.error('Failed to load from Vercel Blob', e);
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

  if (useBlob) {
    try {
        await put(`board_${id}.json`, JSON.stringify(boardData), {
        access: 'public',
        addRandomSuffix: false, // Ensures we continuously overwrite the same file
      });
    } catch (e) {
      console.error('Failed to save to Vercel Blob', e);
    }
  } else {
    const db = await getLocalDb();
    db.boards[id] = boardData;
    await saveLocalDb(db);
  }
}

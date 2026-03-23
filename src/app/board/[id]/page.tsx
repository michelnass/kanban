import BoardClient from './BoardClient';
import { use } from 'react';

// Server Component for the Board Route
export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  // We use React.use() to unwrap the promise of params as required by Next.js 15+
  const resolvedParams = use(params);
  
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <BoardClient boardId={resolvedParams.id} />
    </div>
  );
}

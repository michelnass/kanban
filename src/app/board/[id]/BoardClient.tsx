'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { 
  DndContext, 
  DragOverlay, 
  rectIntersection, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import BoardColumn from './BoardColumn';
import KanbanCard from './KanbanCard';
import styles from './board.module.css';
import { Share, Undo2, X, Send, Plus } from 'lucide-react';

export type Item = {
  id: string;
  columnId: string;
  content: string;
};

export type Column = {
  id: string;
  title: string;
};

type HistoryState = {
  items: Item[];
  columns: Column[];
};

export default function BoardClient({ boardId }: { boardId: string }) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [activeColumn, setActiveColumn] = useState<Column | null>(null);
  const [loading, setLoading] = useState(true);

  // Invite Modal State
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState<'idle'|'loading'|'success'|'error'>('idle');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetch(`/api/board/${boardId}`)
      .then(res => res.json())
      .then(data => {
        if (data.board) {
          setColumns(data.board.columns || []);
          setItems(data.board.items || []);
          setHistory(data.board.history || []);
        }
        setLoading(false);
      });
  }, [boardId]);

  const syncToServer = async (newColumns: Column[], newItems: Item[], newHistory: HistoryState[]) => {
    await fetch(`/api/board/${boardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ columns: newColumns, items: newItems, history: newHistory })
    });
  };

  const saveHistory = useCallback((newColumns: Column[], newItems: Item[]) => {
    const currentState: HistoryState = { items, columns };
    const newHistory = [...history.slice(-10), currentState];
    setHistory(newHistory);
    setColumns(newColumns);
    setItems(newItems);
    syncToServer(newColumns, newItems, newHistory);
  }, [items, columns, history, boardId]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    setColumns(previousState.columns);
    setItems(previousState.items);
    syncToServer(previousState.columns, previousState.items, newHistory);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'Column') {
      setActiveColumn(columns.find(c => c.id === active.id) || null);
    } else if (active.data.current?.type === 'Task') {
      setActiveItem(items.find(i => i.id === active.id) || null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (!isActiveTask) return;

    setItems((prev) => {
      const activeIndex = prev.findIndex((t) => t.id === activeId);
      const overIndex = prev.findIndex((t) => t.id === overId);

      if (isActiveTask && isOverTask) {
        if (prev[activeIndex].columnId !== prev[overIndex].columnId) {
          const newItems = [...prev];
          newItems[activeIndex].columnId = newItems[overIndex].columnId;
          return arrayMove(newItems, activeIndex, overIndex);
        }
        return arrayMove(prev, activeIndex, overIndex);
      }

      if (isActiveTask && isOverColumn) {
        const newItems = [...prev];
        newItems[activeIndex].columnId = overId as string;
        return arrayMove(newItems, activeIndex, activeIndex);
      }

      return prev;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    setActiveColumn(null);
    const { active, over } = event;
    if (!over) return;

    const isActiveColumn = active.data.current?.type === 'Column';
    if (isActiveColumn) {
      if (active.id !== over.id) {
        const activeIndex = columns.findIndex(c => c.id === active.id);
        const overIndex = columns.findIndex(c => c.id === over.id);
        const newColumns = arrayMove(columns, activeIndex, overIndex);
        saveHistory(newColumns, items);
        return;
      }
    }

    // Task drag end
    saveHistory(columns, items);
  };

  const addItem = (columnId: string, content: string) => {
    if (!content.trim()) return;
    const newItem = { id: crypto.randomUUID(), columnId, content };
    saveHistory(columns, [...items, newItem]);
  };

  const deleteItem = (id: string) => {
    saveHistory(columns, items.filter(i => i.id !== id));
  };

  const addColumn = () => {
    const newColumn = { id: crypto.randomUUID(), title: 'New Lane' };
    saveHistory([...columns, newColumn], items);
  };

  const editColumn = (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    const newCols = columns.map(c => c.id === id ? { ...c, title: newTitle } : c);
    saveHistory(newCols, items);
  };

  const deleteColumn = (id: string) => {
    if (confirm("Are you sure you want to delete this lane and all its items?")) {
      const newCols = columns.filter(c => c.id !== id);
      const newItems = items.filter(i => i.columnId !== id);
      saveHistory(newCols, newItems);
    }
  };

  const sendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    
    setInviteStatus('loading');
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, boardId })
      });
      if (res.ok) {
        setInviteStatus('success');
        setTimeout(() => {
          setShowInvite(false);
          setInviteStatus('idle');
          setInviteEmail('');
        }, 2000);
      } else {
        setInviteStatus('error');
      }
    } catch {
      setInviteStatus('error');
    }
  };

  if (loading) {
    return <div className={styles.loadingScreen}>Loading Board...</div>;
  }

  return (
    <div className={styles.boardContainer}>
      <header className={`${styles.header} glass-panel`}>
        <div className={styles.headerLeft}>
          <h1 className={styles.boardTitle}>Board <span className={styles.boardId}>#{boardId.slice(0, 8)}</span></h1>
        </div>
        <div className={styles.headerActions}>
          <button onClick={handleUndo} disabled={history.length === 0} className={styles.actionBtn}>
            <Undo2 size={18} />
            <span>Undo</span>
          </button>
          <button onClick={() => setShowInvite(true)} className={styles.primaryBtn}>
            <Share size={18} />
            <span>Invite</span>
          </button>
        </div>
      </header>

      <main className={styles.columnsContainer}>
        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
            {columns.map(col => (
              <BoardColumn 
                key={col.id} 
                column={col} 
                items={items.filter(i => i.columnId === col.id)}
                onAddItem={(content: string) => addItem(col.id, content)}
                onDeleteItem={deleteItem}
                onEditColumn={editColumn}
                onDeleteColumn={deleteColumn}
              />
            ))}
          </SortableContext>

          <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
            {activeColumn ? (
              <BoardColumn 
                column={activeColumn} 
                items={items.filter(i => i.columnId === activeColumn.id)}
                isOverlay
                onAddItem={() => {}}
                onDeleteItem={() => {}}
                onEditColumn={() => {}}
                onDeleteColumn={() => {}}
              />
            ) : activeItem ? (
              <KanbanCard item={activeItem} isOverlay onDelete={() => {}} />
            ) : null}
          </DragOverlay>
        </DndContext>

        <button 
          onClick={addColumn}
          className={`${styles.actionBtn} ${styles.column}`} 
          style={{ 
            background: 'rgba(255,255,255,0.05)', 
            borderStyle: 'dashed', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '100px',
            color: 'var(--text-secondary)'
          }}
        >
          <Plus size={24} />
          <span>Add Lane</span>
        </button>
      </main>

      {/* Invite Modal Overlay */}
      {showInvite && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} animate-fade-in`}>
            <div className={styles.modalHeader}>
              <h2>Invite Collaborator</h2>
              <button onClick={() => setShowInvite(false)} className={styles.closeBtn}><X size={20} /></button>
            </div>
            
            <form onSubmit={sendInvite} className={styles.modalForm}>
              <p className={styles.modalSub}>They will receive an email with the unique link to join this real-time board.</p>
              
              <div className={styles.inputGroup}>
                <input 
                  type="email" 
                  value={inviteEmail} 
                  onChange={e => setInviteEmail(e.target.value)} 
                  placeholder="colleague@example.com"
                  className={styles.modalInput}
                  required
                />
              </div>

              <button 
                type="submit" 
                className={styles.primaryBtn} 
                disabled={inviteStatus === 'loading' || inviteStatus === 'success'}
                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
              >
                {inviteStatus === 'loading' ? 'Sending...' : inviteStatus === 'success' ? 'Invite Sent!' : (
                  <><Send size={16} /> Send Invite Link</>
                )}
              </button>
              
              {inviteStatus === 'error' && <p className={styles.errorMsg}>Failed to send invite. Try again.</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

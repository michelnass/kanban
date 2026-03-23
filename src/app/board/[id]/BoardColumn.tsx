'use client';

import React, { useState } from 'react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import KanbanCard from './KanbanCard';
import styles from './board.module.css';
import { Item } from './BoardClient';
import { Plus, Trash2, Edit2, GripHorizontal } from 'lucide-react';

interface BoardColumnProps {
  column: { id: string; title: string };
  items: Item[];
  isOverlay?: boolean;
  onAddItem: (content: string) => void;
  onDeleteItem: (id: string) => void;
  onEditColumn: (id: string, newTitle: string) => void;
  onDeleteColumn: (id: string) => void;
}

export default function BoardColumn({ 
  column, 
  items, 
  isOverlay,
  onAddItem, 
  onDeleteItem, 
  onEditColumn, 
  onDeleteColumn 
}: BoardColumnProps) {
  const [newContent, setNewContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'Column', column }
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newContent.trim()) {
      onAddItem(newContent);
      setNewContent('');
    }
  };

  const submitEdit = () => {
    if (editTitle.trim() && editTitle.trim() !== column.title) {
      onEditColumn(column.id, editTitle.trim());
    } else {
      setEditTitle(column.title);
    }
    setIsEditing(false);
  };

  if (isDragging) {
    return <div ref={setNodeRef} style={{...style, opacity: 0.4}} className={styles.column} />;
  }

  return (
    <div ref={setNodeRef} style={style} className={styles.column}>
      <div className={styles.columnHeader}>
        {isEditing ? (
          <div style={{ display: 'flex', gap: '8px', flex: 1, alignItems: 'center' }}>
            <input 
              autoFocus
              className={styles.addInput}
              style={{ flex: 1, padding: '4px 8px', margin: 0 }}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter') submitEdit() }}
              onBlur={submitEdit}
            />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1 }}>
            <div 
              {...attributes} 
              {...listeners} 
              style={{ cursor: 'grab', color: 'var(--text-secondary)' }}
            >
              <GripHorizontal size={18} />
            </div>
            <span className={styles.columnTitle} onClick={() => setIsEditing(true)} style={{ cursor: 'pointer' }}>
              {column.title}
            </span>
            <button className={styles.iconBtn} onClick={() => setIsEditing(true)} aria-label="Edit title">
              <Edit2 size={14} />
            </button>
          </div>
        )}
        
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className={styles.itemCount}>{items.length}</span>
          <button 
            className={styles.iconBtn} 
            onClick={() => onDeleteColumn(column.id)}
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Delete column"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className={styles.columnList}>
        <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
          {items.map(item => (
            <KanbanCard 
              key={item.id} 
              item={item} 
              onDelete={() => onDeleteItem(item.id)} 
            />
          ))}
        </SortableContext>
      </div>

      <form onSubmit={handleAdd} className={styles.addForm}>
        <input 
          type="text" 
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder={`Add to ${column.title}...`}
          className={styles.addInput}
        />
        <button type="submit" className={styles.actionBtn} style={{ justifyContent: 'center', marginTop: '4px' }}>
          <Plus size={16} /> <span>Add</span>
        </button>
      </form>
    </div>
  );
}

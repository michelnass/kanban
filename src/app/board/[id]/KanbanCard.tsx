'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Item } from './BoardClient';
import styles from './board.module.css';
import { Trash2 } from 'lucide-react';

interface KanbanCardProps {
  item: Item;
  isOverlay?: boolean;
  onDelete: () => void;
}

export default function KanbanCard({ item, isOverlay, onDelete }: KanbanCardProps) {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    data: { type: 'Task', item },
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  // If this item is being dragged, render a placeholder in the list
  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`${styles.card} ${styles.dragging}`}
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={styles.card}
    >
      <p className={styles.cardContent}>{item.content}</p>
      {!isOverlay && (
        <button
          className={styles.deleteBtn}
          onPointerDown={(e) => {
            // Prevent dragging when clicking the delete button
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete standard"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import styles from './page.module.css'; // We'll rewrite this next

export default function Home() {
  const router = useRouter();

  const handleCreateBoard = () => {
    const uniqueId = crypto.randomUUID();
    router.push(`/board/${uniqueId}`);
  };

  return (
    <main className={styles.main}>
      <div className={`${styles.hero} glass-panel animate-fade-in`}>
        <h1 className={styles.title}>Welcome to <span className={styles.highlight}>Kanban Premium</span></h1>
        <p className={styles.subtitle}>
          Organize your tasks with our highly dynamic, real-time board. 
          Snap cards into lanes, track your history, and collaborate effortlessly.
        </p>
        <button 
          className={`${styles.ctaButton} animate-pulse-glow`}
          onClick={handleCreateBoard}
        >
          Create New Board
        </button>
      </div>
    </main>
  );
}

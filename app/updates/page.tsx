'use client';

import { useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

interface Update {
  id: string;
  type: 'feature' | 'market' | 'policy' | 'maintenance';
  title: string;
  description: string;
  date: string;
  isNew: boolean;
}

const normalizeType = (value: string) => {
  switch (value.toLowerCase()) {
    case 'market':
      return 'market';
    case 'policy':
      return 'policy';
    case 'maintenance':
      return 'maintenance';
    default:
      return 'feature';
  }
};

const formatRelativeTime = (value: string) => {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  }
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
};

export default function UpdatesPage() {
  const [filter, setFilter] = useState<'all' | Update['type']>('all');
  const [updates, setUpdates] = useState<Update[]>([]);

  useEffect(() => {
    let isMounted = true;

    fetch('/api/updates')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch updates');
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted) {
          return;
        }
        const nextUpdates = (data.updates || []).map((update: { id: string; type: string; title: string; description: string; isNew: boolean; createdAt: string }) => ({
          id: update.id,
          type: normalizeType(update.type),
          title: update.title,
          description: update.description,
          date: formatRelativeTime(update.createdAt),
          isNew: update.isNew,
        }));
        setUpdates(nextUpdates);
      })
      .catch(() => {
        if (isMounted) {
          setUpdates([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUpdates = useMemo(() => {
    return filter === 'all'
      ? updates
      : updates.filter(update => update.type === filter);
  }, [filter, updates]);

  const getTypeIcon = (type: Update['type']) => {
    switch (type) {
      case 'feature': return (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.svgIcon}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      );
      case 'market': return (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.svgIcon}>
          <line x1="18" y1="20" x2="18" y2="10"></line>
          <line x1="12" y1="20" x2="12" y2="4"></line>
          <line x1="6" y1="20" x2="6" y2="14"></line>
        </svg>
      );
      case 'policy': return (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.svgIcon}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
      );
      case 'maintenance': return (
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.svgIcon}>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
        </svg>
      );
    }
  };

  const getTypeLabel = (type: Update['type']) => {
    switch (type) {
      case 'feature': return 'New Feature';
      case 'market': return 'Market Update';
      case 'policy': return 'Policy Change';
      case 'maintenance': return 'Maintenance';
    }
  };

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Stay Informed</p>
            <h1 className={styles.pageTitle}>Core Updates</h1>
            <p className={styles.subtitle}>Latest news, features, and important announcements for your investment journey.</p>
          </div>
        </header>

        <div className={styles.filterBar}>
          <button 
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            All Updates
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'feature' ? styles.active : ''}`}
            onClick={() => setFilter('feature')}
          >
            Features
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'market' ? styles.active : ''}`}
            onClick={() => setFilter('market')}
          >
            Market
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'policy' ? styles.active : ''}`}
            onClick={() => setFilter('policy')}
          >
            Policy
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'maintenance' ? styles.active : ''}`}
            onClick={() => setFilter('maintenance')}
          >
            Maintenance
          </button>
        </div>

        <div className={styles.updatesList}>
          {filteredUpdates.map(update => (
            <article key={update.id} className={styles.updateCard}>
              <div className={styles.updateIcon}>
                {getTypeIcon(update.type)}
              </div>
              <div className={styles.updateContent}>
                <div className={styles.updateHeader}>
                  <div className={styles.updateMeta}>
                    <span className={`${styles.typeBadge} ${styles[update.type]}`}>
                      {getTypeLabel(update.type)}
                    </span>
                    {update.isNew && (
                      <span className={styles.newBadge}>New</span>
                    )}
                  </div>
                  <span className={styles.updateDate}>{update.date}</span>
                </div>
                <h3 className={styles.updateTitle}>{update.title}</h3>
                <p className={styles.updateDescription}>{update.description}</p>
                <button className={styles.readMoreBtn}>
                  Read More <span className={styles.arrow}>→</span>
                </button>
              </div>
            </article>
          ))}
        </div>

        {filteredUpdates.length === 0 && (
          <div className={styles.emptyState}>
            <p>No updates found for this category.</p>
          </div>
        )}

        <section className={styles.subscribeSection}>
          <div className={styles.subscribeContent}>
            <h3 className={styles.subscribeTitle}>Stay Updated</h3>
            <p className={styles.subscribeText}>
              Get notified about important updates, market insights, and new features directly to your inbox.
            </p>
          </div>
          <div className={styles.subscribeActions}>
            <input 
              type="email" 
              placeholder="Enter your email" 
              className={styles.emailInput}
              aria-label="Email address"
            />
            <button className={styles.subscribeBtn}>Subscribe</button>
          </div>
        </section>
      </main>
    </div>
  );
}

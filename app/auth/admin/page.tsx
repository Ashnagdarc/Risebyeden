'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import styles from '../page.module.css';

export default function AdminAuthPage() {
  const [identifier, setIdentifier] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [authError, setAuthError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError('');

    const result = await signIn('credentials', {
      identifier,
      accessKey,
      adminOnly: 'true',
      redirect: true,
      callbackUrl: '/admin',
    });

    if (result?.error) {
      setAuthError('Admin access required.');
    }
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.grain} aria-hidden="true" />

        <section className={styles.heroSection}>
          <div className={styles.heroAccent} />
          <div className={styles.heroContent}>
            <p className={styles.heroKicker}>ADMIN ACCESS</p>
            <h1 className={styles.heroTitle}>Control Gateway</h1>
            <p className={styles.heroSubtitle}>
              Restricted workspace for portfolio administrators and operations teams.
            </p>
            <div className={styles.heroMeta}>
              <span>Access: Admin only</span>
              <span>Audit: Enabled</span>
              <span>Node: Basalt-Admin</span>
            </div>
          </div>
        </section>

        <section className={styles.authSlab}>
          <header className={styles.slabHeader}>
            <div className={styles.tabs}>
              <button type="button" className={`${styles.tabTrigger} ${styles.active}`}>
                Admin Login
              </button>
            </div>
            <div className={styles.slabHint}>ADMIN_CLEARANCE_REQUIRED</div>
          </header>

          <div className={styles.slabContent}>
            <form onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label htmlFor="identifier">Identifier</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="identifier"
                    type="text"
                    placeholder="ADMIN_ID //"
                    spellCheck={false}
                    required
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                  />
                  <span className={styles.dataStatus}>REQ</span>
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="accessKey">Access Key</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="accessKey"
                    type="password"
                    placeholder="••••••••••••"
                    spellCheck={false}
                    required
                    value={accessKey}
                    onChange={(event) => setAccessKey(event.target.value)}
                  />
                  <span className={styles.dataStatus}>SEC</span>
                </div>
              </div>

              {authError && (
                <p className={styles.formError}>{authError}</p>
              )}

              <button className={styles.primaryButton} type="submit">
                Enter Admin
              </button>

              <div className={styles.formFooter}>
                <Link href="/auth" className={styles.footerLink}>
                  Back to Client Login
                </Link>
              </div>
            </form>
          </div>

          <footer className={styles.slabFooter}>
            <span>SYS.STATUS: LOCKED</span>
            <span>v.4.0.1_BASALT</span>
          </footer>
        </section>
      </main>
    </div>
  );
}

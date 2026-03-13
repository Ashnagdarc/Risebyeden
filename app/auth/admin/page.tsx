'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import styles from '../page.module.css';

type SystemHealthResponse = {
  services?: {
    database?: string;
  };
};

export default function AdminAuthPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [authError, setAuthError] = useState('');
  const [serviceWarning, setServiceWarning] = useState('');
  const [databaseAvailable, setDatabaseAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchHealth = async () => {
      try {
        const response = await fetch('/api/system/health', { cache: 'no-store' });
        const payload = await response.json() as SystemHealthResponse;
        const databaseHealthy = payload.services?.database === 'ok';

        if (!cancelled) {
          setDatabaseAvailable(databaseHealthy);
          setServiceWarning(databaseHealthy ? '' : 'Database is offline. Start your DB service to enable admin login.');
        }
      } catch {
        if (!cancelled) {
          setDatabaseAvailable(null);
          setServiceWarning('Unable to verify system health. Admin login may fail if database is offline.');
        }
      }
    };

    fetchHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError('');

    if (databaseAvailable === false) {
      setAuthError('Admin login unavailable: database is offline. Start Postgres and retry.');
      return;
    }

    const result = await signIn('credentials', {
      identifier,
      accessKey,
      adminOnly: 'true',
      redirect: false,
      callbackUrl: '/admin',
    });

    if (result?.ok) {
      router.replace('/admin');
      return;
    }

    if (result?.error || result?.status === 401) {
      setAuthError('Admin access required or temporarily rate-limited. Wait and retry.');
      return;
    }

    setAuthError('Unable to establish admin session. Try again.');
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
            {serviceWarning && <p className={styles.serviceWarning}>{serviceWarning}</p>}
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

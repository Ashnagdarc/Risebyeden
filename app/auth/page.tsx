'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import styles from './page.module.css';

type AuthMode = 'login' | 'signup';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [identifier, setIdentifier] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [authError, setAuthError] = useState('');
  const { data: session } = useSession();

  const getDisplayName = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
      return 'Investor';
    }

    const atIndex = trimmed.indexOf('@');
    const base = atIndex > 0 ? trimmed.slice(0, atIndex) : trimmed.split(/\s+/)[0];
    const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '');

    return cleaned || 'Investor';
  };

  const displayName = getDisplayName(identifier);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError('');

    const result = await signIn('credentials', {
      identifier,
      accessKey,
      adminOnly: 'false',
      redirect: false,
    });

    if (result?.ok) {
      setShowWelcome(true);
    } else {
      setAuthError('Invalid access details. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.grain} aria-hidden="true" />

        {showWelcome && (
          <div className={styles.welcomeScreen}>
            <div className={styles.welcomeContent}>
              <p className={styles.welcomeKicker}>ACCESS GRANTED</p>
              <h2 className={styles.welcomeTitle}>
                <span className={styles.welcomeLabel}>Welcome</span>
                <span className={styles.welcomeName}>{displayName}</span>
              </h2>
              <p className={styles.welcomeSubtitle}>
                Your secure session is established. You now have full access to Rise by eden.
              </p>
              <div className={styles.welcomeActions}>
                <Link href="/" className={styles.welcomeAction}>
                  Enter Dashboard
                </Link>
                {(session?.user as { role?: string } | undefined)?.role === 'admin' && (
                  <Link href="/admin" className={styles.welcomeAction}>
                    Enter Admin
                  </Link>
                )}
                <button
                  type="button"
                  className={styles.welcomeDismiss}
                  onClick={() => setShowWelcome(false)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        <section className={styles.heroSection}>
          <div className={styles.heroAccent} />
          <div className={styles.heroContent}>
            <p className={styles.heroKicker}>VAULT ACCESS</p>
            <h1 className={styles.heroTitle}>Rise by eden</h1>
            <p className={styles.heroSubtitle}>
              Secure portal for premium property investors. All sessions are encrypted and monitored.
            </p>
            <div className={styles.heroMeta}>
              <span>Latency: 14ms</span>
              <span>Encryption: AES-256</span>
              <span>Node: Basalt-04</span>
            </div>
          </div>
        </section>

        <section className={styles.authSlab}>
          <header className={styles.slabHeader}>
            <div className={styles.tabs}>
              <button
                type="button"
                className={`${styles.tabTrigger} ${mode === 'login' ? styles.active : ''}`}
                onClick={() => setMode('login')}
              >
                Login
              </button>
              <button
                type="button"
                className={`${styles.tabTrigger} ${mode === 'signup' ? styles.active : ''}`}
                onClick={() => setMode('signup')}
              >
                Enlist
              </button>
            </div>
            <div className={styles.slabHint}>SECURE_HANDSHAKE_REQUIRED</div>
          </header>

          <div className={styles.slabContent}>
            <form onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label htmlFor="identifier">Identifier</label>
                <div className={styles.inputWrapper}>
                  <input
                    id="identifier"
                    type="text"
                    placeholder="USER_ID //"
                    spellCheck={false}
                    required
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                  />
                  <span className={styles.dataStatus}>REQ</span>
                </div>
              </div>

              {mode === 'signup' && (
                <div className={styles.inputGroup}>
                  <label htmlFor="organization">Organization</label>
                  <div className={styles.inputWrapper}>
                    <input
                      id="organization"
                      type="text"
                      placeholder="FIRM_NAME //"
                      spellCheck={false}
                      required
                    />
                    <span className={styles.dataStatus}>ORG</span>
                  </div>
                </div>
              )}

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

              {mode === 'signup' && (
                <div className={styles.inputGroup}>
                  <label htmlFor="inviteCode">Invite Code</label>
                  <div className={styles.inputWrapper}>
                    <input
                      id="inviteCode"
                      type="text"
                      placeholder="ACCESS_TOKEN //"
                      spellCheck={false}
                      required
                    />
                    <span className={styles.dataStatus}>TOK</span>
                  </div>
                </div>
              )}

              <button className={styles.primaryButton} type="submit">
                {mode === 'login' ? 'Establish Connection' : 'Request Access'}
              </button>

              <div className={styles.formFooter}>
                <Link href="/" className={styles.footerLink}>
                  Return to Dashboard
                </Link>
                <span className={styles.footerSeparator}>|</span>
                <button type="button" className={styles.footerLinkButton}>
                  {mode === 'login' ? 'Forgot Passcode?' : 'Need Approval?'}
                </button>
              </div>
            </form>
          </div>

          <footer className={styles.slabFooter}>
            <span>SYS.STATUS: READY</span>
            <span>v.4.0.1_BASALT</span>
          </footer>
        </section>
      </main>
    </div>
  );
}

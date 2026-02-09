'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import styles from './page.module.css';

type AuthMode = 'login' | 'enlist';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [identifier, setIdentifier] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [organization, setOrganization] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [enlistSuccess, setEnlistSuccess] = useState(false);
  const [enlistStatus, setEnlistStatus] = useState<'PENDING' | 'ACTIVE' | 'REJECTED' | 'UNKNOWN'>('PENDING');
  const [authError, setAuthError] = useState('');
  const router = useRouter();

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError('');

    const result = await signIn('credentials', {
      identifier,
      accessKey,
      adminOnly: 'false',
      redirect: false,
    });

    if (result?.ok) {
      const sessionRes = await fetch('/api/auth/session');
      const session = await sessionRes.json();

      if (session?.user) {
        router.replace('/');
      } else {
        setAuthError('Login succeeded, but session was not established. Check NEXTAUTH_URL and cookies.');
      }
    } else {
      setAuthError('Invalid User ID or Access Key. Verify your credentials.');
    }
  };

  const handleEnlist = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthError('');

    try {
      const res = await fetch('/api/auth/enlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: identifier,
          accessKey,
          accessToken,
          organization,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setEnlistSuccess(true);
        setEnlistStatus('PENDING');
      } else {
        setAuthError(data.error || 'Unable to process request.');
      }
    } catch {
      setAuthError('Connection failed. Try again.');
    }
  };

  useEffect(() => {
    if (!enlistSuccess) {
      return;
    }

    let cancelled = false;

    const checkStatus = async () => {
      if (!identifier || !accessKey) {
        return;
      }

      const res = await fetch('/api/auth/enlist/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: identifier, accessKey }),
      });

      if (!res.ok) {
        if (!cancelled) {
          setEnlistStatus('UNKNOWN');
        }
        return;
      }

      const data = await res.json();
      if (!cancelled) {
        const nextStatus = data.status || 'UNKNOWN';
        setEnlistStatus(nextStatus);
        if (nextStatus === 'ACTIVE') {
          router.replace('/');
        }
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [accessKey, enlistSuccess, identifier]);

  const handleSubmit = mode === 'login' ? handleLogin : handleEnlist;

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.grain} aria-hidden="true" />

        {enlistSuccess && (
          <div className={styles.welcomeScreen}>
            <div className={styles.welcomeContent}>
              <p className={styles.welcomeKicker}>REQUEST SUBMITTED</p>
              <h2 className={styles.welcomeTitle}>
                <span className={styles.welcomeLabel}>
                  {enlistStatus === 'ACTIVE' ? 'Neural Handshake Established' : 'Pending Authorization'}
                </span>
                <span className={styles.welcomeName}>{organization || 'Your Organization'}</span>
              </h2>
              <p className={styles.welcomeSubtitle}>
                {enlistStatus === 'ACTIVE'
                  ? 'Authorization confirmed. You can return to login and establish your secure session.'
                  : enlistStatus === 'REJECTED'
                    ? 'Your access request was not approved. Contact an administrator for assistance.'
                    : 'Your access request is queued. We are waiting for neural handshake confirmation from an admin.'}
              </p>
              <div className={`${styles.welcomeStatus} ${enlistStatus === 'ACTIVE' ? styles.welcomeStatusActive : ''}`}>
                <span className={styles.welcomePulse} />
                <span>
                  {enlistStatus === 'ACTIVE'
                    ? 'Handshake secured'
                    : enlistStatus === 'REJECTED'
                      ? 'Request declined'
                      : 'Awaiting admin confirmation'}
                </span>
                {enlistStatus !== 'ACTIVE' && enlistStatus !== 'REJECTED' && (
                  <span className={styles.welcomeDots} aria-hidden="true">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                )}
              </div>
              <div className={styles.welcomeActions}>
                <button
                  type="button"
                  className={styles.welcomeAction}
                  onClick={() => {
                    setEnlistSuccess(false);
                    setMode('login');
                    setIdentifier('');
                    setAccessKey('');
                    setOrganization('');
                    setAccessToken('');
                    setEnlistStatus('PENDING');
                  }}
                >
                  {enlistStatus === 'ACTIVE' ? 'Return to Login' : 'Back to Login'}
                </button>
              </div>
            </div>
          </div>
        )}

        <section className={styles.heroSection}>
          <div className={styles.heroAccent} />
          <div className={styles.heroContent}>
            <p className={styles.heroKicker}>VAULT ACCESS</p>
            <h1 className={styles.heroTitle}>Rise by Eden</h1>
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
                onClick={() => {
                  setMode('login');
                  setAuthError('');
                  setEnlistSuccess(false);
                }}
              >
                Login
              </button>
              <button
                type="button"
                className={`${styles.tabTrigger} ${mode === 'enlist' ? styles.active : ''}`}
                onClick={() => { setMode('enlist'); setAuthError(''); }}
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
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                  <span className={styles.dataStatus}>REQ</span>
                </div>
              </div>

              {mode === 'enlist' && (
                <div className={styles.inputGroup}>
                  <label htmlFor="organization">Organization</label>
                  <div className={styles.inputWrapper}>
                    <input
                      id="organization"
                      type="text"
                      placeholder="FIRM_NAME //"
                      spellCheck={false}
                      required
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
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
                    onChange={(e) => setAccessKey(e.target.value)}
                  />
                  <span className={styles.dataStatus}>SEC</span>
                </div>
              </div>

              {mode === 'enlist' && (
                <div className={styles.inputGroup}>
                  <label htmlFor="accessToken">Invite Code</label>
                  <div className={styles.inputWrapper}>
                    <input
                      id="accessToken"
                      type="text"
                      placeholder="ACCESS_TOKEN //"
                      spellCheck={false}
                      required
                      value={accessToken}
                      onChange={(e) => setAccessToken(e.target.value)}
                    />
                    <span className={styles.dataStatus}>TOK</span>
                  </div>
                </div>
              )}

              {authError && (
                <p className={styles.formError}>{authError}</p>
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

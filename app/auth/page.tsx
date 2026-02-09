'use client';

import { useState } from 'react';
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
      router.replace('/');
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
      } else {
        setAuthError(data.error || 'Unable to process request.');
      }
    } catch {
      setAuthError('Connection failed. Try again.');
    }
  };

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
                <span className={styles.welcomeLabel}>Pending Authorization</span>
                <span className={styles.welcomeName}>{organization || 'Your Organization'}</span>
              </h2>
              <p className={styles.welcomeSubtitle}>
                Your access request has been submitted. An admin will review and authorize your account. You will be able to log in once approved.
              </p>
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
                  }}
                >
                  Back to Login
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
                onClick={() => { setMode('login'); setAuthError(''); }}
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

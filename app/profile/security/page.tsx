'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

export default function SecurityPage() {
  const router = useRouter();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const sessions = [
    { device: 'MacBook Pro', location: 'Lagos, Nigeria', lastActive: 'Active now', current: true },
    { device: 'iPhone 14 Pro', location: 'Lagos, Nigeria', lastActive: '2 hours ago', current: false },
    { device: 'Windows Desktop', location: 'Abuja, Nigeria', lastActive: '5 days ago', current: false },
  ];

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Security</p>
            <h1 className={styles.pageTitle}>Account Protection</h1>
            <p className={styles.subtitle}>Manage passwords, authentication, and active sessions.</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.secondaryButton} onClick={() => router.push('/profile')}>
              Back to Profile
            </button>
          </div>
        </header>

        <div className={styles.grid}>
          <section className={styles.panel}>
            <h3 className={styles.panelTitle}>Password</h3>
            <div className={styles.securityRow}>
              <div className={styles.securityInfo}>
                <p className={styles.securityLabel}>Current Password</p>
                <p className={styles.securityValue}>••••••••••••</p>
                <p className={styles.securityMeta}>Last changed 45 days ago</p>
              </div>
              <button 
                className={styles.actionButton}
                onClick={() => setShowPasswordModal(true)}
              >
                Change Password
              </button>
            </div>
          </section>

          <section className={styles.panel}>
            <h3 className={styles.panelTitle}>Two-Factor Authentication</h3>
            <div className={styles.tfaStatus}>
              <div className={styles.tfaIndicator}>
                <span className={styles.tfaEnabled}>Enabled</span>
              </div>
              <p className={styles.tfaDescription}>
                Your account is protected with authenticator app verification.
              </p>
            </div>
            <div className={styles.tfaOptions}>
              <div className={styles.tfaMethod}>
                <div className={styles.tfaMethodInfo}>
                  <span className={styles.tfaMethodIcon}>📱</span>
                  <div>
                    <p className={styles.tfaMethodTitle}>Authenticator App</p>
                    <p className={styles.tfaMethodDesc}>Google Authenticator or similar</p>
                  </div>
                </div>
                <span className={styles.activeBadge}>Active</span>
              </div>
              <div className={styles.tfaMethod}>
                <div className={styles.tfaMethodInfo}>
                  <span className={styles.tfaMethodIcon}>✉️</span>
                  <div>
                    <p className={styles.tfaMethodTitle}>Email Backup</p>
                    <p className={styles.tfaMethodDesc}>Receive codes via email</p>
                  </div>
                </div>
                <button className={styles.linkButton}>Enable</button>
              </div>
              <div className={styles.tfaMethod}>
                <div className={styles.tfaMethodInfo}>
                  <span className={styles.tfaMethodIcon}>🔑</span>
                  <div>
                    <p className={styles.tfaMethodTitle}>Recovery Codes</p>
                    <p className={styles.tfaMethodDesc}>8 codes remaining</p>
                  </div>
                </div>
                <button className={styles.linkButton}>View Codes</button>
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>Active Sessions</h3>
              <button className={styles.dangerLink}>Sign out all devices</button>
            </div>
            <div className={styles.sessionList}>
              {sessions.map((session, index) => (
                <div key={index} className={styles.sessionItem}>
                  <div className={styles.sessionIcon}>
                    {session.device.includes('iPhone') ? '📱' : '💻'}
                  </div>
                  <div className={styles.sessionInfo}>
                    <p className={styles.sessionDevice}>
                      {session.device}
                      {session.current && <span className={styles.currentBadge}>Current</span>}
                    </p>
                    <p className={styles.sessionMeta}>
                      {session.location} · {session.lastActive}
                    </p>
                  </div>
                  {!session.current && (
                    <button className={styles.revokeButton}>Revoke</button>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className={styles.panel}>
            <h3 className={styles.panelTitle}>Security Preferences</h3>
            <label className={styles.toggleRow}>
              <div>
                <p className={styles.toggleTitle}>Login Alerts</p>
                <p className={styles.toggleDesc}>Get notified of new sign-ins via email.</p>
              </div>
              <input type="checkbox" className={styles.toggle} defaultChecked />
            </label>
            <label className={styles.toggleRow}>
              <div>
                <p className={styles.toggleTitle}>Device Approval</p>
                <p className={styles.toggleDesc}>Require approval for unrecognized devices.</p>
              </div>
              <input type="checkbox" className={styles.toggle} defaultChecked />
            </label>
            <label className={styles.toggleRow}>
              <div>
                <p className={styles.toggleTitle}>Suspicious Activity Lock</p>
                <p className={styles.toggleDesc}>Auto-lock account on failed login attempts.</p>
              </div>
              <input type="checkbox" className={styles.toggle} defaultChecked />
            </label>
          </section>

          <section className={styles.dangerPanel}>
            <h3 className={styles.panelTitle}>Danger Zone</h3>
            <div className={styles.dangerRow}>
              <div>
                <p className={styles.dangerTitle}>Deactivate Account</p>
                <p className={styles.dangerDesc}>
                  Temporarily disable your account. You can reactivate anytime.
                </p>
              </div>
              <button className={styles.dangerButton}>Deactivate</button>
            </div>
            <div className={styles.dangerRow}>
              <div>
                <p className={styles.dangerTitle}>Delete Account</p>
                <p className={styles.dangerDesc}>
                  Permanently delete your account and all associated data.
                </p>
              </div>
              <button className={styles.dangerButtonFilled}>Delete Account</button>
            </div>
          </section>
        </div>

        {showPasswordModal && (
          <div className={styles.modalOverlay} onClick={() => setShowPasswordModal(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <h3 className={styles.modalTitle}>Change Password</h3>
              <div className={styles.modalField}>
                <label className={styles.label}>Current Password</label>
                <input type="password" className={styles.input} placeholder="Enter current password" />
              </div>
              <div className={styles.modalField}>
                <label className={styles.label}>New Password</label>
                <input type="password" className={styles.input} placeholder="Enter new password" />
              </div>
              <div className={styles.modalField}>
                <label className={styles.label}>Confirm New Password</label>
                <input type="password" className={styles.input} placeholder="Confirm new password" />
              </div>
              <div className={styles.modalActions}>
                <button className={styles.secondaryButton} onClick={() => setShowPasswordModal(false)}>
                  Cancel
                </button>
                <button className={styles.primaryButton}>Update Password</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

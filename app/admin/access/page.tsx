'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import AdminNav from '@/components/AdminNav';
import styles from '../admin.module.css';

type UserRecord = {
  id: string;
  userId: string;
  name: string | null;
  organization: string | null;
  role: string;
  status: string;
  tokenUsed: boolean;
  createdAt: string;
};

type Credentials = {
  userId: string;
  accessKey: string;
  accessToken: string;
};

export default function AdminAccess() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserRecord[]>([]);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'ACTIVE' | 'REJECTED'>('all');

  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/admin/users');
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
      setPendingUsers(data.users.filter((u: UserRecord) => u.status === 'PENDING' && u.tokenUsed));
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleProvision = async () => {
    setIsProvisioning(true);
    setStatusMessage('Generating credentials...');
    setCredentials(null);

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'CLIENT' }),
    });

    if (res.ok) {
      const data = await res.json();
      setCredentials(data.credentials);
      setStatusMessage('Credentials generated. Share securely with the client.');
      fetchUsers();
    } else {
      setStatusMessage('Failed to provision user.');
    }
    setIsProvisioning(false);
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });

    if (res.ok) {
      fetchUsers();
    }
  };

  const filteredUsers = filter === 'all' ? users : users.filter(u => u.status === filter);
  const activeCount = users.filter(u => u.status === 'ACTIVE').length;
  const pendingCount = users.filter(u => u.status === 'PENDING').length;

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Admin</p>
            <h1 className={styles.pageTitle}>Access Control</h1>
            <p className={styles.subtitle}>Provision client credentials, manage enlistment requests, and control access.</p>
          </div>
          <button
            className={styles.primaryButton}
            onClick={handleProvision}
            disabled={isProvisioning}
          >
            {isProvisioning ? 'Generating...' : 'Provision Client'}
          </button>
        </header>

        <AdminNav />

        {/* Stat cards */}
        <section className={styles.statGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Users</div>
            <div className={styles.statValue}>{users.length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Active</div>
            <div className={styles.statValue}>{activeCount}</div>
            <div className={styles.statMeta}>{activeCount} authorized</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Pending Requests</div>
            <div className={styles.statValue}>{pendingCount}</div>
            <div className={styles.statMeta}>{pendingUsers.length} awaiting review</div>
          </div>
        </section>

        {/* Generated credentials display */}
        {credentials && (
          <section className={`${styles.section} ${styles.credentialSection}`}>
            <h2 className={styles.sectionTitle}>New Client Credentials</h2>
            <p className={styles.credentialNote}>
              Share these securely with the client. The access key and token are shown only once.
            </p>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>User ID</label>
                <div className={`${styles.input} ${styles.copyInput}`}>
                  {credentials.userId}
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Access Key</label>
                <div className={`${styles.input} ${styles.copyInput}`}>
                  {credentials.accessKey}
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Access Token (Invite Code)</label>
                <div className={`${styles.input} ${styles.copyInput}`}>
                  {credentials.accessToken}
                </div>
              </div>
            </div>
            <div className={`${styles.inlineActions} ${styles.inlineActionsTight}`}>
              <button
                className={styles.secondaryButton}
                onClick={() => {
                  navigator.clipboard.writeText(
                    `User ID: ${credentials.userId}\nAccess Key: ${credentials.accessKey}\nAccess Token: ${credentials.accessToken}`
                  );
                  setStatusMessage('Credentials copied to clipboard.');
                }}
              >
                Copy All
              </button>
              <span className={`${styles.badge} ${styles.badgeMuted}`}>{statusMessage}</span>
            </div>
          </section>
        )}

        <section className={styles.grid}>
          {/* Pending enlistment requests */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Enlistment Requests</h2>
            {pendingUsers.length === 0 ? (
              <p className={styles.emptyText}>No pending enlistment requests.</p>
            ) : (
              <div className={styles.table}>
                <div className={styles.tableHeader}>
                  <div>User ID</div>
                  <div>Organization</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>
                {pendingUsers.map((user) => (
                  <div key={user.id} className={styles.tableRow}>
                    <div>{user.userId}</div>
                    <div>{user.organization || '—'}</div>
                    <div className={`${styles.badge} ${styles.badgePending}`}>Pending</div>
                    <div className={styles.inlineActions}>
                      <button
                        className={`${styles.secondaryButton} ${styles.actionButtonSmall}`}
                        onClick={() => handleAction(user.id, 'approve')}
                      >
                        Authorize
                      </button>
                      <button
                        className={`${styles.secondaryButton} ${styles.actionButtonSmall} ${styles.actionButtonDanger}`}
                        onClick={() => handleAction(user.id, 'reject')}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All users list */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>All Users</h2>
            <div className={`${styles.inlineActions} ${styles.inlineActionsSpaced}`}>
              {(['all', 'ACTIVE', 'PENDING', 'REJECTED'] as const).map((f) => (
                <button
                  key={f}
                  className={`${styles.secondaryButton} ${styles.filterButton} ${filter === f ? styles.filterButtonActive : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <div>User ID</div>
                <div>Organization</div>
                <div>Role</div>
                <div>Status</div>
              </div>
              {filteredUsers.map((user) => (
                <div key={user.id} className={styles.tableRow}>
                  <div>{user.userId}</div>
                  <div>{user.organization || '—'}</div>
                  <div>{user.role}</div>
                  <div className={`${styles.badge} ${
                    user.status === 'ACTIVE' ? styles.badgeSuccess :
                    user.status === 'PENDING' ? styles.badgePending :
                    styles.badgeMuted
                  }`}>
                    {user.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Policy overview */}
        <section className={`${styles.section} ${styles.sectionSpacing}`}>
          <h2 className={styles.sectionTitle}>Access Flow</h2>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Step 1</label>
              <div className={`${styles.badge} ${styles.badgeMuted}`}>Admin provisions User ID + Access Key + Access Token</div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Step 2</label>
              <div className={`${styles.badge} ${styles.badgeMuted}`}>Admin sends credentials securely to client</div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Step 3</label>
              <div className={`${styles.badge} ${styles.badgeMuted}`}>Client uses Enlist form with all 3 credentials + org name</div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Step 4</label>
              <div className={`${styles.badge} ${styles.badgeMuted}`}>Admin reviews and authorizes the request</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

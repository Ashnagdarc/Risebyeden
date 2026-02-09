'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import AdminNav from '@/components/AdminNav';
import styles from '../admin.module.css';

type InviteRecord = {
  id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  expiresAt: string | null;
  createdAt: string;
  organization: { id: string; name: string } | null;
};

type InvitePayload = {
  email: string;
  role: 'ADMIN' | 'CLIENT' | 'AGENT';
  organizationId?: string | null;
  expiresAt?: string | null;
};

const roleOptions: InvitePayload['role'][] = ['CLIENT', 'ADMIN', 'AGENT'];

function getStatusBadge(status: string): string {
  if (status === 'ACCEPTED' || status === 'ACTIVE') {
    return `${styles.badge} ${styles.badgeSuccess}`;
  }
  if (status === 'EXPIRED' || status === 'REJECTED') {
    return `${styles.badge} ${styles.badgeMuted}`;
  }
  return `${styles.badge} ${styles.badgePending}`;
}

export default function AdminInvites() {
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InvitePayload['role']>('CLIENT');
  const [organizationId, setOrganizationId] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SENT' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'>('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CLIENT' | 'ADMIN' | 'AGENT'>('ALL');

  const fetchInvites = useCallback(async () => {
    const res = await fetch('/api/admin/invites');
    if (res.ok) {
      const data = await res.json();
      setInvites(data.invites || []);
    }
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage('');

    if (!email.trim()) {
      setStatusMessage('Email is required.');
      return;
    }

    setIsSubmitting(true);

    const normalizedExpiresAt = expiresAt
      ? new Date(`${expiresAt}T00:00:00`).toISOString()
      : null;

    const res = await fetch('/api/admin/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        role,
        organizationId: organizationId.trim() || null,
        expiresAt: normalizedExpiresAt,
      }),
    });

    if (res.ok) {
      setStatusMessage('Invite created.');
      setEmail('');
      setOrganizationId('');
      setExpiresAt('');
      fetchInvites();
    } else {
      setStatusMessage('Failed to create invite.');
    }

    setIsSubmitting(false);
  };

  const filteredInvites = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return invites.filter((invite) => {
      const matchesStatus = statusFilter === 'ALL' || invite.status === statusFilter;
      const matchesRole = roleFilter === 'ALL' || invite.role === roleFilter;
      const matchesSearch = !normalizedSearch || [
        invite.email,
        invite.token,
        invite.organization?.name || '',
        invite.organization?.id || '',
      ].some((value) => value.toLowerCase().includes(normalizedSearch));

      return matchesStatus && matchesRole && matchesSearch;
    });
  }, [invites, roleFilter, searchTerm, statusFilter]);

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Admin</p>
            <h1 className={styles.pageTitle}>Invites</h1>
            <p className={styles.subtitle}>Issue invite tokens for new stakeholders and track their status.</p>
          </div>
        </header>

        <AdminNav />

        <section className={styles.grid}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Invite Log</h2>
            <div className={styles.filterBar}>
              <div className={styles.filterField}>
                <label className={styles.label} htmlFor="inviteSearch">Search</label>
                <input
                  className={styles.input}
                  id="inviteSearch"
                  placeholder="Email, token, org"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className={styles.filterField}>
                <label className={styles.label} htmlFor="inviteStatus">Status</label>
                <select
                  className={styles.select}
                  id="inviteStatus"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                >
                  <option value="ALL">All</option>
                  <option value="SENT">Sent</option>
                  <option value="ACCEPTED">Accepted</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="REVOKED">Revoked</option>
                </select>
              </div>
              <div className={styles.filterField}>
                <label className={styles.label} htmlFor="inviteRole">Role</label>
                <select
                  className={styles.select}
                  id="inviteRole"
                  value={roleFilter}
                  onChange={(event) => setRoleFilter(event.target.value as typeof roleFilter)}
                >
                  <option value="ALL">All</option>
                  <option value="CLIENT">Client</option>
                  <option value="ADMIN">Admin</option>
                  <option value="AGENT">Agent</option>
                </select>
              </div>
            </div>
            <div className={styles.table}>
              <div className={`${styles.tableHeader} ${styles.tableHeaderActions}`}>
                <div>Invite</div>
                <div>Role</div>
                <div>Status</div>
                <div>Expires</div>
                <div>Token</div>
              </div>
              {filteredInvites.length === 0 ? (
                <div className={styles.tableRow}>
                  <div className={styles.tableEmpty}>No invites match the current filters.</div>
                </div>
              ) : (
                filteredInvites.map((invite) => (
                  <div key={invite.id} className={`${styles.tableRow} ${styles.tableRowActions}`}>
                    <div>
                      {invite.email}
                      <div className={styles.statMeta}>
                        {invite.organization?.name || invite.organization?.id || 'No organization'}
                      </div>
                    </div>
                    <div>{invite.role}</div>
                    <div className={getStatusBadge(invite.status)}>{invite.status}</div>
                    <div>{invite.expiresAt ? new Date(invite.expiresAt).toLocaleDateString() : '—'}</div>
                    <div className={styles.tableActions}>
                      <span className={styles.monoText}>{invite.token}</span>
                      <button
                        className={`${styles.secondaryButton} ${styles.actionButtonSmall}`}
                        onClick={() => {
                          navigator.clipboard.writeText(invite.token);
                          setCopyMessage('Invite token copied.');
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {copyMessage && <p className={styles.emptyText}>{copyMessage}</p>}
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Create Invite</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">Email</label>
                <input
                  className={styles.input}
                  id="email"
                  placeholder="client@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="role">Role</label>
                  <select
                    className={styles.select}
                    id="role"
                    value={role}
                    onChange={(event) => setRole(event.target.value as InvitePayload['role'])}
                  >
                    {roleOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="expires">Expires On</label>
                  <input
                    className={styles.input}
                    id="expires"
                    placeholder="YYYY-MM-DD"
                    value={expiresAt}
                    onChange={(event) => setExpiresAt(event.target.value)}
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="org">Organization ID (optional)</label>
                <input
                  className={styles.input}
                  id="org"
                  placeholder="ORG-1234"
                  value={organizationId}
                  onChange={(event) => setOrganizationId(event.target.value)}
                />
              </div>
              <div className={styles.inlineActions}>
                <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Invite'}
                </button>
                {statusMessage && <span className={`${styles.badge} ${styles.badgeMuted}`}>{statusMessage}</span>}
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

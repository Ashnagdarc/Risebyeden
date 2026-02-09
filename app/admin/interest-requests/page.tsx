'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import AdminNav from '@/components/AdminNav';
import styles from '../admin.module.css';

type InterestRequest = {
  id: string;
  status: string;
  createdAt: string;
  user: { userId: string; name: string | null } | null;
  property: { name: string } | null;
};

function getStatusBadge(status: string): string {
  if (status === 'APPROVED' || status === 'SCHEDULED') {
    return `${styles.badge} ${styles.badgeSuccess}`;
  }
  if (status === 'REJECTED' || status === 'CANCELLED') {
    return `${styles.badge} ${styles.badgeMuted}`;
  }
  return `${styles.badge} ${styles.badgePending}`;
}

export default function AdminInterestRequests() {
  const [requests, setRequests] = useState<InterestRequest[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'SCHEDULED' | 'APPROVED' | 'REJECTED'>('ALL');

  const fetchRequests = useCallback(async () => {
    const res = await fetch('/api/admin/interest-requests');
    if (res.ok) {
      const data = await res.json();
      setRequests(data.requests || []);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;
      const matchesSearch = !normalizedSearch || [
        request.user?.name || '',
        request.user?.userId || '',
        request.property?.name || '',
        request.id,
      ].some((value) => value.toLowerCase().includes(normalizedSearch));

      return matchesStatus && matchesSearch;
    });
  }, [requests, searchTerm, statusFilter]);

  const updateStatus = async (id: string, status: 'APPROVED' | 'REJECTED' | 'SCHEDULED') => {
    setStatusMessage('');
    setUpdatingId(id);

    const res = await fetch('/api/admin/interest-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });

    if (res.ok) {
      setStatusMessage('Request updated.');
      fetchRequests();
    } else {
      setStatusMessage('Failed to update request.');
    }

    setUpdatingId(null);
  };

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Admin</p>
            <h1 className={styles.pageTitle}>Interest Requests</h1>
            <p className={styles.subtitle}>Review incoming interest requests and track their current status.</p>
          </div>
        </header>

        <AdminNav />

        <section className={styles.grid}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>All Requests</h2>
            <div className={styles.filterBar}>
              <div className={styles.filterField}>
                <label className={styles.label} htmlFor="requestSearch">Search</label>
                <input
                  className={styles.input}
                  id="requestSearch"
                  placeholder="Client, property, request"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className={styles.filterField}>
                <label className={styles.label} htmlFor="requestStatus">Status</label>
                <select
                  className={styles.select}
                  id="requestStatus"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                >
                  <option value="ALL">All</option>
                  <option value="PENDING">Pending</option>
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
            <div className={styles.table}>
              <div className={`${styles.tableHeader} ${styles.tableHeaderActionsWide}`}>
                <div>Request</div>
                <div>Client</div>
                <div>Property</div>
                <div>Status</div>
                <div>Date</div>
                <div>Actions</div>
              </div>
              {filteredRequests.length === 0 ? (
                <div className={styles.tableRow}>
                  <div className={styles.tableEmpty}>No requests match the current filters.</div>
                </div>
              ) : (
                filteredRequests.map((request) => (
                  <div key={request.id} className={`${styles.tableRow} ${styles.tableRowActionsWide}`}>
                    <div>{request.id.slice(0, 6).toUpperCase()}</div>
                    <div>{request.user?.name || request.user?.userId || '—'}</div>
                    <div>{request.property?.name || '—'}</div>
                    <div className={getStatusBadge(request.status)}>{request.status}</div>
                    <div>{new Date(request.createdAt).toLocaleDateString()}</div>
                    <div className={styles.tableActions}>
                      <button
                        className={`${styles.secondaryButton} ${styles.actionButtonSmall}`}
                        onClick={() => updateStatus(request.id, 'SCHEDULED')}
                        disabled={updatingId === request.id || request.status === 'SCHEDULED'}
                      >
                        Schedule
                      </button>
                      <button
                        className={`${styles.secondaryButton} ${styles.actionButtonSmall}`}
                        onClick={() => updateStatus(request.id, 'APPROVED')}
                        disabled={updatingId === request.id || request.status === 'APPROVED'}
                      >
                        Approve
                      </button>
                      <button
                        className={`${styles.secondaryButton} ${styles.actionButtonSmall} ${styles.actionButtonDanger}`}
                        onClick={() => updateStatus(request.id, 'REJECTED')}
                        disabled={updatingId === request.id || request.status === 'REJECTED'}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {statusMessage && <p className={styles.emptyText}>{statusMessage}</p>}
          </div>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Next Steps</h2>
            <p className={styles.emptyText}>Track follow-ups and finalize approvals after client contact.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

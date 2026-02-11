'use client';

import { useMemo, useState } from 'react';
import styles from '../admin/admin.module.css';

type AgentNotification = {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

type AgentAssignedRequest = {
  id: string;
  status: 'PENDING' | 'SCHEDULED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  assignedAt: string | null;
  user: {
    userId: string;
    name: string | null;
    email: string | null;
    organization: string | null;
    clientProfile: {
      phone: string | null;
      city: string | null;
      region: string | null;
      country: string | null;
    } | null;
  } | null;
  property: {
    name: string;
    location: string | null;
    city: string | null;
    state: string | null;
    propertyType: string | null;
    status: string;
    appreciation: number | null;
    capRate: number | null;
    occupancy: number | null;
  } | null;
};

type AgentDashboardClientProps = {
  assignedRequests: AgentAssignedRequest[];
  notifications: AgentNotification[];
};

const stableDateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
  timeZone: 'UTC',
});

function formatDateTime(value: string | null): string {
  if (!value) {
    return '—';
  }

  return `${stableDateTimeFormatter.format(new Date(value))} UTC`;
}

function formatPercent(value: number | null): string {
  if (value == null) {
    return '—';
  }

  return `${value.toFixed(1)}%`;
}

function formatLocation(request: AgentAssignedRequest): string {
  const locationParts = [
    request.property?.location,
    request.property?.city,
    request.property?.state,
  ].filter(Boolean) as string[];

  if (locationParts.length === 0) {
    return '—';
  }

  return locationParts.join(', ');
}

export default function AgentDashboardClient({ assignedRequests, notifications }: AgentDashboardClientProps) {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const selectedRequest = useMemo(
    () => assignedRequests.find((request) => request.id === selectedRequestId) || null,
    [assignedRequests, selectedRequestId]
  );

  return (
    <section className={styles.grid}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Lead Queue</h2>
        <p className={styles.emptyText}>Click any assigned request to view full client and property details.</p>
        <div className={styles.table}>
          <div className={`${styles.tableHeader} ${styles.tableHeaderActionsWide}`}>
            <div>Request</div>
            <div>Client</div>
            <div>Property</div>
            <div>Status</div>
            <div>Assigned</div>
            <div>Contact</div>
          </div>
          {assignedRequests.length === 0 ? (
            <div className={styles.tableRow}>
              <div className={styles.tableEmpty}>No assigned requests yet.</div>
            </div>
          ) : (
            assignedRequests.map((request) => (
              <button
                key={request.id}
                type="button"
                className={`${styles.tableRow} ${styles.tableRowActionsWide} ${styles.tableRowButton}`}
                onClick={() => setSelectedRequestId(request.id)}
                aria-label={`Open details for request ${request.id}`}
              >
                <div>{request.id.slice(0, 6).toUpperCase()}</div>
                <div>{request.user?.name || request.user?.userId || '—'}</div>
                <div>{request.property?.name || '—'}</div>
                <div className={`${styles.badge} ${styles.badgeSuccess}`}>{request.status === 'SCHEDULED' ? 'ASSIGNED' : request.status}</div>
                <div>{formatDateTime(request.assignedAt || request.createdAt)}</div>
                <div>{request.user?.email || request.user?.userId || '—'}</div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Notifications</h2>
        <div className={styles.table}>
          {notifications.length === 0 ? (
            <p className={styles.emptyText}>No notifications yet.</p>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className={styles.statusHintItem}>
                <div>
                  <div>{notification.title}</div>
                  <div className={styles.emptyText}>{notification.body}</div>
                  <div className={styles.monoText}>{formatDateTime(notification.createdAt)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedRequest && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="agent-request-modal-title"
          onClick={() => setSelectedRequestId(null)}
        >
          <div className={`${styles.modalCard} ${styles.modalCardWide}`} onClick={(event) => event.stopPropagation()}>
            <h3 id="agent-request-modal-title" className={styles.modalTitle}>Assigned Request Details</h3>
            <div className={styles.statusHintList}>
              <div className={styles.statusHintItem}>
                <p className={styles.hintTitle}>Request</p>
                <p className={styles.hintBody}>{selectedRequest.id.toUpperCase()}</p>
              </div>
              <div className={styles.statusHintItem}>
                <p className={styles.hintTitle}>Client</p>
                <p className={styles.hintBody}>{selectedRequest.user?.name || 'Unknown client'}</p>
                <p className={styles.hintBody}>User ID: {selectedRequest.user?.userId || '—'}</p>
                <p className={styles.hintBody}>Email: {selectedRequest.user?.email || '—'}</p>
                <p className={styles.hintBody}>Phone: {selectedRequest.user?.clientProfile?.phone || '—'}</p>
                <p className={styles.hintBody}>Organization: {selectedRequest.user?.organization || '—'}</p>
              </div>
              <div className={styles.statusHintItem}>
                <p className={styles.hintTitle}>Property</p>
                <p className={styles.hintBody}>{selectedRequest.property?.name || '—'}</p>
                <p className={styles.hintBody}>Type: {selectedRequest.property?.propertyType || '—'}</p>
                <p className={styles.hintBody}>Status: {selectedRequest.property?.status || '—'}</p>
                <p className={styles.hintBody}>Location: {formatLocation(selectedRequest)}</p>
                <p className={styles.hintBody}>Appreciation: {formatPercent(selectedRequest.property?.appreciation ?? null)}</p>
                <p className={styles.hintBody}>Cap Rate: {formatPercent(selectedRequest.property?.capRate ?? null)}</p>
                <p className={styles.hintBody}>Occupancy: {formatPercent(selectedRequest.property?.occupancy ?? null)}</p>
              </div>
              <div className={styles.statusHintItem}>
                <p className={styles.hintTitle}>Timeline</p>
                <p className={styles.hintBody}>Requested: {formatDateTime(selectedRequest.createdAt)}</p>
                <p className={styles.hintBody}>Assigned: {formatDateTime(selectedRequest.assignedAt)}</p>
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setSelectedRequestId(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

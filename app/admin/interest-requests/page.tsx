'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import AdminNav from '@/components/AdminNav';
import styles from '../admin.module.css';

type InterestRequest = {
  id: string;
  status: 'PENDING' | 'SCHEDULED' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  assignedAt: string | null;
  user: { userId: string; name: string | null } | null;
  property: { name: string } | null;
  assignedAgent: { id: string; userId: string; name: string | null; email: string | null } | null;
};

type AgentUser = {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  role: 'AGENT';
  status: 'ACTIVE';
};

function getStatusBadge(status: InterestRequest['status']): string {
  if (status === 'SCHEDULED' || status === 'APPROVED') {
    return `${styles.badge} ${styles.badgeSuccess}`;
  }
  if (status === 'REJECTED') {
    return `${styles.badge} ${styles.badgeMuted}`;
  }
  return `${styles.badge} ${styles.badgePending}`;
}

function getStatusLabel(status: InterestRequest['status']): string {
  if (status === 'SCHEDULED') {
    return 'ASSIGNED';
  }
  return status;
}

export default function AdminInterestRequests() {
  const [requests, setRequests] = useState<InterestRequest[]>([]);
  const [agents, setAgents] = useState<AgentUser[]>([]);
  const [agentSelections, setAgentSelections] = useState<Record<string, string>>({});
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

  const fetchAgents = useCallback(async () => {
    const res = await fetch('/api/admin/users?status=ACTIVE&role=AGENT');
    if (res.ok) {
      const data = await res.json();
      setAgents((data.users || []) as AgentUser[]);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    fetchAgents();
  }, [fetchAgents, fetchRequests]);

  useEffect(() => {
    const nextSelections: Record<string, string> = {};
    requests.forEach((request) => {
      if (request.assignedAgent?.id) {
        nextSelections[request.id] = request.assignedAgent.id;
      }
    });
    setAgentSelections((prev) => ({ ...prev, ...nextSelections }));
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter;
      const matchesSearch = !normalizedSearch || [
        request.user?.name || '',
        request.user?.userId || '',
        request.property?.name || '',
        request.assignedAgent?.name || '',
        request.assignedAgent?.userId || '',
        request.id,
      ].some((value) => value.toLowerCase().includes(normalizedSearch));

      return matchesStatus && matchesSearch;
    });
  }, [requests, searchTerm, statusFilter]);

  const assignAgent = async (id: string) => {
    const agentUserId = agentSelections[id];
    if (!agentUserId) {
      setStatusMessage('Select an agent before assigning.');
      return;
    }

    setStatusMessage('');
    setUpdatingId(id);

    const res = await fetch('/api/admin/interest-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'ASSIGN', agentUserId }),
    });

    if (res.ok) {
      setStatusMessage('Request assigned. Agent notified by email and in-app alert.');
      await fetchRequests();
    } else {
      const payload = await res.json().catch(() => ({}));
      setStatusMessage(payload.error || 'Failed to assign request.');
    }

    setUpdatingId(null);
  };

  const rejectRequest = async (id: string) => {
    setStatusMessage('');
    setUpdatingId(id);

    const res = await fetch('/api/admin/interest-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'REJECT' }),
    });

    if (res.ok) {
      setStatusMessage('Request rejected.');
      await fetchRequests();
    } else {
      const payload = await res.json().catch(() => ({}));
      setStatusMessage(payload.error || 'Failed to reject request.');
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
            <p className={styles.subtitle}>Assign each request to an active agent for immediate outreach.</p>
          </div>
        </header>

        <AdminNav />

        <section className={styles.grid}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>All Requests</h2>
            {agents.length === 0 && (
              <p className={styles.emptyText}>No active agents found. Create/activate AGENT users before assigning requests.</p>
            )}
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
                  <option value="SCHEDULED">Assigned</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
            <div className={styles.table}>
              <div className={`${styles.tableHeader} ${styles.tableHeaderActionsXL}`}>
                <div>Request</div>
                <div>Client</div>
                <div>Property</div>
                <div>Agent</div>
                <div>Status</div>
                <div>Date</div>
                <div>Actions</div>
              </div>
              {filteredRequests.length === 0 ? (
                <div className={styles.tableRow}>
                  <div className={styles.tableEmpty}>No requests match the current filters.</div>
                </div>
              ) : (
                filteredRequests.map((request) => {
                  const selectedAgent = agentSelections[request.id] || '';
                  const isRejected = request.status === 'REJECTED';
                  const isAssigned = request.status === 'SCHEDULED' || request.status === 'APPROVED';

                  return (
                    <div key={request.id} className={`${styles.tableRow} ${styles.tableRowActionsXL}`}>
                      <div>{request.id.slice(0, 6).toUpperCase()}</div>
                      <div>{request.user?.name || request.user?.userId || '—'}</div>
                      <div>{request.property?.name || '—'}</div>
                      <div>
                        <select
                          className={styles.select}
                          aria-label={`Assigned agent for ${request.id}`}
                          value={selectedAgent}
                          disabled={isRejected || isAssigned}
                          onChange={(event) => {
                            const value = event.target.value;
                            setAgentSelections((prev) => ({ ...prev, [request.id]: value }));
                          }}
                        >
                          <option value="">Select agent</option>
                          {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name || agent.userId}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className={getStatusBadge(request.status)}>{getStatusLabel(request.status)}</div>
                      <div>{new Date(request.createdAt).toLocaleDateString()}</div>
                      <div className={styles.tableActions}>
                        <button
                          className={`${styles.secondaryButton} ${styles.actionButtonSmall}`}
                          onClick={() => assignAgent(request.id)}
                          disabled={isRejected || isAssigned || agents.length === 0 || !selectedAgent || updatingId === request.id}
                        >
                          {isAssigned ? 'Assigned' : 'Assign'}
                        </button>
                        <button
                          className={`${styles.secondaryButton} ${styles.actionButtonSmall} ${styles.actionButtonDanger}`}
                          onClick={() => rejectRequest(request.id)}
                          disabled={isRejected || updatingId === request.id}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {statusMessage && <p className={styles.emptyText}>{statusMessage}</p>}
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Status Meaning</h2>
            <div className={styles.statusHintList}>
              <div className={styles.statusHintItem}>
                <p className={styles.hintTitle}>Pending</p>
                <p className={styles.hintBody}>New request waiting for admin assignment.</p>
              </div>
              <div className={styles.statusHintItem}>
                <p className={styles.hintTitle}>Assigned (Scheduled)</p>
                <p className={styles.hintBody}>Admin assigned an agent. Agent receives email + in-app notification and should contact the client immediately.</p>
              </div>
              <div className={styles.statusHintItem}>
                <p className={styles.hintTitle}>Approved</p>
                <p className={styles.hintBody}>Lead accepted/finalized after outreach.</p>
              </div>
              <div className={styles.statusHintItem}>
                <p className={styles.hintTitle}>Rejected</p>
                <p className={styles.hintBody}>Request declined and removed from assignment flow.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

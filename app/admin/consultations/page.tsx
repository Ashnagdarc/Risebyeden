'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import AdminNav from '@/components/AdminNav';
import styles from '../admin.module.css';

type Advisor = {
  id: string;
  name: string;
  title: string;
  specialty: string | null;
  status: 'AVAILABLE' | 'BUSY' | 'INACTIVE';
};

type Consultation = {
  id: string;
  type: 'PORTFOLIO' | 'ACQUISITION' | 'MARKET';
  preferredDate: string;
  preferredTime: string | null;
  notes: string | null;
  status: 'PENDING' | 'APPROVED' | 'SCHEDULED' | 'DECLINED' | 'COMPLETED';
  createdAt: string;
  user: {
    userId: string;
    name: string | null;
    email: string | null;
  };
  advisor: {
    id: string;
    name: string;
    title: string;
  } | null;
};

const statusOptions: Consultation['status'][] = [
  'PENDING',
  'APPROVED',
  'SCHEDULED',
  'DECLINED',
  'COMPLETED',
];

export default function ConsultationAdminPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [advisorSelections, setAdvisorSelections] = useState<Record<string, string>>({});

  const [newAdvisorName, setNewAdvisorName] = useState('');
  const [newAdvisorTitle, setNewAdvisorTitle] = useState('');
  const [newAdvisorSpecialty, setNewAdvisorSpecialty] = useState('');
  const [newAdvisorStatus, setNewAdvisorStatus] = useState<Advisor['status']>('AVAILABLE');
  const [advisorMessage, setAdvisorMessage] = useState('');

  const fetchConsultations = useCallback(async () => {
    const res = await fetch('/api/admin/consultations');
    if (!res.ok) {
      return;
    }
    const data = await res.json();
    setConsultations(data.requests || []);
  }, []);

  const fetchAdvisors = useCallback(async () => {
    const res = await fetch('/api/admin/advisors');
    if (!res.ok) {
      return;
    }
    const data = await res.json();
    setAdvisors(data.advisors || []);
  }, []);

  useEffect(() => {
    fetchConsultations();
    fetchAdvisors();
  }, [fetchConsultations, fetchAdvisors]);

  useEffect(() => {
    const nextSelections: Record<string, string> = {};
    consultations.forEach((request) => {
      if (request.advisor?.id) {
        nextSelections[request.id] = request.advisor.id;
      }
    });
    setAdvisorSelections(nextSelections);
  }, [consultations]);

  const advisorOptions = useMemo(
    () => advisors.filter((advisor) => advisor.status !== 'INACTIVE'),
    [advisors]
  );

  const updateConsultation = async (id: string, status: Consultation['status'], advisorId?: string) => {
    setIsSubmitting(true);
    setStatusMessage('');

    const res = await fetch('/api/admin/consultations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        status,
        advisorId: advisorId || null,
      }),
    });

    if (res.ok) {
      setStatusMessage('Consultation updated.');
      fetchConsultations();
    } else {
      setStatusMessage('Unable to update consultation.');
    }

    setIsSubmitting(false);
  };

  const handleAdvisorCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setAdvisorMessage('');

    if (!newAdvisorName || !newAdvisorTitle) {
      setAdvisorMessage('Advisor name and title are required.');
      return;
    }

    setIsSubmitting(true);

    const res = await fetch('/api/admin/advisors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newAdvisorName,
        title: newAdvisorTitle,
        specialty: newAdvisorSpecialty,
        status: newAdvisorStatus,
      }),
    });

    if (res.ok) {
      setAdvisorMessage('Advisor created.');
      setNewAdvisorName('');
      setNewAdvisorTitle('');
      setNewAdvisorSpecialty('');
      setNewAdvisorStatus('AVAILABLE');
      fetchAdvisors();
    } else {
      setAdvisorMessage('Unable to create advisor.');
    }

    setIsSubmitting(false);
  };

  const handleAdvisorStatusUpdate = async (advisorId: string, status: Advisor['status']) => {
    setIsSubmitting(true);
    setAdvisorMessage('');

    const res = await fetch('/api/admin/advisors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: advisorId, status }),
    });

    if (res.ok) {
      fetchAdvisors();
    }

    setIsSubmitting(false);
  };

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Admin</p>
            <h1 className={styles.pageTitle}>Consultations</h1>
            <p className={styles.subtitle}>Review consultation requests and manage advisor availability.</p>
          </div>
        </header>

        <AdminNav />

        <section className={styles.grid}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Requests</h2>
            <div className={styles.table}>
              <div className={`${styles.tableHeader} ${styles.tableHeaderActionsWide}`}>
                <div>Client</div>
                <div>Type</div>
                <div>Preferred</div>
                <div>Advisor</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              {consultations.length === 0 ? (
                <div className={styles.tableRow}>
                  <div className={styles.tableEmpty}>No consultation requests yet.</div>
                </div>
              ) : (
                consultations.map((request) => (
                  <div key={request.id} className={`${styles.tableRow} ${styles.tableRowActionsWide}`}>
                    <div>
                      {request.user.name || request.user.userId}
                      <div className={styles.statMeta}>{request.user.email || 'No email'}</div>
                    </div>
                    <div>{request.type}</div>
                    <div>
                      {new Date(request.preferredDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      <div className={styles.statMeta}>{request.preferredTime || 'Time pending'}</div>
                    </div>
                    <div>
                      <select
                        className={styles.select}
                        aria-label={`Advisor assignment for ${request.user.name || request.user.userId}`}
                        value={advisorSelections[request.id] || ''}
                        onChange={(event) =>
                          setAdvisorSelections((prev) => ({
                            ...prev,
                            [request.id]: event.target.value,
                          }))
                        }
                      >
                        <option value="">Unassigned</option>
                        {advisorOptions.map((advisor) => (
                          <option key={advisor.id} value={advisor.id}>
                            {advisor.name}
                          </option>
                        ))}
                      </select>
                      {request.advisor && (
                        <div className={styles.statMeta}>{request.advisor.title}</div>
                      )}
                    </div>
                    <div>
                      <select
                        className={styles.select}
                        aria-label={`Consultation status for ${request.user.name || request.user.userId}`}
                        value={request.status}
                        onChange={(event) =>
                          updateConsultation(request.id, event.target.value as Consultation['status'], advisorSelections[request.id])
                        }
                        disabled={isSubmitting}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.tableActions}>
                      <button
                        className={`${styles.secondaryButton} ${styles.actionButtonSmall}`}
                        onClick={() => updateConsultation(request.id, 'APPROVED', advisorSelections[request.id])}
                        disabled={isSubmitting}
                      >
                        Approve
                      </button>
                      <button
                        className={`${styles.secondaryButton} ${styles.actionButtonSmall}`}
                        onClick={() => updateConsultation(request.id, 'SCHEDULED', advisorSelections[request.id])}
                        disabled={isSubmitting}
                      >
                        Schedule
                      </button>
                      <button
                        className={`${styles.secondaryButton} ${styles.actionButtonSmall} ${styles.actionButtonDanger}`}
                        onClick={() => updateConsultation(request.id, 'DECLINED', advisorSelections[request.id])}
                        disabled={isSubmitting}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {statusMessage && <p className={styles.emptyText}>{statusMessage}</p>}
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Advisors</h2>
            <form onSubmit={handleAdvisorCreate}>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="advisorName">Name</label>
                  <input
                    className={styles.input}
                    id="advisorName"
                    value={newAdvisorName}
                    onChange={(event) => setNewAdvisorName(event.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="advisorTitle">Title</label>
                  <input
                    className={styles.input}
                    id="advisorTitle"
                    value={newAdvisorTitle}
                    onChange={(event) => setNewAdvisorTitle(event.target.value)}
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="advisorSpecialty">Specialty</label>
                <input
                  className={styles.input}
                  id="advisorSpecialty"
                  value={newAdvisorSpecialty}
                  onChange={(event) => setNewAdvisorSpecialty(event.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="advisorStatus">Status</label>
                <select
                  className={styles.select}
                  id="advisorStatus"
                  value={newAdvisorStatus}
                  onChange={(event) => setNewAdvisorStatus(event.target.value as Advisor['status'])}
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="BUSY">BUSY</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
              <div className={styles.inlineActions}>
                <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Add Advisor'}
                </button>
              </div>
              {advisorMessage && <p className={styles.emptyText}>{advisorMessage}</p>}
            </form>

            <div className={styles.table}>
              <div className={`${styles.tableHeader} ${styles.tableHeaderActions}`}>
                <div>Advisor</div>
                <div>Specialty</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              {advisors.length === 0 ? (
                <div className={styles.tableRow}>
                  <div className={styles.tableEmpty}>No advisors yet.</div>
                </div>
              ) : (
                advisors.map((advisor) => (
                  <div key={advisor.id} className={`${styles.tableRow} ${styles.tableRowActions}`}>
                    <div>
                      {advisor.name}
                      <div className={styles.statMeta}>{advisor.title}</div>
                    </div>
                    <div>{advisor.specialty || '—'}</div>
                    <div>
                      <select
                        className={styles.select}
                        aria-label={`Advisor status for ${advisor.name}`}
                        value={advisor.status}
                        onChange={(event) => handleAdvisorStatusUpdate(advisor.id, event.target.value as Advisor['status'])}
                        disabled={isSubmitting}
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="BUSY">BUSY</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>
                    <div className={styles.tableActions}>
                      <span className={`${styles.badge} ${styles.badgeMuted}`}>Manage</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

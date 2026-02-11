'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import AdminNav from '@/components/AdminNav';
import styles from '../admin.module.css';

type Advisor = {
  id: string;
  userId: string;
  name: string;
  email: string | null;
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
    userId: string;
    name: string | null;
    email: string | null;
    advisorTitle: string | null;
    advisorStatus: 'AVAILABLE' | 'BUSY' | 'INACTIVE';
  } | null;
};

type AdvisorEdit = {
  title: string;
  specialty: string;
  status: Advisor['status'];
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
  const [advisorMessage, setAdvisorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [advisorSelections, setAdvisorSelections] = useState<Record<string, string>>({});
  const [advisorEdits, setAdvisorEdits] = useState<Record<string, AdvisorEdit>>({});

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

  useEffect(() => {
    const nextEdits: Record<string, AdvisorEdit> = {};
    advisors.forEach((advisor) => {
      nextEdits[advisor.id] = {
        title: advisor.title || '',
        specialty: advisor.specialty || '',
        status: advisor.status,
      };
    });
    setAdvisorEdits(nextEdits);
  }, [advisors]);

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
      await fetchConsultations();
    } else {
      const payload = await res.json().catch(() => ({}));
      setStatusMessage(payload.error || 'Unable to update consultation.');
    }

    setIsSubmitting(false);
  };

  const saveAdvisorProfile = async (advisorId: string) => {
    const edit = advisorEdits[advisorId];
    if (!edit) {
      return;
    }

    setIsSubmitting(true);
    setAdvisorMessage('');

    const res = await fetch('/api/admin/advisors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: advisorId,
        title: edit.title,
        specialty: edit.specialty,
        status: edit.status,
      }),
    });

    if (res.ok) {
      setAdvisorMessage('Advisor profile updated.');
      await fetchAdvisors();
    } else {
      const payload = await res.json().catch(() => ({}));
      setAdvisorMessage(payload.error || 'Unable to update advisor profile.');
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
            <p className={styles.subtitle}>Review consultation requests and manage agent advisor availability.</p>
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
                        <div className={styles.statMeta}>{request.advisor.advisorTitle || 'Investment Advisor'}</div>
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
            <h2 className={styles.sectionTitle}>Advisor Profiles (Agents)</h2>
            <p className={styles.emptyText}>Provision AGENT users in Access, then manage their consultation profile here.</p>
            {advisorMessage && <p className={styles.emptyText}>{advisorMessage}</p>}

            <div className={styles.table}>
              <div className={`${styles.tableHeader} ${styles.tableHeaderActionsWide}`}>
                <div>Advisor</div>
                <div>Title</div>
                <div>Specialty</div>
                <div>Status</div>
                <div>Contact</div>
                <div>Actions</div>
              </div>
              {advisors.length === 0 ? (
                <div className={styles.tableRow}>
                  <div className={styles.tableEmpty}>No active agents available yet.</div>
                </div>
              ) : (
                advisors.map((advisor) => (
                  <div key={advisor.id} className={`${styles.tableRow} ${styles.tableRowActionsWide}`}>
                    <div>
                      {advisor.name}
                      <div className={styles.statMeta}>{advisor.userId}</div>
                    </div>
                    <div>
                      <input
                        className={styles.input}
                        value={advisorEdits[advisor.id]?.title || ''}
                        onChange={(event) =>
                          setAdvisorEdits((prev) => ({
                            ...prev,
                            [advisor.id]: {
                              ...(prev[advisor.id] || { title: '', specialty: '', status: advisor.status }),
                              title: event.target.value,
                            },
                          }))
                        }
                        aria-label={`Advisor title for ${advisor.name}`}
                      />
                    </div>
                    <div>
                      <input
                        className={styles.input}
                        value={advisorEdits[advisor.id]?.specialty || ''}
                        onChange={(event) =>
                          setAdvisorEdits((prev) => ({
                            ...prev,
                            [advisor.id]: {
                              ...(prev[advisor.id] || { title: advisor.title, specialty: '', status: advisor.status }),
                              specialty: event.target.value,
                            },
                          }))
                        }
                        aria-label={`Advisor specialty for ${advisor.name}`}
                      />
                    </div>
                    <div>
                      <select
                        className={styles.select}
                        aria-label={`Advisor status for ${advisor.name}`}
                        value={advisorEdits[advisor.id]?.status || advisor.status}
                        onChange={(event) =>
                          setAdvisorEdits((prev) => ({
                            ...prev,
                            [advisor.id]: {
                              ...(prev[advisor.id] || { title: advisor.title, specialty: advisor.specialty || '', status: advisor.status }),
                              status: event.target.value as Advisor['status'],
                            },
                          }))
                        }
                        disabled={isSubmitting}
                      >
                        <option value="AVAILABLE">AVAILABLE</option>
                        <option value="BUSY">BUSY</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>
                    <div>{advisor.email || 'No email'}</div>
                    <div className={styles.tableActions}>
                      <button
                        className={`${styles.secondaryButton} ${styles.actionButtonSmall}`}
                        onClick={() => saveAdvisorProfile(advisor.id)}
                        disabled={isSubmitting}
                      >
                        Save
                      </button>
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

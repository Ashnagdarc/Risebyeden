
'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import AdminNav from '@/components/AdminNav';
import styles from '../admin.module.css';

export default function AdminAccess() {
  const team = [
    { name: 'Eden Ops', role: 'Admin', status: 'Enabled', lastActive: 'Today' },
    { name: 'Portfolio Team', role: 'Admin', status: 'Enabled', lastActive: 'Yesterday' },
    { name: 'Support Desk', role: 'Viewer', status: 'Limited', lastActive: '3 days ago' },
  ];

  const [formState, setFormState] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CLIENT',
  });
  const [statusMessage, setStatusMessage] = useState('');

  const handleChange = (field: string, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const handleProvision = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatusMessage('Provisioning user...');

    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formState),
    });

    if (response.ok) {
      setStatusMessage('User provisioned successfully.');
      setFormState({ name: '', email: '', password: '', role: 'CLIENT' });
    } else {
      setStatusMessage('Unable to provision user.');
    }
  };

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Admin</p>
            <h1 className={styles.pageTitle}>Access Control</h1>
            <p className={styles.subtitle}>Role-based access is enforced for admin workflows and client data.</p>
          </div>
          <button className={styles.primaryButton}>Invite Admin</button>
        </header>

        <AdminNav />

        <section className={styles.grid}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Admin Roles</h2>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <div>Team</div>
                <div>Role</div>
                <div>Status</div>
                <div>Last Active</div>
              </div>
              {team.map((member) => (
                <div key={member.name} className={styles.tableRow}>
                  <div>{member.name}</div>
                  <div>{member.role}</div>
                  <div className={member.status === 'Enabled' ? `${styles.badge} ${styles.badgeSuccess}` : `${styles.badge} ${styles.badgeMuted}`}>
                    {member.status}
                  </div>
                  <div>{member.lastActive}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Provision User</h2>
            <form onSubmit={handleProvision}>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="userName">Full Name</label>
                  <input
                    className={styles.input}
                    id="userName"
                    value={formState.name}
                    onChange={(event) => handleChange('name', event.target.value)}
                    placeholder="Client or admin name"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="userEmail">Email</label>
                  <input
                    className={styles.input}
                    id="userEmail"
                    type="email"
                    value={formState.email}
                    onChange={(event) => handleChange('email', event.target.value)}
                    placeholder="name@risebyeden.com"
                    required
                  />
                </div>
              </div>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="userRole">Role</label>
                  <select
                    className={styles.select}
                    id="userRole"
                    value={formState.role}
                    onChange={(event) => handleChange('role', event.target.value)}
                  >
                    <option value="CLIENT">Client</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="userPassword">Temporary Password</label>
                  <input
                    className={styles.input}
                    id="userPassword"
                    type="password"
                    value={formState.password}
                    onChange={(event) => handleChange('password', event.target.value)}
                    placeholder="Set a temporary password"
                    required
                  />
                </div>
              </div>
              <div className={styles.inlineActions}>
                <button className={styles.primaryButton} type="submit">Create User</button>
                <span className={`${styles.badge} ${styles.badgeMuted}`}>{statusMessage || 'No pending actions'}</span>
              </div>
            </form>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Policy Overview</h2>
            <div className={styles.field}>
              <label className={styles.label}>Access Rules</label>
              <div className={`${styles.badge} ${styles.badgeMuted}`}>Admin only: Presets, Pricing, Assignments</div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Client Data</label>
              <div className={`${styles.badge} ${styles.badgeMuted}`}>Restricted: Portfolio values and personal details</div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Audit Trail</label>
              <div className={`${styles.badge} ${styles.badgeMuted}`}>Append-only price history and assignment logs</div>
            </div>
            <div className={styles.inlineActions}>
              <button className={styles.secondaryButton}>Review Logs</button>
              <button className={styles.secondaryButton}>Export Access List</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

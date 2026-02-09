'use client';

import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import AdminNav from '@/components/AdminNav';
import styles from './admin.module.css';

export default function AdminOverview() {
  const interestRequests = [
    { id: 'IR-1042', client: 'Aisha Cole', property: 'The Obsidian Heights', status: 'Pending', date: 'Today' },
    { id: 'IR-1038', client: 'David Lin', property: 'Marina Bay Commercial', status: 'Scheduled', date: 'Yesterday' },
    { id: 'IR-1034', client: 'Nora Patel', property: 'Beachfront Paradise', status: 'Pending', date: '2 days ago' },
  ];

  const priceUpdates = [
    { id: 'PU-220', preset: 'Veridian Atrium', change: '+2.1%', date: 'Today' },
    { id: 'PU-219', preset: 'The Gilded Loft', change: '+1.4%', date: 'Yesterday' },
    { id: 'PU-218', preset: 'Meridian Towers', change: '+0.9%', date: '2 days ago' },
  ];

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Admin</p>
            <h1 className={styles.pageTitle}>Control Center</h1>
            <p className={styles.subtitle}>Manage presets, price history, and client portfolios from a single workspace.</p>
          </div>
          <Link className={styles.primaryButton} href="/admin/properties">
            Create Preset
          </Link>
        </header>

        <AdminNav />

        <section className={styles.statGrid}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Pending Interests</div>
            <div className={styles.statValue}>12</div>
            <div className={styles.statMeta}>4 scheduled today</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Active Presets</div>
            <div className={styles.statValue}>38</div>
            <div className={styles.statMeta}>3 inactive</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Price Updates</div>
            <div className={styles.statValue}>6</div>
            <div className={styles.statMeta}>Last 7 days</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Client Portfolios</div>
            <div className={styles.statValue}>84</div>
            <div className={styles.statMeta}>2 new this week</div>
          </div>
        </section>

        <section className={styles.grid}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Interest Requests</h2>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <div>Request</div>
                <div>Client</div>
                <div>Property</div>
                <div>Status</div>
              </div>
              {interestRequests.map((request) => (
                <div key={request.id} className={styles.tableRow}>
                  <div>{request.id}</div>
                  <div>{request.client}</div>
                  <div>{request.property}</div>
                  <div className={request.status === 'Scheduled' ? `${styles.badge} ${styles.badgeSuccess}` : `${styles.badge} ${styles.badgePending}`}>
                    {request.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Recent Price Updates</h2>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <div>Update</div>
                <div>Preset</div>
                <div>Change</div>
                <div>Date</div>
              </div>
              {priceUpdates.map((update) => (
                <div key={update.id} className={styles.tableRow}>
                  <div>{update.id}</div>
                  <div>{update.preset}</div>
                  <div>{update.change}</div>
                  <div>{update.date}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

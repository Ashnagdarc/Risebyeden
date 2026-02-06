'use client';

import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

export default function ProfilePage() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>User Profile</p>
            <h1 className={styles.pageTitle}>Personal Identity</h1>
            <p className={styles.subtitle}>Manage your profile, security, and portfolio visibility.</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.secondaryButton} onClick={() => router.push('/profile/security')}>
              Security
            </button>
            <button className={styles.primaryButton} onClick={() => router.push('/profile/edit')}>
              Edit Profile
            </button>
          </div>
        </header>

        <section className={styles.profileCard}>
          <div className={styles.avatar}>RB</div>
          <div className={styles.profileInfo}>
            <h2 className={styles.name}>Daniel Nonso</h2>
            <p className={styles.role}>Principal Investor · Rise by eden</p>
            <p className={styles.location}>Lagos, Nigeria</p>
          </div>
          <div className={styles.profileStats}>
            <div>
              <p className={styles.statLabel}>Total Assets</p>
              <p className={styles.statValue}>$12.8M</p>
            </div>
            <div>
              <p className={styles.statLabel}>Active Holdings</p>
              <p className={styles.statValue}>18</p>
            </div>
            <div>
              <p className={styles.statLabel}>Risk Tier</p>
              <p className={styles.statValue}>Balanced</p>
            </div>
          </div>
        </section>

        <section className={styles.grid}>
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Profile Overview</h3>
            <div className={styles.panelRow}>
              <span className={styles.panelLabel}>Email</span>
              <span className={styles.panelValue}>daniel.nonso48@gmail.com</span>
            </div>
            <div className={styles.panelRow}>
              <span className={styles.panelLabel}>Phone</span>
              <span className={styles.panelValue}>+234 803 221 9812</span>
            </div>
            <div className={styles.panelRow}>
              <span className={styles.panelLabel}>Portfolio Tier</span>
              <span className={styles.panelValue}>Institutional Prime</span>
            </div>
            <div className={styles.panelRow}>
              <span className={styles.panelLabel}>Member Since</span>
              <span className={styles.panelValue}>August 2022</span>
            </div>
            <div className={styles.panelRow}>
              <span className={styles.panelLabel}>Verification</span>
              <span className={styles.panelValue}>KYC Approved</span>
            </div>
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Recent Activity</h3>
            <div className={styles.activityItem}>
              <p className={styles.activityTitle}>Viewed Sunset Valley Estate</p>
              <p className={styles.activityMeta}>12 mins ago · Property Details</p>
            </div>
            <div className={styles.activityItem}>
              <p className={styles.activityTitle}>Updated risk preference to Balanced</p>
              <p className={styles.activityMeta}>2 days ago · Profile</p>
            </div>
            <div className={styles.activityItem}>
              <p className={styles.activityTitle}>Requested access to Tech Hub Office Complex</p>
              <p className={styles.activityMeta}>5 days ago · Acquisition</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

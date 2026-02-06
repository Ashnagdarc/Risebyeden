'use client';

import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

export default function SettingsPage() {
  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Settings</p>
            <h1 className={styles.pageTitle}>Control Center</h1>
            <p className={styles.subtitle}>Tune account security, notifications, and portfolio preferences.</p>
          </div>
          <button className={styles.primaryButton}>Save Changes</button>
        </header>

        <section className={styles.grid}>
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Account</h3>
            <div className={styles.row}>
              <div>
                <p className={styles.rowTitle}>Display Name</p>
                <p className={styles.rowSubtitle}>Rise by eden private investor profile.</p>
              </div>
              <span className={styles.rowValue}>Daniel Nonso</span>
            </div>
            <div className={styles.row}>
              <div>
                <p className={styles.rowTitle}>Email</p>
                <p className={styles.rowSubtitle}>Primary notifications channel.</p>
              </div>
              <span className={styles.rowValue}>daniel.nonso48@gmail.com</span>
            </div>
            <div className={styles.row}>
              <div>
                <p className={styles.rowTitle}>Account Tier</p>
                <p className={styles.rowSubtitle}>Institutional Prime access.</p>
              </div>
              <span className={styles.rowValue}>Prime</span>
            </div>
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Security</h3>
            <label className={styles.toggleRow}>
              <div>
                <p className={styles.rowTitle}>Two-Factor Authentication</p>
                <p className={styles.rowSubtitle}>Require verification on every login.</p>
              </div>
              <input type="checkbox" className={styles.toggle} defaultChecked />
            </label>
            <label className={styles.toggleRow}>
              <div>
                <p className={styles.rowTitle}>Device Approval</p>
                <p className={styles.rowSubtitle}>Approve new devices before access.</p>
              </div>
              <input type="checkbox" className={styles.toggle} defaultChecked />
            </label>
            <label className={styles.toggleRow}>
              <div>
                <p className={styles.rowTitle}>Weekly Security Reports</p>
                <p className={styles.rowSubtitle}>Receive system integrity summaries.</p>
              </div>
              <input type="checkbox" className={styles.toggle} />
            </label>
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Notifications</h3>
            <label className={styles.toggleRow}>
              <div>
                <p className={styles.rowTitle}>Portfolio Alerts</p>
                <p className={styles.rowSubtitle}>Real-time valuation changes.</p>
              </div>
              <input type="checkbox" className={styles.toggle} defaultChecked />
            </label>
            <label className={styles.toggleRow}>
              <div>
                <p className={styles.rowTitle}>Acquisition Opportunities</p>
                <p className={styles.rowSubtitle}>Invite-only asset releases.</p>
              </div>
              <input type="checkbox" className={styles.toggle} defaultChecked />
            </label>
            <label className={styles.toggleRow}>
              <div>
                <p className={styles.rowTitle}>Market Reports</p>
                <p className={styles.rowSubtitle}>Monthly research briefings.</p>
              </div>
              <input type="checkbox" className={styles.toggle} />
            </label>
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Preferences</h3>
            <div className={styles.row}>
              <div>
                <p className={styles.rowTitle}>Portfolio Strategy</p>
                <p className={styles.rowSubtitle}>Risk-adjusted profile.</p>
              </div>
              <span className={styles.rowValue}>Balanced</span>
            </div>
            <div className={styles.row}>
              <div>
                <p className={styles.rowTitle}>Default Region</p>
                <p className={styles.rowSubtitle}>Focus market for acquisitions.</p>
              </div>
              <span className={styles.rowValue}>West Africa</span>
            </div>
            <div className={styles.row}>
              <div>
                <p className={styles.rowTitle}>Data Sharing</p>
                <p className={styles.rowSubtitle}>Allow anonymized portfolio insights.</p>
              </div>
              <span className={styles.rowValue}>Limited</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

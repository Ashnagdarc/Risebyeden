'use client';

import Sidebar from '@/components/Sidebar';
import AdminNav from '@/components/AdminNav';
import styles from '../admin.module.css';

export default function PricingAdmin() {
  const updates = [
    { id: 'PU-220', preset: 'Veridian Atrium', price: '$5.1M', date: '2026-02-05', source: 'Internal Review' },
    { id: 'PU-219', preset: 'The Gilded Loft', price: '$3.6M', date: '2026-02-02', source: 'Market Index' },
    { id: 'PU-218', preset: 'Meridian Towers', price: '$8.4M', date: '2026-01-30', source: 'Internal Review' },
  ];

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Admin</p>
            <h1 className={styles.pageTitle}>Price History</h1>
            <p className={styles.subtitle}>Append-only price updates for each preset. Existing records remain immutable.</p>
          </div>
          <button className={styles.primaryButton}>Append Update</button>
        </header>

        <AdminNav />

        <section className={styles.grid}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Recent Updates</h2>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <div>Update</div>
                <div>Preset</div>
                <div>Price</div>
                <div>Date</div>
              </div>
              {updates.map((update) => (
                <div key={update.id} className={styles.tableRow}>
                  <div>{update.id}</div>
                  <div>{update.preset}</div>
                  <div>{update.price}</div>
                  <div>{update.date}</div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Append New Price</h2>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="preset">Preset</label>
              <select className={styles.select} id="preset">
                <option>The Obsidian Heights</option>
                <option>Veridian Atrium</option>
                <option>The Gilded Loft</option>
                <option>Aurora Commercial Plaza</option>
              </select>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="price">Price</label>
                <input className={styles.input} id="price" placeholder="$0.00" />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="date">Effective Date</label>
                <input className={styles.input} id="date" placeholder="YYYY-MM-DD" />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="source">Data Source</label>
              <input className={styles.input} id="source" placeholder="Internal Review" />
            </div>
            <div className={styles.inlineActions}>
              <button className={styles.primaryButton}>Append Entry</button>
              <span className={`${styles.badge} ${styles.badgeMuted}`}>Immutable Log</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

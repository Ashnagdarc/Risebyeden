'use client';

import Sidebar from '@/components/Sidebar';
import AdminNav from '@/components/AdminNav';
import styles from '../admin.module.css';

export default function ClientPortfolios() {
  const clients = [
    { id: 'CL-201', name: 'Aisha Cole', portfolio: '$8.4M', properties: 3, status: 'Active' },
    { id: 'CL-202', name: 'David Lin', portfolio: '$12.1M', properties: 5, status: 'Active' },
    { id: 'CL-203', name: 'Nora Patel', portfolio: '$4.7M', properties: 2, status: 'Review' },
  ];

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Admin</p>
            <h1 className={styles.pageTitle}>Client Portfolios</h1>
            <p className={styles.subtitle}>Assign properties to client accounts and track portfolio readiness.</p>
          </div>
          <button className={styles.primaryButton}>Assign Property</button>
        </header>

        <AdminNav />

        <section className={styles.grid}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Client List</h2>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <div>Client</div>
                <div>Portfolio</div>
                <div>Properties</div>
                <div>Status</div>
              </div>
              {clients.map((client) => (
                <div key={client.id} className={styles.tableRow}>
                  <div>
                    {client.name}
                    <div className={styles.statMeta}>{client.id}</div>
                  </div>
                  <div>{client.portfolio}</div>
                  <div>{client.properties}</div>
                  <div className={client.status === 'Active' ? `${styles.badge} ${styles.badgeSuccess}` : `${styles.badge} ${styles.badgePending}`}>
                    {client.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Assign Property</h2>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="client">Client</label>
              <select className={styles.select} id="client">
                <option>Aisha Cole</option>
                <option>David Lin</option>
                <option>Nora Patel</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="property">Property Preset</label>
              <select className={styles.select} id="property">
                <option>The Obsidian Heights</option>
                <option>Veridian Atrium</option>
                <option>The Gilded Loft</option>
                <option>Beachfront Paradise</option>
              </select>
            </div>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="quantity">Quantity</label>
                <input className={styles.input} id="quantity" placeholder="1" />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="purchase">Purchase Price</label>
                <input className={styles.input} id="purchase" placeholder="$0.00" />
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="notes">Notes</label>
              <textarea className={styles.textarea} id="notes" placeholder="Inspection date, closing details, or internal notes." />
            </div>
            <div className={styles.inlineActions}>
              <button className={styles.primaryButton}>Assign to Client</button>
              <button className={styles.secondaryButton}>Save Draft</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

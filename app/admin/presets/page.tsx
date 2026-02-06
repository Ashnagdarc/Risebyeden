'use client';

import Sidebar from '@/components/Sidebar';
import AdminNav from '@/components/AdminNav';
import styles from '../admin.module.css';

export default function PresetsAdmin() {
  const presets = [
    { id: 'PR-101', name: 'The Obsidian Heights', type: 'Mixed Use', beds: 4, status: 'Active', updated: 'Today' },
    { id: 'PR-102', name: 'Veridian Atrium', type: 'Residential', beds: 3, status: 'Active', updated: '2 days ago' },
    { id: 'PR-103', name: 'The Gilded Loft', type: 'Commercial', beds: 0, status: 'Active', updated: '1 week ago' },
    { id: 'PR-104', name: 'Aurora Commercial Plaza', type: 'Commercial', beds: 0, status: 'Inactive', updated: '3 weeks ago' },
  ];

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Admin</p>
            <h1 className={styles.pageTitle}>Property Presets</h1>
            <p className={styles.subtitle}>Create, update, and manage the preset catalogue available to clients.</p>
          </div>
          <button className={styles.primaryButton}>New Preset</button>
        </header>

        <AdminNav />

        <section className={styles.grid}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Catalogue</h2>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <div>Preset</div>
                <div>Type</div>
                <div>Bedrooms</div>
                <div>Status</div>
              </div>
              {presets.map((preset) => (
                <div key={preset.id} className={styles.tableRow}>
                  <div>
                    {preset.name}
                    <div className={styles.statMeta}>{preset.id} · Updated {preset.updated}</div>
                  </div>
                  <div>{preset.type}</div>
                  <div>{preset.beds || 'N/A'}</div>
                  <div className={preset.status === 'Active' ? `${styles.badge} ${styles.badgeSuccess}` : `${styles.badge} ${styles.badgeMuted}`}>
                    {preset.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Preset Draft</h2>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="name">Preset Name</label>
                <input className={styles.input} id="name" placeholder="Enter preset name" />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="type">Property Type</label>
                <select className={styles.select} id="type">
                  <option>Residential</option>
                  <option>Commercial</option>
                  <option>Mixed Use</option>
                  <option>Industrial</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="bedrooms">Bedrooms</label>
                <input className={styles.input} id="bedrooms" placeholder="0" />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="status">Status</label>
                <select className={styles.select} id="status">
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="gallery">Image Gallery</label>
              <input className={styles.input} id="gallery" placeholder="Upload curated images" />
            </div>
            <div className={styles.inlineActions}>
              <button className={styles.primaryButton}>Save Preset</button>
              <button className={styles.secondaryButton}>Deactivate</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

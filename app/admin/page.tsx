'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import AdminNav from '@/components/AdminNav';
import styles from './admin.module.css';

type OverviewStats = {
  pendingInterests: number;
  activePresets: number;
  priceUpdates: number;
  clientPortfolios: number;
};

type InterestItem = {
  id: string;
  status: string;
  createdAt: string;
  user: { userId: string; name: string | null } | null;
  property: { name: string } | null;
};

type PriceUpdateItem = {
  id: string;
  price: number;
  effectiveDate: string;
  source: string | null;
  property: { name: string } | null;
};

export default function AdminOverview() {
  const [stats, setStats] = useState<OverviewStats>({
    pendingInterests: 0,
    activePresets: 0,
    priceUpdates: 0,
    clientPortfolios: 0,
  });
  const [interestRequests, setInterestRequests] = useState<InterestItem[]>([]);
  const [priceUpdates, setPriceUpdates] = useState<PriceUpdateItem[]>([]);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
    []
  );

  const fetchOverview = useCallback(async () => {
    const res = await fetch('/api/admin/overview');
    if (res.ok) {
      const data = await res.json();
      setStats(data.stats);
      setInterestRequests(data.recentInterests || []);
      setPriceUpdates(data.recentPriceUpdates || []);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

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
            <div className={styles.statValue}>{stats.pendingInterests}</div>
            <div className={styles.statMeta}>Requests awaiting review</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Active Presets</div>
            <div className={styles.statValue}>{stats.activePresets}</div>
            <div className={styles.statMeta}>Available or reserved</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Price Updates</div>
            <div className={styles.statValue}>{stats.priceUpdates}</div>
            <div className={styles.statMeta}>Last 7 days</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Client Portfolios</div>
            <div className={styles.statValue}>{stats.clientPortfolios}</div>
            <div className={styles.statMeta}>Active client accounts</div>
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
              {interestRequests.length === 0 ? (
                <div className={styles.tableRow}>
                  <div className={styles.tableEmpty}>No interest requests yet.</div>
                </div>
              ) : (
                interestRequests.map((request) => (
                  <div key={request.id} className={styles.tableRow}>
                    <div className={styles.tableCell} data-label="Request">
                      {request.id.slice(0, 6).toUpperCase()}
                    </div>
                    <div className={styles.tableCell} data-label="Client">
                      {request.user?.name || request.user?.userId || '—'}
                    </div>
                    <div className={styles.tableCell} data-label="Property">
                      {request.property?.name || '—'}
                    </div>
                    <div className={styles.tableCell} data-label="Status">
                      <span className={request.status === 'SCHEDULED' || request.status === 'APPROVED' ? `${styles.badge} ${styles.badgeSuccess}` : `${styles.badge} ${styles.badgePending}`}>
                        {request.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Recent Price Updates</h2>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <div>Update</div>
                <div>Preset</div>
                <div>Price</div>
                <div>Date</div>
              </div>
              {priceUpdates.length === 0 ? (
                <div className={styles.tableRow}>
                  <div className={styles.tableEmpty}>No price updates logged yet.</div>
                </div>
              ) : (
                priceUpdates.map((update) => (
                  <div key={update.id} className={styles.tableRow}>
                    <div className={styles.tableCell} data-label="Update">
                      {update.id.slice(0, 6).toUpperCase()}
                    </div>
                    <div className={styles.tableCell} data-label="Preset">
                      {update.property?.name || '—'}
                    </div>
                    <div className={styles.tableCell} data-label="Price">
                      {currencyFormatter.format(Number(update.price))}
                    </div>
                    <div className={styles.tableCell} data-label="Date">
                      {new Date(update.effectiveDate).toLocaleDateString()}
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

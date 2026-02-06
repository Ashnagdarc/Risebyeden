'use client';

import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import BarChart from '@/components/BarChart';
import styles from './page.module.css';

export default function Performance() {
  const monthlyData = [
    { month: 'Jan', revenue: 85000, expenses: 42000 },
    { month: 'Feb', revenue: 92000, expenses: 45000 },
    { month: 'Mar', revenue: 88000, expenses: 43000 },
    { month: 'Apr', revenue: 105000, expenses: 48000 },
    { month: 'May', revenue: 98000, expenses: 46000 },
    { month: 'Jun', revenue: 112000, expenses: 50000 },
    { month: 'Jul', revenue: 118000, expenses: 52000 },
    { month: 'Aug', revenue: 115000, expenses: 51000 },
    { month: 'Sep', revenue: 125000, expenses: 54000 },
    { month: 'Oct', revenue: 132000, expenses: 56000 },
    { month: 'Nov', revenue: 128000, expenses: 55000 },
    { month: 'Dec', revenue: 145000, expenses: 58000 },
  ];

  const propertyPerformance = [
    { name: 'The Obsidian Heights', occupancy: 98, revenue: 45000 },
    { name: 'Veridian Atrium', occupancy: 100, revenue: 52000 },
    { name: 'The Gilded Loft', occupancy: 95, revenue: 38000 },
    { name: 'Azure Residences', occupancy: 97, revenue: 41000 },
    { name: 'Crimson Tower', occupancy: 92, revenue: 35000 },
  ];

  const totalRevenue = monthlyData.reduce((sum, item) => sum + item.revenue, 0);
  const totalExpenses = monthlyData.reduce((sum, item) => sum + item.expenses, 0);
  const netIncome = totalRevenue - totalExpenses;
  const avgOccupancy = (propertyPerformance.reduce((sum, item) => sum + item.occupancy, 0) / propertyPerformance.length).toFixed(1);

  return (
    <div className={styles.container}>
      <Sidebar />
      
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <Link href="/" className={styles.backLink}>
              ← Back to Dashboard
            </Link>
            <p className={styles.kicker}>Performance</p>
            <h1 className={styles.pageTitle}>Performance Overview</h1>
            <p className={styles.subtitle}>Track revenue, expenses, and property performance metrics</p>
          </div>
        </header>

        <div className={styles.grid}>
          {/* Key Metrics */}
          <div className={styles.metricsRow}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Total Revenue (YTD)</span>
              <div className={styles.metricValue}>
                ${(totalRevenue / 1000000).toFixed(2)}M
              </div>
              <div className={styles.metricChange}>+18.5% vs last year</div>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Total Expenses (YTD)</span>
              <div className={styles.metricValue}>
                ${(totalExpenses / 1000000).toFixed(2)}M
              </div>
              <div className={styles.metricChange}>+12.3% vs last year</div>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Net Income (YTD)</span>
              <div className={`${styles.metricValue} ${styles.metricValuePositive}`}>
                ${(netIncome / 1000000).toFixed(2)}M
              </div>
              <div className={styles.metricChange}>+24.7% vs last year</div>
            </div>

            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Avg Occupancy</span>
              <div className={styles.metricValue}>
                {avgOccupancy}%
              </div>
              <div className={styles.metricChange}>+2.1% vs last year</div>
            </div>
          </div>

          {/* Revenue vs Expenses Chart */}
          <div className={styles.chartSection}>
            <h2 className={styles.sectionTitle}>Monthly Revenue vs Expenses</h2>
            <BarChart data={monthlyData} />
          </div>

          {/* Property Performance Table */}
          <div className={styles.tableSection}>
            <h2 className={styles.sectionTitle}>Property Performance</h2>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <div>Property</div>
                <div>Occupancy Rate</div>
                <div>Monthly Revenue</div>
                <div>Status</div>
              </div>
              {propertyPerformance.map((property, index) => (
                <div key={index} className={styles.tableRow}>
                  <div className={styles.propertyName}>
                    <div className={styles.propertyIcon}></div>
                    {property.name}
                  </div>
                  <div className={styles.occupancy}>
                    <div className={styles.occupancyBar}>
                      <div 
                        className={styles.occupancyFill}
                        data-occupancy={property.occupancy}
                      ></div>
                    </div>
                    <span>{property.occupancy}%</span>
                  </div>
                  <div className={styles.revenue}>
                    ${property.revenue.toLocaleString()}
                  </div>
                  <div className={styles.status}>
                    <span className={property.occupancy >= 95 ? styles.statusGood : styles.statusWarning}>
                      {property.occupancy >= 95 ? 'Excellent' : 'Good'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className={styles.quickStats}>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <div className={styles.statContent}>
                <span className={styles.statLabel}>Best Month</span>
                <span className={styles.statValue}>December</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
              </div>
              <div className={styles.statContent}>
                <span className={styles.statLabel}>Properties Acquired</span>
                <span className={styles.statValue}>3 this year</span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconGold}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c5a368" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <div className={styles.statContent}>
                <span className={styles.statLabel}>Avg Days Listed</span>
                <span className={styles.statValue}>24 days</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

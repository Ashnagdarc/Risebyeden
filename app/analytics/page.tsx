'use client';

import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import PieChart from '@/components/PieChart';
import styles from './page.module.css';

export default function Analytics() {
  const portfolioData = [
    { label: 'Residential', value: 45, color: '#4ade80', className: styles.legendResidential },
    { label: 'Commercial', value: 30, color: '#60a5fa', className: styles.legendCommercial },
    { label: 'Mixed Use', value: 20, color: '#c5a368', className: styles.legendMixedUse },
    { label: 'Industrial', value: 5, color: '#f87171', className: styles.legendIndustrial },
  ];

  const performanceMetrics = [
    { label: 'YoY Growth', value: '+14.2%', trend: 'up' },
    { label: 'Avg ROI', value: '12.8%', trend: 'up' },
    { label: 'Properties', value: '24', trend: 'neutral' },
    { label: 'Avg Hold', value: '4.2yr', trend: 'neutral' },
  ];

  const topPerformers = [
    { name: 'The Obsidian Heights', location: 'Tribeca, NY', appreciation: '+22.4%', roi: '15.2%' },
    { name: 'Veridian Atrium', location: 'Mayfair, London', appreciation: '+11.8%', roi: '10.3%' },
    { name: 'The Gilded Loft', location: 'Shinjuku, Tokyo', appreciation: '+9.1%', roi: '8.7%' },
  ];

  return (
    <div className={styles.container}>
      <Sidebar />
      
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <Link href="/" className={styles.backLink}>
              ← Back to Dashboard
            </Link>
            <h1 className={styles.pageTitle}>Portfolio Analytics</h1>
            <p className={styles.subtitle}>Comprehensive analysis of your investment performance</p>
          </div>
        </header>

        <div className={styles.grid}>
          {/* Performance Metrics */}
          <div className={styles.metricsRow}>
            {performanceMetrics.map((metric, index) => (
              <div key={index} className={styles.metricCard}>
                <span className={styles.metricLabel}>{metric.label}</span>
                <div className={styles.metricValue}>
                  {metric.value}
                  {metric.trend === 'up' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Portfolio Distribution */}
          <div className={styles.chartSection}>
            <h2 className={styles.sectionTitle}>Asset Distribution by Type</h2>
            <div className={styles.chartContainer}>
              <PieChart data={portfolioData} />
              <div className={styles.legend}>
                {portfolioData.map((item, index) => (
                  <div key={index} className={styles.legendItem}>
                    <div className={`${styles.legendColor} ${item.className}`}></div>
                    <span className={styles.legendLabel}>{item.label}</span>
                    <span className={styles.legendValue}>{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className={styles.performersSection}>
            <h2 className={styles.sectionTitle}>Top Performing Assets</h2>
            <div className={styles.performersList}>
              {topPerformers.map((property, index) => (
                <div key={index} className={styles.performerCard}>
                  <div className={styles.performerRank}>{index + 1}</div>
                  <div className={styles.performerInfo}>
                    <h3>{property.name}</h3>
                    <p>{property.location}</p>
                  </div>
                  <div className={styles.performerMetrics}>
                    <div className={styles.performerMetric}>
                      <span className={styles.performerMetricLabel}>Appreciation</span>
                      <span className={styles.performerMetricValue}>{property.appreciation}</span>
                    </div>
                    <div className={styles.performerMetric}>
                      <span className={styles.performerMetricLabel}>ROI</span>
                      <span className={styles.performerMetricValue}>{property.roi}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Market Insights */}
          <div className={styles.insightsSection}>
            <h2 className={styles.sectionTitle}>Market Insights</h2>
            <div className={styles.insightsList}>
              <div className={styles.insightCard}>
                <div className={styles.insightIcon}>📈</div>
                <div className={styles.insightContent}>
                  <h3>Strong Performance</h3>
                  <p>Your portfolio outperformed the market average by 6.3% this quarter.</p>
                </div>
              </div>
              <div className={styles.insightCard}>
                <div className={styles.insightIcon}>🎯</div>
                <div className={styles.insightContent}>
                  <h3>Diversification Score</h3>
                  <p>Portfolio shows excellent diversification across property types and locations.</p>
                </div>
              </div>
              <div className={styles.insightCard}>
                <div className={styles.insightIcon}>💡</div>
                <div className={styles.insightContent}>
                  <h3>Opportunity Alert</h3>
                  <p>Consider expanding in emerging markets showing 18% growth potential.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

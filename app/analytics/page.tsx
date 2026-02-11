"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import PieChart from '@/components/PieChart';
import styles from './page.module.css';

type Asset = {
  id: string;
  name: string;
  location: string;
  city: string;
  state: string;
  type: string;
  appreciation: number;
  capRate: number;
  valuation: number;
  occupancy: number;
};

type PortfolioStats = {
  totalValue: number;
  avgOccupancy: number;
  avgCapRate: number;
  avgAppreciation: number;
};

export default function Analytics() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<PortfolioStats>({
    totalValue: 0,
    avgOccupancy: 0,
    avgCapRate: 0,
    avgAppreciation: 0,
  });

  useEffect(() => {
    let isMounted = true;

    fetch('/api/client/portfolio')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch portfolio');
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setAssets(data.assets || []);
        setStats({
          totalValue: data.stats?.totalValue || 0,
          avgOccupancy: data.stats?.avgOccupancy || 0,
          avgCapRate: data.stats?.avgCapRate || 0,
          avgAppreciation: data.stats?.avgAppreciation || 0,
        });
      })
      .catch(() => {
        if (isMounted) {
          setAssets([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const totalValue = stats.totalValue || 0;

  const typeTotals = useMemo(() => {
    return assets.reduce((acc, asset) => {
      const key = asset.type || 'Unclassified';
      acc[key] = (acc[key] || 0) + asset.valuation;
      return acc;
    }, {} as Record<string, number>);
  }, [assets]);

  const portfolioData = useMemo(() => {
    const entries = Object.entries(typeTotals);
    if (entries.length === 0) {
      return [] as { label: string; value: number; color: string; className: string }[];
    }

    const palette = [
      { color: '#4ade80', className: styles.legendResidential },
      { color: '#60a5fa', className: styles.legendCommercial },
      { color: '#c5a368', className: styles.legendMixedUse },
      { color: '#f87171', className: styles.legendIndustrial },
    ];

    return entries.map(([label, value], index) => {
      const share = totalValue ? (value / totalValue) * 100 : 0;
      const paletteEntry = palette[index % palette.length];
      return {
        label,
        value: Number(share.toFixed(1)),
        color: paletteEntry.color,
        className: paletteEntry.className,
      };
    });
  }, [totalValue, typeTotals]);

  const performanceMetrics = [
    {
      label: 'Avg Appreciation',
      value: `${stats.avgAppreciation >= 0 ? '+' : ''}${stats.avgAppreciation.toFixed(1)}%`,
      trend: stats.avgAppreciation >= 0 ? 'up' : 'neutral',
    },
    {
      label: 'Avg Cap Rate',
      value: `${stats.avgCapRate.toFixed(1)}%`,
      trend: stats.avgCapRate >= 0 ? 'up' : 'neutral',
    },
    { label: 'Properties', value: `${assets.length}`, trend: 'neutral' },
    { label: 'Avg Occupancy', value: `${stats.avgOccupancy.toFixed(1)}%`, trend: 'neutral' },
  ];

  const topPerformers = useMemo(() => {
    return [...assets]
      .sort((a, b) => (b.appreciation || 0) - (a.appreciation || 0))
      .slice(0, 3)
      .map((asset) => ({
        name: asset.name,
        location: [asset.city, asset.state].filter(Boolean).join(', ') || asset.location || '—',
        appreciation: `${asset.appreciation >= 0 ? '+' : ''}${asset.appreciation.toFixed(1)}%`,
        roi: `${asset.capRate.toFixed(1)}%`,
      }));
  }, [assets]);

  const insights = useMemo(() => {
    const diversification = Object.keys(typeTotals).length;
    const occupancy = stats.avgOccupancy;
    const appreciation = stats.avgAppreciation;
    return [
      {
        title: 'Occupancy Health',
        body:
          occupancy >= 95
            ? 'Occupancy remains strong across your holdings.'
            : 'Occupancy is below target. Review underperforming assets.',
      },
      {
        title: 'Diversification',
        body:
          diversification >= 3
            ? 'Your portfolio is well diversified by property type.'
            : 'Consider adding more property types to reduce concentration.',
      },
      {
        title: 'Appreciation Trend',
        body:
          appreciation >= 5
            ? 'Portfolio appreciation is tracking above target.'
            : 'Appreciation is muted. Monitor market conditions closely.',
      },
    ];
  }, [stats.avgAppreciation, stats.avgOccupancy, typeTotals]);

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
                {portfolioData.length === 0 && (
                  <div className={styles.legendItem}>No assets available.</div>
                )}
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
              {topPerformers.length === 0 && (
                <div className={`${styles.performerCard} ${styles.performerCardEmpty}`}>No performance data available.</div>
              )}
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
              {insights.map((insight, index) => (
                <div key={insight.title} className={styles.insightCard}>
                  <div className={styles.insightIcon}>
                    {index === 0 && (
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                      </svg>
                    )}
                    {index === 1 && (
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="6"></circle>
                        <circle cx="12" cy="12" r="2"></circle>
                      </svg>
                    )}
                    {index === 2 && (
                      <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="2" x2="12" y2="6"></line>
                        <line x1="12" y1="18" x2="12" y2="22"></line>
                        <circle cx="12" cy="12" r="4"></circle>
                        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                        <line x1="2" y1="12" x2="6" y2="12"></line>
                        <line x1="18" y1="12" x2="22" y2="12"></line>
                        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                      </svg>
                    )}
                  </div>
                  <div className={styles.insightContent}>
                    <h3>{insight.title}</h3>
                    <p>{insight.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

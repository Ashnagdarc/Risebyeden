import Link from 'next/link';
import TrendSparkline from '@/components/TrendSparkline';
import styles from './Header.module.css';

type TrendPoint = {
  label: string;
  value: number;
};

type HeaderProps = {
  totalValue: number;
  deltaPercent: number;
  userName: string;
  totalUnits: number;
  activeGoals: number;
  trendPoints: TrendPoint[];
};

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${value.toLocaleString()}`;
};

const formatCompactCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }

  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }

  return `$${Math.round(value).toLocaleString()}`;
};

export default function Header({ totalValue, deltaPercent, userName, totalUnits, activeGoals, trendPoints }: HeaderProps) {
  const deltaLabel = `${deltaPercent >= 0 ? '+' : ''}${deltaPercent.toFixed(1)}%`;
  const trendStartLabel = trendPoints[0]?.label || 'Start';
  const trendEndLabel = trendPoints[trendPoints.length - 1]?.label || 'Now';
  const trendStartValue = trendPoints[0]?.value || 0;
  const trendEndValue = trendPoints[trendPoints.length - 1]?.value || 0;

  return (
    <header className={styles.header}>
      <div className={styles.heroTop}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Investor Desk</span>
          <h1 className={styles.welcomeTitle}>Welcome back, {userName}</h1>
          <p className={styles.heroSubtitle}>Track capital deployment, portfolio growth, and your next move from one operating view.</p>

          <div className={styles.segmentedNav}>
            <Link href="/" className={`${styles.segmentLink} ${styles.segmentLinkActive}`}>Overview</Link>
            <Link href="/analytics" className={styles.segmentLink}>Analytics</Link>
            <Link href="/assets" className={styles.segmentLink}>Assets</Link>
          </div>
        </div>

        <div className={styles.actionCluster}>
          <Link href="/settings" className={styles.secondaryButton}>Portfolio Settings</Link>
          <Link href="/acquire" className={styles.primaryButton}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Acquire Property
          </Link>
        </div>
      </div>

      <div className={styles.heroBody}>
        <article className={styles.unifiedSlab}>
          <div className={styles.slabMetrics}>
            <div className={styles.mainMetric}>
              <span className={styles.summaryLabel}>Total Managed Assets</span>
              <div className={styles.summaryValueRow}>
                <h2 className={styles.summaryValue}>{formatCurrency(totalValue)}</h2>
                <span className={styles.delta}>{deltaLabel}</span>
              </div>
            </div>

            <div className={styles.subMetrics}>
              <div className={styles.subMetricItem}>
                <span className={styles.summaryLabel}>Portfolio Units</span>
                <p className={styles.summaryValueCompact}>{totalUnits}</p>
              </div>
              <div className={styles.subMetricItem}>
                <span className={styles.summaryLabel}>Active Goals</span>
                <p className={styles.summaryValueCompact}>{activeGoals}</p>
              </div>
            </div>
          </div>

          <div className={styles.slabChart}>
            <div className={styles.chartHeader}>
              <div>
                <span className={styles.summaryLabel}>6-Month Build Curve</span>
                <p className={styles.chartTitle}>Capital deployment trend</p>
              </div>
              <div className={styles.chartMeta}>
                <strong>{formatCompactCurrency(trendEndValue)}</strong>
                <span>Current run-rate</span>
              </div>
            </div>

            <div className={styles.sparklineWrap}>
              <TrendSparkline
                data={trendPoints}
                ariaLabel="Portfolio build curve for the last six months"
                valueFormat="compactUsd"
              />
            </div>
          </div>
        </article>
      </div>
    </header>
  );
}

import React from 'react';
import styles from './OverviewRow.module.css';

interface OverviewMetric {
  label: string;
  value: string;
  unit: string;
  trendText: string;
  isPositive?: boolean;
}

interface OverviewRowProps {
  metrics: OverviewMetric[];
}

export default function OverviewRow({ metrics }: OverviewRowProps) {
  return (
    <div className={styles.overviewRow}>
      {metrics.map((metric, idx) => (
        <article key={idx} className={styles.overviewCard}>
          <p className={styles.overviewLabel}>{metric.label}</p>
          <h3 className={`${styles.overviewValue} ${metric.isPositive === true ? styles.positive : metric.isPositive === false ? styles.negative : ''}`}>
             {metric.value}<span className={styles.overviewUnit}>{metric.unit}</span>
          </h3>
          <p className={styles.overviewTrend}>{metric.trendText}</p>
        </article>
      ))}
    </div>
  );
}

import React from 'react';
import Link from 'next/link';
import PieChart from '@/components/PieChart';
import { Card, CardHeader } from '@/components/ui/Card';
import styles from './AnalyticsWidget.module.css';

interface AllocationItem {
  label: string;
  rawValue: number;
  value: number;
  color: string;
  swatchClass: string;
}

interface PortfolioAllocationWidgetProps {
  data: AllocationItem[];
}

export default function PortfolioAllocationWidget({ data }: PortfolioAllocationWidgetProps) {
  return (
    <Card className={styles.allocationPanel}>
      <CardHeader title="Portfolio Allocation" actionHref="/analytics" actionLabel="Open Analytics">
         <p className={styles.panelSubtitle}>See how your capital is distributed across asset classes.</p>
      </CardHeader>

      <div className={styles.allocationContent}>
        <div className={styles.allocationChartWrap}>
          {data.length === 0 ? (
            <div className={styles.chartEmpty}>Acquire your first property to unlock portfolio distribution.</div>
          ) : (
            <PieChart data={data.map(({ label, value, color }) => ({ label, value, color }))} />
          )}
        </div>

        <div className={styles.allocationLegend}>
          {data.length === 0 && <p className={styles.legendEmpty}>No allocation mix yet.</p>}
          {data.map((item) => (
            <div key={item.label} className={styles.legendItem}>
              <span className={`${styles.legendSwatch} ${item.swatchClass}`}></span>
              <div className={styles.legendText}>
                <span className={styles.legendLabel}>{item.label}</span>
                <span className={styles.legendValue}>{item.value.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

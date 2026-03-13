import React from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import styles from './AnalyticsWidget.module.css';

interface SignalCard {
  id: string;
  title: string;
  value: string;
  detail: string;
}

interface PerformanceBar {
  label: string;
  value: number;
  displayValue: string;
}

interface PortfolioSignalsWidgetProps {
  signals: SignalCard[];
  performanceBars: PerformanceBar[];
}

export default function PortfolioSignalsWidget({ signals, performanceBars }: PortfolioSignalsWidgetProps) {
  return (
    <Card className={styles.signalPanel}>
      <CardHeader title="Portfolio Signals">
        <p className={styles.panelSubtitle}>A compact operating view of health, yield, and performance.</p>
      </CardHeader>

      <div className={styles.signalGrid}>
        {signals.map((card) => (
          <article key={card.id} className={styles.signalCard}>
            <div className={styles.signalIcon}>
              {card.id === 'allocation' && (
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a9 9 0 1 0 9 9"></path>
                  <path d="M12 3v9h9"></path>
                </svg>
              )}
              {card.id === 'top-asset' && (
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l7.1-1.01L12 2z"></path>
                </svg>
              )}
              {card.id === 'focus' && (
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="8"></circle>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
              {card.id === 'delta' && (
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 14 9 9 13 13 20 6"></polyline>
                  <polyline points="20 10 20 6 16 6"></polyline>
                </svg>
              )}
            </div>
            <div className={styles.signalCardBody}>
              <p className={styles.signalLabel}>{card.title}</p>
              <p className={styles.signalValue}>{card.value}</p>
              <p className={styles.signalDetail}>{card.detail}</p>
            </div>
          </article>
        ))}
      </div>

      <div className={styles.performanceBars}>
        {performanceBars.map((bar) => (
          <div key={bar.label} className={styles.performanceBarRow}>
             <div className={styles.performanceBarMeta}>
                <span>{bar.label}</span>
                <span>{bar.displayValue}</span>
             </div>
             <progress className={styles.performanceProgress} value={bar.value} max={100}></progress>
          </div>
        ))}
      </div>
    </Card>
  );
}

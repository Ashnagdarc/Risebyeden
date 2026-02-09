import Link from 'next/link';
import styles from './Header.module.css';

type HeaderProps = {
  totalValue: number;
  deltaPercent: number;
};

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  return `$${value.toLocaleString()}`;
};

export default function Header({ totalValue, deltaPercent }: HeaderProps) {
  const deltaLabel = `${deltaPercent >= 0 ? '+' : ''}${deltaPercent.toFixed(1)}%`;

  return (
    <header className={styles.header}>
      <div>
        <span className={styles.portfolioTotal}>Total Managed Assets</span>
        <h1 className={styles.portfolioValue}>
          {formatCurrency(totalValue)}
          <span className={styles.delta}>{deltaLabel}</span>
        </h1>
      </div>
      <Link href="/acquire" className={styles.glassButton}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Acquire Property
      </Link>
    </header>
  );
}

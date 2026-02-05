import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div>
        <span className={styles.portfolioTotal}>Total Managed Assets</span>
        <h1 className={styles.portfolioValue}>
          $12,842,000
          <span className={styles.delta}>+14.2%</span>
        </h1>
      </div>
      <button className={styles.glassButton}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        Acquire Property
      </button>
    </header>
  );
}

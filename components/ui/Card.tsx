import React from 'react';
import Link from 'next/link';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'elevated';
  className?: string;
  style?: React.CSSProperties;
}

export function Card({ children, variant = 'default', className = '', style }: CardProps) {
  const variantClass = variant === 'glass' ? styles.glass : variant === 'elevated' ? styles.elevated : '';
  
  return (
    <section className={`${styles.card} ${variantClass} ${className}`} style={style}>
      {children}
    </section>
  );
}

interface CardHeaderProps {
  title: string;
  actionHref?: string;
  actionLabel?: string;
  children?: React.ReactNode;
}

export function CardHeader({ title, actionHref, actionLabel, children }: CardHeaderProps) {
  return (
    <div className={styles.cardHeader}>
      <h2 className={styles.title}>{title}</h2>
      {actionHref && actionLabel ? (
        <Link href={actionHref} className={styles.action}>
          {actionLabel} &rarr;
        </Link>
      ) : (
        children
      )}
    </div>
  );
}

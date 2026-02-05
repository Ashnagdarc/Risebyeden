'use client';

import { useRef, MouseEvent } from 'react';
import styles from './StatSlab.module.css';

interface StatSlabProps {
  label: string;
  value: string;
  children?: React.ReactNode;
  delay?: number;
}

export default function StatSlab({ label, value, children, delay = 0 }: StatSlabProps) {
  const slabRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const slab = slabRef.current;
    if (!slab) return;

    const rect = slab.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 20;
    const rotateY = (centerX - x) / 20;
    
    slab.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.01)`;
  };

  const handleMouseLeave = () => {
    const slab = slabRef.current;
    if (!slab) return;
    slab.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)`;
  };

  return (
    <div 
      ref={slabRef}
      className={styles.statSlab}
      style={{ animationDelay: `${delay}s` }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <span className={styles.label}>{label}</span>
      <div className={styles.value}>{value}</div>
      {children}
    </div>
  );
}

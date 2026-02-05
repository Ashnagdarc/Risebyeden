'use client';

import { useRouter } from 'next/navigation';
import styles from './PropertyCard.module.css';

interface Property {
  id: number;
  name: string;
  price: number;
  location: string;
  state: string;
  image: string;
  appreciation: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  type: string;
}

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const router = useRouter();

  const formatPrice = (price: number) => {
    return `$${(price / 1000000).toFixed(1)}M`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const handleViewDetails = () => {
    router.push(`/acquire/${property.id}`);
  };

  return (
    <div className={styles.card}>
      <div className={styles.headerSection}>
        <div className={styles.titleRow}>
          <h3 className={styles.propertyName}>{property.name}</h3>
          <div className={styles.appreciationTag}>
            +{property.appreciation}%
          </div>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.type}>{property.type}</span>
          <span className={styles.location}>{property.location}, {property.state}</span>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Price</div>
          <div className={styles.statValue}>{formatPrice(property.price)}</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statLabel}>Square Feet</div>
          <div className={styles.statValue}>{formatNumber(property.squareFeet)}</div>
        </div>
        {property.bedrooms > 0 && (
          <div className={styles.stat}>
            <div className={styles.statLabel}>Bedrooms</div>
            <div className={styles.statValue}>{property.bedrooms}</div>
          </div>
        )}
        {property.bathrooms > 0 && (
          <div className={styles.stat}>
            <div className={styles.statLabel}>Bathrooms</div>
            <div className={styles.statValue}>{property.bathrooms}</div>
          </div>
        )}
      </div>

      <button className={styles.investButton} onClick={handleViewDetails}>
        View Details
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  );
}

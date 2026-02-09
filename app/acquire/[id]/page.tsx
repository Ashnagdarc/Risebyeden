/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

type PropertyDetail = {
  id: string;
  name: string;
  basePrice: number | null;
  location: string | null;
  city: string | null;
  state: string | null;
  propertyType: string | null;
  appreciation: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  yearBuilt: number | null;
  capRate: number | null;
  description: string | null;
  documents: { url: string }[];
};

export default function PropertyDetails() {
  const params = useParams();
  const propertyId = params.id as string | undefined;
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!propertyId) {
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/client/properties/${propertyId}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch property');
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setProperty(data.property || null);
        }
      })
      .catch(() => {
        if (isMounted) {
          setProperty(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [propertyId]);

  const imageUrl = useMemo(() => {
    return property?.documents?.[0]?.url || '';
  }, [property]);

  if (!property && !isLoading) {
    return (
      <div className={styles.container}>
        <Sidebar />
        <main className={styles.main}>
          <header className={styles.header}>
            <Link href="/acquire" className={styles.backLink}>
              ← Back to Properties
            </Link>
            <h1 className={styles.pageTitle}>Property Not Found</h1>
          </header>
        </main>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return `$${(price / 1000000).toFixed(1)}M`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const handleInvest = async () => {
    if (!property || isSubmitting || isSubmitted) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/client/interest-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId: property.id }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit interest');
      }

      setIsSubmitted(true);
    } catch {
      alert('Unable to submit interest at the moment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <Sidebar />
      
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <Link href="/acquire" className={styles.backLink}>
              ← Back to Properties
            </Link>
            <div className={styles.titleRow}>
              <h1 className={styles.pageTitle}>{property?.name || 'Loading...'}</h1>
              <div className={styles.appreciationBadge}>
                +{property?.appreciation ?? 0}% Appreciation
              </div>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.type}>{property?.propertyType || 'Residential'}</span>
              <span className={styles.location}>
                {property?.location || property?.city || 'Location'}{property?.state ? `, ${property.state}` : ''}
              </span>
            </div>
          </div>
        </header>

        <div className={styles.imageSection}>
          <div className={styles.imageContainer}>
            {imageUrl ? (
              <img src={imageUrl} alt={property?.name || 'Property'} className={styles.propertyImage} />
            ) : null}
            <div className={styles.imageOverlay}>
              <div className={styles.imageBadge}>Premium Listing</div>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.mainSection}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Property Overview</h2>
              <p className={styles.description}>{property?.description || 'No description available yet.'}</p>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Financial Details</h2>
              <div className={styles.statsGrid}>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>Purchase Price</div>
                  <div className={styles.statValue}>{formatPrice(property?.basePrice || 0)}</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>Cap Rate</div>
                  <div className={styles.statValue}>{property?.capRate ?? 0}%</div>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Property Specifications</h2>
              <div className={styles.statsGrid}>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>Square Feet</div>
                  <div className={styles.statValue}>{formatNumber(property?.squareFeet || 0)}</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>Year Built</div>
                  <div className={styles.statValue}>{property?.yearBuilt ?? 'N/A'}</div>
                </div>
                {property?.bedrooms && property.bedrooms > 0 && (
                  <div className={styles.stat}>
                    <div className={styles.statLabel}>Bedrooms</div>
                    <div className={styles.statValue}>{property.bedrooms}</div>
                  </div>
                )}
                {property?.bathrooms && property.bathrooms > 0 && (
                  <div className={styles.stat}>
                    <div className={styles.statLabel}>Bathrooms</div>
                    <div className={styles.statValue}>{property.bathrooms}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.investmentCard}>
              <div className={styles.priceDisplay}>
                <div className={styles.priceLabel}>Investment Amount</div>
                <div className={styles.priceAmount}>{formatPrice(property?.basePrice || 0)}</div>
              </div>

              <div className={styles.keyMetrics}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Projected Return</span>
                  <span className={styles.metricValue}>+{property?.appreciation ?? 0}%</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Cap Rate</span>
                  <span className={styles.metricValue}>{property?.capRate ?? 0}%</span>
                </div>
              </div>

              <button
                className={styles.investButton}
                onClick={handleInvest}
                disabled={isSubmitting || isSubmitted}
              >
                {isSubmitted ? 'Interest Sent' : isSubmitting ? 'Sending...' : 'Express Interest'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>

              <div className={styles.disclaimer}>
                This is a premium investment opportunity. Our team will review your interest and contact you with next steps.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import PropertyCard from '@/components/PropertyCard';
import styles from './page.module.css';

type PropertyItem = {
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
};

export default function AcquireProperty() {
  const [properties, setProperties] = useState<PropertyItem[]>([]);

  const fetchProperties = useCallback(async () => {
    const res = await fetch('/api/client/properties');
    if (res.ok) {
      const data = await res.json();
      setProperties(data.properties || []);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  return (
    <div className={styles.container}>
      <Sidebar />
      
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <Link href="/" className={styles.backLink}>
              ← Back to Dashboard
            </Link>
            <h1 className={styles.pageTitle}>Available Properties</h1>
            <p className={styles.subtitle}>Browse and invest in premium properties curated by our team</p>
          </div>
        </header>

        <div className={styles.propertiesGrid}>
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={{
                id: property.id,
                name: property.name,
                price: property.basePrice || 0,
                location: property.location || property.city || '—',
                state: property.state || '',
                appreciation: property.appreciation || 0,
                bedrooms: property.bedrooms || 0,
                bathrooms: property.bathrooms || 0,
                squareFeet: property.squareFeet || 0,
                type: property.propertyType || 'Residential',
              }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}


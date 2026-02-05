'use client';

import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import PropertyCard from '@/components/PropertyCard';
import styles from './page.module.css';

export default function AcquireProperty() {
  // Mock properties uploaded by admin
  const properties = [
    {
      id: 1,
      name: 'The Obsidian Heights',
      price: 2500000,
      location: 'Tribeca',
      state: 'New York',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a9a6fded0?w=600&h=400&fit=crop',
      appreciation: 7.2,
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 3500,
      type: 'Luxury Residential',
    },
    {
      id: 2,
      name: 'Marina Bay Commercial',
      price: 4200000,
      location: 'San Francisco',
      state: 'California',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop',
      appreciation: 5.8,
      bedrooms: 0,
      bathrooms: 0,
      squareFeet: 8500,
      type: 'Commercial',
    },
    {
      id: 3,
      name: 'Sunset Valley Estate',
      price: 3100000,
      location: 'Los Angeles',
      state: 'California',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop',
      appreciation: 6.4,
      bedrooms: 5,
      bathrooms: 4,
      squareFeet: 4200,
      type: 'Residential',
    },
    {
      id: 4,
      name: 'Downtown Austin Loft',
      price: 1800000,
      location: 'Downtown',
      state: 'Texas',
      image: 'https://images.unsplash.com/photo-1512497935541-1a4d49d6b8bd?w=600&h=400&fit=crop',
      appreciation: 8.1,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 2800,
      type: 'Urban Residential',
    },
    {
      id: 5,
      name: 'Tech Hub Office Complex',
      price: 5500000,
      location: 'Seattle',
      state: 'Washington',
      image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=400&fit=crop',
      appreciation: 6.9,
      bedrooms: 0,
      bathrooms: 0,
      squareFeet: 12000,
      type: 'Commercial',
    },
    {
      id: 6,
      name: 'Beachfront Paradise',
      price: 3800000,
      location: 'Miami Beach',
      state: 'Florida',
      image: 'https://images.unsplash.com/photo-1600881558541-dc73d4c9c67b?w=600&h=400&fit=crop',
      appreciation: 7.5,
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 3800,
      type: 'Luxury Residential',
    },
  ];

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
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </main>
    </div>
  );
}


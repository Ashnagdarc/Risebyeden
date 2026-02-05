'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

export default function PropertyDetails() {
  const params = useParams();
  const router = useRouter();
  const propertyId = parseInt(params.id as string);

  // Mock properties data (same as in acquire page)
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
      yearBuilt: 2020,
      capRate: 4.8,
      monthlyRent: 12500,
      annualExpenses: 45000,
      description: 'Stunning luxury residence in the heart of Tribeca. Features premium finishes, floor-to-ceiling windows, and breathtaking city views. Prime location with easy access to downtown Manhattan.'
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
      yearBuilt: 2018,
      capRate: 6.2,
      monthlyRent: 28000,
      annualExpenses: 95000,
      description: 'Premium commercial space in San Francisco\'s Marina district. Recently renovated with modern amenities. High foot traffic area, perfect for retail or office use.'
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
      yearBuilt: 2019,
      capRate: 5.1,
      monthlyRent: 15000,
      annualExpenses: 52000,
      description: 'Spacious estate in prestigious Los Angeles neighborhood. Features modern architecture, gourmet kitchen, and expansive outdoor living spaces. Perfect for families seeking luxury and comfort.'
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
      yearBuilt: 2021,
      capRate: 5.5,
      monthlyRent: 9500,
      annualExpenses: 32000,
      description: 'Contemporary urban loft in the heart of Austin. High ceilings, exposed brick, and modern fixtures. Walking distance to restaurants, entertainment, and tech hubs.'
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
      yearBuilt: 2017,
      capRate: 6.8,
      monthlyRent: 42000,
      annualExpenses: 125000,
      description: 'State-of-the-art office complex in Seattle\'s tech corridor. Modern infrastructure, high-speed connectivity, and ample parking. Ideal for growing tech companies.'
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
      yearBuilt: 2022,
      capRate: 4.9,
      monthlyRent: 18000,
      annualExpenses: 58000,
      description: 'Oceanfront luxury property with stunning views. Private beach access, infinity pool, and premium amenities. The ultimate coastal living experience.'
    },
  ];

  const property = properties.find(p => p.id === propertyId);

  if (!property) {
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

  const handleInvest = () => {
    alert(`Investment interest registered for ${property.name}. Our team will contact you shortly.`);
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
              <h1 className={styles.pageTitle}>{property.name}</h1>
              <div className={styles.appreciationBadge}>
                +{property.appreciation}% Appreciation
              </div>
            </div>
            <div className={styles.metaRow}>
              <span className={styles.type}>{property.type}</span>
              <span className={styles.location}>{property.location}, {property.state}</span>
            </div>
          </div>
        </header>

        <div className={styles.imageSection}>
          <div className={styles.imageContainer}>
            <img src={property.image} alt={property.name} className={styles.propertyImage} />
            <div className={styles.imageOverlay}>
              <div className={styles.imageBadge}>Premium Listing</div>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.mainSection}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Property Overview</h2>
              <p className={styles.description}>{property.description}</p>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Financial Details</h2>
              <div className={styles.statsGrid}>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>Purchase Price</div>
                  <div className={styles.statValue}>{formatPrice(property.price)}</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>Monthly Rent</div>
                  <div className={styles.statValue}>${formatNumber(property.monthlyRent)}</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>Cap Rate</div>
                  <div className={styles.statValue}>{property.capRate}%</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>Annual Expenses</div>
                  <div className={styles.statValue}>${formatNumber(property.annualExpenses)}</div>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Property Specifications</h2>
              <div className={styles.statsGrid}>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>Square Feet</div>
                  <div className={styles.statValue}>{formatNumber(property.squareFeet)}</div>
                </div>
                <div className={styles.stat}>
                  <div className={styles.statLabel}>Year Built</div>
                  <div className={styles.statValue}>{property.yearBuilt}</div>
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
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.investmentCard}>
              <div className={styles.priceDisplay}>
                <div className={styles.priceLabel}>Investment Amount</div>
                <div className={styles.priceAmount}>{formatPrice(property.price)}</div>
              </div>

              <div className={styles.keyMetrics}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Projected Return</span>
                  <span className={styles.metricValue}>+{property.appreciation}%</span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Cap Rate</span>
                  <span className={styles.metricValue}>{property.capRate}%</span>
                </div>
              </div>

              <button className={styles.investButton} onClick={handleInvest}>
                Express Interest
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

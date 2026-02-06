'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

interface Asset {
  id: number;
  name: string;
  location: string;
  city: string;
  type: 'Residential' | 'Commercial' | 'Mixed Use' | 'Industrial';
  appreciation: number;
  capRate: number;
  valuation: number;
  occupancy: number;
  acquired: string;
  gradient: string;
}

export default function AssetsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('valuation');
  const [searchQuery, setSearchQuery] = useState('');

  const assets: Asset[] = [
    {
      id: 1,
      name: 'The Obsidian Heights',
      location: 'Tribeca',
      city: 'New York',
      type: 'Mixed Use',
      appreciation: 22.4,
      capRate: 5.2,
      valuation: 4200000,
      occupancy: 100,
      acquired: 'Mar 2023',
      gradient: 'obsidian'
    },
    {
      id: 2,
      name: 'Veridian Atrium',
      location: 'Mayfair',
      city: 'London',
      type: 'Residential',
      appreciation: 11.8,
      capRate: 4.8,
      valuation: 5100000,
      occupancy: 100,
      acquired: 'Jun 2022',
      gradient: 'veridian'
    },
    {
      id: 3,
      name: 'The Gilded Loft',
      location: 'Shinjuku',
      city: 'Tokyo',
      type: 'Commercial',
      appreciation: 9.1,
      capRate: 6.1,
      valuation: 3500000,
      occupancy: 95,
      acquired: 'Sep 2023',
      gradient: 'gilded'
    },
    {
      id: 4,
      name: 'Aurora Commercial Plaza',
      location: 'Marina District',
      city: 'San Francisco',
      type: 'Commercial',
      appreciation: 8.4,
      capRate: 5.8,
      valuation: 6800000,
      occupancy: 92,
      acquired: 'Jan 2022',
      gradient: 'aurora'
    },
    {
      id: 5,
      name: 'Meridian Towers',
      location: 'Downtown',
      city: 'Dubai',
      type: 'Residential',
      appreciation: 15.2,
      capRate: 5.5,
      valuation: 8200000,
      occupancy: 98,
      acquired: 'Nov 2021',
      gradient: 'meridian'
    },
    {
      id: 6,
      name: 'The Slate Complex',
      location: 'Canary Wharf',
      city: 'London',
      type: 'Industrial',
      appreciation: 6.8,
      capRate: 7.2,
      valuation: 4500000,
      occupancy: 100,
      acquired: 'Aug 2023',
      gradient: 'slate'
    }
  ];

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${value.toLocaleString()}`;
  };

  const totalValue = assets.reduce((sum, asset) => sum + asset.valuation, 0);
  const avgOccupancy = assets.reduce((sum, asset) => sum + asset.occupancy, 0) / assets.length;
  const avgCapRate = assets.reduce((sum, asset) => sum + asset.capRate, 0) / assets.length;
  const avgAppreciation = assets.reduce((sum, asset) => sum + asset.appreciation, 0) / assets.length;

  const typeDistribution = assets.reduce((acc, asset) => {
    acc[asset.type] = (acc[asset.type] || 0) + asset.valuation;
    return acc;
  }, {} as Record<string, number>);

  const filteredAssets = assets
    .filter(asset => filter === 'all' || asset.type === filter)
    .filter(asset => 
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.city.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'valuation': return b.valuation - a.valuation;
        case 'appreciation': return b.appreciation - a.appreciation;
        case 'capRate': return b.capRate - a.capRate;
        default: return 0;
      }
    });

  const getGradientClass = (gradient: string) => {
    switch (gradient) {
      case 'obsidian': return styles.gradientObsidian;
      case 'veridian': return styles.gradientVeridian;
      case 'gilded': return styles.gradientGilded;
      case 'aurora': return styles.gradientAurora;
      case 'meridian': return styles.gradientMeridian;
      case 'slate': return styles.gradientSlate;
      default: return styles.gradientObsidian;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Residential': return styles.typeResidential;
      case 'Commercial': return styles.typeCommercial;
      case 'Mixed Use': return styles.typeMixedUse;
      case 'Industrial': return styles.typeIndustrial;
      default: return '';
    }
  };

  const getWidthClass = (percentage: number) => {
    const rounded = Math.round(percentage);
    if (rounded >= 25 && rounded <= 27) return styles.width26;
    if (rounded >= 15 && rounded <= 17) return styles.width16;
    if (rounded >= 24 && rounded <= 26) return styles.width25;
    if (rounded >= 20 && rounded <= 22) return styles.width21;
    if (rounded >= 13 && rounded <= 15) return styles.width14;
    return styles.width20;
  };

  const getOccupancyClass = (occupancy: number) => {
    if (occupancy === 100) return styles.occupancy100;
    if (occupancy >= 98) return styles.occupancy98;
    if (occupancy >= 95) return styles.occupancy95;
    if (occupancy >= 92) return styles.occupancy92;
    return styles.occupancy90;
  };

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Portfolio</p>
            <h1 className={styles.pageTitle}>Asset Distribution</h1>
            <p className={styles.subtitle}>Complete overview of your real estate holdings and performance metrics.</p>
          </div>
          <button className={styles.primaryButton} onClick={() => router.push('/acquire')}>
            + Acquire Property
          </button>
        </header>

        {/* Summary Stats */}
        <section className={styles.summaryGrid}>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Total Portfolio Value</p>
            <p className={styles.statValue}>{formatCurrency(totalValue)}</p>
            <p className={styles.statChange}>+14.2% YTD</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Avg. Appreciation</p>
            <p className={styles.statValue}>+{avgAppreciation.toFixed(1)}%</p>
            <p className={styles.statChange}>Portfolio trend</p>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Avg. Occupancy</p>
            <p className={styles.statValue}>{avgOccupancy.toFixed(1)}%</p>
            <span className={styles.statusDot}></span>
          </div>
          <div className={styles.statCard}>
            <p className={styles.statLabel}>Avg. Cap Rate</p>
            <p className={styles.statValue}>{avgCapRate.toFixed(1)}%</p>
          </div>
        </section>

        {/* Distribution Chart */}
        <section className={styles.distributionSection}>
          <div className={styles.distributionCard}>
            <h3 className={styles.sectionTitle}>Asset Type Distribution</h3>
            <div className={styles.distributionChart}>
              {Object.entries(typeDistribution).map(([type, value]) => {
                const percentage = (value / totalValue) * 100;
                return (
                  <div key={type} className={styles.distributionItem}>
                    <div className={styles.distributionInfo}>
                      <span className={`${styles.distributionDot} ${getTypeColor(type)}`}></span>
                      <span className={styles.distributionType}>{type}</span>
                    </div>
                    <div className={styles.distributionBar}>
                      <div 
                        className={`${styles.distributionFill} ${getTypeColor(type)} ${getWidthClass(percentage)}`}
                      ></div>
                    </div>
                    <span className={styles.distributionValue}>{formatCurrency(value)}</span>
                    <span className={styles.distributionPercent}>{percentage.toFixed(1)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.distributionCard}>
            <h3 className={styles.sectionTitle}>Geographic Spread</h3>
            <div className={styles.geoList}>
              {['New York', 'London', 'Tokyo', 'San Francisco', 'Dubai'].map(city => {
                const cityAssets = assets.filter(a => a.city === city);
                const cityValue = cityAssets.reduce((sum, a) => sum + a.valuation, 0);
                return (
                  <div key={city} className={styles.geoItem}>
                    <span className={styles.geoCity}>{city}</span>
                    <span className={styles.geoCount}>{cityAssets.length} {cityAssets.length === 1 ? 'asset' : 'assets'}</span>
                    <span className={styles.geoValue}>{formatCurrency(cityValue)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Filters & Search */}
        <section className={styles.controlsBar}>
          <div className={styles.searchWrapper}>
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.filterGroup}>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className={styles.filterSelect}
              aria-label="Filter by asset type"
            >
              <option value="all">All Types</option>
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Mixed Use">Mixed Use</option>
              <option value="Industrial">Industrial</option>
            </select>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.filterSelect}
              aria-label="Sort assets"
            >
              <option value="valuation">Sort by Value</option>
              <option value="appreciation">Sort by Appreciation</option>
              <option value="capRate">Sort by Cap Rate</option>
            </select>
          </div>
        </section>

        {/* Assets Grid */}
        <section className={styles.assetsGrid}>
          {filteredAssets.map((asset) => (
            <article 
              key={asset.id} 
              className={styles.assetCard}
              onClick={() => router.push(`/acquire/${asset.id}`)}
            >
              <div className={`${styles.assetImage} ${getGradientClass(asset.gradient)}`}>
                <span className={`${styles.typeBadge} ${getTypeColor(asset.type)}`}>{asset.type}</span>
              </div>
              <div className={styles.assetContent}>
                <div className={styles.assetHeader}>
                  <h3 className={styles.assetName}>{asset.name}</h3>
                  <p className={styles.assetLocation}>{asset.location}, {asset.city}</p>
                </div>
                <div className={styles.assetMetrics}>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Valuation</span>
                    <span className={styles.metricValue}>{formatCurrency(asset.valuation)}</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Appreciation</span>
                    <span className={styles.metricValueGreen}>+{asset.appreciation}%</span>
                  </div>
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Cap Rate</span>
                    <span className={styles.metricValue}>{asset.capRate}%</span>
                  </div>
                </div>
                <div className={styles.assetFooter}>
                  <div className={styles.occupancyBar}>
                    <div 
                      className={`${styles.occupancyFill} ${getOccupancyClass(asset.occupancy)}`}
                    ></div>
                  </div>
                  <span className={styles.occupancyLabel}>{asset.occupancy}% occupied</span>
                  <span className={styles.acquiredDate}>Acquired {asset.acquired}</span>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

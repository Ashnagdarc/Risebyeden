'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

interface Asset {
  id: string;
  name: string;
  location: string;
  city: string;
  type: string;
  appreciation: number;
  capRate: number;
  valuation: number;
  occupancy: number;
  acquired: string;
  gradient: string;
  imageUrl?: string | null;
}

interface PortfolioStats {
  totalValue: number;
  avgOccupancy: number;
  avgCapRate: number;
  avgAppreciation: number;
}

export default function AssetsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('valuation');
  const [searchQuery, setSearchQuery] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [stats, setStats] = useState<PortfolioStats>({
    totalValue: 0,
    avgOccupancy: 0,
    avgCapRate: 0,
    avgAppreciation: 0,
  });

  useEffect(() => {
    let isMounted = true;

    fetch('/api/client/portfolio')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch portfolio');
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted) {
          return;
        }

        const gradients = ['obsidian', 'veridian', 'gilded', 'aurora', 'meridian', 'slate'];
        const nextAssets = (data.assets || []).map((asset: Asset, index: number) => ({
          ...asset,
          gradient: gradients[index % gradients.length],
        }));

        setAssets(nextAssets);
        setStats({
          totalValue: data.stats?.totalValue || 0,
          avgOccupancy: data.stats?.avgOccupancy || 0,
          avgCapRate: data.stats?.avgCapRate || 0,
          avgAppreciation: data.stats?.avgAppreciation || 0,
        });
      })
      .catch(() => {
        if (isMounted) {
          setAssets([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${value.toLocaleString()}`;
  };

  const totalValue = stats.totalValue;
  const avgOccupancy = stats.avgOccupancy;
  const avgCapRate = stats.avgCapRate;
  const avgAppreciation = stats.avgAppreciation;

  const typeDistribution = useMemo(() => {
    return assets.reduce((acc, asset) => {
      acc[asset.type] = (acc[asset.type] || 0) + asset.valuation;
      return acc;
    }, {} as Record<string, number>);
  }, [assets]);

  const typeOptions = useMemo(() => {
    const options = new Set(assets.map((asset) => asset.type).filter(Boolean));
    return Array.from(options);
  }, [assets]);

  const cityOptions = useMemo(() => {
    const options = new Set(assets.map((asset) => asset.city).filter(Boolean));
    return Array.from(options);
  }, [assets]);

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
                const percentage = totalValue ? (value / totalValue) * 100 : 0;
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
              {cityOptions.map(city => {
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
              {typeOptions.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
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
                {asset.imageUrl ? (
                  <Image
                    className={styles.assetImagePhoto}
                    src={asset.imageUrl}
                    alt={asset.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                ) : null}
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

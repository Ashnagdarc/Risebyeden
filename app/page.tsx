import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatSlab from '@/components/StatSlab';
import PropertyRow from '@/components/PropertyRow';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import styles from './page.module.css';

export default async function Home() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session) {
    redirect('/auth');
  }

  if (role === 'admin') {
    redirect('/admin');
  }
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    redirect('/auth');
  }

  const clientProperties = await prisma.clientProperty.findMany({
    where: { userId },
    select: {
      quantity: true,
      purchasePrice: true,
      property: {
        select: {
          id: true,
          name: true,
          location: true,
          city: true,
          state: true,
          propertyType: true,
          appreciation: true,
          capRate: true,
          basePrice: true,
          occupancy: true,
        },
      },
    },
  });

  const gradientClasses = [
    styles.propGradientObsidian,
    styles.propGradientVeridian,
    styles.propGradientGilded,
  ];

  const properties = clientProperties.map((entry, index) => {
    const property = entry.property;
    const locationParts = [property.location, property.city, property.state].filter(Boolean);
    const basePrice = property.basePrice ? Number(property.basePrice) : 0;
    const valuation = basePrice;
    return {
      id: property.id,
      name: property.name,
      location: locationParts.join(', ') || 'Location pending',
      type: property.propertyType || 'Residential',
      appreciation: `+${(property.appreciation || 0).toFixed(1)}%`,
      capRate: `${(property.capRate || 0).toFixed(1)}%`,
      valuation: valuation >= 1000000 ? `$${(valuation / 1000000).toFixed(1)}M` : `$${valuation.toLocaleString()}`,
      gradientClass: gradientClasses[index % gradientClasses.length],
      occupancy: property.occupancy || 0,
      capRateValue: property.capRate || 0,
      appreciationValue: property.appreciation || 0,
    };
  });

  const totalValue = clientProperties.reduce((sum, entry) => {
    const quantity = entry.quantity || 1;
    const purchasePrice = entry.purchasePrice ? Number(entry.purchasePrice) : null;
    const basePrice = entry.property.basePrice ? Number(entry.property.basePrice) : 0;
    return sum + quantity * (purchasePrice ?? basePrice);
  }, 0);

  const avgOccupancy = properties.length
    ? properties.reduce((sum, property) => sum + property.occupancy, 0) / properties.length
    : 0;
  const avgCapRate = properties.length
    ? properties.reduce((sum, property) => sum + property.capRateValue, 0) / properties.length
    : 0;
  const avgAppreciation = properties.length
    ? properties.reduce((sum, property) => sum + property.appreciationValue, 0) / properties.length
    : 0;

  const updates = await prisma.announcement.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: { id: true, title: true, createdAt: true },
  });

  const formatRelativeTime = (value: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - value.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} hours ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  return (
    <div className={styles.container}>
      <Sidebar />
      
      <main className={styles.main}>
        <Header totalValue={totalValue} deltaPercent={avgAppreciation} />
        
        <section className={styles.gridLayout}>
          {/* Stat Slabs */}
          <StatSlab label="Avg Cap Rate" value={`${avgCapRate.toFixed(2)}%`} delay={0}>
            <div className={styles.chartLine}></div>
          </StatSlab>
          
          <StatSlab label="Avg Appreciation" value={`+${avgAppreciation.toFixed(2)}%`} delay={0.1}>
            <div className={styles.barChart}>
              <div className={`${styles.barSegment} ${styles.barLow}`}></div>
              <div className={`${styles.barSegment} ${styles.barMid}`}></div>
              <div className={`${styles.barSegment} ${styles.barMidHigh}`}></div>
              <div className={`${styles.barSegment} ${styles.barPeak}`}></div>
            </div>
          </StatSlab>
          
          <StatSlab label="Avg Occupancy" value={`${avgOccupancy.toFixed(1)}%`} delay={0.2}>
            <div className={styles.operational}>
              <span className={styles.pulse}></span>
              All systems operational
            </div>
          </StatSlab>

          {/* Quick Actions */}
          <div className={styles.quickActionsPanel}>
            <h3 className={styles.panelTitle}>Quick Actions</h3>
            <div className={styles.actionsList}>
              <Link href="/consultation" className={styles.actionItem}>
                <span className={styles.actionIcon}>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </span>
                <span>Book Consultation</span>
              </Link>
              <Link href="/assets" className={styles.actionItem}>
                <span className={styles.actionIcon}>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                </span>
                <span>View Portfolio</span>
              </Link>
              <Link href="/updates" className={styles.actionItem}>
                <span className={styles.actionIcon}>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </span>
                <span>Core Updates</span>
              </Link>
              <Link href="/settings" className={styles.actionItem}>
                <span className={styles.actionIcon}>
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                </span>
                <span>Settings</span>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className={styles.activityPanel}>
            <h3 className={styles.panelTitle}>Recent Activity</h3>
            <div className={styles.activityList}>
              {updates.length === 0 && (
                <div className={styles.activityItem}>
                  <span className={styles.activityDot}></span>
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}>No updates yet.</p>
                    <p className={styles.activityTime}>Check back soon</p>
                  </div>
                </div>
              )}
              {updates.map((update) => (
                <div key={update.id} className={styles.activityItem}>
                  <span className={styles.activityDot}></span>
                  <div className={styles.activityContent}>
                    <p className={styles.activityText}>{update.title}</p>
                    <p className={styles.activityTime}>{formatRelativeTime(update.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Property List */}
          <div className={styles.propertyListSlab}>
            <div className={styles.propertyHeader}>
              <h2>Asset Distribution</h2>
              <Link href="/assets" className={styles.viewAll}>View All Assets →</Link>
            </div>

            {properties.map((property) => (
              <PropertyRow
                key={property.id}
                id={property.id}
                name={property.name}
                location={property.location}
                type={property.type}
                appreciation={property.appreciation}
                capRate={property.capRate}
                valuation={property.valuation}
                gradientClass={property.gradientClass}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatSlab from '@/components/StatSlab';
import PropertyRow from '@/components/PropertyRow';
import styles from './page.module.css';

export default function Home() {
  const properties = [
    {
      id: 1,
      name: "The Obsidian Heights",
      location: "Tribeca, New York",
      type: "Mixed Use",
      appreciation: "+22.4%",
      capRate: "5.2%",
      valuation: "$4.2M",
      gradientClass: styles.propGradientObsidian
    },
    {
      id: 2,
      name: "Veridian Atrium",
      location: "Mayfair, London",
      type: "Residential",
      appreciation: "+11.8%",
      capRate: "4.8%",
      valuation: "$5.1M",
      gradientClass: styles.propGradientVeridian
    },
    {
      id: 3,
      name: "The Gilded Loft",
      location: "Shinjuku, Tokyo",
      type: "Commercial",
      appreciation: "+9.1%",
      capRate: "6.1%",
      valuation: "$3.5M",
      gradientClass: styles.propGradientGilded
    }
  ];

  return (
    <div className={styles.container}>
      <Sidebar />
      
      <main className={styles.main}>
        <Header />
        
        <section className={styles.gridLayout}>
          {/* Stat Slabs */}
          <StatSlab label="Net Annual Yield" value="6.82%" delay={0}>
            <div className={styles.chartLine}></div>
          </StatSlab>
          
          <StatSlab label="Portfolio LTV" value="52.4%" delay={0.1}>
            <div className={styles.barChart}>
              <div className={`${styles.barSegment} ${styles.barLow}`}></div>
              <div className={`${styles.barSegment} ${styles.barMid}`}></div>
              <div className={`${styles.barSegment} ${styles.barMidHigh}`}></div>
              <div className={`${styles.barSegment} ${styles.barPeak}`}></div>
            </div>
          </StatSlab>
          
          <StatSlab label="Occupancy Rate" value="98.1%" delay={0.2}>
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
              <div className={styles.activityItem}>
                <span className={styles.activityDot}></span>
                <div className={styles.activityContent}>
                  <p className={styles.activityText}>Portfolio valuation increased by $142K</p>
                  <p className={styles.activityTime}>2 hours ago</p>
                </div>
              </div>
              <div className={styles.activityItem}>
                <span className={styles.activityDot}></span>
                <div className={styles.activityContent}>
                  <p className={styles.activityText}>Rent payment received - Obsidian Heights</p>
                  <p className={styles.activityTime}>Yesterday</p>
                </div>
              </div>
              <div className={styles.activityItem}>
                <span className={styles.activityDot}></span>
                <div className={styles.activityContent}>
                  <p className={styles.activityText}>New acquisition approved - Meridian Towers</p>
                  <p className={styles.activityTime}>3 days ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Property List */}
          <div className={styles.propertyListSlab}>
            <div className={styles.propertyHeader}>
              <h2>Asset Distribution</h2>
              <Link href="/assets" className={styles.viewAll}>View All Assets →</Link>
            </div>

            {properties.map((property) => (
              <PropertyRow key={property.id} {...property} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

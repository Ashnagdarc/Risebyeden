import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatSlab from '@/components/StatSlab';
import PropertyRow from '@/components/PropertyRow';
import styles from './page.module.css';

export default function Home() {
  const properties = [
    {
      name: "The Obsidian Heights",
      location: "Tribeca, New York",
      type: "Mixed Use",
      appreciation: "+22.4%",
      capRate: "5.2%",
      valuation: "$4.2M",
      gradient: "linear-gradient(45deg, #1a1a1a, #333)"
    },
    {
      name: "Veridian Atrium",
      location: "Mayfair, London",
      type: "Residential",
      appreciation: "+11.8%",
      capRate: "4.8%",
      valuation: "$5.1M",
      gradient: "linear-gradient(45deg, #0f1412, #1e2a24)"
    },
    {
      name: "The Gilded Loft",
      location: "Shinjuku, Tokyo",
      type: "Commercial",
      appreciation: "+9.1%",
      capRate: "6.1%",
      valuation: "$3.5M",
      gradient: "linear-gradient(45deg, #1a1610, #3d3528)"
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
              <div style={{ flex: 1, height: '40%', background: '#333', borderRadius: '2px' }}></div>
              <div style={{ flex: 1, height: '60%', background: '#333', borderRadius: '2px' }}></div>
              <div style={{ flex: 1, height: '55%', background: '#333', borderRadius: '2px' }}></div>
              <div style={{ flex: 1, height: '90%', background: 'var(--text-primary)', borderRadius: '2px' }}></div>
            </div>
          </StatSlab>
          
          <StatSlab label="Occupancy Rate" value="98.1%" delay={0.2}>
            <div className={styles.operational}>
              <span className={styles.pulse}></span>
              All systems operational
            </div>
          </StatSlab>

          {/* Property List */}
          <div className={styles.propertyListSlab}>
            <div className={styles.propertyHeader}>
              <h2>Asset Distribution</h2>
              <span className={styles.viewAll}>View All Assets →</span>
            </div>

            {properties.map((property, index) => (
              <PropertyRow key={index} {...property} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

import styles from './PropertyRow.module.css';

interface PropertyRowProps {
  name: string;
  location: string;
  type: string;
  appreciation: string;
  capRate: string;
  valuation: string;
  gradient: string;
}

export default function PropertyRow({
  name,
  location,
  type,
  appreciation,
  capRate,
  valuation,
  gradient
}: PropertyRowProps) {
  return (
    <div className={styles.propertyRow}>
      <div className={styles.propImg} style={{ background: gradient }}></div>
      <div className={styles.propInfo}>
        <h3>{name}</h3>
        <p>{location} • {type}</p>
      </div>
      <div className={styles.propMetric}>
        <span className={styles.propLabel}>Appreciation</span>
        {appreciation}
      </div>
      <div className={styles.propMetric}>
        <span className={styles.propLabel}>Cap Rate</span>
        {capRate}
      </div>
      <div className={styles.propMetric}>
        <span className={styles.propLabel}>Valuation</span>
        {valuation}
      </div>
    </div>
  );
}

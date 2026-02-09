'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import AdminNav from '@/components/AdminNav';
import styles from '../admin.module.css';

type PriceUpdateItem = {
  id: string;
  price: number;
  effectiveDate: string;
  source: string | null;
  property: { id: string; name: string } | null;
};

type PropertyOption = {
  id: string;
  name: string;
};

export default function PricingAdmin() {
  const [updates, setUpdates] = useState<PriceUpdateItem[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [propertyId, setPropertyId] = useState('');
  const [price, setPrice] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [source, setSource] = useState('Internal Review');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAppendOpen, setIsAppendOpen] = useState(false);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
    []
  );

  const fetchUpdates = useCallback(async () => {
    const res = await fetch('/api/admin/price-updates');
    if (res.ok) {
      const data = await res.json();
      setUpdates(data.updates || []);
    }
  }, []);

  const fetchProperties = useCallback(async () => {
    const res = await fetch('/api/admin/properties');
    if (res.ok) {
      const data = await res.json();
      setProperties(data.properties || []);
      if (!propertyId && data.properties?.length) {
        setPropertyId(data.properties[0].id);
      }
    }
  }, [propertyId]);

  useEffect(() => {
    fetchUpdates();
    fetchProperties();
  }, [fetchUpdates, fetchProperties]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage('');

    if (!propertyId || !price || !effectiveDate) {
      setStatusMessage('Property, price, and date are required.');
      return;
    }

    setIsSubmitting(true);
    const normalizedPrice = price.replace(/[^0-9.]/g, '');
    const parsedPrice = normalizedPrice ? Number.parseFloat(normalizedPrice) : null;

    const res = await fetch('/api/admin/price-updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId,
        price: parsedPrice,
        effectiveDate,
        source,
      }),
    });

    if (res.ok) {
      setStatusMessage('Price update appended.');
      setPrice('');
      setEffectiveDate('');
      setSource('Internal Review');
      fetchUpdates();
    } else {
      setStatusMessage('Failed to append price update.');
    }

    setIsSubmitting(false);
  };

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Admin</p>
            <h1 className={styles.pageTitle}>Price History</h1>
            <p className={styles.subtitle}>Append-only price updates for each preset. Existing records remain immutable.</p>
          </div>
          <button className={styles.primaryButton} onClick={() => setIsAppendOpen(true)}>
            Append Update
          </button>
        </header>

        <AdminNav />

        <section className={styles.grid}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Recent Updates</h2>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <div>Update</div>
                <div>Preset</div>
                <div>Price</div>
                <div>Date</div>
              </div>
              {updates.length === 0 ? (
                <div className={styles.tableRow}>
                  <div className={styles.tableEmpty}>No price updates yet.</div>
                </div>
              ) : (
                updates.map((update) => (
                  <div key={update.id} className={styles.tableRow}>
                    <div>{update.id.slice(0, 6).toUpperCase()}</div>
                    <div>{update.property?.name || '—'}</div>
                    <div>{currencyFormatter.format(Number(update.price))}</div>
                    <div>{new Date(update.effectiveDate).toLocaleDateString()}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Append New Price</h2>
            <p className={styles.emptyText}>Use the Append Update action to record a new price entry.</p>
            <div className={styles.inlineActions}>
              <button className={styles.secondaryButton} onClick={() => setIsAppendOpen(true)}>
                Open Append Form
              </button>
            </div>
          </div>
        </section>

        {isAppendOpen && (
          <div
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            aria-label="Append price update"
            onClick={() => setIsAppendOpen(false)}
          >
            <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
              <h2 className={styles.modalTitle}>Append Price Update</h2>
              <p className={styles.modalBody}>Record the next price in the preset history log.</p>
              <form onSubmit={handleSubmit}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="preset">Preset</label>
                  <select
                    className={styles.select}
                    id="preset"
                    value={propertyId}
                    onChange={(event) => setPropertyId(event.target.value)}
                  >
                    {properties.length === 0 ? (
                      <option value="">No presets available</option>
                    ) : (
                      properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="price">Price</label>
                    <input
                      className={styles.input}
                      id="price"
                      placeholder="$0.00"
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="date">Effective Date</label>
                    <input
                      className={styles.input}
                      id="date"
                      placeholder="YYYY-MM-DD"
                      value={effectiveDate}
                      onChange={(event) => setEffectiveDate(event.target.value)}
                    />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="source">Data Source</label>
                  <input
                    className={styles.input}
                    id="source"
                    placeholder="Internal Review"
                    value={source}
                    onChange={(event) => setSource(event.target.value)}
                  />
                </div>
                <div className={styles.inlineActions}>
                  <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Appending...' : 'Append Entry'}
                  </button>
                  <span className={`${styles.badge} ${styles.badgeMuted}`}>Immutable Log</span>
                  <button className={styles.secondaryButton} type="button" onClick={() => setIsAppendOpen(false)}>
                    Close
                  </button>
                  {statusMessage && <span className={`${styles.badge} ${styles.badgeMuted}`}>{statusMessage}</span>}
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

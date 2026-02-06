'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import AdminNav from '@/components/AdminNav';
import styles from '../admin.module.css';

type ClientSummary = {
  id: string;
  userId: string;
  name: string | null;
  organization: string | null;
  status: string;
  propertyCount: number;
  portfolioValue: number;
};

type PropertyRecord = {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  status: string;
  basePrice: number | null;
};

export default function ClientPortfolios() {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [notes, setNotes] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    []
  );

  const fetchClients = useCallback(async () => {
    const res = await fetch('/api/admin/clients');
    if (res.ok) {
      const data = await res.json();
      setClients(data.clients || []);
      if (!selectedClientId && data.clients?.length) {
        setSelectedClientId(data.clients[0].id);
      }
    }
  }, [selectedClientId]);

  const fetchProperties = useCallback(async () => {
    const res = await fetch('/api/admin/properties');
    if (res.ok) {
      const data = await res.json();
      setProperties(data.properties || []);
      if (!selectedPropertyId && data.properties?.length) {
        setSelectedPropertyId(data.properties[0].id);
      }
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    fetchClients();
    fetchProperties();
  }, [fetchClients, fetchProperties]);

  const handleAssign = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage('');

    if (!selectedClientId || !selectedPropertyId) {
      setStatusMessage('Select a client and property first.');
      return;
    }

    setIsSubmitting(true);

    const parsedQuantity = Number.parseInt(quantity, 10);
    const normalizedPrice = purchasePrice.replace(/[^0-9.]/g, '');
    const parsedPrice = normalizedPrice ? Number.parseFloat(normalizedPrice) : null;

    const res = await fetch('/api/admin/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: selectedClientId,
        propertyId: selectedPropertyId,
        quantity: Number.isFinite(parsedQuantity) ? parsedQuantity : 1,
        purchasePrice: parsedPrice,
        notes,
      }),
    });

    if (res.ok) {
      setStatusMessage('Property assigned to client.');
      setPurchasePrice('');
      setNotes('');
      setQuantity('1');
      fetchClients();
    } else {
      setStatusMessage('Failed to assign property.');
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
            <h1 className={styles.pageTitle}>Client Portfolios</h1>
            <p className={styles.subtitle}>Assign properties to client accounts and track portfolio readiness.</p>
          </div>
          <button className={styles.primaryButton}>Assign Property</button>
        </header>

        <AdminNav />

        <section className={styles.grid}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Client List</h2>
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <div>Client</div>
                <div>Portfolio</div>
                <div>Properties</div>
                <div>Status</div>
              </div>
              {clients.length === 0 ? (
                <div className={styles.tableRow}>
                  <div style={{ gridColumn: '1 / -1', color: 'var(--text-secondary)' }}>
                    No client accounts yet.
                  </div>
                </div>
              ) : (
                clients.map((client) => (
                  <div key={client.id} className={styles.tableRow}>
                    <div>
                      {client.name || client.organization || client.userId}
                      <div className={styles.statMeta}>{client.userId}</div>
                    </div>
                    <div>
                      {client.portfolioValue > 0
                        ? currencyFormatter.format(client.portfolioValue)
                        : '—'}
                    </div>
                    <div>{client.propertyCount}</div>
                    <div className={client.status === 'ACTIVE' ? `${styles.badge} ${styles.badgeSuccess}` : `${styles.badge} ${styles.badgePending}`}>
                      {client.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Assign Property</h2>
            <form onSubmit={handleAssign}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="client">Client</label>
                <select
                  className={styles.select}
                  id="client"
                  value={selectedClientId}
                  onChange={(event) => setSelectedClientId(event.target.value)}
                >
                  {clients.length === 0 ? (
                    <option value="">No clients available</option>
                  ) : (
                    clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name || client.organization || client.userId} ({client.userId})
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="property">Property Preset</label>
                <select
                  className={styles.select}
                  id="property"
                  value={selectedPropertyId}
                  onChange={(event) => setSelectedPropertyId(event.target.value)}
                >
                  {properties.length === 0 ? (
                    <option value="">No properties available</option>
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
                  <label className={styles.label} htmlFor="quantity">Quantity</label>
                  <input
                    className={styles.input}
                    id="quantity"
                    placeholder="1"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="purchase">Purchase Price</label>
                  <input
                    className={styles.input}
                    id="purchase"
                    placeholder="$0.00"
                    value={purchasePrice}
                    onChange={(event) => setPurchasePrice(event.target.value)}
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="notes">Notes</label>
                <textarea
                  className={styles.textarea}
                  id="notes"
                  placeholder="Inspection date, closing details, or internal notes."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>
              <div className={styles.inlineActions}>
                <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Assigning...' : 'Assign to Client'}
                </button>
                <button className={styles.secondaryButton} type="button" onClick={() => setStatusMessage('Saved locally.')}
                  disabled={isSubmitting}
                >
                  Save Draft
                </button>
                {statusMessage && <span className={`${styles.badge} ${styles.badgeMuted}`}>{statusMessage}</span>}
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

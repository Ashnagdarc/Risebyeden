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
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [deactivateClient, setDeactivateClient] = useState<ClientSummary | null>(null);
  const [editingClientId, setEditingClientId] = useState('');
  const [editName, setEditName] = useState('');
  const [editOrganization, setEditOrganization] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'PENDING' | 'REJECTED'>('ACTIVE');
  const [editMessage, setEditMessage] = useState('');

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

  const openEditModal = (client: ClientSummary) => {
    setEditingClientId(client.id);
    setEditName(client.name || '');
    setEditOrganization(client.organization || '');
    setEditStatus(client.status as 'ACTIVE' | 'PENDING' | 'REJECTED');
    setEditMessage('');
    setIsEditOpen(true);
  };

  const openDeactivateModal = (client: ClientSummary) => {
    setDeactivateClient(client);
    setIsDeactivateOpen(true);
    setEditMessage('');
  };

  const updateClient = async (payload: { id: string; status?: 'ACTIVE' | 'PENDING' | 'REJECTED'; name?: string; organization?: string; }) => {
    setEditMessage('');
    setIsSubmitting(true);

    const res = await fetch('/api/admin/clients', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setEditMessage('Client updated.');
      fetchClients();
    } else {
      setEditMessage('Failed to update client.');
    }

    setIsSubmitting(false);
  };

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingClientId) {
      setEditMessage('Select a client first.');
      return;
    }

    await updateClient({
      id: editingClientId,
      name: editName,
      organization: editOrganization,
      status: editStatus,
    });
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
          <button className={styles.primaryButton} onClick={() => setIsAssignOpen(true)}>
            Assign Property
          </button>
        </header>

        <AdminNav />

        <section className={styles.grid}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Client List</h2>
            <div className={styles.table}>
              <div className={`${styles.tableHeader} ${styles.tableHeaderActions}`}>
                <div>Client</div>
                <div>Portfolio</div>
                <div>Properties</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              {clients.length === 0 ? (
                <div className={styles.tableRow}>
                  <div className={styles.tableEmpty}>
                    No client accounts yet.
                  </div>
                </div>
              ) : (
                clients.map((client) => (
                  <div key={client.id} className={`${styles.tableRow} ${styles.tableRowActions}`}>
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
                    <div className={styles.tableActions}>
                      <button
                        className={`${styles.secondaryButton} ${styles.actionButtonSmall}`}
                        onClick={() => openEditModal(client)}
                      >
                        Edit
                      </button>
                      <button
                        className={`${styles.secondaryButton} ${styles.actionButtonSmall} ${styles.actionButtonDanger}`}
                        onClick={() => {
                          if (client.status === 'ACTIVE') {
                            openDeactivateModal(client);
                            return;
                          }
                          updateClient({ id: client.id, status: 'ACTIVE' });
                        }}
                        disabled={isSubmitting}
                      >
                        {client.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Assign Property</h2>
            <p className={styles.emptyText}>Use the Assign Property action to allocate presets to a client portfolio.</p>
            <div className={styles.inlineActions}>
              <button className={styles.secondaryButton} onClick={() => setIsAssignOpen(true)}>
                Open Assign Form
              </button>
            </div>
          </div>
        </section>

        {isAssignOpen && (
          <div
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            aria-label="Assign property"
            onClick={() => setIsAssignOpen(false)}
          >
            <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
              <h2 className={styles.modalTitle}>Assign Property</h2>
              <p className={styles.modalBody}>Link a preset to a client account and record the purchase details.</p>
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
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={() => setStatusMessage('Saved locally.')}
                    disabled={isSubmitting}
                  >
                    Save Draft
                  </button>
                  <button
                    className={styles.secondaryButton}
                    type="button"
                    onClick={() => setIsAssignOpen(false)}
                  >
                    Close
                  </button>
                  {statusMessage && <span className={`${styles.badge} ${styles.badgeMuted}`}>{statusMessage}</span>}
                </div>
              </form>
            </div>
          </div>
        )}

        {isEditOpen && (
          <div
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            aria-label="Edit client"
            onClick={() => setIsEditOpen(false)}
          >
            <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
              <h2 className={styles.modalTitle}>Edit Client</h2>
              <p className={styles.modalBody}>Update client details or toggle account status.</p>
              <form onSubmit={handleEditSubmit}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="clientName">Name</label>
                  <input
                    className={styles.input}
                    id="clientName"
                    placeholder="Client name"
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="clientOrg">Organization</label>
                  <input
                    className={styles.input}
                    id="clientOrg"
                    placeholder="Organization"
                    value={editOrganization}
                    onChange={(event) => setEditOrganization(event.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="clientStatus">Status</label>
                  <select
                    className={styles.select}
                    id="clientStatus"
                    value={editStatus}
                    onChange={(event) => setEditStatus(event.target.value as 'ACTIVE' | 'PENDING' | 'REJECTED')}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PENDING">PENDING</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
                <div className={styles.inlineActions}>
                  <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button className={styles.secondaryButton} type="button" onClick={() => setIsEditOpen(false)}>
                    Close
                  </button>
                  {editMessage && <span className={`${styles.badge} ${styles.badgeMuted}`}>{editMessage}</span>}
                </div>
              </form>
            </div>
          </div>
        )}

        {isDeactivateOpen && deactivateClient && (
          <div
            className={styles.modalOverlay}
            role="dialog"
            aria-modal="true"
            aria-label="Deactivate client"
            onClick={() => setIsDeactivateOpen(false)}
          >
            <div className={styles.modalCard} onClick={(event) => event.stopPropagation()}>
              <h2 className={styles.modalTitle}>Deactivate Client</h2>
              <p className={styles.modalBody}>
                Deactivate {deactivateClient.name || deactivateClient.organization || deactivateClient.userId}? This will
                block client access until reactivated.
              </p>
              <div className={styles.modalActions}>
                <button className={styles.secondaryButton} onClick={() => setIsDeactivateOpen(false)}>
                  Cancel
                </button>
                <button
                  className={styles.primaryButton}
                  onClick={() => {
                    updateClient({ id: deactivateClient.id, status: 'REJECTED' });
                    setIsDeactivateOpen(false);
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Deactivating...' : 'Deactivate'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

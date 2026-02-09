/* eslint-disable @next/next/no-img-element */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import AdminNav from '@/components/AdminNav';
import styles from '@/app/admin/admin.module.css';

type PropertyRecord = {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  status: 'AVAILABLE' | 'RESERVED' | 'SOLD';
  basePrice: number | null;
  description: string | null;
  documents: { id: string; url: string }[];
};

function parseImageUrls(raw: string): string[] {
  return raw
    .split(/[\n,]/g)
    .map((value) => value.trim())
    .filter(Boolean);
}

export default function PropertyPresets() {
  const [properties, setProperties] = useState<PropertyRecord[]>([]);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PropertyRecord | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'AVAILABLE' | 'RESERVED' | 'SOLD'>('AVAILABLE');
  const [basePrice, setBasePrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrls, setImageUrls] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'RESERVED' | 'SOLD'>('ALL');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const previewUrls = useMemo(() => parseImageUrls(imageUrls), [imageUrls]);

  const currencyFormatter = useMemo(
    () => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
    []
  );

  const fetchProperties = useCallback(async () => {
    const res = await fetch('/api/admin/properties');
    if (res.ok) {
      const data = await res.json();
      setProperties(data.properties || []);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const resetForm = () => {
    setEditingPropertyId(null);
    setName('');
    setSlug('');
    setLocation('');
    setStatus('AVAILABLE');
    setBasePrice('');
    setDescription('');
    setImageUrls('');
  };

  const handleCreateOrUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage('');

    if (!name.trim()) {
      setStatusMessage('Preset name is required.');
      return;
    }

    setIsSubmitting(true);
    const normalizedPrice = basePrice.replace(/[^0-9.]/g, '');
    const parsedPrice = normalizedPrice ? Number.parseFloat(normalizedPrice) : null;
    const urls = parseImageUrls(imageUrls);

    const payload = {
      id: editingPropertyId || undefined,
      name,
      slug: slug || undefined,
      location: location || undefined,
      status,
      basePrice: parsedPrice,
      description: description || undefined,
      imageUrls: urls.length > 0 ? urls : undefined,
    };

    const res = await fetch('/api/admin/properties', {
      method: editingPropertyId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setStatusMessage(editingPropertyId ? 'Preset updated.' : 'Preset created.');
      resetForm();
      fetchProperties();
    } else {
      setStatusMessage(editingPropertyId ? 'Failed to update preset.' : 'Failed to create preset.');
    }

    setIsSubmitting(false);
  };

  const handleEdit = (property: PropertyRecord) => {
    setEditingPropertyId(property.id);
    setName(property.name);
    setSlug(property.slug);
    setLocation(property.location || '');
    setStatus(property.status);
    setBasePrice(property.basePrice ? String(property.basePrice) : '');
    setDescription(property.description || '');
    setImageUrls(property.documents.map((doc) => doc.url).join('\n'));
    setStatusMessage('Editing preset. Update fields and save.');
  };

  const handleDelete = async (property: PropertyRecord) => {
    const res = await fetch('/api/admin/properties', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: property.id }),
    });

    if (res.ok) {
      setStatusMessage('Preset deleted.');
      if (editingPropertyId === property.id) {
        resetForm();
      }
      fetchProperties();
    } else {
      setStatusMessage('Failed to delete preset.');
    }
  };

  const filteredProperties = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const min = minPrice ? Number.parseFloat(minPrice) : null;
    const max = maxPrice ? Number.parseFloat(maxPrice) : null;

    return properties.filter((property) => {
      const matchesStatus = statusFilter === 'ALL' || property.status === statusFilter;
      const matchesSearch = !normalizedSearch || [
        property.name,
        property.slug,
        property.location || '',
      ].some((value) => value.toLowerCase().includes(normalizedSearch));

      const price = property.basePrice ?? null;
      const matchesMin = min === null || (price !== null && price >= min);
      const matchesMax = max === null || (price !== null && price <= max);

      return matchesStatus && matchesSearch && matchesMin && matchesMax;
    });
  }, [properties, searchTerm, statusFilter, minPrice, maxPrice]);

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Admin</p>
            <h1 className={styles.pageTitle}>Properties</h1>
            <p className={styles.subtitle}>Create, update, and manage the property preset catalogue available to clients.</p>
          </div>
          <button className={styles.primaryButton} onClick={() => resetForm()}>New Preset</button>
        </header>

        <AdminNav />

        <section className={styles.grid}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Catalogue</h2>
            <div className={styles.filterBar}>
              <div className={styles.filterField}>
                <label className={styles.label} htmlFor="search">Search</label>
                <input
                  className={styles.input}
                  id="search"
                  placeholder="Name, slug, location"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
              <div className={styles.filterField}>
                <label className={styles.label} htmlFor="statusFilter">Status</label>
                <select
                  className={styles.select}
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as 'ALL' | 'AVAILABLE' | 'RESERVED' | 'SOLD')}
                >
                  <option value="ALL">All</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="SOLD">Sold</option>
                </select>
              </div>
              <div className={styles.filterField}>
                <label className={styles.label} htmlFor="minPrice">Min Price</label>
                <input
                  className={styles.input}
                  id="minPrice"
                  placeholder="0"
                  value={minPrice}
                  onChange={(event) => setMinPrice(event.target.value)}
                />
              </div>
              <div className={styles.filterField}>
                <label className={styles.label} htmlFor="maxPrice">Max Price</label>
                <input
                  className={styles.input}
                  id="maxPrice"
                  placeholder="10000000"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(event.target.value)}
                />
              </div>
            </div>
            <div className={styles.table}>
              <div className={`${styles.tableHeader} ${styles.tableHeaderActions}`}>
                <div>Preset</div>
                <div>Location</div>
                <div>Price</div>
                <div>Status</div>
                <div>Actions</div>
              </div>
              {filteredProperties.length === 0 ? (
                <div className={`${styles.tableRow} ${styles.tableRowActions}`}>
                  <div className={styles.tableEmpty}>
                    No presets match these filters.
                  </div>
                </div>
              ) : (
                filteredProperties.map((property) => (
                  <div key={property.id} className={`${styles.tableRow} ${styles.tableRowActions}`}>
                    <div className={styles.presetCell}>
                      {property.documents[0]?.url ? (
                        <img
                          className={styles.previewThumb}
                          src={property.documents[0].url}
                          alt={`${property.name} preview`}
                          loading="lazy"
                        />
                      ) : (
                        <div className={styles.previewFallback} />
                      )}
                      <div>
                        {property.name}
                        <div className={styles.statMeta}>{property.slug}</div>
                      </div>
                    </div>
                    <div>{property.location || '—'}</div>
                    <div>
                      {property.basePrice
                        ? currencyFormatter.format(property.basePrice)
                        : '—'}
                    </div>
                    <div className={property.status === 'AVAILABLE' ? `${styles.badge} ${styles.badgeSuccess}` : `${styles.badge} ${styles.badgeMuted}`}>
                      {property.status}
                    </div>
                    <div className={styles.tableActions}>
                      <button className={styles.secondaryButton} type="button" onClick={() => handleEdit(property)}>
                        Edit
                      </button>
                      <button className={styles.secondaryButton} type="button" onClick={() => setDeleteTarget(property)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>{editingPropertyId ? 'Edit Preset' : 'Create Preset'}</h2>
            <form onSubmit={handleCreateOrUpdate}>
              <div className={styles.formGrid}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="name">Preset Name</label>
                  <input
                    className={styles.input}
                    id="name"
                    placeholder="Enter preset name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="slug">Slug (optional)</label>
                  <input
                    className={styles.input}
                    id="slug"
                    placeholder="obsidian-heights"
                    value={slug}
                    onChange={(event) => setSlug(event.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="location">Location</label>
                  <input
                    className={styles.input}
                    id="location"
                    placeholder="Ikoyi, Lagos"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="status">Status</label>
                  <select
                    className={styles.select}
                    id="status"
                    value={status}
                    onChange={(event) => setStatus(event.target.value as 'AVAILABLE' | 'RESERVED' | 'SOLD')}
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="RESERVED">Reserved</option>
                    <option value="SOLD">Sold</option>
                  </select>
                </div>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="basePrice">Base Price</label>
                <input
                  className={styles.input}
                  id="basePrice"
                  placeholder="$0.00"
                  value={basePrice}
                  onChange={(event) => setBasePrice(event.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="description">Description</label>
                <textarea
                  className={styles.textarea}
                  id="description"
                  placeholder="Signature details, finishes, or key amenities."
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="images">Image URLs</label>
                <textarea
                  className={styles.textarea}
                  id="images"
                  placeholder="Paste image URLs, separated by commas or new lines."
                  value={imageUrls}
                  onChange={(event) => setImageUrls(event.target.value)}
                />
                {previewUrls.length === 0 ? (
                  <div className={styles.previewEmpty}>Add at least one image URL to preview.</div>
                ) : (
                  <div className={styles.previewGrid}>
                    {previewUrls.map((url, index) => (
                      <img
                        key={`${url}-${index}`}
                        className={styles.previewImage}
                        src={url}
                        alt={`Preview ${index + 1}`}
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className={styles.inlineActions}>
                <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingPropertyId ? 'Update Preset' : 'Save Preset'}
                </button>
                {editingPropertyId && (
                  <button className={styles.secondaryButton} type="button" onClick={resetForm} disabled={isSubmitting}>
                    Cancel Edit
                  </button>
                )}
                {statusMessage && <span className={`${styles.badge} ${styles.badgeMuted}`}>{statusMessage}</span>}
              </div>
            </form>
          </div>
        </section>
      </main>

      {deleteTarget && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Delete preset?</h3>
            <p className={styles.modalBody}>
              You are about to delete {deleteTarget.name}. This cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>
              <button
                className={styles.primaryButton}
                type="button"
                onClick={async () => {
                  await handleDelete(deleteTarget);
                  setDeleteTarget(null);
                }}
              >
                Delete Preset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

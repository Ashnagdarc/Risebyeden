'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

type ProfilePayload = {
  user: {
    name: string | null;
    email: string | null;
    status: string;
  };
  profile: {
    phone: string | null;
    city: string | null;
    region: string | null;
    country: string | null;
    bio: string | null;
  } | null;
  settings: {
    dataSharing: string | null;
  } | null;
  stats: {
    tier: string;
  };
};

type VisibilityOption = 'private' | 'partners' | 'public';

const defaultForm = {
  displayName: '',
  email: '',
  phone: '',
  location: '',
  bio: '',
};

export default function EditProfilePage() {
  const router = useRouter();
  const [formData, setFormData] = useState(defaultForm);
  const [visibility, setVisibility] = useState<VisibilityOption>('private');
  const [tierLabel, setTierLabel] = useState('Institutional Prime');
  const [verificationLabel, setVerificationLabel] = useState('Pending Review');
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    fetch('/api/client/profile')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Failed to load profile');
        }
        return res.json();
      })
      .then((payload: ProfilePayload) => {
        if (!isMounted) {
          return;
        }

        const locationParts = [payload.profile?.city, payload.profile?.region, payload.profile?.country]
          .filter(Boolean)
          .join(', ');

        setFormData({
          displayName: payload.user.name || '',
          email: payload.user.email || '',
          phone: payload.profile?.phone || '',
          location: locationParts,
          bio: payload.profile?.bio || '',
        });

        if (payload.settings?.dataSharing === 'Full') {
          setVisibility('public');
        } else if (payload.settings?.dataSharing === 'Standard') {
          setVisibility('partners');
        } else {
          setVisibility('private');
        }

        setTierLabel(payload.stats.tier || 'Institutional Prime');
        setVerificationLabel(payload.user.status === 'ACTIVE' ? 'KYC Approved' : 'Pending Review');
      })
      .catch(() => {
        if (isMounted) {
          setStatusMessage('Unable to load profile data.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage('');

    const response = await fetch('/api/client/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.displayName,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        bio: formData.bio,
        visibility,
      }),
    });

    if (response.ok) {
      router.push('/profile');
    } else {
      setStatusMessage('Unable to save profile changes.');
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Edit Profile</p>
            <h1 className={styles.pageTitle}>Update Identity</h1>
            <p className={styles.subtitle}>Modify your personal information and investor profile.</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.secondaryButton} onClick={() => router.push('/profile')}>
              Cancel
            </button>
            <button className={styles.primaryButton} onClick={handleSubmit} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <section className={styles.avatarSection}>
            <div className={styles.avatarUpload}>
              <div className={styles.avatar}>
                {(formData.displayName || 'RB')
                  .split(' ')
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()}
              </div>
              <div className={styles.avatarActions}>
                <button type="button" className={styles.uploadButton}>Upload Photo</button>
                <p className={styles.uploadHint}>JPG, PNG or GIF. Max 2MB.</p>
              </div>
            </div>
          </section>

          <section className={styles.formGrid}>
            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Personal Information</h3>
              
              <div className={styles.fieldGroup}>
                <label htmlFor="displayName" className={styles.label}>Display Name</label>
                <input
                  id="displayName"
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="email" className={styles.label}>Email Address</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={styles.input}
                />
                <p className={styles.fieldHint}>Used for account notifications and login.</p>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="phone" className={styles.label}>Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="location" className={styles.label}>Location</label>
                <input
                  id="location"
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.panel}>
              <h3 className={styles.panelTitle}>Investor Profile</h3>

              <div className={styles.fieldGroup}>
                <label htmlFor="bio" className={styles.label}>Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className={styles.textarea}
                  rows={4}
                />
                <p className={styles.fieldHint}>Brief description visible to Rise by eden partners.</p>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Portfolio Tier</label>
                <div className={styles.tierBadge}>{tierLabel}</div>
                <p className={styles.fieldHint}>Tier is determined by total assets under management.</p>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Verification Status</label>
                <div className={styles.verificationStatus}>
                  <span className={styles.verifiedBadge}>{verificationLabel}</span>
                  <button type="button" className={styles.linkButton}>Re-verify</button>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <h3 className={styles.panelTitle}>Portfolio Visibility</h3>
            <div className={styles.visibilityOptions}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={visibility === 'private'}
                  onChange={() => setVisibility('private')}
                />
                <div>
                  <p className={styles.radioTitle}>Private</p>
                  <p className={styles.radioDesc}>Only you can view your portfolio holdings.</p>
                </div>
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="visibility"
                  value="partners"
                  checked={visibility === 'partners'}
                  onChange={() => setVisibility('partners')}
                />
                <div>
                  <p className={styles.radioTitle}>Partners Only</p>
                  <p className={styles.radioDesc}>Visible to verified Rise by eden partners.</p>
                </div>
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={visibility === 'public'}
                  onChange={() => setVisibility('public')}
                />
                <div>
                  <p className={styles.radioTitle}>Public</p>
                  <p className={styles.radioDesc}>Portfolio visible on your investor profile.</p>
                </div>
              </label>
            </div>
          </section>
        </form>
        {statusMessage && <p className={styles.statusMessage}>{statusMessage}</p>}
      </main>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

export default function EditProfilePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    displayName: 'Daniel Nonso',
    email: 'daniel.nonso48@gmail.com',
    phone: '+234 803 221 9812',
    location: 'Lagos, Nigeria',
    bio: 'Principal investor focused on premium real estate acquisitions across emerging markets.',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save logic would go here
    router.push('/profile');
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
            <button className={styles.primaryButton} onClick={handleSubmit}>
              Save Changes
            </button>
          </div>
        </header>

        <form className={styles.form} onSubmit={handleSubmit}>
          <section className={styles.avatarSection}>
            <div className={styles.avatarUpload}>
              <div className={styles.avatar}>RB</div>
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
                <div className={styles.tierBadge}>Institutional Prime</div>
                <p className={styles.fieldHint}>Tier is determined by total assets under management.</p>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Verification Status</label>
                <div className={styles.verificationStatus}>
                  <span className={styles.verifiedBadge}>KYC Approved</span>
                  <button type="button" className={styles.linkButton}>Re-verify</button>
                </div>
              </div>
            </div>
          </section>

          <section className={styles.panel}>
            <h3 className={styles.panelTitle}>Portfolio Visibility</h3>
            <div className={styles.visibilityOptions}>
              <label className={styles.radioOption}>
                <input type="radio" name="visibility" value="private" defaultChecked />
                <div>
                  <p className={styles.radioTitle}>Private</p>
                  <p className={styles.radioDesc}>Only you can view your portfolio holdings.</p>
                </div>
              </label>
              <label className={styles.radioOption}>
                <input type="radio" name="visibility" value="partners" />
                <div>
                  <p className={styles.radioTitle}>Partners Only</p>
                  <p className={styles.radioDesc}>Visible to verified Rise by eden partners.</p>
                </div>
              </label>
              <label className={styles.radioOption}>
                <input type="radio" name="visibility" value="public" />
                <div>
                  <p className={styles.radioTitle}>Public</p>
                  <p className={styles.radioDesc}>Portfolio visible on your investor profile.</p>
                </div>
              </label>
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}

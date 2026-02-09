'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

type SettingsState = {
  twoFactorEnabled: boolean;
  deviceApproval: boolean;
  weeklySecurityReports: boolean;
  portfolioAlerts: boolean;
  acquisitionOpportunities: boolean;
  marketReports: boolean;
  portfolioStrategy: string;
  defaultRegion: string;
  dataSharing: string;
};

type UserState = {
  name: string;
  email: string;
  role: string;
};

const defaultSettings: SettingsState = {
  twoFactorEnabled: true,
  deviceApproval: true,
  weeklySecurityReports: false,
  portfolioAlerts: true,
  acquisitionOpportunities: true,
  marketReports: false,
  portfolioStrategy: 'Balanced',
  defaultRegion: 'West Africa',
  dataSharing: 'Limited',
};

export default function SettingsPage() {
  const [user, setUser] = useState<UserState>({ name: '', email: '', role: 'CLIENT' });
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    fetch('/api/client/settings')
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch settings');
        }
        return res.json();
      })
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setUser({
          name: data.user?.name || '',
          email: data.user?.email || '',
          role: data.user?.role || 'CLIENT',
        });
        setSettings({
          ...defaultSettings,
          ...data.settings,
        });
      })
      .catch(() => {
        if (isMounted) {
          setStatusMessage('Unable to load settings.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setStatusMessage('');

    const res = await fetch('/api/client/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: user.name,
        email: user.email,
        settings,
      }),
    });

    if (res.ok) {
      setStatusMessage('Settings saved.');
    } else {
      setStatusMessage('Failed to save settings.');
    }

    setIsSaving(false);
  };

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Settings</p>
            <h1 className={styles.pageTitle}>Control Center</h1>
            <p className={styles.subtitle}>Tune account security, notifications, and portfolio preferences.</p>
          </div>
          <button className={styles.primaryButton} onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </header>

        <section className={styles.grid}>
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Account</h3>
            <div className={styles.row}>
              <div>
                <p className={styles.rowTitle}>Display Name</p>
                <p className={styles.rowSubtitle}>Rise by eden private investor profile.</p>
              </div>
              <input
                className={styles.textInput}
                value={user.name}
                onChange={(event) => setUser((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Your name"
              />
            </div>
            <div className={styles.row}>
              <div>
                <p className={styles.rowTitle}>Email</p>
                <p className={styles.rowSubtitle}>Primary notifications channel.</p>
              </div>
              <input
                className={styles.textInput}
                value={user.email}
                onChange={(event) => setUser((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="you@example.com"
              />
            </div>
            <div className={styles.row}>
              <div>
                <p className={styles.rowTitle}>Account Tier</p>
                <p className={styles.rowSubtitle}>Institutional Prime access.</p>
              </div>
              <span className={styles.rowValue}>{user.role === 'ADMIN' ? 'Admin' : 'Prime'}</span>
            </div>
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Security</h3>
            <label className={styles.toggleRow}>
              <div>
                <p className={styles.rowTitle}>Two-Factor Authentication</p>
                <p className={styles.rowSubtitle}>Require verification on every login.</p>
              </div>
              <input
                type="checkbox"
                className={styles.toggle}
                checked={settings.twoFactorEnabled}
                onChange={(event) => setSettings((prev) => ({ ...prev, twoFactorEnabled: event.target.checked }))}
              />
            </label>
            <label className={styles.toggleRow}>
              <div>
                <p className={styles.rowTitle}>Device Approval</p>
                <p className={styles.rowSubtitle}>Approve new devices before access.</p>
              </div>
              <input
                type="checkbox"
                className={styles.toggle}
                checked={settings.deviceApproval}
                onChange={(event) => setSettings((prev) => ({ ...prev, deviceApproval: event.target.checked }))}
              />
            </label>
            <label className={styles.toggleRow}>
              <div>
                <p className={styles.rowTitle}>Weekly Security Reports</p>
                <p className={styles.rowSubtitle}>Receive system integrity summaries.</p>
              </div>
              <input
                type="checkbox"
                className={styles.toggle}
                checked={settings.weeklySecurityReports}
                onChange={(event) => setSettings((prev) => ({ ...prev, weeklySecurityReports: event.target.checked }))}
              />
            </label>
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Notifications</h3>
            <label className={styles.toggleRow}>
              <div>
                <p className={styles.rowTitle}>Portfolio Alerts</p>
                <p className={styles.rowSubtitle}>Real-time valuation changes.</p>
              </div>
              <input
                type="checkbox"
                className={styles.toggle}
                checked={settings.portfolioAlerts}
                onChange={(event) => setSettings((prev) => ({ ...prev, portfolioAlerts: event.target.checked }))}
              />
            </label>
            <label className={styles.toggleRow}>
              <div>
                <p className={styles.rowTitle}>Acquisition Opportunities</p>
                <p className={styles.rowSubtitle}>Invite-only asset releases.</p>
              </div>
              <input
                type="checkbox"
                className={styles.toggle}
                checked={settings.acquisitionOpportunities}
                onChange={(event) => setSettings((prev) => ({ ...prev, acquisitionOpportunities: event.target.checked }))}
              />
            </label>
            <label className={styles.toggleRow}>
              <div>
                <p className={styles.rowTitle}>Market Reports</p>
                <p className={styles.rowSubtitle}>Monthly research briefings.</p>
              </div>
              <input
                type="checkbox"
                className={styles.toggle}
                checked={settings.marketReports}
                onChange={(event) => setSettings((prev) => ({ ...prev, marketReports: event.target.checked }))}
              />
            </label>
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Preferences</h3>
            <div className={styles.row}>
              <div>
                <p className={styles.rowTitle}>Portfolio Strategy</p>
                <p className={styles.rowSubtitle}>Risk-adjusted profile.</p>
              </div>
              <select
                className={styles.selectInput}
                value={settings.portfolioStrategy}
                onChange={(event) => setSettings((prev) => ({ ...prev, portfolioStrategy: event.target.value }))}
              >
                <option value="Balanced">Balanced</option>
                <option value="Conservative">Conservative</option>
                <option value="Growth">Growth</option>
              </select>
            </div>
            <div className={styles.row}>
              <div>
                <p className={styles.rowTitle}>Default Region</p>
                <p className={styles.rowSubtitle}>Focus market for acquisitions.</p>
              </div>
              <input
                className={styles.textInput}
                value={settings.defaultRegion}
                onChange={(event) => setSettings((prev) => ({ ...prev, defaultRegion: event.target.value }))}
                placeholder="Region"
              />
            </div>
            <div className={styles.row}>
              <div>
                <p className={styles.rowTitle}>Data Sharing</p>
                <p className={styles.rowSubtitle}>Allow anonymized portfolio insights.</p>
              </div>
              <select
                className={styles.selectInput}
                value={settings.dataSharing}
                onChange={(event) => setSettings((prev) => ({ ...prev, dataSharing: event.target.value }))}
              >
                <option value="Limited">Limited</option>
                <option value="Standard">Standard</option>
                <option value="Full">Full</option>
              </select>
            </div>
          </div>
        </section>
        {statusMessage && <p className={styles.statusMessage}>{statusMessage}</p>}
      </main>
    </div>
  );
}

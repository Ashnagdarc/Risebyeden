'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

type ProfilePayload = {
  user: {
    name: string | null;
    email: string | null;
    role: string;
    organization: string | null;
    status: string;
    createdAt: string;
  };
  profile: {
    phone: string | null;
    city: string | null;
    region: string | null;
    country: string | null;
    bio: string | null;
    riskProfile: string | null;
  } | null;
  settings: {
    portfolioStrategy: string | null;
    dataSharing: string | null;
  } | null;
  stats: {
    totalValue: number;
    activeHoldings: number;
    tier: string;
  };
  activities: Array<{
    id: string;
    title: string;
    createdAt: string;
    category: string;
  }>;
};

const fallbackProfile: ProfilePayload = {
  user: {
    name: null,
    email: null,
    role: 'CLIENT',
    organization: null,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  },
  profile: null,
  settings: null,
  stats: {
    totalValue: 0,
    activeHoldings: 0,
    tier: 'Core',
  },
  activities: [],
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 1,
  }).format(value);
}

function formatLocation(profile: ProfilePayload['profile']) {
  if (!profile) {
    return 'Location not set';
  }
  const parts = [profile.city, profile.region, profile.country].filter(Boolean);
  return parts.length ? parts.join(', ') : 'Location not set';
}

export default function ProfilePage() {
  const router = useRouter();
  const [data, setData] = useState<ProfilePayload>(fallbackProfile);
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
        if (isMounted) {
          setData(payload);
        }
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

  const initials = useMemo(() => {
    const name = data.user.name || 'RB';
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [data.user.name]);

  const roleLabel = data.user.role === 'ADMIN' ? 'Administrator' : 'Principal Investor';
  const orgLabel = data.user.organization || 'Rise by eden';
  const riskLabel = data.profile?.riskProfile || data.settings?.portfolioStrategy || 'Balanced';
  const memberSince = new Date(data.user.createdAt).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const verification = data.user.status === 'ACTIVE' ? 'KYC Approved' : 'Pending Review';

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>User Profile</p>
            <h1 className={styles.pageTitle}>Personal Identity</h1>
            <p className={styles.subtitle}>Manage your profile, security, and portfolio visibility.</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.secondaryButton} onClick={() => router.push('/profile/security')}>
              Security
            </button>
            <button className={styles.primaryButton} onClick={() => router.push('/profile/edit')}>
              Edit Profile
            </button>
          </div>
        </header>

        <section className={styles.profileCard}>
          <div className={styles.avatar}>{initials}</div>
          <div className={styles.profileInfo}>
            <h2 className={styles.name}>{data.user.name || 'Investor'}</h2>
            <p className={styles.role}>{roleLabel} · {orgLabel}</p>
            <p className={styles.location}>{formatLocation(data.profile)}</p>
          </div>
          <div className={styles.profileStats}>
            <div>
              <p className={styles.statLabel}>Total Assets</p>
              <p className={styles.statValue}>{formatCurrency(data.stats.totalValue)}</p>
            </div>
            <div>
              <p className={styles.statLabel}>Active Holdings</p>
              <p className={styles.statValue}>{data.stats.activeHoldings}</p>
            </div>
            <div>
              <p className={styles.statLabel}>Risk Tier</p>
              <p className={styles.statValue}>{riskLabel}</p>
            </div>
          </div>
        </section>

        <section className={styles.grid}>
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Profile Overview</h3>
            <div className={styles.panelRow}>
              <span className={styles.panelLabel}>Email</span>
              <span className={styles.panelValue}>{data.user.email || 'Not set'}</span>
            </div>
            <div className={styles.panelRow}>
              <span className={styles.panelLabel}>Phone</span>
              <span className={styles.panelValue}>{data.profile?.phone || 'Not set'}</span>
            </div>
            <div className={styles.panelRow}>
              <span className={styles.panelLabel}>Portfolio Tier</span>
              <span className={styles.panelValue}>{data.stats.tier}</span>
            </div>
            <div className={styles.panelRow}>
              <span className={styles.panelLabel}>Member Since</span>
              <span className={styles.panelValue}>{memberSince}</span>
            </div>
            <div className={styles.panelRow}>
              <span className={styles.panelLabel}>Verification</span>
              <span className={styles.panelValue}>{verification}</span>
            </div>
          </div>

          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Recent Activity</h3>
            {data.activities.length === 0 && (
              <div className={styles.activityItem}>
                <p className={styles.activityTitle}>No recent activity yet.</p>
                <p className={styles.activityMeta}>Activity will appear as you engage with listings.</p>
              </div>
            )}
            {data.activities.map((activity) => (
              <div className={styles.activityItem} key={activity.id}>
                <p className={styles.activityTitle}>{activity.title}</p>
                <p className={styles.activityMeta}>
                  {new Date(activity.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })} · {activity.category}
                </p>
              </div>
            ))}
          </div>
        </section>
        {statusMessage && <p className={styles.statusMessage}>{statusMessage}</p>}
      </main>
    </div>
  );
}

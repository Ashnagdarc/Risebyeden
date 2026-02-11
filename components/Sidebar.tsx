'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    return (
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.logo} aria-label="Go to dashboard" title="Dashboard"></Link>

        {/* Admin Overview */}
        <Link
          href="/admin"
          className={`${styles.navItem} ${pathname === '/admin' ? styles.active : ''}`}
          aria-label="Admin overview"
          title="Admin overview"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </Link>

        {/* Properties */}
        <Link
          href="/admin/properties"
          className={`${styles.navItem} ${pathname === '/admin/properties' ? styles.active : ''}`}
          aria-label="Property presets"
          title="Property presets"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </Link>

        {/* Price History */}
        <Link
          href="/admin/pricing"
          className={`${styles.navItem} ${pathname === '/admin/pricing' ? styles.active : ''}`}
          aria-label="Price history"
          title="Price history"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </Link>

        {/* Client Portfolios */}
        <Link
          href="/admin/clients"
          className={`${styles.navItem} ${pathname === '/admin/clients' ? styles.active : ''}`}
          aria-label="Client portfolios"
          title="Client portfolios"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
        </Link>

        {/* Consultations */}
        <Link
          href="/admin/consultations"
          className={`${styles.navItem} ${pathname === '/admin/consultations' ? styles.active : ''}`}
          aria-label="Consultations"
          title="Consultations"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
            <path d="M8 14h4"></path>
            <path d="M8 18h7"></path>
          </svg>
        </Link>

        {/* Access */}
        <Link
          href="/admin/access"
          className={`${styles.navItem} ${pathname === '/admin/access' ? styles.active : ''}`}
          aria-label="Access"
          title="Access"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            <path d="M9 12l2 2 4-4"></path>
          </svg>
        </Link>

        {/* Invites */}
        <Link
          href="/admin/invites"
          className={`${styles.navItem} ${pathname === '/admin/invites' ? styles.active : ''}`}
          aria-label="Invites"
          title="Invites"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"></path>
            <polyline points="22,7 12,13 2,7"></polyline>
          </svg>
        </Link>

        {/* Interest Requests */}
        <Link
          href="/admin/interest-requests"
          className={`${styles.navItem} ${pathname === '/admin/interest-requests' ? styles.active : ''}`}
          aria-label="Interest requests"
          title="Interest requests"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18"></path>
            <path d="M7 16l4-4 4 3 5-6"></path>
          </svg>
        </Link>

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: '/auth' })}
          className={`${styles.navItem} ${styles.logout}`}
          aria-label="Sign out"
          title="Sign out"
        >
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </aside>
    );
  }

  return (
    <aside className={styles.sidebar}>
      <Link href="/" className={styles.logo} aria-label="Go to dashboard" title="Dashboard"></Link>
      
      <Link
        href="/"
        className={`${styles.navItem} ${pathname === '/' ? styles.active : ''}`}
        aria-label="Overview"
        title="Overview"
      >
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"></rect>
          <rect x="14" y="3" width="7" height="7"></rect>
          <rect x="14" y="14" width="7" height="7"></rect>
          <rect x="3" y="14" width="7" height="7"></rect>
        </svg>
      </Link>
      
      <Link
        href="/analytics"
        className={`${styles.navItem} ${pathname === '/analytics' ? styles.active : ''}`}
        aria-label="Analytics"
        title="Analytics"
      >
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
          <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
        </svg>
      </Link>
      
      <Link
        href="/assets"
        className={`${styles.navItem} ${pathname === '/assets' ? styles.active : ''}`}
        aria-label="Assets"
        title="Assets"
      >
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
      </Link>

      <Link
        href="/profile"
        className={`${styles.navItem} ${pathname === '/profile' ? styles.active : ''}`}
        aria-label="Profile"
        title="Profile"
      >
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      </Link>
      
      <Link
        href="/settings"
        className={`${styles.navItem} ${styles.settings} ${pathname === '/settings' ? styles.active : ''}`}
        aria-label="Settings"
        title="Settings"
      >
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      </Link>

      {/* Logout */}
      <button
        onClick={() => signOut({ callbackUrl: '/auth' })}
        className={`${styles.navItem} ${styles.logout}`}
        aria-label="Sign out"
        title="Sign out"
      >
        <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          <polyline points="16 17 21 12 16 7"></polyline>
          <line x1="21" y1="12" x2="9" y2="12"></line>
        </svg>
      </button>
    </aside>
  );
}

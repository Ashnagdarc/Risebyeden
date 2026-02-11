'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import styles from './Sidebar.module.css';

type NavItem = {
  href: string;
  label: string;
  mobileLabel?: string;
  icon: () => JSX.Element;
  desktopBottom?: boolean;
};

const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);

const PropertyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
    <line x1="12" y1="22.08" x2="12" y2="12"></line>
  </svg>
);

const PricingIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"></line>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const ConsultationsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
    <path d="M8 14h4"></path>
    <path d="M8 18h7"></path>
  </svg>
);

const AccessIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    <path d="M9 12l2 2 4-4"></path>
  </svg>
);

const InvitesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z"></path>
    <polyline points="22,7 12,13 2,7"></polyline>
  </svg>
);

const InterestIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"></path>
    <path d="M7 16l4-4 4 3 5-6"></path>
  </svg>
);

const AnalyticsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
    <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
  </svg>
);

const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const adminNavItems: NavItem[] = [
  { href: '/admin', label: 'Admin overview', mobileLabel: 'Overview', icon: DashboardIcon },
  { href: '/admin/properties', label: 'Property presets', mobileLabel: 'Properties', icon: PropertyIcon },
  { href: '/admin/pricing', label: 'Price history', mobileLabel: 'Pricing', icon: PricingIcon },
  { href: '/admin/clients', label: 'Client portfolios', mobileLabel: 'Clients', icon: UsersIcon },
  { href: '/admin/consultations', label: 'Consultations', mobileLabel: 'Consults', icon: ConsultationsIcon },
  { href: '/admin/access', label: 'Access', mobileLabel: 'Access', icon: AccessIcon },
  { href: '/admin/invites', label: 'Invites', mobileLabel: 'Invites', icon: InvitesIcon },
  { href: '/admin/interest-requests', label: 'Interest requests', mobileLabel: 'Requests', icon: InterestIcon },
];

const clientNavItems: NavItem[] = [
  { href: '/', label: 'Overview', mobileLabel: 'Overview', icon: DashboardIcon },
  { href: '/analytics', label: 'Analytics', mobileLabel: 'Analytics', icon: AnalyticsIcon },
  { href: '/assets', label: 'Assets', mobileLabel: 'Assets', icon: PropertyIcon },
  { href: '/profile', label: 'Profile', mobileLabel: 'Profile', icon: ProfileIcon },
  { href: '/settings', label: 'Settings', mobileLabel: 'Settings', icon: SettingsIcon, desktopBottom: true },
];

const isPathActive = (pathname: string, href: string) => {
  if (href === '/' || href === '/admin') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function Sidebar() {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith('/admin');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = isAdminRoute ? adminNavItems : clientNavItems;
  const mobileMenuLabel = isAdminRoute ? 'Admin menu' : 'Client menu';
  const activeNavItem = navItems.find((item) => isPathActive(pathname, item.href)) || navItems[0];
  const MobilePrimaryIcon = activeNavItem.icon;

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  return (
    <>
      <aside className={styles.sidebar}>
        <Link href="/" className={styles.logo} aria-label="Go to dashboard" title="Dashboard"></Link>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isPathActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''} ${item.desktopBottom ? styles.settings : ''}`}
              aria-label={item.label}
              title={item.label}
              data-tooltip={item.label}
            >
              <Icon />
            </Link>
          );
        })}

        <button
          onClick={() => signOut({ callbackUrl: '/auth' })}
          className={`${styles.navItem} ${styles.logout}`}
          aria-label="Sign out"
          title="Sign out"
          data-tooltip="Sign out"
        >
          <LogoutIcon />
        </button>
      </aside>

      <div className={styles.mobileBar}>
        <Link
          href={activeNavItem.href}
          className={`${styles.mobileBarButton} ${styles.mobileBarButtonActive}`}
          aria-label={activeNavItem.label}
          title={activeNavItem.label}
        >
          <MobilePrimaryIcon />
          <span>{activeNavItem.mobileLabel || activeNavItem.label}</span>
        </Link>
        <button
          type="button"
          className={`${styles.mobileBarButton} ${isMobileMenuOpen ? styles.mobileBarButtonActive : ''}`}
          aria-label={mobileMenuLabel}
          aria-expanded={isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          <MenuIcon />
          <span>Menu</span>
        </button>
        <button
          type="button"
          className={`${styles.mobileBarButton} ${styles.mobileBarDanger}`}
          aria-label="Sign out"
          onClick={() => signOut({ callbackUrl: '/auth' })}
        >
          <LogoutIcon />
          <span>Sign out</span>
        </button>
      </div>

      <button
        type="button"
        aria-label="Close mobile menu"
        className={`${styles.mobileBackdrop} ${isMobileMenuOpen ? styles.mobileBackdropOpen : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></button>

      <nav className={`${styles.mobileDrawer} ${isMobileMenuOpen ? styles.mobileDrawerOpen : ''}`} aria-label={mobileMenuLabel}>
        <div className={styles.mobileDrawerHeader}>
          <div className={styles.mobileDrawerTitle}>{mobileMenuLabel}</div>
          <button
            type="button"
            className={styles.mobileDrawerClose}
            aria-label="Close menu"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <CloseIcon />
          </button>
        </div>

        <div className={styles.mobileDrawerLinks}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = isPathActive(pathname, item.href);
            return (
              <Link
                key={`mobile-${item.href}`}
                href={item.href}
                className={`${styles.mobileDrawerLink} ${isActive ? styles.mobileDrawerLinkActive : ''}`}
              >
                <span className={styles.mobileDrawerIcon}>
                  <Icon />
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            className={`${styles.mobileDrawerLink} ${styles.mobileDrawerLogout}`}
            onClick={() => signOut({ callbackUrl: '/auth' })}
          >
            <span className={styles.mobileDrawerIcon}>
              <LogoutIcon />
            </span>
            <span>Sign out</span>
          </button>
        </div>
      </nav>
    </>
  );
}

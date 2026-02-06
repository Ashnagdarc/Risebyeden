'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './AdminNav.module.css';

const navItems = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/presets', label: 'Presets' },
  { href: '/admin/pricing', label: 'Price History' },
  { href: '/admin/clients', label: 'Client Portfolios' },
  { href: '/admin/access', label: 'Access' },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Admin sections">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`${styles.navLink} ${pathname === item.href ? styles.active : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

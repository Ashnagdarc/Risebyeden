import React from 'react';
import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/Card';
import styles from './Widgets.module.css';

interface ActivityItem {
  id: string;
  title: string;
  createdAt: string;
  href: string;
}

export default function RecentActivityWidget({ activity }: { activity: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader title="Recent Activity" />
      <div className={styles.activityList}>
        {activity.length === 0 ? (
          <div className={styles.activityItemEmpty}>
             <p>No updates yet.</p>
             <p className={styles.activityTime}>Check back soon</p>
          </div>
        ) : (
          activity.map((item) => (
            <Link key={item.id} href={item.href} className={styles.activityLink}>
              <div className={styles.activityItem}>
                <span className={styles.activityDot}></span>
                <div>
                  <p className={styles.activityTitle}>{item.title}</p>
                  <p className={styles.activityTime}>{item.createdAt}</p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </Card>
  );
}

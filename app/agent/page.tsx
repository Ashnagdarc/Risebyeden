import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { QUERY_LIMITS } from '@/lib/db/query-limits';
import styles from '../admin/admin.module.css';

export default async function AgentDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth');
  }

  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role === 'admin') {
    redirect('/admin');
  }
  if (role !== 'agent') {
    redirect('/');
  }

  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    redirect('/auth');
  }

  const [notifications, assignedRequests] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: QUERY_LIMITS.agentNotifications,
      select: {
        id: true,
        title: true,
        body: true,
        read: true,
        createdAt: true,
      },
    }),
    prisma.interestRequest.findMany({
      where: {
        assignedAgentId: userId,
        status: { in: ['SCHEDULED', 'APPROVED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: QUERY_LIMITS.agentAssignedRequests,
      select: {
        id: true,
        status: true,
        createdAt: true,
        assignedAt: true,
        user: {
          select: {
            userId: true,
            name: true,
            email: true,
          },
        },
        property: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Agent</p>
            <h1 className={styles.pageTitle}>Assigned Leads</h1>
            <p className={styles.subtitle}>Reach out to assigned clients as soon as possible and update progress with admin.</p>
          </div>
        </header>

        <section className={styles.grid}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Lead Queue</h2>
            <div className={styles.table}>
              <div className={`${styles.tableHeader} ${styles.tableHeaderActionsWide}`}>
                <div>Request</div>
                <div>Client</div>
                <div>Property</div>
                <div>Status</div>
                <div>Assigned</div>
                <div>Contact</div>
              </div>
              {assignedRequests.length === 0 ? (
                <div className={styles.tableRow}>
                  <div className={styles.tableEmpty}>No assigned requests yet.</div>
                </div>
              ) : (
                assignedRequests.map((request) => (
                  <div key={request.id} className={`${styles.tableRow} ${styles.tableRowActionsWide}`}>
                    <div>{request.id.slice(0, 6).toUpperCase()}</div>
                    <div>{request.user?.name || request.user?.userId || '—'}</div>
                    <div>{request.property?.name || '—'}</div>
                    <div className={`${styles.badge} ${styles.badgeSuccess}`}>{request.status === 'SCHEDULED' ? 'ASSIGNED' : request.status}</div>
                    <div>{new Date(request.assignedAt || request.createdAt).toLocaleString()}</div>
                    <div>{request.user?.email || request.user?.userId || '—'}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Notifications</h2>
            <div className={styles.table}>
              {notifications.length === 0 ? (
                <p className={styles.emptyText}>No notifications yet.</p>
              ) : (
                notifications.map((notification) => (
                  <div key={notification.id} className={styles.statusHintItem}>
                    <div>
                      <div>{notification.title}</div>
                      <div className={styles.emptyText}>{notification.body}</div>
                      <div className={styles.monoText}>{new Date(notification.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

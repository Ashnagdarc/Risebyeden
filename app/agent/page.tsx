import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { QUERY_LIMITS } from '@/lib/db/query-limits';
import styles from '../admin/admin.module.css';
import AgentDashboardClient from './AgentDashboardClient';

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
            organization: true,
            clientProfile: {
              select: {
                phone: true,
                city: true,
                region: true,
                country: true,
              },
            },
          },
        },
        property: {
          select: {
            name: true,
            location: true,
            city: true,
            state: true,
            propertyType: true,
            status: true,
            appreciation: true,
            capRate: true,
            occupancy: true,
          },
        },
      },
    }),
  ]);

  const serializedNotifications = notifications.map((notification) => ({
    ...notification,
    createdAt: notification.createdAt.toISOString(),
  }));

  const serializedAssignedRequests = assignedRequests.map((request) => ({
    ...request,
    createdAt: request.createdAt.toISOString(),
    assignedAt: request.assignedAt ? request.assignedAt.toISOString() : null,
  }));

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

        <AgentDashboardClient
          assignedRequests={serializedAssignedRequests}
          notifications={serializedNotifications}
        />
      </main>
    </div>
  );
}

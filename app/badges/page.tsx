import Image from 'next/image';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { authOptions } from '@/lib/auth';
import { type BadgeGoalType, getClientBadges } from '@/lib/client-badges';
import { getUserOnboardingState } from '@/lib/onboarding-state';
import prisma from '@/lib/prisma';
import { QUERY_LIMITS } from '@/lib/db/query-limits';
import styles from './page.module.css';

export default async function BadgesPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session) {
    redirect('/auth');
  }

  if (role === 'admin') {
    redirect('/admin');
  }

  if (role === 'agent') {
    redirect('/agent');
  }

  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    redirect('/auth');
  }

  const onboardingState = await getUserOnboardingState(userId);
  if (!onboardingState?.onboardingCompleted) {
    redirect('/onboarding');
  }

  const [clientProfile, clientProperties, completedGoalTypes, completedGoals] = await Promise.all([
    prisma.clientProfile.findUnique({
      where: { userId },
      select: { riskProfile: true },
    }),
    prisma.clientProperty.findMany({
      where: { userId },
      take: QUERY_LIMITS.clientProperties,
      select: {
        quantity: true,
        property: {
          select: {
            appreciation: true,
          },
        },
      },
    }),
    prisma.goal.findMany({
      where: { userId, status: 'COMPLETED' },
      select: { type: true },
    }),
    prisma.goal.findMany({
      where: { userId, status: { not: 'ARCHIVED' } },
      select: { longestStreak: true },
    }),
  ]);

  const totalPropertyUnits = clientProperties.reduce((sum, entry) => sum + (entry.quantity || 1), 0);
  const avgAppreciation = clientProperties.length
    ? clientProperties.reduce((sum, entry) => sum + (entry.property.appreciation || 0), 0) / clientProperties.length
    : 0;
  const bestStreak = completedGoals.reduce((max, goal) => Math.max(max, goal.longestStreak), 0);

  const badges = getClientBadges({
    totalPropertyUnits,
    avgAppreciation,
    completedGoalCount: completedGoalTypes.length,
    completedGoalTypes: completedGoalTypes.map((goal) => goal.type as BadgeGoalType),
    bestStreak,
    experienceKey: (clientProfile?.riskProfile || 'new').toLowerCase(),
  });

  const earnedBadges = badges.filter((badge) => badge.unlocked);
  const upcomingBadges = badges.filter((badge) => !badge.unlocked);

  return (
    <div className={styles.container}>
      <Sidebar />
      <main className={styles.main}>
        <header className={styles.header}>
          <p className={styles.kicker}>Progress</p>
          <h1 className={styles.pageTitle}>Badge Vault</h1>
          <p className={styles.subtitle}>Your earned achievements and next badge targets.</p>
        </header>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Earned Badges</h2>
            <p>{earnedBadges.length}/{badges.length} unlocked</p>
          </div>
          <div className={styles.grid}>
            {earnedBadges.length === 0 ? (
              <p className={styles.empty}>No badges earned yet.</p>
            ) : (
              earnedBadges.map((badge) => (
                <article key={badge.id} className={`${styles.card} ${styles.cardUnlocked}`}>
                  <Image src={badge.image} alt={badge.title} className={styles.badgeImage} />
                  <div>
                    <p className={styles.badgeName}>{badge.title}</p>
                    <p className={styles.badgeDescription}>{badge.description}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Next Targets</h2>
            <p>{upcomingBadges.length} to go</p>
          </div>
          <div className={styles.grid}>
            {upcomingBadges.map((badge) => (
              <article key={badge.id} className={styles.card}>
                <Image src={badge.image} alt={badge.title} className={styles.badgeImage} />
                <div>
                  <p className={styles.badgeName}>{badge.title}</p>
                  <p className={styles.badgeDescription}>{badge.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

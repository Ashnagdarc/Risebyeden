import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import PropertyRow from '@/components/PropertyRow';

import OverviewRow from '@/components/dashboard/OverviewRow';
import PortfolioAllocationWidget from '@/components/dashboard/PortfolioAllocationWidget';
import PortfolioSignalsWidget from '@/components/dashboard/PortfolioSignalsWidget';
import GrowthPersonaWidget from '@/components/dashboard/GrowthPersonaWidget';
import GoalsWidget from '@/components/dashboard/GoalsWidget';
import RecentActivityWidget from '@/components/dashboard/RecentActivityWidget';
import QuickActionsWidget from '@/components/dashboard/QuickActionsWidget';

import { authOptions } from '@/lib/auth';
import { type BadgeGoalType, getClientBadges } from '@/lib/client-badges';
import { getUserOnboardingState } from '@/lib/onboarding-state';
import prisma from '@/lib/prisma';
import { QUERY_LIMITS } from '@/lib/db/query-limits';
import { buildGoalPortfolioSnapshot, calculateGoalProgress, getGoalCountdownLabel } from '@/lib/goals';
import { buildPortfolioMonthlyHistory } from '@/lib/portfolio-history';
import styles from './page.module.css';

export default async function Home() {
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

  const [clientProfile, userSettings] = await Promise.all([
    prisma.clientProfile.findUnique({
      where: { userId },
      select: { riskProfile: true },
    }),
    prisma.userSettings.findUnique({
      where: { userId },
      select: { portfolioStrategy: true },
    }),
  ]);

  const clientProperties = await prisma.clientProperty.findMany({
    where: { userId },
    orderBy: { purchasedAt: 'desc' },
    take: QUERY_LIMITS.clientProperties,
    select: {
      quantity: true,
      purchasePrice: true,
      purchasedAt: true,
      property: {
        select: {
          id: true,
          name: true,
          location: true,
          city: true,
          state: true,
          propertyType: true,
          appreciation: true,
          capRate: true,
          basePrice: true,
          occupancy: true,
          priceUpdates: {
            orderBy: { effectiveDate: 'asc' },
            select: {
              price: true,
              effectiveDate: true,
            },
          },
        },
      },
    },
  });

  const gradientClasses = [
    styles.propGradientObsidian,
    styles.propGradientVeridian,
    styles.propGradientGilded,
  ];

  const properties = clientProperties.map((entry, index) => {
    const property = entry.property;
    const locationParts = [property.location, property.city, property.state].filter(Boolean);
    const basePrice = property.basePrice ? Number(property.basePrice) : 0;
    const valuation = basePrice;
    return {
      id: property.id,
      name: property.name,
      location: locationParts.join(', ') || 'Location pending',
      type: property.propertyType || 'Residential',
      appreciation: `+${(property.appreciation || 0).toFixed(1)}%`,
      capRate: `${(property.capRate || 0).toFixed(1)}%`,
      valuation: valuation >= 1000000 ? `$${(valuation / 1000000).toFixed(1)}M` : `$${valuation.toLocaleString()}`,
      gradientClass: gradientClasses[index % gradientClasses.length],
      occupancy: property.occupancy || 0,
      capRateValue: property.capRate || 0,
      appreciationValue: property.appreciation || 0,
    };
  });

  const totalValue = clientProperties.reduce((sum, entry) => {
    const quantity = entry.quantity || 1;
    const basePrice = entry.property.basePrice ? Number(entry.property.basePrice) : 0;
    return sum + quantity * basePrice;
  }, 0);
  const totalPropertyUnits = clientProperties.reduce((sum, entry) => sum + (entry.quantity || 1), 0);
  const userName = (session?.user as { name?: string } | undefined)?.name?.split(' ')[0] || 'Investor';

  const investedBasis = clientProperties.reduce((sum, entry) => {
    const quantity = entry.quantity || 1;
    const purchasePrice = entry.purchasePrice ? Number(entry.purchasePrice) : null;
    const fallbackBasePrice = entry.property.basePrice ? Number(entry.property.basePrice) : 0;
    return sum + quantity * (purchasePrice ?? fallbackBasePrice);
  }, 0);

  const avgOccupancy = properties.length
    ? properties.reduce((sum, property) => sum + property.occupancy, 0) / properties.length
    : 0;
  const avgCapRate = properties.length
    ? properties.reduce((sum, property) => sum + property.capRateValue, 0) / properties.length
    : 0;
  const avgAppreciation = properties.length
    ? properties.reduce((sum, property) => sum + property.appreciationValue, 0) / properties.length
    : 0;
  const portfolioDeltaPercent =
    investedBasis > 0
      ? ((totalValue - investedBasis) / investedBasis) * 100
      : avgAppreciation;

  const portfolioTrend = buildPortfolioMonthlyHistory(
    clientProperties.map((entry) => ({
      quantity: entry.quantity,
      purchasePrice: entry.purchasePrice ? Number(entry.purchasePrice) : null,
      purchasedAt: entry.purchasedAt,
      property: {
        basePrice: entry.property.basePrice ? Number(entry.property.basePrice) : null,
        priceUpdates: entry.property.priceUpdates.map((update) => ({
          price: Number(update.price),
          effectiveDate: update.effectiveDate,
        })),
      },
    }))
  );

  const typeTotals = clientProperties.reduce((acc, entry) => {
    const propertyType = entry.property.propertyType || 'Residential';
    const quantity = entry.quantity || 1;
    const basePrice = entry.property.basePrice ? Number(entry.property.basePrice) : 0;
    acc[propertyType] = (acc[propertyType] || 0) + quantity * basePrice;
    return acc;
  }, {} as Record<string, number>);

  const allocationPalette = [
    { color: '#c5a368', swatchClass: styles.swatchGold },
    { color: '#60a5fa', swatchClass: styles.swatchBlue },
    { color: '#4ade80', swatchClass: styles.swatchGreen },
    { color: '#f87171', swatchClass: styles.swatchRed },
    { color: '#9f7aea', swatchClass: styles.swatchLilac },
  ];
  const allocationData = Object.entries(typeTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], index) => ({
      label,
      rawValue: value,
      value: totalValue > 0 ? Number(((value / totalValue) * 100).toFixed(1)) : 0,
      color: allocationPalette[index % allocationPalette.length].color,
      swatchClass: allocationPalette[index % allocationPalette.length].swatchClass,
    }));

  const dominantAllocation = allocationData[0] || null;
  const topPerformer = [...properties].sort((a, b) => b.appreciationValue - a.appreciationValue)[0] || null;
  const performanceBars = [
    {
      label: 'Occupancy strength',
      value: Math.max(0, Math.min(100, avgOccupancy)),
      displayValue: `${avgOccupancy.toFixed(1)}%`,
    },
    {
      label: 'Yield efficiency',
      value: Math.max(0, Math.min(100, avgCapRate * 10)),
      displayValue: `${avgCapRate.toFixed(1)}%`,
    },
    {
      label: 'Appreciation momentum',
      value: Math.max(0, Math.min(100, avgAppreciation * 10)),
      displayValue: `${avgAppreciation >= 0 ? '+' : ''}${avgAppreciation.toFixed(1)}%`,
    },
  ];

  const ownedPropertyIds = clientProperties.map((entry) => entry.property.id);

  const [completedGoalTypes, recentPurchases, recentCompletedGoals, recentPriceUpdates] = await Promise.all([
    prisma.goal.findMany({
      where: { userId, status: 'COMPLETED' },
      select: { type: true },
    }),
    prisma.clientProperty.findMany({
      where: { userId },
      orderBy: { purchasedAt: 'desc' },
      take: 4,
      select: {
        id: true,
        quantity: true,
        purchasedAt: true,
        property: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.goal.findMany({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: { not: null },
      },
      orderBy: { completedAt: 'desc' },
      take: 4,
      select: {
        id: true,
        title: true,
        completedAt: true,
      },
    }),
    ownedPropertyIds.length > 0
      ? prisma.priceUpdate.findMany({
          where: {
            propertyId: { in: ownedPropertyIds },
          },
          orderBy: { effectiveDate: 'desc' },
          take: 4,
          select: {
            id: true,
            price: true,
            effectiveDate: true,
            property: {
              select: {
                name: true,
              },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const recentActivity = [
    ...recentPurchases.map((purchase) => ({
      id: `purchase-${purchase.id}`,
      title: `Acquired ${purchase.quantity || 1} x ${purchase.property.name}`,
      createdAt: purchase.purchasedAt,
      href: '/assets',
    })),
    ...recentCompletedGoals.map((goal) => ({
      id: `goal-${goal.id}`,
      title: `Completed goal: ${goal.title}`,
      createdAt: goal.completedAt as Date,
      href: '/goals',
    })),
    ...recentPriceUpdates.map((update) => ({
      id: `price-${update.id}`,
      title: `Price updated: ${update.property.name} to $${Math.round(Number(update.price)).toLocaleString()}`,
      createdAt: update.effectiveDate,
      href: '/assets',
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 4);

  const formatRelativeTime = (value: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - value.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    }
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return `${diffHours} hours ago`;
    }
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  const formatGoalMetric = (type: string, value: number) => {
    if (type === 'ASSET_VALUE') {
      return `₦${Math.round(value).toLocaleString()}`;
    }

    if (type === 'PROPERTY_APPRECIATION') {
      return `${value.toFixed(1)}%`;
    }

    return `${Math.round(value).toLocaleString()}`;
  };

  const experienceLabelMap: Record<string, string> = {
    new: 'First-time investor',
    starter: 'Getting started',
    growing: 'Building momentum',
    established: 'Established investor',
  };

  const focusLabelMap: Record<string, string> = {
    residential: 'Residential',
    commercial: 'Commercial',
    land: 'Land & Plots',
    mixed: 'Mixed Portfolio',
  };

  const profileExperienceKey = (clientProfile?.riskProfile || 'new').toLowerCase();
  const currentExperienceKey =
    totalPropertyUnits >= 5
      ? 'established'
      : totalPropertyUnits >= 3
      ? 'growing'
      : totalPropertyUnits >= 1
      ? 'starter'
      : profileExperienceKey;
  const currentExperienceLabel = experienceLabelMap[currentExperienceKey] || 'First-time investor';
  const focusKeys = (userSettings?.portfolioStrategy || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const focusLabels = focusKeys
    .map((key) => focusLabelMap[key])
    .filter(Boolean);
  const signalCards = [
    {
      id: 'allocation',
      title: 'Dominant allocation',
      value: dominantAllocation ? `${dominantAllocation.value.toFixed(1)}%` : '0%',
      detail: dominantAllocation ? dominantAllocation.label : 'No allocation yet',
    },
    {
      id: 'top-asset',
      title: 'Top performer',
      value: topPerformer ? topPerformer.name : 'No assets yet',
      detail: topPerformer ? `${topPerformer.appreciation} appreciation` : 'Start acquiring to unlock performance data',
    },
    {
      id: 'focus',
      title: 'Portfolio focus',
      value: focusLabels.length ? focusLabels[0] : 'Unassigned',
      detail: focusLabels.length > 1 ? focusLabels.slice(1).join(' • ') : 'Set a strategy in Settings to personalize recommendations',
    },
    {
      id: 'delta',
      title: 'Net portfolio delta',
      value: `${portfolioDeltaPercent >= 0 ? '+' : ''}${portfolioDeltaPercent.toFixed(1)}%`,
      detail: investedBasis > 0 ? 'Relative to invested cost basis' : 'Tracking live appreciation average',
    },
  ];

  const goalSnapshot = buildGoalPortfolioSnapshot(
    clientProperties.map((entry) => ({
      quantity: entry.quantity,
      purchasePrice: entry.purchasePrice ? Number(entry.purchasePrice) : null,
      property: {
        id: entry.property.id,
        name: entry.property.name,
        location: entry.property.location,
        city: entry.property.city,
        appreciation: entry.property.appreciation,
        basePrice: entry.property.basePrice ? Number(entry.property.basePrice) : null,
      },
    }))
  );

  let dashboardGoals: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    countdownLabel: string;
    progressPercent: number;
    currentMetric: string;
    targetMetric: string;
  }> = [];

  try {
    const goals = await prisma.goal.findMany({
      where: {
        userId,
        status: {
          in: ['ACTIVE', 'COMPLETED', 'EXPIRED'],
        },
      },
      orderBy: [{ status: 'asc' }, { targetDate: 'asc' }, { createdAt: 'desc' }],
      take: 3,
    });

    const now = new Date();
    dashboardGoals = goals.map((goal) => {
      const computed = calculateGoalProgress(
        {
          type: goal.type,
          targetDate: goal.targetDate,
          targetValue: goal.targetValue ? Number(goal.targetValue) : 0,
          targetCount: goal.targetCount,
          targetPercent: goal.targetPercent,
          referencePropertyId: goal.referencePropertyId,
          referenceLabel: goal.referenceLabel,
          currentValue: goal.currentValue ? Number(goal.currentValue) : 0,
        },
        goalSnapshot,
        now
      );

      const resolvedStatus =
        goal.status === 'ACTIVE' && computed.isComplete
          ? 'COMPLETED'
          : goal.status === 'ACTIVE' && computed.isExpired
          ? 'EXPIRED'
          : goal.status;

      return {
        id: goal.id,
        title: goal.title,
        type: goal.type,
        status: resolvedStatus,
        countdownLabel: getGoalCountdownLabel(resolvedStatus, computed.daysLeft),
        progressPercent: computed.progressPercent,
        currentMetric: formatGoalMetric(goal.type, computed.currentValue),
        targetMetric: formatGoalMetric(goal.type, computed.targetValue),
      };
    });
  } catch (error) {
    console.error('Failed to load goals preview', error);
  }

  const levelConfig: Record<string, { next: string | null; targetUnits: number; questTitle: string }> = {
    new: {
      next: 'starter',
      targetUnits: 1,
      questTitle: 'Acquire your first property to unlock Getting Started tier',
    },
    starter: {
      next: 'growing',
      targetUnits: 3,
      questTitle: 'Scale to 3 properties to unlock Building Momentum tier',
    },
    growing: {
      next: 'established',
      targetUnits: 5,
      questTitle: 'Grow to 5 properties to unlock Established Investor tier',
    },
    established: {
      next: null,
      targetUnits: 5,
      questTitle: 'Maintain elite performance and keep compounding your portfolio',
    },
  };

  const currentLevel = levelConfig[currentExperienceKey] || levelConfig.new;
  const nextExperienceLabel = currentLevel.next ? experienceLabelMap[currentLevel.next] : 'Elite Growth Track';
  const levelProgressPercent = Math.min(100, (totalPropertyUnits / currentLevel.targetUnits) * 100);
  const xpPoints = Math.round(totalValue / 1000000) + dashboardGoals.filter((goal) => goal.status === 'COMPLETED').length * 50;
  const primeGoal = dashboardGoals.find((goal) => goal.status === 'ACTIVE') || dashboardGoals[0] || null;

  const badgeMetrics = {
    totalPropertyUnits,
    avgAppreciation,
    completedGoalCount: completedGoalTypes.length,
    completedGoalTypes: completedGoalTypes.map((goal) => goal.type as BadgeGoalType),
    bestStreak: 0,
    experienceKey: currentExperienceKey,
  };

  const badges = getClientBadges(badgeMetrics);
  const unlockedBadges = badges.filter((badge) => badge.unlocked);
  const topUnlockedBadges = unlockedBadges.slice(0, 3);
  const nextBadge = badges.find((badge) => !badge.unlocked) || null;
  const activeDashboardGoals = dashboardGoals.filter((goal) => goal.status === 'ACTIVE').slice(0, 3);

  const unlockedBadgeCount = badges.filter((badge) => badge.unlocked).length;
  const activeDashboardGoalCount = dashboardGoals.filter((goal) => goal.status === 'ACTIVE').length;

  return (
    <div className={styles.container}>
      <Sidebar />
      
      <main className={styles.main}>
        <Header
          totalValue={totalValue}
          deltaPercent={portfolioDeltaPercent}
          userName={userName}
          totalUnits={totalPropertyUnits}
          activeGoals={activeDashboardGoalCount}
          trendPoints={portfolioTrend}
        />
        
        <section className={styles.gridLayout}>
          {/* LEFT COLUMN: Strong Analytics & Assets */}
          <div className={styles.leftColumn}>
            <OverviewRow 
              metrics={[
                { label: 'Avg. Cap Rate', value: avgCapRate.toFixed(1), unit: '%', trendText: 'Yield efficiency across portfolio' },
                { label: 'Avg. Occupancy', value: avgOccupancy.toFixed(1), unit: '%', trendText: 'Unit utilisation rate' },
                { label: 'Avg. Appreciation', value: `${avgAppreciation >= 0 ? '+' : ''}${avgAppreciation.toFixed(1)}`, unit: '%', trendText: 'Capital growth trend', isPositive: avgAppreciation >= 0 },
                { label: 'Total Invested', value: investedBasis >= 1000000 ? `$${(investedBasis / 1000000).toFixed(1)}M` : `$${investedBasis.toLocaleString()}`, unit: '', trendText: 'Cost basis deployed' },
              ]}
            />

            <div className={styles.analyticsBand}>
              <PortfolioAllocationWidget data={allocationData} />
              <PortfolioSignalsWidget signals={signalCards} performanceBars={performanceBars} />
            </div>

            <div className={styles.propertyListSlab}>
              <div className={styles.sectionHeader}>
                <h2>Asset Distribution</h2>
                <Link href="/assets" className={styles.viewAll}>View All Assets →</Link>
              </div>

              {properties.map((property) => (
                <PropertyRow
                  key={property.id}
                  id={property.id}
                  name={property.name}
                  location={property.location}
                  type={property.type}
                  appreciation={property.appreciation}
                  capRate={property.capRate}
                  valuation={property.valuation}
                  gradientClass={property.gradientClass}
                />
              ))}
            </div>
            
            <RecentActivityWidget activity={recentActivity.map(a => ({
               ...a,
               createdAt: formatRelativeTime(a.createdAt)
            }))} />
          </div>

          {/* RIGHT COLUMN: Momentum & Activity */}
          <div className={styles.rightColumn}>
            <QuickActionsWidget />
            
            <GoalsWidget goals={activeDashboardGoals} />
            
            <GrowthPersonaWidget 
              xpPoints={xpPoints}
              currentExperienceLabel={currentExperienceLabel}
              focusLabels={focusLabels}
              currentLevel={currentLevel}
              totalPropertyUnits={totalPropertyUnits}
              nextExperienceLabel={nextExperienceLabel}
              levelProgressPercent={levelProgressPercent}
              primeGoal={primeGoal}
              unlockedBadgeCount={unlockedBadgeCount}
              totalBadgesCount={badges.length}
              topUnlockedBadges={topUnlockedBadges}
              nextBadge={nextBadge}
            />
          </div>
        </section>
      </main>
    </div>
  );
}


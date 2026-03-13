'use client';

import confetti from 'canvas-confetti';
import Image from 'next/image';
import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import TrendSparkline from '@/components/TrendSparkline';
import {
  type BadgeGoalType,
  type ClientBadge,
  type ClientBadgeMetrics,
  formatRewardPreview,
  getClientBadges,
  getGoalCompletionReward,
} from '@/lib/client-badges';
import styles from './page.module.css';

type GoalTypeValue = 'ASSET_VALUE' | 'PROPERTY_COUNT' | 'PROPERTY_APPRECIATION' | 'PROJECT_PLOT_COUNT' | 'CUSTOM';
type GoalStatusValue = 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'ARCHIVED';

type GoalItem = {
  id: string;
  title: string;
  description: string | null;
  type: GoalTypeValue;
  status: GoalStatusValue;
  targetDate: string | null;
  targetValue: number;
  targetCount: number | null;
  targetPercent: number | null;
  currentValue: number;
  progressPercent: number;
  daysLeft: number | null;
  countdownLabel: string;
  streakCount: number;
  longestStreak: number;
  lastCheckInAt: string | null;
  referenceLabel: string | null;
  referenceProperty: { id: string; name: string } | null;
  canCheckIn: boolean;
};

type GoalSummary = {
  activeCount: number;
  completedCount: number;
  expiredCount: number;
  averageProgress: number;
  bestStreak: number;
};

type PortfolioOption = {
  id: string;
  name: string;
  location: string;
};

type PortfolioStats = {
  totalUnits: number;
  avgAppreciation: number;
  totalValue: number;
  monthlyHistory: Array<{ label: string; value: number }>;
};

type GoalFormState = {
  title: string;
  description: string;
  type: GoalTypeValue;
  targetDate: string;
  targetValue: string;
  targetCount: string;
  targetPercent: string;
  referencePropertyId: string;
  referenceLabel: string;
  currentValue: string;
};

const fallbackSummary: GoalSummary = {
  activeCount: 0,
  completedCount: 0,
  expiredCount: 0,
  averageProgress: 0,
  bestStreak: 0,
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMetric(type: GoalTypeValue, value: number) {
  if (type === 'ASSET_VALUE') {
    return formatCurrency(value);
  }

  if (type === 'PROPERTY_APPRECIATION') {
    return `${value.toFixed(1)}%`;
  }

  return `${Math.round(value).toLocaleString()}`;
}

function typeLabel(type: GoalTypeValue) {
  switch (type) {
    case 'ASSET_VALUE':
      return 'Asset Value';
    case 'PROPERTY_COUNT':
      return 'Property Count';
    case 'PROPERTY_APPRECIATION':
      return 'Property ROI';
    case 'PROJECT_PLOT_COUNT':
      return 'Project Plot Count';
    case 'CUSTOM':
      return 'Custom';
    default:
      return 'Goal';
  }
}

function statusLabel(status: GoalStatusValue) {
  if (status === 'ACTIVE') {
    return 'On Track';
  }
  if (status === 'COMPLETED') {
    return 'Completed';
  }
  if (status === 'EXPIRED') {
    return 'Expired';
  }
  return 'Archived';
}

const initialForm: GoalFormState = {
  title: '',
  description: '',
  type: 'ASSET_VALUE',
  targetDate: '',
  targetValue: '',
  targetCount: '',
  targetPercent: '',
  referencePropertyId: '',
  referenceLabel: '',
  currentValue: '',
};

const fallbackPortfolioStats: PortfolioStats = {
  totalUnits: 0,
  avgAppreciation: 0,
  totalValue: 0,
  monthlyHistory: [],
};

type CelebrationTier = 'small' | 'medium' | 'big';

const streakRewards: Array<{ days: number; label: string; xp: number; tier: CelebrationTier }> = [
  { days: 3, label: 'Spark Starter', xp: 30, tier: 'small' },
  { days: 7, label: 'Consistency Keeper', xp: 60, tier: 'small' },
  { days: 14, label: 'Momentum Builder', xp: 120, tier: 'medium' },
  { days: 21, label: 'Rhythm Maker', xp: 180, tier: 'medium' },
  { days: 30, label: 'Elite Closer', xp: 300, tier: 'big' },
];

function getMilestoneReward(streakCount: number) {
  return streakRewards.find((reward) => reward.days === streakCount) || null;
}

function buildBadgeMetrics(goals: GoalItem[], stats: PortfolioStats): ClientBadgeMetrics {
  const completedGoals = goals.filter((goal) => goal.status === 'COMPLETED');

  return {
    totalPropertyUnits: stats.totalUnits,
    avgAppreciation: stats.avgAppreciation,
    completedGoalCount: completedGoals.length,
    completedGoalTypes: completedGoals.map((goal) => goal.type),
    bestStreak: goals.reduce((max, goal) => Math.max(max, goal.longestStreak), 0),
  };
}

function getCelebrationTier(badges: ClientBadge[]): CelebrationTier {
  if (badges.some((badge) => badge.tier === 'platinum')) {
    return 'big';
  }

  if (badges.some((badge) => badge.tier === 'gold')) {
    return 'medium';
  }

  return 'small';
}

type CelebrationState = {
  goalTitles: string[];
  badges: ClientBadge[];
  xp: number;
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [summary, setSummary] = useState<GoalSummary>(fallbackSummary);
  const [portfolioOptions, setPortfolioOptions] = useState<PortfolioOption[]>([]);
  const [portfolioStats, setPortfolioStats] = useState<PortfolioStats>(fallbackPortfolioStats);
  const [form, setForm] = useState<GoalFormState>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);
  const hasLoadedGoalsRef = useRef(false);
  const previousGoalStatusesRef = useRef<Map<string, GoalStatusValue>>(new Map());
  const previousBadgeMetricsRef = useRef<ClientBadgeMetrics | null>(null);

  const activeGoals = useMemo(() => goals.filter((goal) => goal.status === 'ACTIVE'), [goals]);
  const completedGoals = useMemo(() => goals.filter((goal) => goal.status === 'COMPLETED'), [goals]);
  const badgeMetrics = useMemo(() => buildBadgeMetrics(goals, portfolioStats), [goals, portfolioStats]);
  const monthlyHistory = portfolioStats.monthlyHistory;

  const launchTierCelebration = useCallback((tier: CelebrationTier) => {
    if (tier === 'small') {
      confetti({
        particleCount: 70,
        spread: 62,
        startVelocity: 36,
        scalar: 0.8,
        origin: { y: 0.72 },
        colors: ['#c5a368', '#f3e9d2', '#ffffff'],
      });
      return;
    }

    if (tier === 'medium') {
      confetti({
        particleCount: 130,
        spread: 86,
        startVelocity: 42,
        scalar: 0.9,
        origin: { y: 0.7 },
        colors: ['#c5a368', '#f3e9d2', '#ffffff'],
      });
      confetti({
        particleCount: 80,
        spread: 102,
        startVelocity: 32,
        scalar: 0.78,
        origin: { x: 0.2, y: 0.68 },
        colors: ['#c5a368', '#0f0f0f', '#ffffff'],
      });
      confetti({
        particleCount: 80,
        spread: 102,
        startVelocity: 32,
        scalar: 0.78,
        origin: { x: 0.8, y: 0.68 },
        colors: ['#c5a368', '#0f0f0f', '#ffffff'],
      });
      return;
    }

    confetti({
      particleCount: 190,
      spread: 98,
      startVelocity: 46,
      scalar: 1,
      origin: { y: 0.68 },
      colors: ['#c5a368', '#f3e9d2', '#ffffff'],
    });
    confetti({
      particleCount: 130,
      spread: 120,
      startVelocity: 34,
      scalar: 0.92,
      origin: { x: 0.15, y: 0.65 },
      colors: ['#c5a368', '#0f0f0f', '#ffffff'],
    });
    confetti({
      particleCount: 130,
      spread: 120,
      startVelocity: 34,
      scalar: 0.92,
      origin: { x: 0.85, y: 0.65 },
      colors: ['#c5a368', '#0f0f0f', '#ffffff'],
    });
  }, []);

  const celebrateCompletedGoals = useCallback((goalTitles: string[]) => {
    goalTitles.forEach((_, index) => {
      window.setTimeout(() => {
        confetti({
          particleCount: 110,
          spread: 72,
          startVelocity: 42,
          scalar: 0.9,
          origin: { y: 0.72 },
          colors: ['#c5a368', '#f3e9d2', '#ffffff'],
        });

        confetti({
          particleCount: 70,
          spread: 96,
          startVelocity: 34,
          scalar: 0.75,
          origin: { x: 0.25, y: 0.68 },
          colors: ['#c5a368', '#0f0f0f', '#ffffff'],
        });

        confetti({
          particleCount: 70,
          spread: 96,
          startVelocity: 34,
          scalar: 0.75,
          origin: { x: 0.75, y: 0.68 },
          colors: ['#c5a368', '#0f0f0f', '#ffffff'],
        });
      }, index * 240);
    });
  }, []);

  const loadGoals = useCallback(async () => {
    setIsLoading(true);

    try {
      const [goalsRes, portfolioRes] = await Promise.all([
        fetch('/api/client/goals'),
        fetch('/api/client/portfolio'),
      ]);

      if (!goalsRes.ok) {
        throw new Error('Failed to load goals');
      }

      const goalsPayload = await goalsRes.json();
      const nextGoals = goalsPayload.goals || [];
      const newlyCompletedGoals: GoalItem[] = [];

      if (hasLoadedGoalsRef.current) {
        nextGoals.forEach((goal: GoalItem) => {
          const previousStatus = previousGoalStatusesRef.current.get(goal.id);
          if (previousStatus && previousStatus !== 'COMPLETED' && goal.status === 'COMPLETED') {
            newlyCompletedGoals.push(goal);
          }
        });
      }

      setGoals(nextGoals);
      setSummary(goalsPayload.summary || fallbackSummary);

      let nextPortfolioStats = fallbackPortfolioStats;

      previousGoalStatusesRef.current = new Map(
        nextGoals.map((goal: GoalItem) => [goal.id, goal.status])
      );

      if (portfolioRes.ok) {
        const portfolioPayload = await portfolioRes.json();
        setPortfolioOptions(
          (portfolioPayload.assets || []).map((asset: { id: string; name: string; location: string }) => ({
            id: asset.id,
            name: asset.name,
            location: asset.location,
          }))
        );

        nextPortfolioStats = {
          totalUnits: Number(portfolioPayload.stats?.totalUnits || 0),
          avgAppreciation: Number(portfolioPayload.stats?.avgAppreciation || 0),
          totalValue: Number(portfolioPayload.stats?.totalValue || 0),
          monthlyHistory: portfolioPayload.stats?.monthlyHistory || [],
        };
        setPortfolioStats(nextPortfolioStats);
      }

      const nextBadgeMetrics = buildBadgeMetrics(nextGoals, nextPortfolioStats);

      if (!hasLoadedGoalsRef.current) {
        hasLoadedGoalsRef.current = true;
      } else if (newlyCompletedGoals.length > 0) {
        const previousBadgeMetrics = previousBadgeMetricsRef.current || nextBadgeMetrics;
        const previousUnlockedBadgeIds = new Set(
          getClientBadges(previousBadgeMetrics)
            .filter((badge) => badge.unlocked)
            .map((badge) => badge.id)
        );
        const currentBadges = getClientBadges(nextBadgeMetrics);
        const newlyUnlockedBadges = currentBadges.filter(
          (badge) => badge.unlocked && !previousUnlockedBadgeIds.has(badge.id)
        );

        let rewardXp = 0;
        let rewardMetrics = previousBadgeMetrics;

        newlyCompletedGoals.forEach((goal: GoalItem) => {
          const reward = getGoalCompletionReward(rewardMetrics, goal.type as BadgeGoalType);
          rewardXp += reward.xp;
          rewardMetrics = {
            ...rewardMetrics,
            completedGoalCount: rewardMetrics.completedGoalCount + 1,
            completedGoalTypes: rewardMetrics.completedGoalTypes.includes(goal.type as BadgeGoalType)
              ? rewardMetrics.completedGoalTypes
              : [...rewardMetrics.completedGoalTypes, goal.type as BadgeGoalType],
          };
        });

        celebrateCompletedGoals(newlyCompletedGoals.map((goal: GoalItem) => goal.title));
        window.setTimeout(() => {
          launchTierCelebration(getCelebrationTier(newlyUnlockedBadges));
        }, 180);

        setCelebration({
          goalTitles: newlyCompletedGoals.map((goal: GoalItem) => goal.title),
          badges: newlyUnlockedBadges,
          xp: rewardXp,
        });
      }

      previousBadgeMetricsRef.current = nextBadgeMetrics;

      return { newlyCompletedGoals };
    } catch {
      setStatusMessage('Unable to load goals right now.');
      return { newlyCompletedGoals: [] };
    } finally {
      setIsLoading(false);
    }
  }, [celebrateCompletedGoals, launchTierCelebration]);

  useEffect(() => {
    void loadGoals();
  }, [loadGoals]);

  const formRequires = useMemo(() => {
    return {
      requiresTargetValue: form.type === 'ASSET_VALUE' || form.type === 'CUSTOM',
      requiresTargetCount: form.type === 'PROPERTY_COUNT' || form.type === 'PROJECT_PLOT_COUNT',
      requiresTargetPercent: form.type === 'PROPERTY_APPRECIATION',
      requiresReferenceLabel: form.type === 'PROJECT_PLOT_COUNT',
      allowsCurrentValue: form.type === 'CUSTOM',
      requiresProperty: form.type === 'PROPERTY_APPRECIATION',
    };
  }, [form.type]);

  async function handleCreateGoal(event: FormEvent) {
    event.preventDefault();
    setStatusMessage('');
    setIsSubmitting(true);

    const payload: Record<string, unknown> = {
      title: form.title,
      description: form.description || null,
      type: form.type,
    };

    if (form.targetDate) {
      payload.targetDate = new Date(form.targetDate).toISOString();
    }

    if (form.targetValue) {
      payload.targetValue = Number(form.targetValue);
    }
    if (form.targetCount) {
      payload.targetCount = Number(form.targetCount);
    }
    if (form.targetPercent) {
      payload.targetPercent = Number(form.targetPercent);
    }
    if (form.referenceLabel) {
      payload.referenceLabel = form.referenceLabel;
    }
    if (form.referencePropertyId) {
      payload.referencePropertyId = form.referencePropertyId;
    }
    if (form.currentValue) {
      payload.currentValue = Number(form.currentValue);
    }

    try {
      const response = await fetch('/api/client/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create goal');
      }

      setForm((prev) => ({
        ...initialForm,
        type: prev.type,
      }));
      await loadGoals();
      setStatusMessage('Goal created.');
    } catch {
      setStatusMessage('Goal could not be created. Check the fields and try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCheckIn(goalId: string) {
    setStatusMessage('');

    try {
      const response = await fetch(`/api/client/goals/${goalId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error('Failed to check in');
      }

      const checkInPayload = await response.json().catch(() => null);
      const streakCount = Number(checkInPayload?.streakCount || 0);
      const milestoneReward = getMilestoneReward(streakCount);

      const result = await loadGoals();

      if (milestoneReward) {
        launchTierCelebration(milestoneReward.tier);
      }

      setStatusMessage(
        milestoneReward
          ? `${milestoneReward.label} unlocked: +${milestoneReward.xp} XP (${streakCount} day streak).`
          : result.newlyCompletedGoals.length > 0
          ? result.newlyCompletedGoals.length === 1
            ? `${result.newlyCompletedGoals[0].title} completed.`
            : `${result.newlyCompletedGoals.length} goals completed.`
          : 'Streak updated.'
      );
    } catch {
      setStatusMessage('Check-in failed.');
    }
  }

  async function handleArchive(goalId: string) {
    setStatusMessage('');

    try {
      const response = await fetch(`/api/client/goals/${goalId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to archive');
      }

      await loadGoals();
      setStatusMessage('Goal archived.');
    } catch {
      setStatusMessage('Unable to archive this goal.');
    }
  }

  return (
    <div className={styles.container}>
      <Sidebar />

      <main className={styles.main}>
        <header className={styles.headerBand}>
          <div className={styles.headerTop}>
            <div>
              <p className={styles.kicker}>Gamified Goals</p>
              <h1 className={styles.pageTitle}>Goal Tracker</h1>
              <p className={styles.subtitle}>Set targets, track countdowns, maintain streak momentum, and keep goals tied to real portfolio growth.</p>

              <div className={styles.segmentedNav}>
                <Link href="/" className={styles.segmentLink}>Overview</Link>
                <Link href="/analytics" className={styles.segmentLink}>Analytics</Link>
                <Link href="/goals" className={`${styles.segmentLink} ${styles.segmentLinkActive}`}>Goals</Link>
              </div>
            </div>

            <div className={styles.headerActions}>
              <Link href="/assets" className={styles.secondaryLink}>View Assets</Link>
              <a href="#goal-creation" className={styles.primaryLink}>Create Goal</a>
            </div>
          </div>

          <div className={styles.headerBottom}>
            <div className={styles.heroSummary}>
              <article className={styles.heroCard}>
                <p className={styles.heroLabel}>Active Goals</p>
                <p className={styles.heroValue}>{summary.activeCount}</p>
                <p className={styles.heroMeta}>{summary.averageProgress.toFixed(1)}% average progress</p>
              </article>
              <article className={styles.heroCard}>
                <p className={styles.heroLabel}>Best Streak</p>
                <p className={styles.heroValue}>{summary.bestStreak}d</p>
                <p className={styles.heroMeta}>{summary.completedCount} goals completed</p>
              </article>
              <article className={styles.heroCard}>
                <p className={styles.heroLabel}>Portfolio Base</p>
                <p className={styles.heroValue}>{formatCurrency(portfolioStats.totalValue)}</p>
                <p className={styles.heroMeta}>{portfolioStats.totalUnits} units tracked</p>
              </article>
            </div>

            <div className={styles.trendPanel}>
              <div className={styles.trendHeader}>
                <div>
                  <p className={styles.heroLabel}>Portfolio Value Curve</p>
                  <p className={styles.trendTitle}>Goal context over time</p>
                </div>
                <div className={styles.trendMetaBlock}>
                  <strong>{formatCurrency(monthlyHistory[monthlyHistory.length - 1]?.value || 0)}</strong>
                  <span>Latest value</span>
                </div>
              </div>
              <div className={styles.trendChartShell}>
                <TrendSparkline
                  data={monthlyHistory}
                  ariaLabel="Goal portfolio trend chart"
                  valueFormat="currencyNgn"
                />
              </div>
            </div>
          </div>
        </header>

        <section className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Active</p>
            <p className={styles.summaryValue}>{summary.activeCount}</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Completed</p>
            <p className={styles.summaryValue}>{summary.completedCount}</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Avg Progress</p>
            <p className={styles.summaryValue}>{summary.averageProgress.toFixed(1)}%</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Best Streak</p>
            <p className={styles.summaryValue}>{summary.bestStreak}d</p>
          </div>
        </section>

        <section className={styles.rewardPanel}>
          <div className={styles.rewardHeader}>
            <div>
              <p className={styles.rewardKicker}>Streak Rewards</p>
              <h2 className={styles.rewardTitle}>Milestone rewards unlock as consistency grows.</h2>
            </div>
            <p className={styles.rewardMeta}>Current best: {summary.bestStreak} days</p>
          </div>

          <div className={styles.rewardGrid}>
            {streakRewards.map((reward) => {
              const unlocked = summary.bestStreak >= reward.days;
              return (
                <article
                  key={reward.days}
                  className={`${styles.rewardCard} ${unlocked ? styles.rewardCardUnlocked : styles.rewardCardLocked}`}
                >
                  <div className={styles.rewardCardTop}>
                    <span className={styles.rewardTier}>{reward.tier.toUpperCase()} TIER</span>
                    <span className={styles.rewardDays}>{reward.days}d</span>
                  </div>
                  <h3 className={styles.rewardName}>{reward.label}</h3>
                  <p className={styles.rewardXp}>+{reward.xp} XP</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className={styles.focusPanel}>
          <div className={styles.focusHeader}>
            <div>
              <p className={styles.focusKicker}>Selected Goals</p>
              <h2 className={styles.focusTitle}>What the client is working toward right now.</h2>
            </div>
            <p className={styles.focusMeta}>{activeGoals.length} active goals in motion</p>
          </div>

          {activeGoals.length === 0 ? (
            <p className={styles.placeholder}>No active goals yet. Create one to start building momentum.</p>
          ) : (
            <div className={styles.focusGrid}>
              {activeGoals.map((goal) => {
                const rewardPreview = getGoalCompletionReward(badgeMetrics, goal.type as BadgeGoalType);
                const targetMetric =
                  goal.type === 'PROPERTY_COUNT' || goal.type === 'PROJECT_PLOT_COUNT'
                    ? goal.targetCount || goal.targetValue
                    : goal.type === 'PROPERTY_APPRECIATION'
                    ? goal.targetPercent || goal.targetValue
                    : goal.targetValue;

                return (
                  <article key={goal.id} className={styles.focusCard}>
                    <div className={styles.focusCardTop}>
                      <span className={styles.focusType}>{typeLabel(goal.type)}</span>
                      <span className={styles.focusCountdown}>{goal.countdownLabel}</span>
                    </div>
                    <h3 className={styles.focusCardTitle}>{goal.title}</h3>
                    {goal.description && <p className={styles.focusDescription}>{goal.description}</p>}
                    <progress className={styles.progressTrack} value={goal.progressPercent} max={100}></progress>
                    <div className={styles.focusMetrics}>
                      <span>
                        {formatMetric(goal.type, goal.currentValue)} / {formatMetric(goal.type, targetMetric || 0)}
                      </span>
                      <span>{goal.progressPercent.toFixed(1)}%</span>
                    </div>
                    <div className={styles.rewardPreview}>
                      {rewardPreview.badges[0] ? (
                        <Image
                          src={rewardPreview.badges[0].image}
                          alt={rewardPreview.badges[0].title}
                          className={styles.rewardPreviewImage}
                        />
                      ) : (
                        <div className={styles.rewardPreviewFallback}>XP</div>
                      )}
                      <div>
                        <p className={styles.rewardPreviewLabel}>Completion Reward</p>
                        <p className={styles.rewardPreviewText}>{formatRewardPreview(rewardPreview)}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className={styles.layoutGrid}>
          <div className={styles.contentColumn}>
            <div className={styles.panel} id="goal-creation">
              <div className={styles.panelHeader}>
                <div>
                  <p className={styles.panelTitle}>Goals In Motion</p>
                  <p className={styles.panelSubtitle}>These are the goals currently driving the client dashboard.</p>
                </div>
              </div>
            {isLoading && <p className={styles.placeholder}>Loading goals...</p>}
            {!isLoading && activeGoals.length === 0 && (
              <p className={styles.placeholder}>No active goals yet. Create one to start your streak.</p>
            )}
            <div className={styles.goalList}>
              {activeGoals.map((goal) => {
                const rewardPreview = getGoalCompletionReward(badgeMetrics, goal.type as BadgeGoalType);
                const targetMetric =
                  goal.type === 'PROPERTY_COUNT' || goal.type === 'PROJECT_PLOT_COUNT'
                    ? goal.targetCount || goal.targetValue
                    : goal.type === 'PROPERTY_APPRECIATION'
                    ? goal.targetPercent || goal.targetValue
                    : goal.targetValue;

                return (
                  <article key={goal.id} className={styles.goalCard}>
                    <div className={styles.goalHead}>
                      <div>
                        <p className={styles.goalType}>{typeLabel(goal.type)}</p>
                        <h3 className={styles.goalTitle}>{goal.title}</h3>
                      </div>
                      <div className={styles.goalMeta}>
                        <span className={styles.statusBadge}>{statusLabel(goal.status)}</span>
                        <span>{goal.countdownLabel}</span>
                      </div>
                    </div>

                    {goal.description && <p className={styles.goalDescription}>{goal.description}</p>}

                    <progress className={styles.progressTrack} value={goal.progressPercent} max={100}></progress>

                    <div className={styles.goalStats}>
                      <span>
                        {formatMetric(goal.type, goal.currentValue)} / {formatMetric(goal.type, targetMetric || 0)}
                      </span>
                      <span>{goal.progressPercent.toFixed(1)}%</span>
                    </div>

                    <div className={styles.rewardPreviewRow}>
                      {rewardPreview.badges[0] ? (
                        <Image
                          src={rewardPreview.badges[0].image}
                          alt={rewardPreview.badges[0].title}
                          className={styles.rewardPreviewImage}
                        />
                      ) : (
                        <div className={styles.rewardPreviewFallback}>XP</div>
                      )}
                      <div>
                        <p className={styles.rewardPreviewLabel}>Reward On Completion</p>
                        <p className={styles.rewardPreviewText}>{formatRewardPreview(rewardPreview)}</p>
                      </div>
                    </div>

                    <div className={styles.goalFooter}>
                      <span>Streak {goal.streakCount}d</span>
                      <div className={styles.goalActions}>
                        <button
                          type="button"
                          className={styles.secondaryButton}
                          onClick={() => handleCheckIn(goal.id)}
                          disabled={!goal.canCheckIn}
                        >
                          {goal.canCheckIn ? 'Check In' : 'Checked Today'}
                        </button>
                        <button
                          type="button"
                          className={styles.ghostButton}
                          onClick={() => handleArchive(goal.id)}
                        >
                          Archive
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {completedGoals.length > 0 && (
              <>
                <div className={styles.sectionDivider}></div>
                <div className={styles.completedHeader}>
                  <p className={styles.panelTitle}>Completed Goals</p>
                  <p className={styles.panelSubtitle}>Closed wins stay visible here for momentum and proof of progress.</p>
                </div>
                <div className={styles.completedGrid}>
                  {completedGoals.map((goal) => (
                    <article key={goal.id} className={styles.completedCard}>
                      <div className={styles.completedCardTop}>
                        <span className={styles.completedType}>{typeLabel(goal.type)}</span>
                        <span className={styles.completedBadge}>Completed</span>
                      </div>
                      <h3 className={styles.completedTitle}>{goal.title}</h3>
                      {goal.description && <p className={styles.completedDescription}>{goal.description}</p>}
                      <p className={styles.completedMeta}>Finished with {goal.progressPercent.toFixed(1)}% progress and a {goal.longestStreak} day best streak.</p>
                    </article>
                  ))}
                </div>
              </>
            )}
            </div>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <p className={styles.panelTitle}>Create Goal</p>
                <p className={styles.panelSubtitle}>Add a new target when the client wants to expand beyond the onboarding picks.</p>
              </div>
            </div>
            <form className={styles.form} onSubmit={handleCreateGoal}>
              <label className={styles.label}>
                Title
                <input
                  className={styles.input}
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Buy 5 properties before Q2"
                  required
                />
              </label>

              <label className={styles.label}>
                Type
                <select
                  className={styles.input}
                  value={form.type}
                  onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as GoalTypeValue }))}
                >
                  <option value="ASSET_VALUE">Asset Value</option>
                  <option value="PROPERTY_COUNT">Property Count</option>
                  <option value="PROPERTY_APPRECIATION">Property ROI</option>
                  <option value="PROJECT_PLOT_COUNT">Project Plot Count</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </label>

              <label className={styles.label}>
                Deadline (Optional)
                <input
                  type="datetime-local"
                  className={styles.input}
                  value={form.targetDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, targetDate: event.target.value }))}
                />
              </label>

              {formRequires.requiresTargetValue && (
                <label className={styles.label}>
                  Target Value
                  <input
                    type="number"
                    className={styles.input}
                    value={form.targetValue}
                    onChange={(event) => setForm((prev) => ({ ...prev, targetValue: event.target.value }))}
                    placeholder="10000000000"
                    min={0}
                    step="0.01"
                    required={form.type === 'ASSET_VALUE'}
                  />
                </label>
              )}

              {formRequires.requiresTargetCount && (
                <label className={styles.label}>
                  Target Count
                  <input
                    type="number"
                    className={styles.input}
                    value={form.targetCount}
                    onChange={(event) => setForm((prev) => ({ ...prev, targetCount: event.target.value }))}
                    placeholder="6"
                    min={1}
                    step="1"
                    required
                  />
                </label>
              )}

              {formRequires.requiresTargetPercent && (
                <label className={styles.label}>
                  Target ROI (%)
                  <input
                    type="number"
                    className={styles.input}
                    value={form.targetPercent}
                    onChange={(event) => setForm((prev) => ({ ...prev, targetPercent: event.target.value }))}
                    placeholder="100"
                    min={0}
                    step="0.1"
                    required
                  />
                </label>
              )}

              {formRequires.requiresProperty && (
                <label className={styles.label}>
                  Property
                  <select
                    className={styles.input}
                    value={form.referencePropertyId}
                    onChange={(event) => setForm((prev) => ({ ...prev, referencePropertyId: event.target.value }))}
                    required
                  >
                    <option value="">Select Property</option>
                    {portfolioOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name} {option.location ? `(${option.location})` : ''}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {formRequires.requiresReferenceLabel && (
                <label className={styles.label}>
                  Project Name
                  <input
                    className={styles.input}
                    value={form.referenceLabel}
                    onChange={(event) => setForm((prev) => ({ ...prev, referenceLabel: event.target.value }))}
                    placeholder="Gracefield"
                    required
                  />
                </label>
              )}

              {formRequires.allowsCurrentValue && (
                <label className={styles.label}>
                  Current Value (Optional)
                  <input
                    type="number"
                    className={styles.input}
                    value={form.currentValue}
                    onChange={(event) => setForm((prev) => ({ ...prev, currentValue: event.target.value }))}
                    placeholder="0"
                    min={0}
                    step="0.01"
                  />
                </label>
              )}

              <label className={styles.label}>
                Description (Optional)
                <textarea
                  className={styles.textarea}
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Short motivation or context"
                />
              </label>

              <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Goal'}
              </button>
            </form>
          </div>
        </section>

        {statusMessage && <p className={styles.statusMessage}>{statusMessage}</p>}

        {celebration && (
          <div className={styles.celebrationOverlay} onClick={() => setCelebration(null)}>
            <div className={styles.celebrationModal} onClick={(event) => event.stopPropagation()}>
              <p className={styles.celebrationKicker}>Goal Complete</p>
              <h2 className={styles.celebrationTitle}>
                {celebration.goalTitles.length === 1
                  ? celebration.goalTitles[0]
                  : `${celebration.goalTitles.length} goals completed`}
              </h2>
              <p className={styles.celebrationText}>
                You earned +{celebration.xp} XP
                {celebration.badges.length > 0
                  ? ` and unlocked ${celebration.badges.length === 1 ? 'a new badge' : 'new badges'}.`
                  : '.'}
              </p>

              {celebration.badges.length > 0 && (
                <div className={styles.celebrationBadgeGrid}>
                  {celebration.badges.map((badge) => (
                    <article key={badge.id} className={styles.celebrationBadgeCard}>
                      <Image src={badge.image} alt={badge.title} className={styles.celebrationBadgeImage} />
                      <p className={styles.celebrationBadgeTitle}>{badge.title}</p>
                      <p className={styles.celebrationBadgeMeta}>{badge.tier.toUpperCase()} BADGE</p>
                    </article>
                  ))}
                </div>
              )}

              <button type="button" className={styles.primaryButton} onClick={() => setCelebration(null)}>
                Continue
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

import type { StaticImageData } from 'next/image';
import goldBadge from '@/lib/Badges/gold badge.png';
import platinumBadge from '@/lib/Badges/platinum badge.png';
import silverBadge from '@/lib/Badges/silver badge.png';

export type BadgeGoalType =
  | 'ASSET_VALUE'
  | 'PROPERTY_COUNT'
  | 'PROPERTY_APPRECIATION'
  | 'PROJECT_PLOT_COUNT'
  | 'CUSTOM';

export type BadgeTier = 'silver' | 'gold' | 'platinum';

export type ClientBadgeMetrics = {
  totalPropertyUnits: number;
  avgAppreciation: number;
  completedGoalCount: number;
  completedGoalTypes: BadgeGoalType[];
  bestStreak: number;
  experienceKey?: string;
};

export type ClientBadge = {
  id: string;
  title: string;
  description: string;
  tier: BadgeTier;
  source: 'growth' | 'goal';
  image: StaticImageData;
  unlocked: boolean;
};

export type GoalCompletionReward = {
  xp: number;
  badges: ClientBadge[];
  tier: BadgeTier;
};

type BadgeRule = Omit<ClientBadge, 'unlocked'> & {
  isUnlocked: (metrics: ClientBadgeMetrics) => boolean;
};

const tierImages: Record<BadgeTier, StaticImageData> = {
  silver: silverBadge,
  gold: goldBadge,
  platinum: platinumBadge,
};

const tierRank: Record<BadgeTier, number> = {
  silver: 1,
  gold: 2,
  platinum: 3,
};

const goalXpRewards: Record<BadgeGoalType, number> = {
  ASSET_VALUE: 120,
  PROPERTY_COUNT: 90,
  PROPERTY_APPRECIATION: 140,
  PROJECT_PLOT_COUNT: 110,
  CUSTOM: 80,
};

const badgeRules: BadgeRule[] = [
  {
    id: 'deal-starter',
    title: 'Deal Starter',
    description: 'Acquire your first property unit.',
    tier: 'silver',
    source: 'growth',
    image: tierImages.silver,
    isUnlocked: (metrics) => metrics.totalPropertyUnits >= 1,
  },
  {
    id: 'goal-closer',
    title: 'Goal Closer',
    description: 'Complete your first goal.',
    tier: 'silver',
    source: 'goal',
    image: tierImages.silver,
    isUnlocked: (metrics) => metrics.completedGoalCount >= 1,
  },
  {
    id: 'portfolio-builder',
    title: 'Portfolio Builder',
    description: 'Grow to 3 property units.',
    tier: 'gold',
    source: 'growth',
    image: tierImages.gold,
    isUnlocked: (metrics) => metrics.totalPropertyUnits >= 3,
  },
  {
    id: 'momentum-master',
    title: 'Momentum Master',
    description: 'Complete 3 goals or build a 7-day streak.',
    tier: 'gold',
    source: 'goal',
    image: tierImages.gold,
    isUnlocked: (metrics) => metrics.completedGoalCount >= 3 || metrics.bestStreak >= 7,
  },
  {
    id: 'yield-elite',
    title: 'Yield Elite',
    description: 'Hit 10% average appreciation or complete an appreciation goal.',
    tier: 'platinum',
    source: 'growth',
    image: tierImages.platinum,
    isUnlocked: (metrics) =>
      metrics.avgAppreciation >= 10 || metrics.completedGoalTypes.includes('PROPERTY_APPRECIATION'),
  },
  {
    id: 'empire-status',
    title: 'Empire Status',
    description: 'Reach 5 property units or the established investor tier.',
    tier: 'platinum',
    source: 'growth',
    image: tierImages.platinum,
    isUnlocked: (metrics) => metrics.totalPropertyUnits >= 5 || metrics.experienceKey === 'established',
  },
];

export function getClientBadges(metrics: ClientBadgeMetrics): ClientBadge[] {
  return badgeRules.map((rule) => ({
    ...rule,
    unlocked: rule.isUnlocked(metrics),
  }));
}

export function getGoalCompletionReward(
  metrics: ClientBadgeMetrics,
  goalType: BadgeGoalType
): GoalCompletionReward {
  const currentBadges = getClientBadges(metrics);
  const completedGoalTypes = metrics.completedGoalTypes.includes(goalType)
    ? metrics.completedGoalTypes
    : [...metrics.completedGoalTypes, goalType];
  const afterCompletionMetrics: ClientBadgeMetrics = {
    ...metrics,
    completedGoalCount: metrics.completedGoalCount + 1,
    completedGoalTypes,
  };
  const afterCompletionBadges = getClientBadges(afterCompletionMetrics);
  const newlyUnlockedBadges = afterCompletionBadges.filter((badge) => {
    const current = currentBadges.find((item) => item.id === badge.id);
    return badge.unlocked && !current?.unlocked;
  });

  const tier = newlyUnlockedBadges.reduce<BadgeTier>((highest, badge) => {
    return tierRank[badge.tier] > tierRank[highest] ? badge.tier : highest;
  }, 'silver');

  return {
    xp: goalXpRewards[goalType] || 80,
    badges: newlyUnlockedBadges,
    tier,
  };
}

export function formatRewardPreview(reward: GoalCompletionReward): string {
  if (reward.badges.length === 0) {
    return `+${reward.xp} XP`;
  }

  const badgeLabel = reward.badges.map((badge) => badge.title).join(' + ');
  return `${badgeLabel} + ${reward.xp} XP`;
}

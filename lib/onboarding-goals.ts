import type { GoalType } from '@prisma/client';

export type OnboardingGoalTemplate = {
  id: string;
  title: string;
  description: string;
  type: GoalType;
  targetValue?: number;
  targetCount?: number;
  targetPercent?: number;
  referenceLabel?: string;
};

export type OnboardingDurationOption = {
  id: string;
  label: string;
  months: number;
};

export const ONBOARDING_DURATION_OPTIONS: OnboardingDurationOption[] = [
  { id: '3m', label: '3 months', months: 3 },
  { id: '6m', label: '6 months', months: 6 },
  { id: '12m', label: '12 months', months: 12 },
  { id: '24m', label: '24 months', months: 24 },
];

export const ONBOARDING_GOAL_CATALOG: OnboardingGoalTemplate[] = [
  {
    id: 'goal-buy-first-property',
    title: 'Buy my first property',
    description: 'Start your real estate journey with your first completed property purchase.',
    type: 'PROPERTY_COUNT',
    targetCount: 1,
  },
  {
    id: 'goal-buy-second-property',
    title: 'Buy my second property',
    description: 'Build early momentum by securing a second property in your portfolio.',
    type: 'PROPERTY_COUNT',
    targetCount: 2,
  },
  {
    id: 'goal-buy-third-property',
    title: 'Build up to 3 properties',
    description: 'Create a stronger base by growing to three properties over time.',
    type: 'PROPERTY_COUNT',
    targetCount: 3,
  },
  {
    id: 'goal-buy-fourth-property',
    title: 'Build up to 4 properties',
    description: 'Keep expanding your portfolio with a clear fourth-property target.',
    type: 'PROPERTY_COUNT',
    targetCount: 4,
  },
  {
    id: 'goal-buy-fifth-property',
    title: 'Grow to 5 properties',
    description: 'Set a bigger portfolio-building target around five total properties.',
    type: 'PROPERTY_COUNT',
    targetCount: 5,
  },
  {
    id: 'goal-project-first-plot',
    title: 'Secure my first project plot',
    description: 'Get started with your first plot in a project you believe in.',
    type: 'PROJECT_PLOT_COUNT',
    targetCount: 1,
    referenceLabel: 'Preferred Project',
  },
  {
    id: 'goal-grow-portfolio-value-100',
    title: 'Reach N100M in portfolio value',
    description: 'Push toward a stronger portfolio milestone that still feels achievable.',
    type: 'ASSET_VALUE',
    targetValue: 100000000,
  },
  {
    id: 'goal-grow-portfolio-value',
    title: 'Grow my portfolio value to N150M',
    description: 'Push your holdings toward a stronger six-figure portfolio benchmark.',
    type: 'ASSET_VALUE',
    targetValue: 150000000,
  },
  {
    id: 'goal-grow-portfolio-value-50',
    title: 'Reach N50M in portfolio value',
    description: 'Set an achievable mid-stage portfolio milestone to work toward.',
    type: 'ASSET_VALUE',
    targetValue: 50000000,
  },
  {
    id: 'goal-grow-portfolio-value-250',
    title: 'Reach N250M in portfolio value',
    description: 'Push toward a higher value target as your next big benchmark.',
    type: 'ASSET_VALUE',
    targetValue: 250000000,
  },
  {
    id: 'goal-appreciation-10',
    title: 'Target 10% appreciation growth',
    description: 'Track a clear appreciation milestone across your current holdings.',
    type: 'PROPERTY_APPRECIATION',
    targetPercent: 10,
  },
  {
    id: 'goal-appreciation-15',
    title: 'Target 15% appreciation growth',
    description: 'Aim for accelerated appreciation on your current holdings.',
    type: 'PROPERTY_APPRECIATION',
    targetPercent: 15,
  },
  {
    id: 'goal-appreciation-20',
    title: 'Target 20% appreciation growth',
    description: 'Aim for stronger capital growth across your current portfolio.',
    type: 'PROPERTY_APPRECIATION',
    targetPercent: 20,
  },
  {
    id: 'goal-project-plots-2',
    title: 'Secure 2 project plots',
    description: 'Grow your project exposure with two plots in a target location.',
    type: 'PROJECT_PLOT_COUNT',
    targetCount: 2,
    referenceLabel: 'Preferred Project',
  },
  {
    id: 'goal-project-plots-4',
    title: 'Secure 4 project plots',
    description: 'Scale your position in a preferred project with four total plots.',
    type: 'PROJECT_PLOT_COUNT',
    targetCount: 4,
    referenceLabel: 'Preferred Project',
  },
];

const GOAL_TEMPLATE_MAP = new Map(ONBOARDING_GOAL_CATALOG.map((goal) => [goal.id, goal]));

export function getOnboardingGoalTemplate(goalId: string): OnboardingGoalTemplate | null {
  return GOAL_TEMPLATE_MAP.get(goalId) || null;
}

export function addMonthsToDate(source: Date, months: number): Date {
  const result = new Date(source);
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);

  const maxDayInTargetMonth = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  const desiredDay = Math.min(source.getUTCDate(), maxDayInTargetMonth);
  result.setUTCDate(desiredDay);
  result.setUTCHours(23, 59, 59, 999);
  return result;
}

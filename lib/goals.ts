import { GoalType } from '@prisma/client';

const MS_IN_DAY = 24 * 60 * 60 * 1000;

type PortfolioProperty = {
  id: string;
  name: string;
  location: string;
  city: string;
  appreciation: number;
  quantity: number;
  valuation: number;
};

export type GoalPortfolioSnapshot = {
  totalAssetValue: number;
  totalPropertyCount: number;
  averageAppreciation: number;
  properties: PortfolioProperty[];
};

export type GoalComputationInput = {
  type: GoalType;
  targetDate?: Date | null;
  targetValue?: number | null;
  targetCount?: number | null;
  targetPercent?: number | null;
  referencePropertyId?: string | null;
  referenceLabel?: string | null;
  currentValue?: number | null;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function roundTo(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function resolveGoalTarget(goal: GoalComputationInput): number {
  if (goal.type === GoalType.PROPERTY_COUNT || goal.type === GoalType.PROJECT_PLOT_COUNT) {
    return Number(goal.targetCount || 0);
  }

  if (goal.type === GoalType.PROPERTY_APPRECIATION) {
    return Number(goal.targetPercent || 0);
  }

  return Number(goal.targetValue || 0);
}

function resolveProjectCount(snapshot: GoalPortfolioSnapshot, projectLabel: string | null | undefined): number {
  const normalized = projectLabel?.trim().toLowerCase();
  if (!normalized) {
    return 0;
  }

  return snapshot.properties.reduce((sum, property) => {
    const haystack = `${property.name} ${property.location} ${property.city}`.toLowerCase();
    if (!haystack.includes(normalized)) {
      return sum;
    }
    return sum + property.quantity;
  }, 0);
}

function resolvePropertyAppreciation(snapshot: GoalPortfolioSnapshot, referencePropertyId: string | null | undefined): number {
  if (referencePropertyId) {
    const property = snapshot.properties.find((entry) => entry.id === referencePropertyId);
    return property ? property.appreciation : 0;
  }

  return snapshot.averageAppreciation;
}

export function calculateGoalCurrentValue(goal: GoalComputationInput, snapshot: GoalPortfolioSnapshot): number {
  switch (goal.type) {
    case GoalType.ASSET_VALUE:
      return snapshot.totalAssetValue;
    case GoalType.PROPERTY_COUNT:
      return snapshot.totalPropertyCount;
    case GoalType.PROPERTY_APPRECIATION:
      return resolvePropertyAppreciation(snapshot, goal.referencePropertyId);
    case GoalType.PROJECT_PLOT_COUNT:
      return resolveProjectCount(snapshot, goal.referenceLabel);
    case GoalType.CUSTOM:
      return Number(goal.currentValue || 0);
    default:
      return 0;
  }
}

export function calculateGoalProgress(goal: GoalComputationInput, snapshot: GoalPortfolioSnapshot, now = new Date()) {
  const target = resolveGoalTarget(goal);
  const current = calculateGoalCurrentValue(goal, snapshot);
  const progressPercent = target > 0 ? clamp((current / target) * 100, 0, 100) : 0;
  const daysLeft = goal.targetDate ? Math.ceil((goal.targetDate.getTime() - now.getTime()) / MS_IN_DAY) : null;
  const isComplete = progressPercent >= 100;
  const isExpired = daysLeft != null && daysLeft < 0 && !isComplete;

  return {
    currentValue: roundTo(current),
    targetValue: roundTo(target),
    progressPercent: roundTo(progressPercent),
    daysLeft,
    isComplete,
    isExpired,
  };
}

export function buildGoalPortfolioSnapshot(
  entries: Array<{
    quantity: number;
    purchasePrice?: number | null;
    property: {
      id: string;
      name: string;
      location?: string | null;
      city?: string | null;
      appreciation?: number | null;
      basePrice?: number | null;
    };
  }>
): GoalPortfolioSnapshot {
  const properties = entries.map((entry) => {
    const quantity = entry.quantity || 1;
    const fallbackPrice = Number(entry.property.basePrice || 0);
    const purchasePrice = Number(entry.purchasePrice || 0);
    const valuation = quantity * (purchasePrice > 0 ? purchasePrice : fallbackPrice);

    return {
      id: entry.property.id,
      name: entry.property.name,
      location: entry.property.location || '',
      city: entry.property.city || '',
      appreciation: Number(entry.property.appreciation || 0),
      quantity,
      valuation,
    };
  });

  const totalAssetValue = properties.reduce((sum, property) => sum + property.valuation, 0);
  const totalPropertyCount = properties.reduce((sum, property) => sum + property.quantity, 0);
  const averageAppreciation = properties.length
    ? properties.reduce((sum, property) => sum + property.appreciation, 0) / properties.length
    : 0;

  return {
    totalAssetValue: roundTo(totalAssetValue),
    totalPropertyCount,
    averageAppreciation: roundTo(averageAppreciation),
    properties,
  };
}

export function getGoalCountdownLabel(
  goalStatus: 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'ARCHIVED',
  daysLeft: number | null
) {
  if (goalStatus === 'COMPLETED') {
    return 'Completed';
  }

  if (daysLeft == null) {
    return 'No deadline';
  }

  if (goalStatus === 'EXPIRED' || (goalStatus === 'ACTIVE' && daysLeft < 0)) {
    return `${Math.abs(daysLeft)}d overdue`;
  }

  if (daysLeft === 0) {
    return 'Ends today';
  }

  return `${daysLeft}d left`;
}

export function isSameUtcDay(a: Date, b: Date) {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function isPreviousUtcDay(previous: Date, now: Date) {
  const previousMidnight = Date.UTC(previous.getUTCFullYear(), previous.getUTCMonth(), previous.getUTCDate());
  const nowMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return nowMidnight - previousMidnight === MS_IN_DAY;
}

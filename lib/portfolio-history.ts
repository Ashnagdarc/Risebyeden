type PriceUpdateEntry = {
  price: number | null;
  effectiveDate: Date;
};

type PortfolioHistoryEntry = {
  quantity: number | null;
  purchasePrice: number | null;
  purchasedAt: Date;
  property: {
    basePrice: number | null;
    priceUpdates: PriceUpdateEntry[];
  };
};

export type PortfolioHistoryPoint = {
  label: string;
  value: number;
};

export function buildPortfolioMonthlyHistory(entries: PortfolioHistoryEntry[], months = 6): PortfolioHistoryPoint[] {
  const now = new Date();
  const monthStarts = Array.from({ length: months }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1);
    date.setHours(0, 0, 0, 0);
    return date;
  });

  return monthStarts.map((monthStart, index) => {
    const nextMonthStart =
      index === monthStarts.length - 1
        ? new Date(now)
        : new Date(monthStarts[index + 1].getTime());

    const valuationBoundary =
      index === monthStarts.length - 1
        ? now
        : new Date(nextMonthStart.getTime() - 1);

    const value = entries.reduce((sum, entry) => {
      if (entry.purchasedAt > valuationBoundary) {
        return sum;
      }

      const latestHistoricalPrice = [...entry.property.priceUpdates]
        .sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime())
        .filter((update) => update.effectiveDate <= valuationBoundary)
        .pop();

      const unitValue = latestHistoricalPrice?.price ?? entry.purchasePrice ?? entry.property.basePrice ?? 0;
      return sum + (entry.quantity || 1) * unitValue;
    }, 0);

    return {
      label: monthStart.toLocaleString('en-US', { month: 'short' }),
      value,
    };
  });
}
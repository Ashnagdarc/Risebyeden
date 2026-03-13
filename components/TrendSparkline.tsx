'use client';

import { useId, useMemo, useState } from 'react';
import styles from './TrendSparkline.module.css';

type TrendPoint = {
  label: string;
  value: number;
};

type TrendSparklineProps = {
  data: TrendPoint[];
  ariaLabel: string;
  valueFormat?: 'compactUsd' | 'currencyUsd' | 'currencyNgn';
};

const formatByMode = (value: number, mode: NonNullable<TrendSparklineProps['valueFormat']>) => {
  if (mode === 'currencyNgn') {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);
  }
  if (mode === 'currencyUsd') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }
  if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${Math.round(value).toLocaleString()}`;
};

export default function TrendSparkline({ data, ariaLabel, valueFormat = 'compactUsd' }: TrendSparklineProps) {
  const gradientId = useId().replace(/:/g, '-');
  const chartWidth = 360;
  const chartHeight = 140;
  const [activeIndex, setActiveIndex] = useState(data.length > 0 ? data.length - 1 : 0);

  const points = useMemo(() => {
    const values = data.map((point) => point.value);
    const minValue = values.length ? Math.min(...values) : 0;
    const maxValue = values.length ? Math.max(...values) : 0;
    const range = maxValue - minValue || 1;
    const stepX = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;

    return data.map((point, index) => {
      const x = index * stepX;
      // padding top 20px, bottom 10px
      const y = chartHeight - ((point.value - minValue) / range) * (chartHeight - 30) - 10;
      return { ...point, x, y };
    });
  }, [data]);

  const activePoint = points[activeIndex] || points[points.length - 1] || null;

  // Render a smooth path utilizing quadratic bezier approximations if we had d3, 
  // but straight lines look fine with a drop shadow.
  const polylinePoints = points.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPath = points.length
    ? `M 0 ${chartHeight} L ${points.map((point) => `${point.x} ${point.y}`).join(' L ')} L ${chartWidth} ${chartHeight} Z`
    : '';

  const tooltipWidth = 110;
  const tooltipHeight = 48;
  const tooltipX = activePoint ? Math.min(Math.max(activePoint.x - tooltipWidth / 2, 4), chartWidth - tooltipWidth - 4) : 4;
  const tooltipY = activePoint ? Math.max(activePoint.y - 60, 4) : 4;
  const formatValue = (value: number) => formatByMode(value, valueFormat);

  return (
    <div className={styles.wrapper}>
      <svg className={styles.chart} viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" role="img" aria-label={ariaLabel}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(197, 163, 104, 0.4)" />
            <stop offset="100%" stopColor="rgba(197, 163, 104, 0)" />
          </linearGradient>
        </defs>

        {/* 1. Area Fill */}
        {points.length > 0 && <path d={areaPath} fill={`url(#${gradientId})`} />}
        
        {/* 2. Sleek Gold Line */}
        {points.length > 0 && <polyline points={polylinePoints} className={styles.path} />}

        {/* 3. Invisible Hover Zones spanning width proportional to data points */}
        {points.map((_, index) => {
          const zoneWidth = chartWidth / points.length;
          const zoneX = index * zoneWidth;
          return (
            <rect
              key={`zone-${index}`}
              x={zoneX}
              y={0}
              width={zoneWidth}
              height={chartHeight}
              fill="transparent"
              className={styles.hoverTarget}
              onMouseEnter={() => setActiveIndex(index)}
              onTouchStart={() => setActiveIndex(index)}
            />
          );
        })}

        {/* 4. Active Marker & Tooltip (pointer-events: none to prevent blocking hover zones) */}
        {activePoint && (
          <g style={{ pointerEvents: 'none' }}>
            <line 
              x1={activePoint.x} y1={activePoint.y} 
              x2={activePoint.x} y2={chartHeight} 
              stroke="rgba(255, 255, 255, 0.15)" 
              strokeWidth="1" 
              strokeDasharray="4 4" 
            />
            <circle cx={activePoint.x} cy={activePoint.y} r="4" className={styles.dotActive} />
            
            <rect x={tooltipX} y={tooltipY} width={tooltipWidth} height={tooltipHeight} className={styles.tooltipCard} />
            <text x={tooltipX + 12} y={tooltipY + 20} className={styles.tooltipLabel}>{activePoint.label}</text>
            <text x={tooltipX + 12} y={tooltipY + 38} className={styles.tooltipValue}>{formatValue(activePoint.value)}</text>
          </g>
        )}
      </svg>
    </div>
  );
}
'use client';

import { useCallback, useId, useMemo } from 'react';
import { LinePath, AreaClosed } from '@visx/shape';
import { scaleLinear } from '@visx/scale';
import { LinearGradient } from '@visx/gradient';
import { curveMonotoneX } from '@visx/curve';
import { Group } from '@visx/group';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
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

/* ─────── dimensions ─────── */
const WIDTH = 360;
const HEIGHT = 140;
const PADDING = { top: 20, right: 0, bottom: 10, left: 0 };

/* ─────── accessors ─────── */
const getX = (_: TrendPoint, i: number) => i;
const getY = (d: TrendPoint) => d.value;

export default function TrendSparkline({ data, ariaLabel, valueFormat = 'compactUsd' }: TrendSparklineProps) {
  const gradientId = useId().replace(/:/g, '-');
  const formatValue = (v: number) => formatByMode(v, valueFormat);
  const startPoint = data[0];
  const endPoint = data[data.length - 1];

  /* ─────── scales ─────── */
  const xScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, Math.max(data.length - 1, 1)],
        range: [PADDING.left, WIDTH - PADDING.right],
      }),
    [data.length],
  );

  const yScale = useMemo(() => {
    const values = data.map(getY);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const buffer = (max - min) * 0.05 || 1;

    // Keep the baseline readable for mostly-positive series while preserving negatives.
    const domainMin = max > 0 ? Math.min(0, min - buffer * 0.5) : min - buffer;
    const domainMax = max + buffer;

    return scaleLinear<number>({
      domain: [domainMin, domainMax],
      range: [HEIGHT - PADDING.bottom, PADDING.top],
    });
  }, [data]);

  /* ─────── tooltip ─────── */
  const { showTooltip, hideTooltip, tooltipData, tooltipLeft, tooltipTop } = useTooltip<TrendPoint>();

  const handleTooltip = useCallback(
    (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const clientX = 'touches' in event ? event.touches[0]?.clientX ?? rect.left : event.clientX;
      const ratio = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
      const index = Math.round(ratio * Math.max(data.length - 1, 1));
      const clamped = Math.max(0, Math.min(data.length - 1, index));
      const d = data[clamped];
      if (!d) return;
      showTooltip({
        tooltipData: d,
        tooltipLeft: xScale(clamped),
        tooltipTop: yScale(d.value),
      });
    },
    [data, xScale, yScale, showTooltip],
  );

  /* ─────── derived ─────── */
  const scaledX = (d: TrendPoint, i: number) => xScale(getX(d, i));
  const scaledY = (d: TrendPoint) => yScale(getY(d));
  const referenceBands = [0.2, 0.5, 0.8].map((ratio) => PADDING.top + (HEIGHT - PADDING.bottom - PADDING.top) * ratio);

  if (!data.length) return null;

  return (
    <div className={styles.wrapper}>
      <svg
        className={styles.chart}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={ariaLabel}
      >
        <LinearGradient
          id={gradientId}
          from="rgba(197, 163, 104, 0.4)"
          to="rgba(197, 163, 104, 0)"
          fromOffset="0%"
          toOffset="100%"
        />

        {/* Subtle reference bands for better vertical rhythm */}
        {referenceBands.map((y) => (
          <line
            key={y}
            x1={PADDING.left}
            y1={y}
            x2={WIDTH - PADDING.right}
            y2={y}
            className={styles.referenceBand}
          />
        ))}

        <Group>
          {/* Area fill */}
          <AreaClosed
            data={data}
            x={scaledX}
            y={scaledY}
            yScale={yScale}
            curve={curveMonotoneX}
            fill={`url(#${gradientId})`}
          />

          {/* Smooth gold line */}
          <LinePath
            data={data}
            x={scaledX}
            y={scaledY}
            curve={curveMonotoneX}
            stroke="var(--accent-gold, #c5a368)"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0px 4px 6px rgba(197, 163, 104, 0.3))' }}
          />

          {/* End-point marker for immediate visual focus */}
          <circle
            cx={xScale(data.length - 1)}
            cy={yScale(data[data.length - 1]?.value ?? 0)}
            r={4.5}
            fill="var(--bg-surface, #111)"
            stroke="var(--accent-gold, #c5a368)"
            strokeWidth={2}
            opacity={tooltipData ? 0.35 : 1}
          />
        </Group>

        {/* In-chart start/end labels to anchor the timeline */}
        <text x={PADDING.left + 2} y={HEIGHT - 2} textAnchor="start" className={styles.edgeLabel}>
          {startPoint?.label ?? 'Start'}
        </text>
        <text x={WIDTH - PADDING.right - 2} y={HEIGHT - 2} textAnchor="end" className={styles.edgeLabel}>
          {endPoint?.label ?? 'Now'}
        </text>

        {/* Active dot + dashed guide */}
        {tooltipData && tooltipLeft != null && tooltipTop != null && (
          <g className={styles.interactionOverlay}>
            <line
              x1={tooltipLeft}
              y1={tooltipTop}
              x2={tooltipLeft}
              y2={HEIGHT}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <circle
              cx={tooltipLeft}
              cy={tooltipTop}
              r={4}
              fill="var(--bg-surface, #1c1c1e)"
              stroke="var(--accent-gold, #c5a368)"
              strokeWidth={2.5}
            />
          </g>
        )}

        {/* Full-area invisible hover target */}
        <rect
          className={styles.hoverTarget}
          x={0}
          y={0}
          width={WIDTH}
          height={HEIGHT}
          fill="transparent"
          onMouseMove={handleTooltip}
          onTouchMove={handleTooltip}
          onMouseLeave={hideTooltip}
          onTouchEnd={hideTooltip}
        />
      </svg>

      {/* HTML tooltip overlay (positioned by visx) */}
      {tooltipData && tooltipLeft != null && tooltipTop != null && (
        <TooltipWithBounds
          left={tooltipLeft}
          top={tooltipTop - 56}
          className={styles.tooltipContainer}
          style={{
            ...defaultStyles,
            background: 'rgba(28, 28, 30, 0.85)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: '8px 12px',
            pointerEvents: 'none',
          }}
        >
          <div className={styles.tooltipLabel}>{tooltipData.label}</div>
          <div className={styles.tooltipValue}>{formatValue(tooltipData.value)}</div>
        </TooltipWithBounds>
      )}
    </div>
  );
}
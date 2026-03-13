'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './PieChart.module.css';

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  hoveredIndex?: number | null;
  onHoverChange?: (index: number | null) => void;
}

export default function PieChart({ data, hoveredIndex: controlledHoveredIndex, onHoverChange }: PieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [internalHoveredIndex, setInternalHoveredIndex] = useState<number | null>(null);

  const activeHoveredIndex = controlledHoveredIndex ?? internalHoveredIndex;

  const segments = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -Math.PI / 2;
    return data.map((item) => {
      const sliceAngle = total > 0 ? (item.value / total) * 2 * Math.PI : 0;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;
      return { ...item, startAngle, endAngle };
    });
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const innerRadius = radius * 0.6;

    // Draw slices
    segments.forEach((item, index) => {
      const isHovered = activeHoveredIndex === index;
      const isFaded = activeHoveredIndex !== null && !isHovered;
      const midAngle = (item.startAngle + item.endAngle) / 2;
      const hoverOffset = isHovered ? 10 : 0;
      const offsetX = Math.cos(midAngle) * hoverOffset;
      const offsetY = Math.sin(midAngle) * hoverOffset;
      
      // Draw slice
      ctx.beginPath();
      ctx.moveTo(
        centerX + Math.cos(item.startAngle) * innerRadius + offsetX,
        centerY + Math.sin(item.startAngle) * innerRadius + offsetY,
      );
      ctx.arc(centerX + offsetX, centerY + offsetY, radius, item.startAngle, item.endAngle);
      ctx.arc(centerX + offsetX, centerY + offsetY, innerRadius, item.endAngle, item.startAngle, true);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.globalAlpha = isFaded ? 0.4 : 1;

      if (isHovered) {
        ctx.shadowColor = item.color;
        ctx.shadowBlur = 18;
      }

      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Add subtle border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw center circle for donut effect
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#080808';
    ctx.fill();

  }, [segments, activeHoveredIndex]);

  const updateHoveredIndex = (index: number | null) => {
    setInternalHoveredIndex(index);
    onHoverChange?.(index);
  };

  const handlePointerMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || segments.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 20;
    const innerRadius = radius * 0.6;

    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < innerRadius || distance > radius + 14) {
      if (activeHoveredIndex !== null) {
        updateHoveredIndex(null);
      }
      return;
    }

    let angle = Math.atan2(dy, dx);
    if (angle < -Math.PI / 2) {
      angle += 2 * Math.PI;
    }

    const hovered = segments.findIndex((segment) => angle >= segment.startAngle && angle < segment.endAngle);
    const nextHovered = hovered >= 0 ? hovered : null;

    if (nextHovered !== activeHoveredIndex) {
      updateHoveredIndex(nextHovered);
    }
  };

  const handlePointerLeave = () => {
    if (activeHoveredIndex !== null) {
      updateHoveredIndex(null);
    }
  };

  return (
    <div className={styles.chartWrapper}>
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={300}
        className={styles.canvas}
        onMouseMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
      />
    </div>
  );
}

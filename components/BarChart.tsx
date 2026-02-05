'use client';

import { useEffect, useRef } from 'react';
import styles from './BarChart.module.css';

interface BarChartData {
  month: string;
  revenue: number;
  expenses: number;
}

interface BarChartProps {
  data: BarChartData[];
}

export default function BarChart({ data }: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padding = 60;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Find max value
    const maxValue = Math.max(...data.map(d => Math.max(d.revenue, d.expenses)));
    const roundedMax = Math.ceil(maxValue / 10000) * 10000;

    // Calculate bar width
    const barGroupWidth = chartWidth / data.length;
    const barWidth = (barGroupWidth - 20) / 2;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();

      // Draw y-axis labels
      const value = roundedMax - (roundedMax / 5) * i;
      ctx.fillStyle = '#707070';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'right';
      ctx.fillText(`$${(value / 1000).toFixed(0)}K`, padding - 10, y + 4);
    }

    // Draw bars
    data.forEach((item, index) => {
      const x = padding + index * barGroupWidth;
      
      // Revenue bar
      const revenueHeight = (item.revenue / roundedMax) * chartHeight;
      const revenueY = padding + chartHeight - revenueHeight;
      
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(x + 5, revenueY, barWidth, revenueHeight);

      // Expenses bar
      const expensesHeight = (item.expenses / roundedMax) * chartHeight;
      const expensesY = padding + chartHeight - expensesHeight;
      
      ctx.fillStyle = '#f87171';
      ctx.fillRect(x + 5 + barWidth + 5, expensesY, barWidth, expensesHeight);

      // Draw month label
      ctx.fillStyle = '#707070';
      ctx.font = '10px JetBrains Mono';
      ctx.textAlign = 'center';
      ctx.fillText(item.month, x + barGroupWidth / 2, canvas.height - padding + 20);
    });

    // Draw legend
    const legendY = 30;
    
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(canvas.width - 150, legendY, 12, 12);
    ctx.fillStyle = '#e5e5e5';
    ctx.font = '11px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('Revenue', canvas.width - 130, legendY + 10);
    
    ctx.fillStyle = '#f87171';
    ctx.fillRect(canvas.width - 70, legendY, 12, 12);
    ctx.fillStyle = '#e5e5e5';
    ctx.fillText('Expenses', canvas.width - 50, legendY + 10);

  }, [data]);

  return (
    <div className={styles.chartWrapper}>
      <canvas 
        ref={canvasRef} 
        width={900} 
        height={400}
        className={styles.canvas}
      />
    </div>
  );
}

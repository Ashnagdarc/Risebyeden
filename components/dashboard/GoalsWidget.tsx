import React from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import styles from './Widgets.module.css';

interface Goal {
  id: string;
  title: string;
  countdownLabel: string;
  progressPercent: number;
  currentMetric: string;
  targetMetric: string;
}

interface GoalsWidgetProps {
  goals: Goal[];
}

export default function GoalsWidget({ goals }: GoalsWidgetProps) {
  return (
    <Card>
      <CardHeader title="Goal Momentum" actionHref="/goals" actionLabel="Open Goals" />
      <div className={styles.goalsList}>
        {goals.length === 0 && (
          <p className={styles.emptyState}>No active goals yet. Create one to start your streak.</p>
        )}
        {goals.map((goal) => (
          <article key={goal.id} className={styles.goalItem}>
            <div className={styles.goalItemTop}>
              <h4 className={styles.goalTitle}>{goal.title}</h4>
              <span className={styles.goalCountdown}>{goal.countdownLabel}</span>
            </div>
            <progress className={styles.progressBar} value={goal.progressPercent} max={100} />
            <div className={styles.goalStats}>
              <span>{goal.currentMetric} / {goal.targetMetric}</span>
              <span>{goal.progressPercent.toFixed(1)}%</span>
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}

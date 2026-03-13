import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardHeader } from '@/components/ui/Card';
import styles from './GrowthPersona.module.css';

interface Badge {
  id: string;
  title: string;
  description: string;
  image: string | any;
}

interface GrowthPersonaWidgetProps {
  xpPoints: number;
  currentExperienceLabel: string;
  focusLabels: string[];
  currentLevel: { questTitle: string; targetUnits: number; next: string | null };
  totalPropertyUnits: number;
  nextExperienceLabel: string;
  levelProgressPercent: number;
  primeGoal: { title: string; progressPercent: number } | null;
  unlockedBadgeCount: number;
  totalBadgesCount: number;
  topUnlockedBadges: Badge[];
  nextBadge: Badge | null;
}

export default function GrowthPersonaWidget({
  xpPoints,
  currentExperienceLabel,
  focusLabels,
  currentLevel,
  totalPropertyUnits,
  nextExperienceLabel,
  levelProgressPercent,
  primeGoal,
  unlockedBadgeCount,
  totalBadgesCount,
  topUnlockedBadges,
  nextBadge,
}: GrowthPersonaWidgetProps) {
  return (
    <Card>
      <CardHeader title="Your Growth Persona">
        <span className={styles.personaXp}>XP {xpPoints}</span>
      </CardHeader>

      <div className={styles.personaMeta}>
        <div className={styles.personaMetaCard}>
          <p className={styles.personaLabel}>Experience Level</p>
          <p className={styles.personaValue}>{currentExperienceLabel}</p>
        </div>
        <div className={styles.personaMetaCard}>
          <p className={styles.personaLabel}>Investment Focus</p>
          <p className={styles.personaValue}>
            {focusLabels.length ? focusLabels.join(' • ') : 'Not set yet'}
          </p>
        </div>
      </div>

      <div className={styles.levelTrack}>
        <div className={styles.levelTrackTop}>
          <span className={styles.levelNow}>Current: {currentExperienceLabel}</span>
          <span className={styles.levelNext}>Next: {nextExperienceLabel}</span>
        </div>
        <progress className={styles.levelProgress} value={levelProgressPercent} max={100} />
        <p className={styles.levelQuest}>{currentLevel.questTitle}</p>
        <p className={styles.levelHint}>
          {totalPropertyUnits}/{currentLevel.targetUnits} properties towards next level
        </p>
      </div>

      <div className={styles.badgeHeader}>
        <p className={styles.badgeTitle}>Earned Badges</p>
        <div className={styles.badgeActions}>
          <span className={styles.badgesMeta}>{unlockedBadgeCount}/{totalBadgesCount} unlocked</span>
          <Link href="/badges" className={styles.badgeViewAll}>View All</Link>
        </div>
      </div>

      <div className={styles.badgeStrip}>
        {topUnlockedBadges.length === 0 ? (
          <p className={styles.unlockedEmpty}>No badges earned yet. Complete your active goals to unlock.</p>
        ) : (
          topUnlockedBadges.map((badge) => (
            <article key={badge.id} className={`${styles.badgeCard} ${styles.badgeCardUnlocked}`}>
              <Image src={badge.image} alt={badge.title} width={32} height={32} className={styles.badgeImage} />
              <div>
                <p className={styles.badgeName}>{badge.title}</p>
                <p className={styles.badgeDescription}>{badge.description}</p>
              </div>
            </article>
          ))
        )}
      </div>

      {nextBadge && (
        <div className={styles.nextBadgeCard}>
          <p className={styles.personaLabel}>Next Target</p>
          <div className={styles.badgeCard}>
            <Image src={nextBadge.image} alt={nextBadge.title} width={32} height={32} className={styles.badgeImage} />
            <div>
              <p className={styles.badgeName}>{nextBadge.title}</p>
              <p className={styles.badgeDescription}>{nextBadge.description}</p>
            </div>
          </div>
        </div>
      )}

      <p className={styles.nextQuestLine}>
        {primeGoal
          ? `Next quest: ${primeGoal.title} (${primeGoal.progressPercent.toFixed(1)}%)`
          : 'Next quest: Set a new goal to keep your momentum up.'}
      </p>
    </Card>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { useSession } from 'next-auth/react';
import styles from './onboarding.module.css';

type GoalTemplate = {
  id: string;
  title: string;
  description: string;
};

type InvestorExperience = 'new' | 'starter' | 'growing' | 'established';
type InvestmentFocus = 'residential' | 'commercial' | 'land' | 'mixed';

type Step = 'welcome' | 'profile' | 'goals' | 'launch';

const experienceOptions: { id: InvestorExperience; label: string; description: string }[] = [
  { id: 'new', label: 'First-time investor', description: "I'm exploring my first real estate investment" },
  { id: 'starter', label: 'Getting started', description: 'I own my first property and am ready to expand' },
  { id: 'growing', label: 'Building momentum', description: 'I have 2\u20134 properties and am growing my portfolio' },
  { id: 'established', label: 'Established investor', description: 'I own 5+ properties and am actively scaling' },
];

const focusOptions: { id: InvestmentFocus; label: string; description: string }[] = [
  { id: 'residential', label: 'Residential', description: 'Homes, apartments & buy-to-let' },
  { id: 'commercial', label: 'Commercial', description: 'Office spaces, retail & warehouses' },
  { id: 'land', label: 'Land & Plots', description: 'Project plots & undeveloped land' },
  { id: 'mixed', label: 'Mixed Portfolio', description: 'Diversified across all asset types' },
];

type OnboardingResponse = {
  onboardingCompleted?: boolean;
  goalCatalog?: GoalTemplate[];
};

export default function OnboardingClient({ name }: { name: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [step, setStep] = useState<Step>('welcome');
  const [goalCatalog, setGoalCatalog] = useState<GoalTemplate[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [investorExperience, setInvestorExperience] = useState<InvestorExperience | null>(null);
  const [investmentFocus, setInvestmentFocus] = useState<InvestmentFocus[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadOnboarding = async () => {
      try {
        const response = await fetch('/api/client/onboarding', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed onboarding status request');
        }

        const payload = (await response.json()) as OnboardingResponse;
        if (!isMounted) {
          return;
        }

        if (payload.onboardingCompleted) {
          router.replace('/');
          return;
        }

        setGoalCatalog(payload.goalCatalog || []);
      } catch {
        if (isMounted) {
          setSubmitError('Unable to start onboarding right now. Please refresh and try again.');
        }
      } finally {
        if (isMounted) {
          setLoadingCatalog(false);
        }
      }
    };

    loadOnboarding();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const canProceedProfileStep = investorExperience !== null && investmentFocus.length >= 1;
  const canProceedGoalsStep = selectedGoals.length >= 3 && selectedGoals.length <= 5;

  const selectedGoalItems = useMemo(
    () => selectedGoals.map((goalId) => goalCatalog.find((goal) => goal.id === goalId)).filter(Boolean) as GoalTemplate[],
    [goalCatalog, selectedGoals]
  );

  const stepNumber = step === 'profile' ? 1 : 2;
  const progressPercent = step === 'profile' ? 33 : step === 'goals' ? 67 : 100;
  const remainingSelections = Math.max(0, 3 - selectedGoals.length);

  function toggleGoal(goalId: string) {
    setSubmitError('');
    setSelectedGoals((prev) => {
      if (prev.includes(goalId)) {
        return prev.filter((id) => id !== goalId);
      }

      if (prev.length >= 5) {
        return prev;
      }

      return [...prev, goalId];
    });
  }

  function toggleFocus(focus: InvestmentFocus) {
    setInvestmentFocus((prev) =>
      prev.includes(focus) ? prev.filter((f) => f !== focus) : [...prev, focus]
    );
  }

  async function submitOnboarding() {
    setSubmitError('');
    setStatusMessage('Tuning your dashboard to your goals...');
    setStep('launch');

    const payload = {
      investorProfile: {
        experience: investorExperience,
        focus: investmentFocus,
      },
      goals: selectedGoals.map((goalId) => ({ goalId })),
    };

    try {
      const response = await fetch('/api/client/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const fallbackMessage = 'Unable to complete onboarding.';
        let message = fallbackMessage;

        try {
          const data = await response.json();
          if (typeof data?.error === 'string' && data.error.trim()) {
            message = data.error;
          }
        } catch {
          const text = await response.text().catch(() => '');
          if (text.trim()) {
            message = text.trim();
          }
        }

        throw new Error(message);
      }

      const shouldReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!shouldReduceMotion) {
        confetti({
          particleCount: 180,
          spread: 92,
          origin: { y: 0.62 },
        });
      }

      await update({ onboardingCompleted: true });

      setStatusMessage('Profile tuned. Taking you to your dashboard...');
      window.setTimeout(() => {
        router.replace('/');
      }, 1400);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to complete onboarding.';
      setSubmitError(message);
      setStep('goals');
    }
  }

  if (loadingCatalog) {
    return (
      <main className={styles.shell}>
        <section className={styles.loadingCard}>
          <p className={styles.kicker}>ONBOARDING</p>
          <h1 className={styles.title}>Preparing your launch sequence...</h1>
        </section>
      </main>
    );
  }

  // Welcome screen
  if (step === 'welcome') {
    return (
      <main className={styles.shell}>
        <div className={styles.aurora} aria-hidden="true" />
        <section className={styles.welcomeStage}>
          <p className={styles.welcomeKicker}>Welcome to Risebyeden</p>
          <h1 className={styles.welcomeTitle}>
            Hello, {name}.<br />
            {"Let's build your investment dashboard."}
          </h1>
          <p className={styles.welcomeSubtitle}>
            This takes about 2 minutes. We will ask you a few quick questions to personalise your experience and surface the right goals for your portfolio.
          </p>
          <div className={styles.welcomeFeatures}>
            <div className={styles.welcomeFeature}>
              <span className={styles.welcomeFeatureIcon}>◆</span>
              <div>
                <p className={styles.welcomeFeatureTitle}>Goal Tracking</p>
                <p className={styles.welcomeFeatureDesc}>Monitor milestones from your first property to a full portfolio.</p>
              </div>
            </div>
            <div className={styles.welcomeFeature}>
              <span className={styles.welcomeFeatureIcon}>◆</span>
              <div>
                <p className={styles.welcomeFeatureTitle}>Portfolio Insights</p>
                <p className={styles.welcomeFeatureDesc}>See performance, value growth, and appreciation at a glance.</p>
              </div>
            </div>
            <div className={styles.welcomeFeature}>
              <span className={styles.welcomeFeatureIcon}>◆</span>
              <div>
                <p className={styles.welcomeFeatureTitle}>Curated Opportunities</p>
                <p className={styles.welcomeFeatureDesc}>Discover properties and plots matched to your investor profile.</p>
              </div>
            </div>
          </div>
          <button type="button" className={styles.primaryButton} onClick={() => setStep('profile')}>
            Begin Setup
          </button>
        </section>
      </main>
    );
  }

  // Launch screen
  if (step === 'launch') {
    return (
      <main className={styles.shell}>
        <div className={styles.aurora} aria-hidden="true" />
        <section className={styles.launchStage}>
          <div className={styles.launchBadge}>Finalizing your setup</div>
          <div className={styles.spinner} />
          <p className={styles.launchMessage}>{statusMessage}</p>
          <p className={styles.launchSubtext}>We are turning your selected priorities into the first version of your client dashboard.</p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.shell}>
      <div className={styles.aurora} aria-hidden="true" />

      <section className={styles.stage}>
        <header className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>WELCOME {name.toUpperCase()}</p>
            <h1 className={styles.title}>
              {step === 'profile' ? 'Tell us about your investment journey.' : 'Build the dashboard around the goals that matter.'}
            </h1>
            <p className={styles.subtitle}>
              {step === 'profile'
                ? 'Your experience and focus help us personalise the platform and surface the most relevant opportunities for you.'
                : 'Choose the outcomes you care about. We will use your selections to shape your dashboard experience.'}
            </p>
          </div>

          <div className={styles.heroMetrics}>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>{step === 'profile' ? (investorExperience ? '✓' : '—') : selectedGoals.length}</span>
              <span className={styles.metricLabel}>{step === 'profile' ? 'Profile set' : 'Goals selected'}</span>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricValue}>{progressPercent}%</span>
              <span className={styles.metricLabel}>Progress</span>
            </div>
          </div>
        </header>

        <section className={styles.workspace}>
          <section className={styles.mainPanel}>
            <div className={styles.topProgress}>
              <div className={styles.topProgressMeta}>
                <div>
                  <p className={styles.panelKicker}>Step {stepNumber} of 2</p>
                  <p className={styles.topProgressTitle}>
                    {step === 'profile' ? 'Your investor profile' : 'Select your priority goals'}
                  </p>
                </div>
                <span className={styles.progressValue}>{progressPercent}% complete</span>
              </div>
              <div className={styles.progressBar} aria-hidden="true">
                <div className={`${styles.progressBarFill} ${step === 'profile' ? styles.progressBarFillProfile : styles.progressBarFillGoals}`} />
              </div>
              <div className={styles.stepPills}>
                <span className={`${styles.stepPill} ${styles.stepPillActive}`}>1. Investor profile</span>
                <span className={`${styles.stepPill} ${step === 'goals' ? styles.stepPillActive : ''}`}>2. Choose goals</span>
              </div>
            </div>

            {step === 'profile' && (
              <>
                <div className={styles.profileSection}>
                  <p className={styles.profileSectionLabel}>Your experience level</p>
                  <div className={styles.experienceGrid}>
                    {experienceOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`${styles.experienceCard} ${investorExperience === opt.id ? styles.experienceCardActive : ''}`}
                        onClick={() => setInvestorExperience(opt.id)}
                      >
                        <p className={styles.experienceLabel}>{opt.label}</p>
                        <p className={styles.experienceDesc}>{opt.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.profileSection}>
                  <p className={styles.profileSectionLabel}>
                    Investment focus{' '}
                    <span className={styles.profileSectionMeta}>(select all that apply)</span>
                  </p>
                  <div className={styles.focusChipList}>
                    {focusOptions.map((opt) => {
                      const selected = investmentFocus.includes(opt.id);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          className={`${styles.focusChip} ${selected ? styles.focusChipActive : ''}`}
                          onClick={() => toggleFocus(opt.id)}
                        >
                          <span className={styles.focusChipLabel}>{opt.label}</span>
                          <span className={styles.focusChipDesc}>{opt.description}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className={styles.actions}>
                  <button type="button" className={styles.secondaryButton} onClick={() => setStep('welcome')}>
                    Back
                  </button>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    disabled={!canProceedProfileStep}
                    onClick={() => setStep('goals')}
                  >
                    Continue to goals
                  </button>
                </div>
              </>
            )}

            {step === 'goals' && (
              <>
                <div className={styles.selectionSummary}>
                  <div className={styles.selectionSummaryHeader}>
                    <p className={styles.summaryTitle}>Current selection</p>
                    <span className={styles.summaryBadge}>{selectedGoals.length}/5 chosen</span>
                  </div>
                  {selectedGoalItems.length === 0 ? (
                    <p className={styles.summaryEmpty}>No goals selected yet. Choose the outcomes you want the dashboard to focus on.</p>
                  ) : (
                    <div className={styles.summaryChipList}>
                      {selectedGoalItems.map((goal, index) => (
                        <div key={goal.id} className={styles.summaryChip}>
                          <span className={styles.summaryChipIndex}>{index + 1}</span>
                          <div>
                            <p className={styles.summaryGoalTitle}>{goal.title}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.helperBar}>
                  <span>{canProceedGoalsStep ? 'Your selection is ready.' : remainingSelections > 0 ? `Choose ${remainingSelections} more goal${remainingSelections === 1 ? '' : 's'} to continue.` : 'You have reached the selection limit.'}</span>
                  <span>{selectedGoals.length === 5 ? 'Maximum reached' : `${5 - selectedGoals.length} slot${5 - selectedGoals.length === 1 ? '' : 's'} left`}</span>
                </div>

                <div className={styles.goalGrid}>
                  {goalCatalog.map((goal) => {
                    const selected = selectedGoals.includes(goal.id);
                    const disableUnselected = !selected && selectedGoals.length >= 5;
                    const selectionIndex = selectedGoals.indexOf(goal.id);
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        className={`${styles.goalCard} ${selected ? styles.goalCardActive : ''}`}
                        onClick={() => toggleGoal(goal.id)}
                        disabled={disableUnselected}
                      >
                        <div className={styles.goalCardTop}>
                          <span className={`${styles.goalBadge} ${selected ? styles.goalBadgeActive : ''}`}>
                            {selected ? `Selected ${selectionIndex + 1}` : 'Tap to select'}
                          </span>
                          <span className={`${styles.goalCheck} ${selected ? styles.goalCheckActive : ''}`}>{selected ? '✓' : ''}</span>
                        </div>
                        <span className={styles.goalTitle}>{goal.title}</span>
                        <span className={styles.goalDescription}>{goal.description}</span>
                      </button>
                    );
                  })}
                </div>

                <div className={styles.actions}>
                  <button type="button" className={styles.secondaryButton} onClick={() => setStep('profile')}>
                    Back
                  </button>
                  <button
                    type="button"
                    className={styles.primaryButton}
                    disabled={!canProceedGoalsStep}
                    onClick={() => {
                      void submitOnboarding();
                    }}
                  >
                    Build my dashboard
                  </button>
                </div>
              </>
            )}

            {submitError && <p className={styles.error}>{submitError}</p>}
          </section>

          <aside className={styles.summaryPanel}>
            {step === 'profile' ? (
              <div className={styles.summarySection}>
                <p className={styles.summaryTitle}>Why we ask this</p>
                <div className={styles.guidanceList}>
                  <div className={styles.guidanceItem}>
                    <span className={styles.guidanceNumber}>01</span>
                    <p>Your experience level shapes how we present data and insights on your dashboard.</p>
                  </div>
                  <div className={styles.guidanceItem}>
                    <span className={styles.guidanceNumber}>02</span>
                    <p>Your focus areas filter which properties, plots, and opportunities we highlight for you.</p>
                  </div>
                  <div className={styles.guidanceItem}>
                    <span className={styles.guidanceNumber}>03</span>
                    <p>You can update your profile at any time from your account settings.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.summarySection}>
                <p className={styles.summaryTitle}>How this works</p>
                <div className={styles.guidanceList}>
                  <div className={styles.guidanceItem}>
                    <span className={styles.guidanceNumber}>01</span>
                    <p>Pick 3 to 5 goals that reflect your current investment priorities.</p>
                  </div>
                  <div className={styles.guidanceItem}>
                    <span className={styles.guidanceNumber}>02</span>
                    <p>These goals will appear as live trackers on your dashboard, updating as your portfolio grows.</p>
                  </div>
                  <div className={styles.guidanceItem}>
                    <span className={styles.guidanceNumber}>03</span>
                    <p>You can add, update, or change goals at any time from your goals page.</p>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </section>
      </section>
    </main>
  );
}

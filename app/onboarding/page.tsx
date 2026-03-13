import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { getUserOnboardingState } from '@/lib/onboarding-state';
import OnboardingClient from './OnboardingClient';

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;

  if (!session) {
    redirect('/auth');
  }

  if (role === 'admin') {
    redirect('/admin');
  }

  if (role === 'agent') {
    redirect('/agent');
  }

  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    redirect('/auth');
  }

  const user = await getUserOnboardingState(userId);

  if (!user) {
    redirect('/auth');
  }

  if (user.onboardingCompleted) {
    redirect('/');
  }

  return <OnboardingClient name={user.name || 'Investor'} />;
}

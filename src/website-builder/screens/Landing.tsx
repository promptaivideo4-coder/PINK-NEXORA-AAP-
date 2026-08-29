import { lazy, Suspense } from 'react';
import PublicWelcome from '../landing/PublicWelcome';
import type { LandingProps } from '../dashboard/types';

export type { LandingProps, LandingTab } from '../dashboard/types';

const OwnerDashboard = lazy(() => import('../dashboard/OwnerDashboard'));

function DashboardFallback() {
  return (
    <div className="h-screen bg-[#f9f8f6] flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-[#ac0053] border-t-transparent animate-spin" />
    </div>
  );
}

/**
 * Website-builder landing.
 * Unpublished visitors see the public welcome; published owners get the
 * lazy-loaded dashboard (screens 18–25).
 */
export default function Landing(props: LandingProps) {
  if (props.data.publishState !== 'published') {
    return <PublicWelcome onNext={props.onNext} />;
  }
  return (
    <Suspense fallback={<DashboardFallback />}>
      <OwnerDashboard {...props} />
    </Suspense>
  );
}

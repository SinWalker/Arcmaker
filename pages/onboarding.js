import dynamic from 'next/dynamic';

// /onboarding now shows the same Local Profile Access screen.
// runFullSeed() inside LocalProfileAccessUI ensures Sin + World Cup Arc exist.
const LocalProfileAccessUI = dynamic(() => import('../components/LocalProfileAccessUI'), { ssr: false });

export default function OnboardingPage() {
  return <LocalProfileAccessUI />;
}

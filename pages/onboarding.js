import dynamic from 'next/dynamic';
import Head from 'next/head';

const OnboardingUI = dynamic(() => import('../components/OnboardingUI'), { ssr: false });

export default function OnboardingPage() {
  return (
    <>
      <Head><title>Welcome — ArcMaker</title></Head>
      <OnboardingUI />
    </>
  );
}

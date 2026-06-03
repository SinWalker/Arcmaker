import dynamic from 'next/dynamic';
import Head from 'next/head';

const DashboardUI = dynamic(() => import('../components/dashboard/DashboardUI'), { ssr: false });

export default function DashboardPage() {
  return (
    <>
      <Head><title>ArcMaker</title></Head>
      <DashboardUI />
    </>
  );
}

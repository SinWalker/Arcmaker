import dynamic from 'next/dynamic';
import Head from 'next/head';

const TodayUI = dynamic(() => import('../components/today/TodayUI'), { ssr: false });

export default function TodayPage() {
  return (
    <>
      <Head><title>Today — ArcMaker</title></Head>
      <TodayUI />
    </>
  );
}

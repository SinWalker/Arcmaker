import dynamic from 'next/dynamic';
import Head from 'next/head';

const ProfileSelectUI = dynamic(() => import('../components/ProfileSelectUI'), { ssr: false });

export default function ProfileSelectPage() {
  return (
    <>
      <Head><title>Switch Profile — ArcMaker</title></Head>
      <ProfileSelectUI />
    </>
  );
}

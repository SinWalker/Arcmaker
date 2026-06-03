import dynamic from 'next/dynamic';
import Head from 'next/head';

const SessionsListUI = dynamic(() => import('../../components/sessions/SessionsListUI'), { ssr: false });

export default function SessionsPage() {
  return (
    <>
      <Head><title>Sessions — ArcMaker</title></Head>
      <SessionsListUI />
    </>
  );
}

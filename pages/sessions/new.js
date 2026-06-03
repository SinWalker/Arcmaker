import dynamic from 'next/dynamic';
import Head from 'next/head';

const NewSessionUI = dynamic(() => import('../../components/sessions/NewSessionUI'), { ssr: false });

export default function NewSessionPage() {
  return (
    <>
      <Head><title>New Session — ArcMaker</title></Head>
      <NewSessionUI />
    </>
  );
}

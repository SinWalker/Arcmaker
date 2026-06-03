import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';

const SessionDetailUI = dynamic(() => import('../../components/sessions/SessionDetailUI'), { ssr: false });

export default function SessionDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  return (
    <>
      <Head><title>Session — ArcMaker</title></Head>
      {id && <SessionDetailUI sessionId={id} />}
    </>
  );
}

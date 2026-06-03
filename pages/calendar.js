import dynamic from 'next/dynamic';
import Head from 'next/head';

const CalendarUI = dynamic(() => import('../components/calendar/CalendarUI'), { ssr: false });

export default function CalendarPage() {
  return (
    <>
      <Head><title>Mission Board — ArcMaker</title></Head>
      <CalendarUI />
    </>
  );
}

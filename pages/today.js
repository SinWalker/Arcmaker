import dynamic from 'next/dynamic';
const TodayUI = dynamic(() => import('../components/today/TodayUI'), { ssr: false });
export default function TodayPage() { return <TodayUI />; }

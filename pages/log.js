import dynamic from 'next/dynamic';
const LogUI = dynamic(() => import('../components/log/LogUI'), { ssr: false });
export default function LogPage() { return <LogUI />; }

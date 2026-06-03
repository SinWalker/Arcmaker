import dynamic from 'next/dynamic';
const CalUI = dynamic(() => import('../components/cal/CalUI'), { ssr: false });
export default function CalPage() { return <CalUI />; }

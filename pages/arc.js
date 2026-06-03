import dynamic from 'next/dynamic';
const ArcUI = dynamic(() => import('../components/arc/ArcUI'), { ssr: false });
export default function ArcPage() { return <ArcUI />; }

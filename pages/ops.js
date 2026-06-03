import dynamic from 'next/dynamic';
const OpsUI = dynamic(() => import('../components/ops/OpsUI'), { ssr: false });
export default function OpsPage() { return <OpsUI />; }

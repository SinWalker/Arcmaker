import dynamic from 'next/dynamic';
const LocalProfileAccessUI = dynamic(() => import('../components/LocalProfileAccessUI'), { ssr: false });
export default function PinPage() { return <LocalProfileAccessUI />; }

import dynamic from 'next/dynamic';
const PinUI = dynamic(() => import('../components/PinUI'), { ssr: false });
export default function PinPage() { return <PinUI />; }

import dynamic from 'next/dynamic';
const FieldUI = dynamic(() => import('../components/field/FieldUI'), { ssr: false });
export default function FieldPage() { return <FieldUI />; }

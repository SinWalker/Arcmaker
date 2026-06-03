import dynamic from 'next/dynamic';
const SettingsUI = dynamic(() => import('../components/SettingsUI'), { ssr: false });
export default function SettingsPage() { return <SettingsUI />; }

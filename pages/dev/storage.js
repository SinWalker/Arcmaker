import dynamic from 'next/dynamic';

// /dev/storage — persistence debug panel
// Accessible directly without auth gate — for debugging only.
const StorageUI = dynamic(() => import('../../components/dev/StorageUI'), { ssr: false });

export default function StoragePage() {
  return <StorageUI />;
}

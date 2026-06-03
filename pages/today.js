// Legacy redirect → /cal (TODAY is inside CAL day view)
import { useEffect } from 'react';
import { useRouter } from 'next/router';
export default function TodayRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/cal'); }, []);
  return null;
}

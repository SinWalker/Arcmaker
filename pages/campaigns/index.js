// Legacy redirect → /arc
import { useEffect } from 'react';
import { useRouter } from 'next/router';
export default function CampaignsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/arc'); }, []);
  return null;
}

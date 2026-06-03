// Legacy route — redirects to sessions list
import { useEffect } from 'react';
import { useRouter } from 'next/router';
export default function SessionRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/sessions'); }, []);
  return null;
}

// Legacy route — redirects to sessions list
import { useEffect } from 'react';
import { useRouter } from 'next/router';
export default function LogRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/sessions'); }, []);
  return null;
}

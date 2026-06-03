// Legacy redirect → /field
import { useEffect } from 'react';
import { useRouter } from 'next/router';
export default function SessionsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/field'); }, []);
  return null;
}

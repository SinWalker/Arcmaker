// Legacy route — diagnostics moved to /dev/foundation
import { useEffect } from 'react';
import { useRouter } from 'next/router';
export default function FoundationRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/dev/foundation'); }, []);
  return null;
}

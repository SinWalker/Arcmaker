import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function route() {
      const { getActiveProfile } = await import('../lib/profile');
      const profile = await getActiveProfile();
      router.replace(profile ? '/campaigns' : '/onboarding');
    }
    route();
  }, []);

  return null;
}

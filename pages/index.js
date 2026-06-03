import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function boot() {
      const { getActiveProfile } = await import('../lib/profile');
      const { runFullSeed } = await import('../lib/seed');

      // Run seed (idempotent — safe every boot)
      await runFullSeed();

      const profile = await getActiveProfile();
      if (!profile) {
        router.replace('/onboarding');
        return;
      }

      // PIN session check — sessionStorage clears on tab close
      const authed = sessionStorage.getItem('arcmaker_authed');
      if (authed === '1') {
        router.replace('/campaigns');
      } else {
        router.replace('/pin');
      }
    }
    boot();
  }, []);

  return null;
}

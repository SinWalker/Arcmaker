import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function boot() {
      const { runFullSeed } = await import('../lib/seed');
      const { getActiveProfile } = await import('../lib/profile');

      // Seed is idempotent — safe every boot
      await runFullSeed();

      const profile = await getActiveProfile();
      if (!profile) {
        router.replace('/onboarding');
        return;
      }

      // PIN session check — sessionStorage clears on tab close
      const authed = sessionStorage.getItem('arcmaker_authed');
      if (authed === '1') {
        router.replace('/today');
      } else {
        router.replace('/pin');
      }
    }
    boot();
  }, []);

  return null;
}

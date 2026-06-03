import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    async function route() {
      const { getActiveProfile } = await import('../lib/profile');
      const { ensureWorldCupSeedCampaign } = await import('../lib/seed');

      const profile = await getActiveProfile();
      if (!profile) {
        router.replace('/onboarding');
        return;
      }

      // Always repair seed campaign before entering app
      await ensureWorldCupSeedCampaign(profile.id);
      router.replace('/campaigns');
    }
    route();
  }, []);

  return null;
}

// ─── App Initialization ───────────────────────────────────────────────────────
// Called once on app load (browser only).
// Checks for active profile and seeds World Cup campaign if needed.
// SSR RULE: Only call from useEffect in _app or a ClientOnly wrapper.

import { getActiveProfile, getAllProfiles } from './profile';
import { seedWorldCupCampaignIfNeeded } from './seed';
import { checkDBHealth } from './db/db';

export type InitResult = {
  dbOk: boolean;
  dbVersion: number;
  hasProfile: boolean;
  profileCount: number;
  activeProfileId: string | null;
  campaignSeeded: boolean;
  seedReason: string;
  errors: string[];
};

export async function initArcMaker(): Promise<InitResult> {
  const errors: string[] = [];
  let dbOk = false;
  let dbVersion = 0;
  let hasProfile = false;
  let profileCount = 0;
  let activeProfileId: string | null = null;
  let campaignSeeded = false;
  let seedReason = '';

  // 1. DB health check
  try {
    const health = await checkDBHealth();
    dbOk = health.ok;
    dbVersion = health.version;
    if (!health.ok) {
      errors.push(`DB health check failed: ${health.error}`);
    }
  } catch (err) {
    errors.push(`DB init error: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (!dbOk) {
    return { dbOk, dbVersion, hasProfile, profileCount, activeProfileId, campaignSeeded, seedReason, errors };
  }

  // 2. Profile check
  try {
    const profiles = await getAllProfiles();
    profileCount = profiles.length;
    const active = await getActiveProfile();
    hasProfile = !!active;
    activeProfileId = active?.id ?? null;
  } catch (err) {
    errors.push(`Profile check error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // 3. Seed World Cup campaign (only if a profile exists)
  if (hasProfile && activeProfileId) {
    try {
      const seedResult = await seedWorldCupCampaignIfNeeded(activeProfileId);
      campaignSeeded = seedResult.seeded;
      seedReason = seedResult.reason;
    } catch (err) {
      errors.push(`Seed error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return {
    dbOk,
    dbVersion,
    hasProfile,
    profileCount,
    activeProfileId,
    campaignSeeded,
    seedReason,
    errors,
  };
}

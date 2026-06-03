// ─── World Cup Seed Campaign ─────────────────────────────────────────────────
// The Sin Cut — World Cup Arc
// This is NOT test data. This is the live dogfood production campaign.
// Source: ARCMAKER_V1_REQUIREMENTS.md
// SSR RULE: Only call from browser context.

import { getDB } from './db/db';
import type { Campaign } from './db/types';

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function now(): string {
  return new Date().toISOString();
}

// ─── Seed definition ─────────────────────────────────────────────────────────

export function buildWorldCupSeedCampaign(profileId: string): Campaign {
  const ts = now();
  return {
    id: uuid(),
    title: 'The Sin Cut — World Cup Arc',
    status: 'active',
    description:
      'Cinematic documentary coverage of Dallas during the 2026 FIFA World Cup. ' +
      'Capturing the city, its people, and the cultural transformation of the moment.',
    mission:
      'Document what happens when Dallas becomes one of the most important cities ' +
      'in the world for a month.',
    storyQuestion: 'What does Dallas become when the world arrives?',
    theme: 'City transformation, identity, commerce, community',
    successCriteria: [
      'At least 6 field sessions logged with full Production TOD',
      'At least 20 characters captured across the campaign',
      'At least 10 business leads documented',
      'At least one session report per shooting day',
      'Campaign exported as JSON backup at least weekly',
    ].join('\n'),
    targetCharacterTypes: [
      'Local business owners adapting to World Cup traffic',
      'International fans experiencing Dallas for the first time',
      'Dallas locals whose daily life has been disrupted or transformed',
      'Workers and vendors behind the scenes',
      'Creators and artists riding the cultural moment',
    ],
    startDate: '2026-06-01',
    endDate: '2026-07-19',
    source: 'manual',
    isSeedCampaign: true,  // PROTECTED — reset tools must check this flag
    createdByProfileId: profileId,
    userId: undefined,
    createdAt: ts,
    updatedAt: ts,
  };
}

// ─── Seed execution ──────────────────────────────────────────────────────────

export async function seedWorldCupCampaignIfNeeded(profileId: string): Promise<{
  seeded: boolean;
  campaign: Campaign | null;
  reason: string;
}> {
  const db = getDB();

  // Only seed if no campaigns exist at all
  const existingCount = await db.campaigns.count();
  if (existingCount > 0) {
    const existing = await db.campaigns.toArray();
    const seed = existing.find((c) => c.isSeedCampaign);
    return {
      seeded: false,
      campaign: seed || null,
      reason: `${existingCount} campaign(s) already exist. Skipping seed.`,
    };
  }

  const campaign = buildWorldCupSeedCampaign(profileId);
  await db.campaigns.add(campaign);

  return {
    seeded: true,
    campaign,
    reason: 'No campaigns found. World Cup seed campaign created.',
  };
}

// ─── Seed repair ─────────────────────────────────────────────────────────────
// Finds the existing World Cup campaign and patches any missing fields.
// Never overwrites a field that already has a value.
// Safe to call on every app boot.

export async function ensureWorldCupSeedCampaign(profileId: string): Promise<Campaign> {
  const db = getDB();
  const seed = buildWorldCupSeedCampaign(profileId);

  // Find by flag or title
  const all = await db.campaigns.toArray();
  const existing = all.find(
    (c) => c.isSeedCampaign === true || c.title.includes('World Cup Arc')
  );

  if (!existing) {
    await db.campaigns.add(seed);
    return seed;
  }

  // Patch only empty/null/undefined fields
  const patch: Partial<Campaign> = {};
  const fields: (keyof Campaign)[] = [
    'title', 'status', 'description', 'mission', 'storyQuestion',
    'theme', 'successCriteria', 'targetCharacterTypes',
    'startDate', 'endDate', 'source', 'isSeedCampaign',
    'createdByProfileId',
  ];

  for (const field of fields) {
    const current = existing[field];
    const isEmpty =
      current === undefined ||
      current === null ||
      current === '' ||
      (Array.isArray(current) && current.length === 0);
    if (isEmpty) {
      (patch as Record<string, unknown>)[field] = seed[field];
    }
  }

  if (Object.keys(patch).length > 0) {
    patch.updatedAt = now();
    patch.updatedByProfileId = profileId;
    await db.campaigns.update(existing.id, patch);
  }

  return { ...existing, ...patch };
}

// ─── Delete protection ────────────────────────────────────────────────────────
// Call this before any campaign delete operation.
// Returns true if delete should proceed, false if it should be blocked.

export async function checkSeedProtection(campaignId: string): Promise<{
  isSeed: boolean;
  warning: string | null;
}> {
  const db = getDB();
  const campaign = await db.campaigns.get(campaignId);

  if (!campaign) {
    return { isSeed: false, warning: null };
  }

  if (campaign.isSeedCampaign) {
    return {
      isSeed: true,
      warning:
        `"${campaign.title}" is your World Cup campaign. ` +
        'Deleting it cannot be undone. Are you absolutely sure?',
    };
  }

  return { isSeed: false, warning: null };
}

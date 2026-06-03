import { getDB } from './db/db';
import { Campaign, CampaignStatus } from './db/types';
import { getOwnershipFields } from './profile';
import { v4 as uuidv4 } from 'uuid';

export async function getCampaign(id: string): Promise<Campaign | undefined> {
  return getDB().campaigns.get(id);
}

export async function getActiveCampaign(): Promise<Campaign | undefined> {
  const db = getDB();
  return db.campaigns.where('status').equals('active').first();
}

export async function getAllCampaigns(): Promise<Campaign[]> {
  return getDB().campaigns.orderBy('createdAt').reverse().toArray();
}

export async function createCampaign(
  data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'createdByProfileId' | 'source'>
): Promise<Campaign> {
  const own = await getOwnershipFields();
  const now = new Date().toISOString();
  const campaign: Campaign = {
    id: uuidv4(),
    source: 'manual',
    createdAt: now,
    updatedAt: now,
    ...own,
    ...data,
  };
  await getDB().campaigns.add(campaign);
  return campaign;
}

export async function updateCampaign(id: string, patch: Partial<Campaign>): Promise<Campaign> {
  const own = await getOwnershipFields();
  const now = new Date().toISOString();
  await getDB().campaigns.update(id, {
    ...patch,
    updatedAt: now,
    updatedByProfileId: own.createdByProfileId,
  });
  return getDB().campaigns.get(id) as Promise<Campaign>;
}

export async function getCampaignStats(campaignId: string) {
  const db = getDB();
  const [sessions, fieldNotes, capturedShots] = await Promise.all([
    db.sessions.where('campaignId').equals(campaignId).count(),
    db.fieldNotes.where('campaignId').equals(campaignId).count(),
    db.capturedShots.where('campaignId').equals(campaignId).count(),
  ]);
  return { sessions, fieldNotes, capturedShots };
}

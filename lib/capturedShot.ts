import { getDB } from './db/db';
import { CapturedShot } from './db/types';
import { getOwnershipFields } from './profile';
import { currentTODFromSession, getSession } from './session';
import { v4 as uuidv4 } from 'uuid';

export async function getCapturedShotsForSession(sessionId: string): Promise<CapturedShot[]> {
  return getDB().capturedShots
    .where('sessionId').equals(sessionId)
    .sortBy('todSeconds');
}

export async function getCapturedShotsForCampaign(campaignId: string): Promise<CapturedShot[]> {
  return getDB().capturedShots
    .where('campaignId').equals(campaignId)
    .sortBy('createdAt');
}

export async function addCapturedShot(
  sessionId: string,
  campaignId: string,
  description: string,
  options: { notes?: string; plannedShotId?: string; assignmentId?: string } = {}
): Promise<CapturedShot> {
  const own = await getOwnershipFields();
  const now = new Date().toISOString();

  const session = await getSession(sessionId);
  let tod: string | undefined;
  let todSeconds: number | undefined;
  if (session) {
    const t = currentTODFromSession(session);
    tod = t.display;
    todSeconds = t.seconds;
  }

  const shot: CapturedShot = {
    id: uuidv4(),
    sessionId,
    campaignId,
    description,
    tod,
    todSeconds,
    source: 'manual',
    createdAt: now,
    updatedAt: now,
    ...own,
    ...options,
  };
  await getDB().capturedShots.add(shot);
  return shot;
}

export async function deleteCapturedShot(id: string): Promise<void> {
  await getDB().capturedShots.delete(id);
}

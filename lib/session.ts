import { getDB } from './db/db';
import { FieldSession } from './db/types';
import { getOwnershipFields } from './profile';
import { v4 as uuidv4 } from 'uuid';

// ── Production TOD helpers ──────────────────────────────────────────
// TOD = camera clock time. Synced manually by user aligning camera clock.
// sessionStartProductionTOD: camera clock time at sync (stored as "HH:MM:SS")
// sessionStartDeviceTimestamp: device epoch ms at sync
// Current TOD = sessionStartProductionTOD + (now - sessionStartDeviceTimestamp)

export function todSecondsFromHMS(hms: string): number {
  // "07:42:18" or "19:42:18" → seconds since midnight
  const parts = hms.split(':');
  return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + (parseInt(parts[2], 10) || 0);
}

export function todSecondsToDisplay(totalSeconds: number): string {
  const s = totalSeconds % 86400;
  const h24 = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 || 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')} ${ampm}`;
}

export function currentTODFromSession(session: FieldSession): { display: string; seconds: number } {
  if (!session.sessionStartProductionTOD || !session.sessionStartDeviceTimestamp) {
    // No sync yet — use current device time
    const now = new Date();
    const s = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    return { display: todSecondsToDisplay(s), seconds: s };
  }
  const baseSec = todSecondsFromHMS(session.sessionStartProductionTOD);
  const elapsedSec = Math.floor((Date.now() - session.sessionStartDeviceTimestamp) / 1000);
  const seconds = (baseSec + elapsedSec) % 86400;
  return { display: todSecondsToDisplay(seconds), seconds };
}

export function elapsedDisplay(session: FieldSession): string {
  if (!session.sessionStartDeviceTimestamp) return '0:00';
  const totalSec = Math.floor((Date.now() - session.sessionStartDeviceTimestamp) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── CRUD ────────────────────────────────────────────────────────────

export async function getSession(id: string): Promise<FieldSession | undefined> {
  return getDB().sessions.get(id);
}

export async function getSessionsForCampaign(campaignId: string): Promise<FieldSession[]> {
  return getDB().sessions
    .where('campaignId').equals(campaignId)
    .sortBy('date');
}

export async function getActiveSession(campaignId: string): Promise<FieldSession | undefined> {
  const sessions = await getDB().sessions
    .where('campaignId').equals(campaignId)
    .filter(s => s.status === 'active')
    .toArray();
  return sessions[0];
}

export async function createSession(
  campaignId: string,
  assignmentId: string,
  title: string,
  location?: string
): Promise<FieldSession> {
  const own = await getOwnershipFields();
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const session: FieldSession = {
    id: uuidv4(),
    campaignId,
    assignmentId,
    title,
    location,
    date: today,
    status: 'active',
    sessionStartDeviceTimestamp: Date.now(),
    source: 'manual',
    createdAt: now,
    updatedAt: now,
    ...own,
  };
  await getDB().sessions.add(session);
  return session;
}

export async function syncCameraClockToSession(
  sessionId: string,
  cameraHour: number,
  cameraMinute: number,
  cameraSecond: number
): Promise<FieldSession> {
  const own = await getOwnershipFields();
  const now = new Date().toISOString();
  const hms = `${String(cameraHour).padStart(2, '0')}:${String(cameraMinute).padStart(2, '0')}:${String(cameraSecond).padStart(2, '0')}`;
  await getDB().sessions.update(sessionId, {
    sessionStartProductionTOD: hms,
    sessionStartDeviceTimestamp: Date.now(),
    updatedAt: now,
    updatedByProfileId: own.createdByProfileId,
  });
  return getDB().sessions.get(sessionId) as Promise<FieldSession>;
}

export async function closeSession(sessionId: string): Promise<FieldSession> {
  const own = await getOwnershipFields();
  const now = new Date().toISOString();

  const session = await getDB().sessions.get(sessionId);
  let durationSeconds: number | undefined;
  if (session?.sessionStartDeviceTimestamp) {
    durationSeconds = Math.floor((Date.now() - session.sessionStartDeviceTimestamp) / 1000);
  }

  await getDB().sessions.update(sessionId, {
    status: 'completed',
    endTime: now,
    durationSeconds,
    updatedAt: now,
    updatedByProfileId: own.createdByProfileId,
  });
  return getDB().sessions.get(sessionId) as Promise<FieldSession>;
}

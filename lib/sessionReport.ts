import { getDB } from './db/db';
import { SessionReport, FieldSession } from './db/types';
import { getOwnershipFields } from './profile';
import { v4 as uuidv4 } from 'uuid';

// Counts are computed at query time, never stored (per types.ts design note)
export interface SessionReportWithCounts extends SessionReport {
  fieldNoteCount: number;
  capturedShotCount: number;
  durationMinutes?: number;
}

export async function generateSessionReport(session: FieldSession): Promise<SessionReportWithCounts> {
  const db = getDB();
  const own = await getOwnershipFields();
  const now = new Date().toISOString();

  const [notes, shots] = await Promise.all([
    db.fieldNotes.where('sessionId').equals(session.id).count(),
    db.capturedShots.where('sessionId').equals(session.id).count(),
  ]);

  let durationMinutes: number | undefined;
  if (session.durationSeconds) {
    durationMinutes = Math.round(session.durationSeconds / 60);
  } else if (session.sessionStartDeviceTimestamp && session.endTime) {
    durationMinutes = Math.round(
      (new Date(session.endTime).getTime() - session.sessionStartDeviceTimestamp) / 60000
    );
  }

  const existing = await db.sessionReports
    .where('sessionId').equals(session.id)
    .first();

  const report: SessionReport = {
    id: existing?.id ?? uuidv4(),
    sessionId: session.id,
    campaignId: session.campaignId,
    summary: existing?.summary ?? '',
    generatedAt: now,
    source: 'manual',
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    ...own,
  };

  if (existing) {
    await db.sessionReports.update(report.id, report);
  } else {
    await db.sessionReports.add(report);
  }

  return { ...report, fieldNoteCount: notes, capturedShotCount: shots, durationMinutes };
}

export async function getSessionReportWithCounts(sessionId: string): Promise<SessionReportWithCounts | null> {
  const db = getDB();
  const session = await db.sessions.get(sessionId);
  if (!session) return null;

  const [report, notes, shots] = await Promise.all([
    db.sessionReports.where('sessionId').equals(sessionId).first(),
    db.fieldNotes.where('sessionId').equals(sessionId).count(),
    db.capturedShots.where('sessionId').equals(sessionId).count(),
  ]);

  if (!report) return null;

  let durationMinutes: number | undefined;
  if (session.durationSeconds) {
    durationMinutes = Math.round(session.durationSeconds / 60);
  }

  return { ...report, fieldNoteCount: notes, capturedShotCount: shots, durationMinutes };
}

export async function updateReportSummary(reportId: string, summary: string): Promise<void> {
  const own = await getOwnershipFields();
  await getDB().sessionReports.update(reportId, {
    summary,
    updatedAt: new Date().toISOString(),
    updatedByProfileId: own.createdByProfileId,
  });
}

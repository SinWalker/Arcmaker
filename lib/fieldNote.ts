import { getDB } from './db/db';
import { FieldNote, NoteType } from './db/types';
import { getOwnershipFields } from './profile';
import { currentTODFromSession, getSession } from './session';
import { v4 as uuidv4 } from 'uuid';

export async function getFieldNotesForSession(sessionId: string): Promise<FieldNote[]> {
  return getDB().fieldNotes
    .where('sessionId').equals(sessionId)
    .sortBy('todSeconds');
}

export async function getFieldNotesForCampaign(campaignId: string): Promise<FieldNote[]> {
  return getDB().fieldNotes
    .where('campaignId').equals(campaignId)
    .sortBy('createdAt');
}

export async function addFieldNote(
  sessionId: string,
  campaignId: string,
  text: string,
  type: NoteType = 'observation'
): Promise<FieldNote> {
  const own = await getOwnershipFields();
  const now = new Date().toISOString();

  // Get current TOD from session
  const session = await getSession(sessionId);
  let tod: string | undefined;
  let todSeconds: number | undefined;
  if (session) {
    const t = currentTODFromSession(session);
    tod = t.display;
    todSeconds = t.seconds;
  }

  const note: FieldNote = {
    id: uuidv4(),
    sessionId,
    campaignId,
    text,
    type,
    tod,
    todSeconds,
    source: 'manual',
    createdAt: now,
    updatedAt: now,
    ...own,
  };
  await getDB().fieldNotes.add(note);
  return note;
}

export async function deleteFieldNote(id: string): Promise<void> {
  await getDB().fieldNotes.delete(id);
}

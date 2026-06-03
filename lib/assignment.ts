import { getDB } from './db/db';
import { Assignment, AssignmentStatus } from './db/types';
import { getOwnershipFields } from './profile';
import { v4 as uuidv4 } from 'uuid';

export async function getAssignment(id: string): Promise<Assignment | undefined> {
  return getDB().assignments.get(id);
}

export async function getAssignmentsForCampaign(campaignId: string): Promise<Assignment[]> {
  return getDB().assignments
    .where('campaignId').equals(campaignId)
    .sortBy('date');
}

export async function getAssignmentsForDate(campaignId: string, date: string): Promise<Assignment[]> {
  return getDB().assignments
    .where('[campaignId+date]').equals([campaignId, date])
    .toArray();
}

export async function getTodaysAssignments(campaignId: string): Promise<Assignment[]> {
  const today = new Date().toISOString().slice(0, 10);
  return getAssignmentsForDate(campaignId, today);
}

export async function createAssignment(
  campaignId: string,
  data: { title: string; date: string; location?: string; storyQuestion?: string; eventId?: string }
): Promise<Assignment> {
  const own = await getOwnershipFields();
  const now = new Date().toISOString();
  const assignment: Assignment = {
    id: uuidv4(),
    campaignId,
    source: 'manual',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    ...own,
    ...data,
  };
  await getDB().assignments.add(assignment);
  return assignment;
}

export async function updateAssignment(id: string, patch: Partial<Assignment>): Promise<Assignment> {
  const own = await getOwnershipFields();
  const now = new Date().toISOString();
  await getDB().assignments.update(id, {
    ...patch,
    updatedAt: now,
    updatedByProfileId: own.createdByProfileId,
  });
  return getDB().assignments.get(id) as Promise<Assignment>;
}

// ─── UserProfile System ───────────────────────────────────────────────────────
// Local identity only. Not authentication. Not security.
// All data lives in IndexedDB. Nothing touches a server.
// SSR RULE: Only call these functions in the browser (useEffect / event handlers).

import { getDB } from './db/db';
import type { UserProfile } from './db/types';

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function now(): string {
  return new Date().toISOString();
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getAllProfiles(): Promise<UserProfile[]> {
  return getDB().userProfiles.orderBy('createdAt').toArray();
}

export async function getActiveProfile(): Promise<UserProfile | undefined> {
  // isActive is stored as boolean; Dexie indexes booleans as 0/1
  return getDB().userProfiles.where('isActive').equals(1).first();
}

export async function getProfileById(id: string): Promise<UserProfile | undefined> {
  return getDB().userProfiles.get(id);
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createProfile(
  displayName: string,
  role?: string,
  makeActive = true
): Promise<UserProfile> {
  const db = getDB();
  const ts = now();

  const profile: UserProfile = {
    id: uuid(),
    displayName: displayName.trim(),
    role: role?.trim(),
    createdAt: ts,
    updatedAt: ts,
    isActive: makeActive,
  };

  await db.transaction('rw', db.userProfiles, async () => {
    if (makeActive) {
      // Deactivate all existing profiles before activating the new one
      await db.userProfiles.toCollection().modify({ isActive: false });
    }
    await db.userProfiles.add(profile);
  });

  return profile;
}

// ─── Switch ───────────────────────────────────────────────────────────────────

export async function switchProfile(id: string): Promise<UserProfile> {
  const db = getDB();

  const target = await db.userProfiles.get(id);
  if (!target) throw new Error(`Profile not found: ${id}`);

  await db.transaction('rw', db.userProfiles, async () => {
    // Deactivate all
    await db.userProfiles.toCollection().modify({ isActive: false });
    // Activate target
    await db.userProfiles.update(id, {
      isActive: true,
      updatedAt: now(),
    });
  });

  return { ...target, isActive: true };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateProfile(
  id: string,
  updates: Partial<Pick<UserProfile, 'displayName' | 'role'>>
): Promise<void> {
  await getDB().userProfiles.update(id, {
    ...updates,
    updatedAt: now(),
  });
}

// ─── Delete (deactivate only — never hard delete) ────────────────────────────
// Profiles are never deleted because future sync needs the full history.

export async function deactivateProfile(id: string): Promise<void> {
  await getDB().userProfiles.update(id, {
    isActive: false,
    updatedAt: now(),
  });
}

// ─── Ownership helper ─────────────────────────────────────────────────────────
// Use this when creating any record to stamp ownership fields.

export async function getOwnershipFields(): Promise<{
  createdByProfileId: string;
  userId: undefined;
}> {
  let profile = await getActiveProfile();

  if (!profile) {
    // Safety net: if no active profile (e.g. PIN screen missed the activation step),
    // auto-activate the first available profile rather than throwing and losing data.
    // This can happen on fresh install before the first PIN entry completes.
    const all = await getAllProfiles();
    if (all.length > 0) {
      await switchProfile(all[0].id);
      profile = { ...all[0], isActive: true };
      console.warn('[ArcMaker] getOwnershipFields: no active profile — auto-activated first profile:', profile.displayName);
    } else {
      throw new Error(
        '[ArcMaker] No profiles found. Run seed first.'
      );
    }
  }

  return {
    createdByProfileId: profile.id,
    userId: undefined, // V1 — reserved for future Supabase Auth
  };
}

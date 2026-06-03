// ─── ArcMaker Database ────────────────────────────────────────────────────────
// Dexie/IndexedDB implementation
// SSR RULE: Never import this file at module scope in Next.js pages.
// Always use: dynamic(() => import(...), { ssr: false })
// or call getDB() inside useEffect / event handlers only.

import Dexie, { Table } from 'dexie';
import type {
  UserProfile,
  Campaign,
  CampaignEvent,
  Assignment,
  FieldSession,
  FieldNote,
  PlannedShot,
  CapturedShot,
  Character,
  BusinessLead,
  SessionReport,
  Deliverable,
  ImportReview,
  StagedRecord,
} from './types';

export class ArcMakerDB extends Dexie {
  userProfiles!:   Table<UserProfile>;
  campaigns!:      Table<Campaign>;
  events!:         Table<CampaignEvent>;
  assignments!:    Table<Assignment>;
  sessions!:       Table<FieldSession>;
  fieldNotes!:     Table<FieldNote>;
  plannedShots!:   Table<PlannedShot>;
  capturedShots!:  Table<CapturedShot>;
  characters!:     Table<Character>;
  businessLeads!:  Table<BusinessLead>;
  sessionReports!: Table<SessionReport>;
  deliverables!:   Table<Deliverable>;
  importReviews!:  Table<ImportReview>;
  stagedRecords!:  Table<StagedRecord>;

  constructor() {
    super('ArcMakerDB');

    // ── Version 1 — Initial schema ──────────────────────────────────────────
    // See lib/db/migrations.ts for version history.
    // NEVER edit a shipped version. Only add new versions below.
    this.version(1).stores({
      userProfiles:
        'id, isActive, createdAt',

      campaigns:
        'id, status, createdByProfileId, createdAt',

      events:
        'id, campaignId, date, createdByProfileId, [campaignId+date], createdAt',

      assignments:
        'id, campaignId, eventId, status, date, createdByProfileId, [campaignId+date], createdAt',

      sessions:
        'id, campaignId, assignmentId, status, date, createdByProfileId, [campaignId+date], createdAt',

      fieldNotes:
        'id, sessionId, campaignId, type, todSeconds, createdByProfileId, createdAt',

      plannedShots:
        'id, assignmentId, campaignId, status, createdByProfileId, createdAt',

      capturedShots:
        'id, sessionId, assignmentId, campaignId, plannedShotId, todSeconds, createdByProfileId, createdAt',

      characters:
        'id, campaignId, sessionId, status, createdByProfileId, [campaignId+status], createdAt',

      businessLeads:
        'id, campaignId, sessionId, status, createdByProfileId, [campaignId+status], createdAt',

      sessionReports:
        'id, sessionId, campaignId, createdByProfileId, generatedAt',

      deliverables:
        'id, campaignId, status, format, createdByProfileId, createdAt',

      importReviews:
        'id, campaignId, status, fileType, createdByProfileId, [campaignId+status], createdAt',

      stagedRecords:
        'id, importReviewId, objectType, approved',
    });
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────
// One instance per browser session. Guards against:
//   - Next.js HMR creating multiple instances
//   - Multi-tab version conflicts

let _db: ArcMakerDB | null = null;

export function getDB(): ArcMakerDB {
  if (typeof window === 'undefined') {
    throw new Error(
      '[ArcMaker] getDB() was called on the server. ' +
      'All Dexie calls must run in the browser. ' +
      'Use dynamic(() => import(...), { ssr: false }) for components that use the DB.'
    );
  }

  if (!_db) {
    _db = new ArcMakerDB();

    // Reload on schema version change to prevent multi-tab upgrade deadlocks.
    // If a new tab opens with a newer schema version, this tab reloads cleanly.
    _db.on('versionchange', () => {
      console.warn('[ArcMaker] Database version changed. Reloading tab.');
      _db?.close();
      _db = null;
      window.location.reload();
    });
  }

  return _db;
}

// ─── DB health check ─────────────────────────────────────────────────────────

export async function checkDBHealth(): Promise<{
  ok: boolean;
  version: number;
  stores: string[];
  error?: string;
}> {
  try {
    const db = getDB();
    await db.open();
    return {
      ok: true,
      version: db.verno,
      stores: db.tables.map((t) => t.name),
    };
  } catch (err) {
    return {
      ok: false,
      version: 0,
      stores: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

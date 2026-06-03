// ─── ArcMaker DB Migration Log ───────────────────────────────────────────────
// This file is the single source of truth for schema version history.
// RULES:
//   - Never edit a shipped version entry.
//   - Always add new versions below the last entry.
//   - Increment version number by 1 each time.
//   - Document what changed and why.
//   - Implement the actual Dexie version() call in db.ts.

export const MIGRATIONS = [
  {
    version: 1,
    date: '2026-06-03',
    author: 'Sin Walker',
    description: 'Initial schema. All stores, compound indexes, ownership fields, todSeconds.',
    changes: [
      'userProfiles store',
      'campaigns store with isSeedCampaign field',
      'events store (CampaignEvent) with [campaignId+date] compound index',
      'assignments store with [campaignId+date] compound index',
      'sessions store with [campaignId+date] compound index',
      'fieldNotes store with todSeconds index',
      'plannedShots store',
      'capturedShots store with todSeconds index and denormalized assignmentId',
      'characters store with [campaignId+status] compound index',
      'businessLeads store with [campaignId+status] compound index',
      'sessionReports store',
      'deliverables store',
      'importReviews store with [campaignId+status] compound index',
      'stagedRecords store',
    ],
  },
  // ── Add future versions below ──────────────────────────────────────────────
  // {
  //   version: 2,
  //   date: 'YYYY-MM-DD',
  //   author: '',
  //   description: '',
  //   changes: [],
  // },
] as const;

export const CURRENT_SCHEMA_VERSION = 1;

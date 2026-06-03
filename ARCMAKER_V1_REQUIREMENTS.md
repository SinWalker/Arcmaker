# ArcMaker V1 — Finalized Requirements & Architecture
**Version:** 0.3.0  
**Status:** APPROVED WITH CHANGES  
**Last Updated:** 2026-06-03  
**Stack:** Next.js · React · TypeScript · Tailwind CSS · Dexie/IndexedDB · Vercel · Claude Sonnet

---

## Stack Confirmation

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js + React + TypeScript | Pages router |
| Styling | Tailwind CSS | Mobile-first |
| Local DB | IndexedDB via Dexie | Browser-only, SSR-guarded |
| Hosting | Vercel | Serverless functions for AI routes |
| AI | Claude Sonnet | Suggest only — never auto-approve |
| Calendar | ICS import (V1) | Google Calendar API in later phase |
| Cloud DB | None in V1 | Supabase/Postgres planned for future |
| Auth | None in V1 | Local profile system only |

---

## Pre-Flight Checklist
> These must be complete before any feature UI is built.

- [ ] **1. SSR guard** — All Dexie calls wrapped in `typeof window !== 'undefined'`. All data-bearing components use `dynamic(() => import(...), { ssr: false })`.
- [ ] **2. Dexie singleton** — Single exported `getDB()` function. Database instantiated once per browser session.
- [ ] **3. Version-change handler** — `db.on('versionchange')` reloads the tab to prevent multi-tab upgrade deadlocks.
- [ ] **4. `todSeconds` on FieldNote and CapturedShot** — Stored as seconds-since-midnight integer alongside display string. Indexed in Dexie.
- [ ] **5. Manual campaign export** — Single button exports entire campaign + all children as a JSON file. Available before any other feature ships.
- [ ] **6. UserProfile / Local Profile system** — Profile picker on first launch. Active profile stored locally. `createdByProfileId` attached to all records.
- [ ] **7. World Cup seed campaign** — Seeded on first launch. Protected from reset tools. Used as dogfood campaign throughout development.

---

## UserProfile — Local Identity System

### What This Is
A local identity layer stored in IndexedDB. Not authentication. Not security. The purpose is to identify who is creating records locally, and to prepare ownership fields for future cloud sync without building cloud sync now.

The UI may call this "Choose Profile" or "Local Login." It is not real login.

### What This Is Not
- Not password auth
- Not email auth
- Not OAuth
- Not Supabase Auth
- Not session tokens
- Not anything that touches a server

### TypeScript Type

```typescript
export interface UserProfile {
  id: string;                // UUID — globally unique for future sync
  displayName: string;       // "Sin", "Sinclair", "Second Shooter", etc.
  role?: string;             // "Director", "Media Partner", "Second Shooter"
  createdAt: string;         // ISO timestamp
  updatedAt: string;
  isActive: boolean;         // which profile is currently selected
}
```

### Dexie Store

```typescript
userProfiles: 'id, isActive, createdAt'
```

### Rules
- Only one profile may have `isActive: true` at a time.
- On first launch with no profiles, surface the profile creation screen before anything else.
- Switching profiles is allowed. Only one active at a time.
- Profiles are never deleted — only deactivated. (Future sync needs the full profile history.)
- The active profile is retrieved by: `db.userProfiles.where('isActive').equals(1).first()`

### Example Profiles for World Cup Campaign
```
{ displayName: "Sin", role: "Director" }
{ displayName: "Media Partner", role: "Second Shooter" }
```

---

## Ownership Fields — All Records

Every record in the system must carry these fields:

```typescript
interface OwnedRecord {
  createdByProfileId: string;    // local profile UUID — always set
  updatedByProfileId?: string;   // local profile UUID — set on update
  userId?: string;               // null in V1 — reserved for future Supabase Auth
}
```

### Rules
- `createdByProfileId` is required. Never null. Set at write time from the active profile.
- `updatedByProfileId` is optional. Set whenever a record is modified.
- `userId` is always null in V1. When Supabase Auth ships, this field will be populated during the sync migration. The field exists now so that migration does not require a schema redesign.

### Future Auth Migration Path
When Supabase Auth is added:
1. User authenticates with Supabase.
2. Their `userId` is written to all records where `createdByProfileId` matches their local profile.
3. Records sync to Supabase Postgres with `userId` populated.
4. Multi-device access unlocks.

No schema redesign required because `userId` already exists as a nullable field.

---

## Updated TypeScript Base Interface

```typescript
// Every record in ArcMaker extends this
interface BaseRecord {
  id: string;                    // UUID — globally unique
  campaignId: string;            // foreign key to Campaign
  source: RecordSource;          // manual | ai_suggestion | file_import
  createdAt: string;             // ISO timestamp UTC
  updatedAt: string;             // ISO timestamp UTC
  createdByProfileId: string;    // active local profile at write time
  updatedByProfileId?: string;   // active local profile at last edit
  userId?: string;               // null in V1 — future Supabase UID
}
```

---

## Updated Dexie Schema

```typescript
import Dexie, { Table } from 'dexie';

export class ArcMakerDB extends Dexie {
  userProfiles!:  Table<UserProfile>;
  campaigns!:     Table<Campaign>;
  events!:        Table<CampaignEvent>;
  assignments!:   Table<Assignment>;
  sessions!:      Table<FieldSession>;
  fieldNotes!:    Table<FieldNote>;
  plannedShots!:  Table<PlannedShot>;
  capturedShots!: Table<CapturedShot>;
  characters!:    Table<Character>;
  businessLeads!: Table<BusinessLead>;
  sessionReports!:Table<SessionReport>;
  deliverables!:  Table<Deliverable>;
  importReviews!: Table<ImportReview>;
  stagedRecords!: Table<StagedRecord>;

  constructor() {
    super('ArcMakerDB');

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

// Singleton guard — prevents multiple Dexie instances
let _db: ArcMakerDB | null = null;

export function getDB(): ArcMakerDB {
  if (typeof window === 'undefined') {
    throw new Error('getDB() called on server. Use dynamic import with ssr: false.');
  }
  if (!_db) {
    _db = new ArcMakerDB();
    // Reload on version change to prevent multi-tab upgrade deadlock
    _db.on('versionchange', () => {
      _db?.close();
      window.location.reload();
    });
  }
  return _db;
}
```

---

## World Cup Seed Campaign

### Identity
```
Title:        The Sin Cut — World Cup Arc
Status:       ACTIVE
Source:       MANUAL
Campaign Type: Documentary / Event Coverage
```

### CampaignBrief Fields (on Campaign)
```
Mission:       Document what happens when Dallas becomes one of the most 
               important cities in the world for a month.
               
Story Question: What does Dallas become when the world arrives?

Theme:         City transformation, identity, commerce, community

Target Character Types:
  - Local business owners adapting to World Cup traffic
  - International fans experiencing Dallas for the first time
  - Dallas locals whose daily life has been disrupted or transformed
  - Workers and vendors behind the scenes
  - Creators and artists riding the cultural moment

Success Criteria:
  - At least 6 field sessions logged with full Production TOD
  - At least 20 characters captured across the campaign
  - At least 10 business leads documented
  - At least one session report per shooting day
  - Campaign exported as JSON backup at least weekly
```

### Primary Locations (strings in V1)
```
Fair Park
Deep Ellum
AT&T Discovery District
AT&T Stadium (exterior — no match tickets)
Texas Live (Arlington)
```

### Validation Purpose
This campaign must be used to validate every system before it ships:
- Calendar → Assignment flow
- Field session creation and Production TOD sync
- PlannedShot vs. CapturedShot gap analysis
- Character status progression (SPOTTED → FEATURED)
- Business lead capture
- Manual campaign export
- Session report generation
- AI suggestion → review → approval workflow (when AI Campaign Builder ships)

### Protection Rules
```
isSeedCampaign: true   // special flag — add this field to Campaign
```
- Reset tools must check `isSeedCampaign` before deleting.
- If a reset is attempted against a seed campaign, show a confirmation: 
  "This is your World Cup campaign. Deleting it cannot be undone. Are you sure?"
- Developer tooling must never auto-wipe seed campaigns.
- The seed campaign is not test data. It is production data.

### Seed Campaign TypeScript Addition

```typescript
export interface Campaign {
  id: string;
  title: string;
  status: CampaignStatus;
  description?: string;
  mission?: string;           // CampaignBrief field — on Campaign directly
  storyQuestion?: string;     // CampaignBrief field — on Campaign directly
  theme?: string;             // CampaignBrief field — on Campaign directly
  successCriteria?: string;   // CampaignBrief field — on Campaign directly
  targetCharacterTypes?: string[];  // CampaignBrief field
  startDate?: string;
  endDate?: string;
  source: RecordSource;
  isSeedCampaign?: boolean;   // protects from reset/delete tools
  createdAt: string;
  updatedAt: string;
  createdByProfileId: string;
  updatedByProfileId?: string;
  userId?: string;
}
```

---

## Do Not Build in V1

The following are explicitly out of scope. Do not add them. Do not stub them. Do not create placeholder routes for them.

| Feature | When |
|---|---|
| Password auth | Future phase |
| Email auth | Future phase |
| OAuth / Google login | Future phase |
| Supabase Auth | Future phase |
| Cloud sync | Future phase |
| Team permissions | Future phase |
| Multi-user campaigns | Future phase |
| Client portals | Future phase |
| User billing | Future phase |
| Google Calendar write API | Future phase |

---

## Source of Truth — V1 Final

```
IndexedDB (Dexie)
  ↑
  Written by: active UserProfile (local)
  Protected by: SSR guard + Dexie singleton
  Backed up by: manual JSON export

AI (Claude Sonnet)
  ↓ suggests only
  → ImportReview → StagedRecord → user approval → real record

User
  = final source of truth on all approvals
  = never bypassed by AI
```

---

## Implementation Order

### Phase 0 — Foundation (no feature UI until this is done)
1. Dexie schema v1 with all stores, compound indexes, ownership fields
2. SSR guard pattern established — `getDB()` singleton, all components `ssr: false`
3. Version-change handler
4. UserProfile system — profile picker on first launch
5. World Cup seed campaign — seeded on first launch if no campaigns exist
6. Manual campaign export to JSON

### Phase 1 — Core Field Workflow
7. Campaign dashboard
8. Calendar / Mission Board
9. Today Dashboard
10. Assignment creation
11. Field Session + Production TOD
12. Field Notes (with `todSeconds`)
13. Captured Shots (with `todSeconds` and `assignmentId`)
14. Session Report (manual, computed counts only)

### Phase 2 — Campaign Planning
15. Events
16. Planned Shots
17. Characters (with status machine + promotion)
18. Business Leads

### Phase 3 — Import + AI
19. ICS calendar import
20. PDF / DOCX / TXT import → raw text extraction
21. ImportReview + StagedRecord staging layer
22. Claude Sonnet integration — suggest only
23. AI Campaign Builder UI — review and approve

### Phase 4 — Sync (future)
24. Supabase Auth
25. Supabase Postgres
26. Sync engine — local → cloud
27. Multi-device access

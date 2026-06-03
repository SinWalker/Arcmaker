# ArcMaker — Schema Reference
**Version:** 0.1.0  
**Status:** Architecture Draft  
**Last Updated:** 2026-06-03

---

## 1. Prisma Schema
> Use this when ArcMaker adds a cloud backend (Phase 6).  
> All IDs are UUIDs. All timestamps are UTC ISO strings.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Enums ────────────────────────────────────────────────────────────────────

enum CampaignStatus {
  ACTIVE
  ARCHIVED
  TEMPLATE
}

enum RecordSource {
  MANUAL
  AI_SUGGESTION
  FILE_IMPORT
}

enum SessionStatus {
  ACTIVE
  COMPLETED
  ABANDONED
}

enum CharacterStatus {
  SPOTTED
  TARGETED
  APPROACHED
  INTERVIEWED
  FEATURED
}

enum LeadStatus {
  NOTED
  CONTACTED
  CONFIRMED
}

enum ShotStatus {
  PLANNED
  CAPTURED
  MISSED
}

enum DeliverableFormat {
  YOUTUBE
  REEL
  SHORT
  DOCUMENTARY
  OTHER
}

enum DeliverableStatus {
  PLANNED
  IN_PROGRESS
  PUBLISHED
}

enum NoteType {
  NOTE
  OBSERVATION
  QUOTE
  ACTION
}

enum ImportReviewStatus {
  PENDING
  APPROVED
  DISMISSED
}

enum AssignmentStatus {
  DRAFT
  ACTIVE
  COMPLETE
}

// ─── Campaign ─────────────────────────────────────────────────────────────────

model Campaign {
  id          String         @id @default(uuid())
  title       String
  status      CampaignStatus @default(ACTIVE)
  description String?
  startDate   String?        // ISO date string YYYY-MM-DD
  endDate     String?
  source      RecordSource   @default(MANUAL)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  events        Event[]
  assignments   Assignment[]
  sessions      FieldSession[]
  characters    Character[]
  businessLeads BusinessLead[]
  deliverables  Deliverable[]
  importReviews ImportReview[]
  plannedShots  PlannedShot[]
}

// ─── Event ────────────────────────────────────────────────────────────────────

model Event {
  id          String       @id @default(uuid())
  campaignId  String
  title       String
  date        String       // YYYY-MM-DD
  location    String?
  description String?
  source      RecordSource @default(MANUAL)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  campaign    Campaign     @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  assignments Assignment[]
}

// ─── Assignment ───────────────────────────────────────────────────────────────

model Assignment {
  id            String           @id @default(uuid())
  campaignId    String
  eventId       String?
  title         String
  storyQuestion String?
  status        AssignmentStatus @default(DRAFT)
  date          String?          // YYYY-MM-DD
  location      String?
  source        RecordSource     @default(MANUAL)
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  campaign     Campaign       @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  event        Event?         @relation(fields: [eventId], references: [id], onDelete: SetNull)
  sessions     FieldSession[]
  plannedShots PlannedShot[]
}

// ─── FieldSession ─────────────────────────────────────────────────────────────

model FieldSession {
  id                       String        @id @default(uuid())
  campaignId               String
  assignmentId             String?
  title                    String
  location                 String?
  date                     String        // YYYY-MM-DD
  status                   SessionStatus @default(ACTIVE)
  sessionStartDeviceTimestamp  BigInt?   // Unix ms — device clock at session start
  sessionStartProductionTOD    String?   // HH:MM:SS — camera clock at session start
  endTime                  String?       // ISO timestamp
  durationSeconds          Int?
  source                   RecordSource  @default(MANUAL)
  createdAt                DateTime      @default(now())
  updatedAt                DateTime      @updatedAt

  campaign       Campaign       @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  assignment     Assignment?    @relation(fields: [assignmentId], references: [id], onDelete: SetNull)
  fieldNotes     FieldNote[]
  capturedShots  CapturedShot[]
  characters     Character[]    @relation("SessionCharacters")
  businessLeads  BusinessLead[] @relation("SessionLeads")
  sessionReport  SessionReport?
}

// ─── FieldNote ────────────────────────────────────────────────────────────────

model FieldNote {
  id         String       @id @default(uuid())
  sessionId  String
  campaignId String
  text       String
  tod        String?      // Production TOD at time of note HH:MM:SS AM/PM
  type       NoteType     @default(NOTE)
  source     RecordSource @default(MANUAL)
  createdAt  DateTime     @default(now())

  session  FieldSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}

// ─── PlannedShot ──────────────────────────────────────────────────────────────

model PlannedShot {
  id           String       @id @default(uuid())
  assignmentId String
  campaignId   String
  description  String
  status       ShotStatus   @default(PLANNED)
  source       RecordSource @default(MANUAL)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  assignment     Assignment     @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  campaign       Campaign       @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  capturedShots  CapturedShot[]
}

// ─── CapturedShot ─────────────────────────────────────────────────────────────

model CapturedShot {
  id            String       @id @default(uuid())
  sessionId     String
  campaignId    String
  plannedShotId String?      // null = opportunistic shot not in plan
  description   String
  tod           String?      // Production TOD HH:MM:SS AM/PM
  notes         String?
  source        RecordSource @default(MANUAL)
  createdAt     DateTime     @default(now())

  session     FieldSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  plannedShot PlannedShot? @relation(fields: [plannedShotId], references: [id], onDelete: SetNull)
}

// ─── Character ────────────────────────────────────────────────────────────────
// Exists at two levels:
//   Session-level: first encountered in a session (sessionId set)
//   Campaign-level: promoted to recurring subject (sessionId nullable)

model Character {
  id         String          @id @default(uuid())
  campaignId String
  sessionId  String?         // null = campaign-level subject
  name       String
  description String?
  status     CharacterStatus @default(SPOTTED)
  notes      String?
  source     RecordSource    @default(MANUAL)
  createdAt  DateTime        @default(now())
  updatedAt  DateTime        @updatedAt

  campaign Campaign      @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  session  FieldSession? @relation("SessionCharacters", fields: [sessionId], references: [id], onDelete: SetNull)
}

// ─── BusinessLead ─────────────────────────────────────────────────────────────

model BusinessLead {
  id         String       @id @default(uuid())
  campaignId String
  sessionId  String?
  name       String
  type       String?
  notes      String?
  status     LeadStatus   @default(NOTED)
  source     RecordSource @default(MANUAL)
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt

  campaign Campaign      @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  session  FieldSession? @relation("SessionLeads", fields: [sessionId], references: [id], onDelete: SetNull)
}

// ─── SessionReport ────────────────────────────────────────────────────────────

model SessionReport {
  id             String       @id @default(uuid())
  sessionId      String       @unique
  campaignId     String
  summary        String?
  shotsCaptured  Int          @default(0)
  shotsPlanned   Int          @default(0)
  characterCount Int          @default(0)
  leadCount      Int          @default(0)
  noteCount      Int          @default(0)
  source         RecordSource @default(MANUAL)
  generatedAt    DateTime     @default(now())

  session FieldSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}

// ─── Deliverable ──────────────────────────────────────────────────────────────

model Deliverable {
  id         String            @id @default(uuid())
  campaignId String
  title      String
  format     DeliverableFormat @default(OTHER)
  status     DeliverableStatus @default(PLANNED)
  url        String?
  notes      String?
  source     RecordSource      @default(MANUAL)
  createdAt  DateTime          @default(now())
  updatedAt  DateTime          @updatedAt

  campaign Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
}

// ─── ImportReview ─────────────────────────────────────────────────────────────

model ImportReview {
  id             String             @id @default(uuid())
  campaignId     String
  fileName       String?
  fileType       String             // pdf | docx | txt | ics | paste
  rawContent     String?            // extracted plain text
  extractedFacts Json?              // structured facts from file
  aiSuggestions  Json?              // AI-generated suggestions
  status         ImportReviewStatus @default(PENDING)
  createdAt      DateTime           @default(now())
  reviewedAt     DateTime?

  campaign      Campaign       @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  stagedRecords StagedRecord[]
}

// ─── StagedRecord ─────────────────────────────────────────────────────────────

model StagedRecord {
  id             String       @id @default(uuid())
  importReviewId String
  objectType     String       // Campaign | Event | Assignment | Character | etc.
  data           Json         // the proposed record
  approved       Boolean      @default(false)
  approvedAt     DateTime?
  rejectedAt     DateTime?

  importReview ImportReview @relation(fields: [importReviewId], references: [id], onDelete: Cascade)
}
```

---

## 2. TypeScript Types

```typescript
// ─── Enums ────────────────────────────────────────────────────────────────────

export type CampaignStatus = 'active' | 'archived' | 'template';
export type RecordSource = 'manual' | 'ai_suggestion' | 'file_import';
export type SessionStatus = 'active' | 'completed' | 'abandoned';
export type CharacterStatus = 'spotted' | 'targeted' | 'approached' | 'interviewed' | 'featured';
export type LeadStatus = 'noted' | 'contacted' | 'confirmed';
export type ShotStatus = 'planned' | 'captured' | 'missed';
export type DeliverableFormat = 'youtube' | 'reel' | 'short' | 'documentary' | 'other';
export type DeliverableStatus = 'planned' | 'in_progress' | 'published';
export type NoteType = 'note' | 'observation' | 'quote' | 'action';
export type ImportReviewStatus = 'pending' | 'approved' | 'dismissed';
export type AssignmentStatus = 'draft' | 'active' | 'complete';

// ─── Base ─────────────────────────────────────────────────────────────────────

interface BaseRecord {
  id: string;             // UUID
  campaignId: string;
  source: RecordSource;
  createdAt: string;      // ISO timestamp
}

// ─── Campaign ─────────────────────────────────────────────────────────────────

export interface Campaign {
  id: string;
  title: string;
  status: CampaignStatus;
  description?: string;
  startDate?: string;     // YYYY-MM-DD
  endDate?: string;
  source: RecordSource;
  createdAt: string;
  updatedAt: string;
}

// ─── Event ────────────────────────────────────────────────────────────────────

export interface CampaignEvent extends BaseRecord {
  title: string;
  date: string;           // YYYY-MM-DD
  location?: string;
  description?: string;
  updatedAt: string;
}

// ─── Assignment ───────────────────────────────────────────────────────────────

export interface Assignment extends BaseRecord {
  eventId?: string;       // nullable — assignment may exist without a specific event
  title: string;
  storyQuestion?: string;
  status: AssignmentStatus;
  date?: string;          // YYYY-MM-DD
  location?: string;
  updatedAt: string;
}

// ─── FieldSession ─────────────────────────────────────────────────────────────

export interface FieldSession extends BaseRecord {
  assignmentId?: string;
  title: string;
  location?: string;
  date: string;           // YYYY-MM-DD
  status: SessionStatus;
  sessionStartDeviceTimestamp?: number;   // Unix ms
  sessionStartProductionTOD?: string;    // "HH:MM:SS"
  endTime?: string;       // ISO timestamp
  durationSeconds?: number;
  updatedAt: string;
}

// Derived — computed at runtime, never stored
export interface ActiveSessionState {
  session: FieldSession;
  currentProductionTOD: string;   // "HH:MM:SS AM/PM"
  elapsedSeconds: number;
}

// ─── FieldNote ────────────────────────────────────────────────────────────────

export interface FieldNote extends BaseRecord {
  sessionId: string;
  text: string;
  tod?: string;           // Production TOD "HH:MM:SS AM/PM"
  type: NoteType;
}

// ─── PlannedShot ──────────────────────────────────────────────────────────────

export interface PlannedShot extends BaseRecord {
  assignmentId: string;
  description: string;
  status: ShotStatus;
  updatedAt: string;
}

// ─── CapturedShot ─────────────────────────────────────────────────────────────

export interface CapturedShot extends BaseRecord {
  sessionId: string;
  plannedShotId?: string; // null = opportunistic
  description: string;
  tod?: string;           // Production TOD "HH:MM:SS AM/PM"
  notes?: string;
}

// ─── Character ────────────────────────────────────────────────────────────────

export interface Character extends BaseRecord {
  sessionId?: string;     // null = promoted to campaign-level subject
  name: string;
  description?: string;
  status: CharacterStatus;
  notes?: string;
  updatedAt: string;
}

// ─── BusinessLead ─────────────────────────────────────────────────────────────

export interface BusinessLead extends BaseRecord {
  sessionId?: string;
  name: string;
  type?: string;
  notes?: string;
  status: LeadStatus;
  updatedAt: string;
}

// ─── SessionReport ────────────────────────────────────────────────────────────

export interface SessionReport extends BaseRecord {
  sessionId: string;      // 1:1 with FieldSession
  summary?: string;
  shotsCaptured: number;
  shotsPlanned: number;
  characterCount: number;
  leadCount: number;
  noteCount: number;
  generatedAt: string;
}

// ─── Deliverable ──────────────────────────────────────────────────────────────

export interface Deliverable extends BaseRecord {
  title: string;
  format: DeliverableFormat;
  status: DeliverableStatus;
  url?: string;
  notes?: string;
  updatedAt: string;
}

// ─── ImportReview ─────────────────────────────────────────────────────────────

export interface ImportReview {
  id: string;
  campaignId: string;
  fileName?: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'ics' | 'paste';
  rawContent?: string;
  extractedFacts?: ExtractedFacts;
  aiSuggestions?: AiSuggestions;
  status: ImportReviewStatus;
  createdAt: string;
  reviewedAt?: string;
}

export interface ExtractedFacts {
  events?: Partial<CampaignEvent>[];
  characters?: Partial<Character>[];
  locations?: string[];
  dates?: string[];
  rawLines?: string[];
}

export interface AiSuggestions {
  shotList?: string[];
  interviewQuestions?: string[];
  contentIdeas?: string[];
  businessOpportunities?: string[];
  storyArcs?: string[];
  assignments?: Partial<Assignment>[];
}

// ─── StagedRecord ─────────────────────────────────────────────────────────────

export interface StagedRecord {
  id: string;
  importReviewId: string;
  objectType: keyof ArcMakerSchema;
  data: Record<string, unknown>;
  approved: boolean;
  approvedAt?: string;
  rejectedAt?: string;
}

// ─── Full Schema Map (for StagedRecord.objectType) ───────────────────────────

export interface ArcMakerSchema {
  Campaign: Campaign;
  CampaignEvent: CampaignEvent;
  Assignment: Assignment;
  FieldSession: FieldSession;
  FieldNote: FieldNote;
  PlannedShot: PlannedShot;
  CapturedShot: CapturedShot;
  Character: Character;
  BusinessLead: BusinessLead;
  SessionReport: SessionReport;
  Deliverable: Deliverable;
  ImportReview: ImportReview;
  StagedRecord: StagedRecord;
}
```

---

## 3. IndexedDB Schema (Dexie.js)

```typescript
import Dexie, { Table } from 'dexie';
import type {
  Campaign, CampaignEvent, Assignment, FieldSession,
  FieldNote, PlannedShot, CapturedShot, Character,
  BusinessLead, SessionReport, Deliverable,
  ImportReview, StagedRecord,
} from './types';

export class ArcMakerDB extends Dexie {
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
      // Primary key + indexed foreign keys + critical query fields
      // Format: "primaryKey, index1, index2, [compound+index]"

      campaigns:
        'id, status, createdAt',

      events:
        'id, campaignId, date, createdAt',

      assignments:
        'id, campaignId, eventId, status, date, createdAt',

      sessions:
        'id, campaignId, assignmentId, status, date, createdAt',

      fieldNotes:
        'id, sessionId, campaignId, type, createdAt',

      plannedShots:
        'id, assignmentId, campaignId, status, createdAt',

      capturedShots:
        'id, sessionId, campaignId, plannedShotId, createdAt',

      characters:
        'id, campaignId, sessionId, status, createdAt',

      businessLeads:
        'id, campaignId, sessionId, status, createdAt',

      sessionReports:
        'id, sessionId, campaignId, generatedAt',

      deliverables:
        'id, campaignId, status, format, createdAt',

      importReviews:
        'id, campaignId, status, fileType, createdAt',

      stagedRecords:
        'id, importReviewId, objectType, approved',
    });
  }
}

export const db = new ArcMakerDB();

// ─── Query helpers ────────────────────────────────────────────────────────────
// These replace raw localStorage lookups everywhere in the app.

export const queries = {

  // Active session guard — call on app load
  async getActiveSession(): Promise<FieldSession | undefined> {
    return db.sessions.where('status').equals('active').first();
  },

  // Everything needed for Today Dashboard in one shot
  async getTodayDashboard(campaignId: string, date: string) {
    const [assignments, sessions, characters, leads] = await Promise.all([
      db.assignments.where('[campaignId+date]').equals([campaignId, date]).toArray(),
      db.sessions.where('[campaignId+date]').equals([campaignId, date]).toArray(),
      db.characters.where('campaignId').equals(campaignId).toArray(),
      db.businessLeads.where('campaignId').equals(campaignId).toArray(),
    ]);
    return { assignments, sessions, characters, leads };
  },

  // Full session log for report
  async getSessionWithAll(sessionId: string) {
    const [session, notes, shots, characters, leads, report] = await Promise.all([
      db.sessions.get(sessionId),
      db.fieldNotes.where('sessionId').equals(sessionId).toArray(),
      db.capturedShots.where('sessionId').equals(sessionId).toArray(),
      db.characters.where('sessionId').equals(sessionId).toArray(),
      db.businessLeads.where('sessionId').equals(sessionId).toArray(),
      db.sessionReports.where('sessionId').equals(sessionId).first(),
    ]);
    return { session, notes, shots, characters, leads, report };
  },

  // Campaign-level character roster (all statuses)
  async getCampaignCharacters(campaignId: string) {
    return db.characters.where('campaignId').equals(campaignId).toArray();
  },

  // Planned vs captured shot gap analysis for an assignment
  async getShotGapAnalysis(assignmentId: string) {
    const planned = await db.plannedShots
      .where('assignmentId').equals(assignmentId).toArray();
    const captured = await db.capturedShots
      .where('assignmentId').equals(assignmentId).toArray();
    return {
      planned,
      captured,
      missing: planned.filter(p =>
        p.status !== 'captured' &&
        !captured.some(c => c.plannedShotId === p.id)
      ),
      opportunistic: captured.filter(c => !c.plannedShotId),
    };
  },

  // Pending import reviews
  async getPendingImports(campaignId: string) {
    return db.importReviews
      .where('[campaignId+status]')
      .equals([campaignId, 'pending'])
      .toArray();
  },
};

// ─── Version migration stubs ──────────────────────────────────────────────────
// Add new versions here as schema evolves. Never edit version 1.

// db.version(2).stores({ ... }).upgrade(tx => { ... });
```

---

## 4. Source-of-Truth Conflict Analysis

### Conflict 1 — Compound indexes not defined above (CRITICAL)
The query helper `getTodayDashboard` uses `[campaignId+date]` as a compound index, but the Dexie schema string above does not declare it. Dexie requires compound indexes to be explicitly declared in the stores definition as `[field1+field2]`. Missing compound indexes will cause silent full-table scans at scale.

**Fix:** Add compound indexes to the schema:
```typescript
assignments: 'id, campaignId, eventId, status, date, [campaignId+date], createdAt',
sessions:    'id, campaignId, assignmentId, status, date, [campaignId+date], createdAt',
importReviews: 'id, campaignId, status, fileType, [campaignId+status], createdAt',
```

---

### Conflict 2 — CapturedShot has no assignmentId (IMPORTANT)
The `getShotGapAnalysis` query above filters `capturedShots` by `assignmentId`, but `CapturedShot` in the type definition only has `sessionId`. You can derive the assignment via `session → assignmentId`, but that requires a join. At scale this is a performance problem and a query complexity problem.

**Fix:** Add `assignmentId` as a denormalized field on `CapturedShot`:
```typescript
export interface CapturedShot extends BaseRecord {
  sessionId: string;
  assignmentId?: string;  // denormalized from session for direct querying
  plannedShotId?: string;
  ...
}
```
Denormalization is acceptable here because `assignmentId` is set at write time and never changes.

---

### Conflict 3 — Character dual-level promotion has no workflow (IMPORTANT)
The architecture correctly defines Characters at two levels: session-level (first encounter) and campaign-level (promoted subject). But there is no defined workflow for promotion. Currently `sessionId` being null is the only signal that a Character is campaign-level. There is no timestamp of when promotion happened, no record of which session triggered it, and no way to undo a promotion.

**Fix:** Add promotion fields to Character:
```typescript
export interface Character extends BaseRecord {
  sessionId?: string;
  promotedAt?: string;      // ISO timestamp of campaign-level promotion
  promotedFromSessionId?: string;  // which session triggered promotion
  ...
}
```

---

### Conflict 4 — Production TOD is a string, not a comparable value (IMPORTANT)
`tod` is stored as `"07:42:18 PM"` — a display string. You cannot sort, filter, or compare TOD strings without parsing them first. If a user wants to find all notes between 7:30 PM and 8:00 PM, the current schema cannot answer that query directly.

**Fix:** Store TOD as seconds-since-midnight (integer) alongside the display string:
```typescript
export interface FieldNote extends BaseRecord {
  tod?: string;         // display string "07:42:18 PM" — for UI
  todSeconds?: number;  // seconds since midnight — for sorting and filtering
}
```
Same fix applies to `CapturedShot.tod`.

---

### Conflict 5 — StagedRecord.data is untyped Json (NICE TO HAVE)
`data: Record<string, unknown>` in TypeScript and `Json` in Prisma means you have no compile-time guarantees about what's inside a staged record. When you go to approve a staged Character, you have to cast and validate at runtime.

**Fix:** Use a discriminated union:
```typescript
export type StagedRecordData =
  | { objectType: 'CampaignEvent'; data: Partial<CampaignEvent> }
  | { objectType: 'Assignment';    data: Partial<Assignment> }
  | { objectType: 'Character';     data: Partial<Character> }
  | { objectType: 'PlannedShot';   data: Partial<PlannedShot> }
  | { objectType: 'BusinessLead';  data: Partial<BusinessLead> };

export type StagedRecord = {
  id: string;
  importReviewId: string;
  approved: boolean;
  approvedAt?: string;
  rejectedAt?: string;
} & StagedRecordData;
```

---

### Conflict 6 — SessionReport counts can drift from actual data (NICE TO HAVE)
`SessionReport` stores `shotsCaptured`, `characterCount`, etc. as integers. These are derived counts — but if a user adds a `CapturedShot` after the report is generated, the counts become stale. The report is now lying.

**Fix:** Never store derived counts. Always compute them at query time:
```typescript
// Remove from SessionReport interface:
// shotsCaptured, shotsPlanned, characterCount, leadCount, noteCount

// Replace with a computed summary query:
async function getSessionSummary(sessionId: string) {
  const [shots, characters, leads, notes] = await Promise.all([
    db.capturedShots.where('sessionId').equals(sessionId).count(),
    db.characters.where('sessionId').equals(sessionId).count(),
    db.businessLeads.where('sessionId').equals(sessionId).count(),
    db.fieldNotes.where('sessionId').equals(sessionId).count(),
  ]);
  return { shots, characters, leads, notes };
}
```

---

## 5. Summary of Required Fixes Before Implementation

| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| 1 | Missing compound indexes in Dexie schema | Critical | Add `[campaignId+date]`, `[campaignId+status]` |
| 2 | `CapturedShot` missing `assignmentId` | Important | Denormalize `assignmentId` onto `CapturedShot` |
| 3 | Character promotion has no workflow | Important | Add `promotedAt`, `promotedFromSessionId` |
| 4 | TOD stored as display string only | Important | Add `todSeconds: number` alongside display string |
| 5 | `StagedRecord.data` is untyped | Nice to have | Use discriminated union |
| 6 | SessionReport counts can drift | Nice to have | Compute counts at query time, don't store them |
```

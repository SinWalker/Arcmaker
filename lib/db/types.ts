// ─── ArcMaker V1 TypeScript Types ────────────────────────────────────────────
// Source of truth: ARCMAKER_V1_REQUIREMENTS.md
// Schema version: 1
// DO NOT modify this file without updating the Dexie schema version in db.ts

// ─── Enums ───────────────────────────────────────────────────────────────────

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

// ─── Ownership — every record carries these ──────────────────────────────────

export interface OwnedRecord {
  createdByProfileId: string;   // active local profile UUID at write time — required
  updatedByProfileId?: string;  // active local profile UUID at last edit
  userId?: string;              // null in V1 — reserved for future Supabase Auth
}

// ─── Base — every campaign-scoped record extends this ────────────────────────

export interface BaseRecord extends OwnedRecord {
  id: string;           // UUID — globally unique
  campaignId: string;   // foreign key to Campaign
  source: RecordSource;
  createdAt: string;    // ISO timestamp UTC
  updatedAt: string;    // ISO timestamp UTC
}

// ─── UserProfile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;           // UUID — globally unique for future sync
  displayName: string;  // "Sin", "Sinclair", "Second Shooter"
  role?: string;        // "Director", "Media Partner", "Second Shooter"
  createdAt: string;    // ISO timestamp
  updatedAt: string;
  isActive: boolean;    // only one profile may be active at a time
}

// ─── Campaign ────────────────────────────────────────────────────────────────

export interface Campaign extends OwnedRecord {
  id: string;
  title: string;
  status: CampaignStatus;
  description?: string;
  // CampaignBrief fields — live directly on Campaign (no separate object)
  mission?: string;
  storyQuestion?: string;
  theme?: string;
  successCriteria?: string;
  targetCharacterTypes?: string[];
  startDate?: string;   // YYYY-MM-DD
  endDate?: string;     // YYYY-MM-DD
  source: RecordSource;
  isSeedCampaign?: boolean;  // protects from reset/delete tools
  createdAt: string;
  updatedAt: string;
}

// ─── CampaignEvent ───────────────────────────────────────────────────────────
// Named CampaignEvent (not Event) to avoid collision with DOM Event interface

export interface CampaignEvent extends BaseRecord {
  title: string;
  date: string;         // YYYY-MM-DD
  location?: string;
  description?: string;
}

// ─── Assignment ──────────────────────────────────────────────────────────────

export interface Assignment extends BaseRecord {
  eventId?: string;     // nullable — assignment can exist without a specific event
  title: string;
  storyQuestion?: string;
  status: AssignmentStatus;
  date?: string;        // YYYY-MM-DD
  location?: string;
}

// ─── FieldSession ────────────────────────────────────────────────────────────

export interface FieldSession extends BaseRecord {
  assignmentId: string; // required — use system "Unplanned" assignment if no formal one
  title: string;
  location?: string;
  date: string;         // YYYY-MM-DD
  status: SessionStatus;
  sessionStartDeviceTimestamp?: number;  // Unix ms — device clock at session start
  sessionStartProductionTOD?: string;   // "HH:MM:SS" — camera clock at session start
  endTime?: string;     // ISO timestamp
  durationSeconds?: number;
}

// Active session state — computed at runtime, never stored
export interface ActiveSessionState {
  session: FieldSession;
  currentProductionTOD: string;  // "HH:MM:SS AM/PM"
  elapsedSeconds: number;
}

// ─── FieldNote ───────────────────────────────────────────────────────────────

export interface FieldNote extends BaseRecord {
  sessionId: string;
  text: string;
  tod?: string;         // display string "07:42:18 PM"
  todSeconds?: number;  // seconds since midnight — for sorting and range queries
  type: NoteType;
}

// ─── PlannedShot ─────────────────────────────────────────────────────────────

export interface PlannedShot extends BaseRecord {
  assignmentId: string;
  description: string;
  status: ShotStatus;
}

// ─── CapturedShot ────────────────────────────────────────────────────────────

export interface CapturedShot extends BaseRecord {
  sessionId: string;
  assignmentId?: string;    // denormalized from session for direct querying
  plannedShotId?: string;   // null = opportunistic shot not in plan
  description: string;
  tod?: string;             // display string "07:42:18 PM"
  todSeconds?: number;      // seconds since midnight — for sorting and range queries
  notes?: string;
}

// ─── Character ───────────────────────────────────────────────────────────────
// Exists at two levels:
//   Session-level: first encountered (sessionId set)
//   Campaign-level: promoted to recurring subject (sessionId null)

export interface Character extends BaseRecord {
  sessionId?: string;            // null = promoted to campaign-level
  name: string;
  description?: string;
  status: CharacterStatus;
  notes?: string;
  promotedAt?: string;           // ISO timestamp of campaign-level promotion
  promotedFromSessionId?: string; // which session triggered promotion
}

// ─── BusinessLead ────────────────────────────────────────────────────────────

export interface BusinessLead extends BaseRecord {
  sessionId?: string;
  name: string;
  type?: string;
  notes?: string;
  status: LeadStatus;
}

// ─── SessionReport ───────────────────────────────────────────────────────────
// Counts are NOT stored — always computed at query time to prevent drift

export interface SessionReport extends BaseRecord {
  sessionId: string;   // 1:1 with FieldSession
  summary?: string;
  generatedAt: string; // ISO timestamp
}

// ─── Deliverable ─────────────────────────────────────────────────────────────

export interface Deliverable extends BaseRecord {
  title: string;
  format: DeliverableFormat;
  status: DeliverableStatus;
  url?: string;
  notes?: string;
}

// ─── ImportReview ────────────────────────────────────────────────────────────

export interface ImportReview extends BaseRecord {
  fileName?: string;
  fileType: 'pdf' | 'docx' | 'txt' | 'ics' | 'paste';
  rawContent?: string;
  extractedFacts?: ExtractedFacts;
  aiSuggestions?: AiSuggestions;
  status: ImportReviewStatus;
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

// ─── StagedRecord ────────────────────────────────────────────────────────────

export type StagedObjectType =
  | 'Campaign'
  | 'CampaignEvent'
  | 'Assignment'
  | 'Character'
  | 'PlannedShot'
  | 'BusinessLead'
  | 'Deliverable';

export type StagedRecordData =
  | { objectType: 'Campaign';       data: Partial<Campaign> }
  | { objectType: 'CampaignEvent';  data: Partial<CampaignEvent> }
  | { objectType: 'Assignment';     data: Partial<Assignment> }
  | { objectType: 'Character';      data: Partial<Character> }
  | { objectType: 'PlannedShot';    data: Partial<PlannedShot> }
  | { objectType: 'BusinessLead';   data: Partial<BusinessLead> }
  | { objectType: 'Deliverable';    data: Partial<Deliverable> };

export type StagedRecord = {
  id: string;
  importReviewId: string;
  approved: boolean;
  approvedAt?: string;
  rejectedAt?: string;
} & StagedRecordData;

// ─── Export format ───────────────────────────────────────────────────────────

export interface CampaignExport {
  schemaVersion: number;
  exportTimestamp: string;
  campaign: Campaign;
  events: CampaignEvent[];
  assignments: Assignment[];
  sessions: FieldSession[];
  fieldNotes: FieldNote[];
  plannedShots: PlannedShot[];
  capturedShots: CapturedShot[];
  characters: Character[];
  businessLeads: BusinessLead[];
  sessionReports: SessionReport[];
  deliverables: Deliverable[];
  importReviews: ImportReview[];
  stagedRecords: StagedRecord[];
}

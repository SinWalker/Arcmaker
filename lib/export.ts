// ─── Campaign Export ──────────────────────────────────────────────────────────
// Exports a complete campaign and all child records to a JSON file.
// This is the primary data protection mechanism in V1.
// SSR RULE: Only call from browser context.

import { getDB } from './db/db';
import { CURRENT_SCHEMA_VERSION } from './db/migrations';
import type { Campaign, CampaignExport } from './db/types';

// ─── Export ───────────────────────────────────────────────────────────────────

export async function exportCampaign(campaignId: string): Promise<CampaignExport> {
  const db = getDB();

  const campaign = await db.campaigns.get(campaignId);
  if (!campaign) throw new Error(`Campaign not found: ${campaignId}`);

  const [
    events,
    assignments,
    sessions,
    fieldNotes,
    plannedShots,
    capturedShots,
    characters,
    businessLeads,
    sessionReports,
    deliverables,
    importReviews,
    stagedRecords,
  ] = await Promise.all([
    db.events.where('campaignId').equals(campaignId).toArray(),
    db.assignments.where('campaignId').equals(campaignId).toArray(),
    db.sessions.where('campaignId').equals(campaignId).toArray(),
    db.fieldNotes.where('campaignId').equals(campaignId).toArray(),
    db.plannedShots.where('campaignId').equals(campaignId).toArray(),
    db.capturedShots.where('campaignId').equals(campaignId).toArray(),
    db.characters.where('campaignId').equals(campaignId).toArray(),
    db.businessLeads.where('campaignId').equals(campaignId).toArray(),
    db.sessionReports.where('campaignId').equals(campaignId).toArray(),
    db.deliverables.where('campaignId').equals(campaignId).toArray(),
    db.importReviews.where('campaignId').equals(campaignId).toArray(),
    // StagedRecords don't have campaignId — fetch via importReview IDs
    db.stagedRecords.toArray(),
  ]);

  // Filter stagedRecords to only those belonging to this campaign's import reviews
  const importReviewIds = new Set(importReviews.map((ir) => ir.id));
  const filteredStagedRecords = stagedRecords.filter((sr) =>
    importReviewIds.has(sr.importReviewId)
  );

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportTimestamp: new Date().toISOString(),
    campaign,
    events,
    assignments,
    sessions,
    fieldNotes,
    plannedShots,
    capturedShots,
    characters,
    businessLeads,
    sessionReports,
    deliverables,
    importReviews,
    stagedRecords: filteredStagedRecords,
  };
}

// ─── Download ─────────────────────────────────────────────────────────────────
// Triggers a browser file download of the exported campaign JSON.

export function downloadCampaignExport(data: CampaignExport): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const filename = buildExportFilename(data.campaign);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Filename format ─────────────────────────────────────────────────────────
// Format: arcmaker_[slugified-title]_[YYYY-MM-DD].json
// Example: arcmaker_the-sin-cut-world-cup-arc_2026-06-03.json

export function buildExportFilename(campaign: Campaign): string {
  const slug = campaign.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const date = new Date().toISOString().slice(0, 10);
  return `arcmaker_${slug}_${date}.json`;
}

// ─── Export + Download combined ───────────────────────────────────────────────

export async function exportAndDownloadCampaign(campaignId: string): Promise<{
  success: boolean;
  filename: string;
  recordCounts: Record<string, number>;
  error?: string;
}> {
  try {
    const data = await exportCampaign(campaignId);
    downloadCampaignExport(data);

    return {
      success: true,
      filename: buildExportFilename(data.campaign),
      recordCounts: {
        events: data.events.length,
        assignments: data.assignments.length,
        sessions: data.sessions.length,
        fieldNotes: data.fieldNotes.length,
        plannedShots: data.plannedShots.length,
        capturedShots: data.capturedShots.length,
        characters: data.characters.length,
        businessLeads: data.businessLeads.length,
        sessionReports: data.sessionReports.length,
        deliverables: data.deliverables.length,
        importReviews: data.importReviews.length,
        stagedRecords: data.stagedRecords.length,
      },
    };
  } catch (err) {
    return {
      success: false,
      filename: '',
      recordCounts: {},
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

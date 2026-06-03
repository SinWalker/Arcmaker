import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getCampaign, getCampaignStats } from '../../lib/campaign';
import { exportAndDownloadCampaign } from '../../lib/export';

const STATUS_COLOR = { active: '#27AE60', archived: '#555', template: '#5B9BD5' };
const STATUS_LABEL = { active: 'Active', archived: 'Archived', template: 'Template' };

export default function CampaignHomeUI({ campaignId }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState(null);
  const [stats, setStats] = useState({ sessions: 0, fieldNotes: 0, capturedShots: 0 });
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const c = await getCampaign(campaignId);
      setCampaign(c);
      if (c) {
        const s = await getCampaignStats(c.id);
        setStats(s);
      }
      setLoading(false);
    }
    if (campaignId) load();
  }, [campaignId]);

  async function handleExport() {
    if (!campaign) return;
    setExporting(true);
    await exportAndDownloadCampaign(campaign.id);
    setExporting(false);
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#444', fontSize: 14 }}>Loading...</div>
    </div>
  );

  if (!campaign) return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#888', fontSize: 14 }}>Campaign not found.</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', color: '#F0F0F0' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>

        {/* Back */}
        <button
          onClick={() => router.push('/campaigns')}
          style={{ background: 'none', border: 'none', color: '#C9A84C', fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          ‹ All Arcs
        </button>

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: STATUS_COLOR[campaign.status] }}>
            ● {STATUS_LABEL[campaign.status]}
          </span>
          {campaign.isSeedCampaign && (
            <span style={{ fontSize: 11, color: '#C9A84C', background: '#2A2A1A', borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>
              WORLD CUP
            </span>
          )}
        </div>

        {/* Title */}
        <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.15, marginBottom: 20, letterSpacing: -0.5 }}>
          {campaign.title}
        </div>

        {/* Mission */}
        {campaign.mission && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#7A6330', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
              Mission
            </div>
            <div style={{ fontSize: 15, color: '#CCC', lineHeight: 1.6 }}>
              {campaign.mission}
            </div>
          </div>
        )}

        {/* Story Question */}
        {campaign.storyQuestion && (
          <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderLeft: '3px solid #C9A84C', borderRadius: '0 8px 8px 0', padding: '14px 16px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#7A6330', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
              Story Question
            </div>
            <div style={{ fontSize: 16, color: '#F0F0F0', fontStyle: 'italic', lineHeight: 1.5 }}>
              "{campaign.storyQuestion}"
            </div>
          </div>
        )}

        {/* Dates */}
        {campaign.startDate && (
          <div style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>
            {campaign.startDate} → {campaign.endDate}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 32 }}>
          {[
            { n: stats.sessions, label: 'Sessions' },
            { n: stats.fieldNotes, label: 'Notes' },
            { n: stats.capturedShots, label: 'Shots' },
          ].map(({ n, label }) => (
            <div key={label} style={{ flex: 1, background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, color: '#C9A84C', fontWeight: 800 }}>{n}</div>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <button
          className="btn btn-gold"
          style={{ fontSize: 16, padding: 16, marginBottom: 10 }}
          onClick={() => router.push('/today')}
        >
          Open Today →
        </button>

        {/* Secondary CTA */}
        <button
          className="btn btn-ghost"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? 'Exporting...' : '⬇ Export Campaign JSON'}
        </button>

        {/* Dev link */}
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <button
            onClick={() => router.push('/dev/foundation')}
            style={{ background: 'none', border: 'none', color: '#2A2A2A', fontSize: 11, cursor: 'pointer' }}
          >
            diagnostics
          </button>
        </div>

      </div>
    </div>
  );
}

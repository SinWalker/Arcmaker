import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { getCampaign, getCampaignStats, updateCampaign } from '../../lib/campaign';
import { exportAndDownloadCampaign } from '../../lib/export';
import SaveStatus from '../shared/SaveStatus';

const STATUS_COLOR = { active: '#27AE60', archived: '#555', template: '#5B9BD5' };
const STATUS_LABEL = { active: 'Active', archived: 'Archived', template: 'Template' };

const FIELD_LABEL = {
  mission: 'Mission',
  storyQuestion: 'Story Question',
  theme: 'Theme',
  successCriteria: 'Success Criteria',
  targetCharacterTypes: 'Target Character Types',
};

function Field({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 11, color: '#7A6330', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
        {hint && <span style={{ color: '#3A3A2A', fontWeight: 400, marginLeft: 8, letterSpacing: 0 }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export default function CampaignHomeUI({ campaignId }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState(null);
  const [stats, setStats] = useState({ sessions: 0, fieldNotes: 0, capturedShots: 0 });
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Editable fields — kept in sync with IndexedDB
  const [fields, setFields] = useState({
    mission: '',
    storyQuestion: '',
    theme: '',
    successCriteria: '',
    targetCharacterTypesText: '', // textarea: one per line
  });

  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved'|'saving'|'unsaved'|'error'
  const [lastSaved, setLastSaved] = useState(null);
  const debounceRef = useRef(null);
  const latestFields = useRef(fields);
  latestFields.current = fields;

  useEffect(() => {
    async function load() {
      const c = await getCampaign(campaignId);
      setCampaign(c);
      if (c) {
        const s = await getCampaignStats(c.id);
        setStats(s);
        setFields({
          mission: c.mission ?? '',
          storyQuestion: c.storyQuestion ?? '',
          theme: c.theme ?? '',
          successCriteria: c.successCriteria ?? '',
          targetCharacterTypesText: (c.targetCharacterTypes ?? []).join('\n'),
        });
      }
      setLoading(false);
    }
    if (campaignId) load();
  }, [campaignId]);

  const saveNow = useCallback(async (overrideFields) => {
    const f = overrideFields ?? latestFields.current;
    setSaveStatus('saving');
    try {
      await updateCampaign(campaignId, {
        mission: f.mission || undefined,
        storyQuestion: f.storyQuestion || undefined,
        theme: f.theme || undefined,
        successCriteria: f.successCriteria || undefined,
        targetCharacterTypes: f.targetCharacterTypesText
          ? f.targetCharacterTypesText.split('\n').map(s => s.trim()).filter(Boolean)
          : [],
      });
      setSaveStatus('saved');
      setLastSaved(Date.now());
    } catch {
      setSaveStatus('error');
    }
  }, [campaignId]);

  function handleChange(key, value) {
    const next = { ...latestFields.current, [key]: value };
    setFields(next);
    setSaveStatus('unsaved');

    // Debounce autosave — 800ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveNow(next), 800);
  }

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
    <div style={{ minHeight: '100vh', background: '#0D0D0D', color: '#F0F0F0', paddingBottom: 60 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>

        {/* Back */}
        <button
          onClick={() => router.push('/campaigns')}
          style={{ background: 'none', border: 'none', color: '#C9A84C', fontSize: 14, fontWeight: 700, cursor: 'pointer', padding: 0, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 4 }}
        >
          ‹ All Arcs
        </button>

        {/* Status + badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
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
        <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.15, marginBottom: 6, letterSpacing: -0.5 }}>
          {campaign.title}
        </div>

        {/* Dates */}
        {campaign.startDate && (
          <div style={{ fontSize: 12, color: '#555', marginBottom: 20 }}>
            {campaign.startDate} → {campaign.endDate}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
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
        <button
          className="btn btn-ghost"
          onClick={handleExport}
          disabled={exporting}
          style={{ marginBottom: 32 }}
        >
          {exporting ? 'Exporting...' : '⬇ Export Campaign JSON'}
        </button>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #1A1A1A', marginBottom: 24 }} />

        {/* Save status + save button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: '#7A6330', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Campaign Brief
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SaveStatus status={saveStatus} lastSaved={lastSaved} />
            <button
              onClick={() => saveNow()}
              disabled={saveStatus === 'saving' || saveStatus === 'saved'}
              style={{ background: saveStatus === 'unsaved' || saveStatus === 'error' ? '#C9A84C' : '#2A2A2A', color: saveStatus === 'unsaved' || saveStatus === 'error' ? '#0D0D0D' : '#555', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
            >
              Save
            </button>
          </div>
        </div>

        {/* Editable fields */}
        <Field label="Mission">
          <textarea
            value={fields.mission}
            onChange={e => handleChange('mission', e.target.value)}
            placeholder="What are you documenting and why?"
            rows={3}
          />
        </Field>

        <Field label="Story Question">
          <input
            value={fields.storyQuestion}
            onChange={e => handleChange('storyQuestion', e.target.value)}
            placeholder="The central question this arc answers"
          />
        </Field>

        <Field label="Theme">
          <input
            value={fields.theme}
            onChange={e => handleChange('theme', e.target.value)}
            placeholder="e.g. City transformation, identity, commerce"
          />
        </Field>

        <Field label="Success Criteria" hint="one per line">
          <textarea
            value={fields.successCriteria}
            onChange={e => handleChange('successCriteria', e.target.value)}
            placeholder={"At least 6 field sessions logged\nAt least 20 characters captured"}
            rows={5}
          />
        </Field>

        <Field label="Target Character Types" hint="one per line">
          <textarea
            value={fields.targetCharacterTypesText}
            onChange={e => handleChange('targetCharacterTypesText', e.target.value)}
            placeholder={"Local business owners\nInternational fans\nDallas locals"}
            rows={5}
          />
        </Field>

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

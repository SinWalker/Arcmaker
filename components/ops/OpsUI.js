import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import AppLayout from '../layout/AppLayout';
import { getActiveCampaign, updateCampaign } from '../../lib/campaign';

// Editable OPS fields — campaign dossier
// OPS reads the active campaign. No campaignId in URL.
// Bottom nav provides global navigation. OPEN TODAY button at bottom.

const SAVE_STATUS_CONFIG = {
  saved:   { label: 'SAVED', color: 'var(--green)' },
  saving:  { label: 'SAVING...', color: 'var(--muted)' },
  unsaved: { label: 'UNSAVED', color: 'var(--cyan)' },
  error:   { label: 'SAVE FAILED', color: 'var(--red)' },
};

function OpsField({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="field-label">{label}</div>
      {children}
    </div>
  );
}

export default function OpsUI() {
  const router = useRouter();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('saved');

  const [fields, setFields] = useState({
    mission: '',
    storyQuestion: '',
    theme: '',
    successCriteria: '',
    targetCharacterTypesText: '',
    primaryLocationsText: '',
  });

  const debounceRef = useRef(null);
  const latestFields = useRef(fields);
  latestFields.current = fields;
  const campaignId = useRef(null);

  useEffect(() => {
    async function load() {
      const c = await getActiveCampaign();
      setCampaign(c);
      if (c) {
        campaignId.current = c.id;
        setFields({
          mission: c.mission ?? '',
          storyQuestion: c.storyQuestion ?? '',
          theme: c.theme ?? '',
          successCriteria: c.successCriteria ?? '',
          targetCharacterTypesText: (c.targetCharacterTypes ?? []).join('\n'),
          primaryLocationsText: (c.primaryLocations ?? []).join('\n'),
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  const saveNow = useCallback(async (override) => {
    if (!campaignId.current) return;
    const f = override ?? latestFields.current;
    setSaveStatus('saving');
    try {
      await updateCampaign(campaignId.current, {
        mission: f.mission || undefined,
        storyQuestion: f.storyQuestion || undefined,
        theme: f.theme || undefined,
        successCriteria: f.successCriteria || undefined,
        targetCharacterTypes: f.targetCharacterTypesText
          ? f.targetCharacterTypesText.split('\n').map(s => s.trim()).filter(Boolean)
          : [],
        primaryLocations: f.primaryLocationsText
          ? f.primaryLocationsText.split('\n').map(s => s.trim()).filter(Boolean)
          : [],
      });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }, []);

  function handleChange(key, value) {
    const next = { ...latestFields.current, [key]: value };
    setFields(next);
    setSaveStatus('unsaved');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveNow(next), 900);
  }

  const sc = SAVE_STATUS_CONFIG[saveStatus] || SAVE_STATUS_CONFIG.unsaved;

  if (loading) return (
    <AppLayout sysLabel="STORY OPERATIONS SYSTEM" pageTitle="OPS">
      <div style={{ color: 'var(--muted)', fontSize: 13, padding: '20px 0' }}>LOADING...</div>
    </AppLayout>
  );

  if (!campaign) return (
    <AppLayout sysLabel="STORY OPERATIONS SYSTEM" pageTitle="OPS">
      <div className="window" style={{ marginTop: 14 }}>
        <div className="window-title-tab">NO ACTIVE ARC</div>
        <div className="window-inner">
          <div className="copy-text">No active campaign found. Go to ARC to select one.</div>
        </div>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout sysLabel="STORY OPERATIONS SYSTEM" pageTitle="OPS">

      {/* Campaign title + status */}
      <div className="window">
        <div className="window-title-tab">ACTIVE ARC</div>
        <div className="window-inner">
          <div className="win-title">{campaign.title.toUpperCase()}</div>
          {campaign.startDate && (
            <div className="copy-text" style={{ marginTop: 6 }}>
              {campaign.startDate} → {campaign.endDate || '—'}
            </div>
          )}
        </div>
      </div>

      {/* Editable campaign dossier */}
      <div className="window">
        <div className="window-title-tab">CAMPAIGN DOSSIER</div>
        <div className="window-inner">

          {/* Save status row */}
          <div className="save-row">
            <div className="save-status-text" style={{ color: sc.color }}>{sc.label}</div>
            <button
              className={`save-btn${saveStatus === 'unsaved' || saveStatus === 'error' ? ' unsaved' : ''}`}
              onClick={() => saveNow()}
              disabled={saveStatus === 'saving' || saveStatus === 'saved'}
            >
              SAVE
            </button>
          </div>

          <OpsField label="MISSION">
            <textarea
              className="sys-textarea"
              value={fields.mission}
              onChange={e => handleChange('mission', e.target.value)}
              placeholder="What are you documenting and why?"
              rows={3}
            />
          </OpsField>

          <OpsField label="STORY QUESTION">
            <input
              className="sys-input"
              value={fields.storyQuestion}
              onChange={e => handleChange('storyQuestion', e.target.value)}
              placeholder="The central question this arc answers"
            />
          </OpsField>

          <OpsField label="THEME">
            <input
              className="sys-input"
              value={fields.theme}
              onChange={e => handleChange('theme', e.target.value)}
              placeholder="e.g. City transformation, identity, commerce"
            />
          </OpsField>

          <OpsField label="SUCCESS CRITERIA">
            <textarea
              className="sys-textarea"
              value={fields.successCriteria}
              onChange={e => handleChange('successCriteria', e.target.value)}
              placeholder={"At least 6 field sessions\nAt least 20 characters captured"}
              rows={4}
            />
          </OpsField>

          <OpsField label="TARGET CHARACTER TYPES  (one per line)">
            <textarea
              className="sys-textarea"
              value={fields.targetCharacterTypesText}
              onChange={e => handleChange('targetCharacterTypesText', e.target.value)}
              placeholder={"Local business owners\nInternational fans\nDallas locals"}
              rows={4}
            />
          </OpsField>

          <OpsField label="PRIMARY LOCATIONS  (one per line)">
            <textarea
              className="sys-textarea"
              value={fields.primaryLocationsText}
              onChange={e => handleChange('primaryLocationsText', e.target.value)}
              placeholder={"Fair Park\nDeep Ellum\nAT&T Discovery District"}
              rows={4}
            />
          </OpsField>

        </div>
      </div>

      {/* Read-only summary panel */}
      <div className="window">
        <div className="window-title-tab">DOSSIER PREVIEW</div>
        <div className="window-inner">

          {campaign.mission && (
            <div className="dashed-item">
              <span className="dashed-item-label">MISSION</span>
              {campaign.mission}
            </div>
          )}
          {campaign.storyQuestion && (
            <div className="dashed-item">
              <span className="dashed-item-label">STORY QUESTION</span>
              {campaign.storyQuestion}
            </div>
          )}
          {campaign.theme && (
            <div className="dashed-item">
              <span className="dashed-item-label">THEME</span>
              {campaign.theme}
            </div>
          )}
          {campaign.targetCharacterTypes?.length > 0 && (
            <div className="dashed-item">
              <span className="dashed-item-label">TARGET CHARACTERS</span>
              {campaign.targetCharacterTypes.join(' · ')}
            </div>
          )}
          {campaign.primaryLocations?.length > 0 && (
            <div className="dashed-item">
              <span className="dashed-item-label">PRIMARY LOCATIONS</span>
              {campaign.primaryLocations.join(' · ')}
            </div>
          )}

        </div>
      </div>

      {/* OPEN TODAY — not a dead end */}
      <button
        className="cta-btn ghost"
        style={{ marginBottom: 8 }}
        onClick={() => router.push('/today')}
      >
        ← OPEN TODAY
      </button>

    </AppLayout>
  );
}

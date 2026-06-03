// FoundationUI — Phase 0 test interface
// Purpose: validate DB, profiles, seed campaign, and export.
// Not a production screen. Styling is intentionally minimal.

import { useState, useEffect } from 'react';
import { checkDBHealth, getDB } from '../lib/db/db';
import {
  getAllProfiles,
  getActiveProfile,
  createProfile,
  switchProfile,
} from '../lib/profile';
import { seedWorldCupCampaignIfNeeded } from '../lib/seed';
import { exportAndDownloadCampaign } from '../lib/export';
import { initArcMaker } from '../lib/init';

const S = {
  section: { background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 8, padding: 16, marginBottom: 16 },
  label: { fontSize: 11, color: '#7A6330', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  value: { fontSize: 14, color: '#F0F0F0', marginBottom: 4 },
  ok: { color: '#27AE60' },
  err: { color: '#C0392B' },
  warn: { color: '#C9A84C' },
  btn: { background: '#C9A84C', color: '#0D0D0D', border: 'none', borderRadius: 6, padding: '10px 16px', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginRight: 8, marginTop: 8 },
  btnGhost: { background: '#2A2A2A', color: '#888', border: 'none', borderRadius: 6, padding: '10px 16px', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginRight: 8, marginTop: 8 },
  input: { background: '#111', border: '1px solid #2A2A2A', borderRadius: 6, padding: '10px 12px', color: '#F0F0F0', fontSize: 14, width: '100%', marginBottom: 8, boxSizing: 'border-box' },
  tag: { display: 'inline-block', background: '#2A2A1A', color: '#C9A84C', borderRadius: 4, padding: '2px 8px', fontSize: 12, marginRight: 6, marginTop: 4 },
};

export default function FoundationUI() {
  const [init, setInit] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);

  function addLog(msg, type = 'info') {
    setLog(prev => [{ msg, type, ts: new Date().toLocaleTimeString() }, ...prev.slice(0, 49)]);
  }

  async function refresh() {
    const [all, active, cams] = await Promise.all([
      getAllProfiles(),
      getActiveProfile(),
      getDB().campaigns.toArray(),
    ]);
    setProfiles(all);
    setActiveProfile(active);
    setCampaigns(cams);
  }

  useEffect(() => {
    async function boot() {
      setLoading(true);
      try {
        const result = await initArcMaker();
        setInit(result);
        await refresh();
        if (result.campaignSeeded) addLog('World Cup seed campaign created', 'ok');
        if (result.errors.length) result.errors.forEach(e => addLog(e, 'err'));
        addLog(`DB v${result.dbVersion} — ${result.dbOk ? 'healthy' : 'ERROR'}`, result.dbOk ? 'ok' : 'err');
      } catch (e) {
        addLog(`Boot error: ${e.message}`, 'err');
      }
      setLoading(false);
    }
    boot();
  }, []);

  async function handleCreateProfile() {
    if (!newName.trim()) return;
    try {
      const p = await createProfile(newName.trim(), newRole.trim() || undefined, true);
      addLog(`Profile created: ${p.displayName}`, 'ok');
      setNewName(''); setNewRole('');
      await refresh();
      // Seed campaign now that we have a profile
      const seed = await seedWorldCupCampaignIfNeeded(p.id);
      if (seed.seeded) addLog('World Cup campaign seeded', 'ok');
    } catch (e) {
      addLog(`Create profile error: ${e.message}`, 'err');
    }
  }

  async function handleSwitch(id) {
    try {
      await switchProfile(id);
      addLog(`Switched to profile`, 'ok');
      await refresh();
    } catch (e) {
      addLog(`Switch error: ${e.message}`, 'err');
    }
  }

  async function handleExport(campaignId, title) {
    addLog(`Exporting: ${title}...`, 'info');
    const result = await exportAndDownloadCampaign(campaignId);
    if (result.success) {
      const total = Object.values(result.recordCounts).reduce((a, b) => a + b, 0);
      addLog(`Export complete: ${result.filename} (${total} records)`, 'ok');
    } else {
      addLog(`Export failed: ${result.error}`, 'err');
    }
  }

  if (loading) return (
    <div style={{ color: '#888', padding: 32, fontFamily: 'monospace' }}>Initializing ArcMaker...</div>
  );

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 20, fontFamily: 'system-ui, sans-serif', background: '#0D0D0D', minHeight: '100vh', color: '#F0F0F0' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#F0F0F0' }}>ArcMaker</div>
        <div style={{ fontSize: 13, color: '#C9A84C', fontWeight: 700, letterSpacing: 1 }}>PHASE 0 — FOUNDATION</div>
      </div>

      {/* DB Health */}
      <div style={S.section}>
        <div style={S.label}>Database</div>
        {init ? (
          <>
            <div style={{ ...S.value, ...(init.dbOk ? S.ok : S.err) }}>
              {init.dbOk ? '✓ Healthy' : '✗ Error'} — IndexedDB v{init.dbVersion}
            </div>
            <div style={{ ...S.value, color: '#888', fontSize: 12 }}>SSR guard: active · Singleton: active · Version-change handler: active</div>
          </>
        ) : <div style={S.value}>Checking...</div>}
      </div>

      {/* Profiles */}
      <div style={S.section}>
        <div style={S.label}>Local Profiles ({profiles.length})</div>
        {profiles.length === 0 && (
          <div style={{ ...S.value, color: '#888', fontStyle: 'italic' }}>No profiles yet. Create one below.</div>
        )}
        {profiles.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #2A2A2A' }}>
            <div>
              <span style={{ fontWeight: 700, color: p.isActive ? '#C9A84C' : '#F0F0F0' }}>
                {p.isActive ? '● ' : '○ '}{p.displayName}
              </span>
              {p.role && <span style={{ ...S.tag }}>{p.role}</span>}
              {p.isActive && <span style={{ ...S.tag, background: '#0D2A1A', color: '#27AE60' }}>ACTIVE</span>}
            </div>
            {!p.isActive && (
              <button style={S.btnGhost} onClick={() => handleSwitch(p.id)}>Switch</button>
            )}
          </div>
        ))}

        <div style={{ marginTop: 16 }}>
          <div style={S.label}>Create Profile</div>
          <input style={S.input} placeholder="Display name (e.g. Sin)" value={newName} onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateProfile()} />
          <input style={S.input} placeholder="Role (optional — e.g. Director)" value={newRole} onChange={e => setNewRole(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateProfile()} />
          <button style={S.btn} onClick={handleCreateProfile}>Create Profile</button>
        </div>
      </div>

      {/* Campaigns */}
      <div style={S.section}>
        <div style={S.label}>Campaigns ({campaigns.length})</div>
        {campaigns.length === 0 && (
          <div style={{ ...S.value, color: '#888', fontStyle: 'italic' }}>
            No campaigns yet. Create a profile to trigger the World Cup seed.
          </div>
        )}
        {campaigns.map(c => (
          <div key={c.id} style={{ padding: '10px 0', borderBottom: '1px solid #2A2A2A' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#F0F0F0', marginBottom: 4 }}>{c.title}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  <span style={S.tag}>{c.status}</span>
                  {c.isSeedCampaign && <span style={{ ...S.tag, background: '#1A0037', color: '#C9A84C' }}>🌱 SEED</span>}
                  {c.startDate && <span style={{ ...S.tag }}>{c.startDate} → {c.endDate}</span>}
                </div>
                {c.storyQuestion && (
                  <div style={{ fontSize: 13, color: '#888', fontStyle: 'italic', marginTop: 6 }}>"{c.storyQuestion}"</div>
                )}
              </div>
              <button style={S.btn} onClick={() => handleExport(c.id, c.title)}>Export JSON</button>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Log */}
      <div style={S.section}>
        <div style={S.label}>Activity Log</div>
        {log.length === 0 && <div style={{ ...S.value, color: '#888', fontStyle: 'italic' }}>No activity yet.</div>}
        {log.map((entry, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '4px 0', borderBottom: '1px solid #1A1A1A', fontFamily: 'monospace', fontSize: 12 }}>
            <span style={{ color: '#444', flexShrink: 0 }}>{entry.ts}</span>
            <span style={{ color: entry.type === 'ok' ? '#27AE60' : entry.type === 'err' ? '#C0392B' : '#888' }}>
              {entry.type === 'ok' ? '✓' : entry.type === 'err' ? '✗' : '·'}
            </span>
            <span style={{ color: '#ccc' }}>{entry.msg}</span>
          </div>
        ))}
      </div>

      {/* Acceptance test hints */}
      <div style={{ ...S.section, background: '#111', border: '1px solid #1A1A1A' }}>
        <div style={S.label}>Phase 0 Acceptance Tests</div>
        {[
          ['SSR safe', 'Page loaded without indexedDB errors = ✓'],
          ['Singleton', 'Refresh page — DB reconnects without errors = ✓'],
          ['Version-change', 'Open a second tab — closing it reloads gracefully = ✓'],
          ['Profile creation', 'Create "Sin / Director" profile above = ✓'],
          ['Profile switch', 'Create a second profile, switch between them = ✓'],
          ['Seed campaign', 'World Cup campaign appears after first profile = ✓'],
          ['Export', 'Click Export JSON — file downloads with correct filename = ✓'],
          ['Data persistence', 'Refresh page — all data survives = ✓'],
        ].map(([test, hint]) => (
          <div key={test} style={{ display: 'flex', gap: 8, padding: '4px 0', fontSize: 13, borderBottom: '1px solid #1A1A1A' }}>
            <span style={{ color: '#444', flexShrink: 0 }}>□</span>
            <div><span style={{ color: '#C9A84C', fontWeight: 700 }}>{test}:</span> <span style={{ color: '#888' }}>{hint}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

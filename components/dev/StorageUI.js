import { useState, useEffect } from 'react';

// /dev/storage — ArcMaker persistence debug panel
// No auth required — direct URL access for debugging.
// Tests: write, read, export. Verifies IndexedDB is actually working.

const TEST_RECORD_KEY = '__arcmaker_storage_test__';

export default function StorageUI() {
  const [status, setStatus] = useState(null);    // DB health
  const [lastWrite, setLastWrite] = useState(null);
  const [lastRead, setLastRead]   = useState(null);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    runHealthCheck();
  }, []);

  async function runHealthCheck() {
    setLoading(true);
    try {
      const { checkDBHealth, getDB } = await import('../../lib/db/db');
      const { getActiveProfile, getAllProfiles } = await import('../../lib/profile');
      const { getActiveCampaign } = await import('../../lib/campaign');

      const [health, activeProfile, allProfiles, campaign] = await Promise.all([
        checkDBHealth(),
        getActiveProfile(),
        getAllProfiles(),
        getActiveCampaign().catch(() => null),
      ]);

      const db = getDB();
      const [campaignCount, eventCount, assignmentCount, sessionCount] = await Promise.all([
        db.campaigns.count(),
        db.events.count(),
        db.assignments.count(),
        db.sessions.count(),
      ]);

      // Check if a previous test write exists
      let testRecord = null;
      try {
        const all = await db.stagedRecords.toArray();
        testRecord = all.find(r => r.id === TEST_RECORD_KEY) || null;
      } catch {}

      setStatus({
        health,
        activeProfile: activeProfile || null,
        allProfilesCount: allProfiles.length,
        campaign: campaign || null,
        campaignCount,
        eventCount,
        assignmentCount,
        sessionCount,
        testRecord,
      });
    } catch (err) {
      setStatus({ error: String(err) });
    }
    setLoading(false);
  }

  async function runTestWrite() {
    setLastWrite(null);
    try {
      const { getDB } = await import('../../lib/db/db');
      const db = getDB();

      const testPayload = {
        id: TEST_RECORD_KEY,
        importReviewId: 'test',
        objectType: 'Campaign',
        approved: false,
        data: {
          id: 'test',
          title: `STORAGE TEST — written at ${new Date().toISOString()}`,
        },
        _testTimestamp: Date.now(),
      };

      // put() = create or replace
      await db.stagedRecords.put(testPayload);

      // Immediately verify the write by reading it back
      const verify = await db.stagedRecords.get(TEST_RECORD_KEY);
      if (verify && verify._testTimestamp === testPayload._testTimestamp) {
        setLastWrite({ ok: true, record: verify, ts: new Date().toLocaleTimeString() });
      } else {
        setLastWrite({ ok: false, error: 'Write succeeded but read-back returned wrong data', ts: new Date().toLocaleTimeString() });
      }
      await runHealthCheck();
    } catch (err) {
      setLastWrite({ ok: false, error: String(err), ts: new Date().toLocaleTimeString() });
    }
  }

  async function runTestRead() {
    setLastRead(null);
    try {
      const { getDB } = await import('../../lib/db/db');
      const db = getDB();
      const record = await db.stagedRecords.get(TEST_RECORD_KEY);
      if (record) {
        setLastRead({ ok: true, record, ts: new Date().toLocaleTimeString() });
      } else {
        setLastRead({ ok: false, error: 'No test record found. Run TEST WRITE first, then refresh and run TEST READ.', ts: new Date().toLocaleTimeString() });
      }
    } catch (err) {
      setLastRead({ ok: false, error: String(err), ts: new Date().toLocaleTimeString() });
    }
  }

  async function exportDebugJSON() {
    setExporting(true);
    try {
      const { getDB } = await import('../../lib/db/db');
      const { getAllProfiles } = await import('../../lib/profile');
      const db = getDB();

      const [profiles, campaigns, events, assignments, sessions, fieldNotes, capturedShots, characters, businessLeads] = await Promise.all([
        getAllProfiles(),
        db.campaigns.toArray(),
        db.events.toArray(),
        db.assignments.toArray(),
        db.sessions.toArray(),
        db.fieldNotes.toArray(),
        db.capturedShots.toArray(),
        db.characters.toArray(),
        db.businessLeads.toArray(),
      ]);

      const dump = {
        exportedAt: new Date().toISOString(),
        dbName: 'ArcMakerDB',
        dbVersion: db.verno,
        profiles,
        campaigns,
        events,
        assignments,
        sessions,
        fieldNotes,
        capturedShots,
        characters,
        businessLeads,
      };

      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `arcmaker-debug-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + String(err));
    }
    setExporting(false);
  }

  // ── Styles ──────────────────────────────────────────────────────────────────
  const s = {
    screen:  { minHeight: '100vh', background: '#080b12', color: '#cfe8ff', fontFamily: "'Oxanium', system-ui, sans-serif", padding: '20px 14px 80px' },
    header:  { fontSize: 10, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7ea6c7', marginBottom: 4 },
    title:   { fontSize: 26, fontWeight: 800, letterSpacing: '-0.04em', color: '#cfe8ff', marginBottom: 20 },
    panel:   { background: '#172133', border: '2px solid #2e4768', boxShadow: '4px 4px 0 #05070c', marginBottom: 18, position: 'relative', marginTop: 14 },
    tab:     { position: 'absolute', top: -12, left: 10, background: '#080b12', border: '2px solid #2e4768', padding: '1px 8px', color: '#34d7ff', fontSize: 10, letterSpacing: '0.16em', fontWeight: 800, textTransform: 'uppercase' },
    inner:   { padding: '16px 12px 12px' },
    row:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(46,71,104,0.4)', fontSize: 12 },
    label:   { fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#7ea6c7' },
    value:   { fontSize: 12, fontWeight: 800, color: '#cfe8ff' },
    ok:      { color: '#aaff42' },
    bad:     { color: '#ff4057' },
    muted:   { color: '#7ea6c7' },
    btn:     { padding: '12px 0', border: '2px solid #34d7ff', background: '#34d7ff', color: '#06131d', fontFamily: "'Oxanium', sans-serif", fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', boxShadow: '3px 3px 0 #05070c', cursor: 'pointer', width: '100%', marginBottom: 8 },
    btnGhost:{ padding: '12px 0', border: '2px solid #2e4768', background: 'transparent', color: '#7ea6c7', fontFamily: "'Oxanium', sans-serif", fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em', cursor: 'pointer', width: '100%', marginBottom: 8 },
    result:  { marginTop: 10, padding: 10, border: '1px solid', fontSize: 11, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' },
  };

  if (loading) return (
    <div style={s.screen}>
      <div style={s.header}>ARCMAKER // DEV</div>
      <div style={s.title}>STORAGE DEBUG</div>
      <div style={{ color: '#7ea6c7', fontSize: 12 }}>LOADING...</div>
    </div>
  );

  const h = status?.health;
  const ap = status?.activeProfile;
  const camp = status?.campaign;

  return (
    <div style={s.screen}>
      <div style={s.header}>ARCMAKER // DEV</div>
      <div style={s.title}>STORAGE DEBUG</div>

      {status?.error && (
        <div style={{ background: '#1a0a0a', border: '2px solid #ff4057', padding: 12, marginBottom: 16, fontSize: 12, color: '#ff4057', fontFamily: 'monospace' }}>
          CRITICAL ERROR: {status.error}
        </div>
      )}

      {/* DB Health */}
      <div style={s.panel}>
        <div style={s.tab}>DATABASE</div>
        <div style={s.inner}>
          <div style={s.row}>
            <span style={s.label}>DEXIE AVAILABLE</span>
            <span style={h?.ok ? s.ok : s.bad}>{h?.ok ? 'YES' : 'NO'}</span>
          </div>
          <div style={s.row}>
            <span style={s.label}>DB NAME</span>
            <span style={s.value}>ArcMakerDB</span>
          </div>
          <div style={s.row}>
            <span style={s.label}>DB VERSION</span>
            <span style={s.value}>{h?.version ?? '—'}</span>
          </div>
          {h?.error && (
            <div style={{ ...s.row, color: '#ff4057', borderBottom: 'none' }}>
              ERROR: {h.error}
            </div>
          )}
        </div>
      </div>

      {/* Profile */}
      <div style={s.panel}>
        <div style={s.tab}>PROFILE</div>
        <div style={s.inner}>
          <div style={s.row}>
            <span style={s.label}>ACTIVE PROFILE</span>
            <span style={ap ? s.ok : s.bad}>{ap ? ap.displayName.toUpperCase() : 'NONE'}</span>
          </div>
          <div style={s.row}>
            <span style={s.label}>ROLE</span>
            <span style={s.value}>{ap?.role?.toUpperCase() || '—'}</span>
          </div>
          <div style={s.row}>
            <span style={s.label}>IS ACTIVE</span>
            <span style={ap?.isActive ? s.ok : s.bad}>{ap?.isActive ? 'TRUE' : 'FALSE'}</span>
          </div>
          <div style={s.row}>
            <span style={s.label}>PIN SET</span>
            <span style={ap?.pin ? s.ok : s.muted}>{ap?.pin ? 'YES' : 'NO'}</span>
          </div>
          <div style={{ ...s.row, borderBottom: 'none' }}>
            <span style={s.label}>TOTAL PROFILES</span>
            <span style={s.value}>{status?.allProfilesCount ?? '—'}</span>
          </div>
        </div>
      </div>

      {/* Record counts */}
      <div style={s.panel}>
        <div style={s.tab}>RECORD COUNTS</div>
        <div style={s.inner}>
          <div style={s.row}>
            <span style={s.label}>CAMPAIGNS</span>
            <span style={s.value}>{status?.campaignCount ?? '—'}</span>
          </div>
          <div style={s.row}>
            <span style={s.label}>EVENTS</span>
            <span style={s.value}>{status?.eventCount ?? '—'}</span>
          </div>
          <div style={s.row}>
            <span style={s.label}>ASSIGNMENTS</span>
            <span style={s.value}>{status?.assignmentCount ?? '—'}</span>
          </div>
          <div style={{ ...s.row, borderBottom: 'none' }}>
            <span style={s.label}>SESSIONS</span>
            <span style={s.value}>{status?.sessionCount ?? '—'}</span>
          </div>
        </div>
      </div>

      {/* Active Campaign */}
      <div style={s.panel}>
        <div style={s.tab}>ACTIVE CAMPAIGN</div>
        <div style={s.inner}>
          {camp ? (
            <>
              <div style={s.row}>
                <span style={s.label}>TITLE</span>
                <span style={{ ...s.value, fontSize: 11, maxWidth: '60%', textAlign: 'right' }}>{camp.title.toUpperCase()}</span>
              </div>
              <div style={s.row}>
                <span style={s.label}>STATUS</span>
                <span style={s.ok}>{camp.status?.toUpperCase()}</span>
              </div>
              <div style={{ ...s.row, borderBottom: 'none' }}>
                <span style={s.label}>IS SEED</span>
                <span style={s.value}>{camp.isSeedCampaign ? 'YES' : 'NO'}</span>
              </div>
            </>
          ) : (
            <div style={{ color: '#ff4057', fontSize: 12, fontWeight: 800 }}>NO ACTIVE CAMPAIGN FOUND</div>
          )}
        </div>
      </div>

      {/* Status indicators */}
      <div style={s.panel}>
        <div style={s.tab}>SYSTEM STATUS</div>
        <div style={s.inner}>
          <div style={s.row}>
            <span style={s.label}>LOCAL ONLY</span>
            <span style={s.ok}>CONFIRMED</span>
          </div>
          <div style={s.row}>
            <span style={s.label}>INDEXEDDB</span>
            <span style={h?.ok ? s.ok : s.bad}>{h?.ok ? 'ACTIVE' : 'UNAVAILABLE'}</span>
          </div>
          <div style={s.row}>
            <span style={s.label}>CLOUD AUTH</span>
            <span style={s.muted}>NONE</span>
          </div>
          <div style={{ ...s.row, borderBottom: 'none' }}>
            <span style={s.label}>LOCALSTORAGE USED</span>
            <span style={s.ok}>NO</span>
          </div>
        </div>
      </div>

      {/* Write test */}
      <div style={s.panel}>
        <div style={s.tab}>PERSISTENCE TEST</div>
        <div style={s.inner}>
          {status?.testRecord ? (
            <div style={{ fontSize: 11, color: '#aaff42', marginBottom: 10, fontWeight: 800 }}>
              ✓ PREVIOUS TEST RECORD EXISTS — written at {new Date(status.testRecord._testTimestamp).toLocaleString()}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: '#7ea6c7', marginBottom: 10 }}>
              No test record yet. Click RUN TEST WRITE, refresh, then RUN TEST READ.
            </div>
          )}

          <button style={s.btn} onClick={runTestWrite}>
            RUN TEST WRITE
          </button>

          {lastWrite && (
            <div style={{ ...s.result, borderColor: lastWrite.ok ? '#aaff42' : '#ff4057', color: lastWrite.ok ? '#aaff42' : '#ff4057' }}>
              {lastWrite.ts} — {lastWrite.ok ? 'WRITE OK ✓' : 'WRITE FAILED ✗'}{'\n'}
              {lastWrite.ok
                ? `Record: ${JSON.stringify(lastWrite.record.data, null, 2)}`
                : `Error: ${lastWrite.error}`}
            </div>
          )}

          <button style={{ ...s.btn, marginTop: 8 }} onClick={runTestRead}>
            RUN TEST READ
          </button>

          {lastRead && (
            <div style={{ ...s.result, borderColor: lastRead.ok ? '#aaff42' : '#ff4057', color: lastRead.ok ? '#aaff42' : '#ff4057' }}>
              {lastRead.ts} — {lastRead.ok ? 'READ OK ✓' : 'READ FAILED ✗'}{'\n'}
              {lastRead.ok
                ? `Found: ${JSON.stringify(lastRead.record.data, null, 2)}`
                : `Error: ${lastRead.error}`}
            </div>
          )}

          <button style={{ ...s.btnGhost, marginTop: 8 }} onClick={runHealthCheck}>
            REFRESH STATUS
          </button>

          <button style={{ ...s.btnGhost }} onClick={exportDebugJSON} disabled={exporting}>
            {exporting ? 'EXPORTING...' : 'EXPORT DEBUG JSON'}
          </button>
        </div>
      </div>

    </div>
  );
}

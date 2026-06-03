import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AppLayout from '../layout/AppLayout';
import { getActiveCampaign } from '../../lib/campaign';
import { getActiveSession, currentTODFromSession, closeSession, syncCameraClockToSession } from '../../lib/session';
import { getAssignment } from '../../lib/assignment';
import { addFieldNote } from '../../lib/fieldNote';
import { addCapturedShot } from '../../lib/capturedShot';
import { getDB } from '../../lib/db/db';

// ── Quick Log Modals ─────────────────────────────────────────────────────────

function QuickModal({ title, placeholder, onSave, onClose, multiline }) {
  const [text, setText] = useState('');
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        {multiline ? (
          <textarea
            className="sys-textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={placeholder}
            rows={4}
            autoFocus
          />
        ) : (
          <input
            className="sys-input"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={placeholder}
            autoFocus
          />
        )}
        <button
          className="cta-btn"
          onClick={() => { if (text.trim()) { onSave(text.trim()); onClose(); } }}
        >
          LOG →
        </button>
        <button className="cta-btn ghost" onClick={onClose}>CANCEL</button>
      </div>
    </div>
  );
}

// ── Camera Sync Modal ────────────────────────────────────────────────────────

function SyncModal({ onSync, onClose }) {
  const [h, setH] = useState('');
  const [m, setM] = useState('');
  const [s, setS] = useState('');
  const [pm, setPm] = useState(false);

  function doSync() {
    let hour = parseInt(h, 10) || 0;
    if (pm && hour < 12) hour += 12;
    if (!pm && hour === 12) hour = 0;
    onSync(hour, parseInt(m, 10) || 0, parseInt(s, 10) || 0);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-title">SYNC CAMERA CLOCK</div>
        <div className="copy-text" style={{ marginBottom: 12 }}>
          Enter the current time shown on your camera display.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 80px', gap: 8, marginBottom: 12 }}>
          <input className="sys-input" placeholder="HH" maxLength={2} value={h} onChange={e => setH(e.target.value)} style={{ textAlign: 'center', marginBottom: 0 }} />
          <input className="sys-input" placeholder="MM" maxLength={2} value={m} onChange={e => setM(e.target.value)} style={{ textAlign: 'center', marginBottom: 0 }} />
          <input className="sys-input" placeholder="SS" maxLength={2} value={s} onChange={e => setS(e.target.value)} style={{ textAlign: 'center', marginBottom: 0 }} />
          <button
            onClick={() => setPm(!pm)}
            style={{
              background: pm ? 'var(--cyan)' : 'var(--panel2)',
              border: '2px solid var(--line)',
              color: pm ? '#06131d' : 'var(--muted)',
              fontFamily: 'Oxanium, sans-serif',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {pm ? 'PM' : 'AM'}
          </button>
        </div>
        <button className="cta-btn" onClick={doSync}>SYNC →</button>
        <button className="cta-btn ghost" onClick={onClose}>CANCEL</button>
      </div>
    </div>
  );
}

// ── Main FIELD ───────────────────────────────────────────────────────────────

export default function FieldUI() {
  const router = useRouter();
  const [campaign, setCampaign] = useState(null);
  const [session, setSession] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [tod, setTod] = useState('--:--:--');
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'note'|'character'|'lead'|'shot'|'sync'|'end'

  const sessionRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    async function load() {
      const c = await getActiveCampaign();
      setCampaign(c);
      if (c) {
        const s = await getActiveSession(c.id);
        setSession(s);
        sessionRef.current = s;
        if (s) {
          await loadActivity(s);
          const a = await getAssignment(s.assignmentId);
          setAssignment(a);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  // Tick TOD every second
  useEffect(() => {
    if (!session) return;
    function tick() {
      if (!sessionRef.current) return;
      const { display } = currentTODFromSession(sessionRef.current);
      setTod(display);
    }
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.current);
  }, [session]);

  async function loadActivity(s) {
    const db = getDB();
    const [notes, characters, leads, shots] = await Promise.all([
      db.fieldNotes.where('sessionId').equals(s.id).sortBy('todSeconds'),
      db.characters.where('sessionId').equals(s.id).sortBy('createdAt'),
      db.businessLeads.where('sessionId').equals(s.id).sortBy('createdAt'),
      db.capturedShots.where('sessionId').equals(s.id).sortBy('todSeconds'),
    ]);

    const all = [
      ...notes.map(n => ({ type: 'NOTE', label: n.type?.toUpperCase() || 'NOTE', text: n.text, tod: n.tod, ts: n.todSeconds || 0 })),
      ...characters.map(c => ({ type: 'CHARACTER', label: 'CHARACTER', text: c.name, tod: null, ts: new Date(c.createdAt).getTime() / 1000 })),
      ...leads.map(l => ({ type: 'LEAD', label: 'LEAD', text: l.name + (l.notes ? ` — ${l.notes}` : ''), tod: null, ts: new Date(l.createdAt).getTime() / 1000 })),
      ...shots.map(s => ({ type: 'SHOT', label: 'SHOT', text: s.description, tod: s.tod, ts: s.todSeconds || 0 })),
    ].sort((a, b) => b.ts - a.ts).slice(0, 8);

    setRecentActivity(all);
  }

  async function addChar(name) {
    if (!session || !campaign) return;
    const own = await (await import('../../lib/profile')).getOwnershipFields();
    const now = new Date().toISOString();
    const { currentTODFromSession: getTOD } = await import('../../lib/session');
    const { display, seconds } = getTOD(sessionRef.current);
    await getDB().characters.add({
      id: crypto.randomUUID(),
      campaignId: campaign.id,
      sessionId: session.id,
      name,
      status: 'spotted',
      source: 'manual',
      createdAt: now,
      updatedAt: now,
      ...own,
    });
    await loadActivity(sessionRef.current);
  }

  async function addLead(text) {
    if (!session || !campaign) return;
    const own = await (await import('../../lib/profile')).getOwnershipFields();
    const now = new Date().toISOString();
    await getDB().businessLeads.add({
      id: crypto.randomUUID(),
      campaignId: campaign.id,
      sessionId: session.id,
      name: text,
      status: 'noted',
      source: 'manual',
      createdAt: now,
      updatedAt: now,
      ...own,
    });
    await loadActivity(sessionRef.current);
  }

  async function handleAddNote(text) {
    if (!session || !campaign) return;
    await addFieldNote(session.id, campaign.id, text, 'observation');
    await loadActivity(sessionRef.current);
  }

  async function handleAddShot(desc) {
    if (!session || !campaign) return;
    await addCapturedShot(session.id, campaign.id, desc, { assignmentId: session.assignmentId });
    await loadActivity(sessionRef.current);
  }

  async function handleSync(h, m, s) {
    if (!session) return;
    const updated = await syncCameraClockToSession(session.id, h, m, s);
    setSession(updated);
    sessionRef.current = updated;
  }

  async function handleEndSession() {
    if (!session) return;
    await closeSession(session.id);
    router.push('/log');
  }

  // ── Format TOD for display: "HH:MM:SS AM/PM" → drop the AM/PM for clock display
  function formatTOD(display) {
    if (!display || display === '--:--:--') return display;
    return display.replace(/ (AM|PM)$/, '');
  }

  if (loading) return (
    <AppLayout sysLabel="FIELD SESSION CONSOLE" pageTitle="FIELD">
      <div style={{ color: 'var(--muted)', fontSize: 13, padding: '20px 0' }}>LOADING...</div>
    </AppLayout>
  );

  // ── No active session ────────────────────────────────────────────────────
  if (!session) {
    return (
      <AppLayout sysLabel="FIELD SESSION CONSOLE" pageTitle="FIELD">
        <div className="window">
          <div className="window-title-tab">NO ACTIVE SESSION</div>
          <div className="window-inner">
            <div className="copy-text">No field session is currently active.</div>
            <div className="copy-text" style={{ marginTop: 8 }}>
              Open a mission from CAL to start a field session.
            </div>
            <button
              className="cta-btn"
              style={{ marginTop: 16 }}
              onClick={() => router.push('/cal')}
            >
              OPEN MISSION BOARD →
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Active session ───────────────────────────────────────────────────────
  return (
    <AppLayout sysLabel="FIELD SESSION CONSOLE" pageTitle="FIELD">

      {/* PRODUCTION TOD */}
      <div className="window active-border">
        <div className="window-title-tab">PRODUCTION TOD</div>
        <div className="window-inner">
          <div className="clock-box">
            <div className="clock-display">{formatTOD(tod)}</div>
          </div>

          {/* Location */}
          <div className="select-row" onClick={() => {}}>
            <span className="select-label">LOCATION</span>
            <span className="select-value">{session.location || '—'} ▾</span>
          </div>

          {/* Assignment */}
          <div className="select-row">
            <span className="select-label">ASSIGNMENT</span>
            <span className="select-value">
              {(assignment?.missionTitle || assignment?.title || 'UNPLANNED').toUpperCase()} ▾
            </span>
          </div>

          {/* Camera sync */}
          <button
            className="cta-btn ghost"
            style={{ marginTop: 8, fontSize: 11, padding: '8px' }}
            onClick={() => setModal('sync')}
          >
            ⟳ SYNC CAMERA CLOCK
          </button>
        </div>
      </div>

      {/* CAPTURE COMMANDS */}
      <div className="window">
        <div className="window-title-tab">CAPTURE COMMANDS</div>
        <div className="window-inner">
          <div className="action-grid">

            {/* RECORD FIELD NOTE — coming soon */}
            <button className="action-btn record disabled-btn" disabled style={{ gridColumn: '1 / -1' }}>
              🎙 RECORD FIELD NOTE
              <span className="coming-soon-badge">COMING SOON</span>
            </button>

            <button className="action-btn primary" onClick={() => setModal('character')}>
              + CHARACTER
            </button>
            <button className="action-btn" onClick={() => setModal('lead')}>
              + LEAD
            </button>
            <button className="action-btn" onClick={() => setModal('shot')}>
              + SHOT
            </button>
            <button className="action-btn" onClick={() => setModal('textnote')}>
              TEXT NOTE
            </button>

          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="window">
        <div className="window-title-tab">RECENT ACTIVITY</div>
        <div className="window-inner">
          {recentActivity.length === 0 ? (
            <div className="copy-text" style={{ color: 'var(--muted)' }}>No activity yet. Start logging above.</div>
          ) : (
            recentActivity.map((item, i) => (
              <div key={i} className="log-item">
                <div className="log-time">
                  {item.tod
                    ? item.tod.replace(/ (AM|PM)$/, '').slice(0, 5)
                    : '—'}
                </div>
                <div>
                  <div className="log-type">{item.label}</div>
                  <div className="log-copy">{item.text}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* END SESSION */}
      <button
        className="cta-btn danger"
        style={{ marginBottom: 8 }}
        onClick={() => setModal('end')}
      >
        END SESSION
      </button>

      {/* Modals */}
      {modal === 'textnote' && (
        <QuickModal
          title="TEXT NOTE"
          placeholder="What did you observe?"
          multiline
          onSave={handleAddNote}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'character' && (
        <QuickModal
          title="ADD CHARACTER"
          placeholder="Character name"
          onSave={addChar}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'lead' && (
        <QuickModal
          title="ADD LEAD"
          placeholder="Business or contact name"
          onSave={addLead}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'shot' && (
        <QuickModal
          title="LOG SHOT"
          placeholder="Describe the shot"
          onSave={handleAddShot}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'sync' && (
        <SyncModal
          onSync={handleSync}
          onClose={() => setModal(null)}
        />
      )}
      {modal === 'end' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">END SESSION</div>
            <div className="copy-text" style={{ marginBottom: 16 }}>
              Close this field session and go to the campaign log?
            </div>
            <button className="cta-btn danger" onClick={handleEndSession}>END SESSION →</button>
            <button className="cta-btn ghost" onClick={() => setModal(null)}>STAY IN FIELD</button>
          </div>
        </div>
      )}

    </AppLayout>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import AppLayout from '../layout/AppLayout';
import {
  getSession, closeSession, syncCameraClockToSession,
  currentTODFromSession, elapsedDisplay, todSecondsToDisplay
} from '../../lib/session';
import { getFieldNotesForSession, addFieldNote, deleteFieldNote } from '../../lib/fieldNote';
import { getCapturedShotsForSession, addCapturedShot, deleteCapturedShot } from '../../lib/capturedShot';
import { generateSessionReport } from '../../lib/sessionReport';

const NOTE_TYPES = ['observation', 'quote', 'action', 'note'];
const NOTE_ICONS = { observation: '👁', quote: '💬', action: '⚡', note: '📝' };
const NOTE_COLORS = { observation: '#C9A84C', quote: '#5B9BD5', action: '#E74C3C', note: '#888' };

export default function SessionDetailUI({ sessionId }) {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [notes, setNotes] = useState([]);
  const [shots, setShots] = useState([]);
  const [loading, setLoading] = useState(true);

  // TOD clock tick
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Modal states
  const [modal, setModal] = useState(null); // 'note' | 'shot' | 'sync' | 'close' | 'report'
  const [noteForm, setNoteForm] = useState({ text: '', type: 'observation' });
  const [shotForm, setShotForm] = useState({ description: '', notes: '' });
  const [syncForm, setSyncForm] = useState({ h: '', m: '', s: '', ampm: 'AM' });
  const [report, setReport] = useState(null);
  const [working, setWorking] = useState(false);
  const [closeSummary, setCloseSummary] = useState('');

  async function reload() {
    const [s, n, sh] = await Promise.all([
      getSession(sessionId),
      getFieldNotesForSession(sessionId),
      getCapturedShotsForSession(sessionId),
    ]);
    setSession(s);
    setNotes(n);
    setShots(sh);
  }

  useEffect(() => {
    async function init() {
      await reload();
      setLoading(false);
    }
    if (sessionId) init();
  }, [sessionId]);

  async function handleAddNote() {
    if (!noteForm.text.trim()) return;
    setWorking(true);
    await addFieldNote(sessionId, session.campaignId, noteForm.text.trim(), noteForm.type);
    setNoteForm({ text: '', type: 'observation' });
    setModal(null);
    await reload();
    setWorking(false);
  }

  async function handleAddShot() {
    if (!shotForm.description.trim()) return;
    setWorking(true);
    await addCapturedShot(sessionId, session.campaignId, shotForm.description.trim(), {
      notes: shotForm.notes.trim() || undefined,
      assignmentId: session.assignmentId !== 'unplanned' ? session.assignmentId : undefined,
    });
    setShotForm({ description: '', notes: '' });
    setModal(null);
    await reload();
    setWorking(false);
  }

  async function handleSyncClock() {
    let h = parseInt(syncForm.h, 10) || 0;
    const m = parseInt(syncForm.m, 10) || 0;
    const s = parseInt(syncForm.s, 10) || 0;
    if (syncForm.ampm === 'PM' && h < 12) h += 12;
    if (syncForm.ampm === 'AM' && h === 12) h = 0;
    setWorking(true);
    const updated = await syncCameraClockToSession(sessionId, h, m, s);
    setSession(updated);
    setModal(null);
    setWorking(false);
  }

  async function handleCloseSession() {
    setWorking(true);
    const closed = await closeSession(sessionId);
    setSession(closed);
    const r = await generateSessionReport(closed);
    setReport(r);
    setModal('report');
    setWorking(false);
  }

  async function handleDeleteNote(id) {
    await deleteFieldNote(id);
    await reload();
  }

  async function handleDeleteShot(id) {
    await deleteCapturedShot(id);
    await reload();
  }

  if (loading) return <AppLayout title="Session"><div style={{ color: '#888', padding: 40, textAlign: 'center' }}>Loading...</div></AppLayout>;
  if (!session) return <AppLayout title="Session"><div style={{ color: '#888', padding: 40, textAlign: 'center' }}>Session not found.</div></AppLayout>;

  const tod = currentTODFromSession(session);
  const elapsed = elapsedDisplay(session);
  const isActive = session.status === 'active';

  // Interleave notes + shots chronologically by todSeconds
  const timeline = [
    ...notes.map(n => ({ ...n, _kind: 'note' })),
    ...shots.map(s => ({ ...s, _kind: 'shot' })),
  ].sort((a, b) => (a.todSeconds ?? 0) - (b.todSeconds ?? 0));

  return (
    <AppLayout title={session.title}>
      {/* TOD Clock bar */}
      <div className="clock-bar" style={{ borderRadius: 10, marginBottom: 12 }}>
        <div>
          <div className="clock-bar-label">Production TOD</div>
          <div className="clock-bar-time">{tod.display}</div>
          {!session.sessionStartProductionTOD && (
            <div style={{ fontSize: 11, color: '#C0392B' }}>Camera not synced — using device time</div>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="clock-bar-label">Elapsed</div>
          <div className="clock-bar-elapsed">{elapsed}</div>
          {isActive && (
            <button
              style={{ marginTop: 4, background: '#2A2A1A', color: '#C9A84C', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              onClick={() => setModal('sync')}
            >
              Sync Camera ⏱
            </button>
          )}
        </div>
      </div>

      {/* Session meta */}
      <div className="card" style={{ marginBottom: 12 }}>
        {session.location && <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>📍 {session.location}</div>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span className="stat-chip">{session.date}</span>
          <span className="stat-chip">{notes.length} notes</span>
          <span className="stat-chip">{shots.length} shots</span>
          {isActive && <span className="stat-chip" style={{ color: '#27AE60' }}>● LIVE</span>}
        </div>
      </div>

      {/* Quick log buttons */}
      {isActive && (
        <div className="log-btn-row" style={{ borderRadius: 10, marginBottom: 12 }}>
          {NOTE_TYPES.map(t => (
            <button
              key={t}
              className="log-quick-btn"
              style={{ background: '#2A2A2A' }}
              onClick={() => { setNoteForm({ text: '', type: t }); setModal('note'); }}
            >
              {NOTE_ICONS[t]}<br />{t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
          <button
            className="log-quick-btn"
            style={{ background: '#1A2A1A' }}
            onClick={() => { setShotForm({ description: '', notes: '' }); setModal('shot'); }}
          >
            📷<br />Shot
          </button>
        </div>
      )}

      {/* Timeline */}
      <div className="section-header">Timeline ({timeline.length})</div>

      {timeline.length === 0 ? (
        <div style={{ color: '#444', fontStyle: 'italic', fontSize: 14, padding: '16px 0' }}>
          {isActive ? 'Start logging — tap a button above.' : 'No entries logged.'}
        </div>
      ) : (
        timeline.map(item => (
          <div key={item.id} className="chrono-row">
            <div className="chrono-tod">
              {item.tod || '—'}
            </div>
            <div className="chrono-icon">
              {item._kind === 'note' ? NOTE_ICONS[item.type] : '📷'}
            </div>
            <div style={{ flex: 1 }}>
              <div className="chrono-text">{item._kind === 'note' ? item.text : item.description}</div>
              {item._kind === 'note' && (
                <div style={{ fontSize: 11, color: NOTE_COLORS[item.type], fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>{item.type}</div>
              )}
              {item._kind === 'shot' && item.notes && (
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{item.notes}</div>
              )}
            </div>
            {isActive && (
              <button
                onClick={() => item._kind === 'note' ? handleDeleteNote(item.id) : handleDeleteShot(item.id)}
                style={{ background: 'none', border: 'none', color: '#444', fontSize: 18, cursor: 'pointer', padding: '0 4px', flexShrink: 0 }}
              >×</button>
            )}
          </div>
        ))
      )}

      {/* Close session */}
      {isActive && (
        <div className="session-end-bar" style={{ marginTop: 24, borderRadius: 10 }}>
          <button className="btn btn-red" onClick={() => setModal('close')}>
            Close Session
          </button>
        </div>
      )}

      {/* ── Modals ── */}

      {/* Add Note */}
      {modal === 'note' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Log {noteForm.type[0].toUpperCase() + noteForm.type.slice(1)}</div>
            <div style={{ display: 'flex', overflowX: 'auto', gap: 6, marginBottom: 12, paddingBottom: 4 }}>
              {NOTE_TYPES.map(t => (
                <button
                  key={t}
                  className={`type-pill${noteForm.type === t ? ' active' : ''}`}
                  onClick={() => setNoteForm(f => ({ ...f, type: t }))}
                >
                  {NOTE_ICONS[t]} {t}
                </button>
              ))}
            </div>
            <textarea
              placeholder={noteForm.type === 'quote' ? '"Exact words here..."' : `What do you ${noteForm.type === 'observation' ? 'see' : noteForm.type === 'action' ? 'need to do' : 'want to note'}?`}
              value={noteForm.text}
              onChange={e => setNoteForm(f => ({ ...f, text: e.target.value }))}
              autoFocus
              style={{ minHeight: 100 }}
            />
            <div style={{ fontSize: 11, color: '#555', marginBottom: 12 }}>TOD: {tod.display}</div>
            <button className="btn btn-gold" onClick={handleAddNote} disabled={working}>
              {working ? 'Saving...' : 'Log Entry'}
            </button>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Add Shot */}
      {modal === 'shot' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Log Shot</div>
            <input
              placeholder="What did you shoot? (e.g. Fan holding Brazil flag, wide)"
              value={shotForm.description}
              onChange={e => setShotForm(f => ({ ...f, description: e.target.value }))}
              autoFocus
            />
            <textarea
              placeholder="Extra notes (optional)"
              value={shotForm.notes}
              onChange={e => setShotForm(f => ({ ...f, notes: e.target.value }))}
              style={{ minHeight: 60 }}
            />
            <div style={{ fontSize: 11, color: '#555', marginBottom: 12 }}>TOD: {tod.display}</div>
            <button className="btn btn-gold" onClick={handleAddShot} disabled={working}>
              {working ? 'Saving...' : 'Log Shot'}
            </button>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Sync Camera Clock */}
      {modal === 'sync' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Sync Camera Clock</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>
              Enter the time shown on your camera right now. All TODs will be calculated from this sync point.
            </div>
            <div className="clock-input-row">
              <input className="clock-input" placeholder="HH" maxLength={2} value={syncForm.h} onChange={e => setSyncForm(f => ({ ...f, h: e.target.value }))} />
              <span className="clock-colon">:</span>
              <input className="clock-input" placeholder="MM" maxLength={2} value={syncForm.m} onChange={e => setSyncForm(f => ({ ...f, m: e.target.value }))} />
              <span className="clock-colon">:</span>
              <input className="clock-input" placeholder="SS" maxLength={2} value={syncForm.s} onChange={e => setSyncForm(f => ({ ...f, s: e.target.value }))} />
              <button className="ampm-btn" onClick={() => setSyncForm(f => ({ ...f, ampm: f.ampm === 'AM' ? 'PM' : 'AM' }))}>
                {syncForm.ampm}
              </button>
            </div>
            <button className="btn btn-gold" onClick={handleSyncClock} disabled={working}>
              {working ? 'Syncing...' : 'Sync Now'}
            </button>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Close Confirmation */}
      {modal === 'close' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">Close Session?</div>
            <div style={{ fontSize: 14, color: '#888', marginBottom: 16 }}>
              {notes.length} notes · {shots.length} shots logged.
            </div>
            <button className="btn btn-red" onClick={handleCloseSession} disabled={working}>
              {working ? 'Closing...' : 'Yes, Close Session'}
            </button>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Keep Going</button>
          </div>
        </div>
      )}

      {/* Session Report */}
      {modal === 'report' && report && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-title">Session Wrapped ✓</div>
            <div className="stat-blocks" style={{ marginBottom: 20 }}>
              <div className="stat-block"><div className="n">{report.fieldNoteCount}</div><div className="lbl">Notes</div></div>
              <div className="stat-block"><div className="n">{report.capturedShotCount}</div><div className="lbl">Shots</div></div>
              {report.durationMinutes != null && (
                <div className="stat-block"><div className="n">{report.durationMinutes}</div><div className="lbl">Min</div></div>
              )}
            </div>
            <button className="btn btn-gold" onClick={() => { setModal(null); router.push('/dashboard'); }}>
              Back to Dashboard
            </button>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>
              View Timeline
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

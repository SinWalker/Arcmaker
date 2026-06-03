import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AppLayout from '../layout/AppLayout';
import { getActiveCampaign } from '../../lib/campaign';
import { getTodaysAssignments, updateAssignment } from '../../lib/assignment';
import { getActiveSession, createSession } from '../../lib/session';
import { getDB } from '../../lib/db/db';

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

export default function TodayUI() {
  const router = useRouter();
  const now = new Date();
  const todayLabel = `${MONTHS[now.getMonth()]} ${now.getDate()} // ${now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}`;

  const [campaign, setCampaign] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    async function load() {
      const c = await getActiveCampaign();
      setCampaign(c);
      if (c) {
        const [assignments, sess] = await Promise.all([
          getTodaysAssignments(c.id),
          getActiveSession(c.id),
        ]);
        // Use first today assignment
        const a = assignments[0] || null;
        setAssignment(a);
        setActiveSession(sess);

        // Recent activity: last 4 entries across session
        if (sess) {
          await loadActivity(sess.id);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  async function loadActivity(sessionId) {
    const db = getDB();
    const [notes, chars, leads, shots] = await Promise.all([
      db.fieldNotes.where('sessionId').equals(sessionId).sortBy('todSeconds'),
      db.characters.where('sessionId').equals(sessionId).sortBy('createdAt'),
      db.businessLeads.where('sessionId').equals(sessionId).sortBy('createdAt'),
      db.capturedShots.where('sessionId').equals(sessionId).sortBy('todSeconds'),
    ]);

    const all = [
      ...notes.map(n => ({ type: n.type?.toUpperCase() || 'NOTE', text: n.text, tod: n.tod, ts: n.todSeconds || 0 })),
      ...chars.map(c => ({ type: 'CHARACTER', text: c.name, tod: null, ts: new Date(c.createdAt).getTime() / 1000 })),
      ...leads.map(l => ({ type: 'LEAD', text: l.name, tod: null, ts: new Date(l.createdAt).getTime() / 1000 })),
      ...shots.map(s => ({ type: 'SHOT', text: s.description, tod: s.tod, ts: s.todSeconds || 0 })),
    ].sort((a, b) => b.ts - a.ts).slice(0, 5);

    setRecentActivity(all);
  }

  async function handleToggleCondition(key) {
    if (!assignment) return;
    const current = assignment.completedSuccessConditions || [];
    const next = current.includes(key)
      ? current.filter(k => k !== key)
      : [...current, key];
    const updated = await updateAssignment(assignment.id, { completedSuccessConditions: next });
    setAssignment(updated);
  }

  async function handleStartSession() {
    if (!campaign || !assignment) return;
    setStarting(true);
    try {
      const title = assignment.missionTitle || assignment.title || 'Field Session';
      const sess = await createSession(campaign.id, assignment.id, title, assignment.primaryLocation || undefined);
      setActiveSession(sess);
      router.push('/field');
    } catch (e) {
      setStarting(false);
    }
  }

  function formatTod(todString) {
    if (!todString) return null;
    return todString.replace(/ (AM|PM)$/, '').slice(0, 5);
  }

  if (loading) return (
    <AppLayout sysLabel="STORY OPERATIONS SYSTEM" pageTitle="TODAY">
      <div style={{ color: 'var(--muted)', fontSize: 13, padding: '20px 0' }}>LOADING...</div>
    </AppLayout>
  );

  // ── No mission today ──────────────────────────────────────────────────────
  if (!assignment) {
    return (
      <AppLayout sysLabel="STORY OPERATIONS SYSTEM" pageTitle="TODAY">

        <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--muted)', marginBottom: 4 }}>
          {todayLabel}
        </div>

        <div className="window">
          <div className="window-title-tab">TODAY'S MISSION</div>
          <div className="window-inner">
            <div className="win-title" style={{ color: 'var(--muted)' }}>NO MISSION ASSIGNED</div>
            <div className="copy-text" style={{ marginTop: 8 }}>
              {campaign
                ? 'No mission is scheduled for today. Open the Mission Board to check the full schedule.'
                : 'No active campaign. Check ARC to select one.'}
            </div>
            <button
              className="cta-btn"
              style={{ marginTop: 16 }}
              onClick={() => router.push('/cal')}
            >
              OPEN MISSION BOARD →
            </button>
            {!campaign && (
              <button className="cta-btn ghost" onClick={() => router.push('/arc')}>
                OPEN ARC
              </button>
            )}
          </div>
        </div>

        {/* Active session banner even without today assignment */}
        {activeSession && (
          <div className="window active-border">
            <div className="window-title-tab">ACTIVE SESSION</div>
            <div className="window-inner">
              <div className="win-title">{activeSession.title.toUpperCase()}</div>
              <button className="cta-btn" onClick={() => router.push('/field')}>
                RETURN TO FIELD →
              </button>
            </div>
          </div>
        )}

        {/* Secondary nav */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 8 }}>
          <button className="action-btn" onClick={() => router.push('/ops')}>
            OPEN OPS
          </button>
          <button className="action-btn" onClick={() => router.push('/log')}>
            OPEN LOG
          </button>
        </div>

      </AppLayout>
    );
  }

  // ── Mission today ─────────────────────────────────────────────────────────
  const conditions = assignment.successConditions || [];
  const completed = assignment.completedSuccessConditions || [];

  return (
    <AppLayout sysLabel="STORY OPERATIONS SYSTEM" pageTitle="TODAY">

      {/* Date */}
      <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--muted)', marginBottom: 4 }}>
        {todayLabel}
      </div>

      {/* TODAY'S MISSION window */}
      <div className={`window${activeSession ? ' active-border' : ''}`}>
        <div className="window-title-tab">TODAY'S MISSION</div>
        <div className="window-inner">

          <div className="win-title">
            {(assignment.missionTitle || assignment.title || 'MISSION').toUpperCase()}
          </div>

          {assignment.dayType && (
            <span className="chip" style={{ marginTop: 6 }}>
              {assignment.dayType.toUpperCase()}
              {assignment.dayType === 'tentpole' && ' ★'}
            </span>
          )}

          {activeSession && (
            <span className="chip green" style={{ marginTop: 6, marginLeft: 6 }}>
              SESSION LIVE
            </span>
          )}

          {/* Objective */}
          {assignment.objective && (
            <div className="objective-box">
              <div className="field-label">OBJECTIVE</div>
              <div className="copy-text" style={{ marginTop: 4 }}>{assignment.objective}</div>
            </div>
          )}

          {/* Location */}
          {assignment.primaryLocation && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--copy)' }}>
              <span style={{ color: 'var(--cyan)', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', fontSize: 10 }}>
                LOCATION:{' '}
              </span>
              {assignment.primaryLocation}
            </div>
          )}

        </div>
      </div>

      {/* SUCCESS CONDITIONS window */}
      {conditions.length > 0 && (
        <div className="window">
          <div className="window-title-tab">SUCCESS CONDITIONS</div>
          <div className="window-inner">
            {conditions.map((cond, i) => {
              const key = String(i);
              const done = completed.includes(key);
              return (
                <div
                  key={i}
                  className="check-item"
                  onClick={() => handleToggleCondition(key)}
                >
                  <div className={`check-box${done ? ' done' : ''}`}>{done ? '✓' : ''}</div>
                  <div className={`check-text${done ? ' done' : ''}`}>{cond}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FIELD SESSION window */}
      <div className="window">
        <div className="window-title-tab">FIELD SESSION</div>
        <div className="window-inner">

          {activeSession ? (
            <>
              <div className="copy-text" style={{ marginBottom: 10 }}>
                Session is active.
                {activeSession.location && ` // ${activeSession.location}`}
              </div>
              <button className="cta-btn" onClick={() => router.push('/field')}>
                RETURN TO FIELD →
              </button>
            </>
          ) : (
            <>
              <div className="copy-text" style={{ marginBottom: 10 }}>
                No session running. Start one to begin logging.
              </div>
              <button
                className="cta-btn"
                onClick={handleStartSession}
                disabled={starting}
              >
                {starting ? 'STARTING...' : 'START FIELD SESSION →'}
              </button>
            </>
          )}

        </div>
      </div>

      {/* MISSION LOG — recent activity if session exists */}
      {activeSession && (
        <div className="window">
          <div className="window-title-tab">MISSION LOG</div>
          <div className="window-inner">
            {recentActivity.length === 0 ? (
              <div className="copy-text" style={{ color: 'var(--muted)' }}>
                No activity logged yet.
              </div>
            ) : (
              recentActivity.map((item, i) => (
                <div key={i} className="log-item">
                  <div className="log-time">
                    {item.tod ? formatTod(item.tod) : '—'}
                  </div>
                  <div>
                    <div className="log-type">{item.type}</div>
                    <div className="log-copy">{item.text}</div>
                  </div>
                </div>
              ))
            )}
            <button
              className="cta-btn ghost"
              style={{ marginTop: 10 }}
              onClick={() => router.push('/log')}
            >
              OPEN FULL LOG
            </button>
          </div>
        </div>
      )}

      {/* Secondary nav */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 4, marginBottom: 8 }}>
        <button className="action-btn" onClick={() => router.push('/cal')}>
          MISSION BOARD
        </button>
        <button className="action-btn" onClick={() => router.push('/ops')}>
          OPEN OPS
        </button>
      </div>

    </AppLayout>
  );
}

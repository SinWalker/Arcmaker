import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AppLayout from '../layout/AppLayout';
import { getActiveCampaign } from '../../lib/campaign';
import { getTodaysAssignments } from '../../lib/assignment';
import { getActiveSession, createSession } from '../../lib/session';

function toYMD(date) {
  return date.toISOString().slice(0, 10);
}

export default function TodayUI() {
  const router = useRouter();
  const today = new Date();
  const todayLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const [campaign, setCampaign] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    async function load() {
      const c = await getActiveCampaign();
      setCampaign(c);
      if (c) {
        const [asgn, sess] = await Promise.all([
          getTodaysAssignments(c.id),
          getActiveSession(c.id),
        ]);
        setAssignments(asgn);
        setActiveSession(sess);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleStartSession(assignmentId, title) {
    if (!campaign) return;
    setStarting(true);
    const session = await createSession(campaign.id, assignmentId, title);
    router.push(`/sessions/${session.id}`);
  }

  if (loading) return <AppLayout title="Today"><div style={{ color: '#888', padding: 40, textAlign: 'center' }}>Loading...</div></AppLayout>;

  return (
    <AppLayout title="Today">
      <div style={{ fontSize: 13, color: '#888', marginBottom: 16 }}>{todayLabel}</div>

      {/* Active session banner */}
      {activeSession && (
        <div
          onClick={() => router.push(`/sessions/${activeSession.id}`)}
          style={{ background: '#0D2A1A', border: '1px solid #27AE60', borderRadius: 10, padding: '14px', marginBottom: 16, cursor: 'pointer' }}
        >
          <div style={{ fontSize: 11, color: '#27AE60', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>● Session Live</div>
          <div style={{ fontSize: 17, color: '#F0F0F0', fontWeight: 700 }}>{activeSession.title}</div>
          {activeSession.location && <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>📍 {activeSession.location}</div>}
          <div style={{ marginTop: 10, color: '#C9A84C', fontSize: 14, fontWeight: 700 }}>Tap to open →</div>
        </div>
      )}

      {/* Today's missions */}
      <div className="section-header">Today's Missions</div>

      {assignments.length === 0 ? (
        <div className="card">
          <div className="card-body">No missions scheduled today.</div>
          <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => router.push('/calendar')}>
            + Schedule a Mission
          </button>
          {!activeSession && campaign && (
            <button className="btn btn-gold" style={{ marginTop: 8 }} onClick={() => router.push('/sessions/new')}>
              🎬 Start Unplanned Session
            </button>
          )}
        </div>
      ) : (
        assignments.map(a => (
          <div key={a.id} className="card" style={{ marginBottom: 10 }}>
            <div className="card-label">{a.status.toUpperCase()}</div>
            <div className="card-title" style={{ marginBottom: 4 }}>{a.title}</div>
            {a.location && <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>📍 {a.location}</div>}
            {a.storyQuestion && (
              <div style={{ fontSize: 13, color: '#888', fontStyle: 'italic', marginBottom: 10 }}>"{a.storyQuestion}"</div>
            )}
            {!activeSession ? (
              <button
                className="btn btn-gold"
                onClick={() => handleStartSession(a.id, a.title)}
                disabled={starting}
              >
                {starting ? 'Starting...' : '🎬 Start Session'}
              </button>
            ) : activeSession.assignmentId === a.id ? (
              <button className="btn btn-gold" onClick={() => router.push(`/sessions/${activeSession.id}`)}>
                ● Continue Session
              </button>
            ) : (
              <button className="btn btn-ghost" disabled>Session active elsewhere</button>
            )}
          </div>
        ))
      )}

      {/* All sessions link */}
      <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => router.push('/sessions')}>
        View All Sessions
      </button>
    </AppLayout>
  );
}

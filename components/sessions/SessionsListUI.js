import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AppLayout from '../layout/AppLayout';
import { getActiveCampaign } from '../../lib/campaign';
import { getSessionsForCampaign } from '../../lib/session';

function durationLabel(sec) {
  if (!sec) return null;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const STATUS_DOT = {
  active: '#27AE60',
  completed: '#C9A84C',
  abandoned: '#444',
};

export default function SessionsListUI() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const c = await getActiveCampaign();
      if (c) {
        const s = await getSessionsForCampaign(c.id);
        setSessions(s.reverse()); // newest first
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <AppLayout title="Sessions"><div style={{ color: '#888', padding: 40, textAlign: 'center' }}>Loading...</div></AppLayout>;

  return (
    <AppLayout title="Sessions">
      <button className="btn btn-gold" style={{ marginBottom: 16 }} onClick={() => router.push('/sessions/new')}>
        🎬 New Session
      </button>

      {sessions.length === 0 ? (
        <div className="empty-state">
          <span className="emoji">🎥</span>
          <p>No sessions yet. Start your first field session.</p>
        </div>
      ) : (
        sessions.map(s => (
          <div
            key={s.id}
            className="card session-card"
            onClick={() => router.push(`/sessions/${s.id}`)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_DOT[s.status], flexShrink: 0, display: 'inline-block' }} />
              <span className="card-title" style={{ fontSize: 16 }}>{s.title}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="stat-chip">{s.date}</span>
              {s.location && <span className="stat-chip">📍 {s.location}</span>}
              {s.durationSeconds && <span className="stat-chip">⏱ {durationLabel(s.durationSeconds)}</span>}
              {s.status === 'active' && <span className="stat-chip" style={{ color: '#27AE60', borderColor: '#27AE60' }}>LIVE</span>}
            </div>
          </div>
        ))
      )}
    </AppLayout>
  );
}

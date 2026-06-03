import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AppLayout from '../layout/AppLayout';
import { getActiveCampaign, getCampaignStats } from '../../lib/campaign';
import { getActiveProfile } from '../../lib/profile';
import { getActiveSession } from '../../lib/session';
import { exportAndDownloadCampaign } from '../../lib/export';

export default function DashboardUI() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [stats, setStats] = useState({ sessions: 0, fieldNotes: 0, capturedShots: 0 });
  const [activeSession, setActiveSession] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [p, c] = await Promise.all([getActiveProfile(), getActiveCampaign()]);
      setProfile(p);
      setCampaign(c);
      if (c) {
        const [s, act] = await Promise.all([getCampaignStats(c.id), getActiveSession(c.id)]);
        setStats(s);
        setActiveSession(act);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleExport() {
    if (!campaign) return;
    setExporting(true);
    await exportAndDownloadCampaign(campaign.id);
    setExporting(false);
  }

  if (loading) return (
    <AppLayout>
      <div style={{ color: '#888', padding: 40, textAlign: 'center' }}>Loading...</div>
    </AppLayout>
  );

  if (!profile) {
    return (
      <AppLayout title="ArcMaker">
        <div className="empty-state">
          <span className="emoji">👤</span>
          <p>No profile yet. Set one up first.</p>
          <button className="btn btn-gold" style={{ marginTop: 16 }} onClick={() => router.push('/onboarding')}>
            Set Up Profile
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="ArcMaker">
      {/* Active session banner */}
      {activeSession && (
        <div
          onClick={() => router.push(`/sessions/${activeSession.id}`)}
          style={{ background: '#0D2A1A', border: '1px solid #27AE60', borderRadius: 10, padding: '12px 14px', marginBottom: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <div>
            <div style={{ fontSize: 11, color: '#27AE60', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 }}>● Live Session</div>
            <div style={{ fontSize: 15, color: '#F0F0F0', fontWeight: 600 }}>{activeSession.title}</div>
          </div>
          <span style={{ color: '#C9A84C', fontSize: 20 }}>›</span>
        </div>
      )}

      {/* Campaign card */}
      {campaign ? (
        <div className="card" style={{ marginBottom: 8 }}>
          <div className="card-label">Active Arc</div>
          <div className="card-title" style={{ marginBottom: 6 }}>{campaign.title}</div>
          {campaign.storyQuestion && (
            <div className="card-body" style={{ fontStyle: 'italic', marginBottom: 10 }}>"{campaign.storyQuestion}"</div>
          )}
          {campaign.startDate && (
            <div style={{ fontSize: 12, color: '#888' }}>{campaign.startDate} → {campaign.endDate}</div>
          )}
        </div>
      ) : (
        <div className="card">
          <div className="card-label">No Active Campaign</div>
          <div className="card-body">Go to Setup to create your first campaign.</div>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[
          { n: stats.sessions, label: 'Sessions', icon: '🎥' },
          { n: stats.fieldNotes, label: 'Notes', icon: '📝' },
          { n: stats.capturedShots, label: 'Shots', icon: '📷' },
        ].map(({ n, label, icon }) => (
          <div key={label} style={{ flex: 1, background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, marginBottom: 2 }}>{icon}</div>
            <div style={{ fontSize: 22, color: '#C9A84C', fontWeight: 800 }}>{n}</div>
            <div style={{ fontSize: 11, color: '#888', fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="section-header">Quick Actions</div>

      {!activeSession && campaign && (
        <button className="btn btn-gold" onClick={() => router.push('/sessions/new')}>
          🎬 Start Field Session
        </button>
      )}
      {activeSession && (
        <button className="btn btn-gold" onClick={() => router.push(`/sessions/${activeSession.id}`)}>
          ● Continue Session
        </button>
      )}

      <button className="btn btn-ghost" onClick={() => router.push('/calendar')}>
        📅 Mission Board
      </button>
      <button className="btn btn-ghost" onClick={() => router.push('/today')}>
        ● Today's Assignment
      </button>
      <button className="btn btn-ghost" onClick={() => router.push('/sessions')}>
        🎥 All Sessions
      </button>

      {campaign && (
        <button className="btn btn-ghost" onClick={handleExport} disabled={exporting} style={{ marginTop: 16 }}>
          {exporting ? 'Exporting...' : '⬇ Export Campaign JSON'}
        </button>
      )}

      {/* Profile chip */}
      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2A2A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#C9A84C', fontWeight: 700 }}>
          {profile.displayName[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#F0F0F0' }}>{profile.displayName}</div>
          {profile.role && <div style={{ fontSize: 12, color: '#888' }}>{profile.role}</div>}
        </div>
      </div>
    </AppLayout>
  );
}

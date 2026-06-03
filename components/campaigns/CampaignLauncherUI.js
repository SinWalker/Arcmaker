import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAllCampaigns } from '../../lib/campaign';
import { getActiveProfile } from '../../lib/profile';

const STATUS_LABEL = { active: 'Active', archived: 'Archived', template: 'Template' };
const STATUS_COLOR = { active: '#27AE60', archived: '#555', template: '#5B9BD5' };

export default function CampaignLauncherUI() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [p, c] = await Promise.all([getActiveProfile(), getAllCampaigns()]);
      setProfile(p);
      setCampaigns(c);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#444', fontSize: 14 }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', color: '#F0F0F0' }}>

      {/* Header */}
      <div style={{ padding: '20px 20px 0', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.5 }}>ArcMaker</div>
            <div style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase' }}>
              Field Production OS
            </div>
          </div>
          {profile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2A2A1A', border: '1px solid #3A3A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#C9A84C', fontWeight: 800 }}>
                {profile.displayName[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{profile.displayName}</div>
                {profile.role && <div style={{ fontSize: 11, color: '#888' }}>{profile.role}</div>}
              </div>
            </div>
          )}
        </div>

        <div style={{ fontSize: 13, color: '#888', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
          Your Arcs
        </div>
      </div>

      {/* Campaign list */}
      <div style={{ padding: '0 20px 40px', maxWidth: 480, margin: '0 auto' }}>
        {campaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
            <div style={{ color: '#888', fontSize: 14, lineHeight: 1.6 }}>No campaigns yet.</div>
          </div>
        ) : (
          campaigns.map(c => (
            <div
              key={c.id}
              onClick={() => router.push(`/campaigns/${c.id}`)}
              style={{
                background: '#1A1A1A',
                border: `1px solid ${c.status === 'active' ? '#2A3A2A' : '#2A2A2A'}`,
                borderRadius: 12,
                padding: 18,
                marginBottom: 12,
                cursor: 'pointer',
              }}
            >
              {/* Status + seed badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
                  color: STATUS_COLOR[c.status],
                }}>
                  ● {STATUS_LABEL[c.status]}
                </span>
                {c.isSeedCampaign && (
                  <span style={{ fontSize: 11, color: '#C9A84C', background: '#2A2A1A', borderRadius: 4, padding: '2px 6px', fontWeight: 700 }}>
                    WORLD CUP
                  </span>
                )}
              </div>

              <div style={{ fontSize: 19, fontWeight: 800, marginBottom: 8, lineHeight: 1.2 }}>{c.title}</div>

              {c.storyQuestion && (
                <div style={{ fontSize: 13, color: '#888', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 10 }}>
                  "{c.storyQuestion}"
                </div>
              )}

              {c.startDate && (
                <div style={{ fontSize: 12, color: '#555' }}>
                  {c.startDate} → {c.endDate}
                </div>
              )}

              <div style={{ marginTop: 14, color: '#C9A84C', fontSize: 13, fontWeight: 700 }}>
                Open Arc →
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

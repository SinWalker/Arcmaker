import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAllProfiles, switchProfile, createProfile } from '../lib/profile';
import { ensureWorldCupSeedCampaign } from '../lib/seed';

export default function ProfileSelectUI() {
  const router = useRouter();
  const [profiles, setProfiles] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const all = await getAllProfiles();
      setProfiles(all);
      setShowCreate(all.length === 0);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSelect(profileId) {
    setSaving(true);
    await switchProfile(profileId);
    const profile = profiles.find(p => p.id === profileId);
    if (profile) await ensureWorldCupSeedCampaign(profile.id);
    router.replace('/arc');
  }

  async function handleCreate() {
    if (!name.trim()) return;
    setSaving(true);
    const profile = await createProfile(name.trim(), role.trim() || undefined, true);
    await ensureWorldCupSeedCampaign(profile.id);
    router.replace('/arc');
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#444', fontSize: 14 }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', color: '#F0F0F0' }}>
      <div style={{ maxWidth: 400, margin: '0 auto', padding: 24 }}>

        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>ArcMaker</div>
          <div style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 }}>
            Who's on set?
          </div>
        </div>

        {/* Existing profiles */}
        {profiles.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: '#7A6330', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
              Select Profile
            </div>
            {profiles.map(p => (
              <button
                key={p.id}
                onClick={() => handleSelect(p.id)}
                disabled={saving}
                style={{
                  width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A',
                  borderRadius: 10, padding: '14px 16px', marginBottom: 10,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                  textAlign: 'left',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#2A2A1A', border: '1px solid #3A3A2A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#C9A84C', fontWeight: 800, flexShrink: 0 }}>
                  {p.displayName[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#F0F0F0' }}>{p.displayName}</div>
                  {p.role && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{p.role}</div>}
                </div>
              </button>
            ))}

            <div style={{ textAlign: 'center', margin: '20px 0 16px' }}>
              <button
                onClick={() => setShowCreate(v => !v)}
                style={{ background: 'none', border: 'none', color: '#C9A84C', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
              >
                {showCreate ? '— Cancel' : '+ Create New Profile'}
              </button>
            </div>
          </>
        )}

        {/* Create new profile form */}
        {showCreate && (
          <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#888', marginBottom: 14 }}>New Profile</div>
            <input
              placeholder="Your name (e.g. Sin)"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus={profiles.length === 0}
            />
            <input
              placeholder="Role (optional — e.g. Director)"
              value={role}
              onChange={e => setRole(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
            <button
              className="btn btn-gold"
              onClick={handleCreate}
              disabled={saving || !name.trim()}
            >
              {saving ? 'Setting up...' : "Let's Go →"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

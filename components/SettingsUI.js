import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getActiveProfile, deactivateProfile } from '../lib/profile';

export default function SettingsUI() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const p = await getActiveProfile();
      setProfile(p);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSwitchProfile() {
    if (profile) await deactivateProfile(profile.id);
    sessionStorage.removeItem('arcmaker_authed');
    router.replace('/profile-select');
  }

  async function handleLogout() {
    if (profile) await deactivateProfile(profile.id);
    sessionStorage.removeItem('arcmaker_authed');
    router.replace('/pin');
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#444', fontSize: 14 }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', color: '#F0F0F0', paddingBottom: 80 }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: 20 }}>

        <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 28, letterSpacing: -0.5 }}>Settings</div>

        {/* Profile card */}
        {profile && (
          <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: '#2A2A1A', border: '1px solid #3A3A2A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, color: '#C9A84C', fontWeight: 800,
              }}>
                {profile.displayName[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{profile.displayName}</div>
                {profile.role && <div style={{ fontSize: 13, color: '#888' }}>{profile.role}</div>}
              </div>
            </div>

            <button
              onClick={handleSwitchProfile}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 8,
                background: '#2A2A2A', border: '1px solid #3A3A2A',
                color: '#F0F0F0', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                marginBottom: 10,
              }}
            >
              Switch Profile
            </button>

            <button
              onClick={handleLogout}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 8,
                background: 'transparent', border: '1px solid #2A2A2A',
                color: '#555', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Lock Screen
            </button>
          </div>
        )}

        {/* App info */}
        <div style={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, color: '#555', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>
            About
          </div>
          <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>
            <div style={{ marginBottom: 6 }}>
              <span style={{ color: '#F0F0F0', fontWeight: 700 }}>ArcMaker</span> — Field Production OS
            </div>
            <div>V1 · Local-first · IndexedDB</div>
          </div>
        </div>

        {/* Dev link */}
        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <button
            onClick={() => router.push('/dev/foundation')}
            style={{ background: 'none', border: 'none', color: '#2A2A2A', fontSize: 11, cursor: 'pointer' }}
          >
            diagnostics
          </button>
        </div>

      </div>
    </div>
  );
}

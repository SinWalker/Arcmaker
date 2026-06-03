import { useState } from 'react';
import { useRouter } from 'next/router';
import { createProfile } from '../lib/profile';

const ROLES = ['Director', 'DP', 'Second Shooter', 'Producer', 'Editor'];

export default function OnboardingUI() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!name.trim()) { setError('Enter your name to continue.'); return; }
    setSaving(true);
    try {
      const { ensureWorldCupSeedCampaign } = await import('../lib/seed');
      const profile = await createProfile(name.trim(), role.trim() || undefined, true);
      await ensureWorldCupSeedCampaign(profile.id);
      router.replace('/arc');
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0D0D0D', display: 'flex',
      flexDirection: 'column', justifyContent: 'center', padding: 24,
    }}>
      <div style={{ maxWidth: 400, margin: '0 auto', width: '100%' }}>

        {/* Logo */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#F0F0F0', letterSpacing: -1 }}>ArcMaker</div>
          <div style={{ fontSize: 13, color: '#C9A84C', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 }}>
            Field Production OS
          </div>
        </div>

        <div style={{ fontSize: 22, fontWeight: 700, color: '#F0F0F0', marginBottom: 6 }}>
          Who's on set?
        </div>
        <div style={{ fontSize: 14, color: '#888', marginBottom: 32, lineHeight: 1.6 }}>
          This stays on your device. Not an account — just so ArcMaker knows who's logging.
        </div>

        <div style={{ fontSize: 11, color: '#7A6330', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
          Your Name
        </div>
        <input
          placeholder="e.g. Sin"
          value={name}
          onChange={e => { setName(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          autoFocus
          style={{ marginBottom: 20 }}
        />

        <div style={{ fontSize: 11, color: '#7A6330', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
          Role (optional)
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {ROLES.map(r => (
            <button
              key={r}
              onClick={() => setRole(prev => prev === r ? '' : r)}
              style={{
                background: role === r ? '#C9A84C' : '#1A1A1A',
                color: role === r ? '#0D0D0D' : '#888',
                border: `1px solid ${role === r ? '#C9A84C' : '#2A2A2A'}`,
                borderRadius: 20,
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >{r}</button>
          ))}
          {!ROLES.includes(role) && role && (
            <span style={{ display: 'flex', alignItems: 'center', background: '#C9A84C', color: '#0D0D0D', borderRadius: 20, padding: '8px 16px', fontSize: 14, fontWeight: 700 }}>
              {role}
            </span>
          )}
        </div>

        <input
          placeholder="Or type a custom role"
          value={ROLES.includes(role) ? '' : role}
          onChange={e => setRole(e.target.value)}
          style={{ marginBottom: 32 }}
        />

        {error && (
          <div style={{ color: '#C0392B', fontSize: 13, marginBottom: 12 }}>{error}</div>
        )}

        <button
          className="btn btn-gold"
          onClick={handleCreate}
          disabled={saving || !name.trim()}
          style={{ fontSize: 16, padding: 16 }}
        >
          {saving ? 'Setting up...' : "Let's Go →"}
        </button>

        <div style={{ fontSize: 12, color: '#444', textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
          Your World Cup Arc campaign will be ready when you land.
        </div>
      </div>
    </div>
  );
}

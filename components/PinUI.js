import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// PinUI — local PIN entry screen
// Loads active profile, checks PIN (stored in profile.pin), sets sessionStorage on success

export default function PinUI() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [entered, setEntered] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { getActiveProfile } = await import('../lib/profile');
      const p = await getActiveProfile();
      setProfile(p);
      setLoading(false);
    }
    load();
  }, []);

  function press(digit) {
    if (entered.length >= 4) return;
    const next = entered + digit;
    setEntered(next);
    if (next.length === 4) {
      validate(next);
    }
  }

  function backspace() {
    setEntered(prev => prev.slice(0, -1));
  }

  async function validate(pin) {
    const expectedPin = profile?.pin ?? '1234';
    if (pin === expectedPin) {
      // Activate profile if not already active
      if (profile && !profile.isActive) {
        const { switchProfile } = await import('../lib/profile');
        await switchProfile(profile.id);
      }
      sessionStorage.setItem('arcmaker_authed', '1');
      router.replace('/campaigns');
    } else {
      // Wrong PIN — shake and clear
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setEntered('');
      }, 600);
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#444', fontSize: 14 }}>Loading...</div>
    </div>
  );

  const NUMPAD = [
    ['1','2','3'],
    ['4','5','6'],
    ['7','8','9'],
    [null,'0','⌫'],
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D0D0D',
      color: '#F0F0F0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.5 }}>ArcMaker</div>
        <div style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 }}>
          Field Production OS
        </div>
      </div>

      {/* Profile name */}
      {profile && (
        <div style={{ fontSize: 15, color: '#888', marginBottom: 32, fontWeight: 600 }}>
          Welcome back, {profile.displayName}
        </div>
      )}

      {/* PIN dots */}
      <div style={{
        display: 'flex',
        gap: 20,
        marginBottom: 48,
        animation: shake ? 'pinShake 0.5s ease' : 'none',
      }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: entered.length > i ? '#C9A84C' : 'transparent',
            border: `2px solid ${entered.length > i ? '#C9A84C' : '#3A3A2A'}`,
            transition: 'background 0.1s, border-color 0.1s',
          }} />
        ))}
      </div>

      {/* Numpad */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {NUMPAD.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 12 }}>
            {row.map((key, ki) => {
              if (key === null) return <div key={ki} style={{ width: 80, height: 80 }} />;
              const isBack = key === '⌫';
              return (
                <button
                  key={ki}
                  onClick={() => isBack ? backspace() : press(key)}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 16,
                    background: isBack ? 'transparent' : '#1A1A1A',
                    border: isBack ? 'none' : '1px solid #2A2A2A',
                    color: isBack ? '#555' : '#F0F0F0',
                    fontSize: isBack ? 22 : 26,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {key}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Switch profile link */}
      <button
        onClick={() => router.push('/profile-select')}
        style={{
          marginTop: 40,
          background: 'none',
          border: 'none',
          color: '#3A3A2A',
          fontSize: 12,
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Switch Profile
      </button>

      <style>{`
        @keyframes pinShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}

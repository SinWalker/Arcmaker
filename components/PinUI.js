import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

// PinUI — ARCMAKER styled local access screen
// Matches ARCMAKER design system: dark grid, Oxanium, cyan, hard borders, all caps

export default function PinUI() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [entered, setEntered] = useState('');
  const [error, setError] = useState(false);
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
    setError(false);
    const next = entered + digit;
    setEntered(next);
    if (next.length === 4) validate(next);
  }

  function backspace() {
    setEntered(prev => prev.slice(0, -1));
    setError(false);
  }

  async function validate(pin) {
    const expected = profile?.pin ?? '1234';
    if (pin === expected) {
      if (profile && !profile.isActive) {
        const { switchProfile } = await import('../lib/profile');
        await switchProfile(profile.id);
      }
      sessionStorage.setItem('arcmaker_authed', '1');
      router.replace('/today');
    } else {
      setShake(true);
      setError(true);
      setTimeout(() => {
        setShake(false);
        setEntered('');
      }, 600);
    }
  }

  const NUMPAD = [
    ['1','2','3'],
    ['4','5','6'],
    ['7','8','9'],
    [null,'0','⌫'],
  ];

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      background: '#080b12',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Oxanium, system-ui, sans-serif',
    }}>
      <div style={{ color: '#7ea6c7', fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800 }}>
        INITIALIZING...
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background:
        'linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px), ' +
        'linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px), ' +
        '#111827',
      backgroundSize: '14px 14px, 14px 14px, cover',
      color: '#cfe8ff',
      fontFamily: 'Oxanium, system-ui, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 20px',
      position: 'relative',
    }}>

      {/* Scan line overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'repeating-linear-gradient(0deg, rgba(255,255,255,.04) 0px, rgba(255,255,255,.04) 1px, transparent 1px, transparent 5px)',
        opacity: 0.18,
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 360 }}>

        {/* ARCMAKER Header — same as SystemHeader */}
        <div style={{
          border: '2px solid #34d7ff',
          background: '#0c1320',
          boxShadow: '4px 4px 0 #05070c',
          padding: '12px',
          marginBottom: 20,
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: 10,
            color: '#7ea6c7',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontWeight: 800,
            marginBottom: 4,
          }}>
            STORY OPERATIONS SYSTEM
          </div>
          <div style={{
            fontSize: 38,
            lineHeight: 0.9,
            letterSpacing: '-0.08em',
            textTransform: 'uppercase',
            fontWeight: 800,
            color: '#cfe8ff',
            textShadow: '2px 2px 0 rgba(52,215,255,0.3)',
          }}>
            ARCMAKER
          </div>
        </div>

        {/* LOCAL ACCESS window */}
        <div style={{
          position: 'relative',
          background: '#172133',
          border: '2px solid #2e4768',
          boxShadow: '4px 4px 0 #05070c',
          marginBottom: 16,
          marginTop: 14,
        }}>
          <div style={{
            position: 'absolute',
            top: -12,
            left: 10,
            background: '#080b12',
            border: '2px solid #2e4768',
            padding: '1px 8px',
            color: '#34d7ff',
            fontSize: 10,
            letterSpacing: '0.16em',
            fontWeight: 800,
            textTransform: 'uppercase',
          }}>
            LOCAL ACCESS
          </div>
          <div style={{ padding: '16px 12px 12px' }}>

            {/* USER row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.17em', color: '#34d7ff' }}>USER</div>
              <div style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', color: '#cfe8ff' }}>
                {profile?.displayName || '—'}
              </div>
            </div>

            {/* ROLE row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 8,
              borderTop: '1px dashed rgba(126,166,199,0.35)',
              marginBottom: 8,
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.17em', color: '#34d7ff' }}>ROLE</div>
              <div style={{ fontSize: 13, color: '#9eb8d2' }}>
                {profile?.role || 'FIELD OPERATOR'}
              </div>
            </div>

            {/* PIN label */}
            <div style={{
              paddingTop: 8,
              borderTop: '1px dashed rgba(126,166,199,0.35)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.17em', color: '#34d7ff', marginBottom: 10 }}>
                PIN
              </div>

              {/* PIN dots */}
              <div style={{
                display: 'flex',
                gap: 16,
                marginBottom: 4,
                animation: shake ? 'pinShake 0.5s ease' : 'none',
              }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{
                    width: 22,
                    height: 22,
                    border: `2px solid ${entered.length > i ? '#34d7ff' : '#2e4768'}`,
                    background: entered.length > i ? '#34d7ff' : 'transparent',
                    transition: 'background 0.1s, border-color 0.1s',
                  }} />
                ))}
                {error && (
                  <div style={{
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: '#ff4057',
                    marginLeft: 12,
                    alignSelf: 'center',
                  }}>
                    ACCESS DENIED
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Numpad */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {NUMPAD.map((row, ri) => (
            <div key={ri} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {row.map((key, ki) => {
                if (key === null) return <div key={ki} />;
                const isBack = key === '⌫';
                return (
                  <button
                    key={ki}
                    onClick={() => isBack ? backspace() : press(key)}
                    style={{
                      height: 64,
                      border: `2px solid ${isBack ? 'transparent' : '#2e4768'}`,
                      background: isBack ? 'transparent' : '#1e2e45',
                      color: isBack ? '#7ea6c7' : '#cfe8ff',
                      fontFamily: 'Oxanium, sans-serif',
                      fontSize: isBack ? 20 : 22,
                      fontWeight: 800,
                      cursor: 'pointer',
                      boxShadow: isBack ? 'none' : '3px 3px 0 #05070c',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* ACCESS ARC button — full width */}
        <button
          onClick={() => entered.length === 4 && validate(entered)}
          disabled={entered.length < 4}
          style={{
            width: '100%',
            padding: '15px',
            background: entered.length === 4 ? '#34d7ff' : '#0f1523',
            color: entered.length === 4 ? '#06131d' : '#2e4768',
            fontFamily: 'Oxanium, sans-serif',
            fontWeight: 800,
            fontSize: 14,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            border: `2px solid ${entered.length === 4 ? '#34d7ff' : '#2e4768'}`,
            boxShadow: entered.length === 4 ? '3px 3px 0 #05070c' : 'none',
            cursor: entered.length === 4 ? 'pointer' : 'default',
            marginBottom: 12,
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          ACCESS ARC →
        </button>

        {/* Switch profile */}
        <button
          onClick={() => router.push('/profile-select')}
          style={{
            width: '100%',
            background: 'none',
            border: 'none',
            color: '#2e4768',
            fontSize: 10,
            fontFamily: 'Oxanium, sans-serif',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            cursor: 'pointer',
            padding: '8px 0',
          }}
        >
          SWITCH OPERATOR
        </button>

      </div>

      <style>{`
        @keyframes pinShake {
          0%, 100% { transform: translateX(0); }
          20%  { transform: translateX(-10px); }
          40%  { transform: translateX(10px); }
          60%  { transform: translateX(-8px); }
          80%  { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}

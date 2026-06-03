import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

// ARCMAKER — Local Profile Access
// Visual source of truth: ARCMAKER_LOCAL_PROFILE_ACCESS_MOCK.html
// This replaces the old "Who's on set?" onboarding and the standalone PinUI.
// One screen handles: operator preview, active arc, today's mission, PIN entry.
// No numpad — PIN text input as per mock.

export default function LocalProfileAccessUI() {
  const router = useRouter();

  const [profile, setProfile]           = useState(null);
  const [allProfiles, setAllProfiles]   = useState([]);
  const [campaign, setCampaign]         = useState(null);
  const [todayMission, setTodayMission] = useState(null);
  const [loading, setLoading]           = useState(true);

  const [pin, setPin]       = useState('');
  const [error, setError]   = useState(false);
  const [shake, setShake]   = useState(false);
  const [authing, setAuthing] = useState(false);

  const pinRef = useRef(null);

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { runFullSeed }        = await import('../lib/seed');
      const { getActiveProfile, getAllProfiles } = await import('../lib/profile');
      const { getActiveCampaign }  = await import('../lib/campaign');
      const { getTodaysAssignments } = await import('../lib/assignment');

      await runFullSeed();

      const [active, all] = await Promise.all([
        getActiveProfile(),
        getAllProfiles(),
      ]);

      setProfile(active || null);
      setAllProfiles(all || []);

      const c = await getActiveCampaign();
      setCampaign(c || null);

      if (c) {
        const assignments = await getTodaysAssignments(c.id);
        setTodayMission(assignments[0] || null);
      }

      setLoading(false);
    }
    load();
  }, []);

  // ── Auto-focus PIN input once loaded ───────────────────────────────────────
  useEffect(() => {
    if (!loading && pinRef.current) pinRef.current.focus();
  }, [loading]);

  // ── PIN submit ─────────────────────────────────────────────────────────────
  async function handleAccess() {
    if (authing || pin.length < 4) return;
    const expected = profile?.pin ?? '1234';

    if (pin === expected) {
      setAuthing(true);
      if (profile && !profile.isActive) {
        const { switchProfile } = await import('../lib/profile');
        await switchProfile(profile.id);
      }
      sessionStorage.setItem('arcmaker_authed', '1');
      router.replace('/today');
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setPin('');
        setError(false);
        if (pinRef.current) pinRef.current.focus();
      }, 650);
    }
  }

  function handlePinChange(e) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(val);
    setError(false);
  }

  function handlePinKeyDown(e) {
    if (e.key === 'Enter') handleAccess();
  }

  // ── Loading splash ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.screen}>
        {scanLines}
        <div style={{ position: 'relative', zIndex: 1, color: '#7ea6c7', fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 800 }}>
          INITIALIZING...
        </div>
      </div>
    );
  }

  // ── Derived display values ────────────────────────────────────────────────
  const operatorName = profile?.displayName?.toUpperCase() || '—';
  const operatorRole = profile?.role?.toUpperCase() || 'FIELD OPERATOR';
  const arcTitle     = campaign?.title?.toUpperCase() || null;
  const arcSub       = campaign?.mission || null;
  const missionTitle = todayMission
    ? (todayMission.missionTitle || todayMission.title || 'MISSION').toUpperCase()
    : null;
  const missionSub   = todayMission?.objective || null;

  return (
    <div style={styles.screen}>
      {scanLines}

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 390, padding: '0 0 80px' }}>

        {/* ── ARCMAKER Header ───────────────────────────────────────────── */}
        <div style={styles.header}>
          <div style={styles.systemLabel}>STORY OPERATIONS SYSTEM</div>
          <div style={styles.logo}>ARCMAKER</div>
        </div>

        {/* ── LOCAL PROFILE ACCESS window ──────────────────────────────── */}
        <div style={styles.window}>
          <div style={styles.windowTab}>LOCAL PROFILE ACCESS</div>
          <div style={styles.windowInner}>

            <div style={styles.fieldLabel}>OPERATOR</div>
            <div style={styles.operatorName}>{operatorName}</div>
            <div style={styles.operatorRole}>{operatorRole}</div>

            {/* Active Arc sub-panel */}
            {arcTitle ? (
              <div style={styles.subPanel}>
                <div style={styles.fieldLabel}>ACTIVE ARC</div>
                <div style={styles.subPanelTitle}>{arcTitle}</div>
                {arcSub && <div style={styles.subPanelSub}>{arcSub}</div>}
              </div>
            ) : (
              <div style={styles.subPanel}>
                <div style={styles.fieldLabel}>ACTIVE ARC</div>
                <div style={{ ...styles.subPanelTitle, color: '#7ea6c7' }}>NO ACTIVE ARC</div>
              </div>
            )}

            {/* Today's Mission sub-panel */}
            <div style={styles.subPanel}>
              <div style={styles.fieldLabel}>TODAY'S MISSION</div>
              {missionTitle ? (
                <>
                  <div style={{ ...styles.subPanelTitle, fontSize: 20, lineHeight: 1, color: '#ffffff' }}>
                    {missionTitle}
                  </div>
                  {missionSub && <div style={styles.subPanelSub}>{missionSub}</div>}
                </>
              ) : (
                <div style={{ ...styles.subPanelTitle, color: '#7ea6c7' }}>NO MISSION ASSIGNED TODAY</div>
              )}
            </div>

          </div>
        </div>

        {/* ── SECURITY CLEARANCE window ─────────────────────────────────── */}
        <div style={{ ...styles.window, marginTop: 18 }}>
          <div style={styles.windowTab}>SECURITY CLEARANCE</div>
          <div style={styles.windowInner}>

            <div style={styles.fieldLabel}>PIN</div>

            {/* PIN text input */}
            <div style={{
              marginTop: 8,
              marginBottom: 12,
              animation: shake ? 'localAccessShake 0.6s ease' : 'none',
            }}>
              <input
                ref={pinRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={handlePinChange}
                onKeyDown={handlePinKeyDown}
                placeholder="····"
                style={{
                  width: '100%',
                  height: 50,
                  background: '#0f1523',
                  border: `2px solid ${error ? '#ff4057' : '#34d7ff'}`,
                  color: error ? '#ff4057' : '#cfe8ff',
                  fontFamily: "'VT323', monospace",
                  fontSize: 34,
                  letterSpacing: '0.28em',
                  padding: '4px 12px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  boxShadow: 'inset 0 0 18px rgba(52,215,255,0.12)',
                  caretColor: '#34d7ff',
                }}
              />
              {error && (
                <div style={{
                  marginTop: 6,
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#ff4057',
                }}>
                  ACCESS DENIED
                </div>
              )}
            </div>

            {/* ACCESS ARC button */}
            <button
              onClick={handleAccess}
              disabled={pin.length < 4 || authing}
              style={{
                width: '100%',
                minHeight: 54,
                border: '2px solid #34d7ff',
                background: pin.length === 4 && !authing ? '#34d7ff' : '#0f1523',
                color: pin.length === 4 && !authing ? '#06131d' : '#2e4768',
                fontFamily: "'Oxanium', sans-serif",
                fontSize: 14,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                boxShadow: pin.length === 4 && !authing ? '4px 4px 0 #05070c' : 'none',
                cursor: pin.length === 4 && !authing ? 'pointer' : 'default',
                marginBottom: 10,
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {authing ? 'ACCESSING...' : '> ACCESS ARC'}
            </button>

            {/* Secondary actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 14 }}>
              <button
                onClick={() => router.push('/profile-select')}
                style={styles.secondaryBtn}
              >
                SWITCH PROFILE
              </button>
              <button
                onClick={() => router.push('/onboarding-new')}
                style={styles.secondaryBtn}
              >
                NEW PROFILE
              </button>
            </div>

            {/* Status line */}
            <div style={styles.statusLine}>
              <span>LOCAL ONLY</span>
              <span style={{ color: '#aaff42' }}>INDEXEDDB ACTIVE</span>
            </div>

          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <span>ARCMAKER V1</span>
        <span>NO CLOUD AUTH</span>
      </div>

      <style>{`
        @keyframes localAccessShake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-10px); }
          40%      { transform: translateX(10px); }
          60%      { transform: translateX(-7px); }
          80%      { transform: translateX(7px); }
        }
        input[type=password]::placeholder { color: #2e4768; opacity: 1; }
      `}</style>
    </div>
  );
}

// ── Scan line overlay ───────────────────────────────────────────────────────
const scanLines = (
  <div style={{
    position: 'fixed',
    inset: 0,
    background: 'repeating-linear-gradient(0deg, rgba(255,255,255,.045) 0px, rgba(255,255,255,.045) 1px, transparent 1px, transparent 5px)',
    opacity: 0.22,
    pointerEvents: 'none',
    zIndex: 0,
  }} />
);

// ── Style tokens ────────────────────────────────────────────────────────────
const styles = {
  screen: {
    minHeight: '100vh',
    background:
      'radial-gradient(circle at 20% 0%, rgba(52,215,255,.12), transparent 28%), ' +
      'linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), ' +
      'linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px), ' +
      'linear-gradient(135deg, #05070c, #080b12 60%, #0c1020)',
    backgroundSize: 'cover, 14px 14px, 14px 14px, cover',
    color: '#cfe8ff',
    fontFamily: "'Oxanium', system-ui, sans-serif",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '28px 14px',
    position: 'relative',
  },
  header: {
    border: '2px solid #34d7ff',
    background: '#0c1320',
    boxShadow: '4px 4px 0 #05070c',
    padding: '14px 12px',
    marginBottom: 28,
  },
  systemLabel: {
    fontSize: 10,
    color: '#7ea6c7',
    letterSpacing: '0.22em',
    textTransform: 'uppercase',
    fontWeight: 800,
  },
  logo: {
    fontSize: 42,
    lineHeight: 0.88,
    letterSpacing: '-0.09em',
    textTransform: 'uppercase',
    fontWeight: 800,
    color: '#cfe8ff',
    textShadow: '2px 2px 0 rgba(52,215,255,0.35)',
  },
  window: {
    position: 'relative',
    background: '#172133',
    border: '2px solid #2e4768',
    boxShadow: '4px 4px 0 #05070c',
    marginBottom: 0,
    marginTop: 14,
    width: '100%',
    boxSizing: 'border-box',
  },
  windowTab: {
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
  },
  windowInner: {
    padding: '18px 12px 13px',
  },
  fieldLabel: {
    fontSize: 10,
    letterSpacing: '0.17em',
    textTransform: 'uppercase',
    color: '#34d7ff',
    fontWeight: 800,
    marginBottom: 6,
  },
  operatorName: {
    fontSize: 34,
    lineHeight: 0.9,
    fontWeight: 800,
    textTransform: 'uppercase',
    color: '#ffffff',
  },
  operatorRole: {
    marginTop: 5,
    fontSize: 14,
    color: '#7ea6c7',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    fontWeight: 800,
  },
  subPanel: {
    marginTop: 14,
    background: '#0f1523',
    border: '1px solid #2e4768',
    padding: 10,
  },
  subPanelTitle: {
    fontSize: 13,
    textTransform: 'uppercase',
    fontWeight: 800,
    color: '#cfe8ff',
  },
  subPanelSub: {
    marginTop: 4,
    color: '#7ea6c7',
    fontSize: 12,
    lineHeight: 1.3,
  },
  secondaryBtn: {
    minHeight: 42,
    border: '2px solid #2e4768',
    background: '#24324b',
    color: '#cfe8ff',
    fontFamily: "'Oxanium', sans-serif",
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    boxShadow: '3px 3px 0 #05070c',
    cursor: 'pointer',
  },
  statusLine: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    fontSize: 10,
    color: '#7ea6c7',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontWeight: 800,
  },
  footer: {
    position: 'fixed',
    left: 14,
    right: 14,
    bottom: 14,
    zIndex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    color: 'rgba(126,166,199,0.55)',
    fontSize: 10,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontWeight: 800,
    pointerEvents: 'none',
  },
};

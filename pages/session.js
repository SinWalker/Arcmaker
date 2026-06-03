import Head from "next/head";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { getAssignments, saveSession, uid } from "@/lib/store";

function padTwo(n) { return n.toString().padStart(2,"0"); }
function formatTOD(ms) {
  const d = new Date(ms);
  const h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${padTwo(h12)}:${padTwo(m)}:${padTwo(s)} ${ampm}`;
}

const LOG_TYPES = [
  { key:"shot",  label:"🎥 Shot",      bg:"#1A3A2A" },
  { key:"note",  label:"📝 Note",      bg:"#1A1A3A" },
  { key:"char",  label:"👤 Character", bg:"#2A1A3A" },
  { key:"lead",  label:"💼 Lead",      bg:"#3A2A1A" },
];

export default function SessionPage() {
  const router = useRouter();
  const [assignment, setAssignment] = useState(null);
  const [phase, setPhase] = useState("pre"); // pre | active | done
  const [camH, setCamH] = useState("");
  const [camM, setCamM] = useState("");
  const [ampm, setAmpm] = useState("PM");
  const [sessionStart, setSessionStart] = useState(null); // { deviceTs, prodTODms }
  const [elapsed, setElapsed] = useState(0);
  const [logs, setLogs] = useState([]);
  const [showLog, setShowLog] = useState(false);
  const [logType, setLogType] = useState("shot");
  const [logText, setLogText] = useState("");
  const [sessionId] = useState(uid);
  const timerRef = useRef(null);

  useEffect(() => {
    const { id } = router.query;
    if (id) {
      const found = getAssignments().find(a => a.id === id);
      setAssignment(found || null);
    }
  }, [router.query]);

  useEffect(() => {
    if (phase === "active") {
      timerRef.current = setInterval(() => setElapsed(e => e+1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  function currentTODms() {
    if (!sessionStart) return Date.now();
    return sessionStart.prodTODms + (Date.now() - sessionStart.deviceTs);
  }

  function startSession() {
    const h = parseInt(camH, 10), m = parseInt(camM, 10);
    if (isNaN(h)||isNaN(m)||h<1||h>12||m<0||m>59) { alert("Enter a valid camera time"); return; }
    let h24 = h;
    if (ampm === "PM" && h !== 12) h24 = h+12;
    if (ampm === "AM" && h === 12) h24 = 0;
    const base = new Date(); base.setHours(h24, m, 0, 0);
    setSessionStart({ deviceTs: Date.now(), prodTODms: base.getTime() });
    setPhase("active");
  }

  function addLog() {
    if (!logText.trim()) return;
    const entry = { id: uid(), type: logType, text: logText.trim(), tod: formatTOD(currentTODms()), ts: Date.now() };
    setLogs(prev => [...prev, entry]);
    setLogText(""); setShowLog(false);
  }

  function endSession() {
    if (!confirm("End session and generate report?")) return;
    const session = {
      id: sessionId,
      assignmentId: assignment?.id,
      assignmentTitle: assignment?.title || "Untitled",
      location: assignment?.location || "",
      date: new Date().toISOString().slice(0,10),
      startTOD: sessionStart ? formatTOD(sessionStart.prodTODms) : "—",
      endTOD: formatTOD(currentTODms()),
      durationSeconds: elapsed,
      logs,
    };
    saveSession(session);
    router.push({ pathname:"/log", query:{ session: sessionId } });
  }

  function elapsedDisplay() {
    const h = Math.floor(elapsed/3600), m = Math.floor((elapsed%3600)/60), s = elapsed%60;
    return `${padTwo(h)}:${padTwo(m)}:${padTwo(s)}`;
  }

  // ── PRE ─────────────────────────────────────────────────────────────────────
  if (phase === "pre") {
    return (
      <>
        <Head><title>Field Session — Arcmaker</title><meta name="viewport" content="width=device-width,initial-scale=1" /></Head>
        <div className="page-content" style={{ paddingTop: 12 }}>
          <div style={{ fontSize:28, fontWeight:800, color:"var(--text)", marginBottom:20 }}>🎥 Field Session</div>

          {assignment && (
            <div className="card">
              <div className="card-label">Mission</div>
              <div className="card-title">{assignment.title}</div>
              {assignment.location && <div className="card-body">📍 {assignment.location}</div>}
            </div>
          )}

          <div className="card">
            <div className="card-label">Sync Camera Clock</div>
            <div className="card-body" style={{ marginBottom:14 }}>
              Look at the time on your C70 or FX30 and enter it here. Every log entry will be stamped to match.
            </div>
            <div className="clock-input-row">
              <input className="clock-input" type="number" placeholder="HH" min={1} max={12} value={camH} onChange={e => setCamH(e.target.value)} />
              <span className="clock-colon">:</span>
              <input className="clock-input" type="number" placeholder="MM" min={0} max={59} value={camM} onChange={e => setCamM(e.target.value)} />
              <button className="ampm-btn" onClick={() => setAmpm(v => v==="AM"?"PM":"AM")}>{ampm}</button>
            </div>
          </div>

          <button className="btn btn-gold" onClick={startSession}>Start Session</button>
          <button className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
        </div>
      </>
    );
  }

  // ── ACTIVE ────────────────────────────────────────────────────────────────
  return (
    <>
      <Head><title>Recording — Arcmaker</title><meta name="viewport" content="width=device-width,initial-scale=1" /></Head>

      <div className="clock-bar">
        <div>
          <div className="clock-bar-label">Production TOD</div>
          <div className="clock-bar-time" id="tod-display">{formatTOD(currentTODms())}</div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div className="clock-bar-label">Elapsed</div>
          <div className="clock-bar-time clock-bar-elapsed">{elapsedDisplay()}</div>
        </div>
      </div>

      <ClockUpdater sessionStart={sessionStart} />

      <div className="page-content" style={{ paddingTop:8 }}>
        {assignment && (
          <div className="card" style={{ marginBottom:8 }}>
            <div className="card-label">Mission</div>
            <div style={{ fontSize:15, fontWeight:700, color:"var(--text)" }}>{assignment.title}</div>
          </div>
        )}

        <div className="section-header">Log — {logs.length} entries</div>
        {logs.length === 0 && <div className="card-body" style={{ fontStyle:"italic", marginBottom:12 }}>Nothing logged yet.</div>}
        {[...logs].reverse().map(entry => {
          const t = LOG_TYPES.find(x => x.key === entry.type);
          return (
            <div key={entry.id} className="log-card">
              <div className="log-card-header">
                <span className="log-type-label">{t?.label}</span>
                <span className="log-tod">{entry.tod}</span>
              </div>
              <div className="log-text">{entry.text}</div>
            </div>
          );
        })}
      </div>

      {/* Log buttons */}
      <div className="log-btn-row">
        {LOG_TYPES.map(t => (
          <button key={t.key} className="log-quick-btn" style={{ background:t.bg }}
            onClick={() => { setLogType(t.key); setShowLog(true); }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="session-end-bar">
        <button className="btn btn-red" onClick={endSession} style={{ margin:0 }}>⏹  End Session</button>
      </div>

      {showLog && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowLog(false)}>
          <div className="modal-box">
            <div className="modal-title">{LOG_TYPES.find(t=>t.key===logType)?.label}</div>
            <div style={{ fontSize:13, color:"var(--accent-dim)", marginBottom:14 }}>TOD: {formatTOD(currentTODms())}</div>
            <textarea placeholder="What did you capture / observe / note?" value={logText} onChange={e => setLogText(e.target.value)} autoFocus style={{ minHeight:100 }} />
            <div style={{ display:"flex", gap:6, overflowX:"auto", marginBottom:10 }}>
              {LOG_TYPES.map(t => (
                <button key={t.key} className={`type-pill${logType===t.key?" active":""}`} onClick={() => setLogType(t.key)}>{t.label}</button>
              ))}
            </div>
            <button className="btn btn-gold" onClick={addLog}>Log It</button>
            <button className="btn btn-ghost" onClick={() => setShowLog(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}

// Updates the TOD display every second via direct DOM (avoids re-render cost)
function ClockUpdater({ sessionStart }) {
  useEffect(() => {
    if (!sessionStart) return;
    const iv = setInterval(() => {
      const el = document.getElementById("tod-display");
      if (el) {
        const ms = sessionStart.prodTODms + (Date.now() - sessionStart.deviceTs);
        const d = new Date(ms);
        const h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
        const ampm = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 || 12;
        el.textContent = `${padTwo(h12)}:${padTwo(m)}:${padTwo(s)} ${ampm}`;
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [sessionStart]);
  return null;
}

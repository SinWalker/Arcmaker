import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getSessions } from "@/lib/store";

function padTwo(n) { return n.toString().padStart(2,"0"); }
function fmtDuration(s) {
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  return h > 0 ? `${h}h ${padTwo(m)}m` : `${m}m ${padTwo(sec)}s`;
}

const TYPE_ICONS = { shot:"🎥", note:"📝", char:"👤", lead:"💼" };

export default function LogPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const all = getSessions().sort((a,b) => b.date.localeCompare(a.date));
    setSessions(all);
    const { session: sid } = router.query;
    if (sid) {
      const found = all.find(s => s.id === sid);
      if (found) setSelected(found);
    }
  }, [router.query]);

  if (selected) {
    return <SessionReport session={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <>
      <Head><title>Field Log — Arcmaker</title><meta name="viewport" content="width=device-width,initial-scale=1" /></Head>
      <div className="page-content" style={{ paddingTop:12 }}>
        <div style={{ fontSize:26, fontWeight:800, color:"var(--text)", marginBottom:16 }}>Field Log</div>
        {sessions.length === 0 && (
          <div className="empty-state">
            <span className="emoji">📋</span>
            <p>No sessions yet. Go shoot something.</p>
          </div>
        )}
        {sessions.map(s => {
          const shots = s.logs.filter(l => l.type==="shot").length;
          const chars = s.logs.filter(l => l.type==="char").length;
          return (
            <div key={s.id} className="card session-card" onClick={() => setSelected(s)}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
                <div style={{ flex:1 }}>
                  <div className="card-label">{s.date}</div>
                  <div className="card-title">{s.assignmentTitle}</div>
                  {s.location && <div className="card-body">📍 {s.location}</div>}
                </div>
                <span style={{ fontSize:22, color:"var(--text-muted)" }}>›</span>
              </div>
              <div className="stat-chips">
                <span className="stat-chip">{s.logs.length} logs</span>
                <span className="stat-chip">{shots} shots</span>
                <span className="stat-chip">{chars} chars</span>
                {s.durationSeconds > 0 && <span className="stat-chip">{fmtDuration(s.durationSeconds)}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function SessionReport({ session, onBack }) {
  const byType = t => session.logs.filter(l => l.type === t);
  const shots = byType("shot"), notes = byType("note"), chars = byType("char"), leads = byType("lead");

  return (
    <>
      <Head><title>Session Report — Arcmaker</title><meta name="viewport" content="width=device-width,initial-scale=1" /></Head>
      <div className="report-header">
        <button className="back-btn" onClick={onBack}>‹ Back</button>
        <span style={{ fontSize:16, fontWeight:700, color:"var(--text)" }}>Session Report</span>
        <span style={{ width:60 }} />
      </div>
      <div className="page-content" style={{ paddingTop:12 }}>
        {/* Summary */}
        <div className="card">
          <div style={{ fontSize:20, fontWeight:800, color:"var(--text)", marginBottom:4 }}>{session.assignmentTitle}</div>
          {session.location && <div className="card-body">📍 {session.location}</div>}
          <div className="card-body" style={{ marginTop:4 }}>{session.date}  ·  {session.startTOD} – {session.endTOD}</div>
          {session.durationSeconds > 0 && (
            <div className="card-body" style={{ color:"var(--accent)" }}>
              Duration: {padTwo(Math.floor(session.durationSeconds/3600))}:{padTwo(Math.floor((session.durationSeconds%3600)/60))}:{padTwo(session.durationSeconds%60)}
            </div>
          )}
          <div className="stat-blocks">
            <StatBlock n={shots.length} label="Shots" />
            <StatBlock n={notes.length} label="Notes" />
            <StatBlock n={chars.length} label="Characters" />
            <StatBlock n={leads.length} label="Leads" />
          </div>
        </div>

        {shots.length > 0 && <LogSection title="🎥 Shots Captured" entries={shots} />}
        {chars.length > 0 && <LogSection title="👤 Characters Found" entries={chars} />}
        {leads.length > 0 && <LogSection title="💼 Business Leads" entries={leads} />}
        {notes.length > 0 && <LogSection title="📝 Notes" entries={notes} />}

        <div className="section-header">Full Chronological Log</div>
        {session.logs.map((l, i) => (
          <div key={l.id||i} className="chrono-row">
            <span className="chrono-tod">{l.tod}</span>
            <span className="chrono-icon">{TYPE_ICONS[l.type]||"•"}</span>
            <span className="chrono-text">{l.text}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function LogSection({ title, entries }) {
  return (
    <div className="card">
      <div className="card-label">{title}</div>
      {entries.map((e,i) => (
        <div key={e.id||i} className="log-entry">
          <div className="log-entry-tod">{e.tod}</div>
          <div className="log-entry-text">{e.text}</div>
        </div>
      ))}
    </div>
  );
}

function StatBlock({ n, label }) {
  return (
    <div className="stat-block">
      <div className="n">{n}</div>
      <div className="lbl">{label}</div>
    </div>
  );
}

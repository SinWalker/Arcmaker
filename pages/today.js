import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getAssignments, saveAssignment, uid } from "@/lib/store";

function fmt(d) { return d.toISOString().slice(0, 10); }

export default function TodayPage() {
  const router = useRouter();
  const [assignment, setAssignment] = useState(null);
  const [allToday, setAllToday] = useState([]);
  const [showShotModal, setShowShotModal] = useState(false);
  const [showCharModal, setShowCharModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [newShot, setNewShot] = useState("");
  const [newChar, setNewChar] = useState("");
  const [newLead, setNewLead] = useState("");

  useEffect(() => {
    const all = getAssignments();
    const todayStr = fmt(new Date());
    const todayA = all.filter(a => a.date === todayStr);
    setAllToday(todayA);
    const { id } = router.query;
    if (id) {
      const found = all.find(a => a.id === id);
      setAssignment(found || todayA[0] || null);
    } else {
      setAssignment(todayA[0] || null);
    }
  }, [router.query]);

  function refreshAssignment(updated) {
    saveAssignment(updated);
    setAssignment(updated);
    setAllToday(prev => prev.map(a => a.id === updated.id ? updated : a));
  }

  function addShot() {
    if (!newShot.trim() || !assignment) return;
    refreshAssignment({ ...assignment, shots: [...(assignment.shots||[]), newShot.trim()] });
    setNewShot(""); setShowShotModal(false);
  }

  function addChar() {
    if (!newChar.trim() || !assignment) return;
    refreshAssignment({ ...assignment, characters: [...(assignment.characters||[]), newChar.trim()] });
    setNewChar(""); setShowCharModal(false);
  }

  function addLead() {
    if (!newLead.trim() || !assignment) return;
    refreshAssignment({ ...assignment, businessLeads: [...(assignment.businessLeads||[]), newLead.trim()] });
    setNewLead(""); setShowLeadModal(false);
  }

  function toggleShot(idx) {
    if (!assignment) return;
    const shots = [...(assignment.shots||[])];
    shots[idx] = shots[idx].startsWith("✓ ") ? shots[idx].slice(2) : "✓ " + shots[idx];
    refreshAssignment({ ...assignment, shots });
  }

  if (!assignment) {
    return (
      <>
        <Head><title>Today — Arcmaker</title><meta name="viewport" content="width=device-width,initial-scale=1" /></Head>
        <div className="page-content empty-state">
          <span className="emoji">📋</span>
          <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>No mission today</p>
          <p>Head to the Mission Board to add today&apos;s assignment.</p>
          <button className="btn btn-gold" style={{ marginTop: 24 }} onClick={() => router.push("/calendar")}>
            Go to Mission Board
          </button>
        </div>
      </>
    );
  }

  const shots = assignment.shots || [];
  const shotsDone = shots.filter(s => s.startsWith("✓ ")).length;

  return (
    <>
      <Head><title>Today — Arcmaker</title><meta name="viewport" content="width=device-width,initial-scale=1" /></Head>
      <div className="page-content">

        {/* Mission header */}
        <div style={{ marginBottom: 16, paddingTop: 8 }}>
          <div className="card-label">Today&apos;s Mission</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>{assignment.title}</div>
          {assignment.location && <div style={{ fontSize: 14, color: "var(--text-dim)" }}>📍 {assignment.location}</div>}
        </div>

        {/* Story */}
        {assignment.story && (
          <div className="card">
            <div className="card-label">Story Question</div>
            <div style={{ fontSize: 15, fontStyle: "italic", color: "var(--text)", lineHeight: 1.5 }}>"{assignment.story}"</div>
          </div>
        )}

        {/* Shot list */}
        <div className="card">
          <div className="row" style={{ marginBottom: 8 }}>
            <span className="card-label" style={{ flex: 1, marginBottom: 0 }}>
              Shot List {shots.length > 0 ? `${shotsDone}/${shots.length}` : ""}
            </span>
            <button onClick={() => setShowShotModal(true)} style={{ background:"none",border:"none",color:"var(--accent)",fontSize:13,fontWeight:700,cursor:"pointer" }}>+ Add</button>
          </div>
          {shots.length === 0 && <div className="card-body">No shots yet</div>}
          {shots.map((shot, i) => (
            <div key={i} className="shot-row" onClick={() => toggleShot(i)}>
              <span className="shot-check">{shot.startsWith("✓ ") ? "☑" : "☐"}</span>
              <span className={`shot-text${shot.startsWith("✓ ") ? " done" : ""}`}>
                {shot.startsWith("✓ ") ? shot.slice(2) : shot}
              </span>
            </div>
          ))}
        </div>

        {/* Characters */}
        <div className="card">
          <div className="row" style={{ marginBottom: 8 }}>
            <span className="card-label" style={{ flex:1, marginBottom:0 }}>Characters to Hunt</span>
            <button onClick={() => setShowCharModal(true)} style={{ background:"none",border:"none",color:"var(--accent)",fontSize:13,fontWeight:700,cursor:"pointer" }}>+ Add</button>
          </div>
          {(assignment.characters||[]).length === 0 && <div className="card-body">No targets yet</div>}
          {(assignment.characters||[]).map((c,i) => (
            <div key={i} style={{ display:"flex",gap:8,padding:"6px 0",borderBottom:"1px solid var(--border)" }}>
              <span>👤</span><span className="card-body">{c}</span>
            </div>
          ))}
        </div>

        {/* Business Leads */}
        <div className="card">
          <div className="row" style={{ marginBottom: 8 }}>
            <span className="card-label" style={{ flex:1, marginBottom:0 }}>Business Leads</span>
            <button onClick={() => setShowLeadModal(true)} style={{ background:"none",border:"none",color:"var(--accent)",fontSize:13,fontWeight:700,cursor:"pointer" }}>+ Add</button>
          </div>
          {(assignment.businessLeads||[]).length === 0 && <div className="card-body">None yet</div>}
          {(assignment.businessLeads||[]).map((b,i) => (
            <div key={i} style={{ display:"flex",gap:8,padding:"6px 0",borderBottom:"1px solid var(--border)" }}>
              <span>💼</span><span className="card-body">{b}</span>
            </div>
          ))}
        </div>

        {/* Start session */}
        <button className="btn btn-gold" onClick={() => router.push({ pathname:"/session", query:{ id: assignment.id } })}>
          🎥  Start Field Session
        </button>

        {/* Switch missions */}
        {allToday.length > 1 && (
          <>
            <div className="section-header">Other Today Missions</div>
            {allToday.filter(a => a.id !== assignment.id).map(a => (
              <div key={a.id} className="card" style={{ cursor:"pointer" }} onClick={() => setAssignment(a)}>
                <div className="card-title">{a.title}</div>
                {a.location && <div className="card-body">📍 {a.location}</div>}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Modals */}
      {showShotModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowShotModal(false)}>
          <div className="modal-box">
            <div className="modal-title">Add Shot</div>
            <textarea placeholder="Describe the shot..." value={newShot} onChange={e => setNewShot(e.target.value)} autoFocus />
            <button className="btn btn-gold" onClick={addShot}>Add Shot</button>
            <button className="btn btn-ghost" onClick={() => setShowShotModal(false)}>Cancel</button>
          </div>
        </div>
      )}
      {showCharModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowCharModal(false)}>
          <div className="modal-box">
            <div className="modal-title">Add Character Target</div>
            <input placeholder="e.g. Food vendor owner" value={newChar} onChange={e => setNewChar(e.target.value)} autoFocus />
            <button className="btn btn-gold" onClick={addChar}>Add Character</button>
            <button className="btn btn-ghost" onClick={() => setShowCharModal(false)}>Cancel</button>
          </div>
        </div>
      )}
      {showLeadModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowLeadModal(false)}>
          <div className="modal-box">
            <div className="modal-title">Add Business Lead</div>
            <input placeholder="e.g. Merch booth operator" value={newLead} onChange={e => setNewLead(e.target.value)} autoFocus />
            <button className="btn btn-gold" onClick={addLead}>Add Lead</button>
            <button className="btn btn-ghost" onClick={() => setShowLeadModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}

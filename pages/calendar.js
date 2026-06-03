import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getAssignments, saveAssignment, deleteAssignment, uid } from "@/lib/store";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function weekDates(pivot) {
  const d = new Date(pivot);
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(start);
    x.setDate(start.getDate() + i);
    return x;
  });
}

function fmt(d) { return d.toISOString().slice(0, 10); }

export default function CalendarPage() {
  const router = useRouter();
  const [pivot, setPivot] = useState(new Date());
  const [assignments, setAssignments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [targetDate, setTargetDate] = useState("");
  const [form, setForm] = useState({ title: "", location: "", story: "" });

  useEffect(() => { setAssignments(getAssignments()); }, []);

  const week = weekDates(pivot);
  const todayStr = fmt(new Date());

  function prevWeek() { const d = new Date(pivot); d.setDate(d.getDate()-7); setPivot(d); }
  function nextWeek() { const d = new Date(pivot); d.setDate(d.getDate()+7); setPivot(d); }

  function openNew(ds) { setTargetDate(ds); setForm({ title:"", location:"", story:"" }); setShowModal(true); }

  function handleSave() {
    if (!form.title.trim()) return;
    const a = { id: uid(), date: targetDate, title: form.title.trim(), location: form.location.trim(), story: form.story.trim(), shots: [], characters: [], businessLeads: [] };
    saveAssignment(a);
    setAssignments(getAssignments());
    setShowModal(false);
  }

  function handleDelete(id) {
    if (!confirm("Delete this mission?")) return;
    deleteAssignment(id);
    setAssignments(getAssignments());
  }

  function openMission(a) {
    router.push({ pathname: "/today", query: { id: a.id } });
  }

  return (
    <>
      <Head><title>Mission Board — Arcmaker</title><meta name="viewport" content="width=device-width,initial-scale=1" /></Head>

      <div className="week-nav">
        <button className="nav-arrow" onClick={prevWeek}>‹</button>
        <span className="week-label">
          {MONTHS[week[0].getMonth()]} {week[0].getDate()} – {MONTHS[week[6].getMonth()]} {week[6].getDate()}, {week[0].getFullYear()}
        </span>
        <button className="nav-arrow" onClick={nextWeek}>›</button>
      </div>

      <div className="page-content" style={{ paddingTop: 8 }}>
        {week.map((day) => {
          const ds = fmt(day);
          const isToday = ds === todayStr;
          const dayA = assignments.filter(a => a.date === ds);
          return (
            <div key={ds} className={`day-block${isToday ? " today" : ""}`}>
              <div className="day-header">
                <span className={`day-label${isToday ? " today" : ""}`}>
                  {DAYS[day.getDay()]}  {MONTHS[day.getMonth()]} {day.getDate()}
                  {isToday ? "  ● TODAY" : ""}
                </span>
                <button className="add-mission-btn" onClick={() => openNew(ds)}>+ Mission</button>
              </div>
              {dayA.length === 0 && <div className="no-missions">No missions</div>}
              {dayA.map(a => (
                <div key={a.id} className="assign-card" onClick={() => openMission(a)} onContextMenu={e => { e.preventDefault(); handleDelete(a.id); }}>
                  <div className="assign-card-title">{a.title}</div>
                  {a.location && <div className="assign-card-sub">📍 {a.location}</div>}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box">
            <div className="modal-title">New Mission</div>
            <label className="card-label">Title</label>
            <input placeholder="e.g. Fair Park Recon" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} autoFocus />
            <label className="card-label">Location</label>
            <input placeholder="e.g. Fair Park, Dallas" value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} />
            <label className="card-label">Story Question</label>
            <textarea placeholder="What are you trying to answer?" value={form.story} onChange={e => setForm(f => ({...f, story: e.target.value}))} />
            <button className="btn btn-gold" onClick={handleSave}>Save Mission</button>
            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}

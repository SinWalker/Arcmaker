import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AppLayout from '../layout/AppLayout';
import { getActiveCampaign } from '../../lib/campaign';
import { getAssignmentsForCampaign, createAssignment } from '../../lib/assignment';

function isoWeek(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-W${String(getWeekNumber(d)).padStart(2, '0')}`;
}

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  return d;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toYMD(date) {
  return date.toISOString().slice(0, 10);
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_COLOR = {
  draft: '#444',
  active: '#27AE60',
  complete: '#C9A84C',
};

export default function CalendarUI() {
  const router = useRouter();
  const today = toYMD(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [campaign, setCampaign] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [modal, setModal] = useState(null); // { date } | null
  const [form, setForm] = useState({ title: '', location: '', storyQuestion: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const c = await getActiveCampaign();
      setCampaign(c);
      if (c) {
        const all = await getAssignmentsForCampaign(c.id);
        setAssignments(all);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleCreateAssignment() {
    if (!form.title.trim() || !campaign || !modal) return;
    setSaving(true);
    const a = await createAssignment(campaign.id, {
      title: form.title.trim(),
      date: modal.date,
      location: form.location.trim() || undefined,
      storyQuestion: form.storyQuestion.trim() || undefined,
    });
    setAssignments(prev => [...prev, a]);
    setModal(null);
    setForm({ title: '', location: '', storyQuestion: '' });
    setSaving(false);
  }

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekLabel = `${days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  if (loading) return <AppLayout title="Mission Board"><div style={{ color: '#888', padding: 40, textAlign: 'center' }}>Loading...</div></AppLayout>;

  return (
    <AppLayout title="Mission Board">
      {/* Week nav */}
      <div className="week-nav" style={{ borderRadius: 10, marginBottom: 14 }}>
        <button className="nav-arrow" onClick={() => setWeekStart(prev => addDays(prev, -7))}>‹</button>
        <span className="week-label">{weekLabel}</span>
        <button className="nav-arrow" onClick={() => setWeekStart(prev => addDays(prev, 7))}>›</button>
      </div>

      {/* Today shortcut */}
      {toYMD(weekStart) !== toYMD(startOfWeek(new Date())) && (
        <button className="btn btn-ghost" style={{ marginBottom: 12 }} onClick={() => setWeekStart(startOfWeek(new Date()))}>
          Jump to Today
        </button>
      )}

      {/* Day blocks */}
      {days.map(day => {
        const ymd = toYMD(day);
        const isToday = ymd === today;
        const dayAssignments = assignments.filter(a => a.date === ymd);

        return (
          <div key={ymd} className={`day-block${isToday ? ' today' : ''}`}>
            <div className="day-header">
              <span className={`day-label${isToday ? ' today' : ''}`}>
                {DAY_NAMES[day.getDay()]} · {day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {isToday ? ' · TODAY' : ''}
              </span>
              {campaign && (
                <button className="add-mission-btn" onClick={() => setModal({ date: ymd })}>+ Mission</button>
              )}
            </div>

            {dayAssignments.length === 0 ? (
              <div className="no-missions">No missions</div>
            ) : (
              dayAssignments.map(a => (
                <div
                  key={a.id}
                  className="assign-card"
                  onClick={() => router.push(`/sessions/new?assignmentId=${a.id}&date=${ymd}`)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[a.status] || '#444', flexShrink: 0, display: 'inline-block' }} />
                    <span className="assign-card-title">{a.title}</span>
                  </div>
                  {a.location && <div className="assign-card-sub">📍 {a.location}</div>}
                  {a.storyQuestion && <div className="assign-card-sub" style={{ fontStyle: 'italic' }}>"{a.storyQuestion}"</div>}
                </div>
              ))
            )}
          </div>
        );
      })}

      {/* Create Assignment Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              New Mission — {new Date(modal.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <input
              placeholder="Mission title (e.g. Deep Ellum — fan arrival)"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              autoFocus
            />
            <input
              placeholder="Location (optional)"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
            />
            <input
              placeholder="Story question for this day (optional)"
              value={form.storyQuestion}
              onChange={e => setForm(f => ({ ...f, storyQuestion: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleCreateAssignment()}
            />
            <button className="btn btn-gold" onClick={handleCreateAssignment} disabled={saving}>
              {saving ? 'Saving...' : 'Create Mission'}
            </button>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

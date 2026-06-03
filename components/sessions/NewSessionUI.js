import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AppLayout from '../layout/AppLayout';
import { getActiveCampaign } from '../../lib/campaign';
import { getAssignmentsForCampaign } from '../../lib/assignment';
import { createSession } from '../../lib/session';

export default function NewSessionUI() {
  const router = useRouter();
  const { assignmentId: queryAssignmentId } = router.query;

  const [campaign, setCampaign] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [form, setForm] = useState({ title: '', location: '', assignmentId: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const c = await getActiveCampaign();
      setCampaign(c);
      if (c) {
        const all = await getAssignmentsForCampaign(c.id);
        setAssignments(all);
        // Pre-select if passed via query
        if (queryAssignmentId) {
          const match = all.find(a => a.id === queryAssignmentId);
          if (match) setForm(f => ({ ...f, assignmentId: match.id, title: match.title }));
        }
      }
      setLoading(false);
    }
    if (router.isReady) load();
  }, [router.isReady, queryAssignmentId]);

  async function handleStart() {
    if (!form.title.trim() || !campaign) return;
    setSaving(true);
    // Use selected assignment or create an implicit "Unplanned" link
    // For V1: assignmentId is required by type — use selected or empty string
    const assignId = form.assignmentId || 'unplanned';
    const session = await createSession(campaign.id, assignId, form.title.trim(), form.location.trim() || undefined);
    router.push(`/sessions/${session.id}`);
  }

  if (loading) return <AppLayout title="New Session"><div style={{ color: '#888', padding: 40, textAlign: 'center' }}>Loading...</div></AppLayout>;

  return (
    <AppLayout title="New Session">
      <div className="card-label" style={{ marginBottom: 6 }}>Session Title</div>
      <input
        placeholder="e.g. Deep Ellum — Fan Arrival Day"
        value={form.title}
        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        autoFocus
      />

      <div className="card-label" style={{ marginBottom: 6 }}>Location</div>
      <input
        placeholder="e.g. Deep Ellum, Dallas"
        value={form.location}
        onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
      />

      {assignments.length > 0 && (
        <>
          <div className="card-label" style={{ marginBottom: 6 }}>Link to Mission (optional)</div>
          <select
            value={form.assignmentId}
            onChange={e => setForm(f => ({ ...f, assignmentId: e.target.value }))}
            style={{ width: '100%', background: '#111', border: '1px solid #2A2A2A', borderRadius: 8, padding: 12, color: form.assignmentId ? '#F0F0F0' : '#444', fontSize: 14, marginBottom: 10 }}
          >
            <option value="">— No mission linked —</option>
            {assignments.map(a => (
              <option key={a.id} value={a.id}>{a.date} · {a.title}</option>
            ))}
          </select>
        </>
      )}

      <button className="btn btn-gold" onClick={handleStart} disabled={saving || !form.title.trim()}>
        {saving ? 'Starting...' : '🎬 Start Session'}
      </button>
      <button className="btn btn-ghost" onClick={() => router.back()}>Cancel</button>
    </AppLayout>
  );
}

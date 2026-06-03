import { useState, useEffect } from 'react';
import AppLayout from '../layout/AppLayout';
import { getActiveCampaign } from '../../lib/campaign';
import { getDB } from '../../lib/db/db';

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

function formatLogDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function formatLogTime(todString) {
  // "07:42:18 PM" → "07:42"
  if (!todString) return null;
  return todString.replace(/ (AM|PM)$/, '').slice(0, 5);
}

const FILTERS = ['ALL', 'SESSIONS', 'CHARACTERS', 'LEADS', 'SHOTS', 'NOTES'];

export default function LogUI() {
  const [campaign, setCampaign] = useState(null);
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const c = await getActiveCampaign();
      setCampaign(c);
      if (c) {
        await loadEntries(c.id);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function loadEntries(campaignId) {
    const db = getDB();
    const [sessions, characters, leads, shots, notes, reports] = await Promise.all([
      db.sessions.where('campaignId').equals(campaignId).sortBy('createdAt'),
      db.characters.where('campaignId').equals(campaignId).sortBy('createdAt'),
      db.businessLeads.where('campaignId').equals(campaignId).sortBy('createdAt'),
      db.capturedShots.where('campaignId').equals(campaignId).sortBy('createdAt'),
      db.fieldNotes.where('campaignId').equals(campaignId).sortBy('createdAt'),
      db.sessionReports.where('campaignId').equals(campaignId).sortBy('generatedAt'),
    ]);

    const all = [
      ...sessions.map(s => ({
        filterKey: 'SESSIONS',
        type: s.status === 'completed' ? 'SESSION CLOSED' : 'SESSION ACTIVE',
        text: s.title,
        date: s.createdAt,
        time: null,
        ts: new Date(s.createdAt).getTime(),
      })),
      ...characters.map(c => ({
        filterKey: 'CHARACTERS',
        type: 'CHARACTER',
        text: c.name + (c.description ? ` — ${c.description}` : ''),
        date: c.createdAt,
        time: null,
        ts: new Date(c.createdAt).getTime(),
      })),
      ...leads.map(l => ({
        filterKey: 'LEADS',
        type: 'LEAD',
        text: l.name + (l.notes ? ` — ${l.notes}` : ''),
        date: l.createdAt,
        time: null,
        ts: new Date(l.createdAt).getTime(),
      })),
      ...shots.map(s => ({
        filterKey: 'SHOTS',
        type: 'SHOT',
        text: s.description,
        date: s.createdAt,
        time: s.tod ? formatLogTime(s.tod) : null,
        ts: new Date(s.createdAt).getTime(),
      })),
      ...notes.map(n => ({
        filterKey: 'NOTES',
        type: n.type?.toUpperCase() || 'NOTE',
        text: n.text,
        date: n.createdAt,
        time: n.tod ? formatLogTime(n.tod) : null,
        ts: new Date(n.createdAt).getTime(),
      })),
      ...reports.map(r => ({
        filterKey: 'SESSIONS',
        type: 'REPORT',
        text: r.summary || 'Session report generated',
        date: r.generatedAt,
        time: null,
        ts: new Date(r.generatedAt).getTime(),
      })),
    ].sort((a, b) => b.ts - a.ts);

    setEntries(all);
  }

  const visible = filter === 'ALL'
    ? entries
    : entries.filter(e => e.filterKey === filter);

  if (loading) return (
    <AppLayout sysLabel="CAMPAIGN MEMORY" pageTitle="LOG">
      <div style={{ color: 'var(--muted)', fontSize: 13, padding: '20px 0' }}>LOADING...</div>
    </AppLayout>
  );

  return (
    <AppLayout sysLabel="CAMPAIGN MEMORY" pageTitle="LOG">

      {/* Campaign name */}
      {campaign && (
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>
          {campaign.title}
        </div>
      )}

      {/* FILTERS window */}
      <div className="window">
        <div className="window-title-tab">FILTERS</div>
        <div className="window-inner">
          <div className="filter-row">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={filter === f ? 'chip' : 'chip ghost'}
                style={{ cursor: 'pointer', border: 'none', marginTop: 0 }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CHRONOLOGICAL LOG window */}
      <div className="window">
        <div className="window-title-tab">CHRONOLOGICAL LOG</div>
        <div className="window-inner">
          {visible.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div className="empty-label">NO ENTRIES</div>
              <div className="empty-copy">
                {filter === 'ALL'
                  ? 'No campaign memory yet. Run a field session.'
                  : `No ${filter.toLowerCase()} logged yet.`}
              </div>
            </div>
          ) : (
            visible.map((entry, i) => (
              <div key={i} className="log-item">
                <div className="log-time">
                  {entry.time || formatLogDate(entry.date)}
                </div>
                <div>
                  <div className="log-type">{entry.type}</div>
                  <div className="log-copy">{entry.text}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </AppLayout>
  );
}

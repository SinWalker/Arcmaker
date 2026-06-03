import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AppLayout from '../layout/AppLayout';
import { getAllCampaigns, getActiveCampaign } from '../../lib/campaign';
import { getAssignmentsForCampaign } from '../../lib/assignment';

// Returns the next upcoming assignment title for a campaign
async function getNextMission(campaignId) {
  const today = new Date().toISOString().slice(0, 10);
  const all = await getAssignmentsForCampaign(campaignId);
  const upcoming = all.filter(a => a.date >= today && a.status !== 'complete');
  if (upcoming.length === 0) return null;
  return upcoming[0].missionTitle || upcoming[0].title || null;
}

export default function ArcUI() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [nextMissions, setNextMissions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [all, active] = await Promise.all([getAllCampaigns(), getActiveCampaign()]);
      setCampaigns(all);
      setActiveCampaign(active);

      // Load next missions for each campaign
      const missions = {};
      await Promise.all(all.map(async (c) => {
        missions[c.id] = await getNextMission(c.id);
      }));
      setNextMissions(missions);
      setLoading(false);
    }
    load();
  }, []);

  const STATUS_LABEL = { active: 'ACTIVE', archived: 'ARCHIVED', template: 'TEMPLATE' };

  const activeArcs = campaigns.filter(c => c.status === 'active');
  const otherArcs = campaigns.filter(c => c.status !== 'active');

  if (loading) return (
    <AppLayout sysLabel="STORY OPERATIONS SYSTEM" pageTitle="ARCMAKER">
      <div style={{ color: 'var(--muted)', fontSize: 13, padding: '20px 0' }}>LOADING...</div>
    </AppLayout>
  );

  return (
    <AppLayout sysLabel="STORY OPERATIONS SYSTEM" pageTitle="ARCMAKER">

      {/* ARC SELECT window */}
      <div className="window">
        <div className="window-title-tab">ARC SELECT</div>
        <div className="window-inner">

          {/* Active arcs */}
          {activeArcs.map(c => (
            <div
              key={c.id}
              className="arc-slot active"
              onClick={() => router.push('/ops')}
            >
              <div className="field-label">ACTIVE ARC</div>
              <div className="win-title">{c.title.toUpperCase()}</div>
              {nextMissions[c.id] && (
                <div className="copy-text">
                  Next Mission: {nextMissions[c.id]}
                </div>
              )}
              <span className="chip">OPEN ARC</span>
            </div>
          ))}

          {/* No active arc state */}
          {activeArcs.length === 0 && (
            <div className="arc-slot">
              <div className="field-label">NO ACTIVE ARC</div>
              <div className="copy-text">Create or activate an arc below.</div>
            </div>
          )}

          {/* Other arcs */}
          {otherArcs.map(c => (
            <div
              key={c.id}
              className="arc-slot"
              onClick={() => router.push('/ops')}
            >
              <div className="win-title">{c.title.toUpperCase()}</div>
              <div className="copy-text">Status: {STATUS_LABEL[c.status]}</div>
            </div>
          ))}

          {/* New Arc slot — coming soon */}
          <div
            className="arc-slot"
            onClick={() => {}}
            style={{ opacity: 0.55, cursor: 'default' }}
          >
            <div className="win-title">+ NEW ARC</div>
            <div className="copy-text">Create blank arc or import campaign brief.</div>
            <span className="coming-soon-badge">COMING SOON</span>
          </div>

        </div>
      </div>

    </AppLayout>
  );
}

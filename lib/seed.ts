// ─── ArcMaker Full Seed ───────────────────────────────────────────────────────
// Source of truth: D3_Weekly_Assignment_Desk.js + ARCMAKER_V1_REQUIREMENTS.md
// This is NOT test data. This is Sin's live production campaign.
// SSR RULE: Only call from browser context.

import { getDB } from './db/db';
import type { Campaign, UserProfile, Assignment } from './db/types';

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
function now(): string { return new Date().toISOString(); }

// ─── SIN PROFILE SEED ────────────────────────────────────────────────────────

export async function ensureSinProfile(): Promise<UserProfile> {
  const db = getDB();
  const ts = now();

  // Find existing Sin profile
  const all = await db.userProfiles.toArray();
  const existing = all.find(p =>
    p.displayName === 'Sin' || (p.pin === '1234' && p.role === 'Director')
  );

  if (existing) {
    // Patch missing fields
    const patch: Partial<UserProfile> = {};
    if (!existing.role) patch.role = 'Director';
    if (!existing.pin) patch.pin = '1234';
    if (Object.keys(patch).length > 0) {
      patch.updatedAt = ts;
      await db.userProfiles.update(existing.id, patch);
    }
    return { ...existing, ...patch };
  }

  // Deactivate all existing profiles
  await db.userProfiles.toCollection().modify({ isActive: false });

  const profile: UserProfile = {
    id: uuid(),
    displayName: 'Sin',
    role: 'Director',
    pin: '1234',
    isActive: false, // PIN screen activates it
    createdAt: ts,
    updatedAt: ts,
  };
  await db.userProfiles.add(profile);
  return profile;
}

// ─── CAMPAIGN SEED ───────────────────────────────────────────────────────────

export function buildWorldCupSeedCampaign(profileId: string): Campaign {
  const ts = now();
  return {
    id: uuid(),
    title: 'The Sin Cut — World Cup Arc',
    status: 'active',
    description: 'A documentary/event coverage campaign documenting Dallas during the 2026 FIFA World Cup.',
    mission: 'Document what happens when Dallas becomes one of the most important cities in the world for a month.',
    storyQuestion: 'What does Dallas become when the world arrives?',
    theme: 'City transformation, identity, commerce, community',
    successCriteria: [
      'At least 6 field sessions logged with full Production TOD',
      'At least 20 characters captured across the campaign',
      'At least 10 business leads documented',
      'At least one session report per shooting day',
      'Campaign exported as JSON backup at least weekly',
    ].join('\n'),
    targetCharacterTypes: [
      'Local business owners adapting to World Cup traffic',
      'International fans experiencing Dallas for the first time',
      'Dallas locals whose daily life has been disrupted or transformed',
      'Workers and vendors behind the scenes',
      'Creators and artists riding the cultural moment',
    ],
    primaryLocations: [
      'Fair Park / FIFA Fan Festival',
      'Deep Ellum',
      'AT&T Discovery District',
      'AT&T Stadium (exterior — no match tickets)',
      'Texas Live! (Arlington)',
    ],
    startDate: '2026-06-01',
    endDate: '2026-07-19',
    source: 'manual',
    isSeedCampaign: true,
    createdByProfileId: profileId,
    userId: undefined,
    createdAt: ts,
    updatedAt: ts,
  };
}

// ─── ASSIGNMENT SEED DATA ────────────────────────────────────────────────────

function buildAssignment(
  campaignId: string,
  profileId: string,
  data: Omit<Assignment, 'id' | 'campaignId' | 'source' | 'createdAt' | 'updatedAt' | 'createdByProfileId'>
): Assignment {
  const ts = now();
  return {
    id: uuid(),
    campaignId,
    source: 'manual',
    createdAt: ts,
    updatedAt: ts,
    createdByProfileId: profileId,
    ...data,
  };
}

export function buildWorldCupAssignments(campaignId: string, profileId: string): Assignment[] {
  return [

    // ── WEEK 0: PRE-ARC SETUP ─────────────────────────────────────────────
    buildAssignment(campaignId, profileId, {
      title: 'Fair Park + Deep Ellum Soft Scout',
      missionTitle: 'Setup Week — Build the System',
      date: '2026-06-06',
      status: 'draft',
      dayType: 'scout',
      weekNumber: 0,
      primaryLocation: 'Fair Park exterior',
      backupLocation: 'Deep Ellum murals and empty streets',
      objective: 'The system is built before the arc opens. Gear is ready. Outreach is sent. Shot lists are written.',
      storyQuestion: 'Is everything in place to execute at full capacity when the World Cup begins?',
      requiredShots: [
        'Fair Park exterior architecture (scout framing only)',
        'Deep Ellum mural walls and empty streets',
        'Creator intro for the arc — record even if not used in Episode 1',
        'One clean cityscape shot of Dallas skyline at dusk',
      ],
      targetCharacters: [
        'None yet — research Fair Park volunteer coordinator contacts online',
        'Note: DM any Deep Ellum bar accounts for access conversation',
      ],
      businessOpportunities: [
        'DM 2–3 Fair Park-adjacent bars/restaurants to introduce project',
        'DM 1–2 hotels near Fair Park about a potential guest-experience story',
      ],
      contentDeliverables: [
        'Optional: 30-sec "The City Is Getting Ready" teaser using scout footage',
        'Optional pre-arc teaser reel if scout footage is usable',
      ],
      successConditions: [
        'All gear charged, formatted, tested',
        'Project folder structure built in editing software',
        '3 business DMs sent',
        'Fair Park route mapped',
        'Week 1 assignment written in one sentence',
      ],
    }),

    // ── WEEK 1: DALLAS WAKES UP ──────────────────────────────────────────
    buildAssignment(campaignId, profileId, {
      title: 'Fair Park FIFA Fan Festival — Day 1',
      missionTitle: 'Dallas Wakes Up',
      date: '2026-06-13',
      status: 'draft',
      dayType: 'shoot',
      weekNumber: 1,
      primaryLocation: 'Fair Park FIFA Fan Festival — daytime coverage',
      backupLocation: 'Deep Ellum — if evening energy warrants it',
      objective: 'The Fair Park FIFA Fan Festival activates and the city begins to feel different. Document the first evidence of transformation — flags, languages, vendors, early fans.',
      storyQuestion: 'What does Dallas look and sound like in the first days of the World Cup?',
      requiredShots: [
        'Creator opening A-roll: walking into Fair Park for the first time with the city transformed',
        'Wide shot: crowd at maximum festival density from elevated or distance vantage',
        'International flags in motion — not static, let them move in wind or crowd',
        'First vendor open for business — morning setup sequence',
        'One micro-interview: traveling fan with a strong reason for being in Dallas',
        'Clean ambient sound bed: crowd noise + music + announcements',
        'Creator closing reflection outside the festival at dusk',
      ],
      targetCharacters: [
        'Fair Park volunteer — anyone wearing event staff credentials',
        'First traveling fan encounter — look for international flags',
        'Vendor or food stall operator inside or near the festival',
      ],
      businessOpportunities: [
        'Fair Park-adjacent restaurant: offer coverage in exchange for access',
        'Any popup vendor: capture setup as both editorial and proof-of-work footage',
      ],
      contentDeliverables: [
        'Short 1: Crowd/atmosphere hook — 30–45 sec, opens on widest loudest shot',
        'Short 2: Traveling fan micro-interview — 60–90 sec, one emotionally legible answer',
        'Short 3: Creator POV walking into the festival — 45–60 sec',
        'Reel 1: Fair Park arrival montage — flags, food, crowd, energy',
        'Reel 2: Vendor/worker glimpse',
        'YouTube Episode 1: "Dallas Wakes Up" — 8–12 min',
      ],
      successConditions: [
        'Creator A-roll captured at Fair Park (cannot reconstruct later)',
        'At least one micro-interview with a traveling fan or volunteer',
        'One recurring character candidate identified and contact saved',
        'Short 1 posted within 48 hours of shoot',
        'Episode 1 rough cut started by Sunday',
      ],
    }),

    buildAssignment(campaignId, profileId, {
      title: 'Episode 1 Edit Day',
      missionTitle: 'Dallas Wakes Up — Edit',
      date: '2026-06-14',
      status: 'draft',
      dayType: 'edit',
      weekNumber: 1,
      primaryLocation: 'Home edit suite',
      objective: 'Cut Episode 1 rough cut. Export Short 1 for immediate publish.',
      successConditions: [
        'Short 1 published',
        'Episode 1 rough cut locked',
        'All footage organized in project folder',
      ],
      contentDeliverables: [
        'Short 1: PUBLISH TODAY',
        'Episode 1 rough cut',
      ],
    }),

    // ── WEEK 2: THE CITY GOES INTERNATIONAL ──────────────────────────────
    buildAssignment(campaignId, profileId, {
      title: 'Fair Park + Deep Ellum — International Week',
      missionTitle: 'The City Goes International',
      date: '2026-06-20',
      status: 'draft',
      dayType: 'shoot',
      weekNumber: 2,
      primaryLocation: 'Fair Park — international fan communities and viewing zones',
      backupLocation: 'AT&T Discovery District — if downtown watch party is active',
      objective: 'The city is fully activated. Focus on the diaspora dimension — communities in Dallas for whom this World Cup means something personal.',
      storyQuestion: 'Who traveled the furthest and why? What does it mean to watch your national team play in your adopted city?',
      requiredShots: [
        'Wide shot: AT&T Discovery District LED screen at night with crowd below',
        'Diaspora fan group sequence: 2–3 people, same national group, filmed together',
        'Deep Ellum at midnight: street-level, handheld, full energy',
        'One clean interview: diaspora fan explaining what this trip means to their family',
        'Bartender mid-shift: hands pouring drinks, crowd behind them',
        'Creator A-roll: walking Deep Ellum at night, narrating what changed since Week 1',
      ],
      targetCharacters: [
        'Diaspora fan with strong personal story — national jerseys, flags, groups',
        'Deep Ellum bartender working multiple World Cup nights — introduce and set up revisit',
        'Fair Park volunteer who has worked multiple shifts',
      ],
      businessOpportunities: [
        'Deep Ellum bar: match-night recap reel for $300',
        'Restaurant near Fair Park: "spillover crowd" story — document the full house',
      ],
      contentDeliverables: [
        'Short 4: Diaspora fan emotional moment — 60–90 sec',
        'Short 5: Deep Ellum night atmosphere — 30–45 sec, music-driven',
        'Short 6: Creator observation from Deep Ellum at midnight',
        'Reel 4: International flags + crowd energy montage',
        'YouTube Episode 2: "The City Goes International" — 10–14 min',
      ],
      successConditions: [
        'Diaspora fan on camera with strong story',
        'Bartender introduced and contact saved for recurring character follow-up',
        'Deep Ellum nighttime footage on C70 at correct exposure',
        'Episode 2 rough cut complete by Sunday',
        'At least 2 recurring character candidates in contact list',
      ],
    }),

    // ── WEEK 3: TENTPOLE — DALLAS AT FULL SPEED ──────────────────────────
    buildAssignment(campaignId, profileId, {
      title: '★ TENTPOLE — Match Night Jun 25',
      missionTitle: 'Dallas at Full Speed — Match Night 1',
      date: '2026-06-25',
      status: 'draft',
      dayType: 'tentpole',
      weekNumber: 3,
      primaryLocation: 'AT&T Stadium / Texas Live! — match day fan arrival',
      backupLocation: 'Deep Ellum — post-match energy',
      objective: 'Three tentpole dates this week. This is the highest-production week of the arc. AT&T Stadium perimeter is the signature documentary shot.',
      storyQuestion: 'What does Dallas look like when it is running at full capacity with no ceiling?',
      requiredShots: [
        '★ REQUIRED: Creator at AT&T Stadium perimeter during fan arrival — signature documentary shot',
        '★ REQUIRED: Recurring Character #1 — same anchor shot as Week 1, different emotional state',
        'Match night crowd at maximum: Fair Park or Deep Ellum, widest possible shot',
        'Worker on shift: bartender or volunteer mid-chaos, brief ambient sequence',
        'Creator closing reflection — must acknowledge the weight of the week',
      ],
      targetCharacters: [
        'Recurring Character #1 revisit — same person from Week 1, second chapter',
        'Ticket holder with a strong story — why this match, how they got the ticket',
        'Worker on a triple-shift — ask: what does this week feel like from inside it?',
      ],
      businessOpportunities: [
        'Stadium-area bar: Jun 25 match night recap reel — $300 same-day',
        'Fair Park vendor: three-night run documentation — $500 week-in-review reel',
      ],
      contentDeliverables: [
        'Short 7: Match-night crowd reaction — post SAME NIGHT, content is perishable',
        'Reel 7: AT&T Stadium fan arrival montage',
      ],
      successConditions: [
        '★ AT&T Stadium perimeter shot captured',
        '★ Recurring Character #1 filmed a second time',
        'Short 7 posted same night as shoot',
        'All footage backed up before bed',
      ],
    }),

    buildAssignment(campaignId, profileId, {
      title: '★ TENTPOLE — Match Night Jun 27',
      missionTitle: 'Dallas at Full Speed — Match Night 2',
      date: '2026-06-27',
      status: 'draft',
      dayType: 'tentpole',
      weekNumber: 3,
      primaryLocation: 'Fair Park — match viewing + atmosphere',
      backupLocation: 'Backyard Dallas / Deep Ellum hero bar',
      objective: 'Second match night of tentpole week. Recurring character chapter 2 continues. City at sustained peak.',
      requiredShots: [
        'Recurring Character #1 — emotional state vs Week 1',
        'Fair Park crowd at viewing zone maximum',
        'One quiet moment: a person standing still in the middle of chaos',
        'Creator reflection — evening, aware of how much ground has been covered',
      ],
      targetCharacters: [
        'Recurring Character #1 — second chapter',
        'Jun 27 new encounter: someone who has been here since Week 1',
      ],
      businessOpportunities: [
        'Fair Park vendor: mid-run check-in — document their sustained business',
      ],
      contentDeliverables: [
        'Short 8: Recurring Character #1 moment — 60–90 sec, second chapter',
        'Reel 8: Worker story — 60 sec, one person\'s face through the chaos',
      ],
      successConditions: [
        'All footage backed up before bed',
        'Recurring Character #1 second-chapter material locked',
      ],
    }),

    buildAssignment(campaignId, profileId, {
      title: '★ TENTPOLE — Concert Night Jun 28',
      missionTitle: 'Dallas at Full Speed — Concert Night',
      date: '2026-06-28',
      status: 'draft',
      dayType: 'tentpole',
      weekNumber: 3,
      primaryLocation: 'Fair Park — concert night',
      backupLocation: 'AT&T Discovery District downtown overflow',
      objective: 'Three nights in a row. Concert atmosphere is different from pure soccer — capture the shift in crowd energy and character.',
      requiredShots: [
        'Jun 28 concert night: city at night, music energy, different from pure soccer atmosphere',
        'Creator closing reflection — must acknowledge the weight of three consecutive nights',
        'Week 3 supercut elements: three nights, one city',
      ],
      targetCharacters: [
        'Jun 28 concert night: fan there for the music, not the soccer — contrast character',
      ],
      businessOpportunities: [
        'Jun 28 concert venue adjacent business: evening recap offer',
      ],
      contentDeliverables: [
        'Short 9: Jun 28 concert night atmosphere — 30–45 sec, music-driven pacing',
        'Reel 9: Week 3 supercut — three nights, one city, 45 sec',
        'YouTube Episode 3: "Three Nights in Dallas" — 12–16 min (edit Jun 29–30)',
      ],
      successConditions: [
        'Episode 3 rough cut started by Jun 29',
        'All three nights footage organized and backed up',
        'DO NOT try to edit during Jun 25–28 stretch — editing happens Jun 29–30',
      ],
    }),

    // ── WEEK 4: KNOCKOUT ROUNDS + JUL 4 ──────────────────────────────────
    buildAssignment(campaignId, profileId, {
      title: 'Knockout Match — Jul 3',
      missionTitle: 'The Tournament Collides With Texas Summer',
      date: '2026-07-03',
      status: 'draft',
      dayType: 'shoot',
      weekNumber: 4,
      primaryLocation: 'AT&T Stadium / Texas Live! — Jul 3 knockout match day',
      backupLocation: 'Deep Ellum — post-match overflow',
      objective: 'Knockout rounds begin. Stakes are higher. Capture fan tension and the emotional register of elimination-round soccer.',
      storyQuestion: 'What happens when the World Cup and the Fourth of July land on the same weekend in Texas?',
      requiredShots: [
        'Knockout match tension: fan faces during high-stakes moments',
        'Texas flags and World Cup flags in the same frame — find this organically',
        'Recurring Character #2 — introduce or revisit a stadium-area worker',
      ],
      targetCharacters: [
        'Recurring Character #2 — stadium-area worker (vendor, driver, security)',
        'Jul 3 match: someone whose team is playing — capture pre-match nerves',
      ],
      businessOpportunities: [
        'Texas Live! or Arlington area bar: Jul 3 match night recap reel — $300',
        'Hotel near stadium: international guest experience story',
      ],
      contentDeliverables: [
        'Short 11: Knockout match tension — fan faces, 60 sec',
        'Reel 11: Recurring Character #2 glimpse — worker on knockout weekend',
      ],
      successConditions: [
        'Recurring Character #2 introduced and contact saved',
        'Knockout match tension footage captured',
      ],
    }),

    buildAssignment(campaignId, profileId, {
      title: '★ Jul 4 — World Cup Meets America',
      missionTitle: 'Jul 4 + World Cup Collision',
      date: '2026-07-04',
      status: 'draft',
      dayType: 'tentpole',
      weekNumber: 4,
      primaryLocation: 'Fair Park — Jul 4th concert night',
      backupLocation: 'Backyard Dallas if Fair Park is over-crowded for production',
      objective: 'July 4th arrives mid-World Cup. Document the cultural collision: international soccer fever meeting American patriotism in Texas.',
      storyQuestion: 'What happens when the World Cup and the Fourth of July land on the same weekend in Texas?',
      requiredShots: [
        '★ REQUIRED: Creator A-roll acknowledging the Jul 4 / World Cup collision — unique cultural moment',
        'Texas flags and World Cup flags in the same frame',
        'Crowd at a Jul 4 fireworks moment with World Cup atmosphere in background',
        'Jul 4 daytime: neighborhood near Fair Park, quiet, before the night starts',
        'Creator closing reflection: observe what America looks like when soccer becomes unavoidable',
      ],
      targetCharacters: [
        'Jul 4 character: someone celebrating BOTH the World Cup and the holiday simultaneously',
        'Local Dallas resident near Fair Park: what does Jul 4 mean this year?',
      ],
      businessOpportunities: [
        'Jul 4 Fair Park adjacent food vendor: two-day weekend mini-doc — $500',
      ],
      contentDeliverables: [
        'Short 10: Jul 4 atmosphere — American flags + World Cup flags — POST WITHIN 24 HOURS',
        'Short 12: Creator observation on the Jul 4 / WC collision, 45–60 sec',
        'Reel 10: Jul 4 montage — flags, fireworks, crowds, atmosphere',
        'YouTube Episode 4: "Texas Summer, World Cup Winter" — 10–14 min',
      ],
      successConditions: [
        'Texas + World Cup flag shot captured',
        'At least one character who articulates the Jul 4 / WC meaning personally',
        'Short 10 posted same day or day after Jul 4 — cultural timeliness',
        'Episode 4 rough cut complete by Jul 6',
      ],
    }),

    // ── WEEK 5: MAJOR LAZER NIGHT ─────────────────────────────────────────
    buildAssignment(campaignId, profileId, {
      title: 'Major Lazer Night — Fair Park Jul 9',
      missionTitle: 'The Party Is Still Going',
      date: '2026-07-09',
      status: 'draft',
      dayType: 'shoot',
      weekNumber: 5,
      primaryLocation: 'Fair Park — Major Lazer night',
      backupLocation: 'Backyard Dallas — concert-adjacent nightlife',
      objective: 'The soccer-as-party dimension of the arc. But underneath the celebration, the city and its workers are fatigued. Act 2 is about the toll of sustaining this level of intensity.',
      storyQuestion: 'What does it feel like to still be at full speed when the month is catching up to everyone?',
      requiredShots: [
        '★ REQUIRED: Recurring Character #1 — same anchor shot, third chapter. Visible fatigue or reflection.',
        'Major Lazer crowd at capacity — wide, nighttime, maximum energy',
        'A quiet moment: one person resting or standing still in the middle of chaos',
        'Creator A-roll reflection: mid-arc, what has changed since week one?',
        'Worker end-of-shift: someone walking to their car at 1am — observe, do not stage',
      ],
      targetCharacters: [
        '★ Recurring Character #1 revisit #3 — ask: how are you feeling compared to week one?',
        'Recurring Character #3 — introduce: local resident who has been living next to this for a month',
        'Major Lazer night: festival fan there for the music, not the soccer',
      ],
      businessOpportunities: [
        'Fair Park adjacent bar/restaurant: Jul 9 recap reel — $300 same-day',
        'Deep Ellum bar: one-month World Cup business story — $500 mini-doc',
      ],
      contentDeliverables: [
        'Short 13: Major Lazer night atmosphere — 30–45 sec, music-driven',
        'Short 14: Recurring Character #1, third chapter — 60–90 sec, emotional weight',
        'Short 15: Quiet city contrast — 30 sec, intentionally slow',
        'Reel 13: Major Lazer crowd energy montage',
        'Reel 14: One person resting in the chaos — stillness reel',
        'Reel 15: Five-week city transformation supercut (Weeks 1–5)',
        'YouTube Episode 5: "The Party Keeps Going" — 10–14 min',
      ],
      successConditions: [
        '★ Recurring Character #1 filmed a third time — documentary emotional mid-point',
        'Quiet/fatigue moments captured alongside high-energy shots',
        'Creator mid-arc A-roll reflecting on arc progress',
        'Episode 5 rough cut complete by Jul 13 Sunday',
      ],
    }),

    buildAssignment(campaignId, profileId, {
      title: 'Deep Ellum Support Shoot — Jul 11',
      missionTitle: 'The Party Is Still Going — Neighborhood Texture',
      date: '2026-07-11',
      status: 'draft',
      dayType: 'shoot',
      weekNumber: 5,
      primaryLocation: 'Deep Ellum — neighborhood streets',
      backupLocation: 'Frisco Soccer Celebration — suburban contrast',
      objective: 'Light support shoot. Worker and neighborhood texture. A sense of things winding toward an end.',
      requiredShots: [
        'Deep Ellum Jul 11: neighborhood streets, quieter than before',
        'A sense of things winding toward an end — intentional pacing',
      ],
      targetCharacters: [
        'Deep Ellum bartender revisit — how are they doing at week 5?',
      ],
      contentDeliverables: [
        'B-roll for Episode 5 and the arc-closing supercut',
      ],
      successConditions: [
        'Quiet contrast footage in the can',
        'Bartender revisit captured if possible',
      ],
    }),

    // ── WEEK 6: SEMI-FINAL — THE BIGGEST NIGHT ───────────────────────────
    buildAssignment(campaignId, profileId, {
      title: '★★ SEMI-FINAL NIGHT — Jul 14',
      missionTitle: 'The Biggest Night — Semi-Final',
      date: '2026-07-14',
      status: 'draft',
      dayType: 'tentpole',
      weekNumber: 6,
      primaryLocation: 'AT&T Stadium — Semi-final. Arrive early. Stay late.',
      backupLocation: 'Texas Live! — if stadium perimeter is inaccessible',
      objective: 'The semi-final on Jul 14 is the arc\'s climax. Every recurring character should be on screen this week. Every closing interview recorded. This is the documentary\'s Act 3.',
      storyQuestion: 'What does it feel like to be in Dallas on the night of the World Cup semi-final?',
      requiredShots: [
        '★ REQUIRED: AT&T Stadium at night from outside — most cinematic establishing shot of the arc',
        '★ REQUIRED: Recurring Character #1 closing interview — "When this is over, what do you think you\'ll remember?"',
        '★ REQUIRED: Recurring Character #2 closing interview — same question',
        'Fan reaction: semi-final result moment — capture the emotional response',
        'Creator closing reflection: outside the stadium after the match, acknowledge the scale of the night',
        'Empty street after the crowd leaves — documentary ending image candidate',
        'One wide elevated shot of the stadium district at full capacity',
      ],
      targetCharacters: [
        '★ ALL RECURRING CHARACTERS — film each one on Jul 14 or within the week',
        '★ REQUIRED: Recurring Character #1 closing interview',
        '★ REQUIRED: Recurring Character #2 closing interview',
        'New encounter: someone who drove or flew specifically for semi-final night — not a Dallas resident',
      ],
      businessOpportunities: [
        'Semi-final night recap reel: most valuable single night for paid business content',
        'Any business from the arc: offer a final documentary-style brand piece before event ends',
      ],
      contentDeliverables: [
        'Short 16: Recurring Character closing interview moment — 60–90 sec, most emotional clip',
        'Short 17: Semi-final night atmosphere — 30–45 sec, biggest crowd shot',
        'Short 18: Creator reflection outside the stadium — 45–60 sec',
        'Reel 16: Semi-final arrival montage — fans, flags, stadium, scale',
        'Reel 17: Emotional fan reaction reel — faces, not just crowds',
        'Reel 18: Arc-closing supercut — Weeks 1–6, city transformation story',
        'YouTube Episode 6: "The Semi-Final" — 12–18 min — FLAGSHIP EPISODE — publish by Jul 19',
      ],
      successConditions: [
        '★ ALL recurring characters filmed in closing capacity',
        '★ AT&T Stadium exterior night shot captured',
        '★ Creator closing reflection recorded',
        'Episode 6 published by Jul 19 Saturday',
        'Documentary readiness: 20+ hrs footage, 5+ recurring characters, 30+ documentary scenes',
        'Gear is charged, cards are formatted, backup plan is ready — ARRIVE EARLY, STAY LATE',
      ],
    }),

    buildAssignment(campaignId, profileId, {
      title: 'Arc Wrap + Episode 6 Publish',
      missionTitle: 'The Arc Is Complete',
      date: '2026-07-19',
      status: 'draft',
      dayType: 'publish',
      weekNumber: 6,
      primaryLocation: 'Home edit suite',
      objective: 'Episode 6 published. Arc JSON exported. Campaign closed. Documentary package ready.',
      successConditions: [
        'Episode 6 published on YouTube',
        'All shorts and reels published (16–18)',
        'Campaign exported as final JSON backup',
        '20+ hours footage archived',
        'Arc review written: what worked, what missed, what comes next',
      ],
      contentDeliverables: [
        'YouTube Episode 6: PUBLISH TODAY',
        'Arc-closing supercut (Reel 18): PUBLISH TODAY',
        'Campaign JSON export: ARCHIVE TODAY',
      ],
    }),
  ];
}

// ─── MASTER SEED FUNCTION ────────────────────────────────────────────────────
// Call this on every app boot after confirming a profile exists.
// Safe to call repeatedly — all operations are idempotent.

export async function runFullSeed(): Promise<{ profile: UserProfile; campaign: Campaign }> {
  const db = getDB();

  // 1. Ensure Sin profile exists
  const profile = await ensureSinProfile();

  // 2. Find or create World Cup campaign
  const all = await db.campaigns.toArray();
  let campaign = all.find(c => c.isSeedCampaign === true || c.title.includes('World Cup Arc')) || null;

  if (!campaign) {
    const built = buildWorldCupSeedCampaign(profile.id);
    await db.campaigns.add(built);
    campaign = built;
  } else {
    // Patch missing fields
    const seed = buildWorldCupSeedCampaign(profile.id);
    const patch: Partial<Campaign> = {};
    const fields: (keyof Campaign)[] = [
      'description', 'mission', 'storyQuestion', 'theme', 'successCriteria',
      'targetCharacterTypes', 'primaryLocations', 'startDate', 'endDate',
      'isSeedCampaign', 'source',
    ];
    for (const f of fields) {
      const v = campaign[f];
      const empty = v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
      if (empty) (patch as Record<string, unknown>)[f] = seed[f];
    }
    if (Object.keys(patch).length > 0) {
      patch.updatedAt = now();
      await db.campaigns.update(campaign.id, patch);
      campaign = { ...campaign, ...patch };
    }
  }

  // 3. Seed assignments if none exist for this campaign
  const existingCount = await db.assignments.where('campaignId').equals(campaign.id).count();
  if (existingCount === 0) {
    const assignments = buildWorldCupAssignments(campaign.id, profile.id);
    await db.assignments.bulkAdd(assignments);
  }

  return { profile, campaign };
}

// ─── LEGACY COMPAT ────────────────────────────────────────────────────────────

export async function seedWorldCupCampaignIfNeeded(profileId: string) {
  const { campaign } = await runFullSeed();
  return { seeded: true, campaign, reason: 'Full seed via runFullSeed' };
}

export async function ensureWorldCupSeedCampaign(profileId: string): Promise<Campaign> {
  const { campaign } = await runFullSeed();
  return campaign;
}

// ─── DELETE PROTECTION ────────────────────────────────────────────────────────

export async function checkSeedProtection(campaignId: string): Promise<{
  isSeed: boolean;
  warning: string | null;
}> {
  const db = getDB();
  const campaign = await db.campaigns.get(campaignId);
  if (!campaign) return { isSeed: false, warning: null };
  if (campaign.isSeedCampaign) {
    return {
      isSeed: true,
      warning: `"${campaign.title}" is your World Cup campaign. Deleting it cannot be undone. Are you absolutely sure?`,
    };
  }
  return { isSeed: false, warning: null };
}

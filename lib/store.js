// localStorage-backed store — all reads return [] if empty or SSR

function isBrowser() { return typeof window !== 'undefined'; }

function get(key) {
  if (!isBrowser()) return [];
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function set(key, val) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(val));
}

// ── Assignments ──────────────────────────────────────────────────────────────

export function getAssignments() { return get('fp_assignments'); }

export function saveAssignment(a) {
  const all = getAssignments();
  const idx = all.findIndex(x => x.id === a.id);
  if (idx >= 0) all[idx] = a; else all.push(a);
  set('fp_assignments', all);
}

export function deleteAssignment(id) {
  set('fp_assignments', getAssignments().filter(x => x.id !== id));
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export function getSessions() { return get('fp_sessions'); }

export function saveSession(s) {
  const all = getSessions();
  const idx = all.findIndex(x => x.id === s.id);
  if (idx >= 0) all[idx] = s; else all.push(s);
  set('fp_sessions', all);
}

// ── Seed ─────────────────────────────────────────────────────────────────────

export function seedIfEmpty() {
  if (getAssignments().length > 0) return;
  const today = new Date().toISOString().slice(0, 10);
  const in2 = new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 10);
  const seeds = [
    {
      id: 'seed-1', date: today,
      title: 'Fair Park Pre-World Cup Recon',
      location: 'Fair Park, Dallas',
      story: 'How is Fair Park transforming ahead of the World Cup? Who are the workers behind the scenes?',
      shots: ['Wide establishing shot of Fair Park main gate', 'Workers setting up signage — tight on hands', 'Fan flags draped on fences', 'Empty stadium exterior at golden hour'],
      characters: ['Security guard on first shift', 'Food vendor owner', 'Construction foreman'],
      businessLeads: ['Merch booth operators', 'Food truck collectives'],
    },
    {
      id: 'seed-2', date: in2,
      title: 'Uptown Dallas Fan Zone',
      location: 'Uptown, Dallas',
      story: 'Where are international fans congregating? What does Dallas look and feel like during the World Cup?',
      shots: ['Flags from 3+ nations hanging outside bars', 'Fans watching on outdoor screens', 'Street-level crowd movement', 'Local business owner watching game nervously'],
      characters: ['Bar owner capitalizing on World Cup traffic', 'International visitor', 'Dallas local surprised by the scene'],
      businessLeads: ['Sports bar partnerships', 'Merch pop-ups'],
    },
  ];
  seeds.forEach(saveAssignment);
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

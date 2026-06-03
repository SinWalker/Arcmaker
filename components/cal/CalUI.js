import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import AppLayout from '../layout/AppLayout';
import { getActiveCampaign } from '../../lib/campaign';
import { getAssignmentsForCampaign, createAssignment, updateAssignment } from '../../lib/assignment';
import { createSession } from '../../lib/session';

const MONTHS     = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const WEEKDAYS   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const DAY_TYPES = [
  { value: 'shoot',    label: 'SHOOT' },
  { value: 'tentpole', label: 'TENTPOLE' },
  { value: 'edit',     label: 'EDIT' },
  { value: 'publish',  label: 'PUBLISH' },
  { value: 'outreach', label: 'OUTREACH' },
  { value: 'recovery', label: 'RECOVERY' },
  { value: 'off',      label: 'OFF' },
];

// Colors per day type — must match globals.css
const DAY_TYPE_COLORS = {
  shoot:    { border: '#aaff42', text: '#aaff42' },
  tentpole: { border: '#34d7ff', text: '#34d7ff' },
  edit:     { border: '#7ea6c7', text: '#7ea6c7' },
  publish:  { border: '#c8ff57', text: '#c8ff57' },
  outreach: { border: '#ffb347', text: '#ffb347' },
  recovery: { border: '#4a5568', text: '#7ea6c7' },
  off:      { border: '#2e4768', text: '#3d5a75' },
};

function toYMD(d) {
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(ymd) {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${MONTHS[date.getMonth()]} ${d} // ${date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()}`;
}

function getDayTypeClass(dayType) {
  if (!dayType) return '';
  const valid = ['shoot','tentpole','edit','publish','outreach','recovery','off'];
  return valid.includes(dayType) ? dayType : '';
}

// ── Day Editor Modal ─────────────────────────────────────────────────────────

const SAVE_STATUS = {
  idle:    { label: '', color: 'var(--muted)' },
  saved:   { label: 'SAVED', color: 'var(--green)' },
  saving:  { label: 'SAVING...', color: 'var(--muted)' },
  unsaved: { label: 'UNSAVED', color: 'var(--cyan)' },
  error:   { label: 'SAVE FAILED', color: 'var(--red)' },
};

function DayEditorModal({ ymd, existingAssignment, campaign, onClose, onSaved, onStartSession }) {
  const isNew = !existingAssignment;

  const [fields, setFields] = useState({
    missionTitle:        existingAssignment?.missionTitle || existingAssignment?.title || '',
    dayType:             existingAssignment?.dayType || '',
    objective:           existingAssignment?.objective || '',
    primaryLocation:     existingAssignment?.primaryLocation || '',
    backupLocation:      existingAssignment?.backupLocation || '',
    successConditionsText: (existingAssignment?.successConditions || []).join('\n'),
    requiredShotsText:   (existingAssignment?.requiredShots || []).join('\n'),
    targetCharactersText:(existingAssignment?.targetCharacters || []).join('\n'),
    deliverablesText:    (existingAssignment?.contentDeliverables || []).join('\n'),
    notes:               existingAssignment?.notes || '',
  });

  const [saveStatus, setSaveStatus] = useState('idle');
  const [savedAssignment, setSavedAssignment] = useState(existingAssignment || null);
  const [starting, setStarting] = useState(false);
  const debounceRef = useRef(null);

  // Fields → structured data
  function buildPatch(f) {
    return {
      missionTitle:        f.missionTitle.trim() || undefined,
      dayType:             f.dayType || undefined,
      objective:           f.objective.trim() || undefined,
      primaryLocation:     f.primaryLocation.trim() || undefined,
      backupLocation:      f.backupLocation.trim() || undefined,
      successConditions:   f.successConditionsText ? f.successConditionsText.split('\n').map(s => s.trim()).filter(Boolean) : [],
      requiredShots:       f.requiredShotsText ? f.requiredShotsText.split('\n').map(s => s.trim()).filter(Boolean) : [],
      targetCharacters:    f.targetCharactersText ? f.targetCharactersText.split('\n').map(s => s.trim()).filter(Boolean) : [],
      contentDeliverables: f.deliverablesText ? f.deliverablesText.split('\n').map(s => s.trim()).filter(Boolean) : [],
      notes:               f.notes.trim() || undefined,
    };
  }

  function handleChange(key, value) {
    setFields(prev => {
      const next = { ...prev, [key]: value };
      return next;
    });
    setSaveStatus('unsaved');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => triggerSave(), 1200);
  }

  function setDayType(type) {
    setFields(prev => ({ ...prev, dayType: type }));
    setSaveStatus('unsaved');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => triggerSave(), 800);
  }

  const latestFields = useRef(fields);
  latestFields.current = fields;
  const savedAssignmentRef = useRef(savedAssignment);
  savedAssignmentRef.current = savedAssignment;

  async function triggerSave() {
    const f = latestFields.current;
    const existing = savedAssignmentRef.current;
    setSaveStatus('saving');
    try {
      const patch = buildPatch(f);
      let result;
      if (existing) {
        result = await updateAssignment(existing.id, patch);
      } else {
        // Create with minimum required fields, then patch
        const created = await createAssignment(campaign.id, {
          title: f.missionTitle.trim() || `Day ${ymd}`,
          date: ymd,
        });
        result = await updateAssignment(created.id, patch);
      }
      setSavedAssignment(result);
      savedAssignmentRef.current = result;
      setSaveStatus('saved');
      onSaved(result);
    } catch (e) {
      setSaveStatus('error');
    }
  }

  async function handleSave() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    await triggerSave();
  }

  async function handleStartSession() {
    if (!campaign || starting) return;
    setStarting(true);
    // Save first
    if (debounceRef.current) clearTimeout(debounceRef.current);
    await triggerSave();
    const assignment = savedAssignmentRef.current;
    if (!assignment) { setStarting(false); return; }
    try {
      const title = assignment.missionTitle || assignment.title || 'Field Session';
      await createSession(campaign.id, assignment.id, title, assignment.primaryLocation || undefined);
      onStartSession();
    } catch {
      setStarting(false);
    }
  }

  const canStartSession = ['shoot','tentpole'].includes(fields.dayType);
  const sc = SAVE_STATUS[saveStatus];
  const colorToken = DAY_TYPE_COLORS[fields.dayType];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div className="modal-title" style={{ marginBottom: 2 }}>{formatDateLabel(ymd)}</div>
            {isNew && !savedAssignment && (
              <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#2e4768' }}>
                NEW DAY — NOT YET SAVED
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 22, cursor: 'pointer', padding: '0 0 0 8px', lineHeight: 1 }}
          >×</button>
        </div>

        {/* Save status + save button */}
        <div className="save-row" style={{ marginBottom: 14 }}>
          <div className="save-status-text" style={{ color: sc.color }}>{sc.label}</div>
          <button
            className={`save-btn${saveStatus === 'unsaved' || saveStatus === 'error' ? ' unsaved' : ''}`}
            onClick={handleSave}
            disabled={saveStatus === 'saving' || saveStatus === 'saved' || saveStatus === 'idle'}
          >
            SAVE
          </button>
        </div>

        {/* Day type selector */}
        <div style={{ marginBottom: 14 }}>
          <div className="field-label">DAY TYPE</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            {DAY_TYPES.map(({ value, label }) => {
              const active = fields.dayType === value;
              const col = DAY_TYPE_COLORS[value];
              return (
                <button
                  key={value}
                  onClick={() => setDayType(value)}
                  style={{
                    padding: '6px 10px',
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontFamily: "'Oxanium', sans-serif",
                    border: `2px solid ${active ? col.border : '#2e4768'}`,
                    background: active ? col.border + '22' : '#0f1523',
                    color: active ? col.text : '#7ea6c7',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mission Title */}
        <div style={{ marginBottom: 12 }}>
          <div className="field-label">MISSION TITLE</div>
          <input
            className="sys-input"
            value={fields.missionTitle}
            onChange={e => handleChange('missionTitle', e.target.value)}
            placeholder="What are you doing today?"
            style={{ marginTop: 4 }}
          />
        </div>

        {/* Objective */}
        <div style={{ marginBottom: 12 }}>
          <div className="field-label">OBJECTIVE</div>
          <textarea
            className="sys-textarea"
            value={fields.objective}
            onChange={e => handleChange('objective', e.target.value)}
            placeholder="What does success look like?"
            rows={2}
            style={{ marginTop: 4 }}
          />
        </div>

        {/* Primary Location */}
        <div style={{ marginBottom: 12 }}>
          <div className="field-label">PRIMARY LOCATION</div>
          <input
            className="sys-input"
            value={fields.primaryLocation}
            onChange={e => handleChange('primaryLocation', e.target.value)}
            placeholder="e.g. Fair Park, Deep Ellum"
            style={{ marginTop: 4 }}
          />
        </div>

        {/* Success Conditions */}
        <div style={{ marginBottom: 12 }}>
          <div className="field-label">SUCCESS CONDITIONS  (one per line)</div>
          <textarea
            className="sys-textarea"
            value={fields.successConditionsText}
            onChange={e => handleChange('successConditionsText', e.target.value)}
            placeholder={"Capture 3 characters\nGet B-roll of main stage"}
            rows={3}
            style={{ marginTop: 4 }}
          />
        </div>

        {/* Required Shots */}
        <div style={{ marginBottom: 12 }}>
          <div className="field-label">REQUIRED SHOTS  (one per line)</div>
          <textarea
            className="sys-textarea"
            value={fields.requiredShotsText}
            onChange={e => handleChange('requiredShotsText', e.target.value)}
            placeholder={"Wide establishing shot\nCharacter close-up"}
            rows={3}
            style={{ marginTop: 4 }}
          />
        </div>

        {/* Target Characters */}
        <div style={{ marginBottom: 12 }}>
          <div className="field-label">TARGET CHARACTERS  (one per line)</div>
          <textarea
            className="sys-textarea"
            value={fields.targetCharactersText}
            onChange={e => handleChange('targetCharactersText', e.target.value)}
            placeholder={"Local vendor\nInternational fan"}
            rows={2}
            style={{ marginTop: 4 }}
          />
        </div>

        {/* Content Deliverables */}
        <div style={{ marginBottom: 12 }}>
          <div className="field-label">CONTENT DELIVERABLES  (one per line)</div>
          <textarea
            className="sys-textarea"
            value={fields.deliverablesText}
            onChange={e => handleChange('deliverablesText', e.target.value)}
            placeholder={"1x Instagram reel\n3x character clips"}
            rows={2}
            style={{ marginTop: 4 }}
          />
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 16 }}>
          <div className="field-label">NOTES</div>
          <textarea
            className="sys-textarea"
            value={fields.notes}
            onChange={e => handleChange('notes', e.target.value)}
            placeholder="Anything else for this day..."
            rows={2}
            style={{ marginTop: 4 }}
          />
        </div>

        {/* START FIELD SESSION — only for shoot / tentpole */}
        {canStartSession && (
          <button
            className="cta-btn"
            onClick={handleStartSession}
            disabled={starting}
            style={{ marginTop: 4 }}
          >
            {starting ? 'STARTING...' : 'START FIELD SESSION →'}
          </button>
        )}

        <button className="cta-btn ghost" onClick={onClose} style={{ marginTop: canStartSession ? 8 : 14 }}>
          CLOSE
        </button>

      </div>
    </div>
  );
}

// ── Main CalUI ───────────────────────────────────────────────────────────────

export default function CalUI() {
  const router = useRouter();
  const [campaign, setCampaign]       = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [editorYmd, setEditorYmd]     = useState(null);   // which day is open

  const today     = toYMD(new Date());
  const todayDate = new Date();
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());
  const [viewYear, setViewYear]   = useState(todayDate.getFullYear());

  const campaignRef = useRef(null);

  useEffect(() => {
    async function load() {
      const c = await getActiveCampaign();
      setCampaign(c);
      campaignRef.current = c;
      if (c) {
        const a = await getAssignmentsForCampaign(c.id);
        setAssignments(a);
      }
      setLoading(false);
    }
    load();
  }, []);

  // date → assignment map (rebuilt on every render)
  const assignmentByDate = {};
  assignments.forEach(a => { if (a.date) assignmentByDate[a.date] = a; });

  // Today's assignment
  const todayAssignment = assignmentByDate[today];

  // This week: next 14 days, up to 5 with assignments
  const weekDays = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() + i);
    const ymd = toYMD(d);
    if (assignmentByDate[ymd]) weekDays.push({ date: ymd, d, assignment: assignmentByDate[ymd] });
    if (weekDays.length >= 5) break;
  }

  // Month grid cells
  const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const calCells    = [];
  for (let i = 0; i < firstDay; i++) calCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    calCells.push({ day: d, ymd, assignment: assignmentByDate[ymd] });
  }

  // Callback from DayEditorModal when an assignment is created or updated
  function handleSaved(updatedAssignment) {
    setAssignments(prev => {
      const exists = prev.find(a => a.id === updatedAssignment.id);
      if (exists) return prev.map(a => a.id === updatedAssignment.id ? updatedAssignment : a);
      return [...prev, updatedAssignment];
    });
  }

  function handleStartSession() {
    router.push('/field');
  }

  function openEditor(ymd) {
    setEditorYmd(ymd);
  }

  function closeEditor() {
    setEditorYmd(null);
  }

  if (loading) return (
    <AppLayout sysLabel="MISSION BOARD" pageTitle="CAL">
      <div style={{ color: 'var(--muted)', fontSize: 13, padding: '20px 0' }}>LOADING...</div>
    </AppLayout>
  );

  const editorAssignment = editorYmd ? (assignmentByDate[editorYmd] || null) : null;

  return (
    <AppLayout sysLabel="MISSION BOARD" pageTitle="CAL">

      {/* TODAY window */}
      <div className="window">
        <div className="window-title-tab">TODAY</div>
        <div className="window-inner">
          {todayAssignment ? (
            <>
              <div className="win-title">{(todayAssignment.missionTitle || todayAssignment.title || 'MISSION').toUpperCase()}</div>
              {todayAssignment.objective && (
                <div className="copy-text" style={{ marginTop: 4 }}>{todayAssignment.objective}</div>
              )}
              <button
                className="chip"
                style={{ cursor: 'pointer', border: 'none', marginTop: 10 }}
                onClick={() => openEditor(today)}
              >
                OPEN DAY EDITOR
              </button>
            </>
          ) : (
            <>
              <div className="copy-text" style={{ color: 'var(--muted)' }}>
                No mission scheduled for today.
              </div>
              <button
                className="cta-btn ghost"
                style={{ marginTop: 10 }}
                onClick={() => openEditor(today)}
              >
                + CREATE TODAY'S MISSION
              </button>
            </>
          )}
        </div>
      </div>

      {/* THIS WEEK window */}
      {weekDays.length > 0 && (
        <div className="window">
          <div className="window-title-tab">THIS WEEK</div>
          <div className="window-inner">
            {weekDays.map(({ date, d, assignment }) => {
              const mon = MONTHS[d.getMonth()];
              const dayNum = d.getDate();
              const typeClass = getDayTypeClass(assignment.dayType);
              return (
                <div
                  key={date}
                  className={`day-card${assignment.dayType === 'tentpole' ? ' tentpole' : ''}`}
                  onClick={() => openEditor(date)}
                >
                  <div className="date-box">
                    <div className="date-month">{mon}</div>
                    <div className="date-num">{dayNum}</div>
                  </div>
                  <div className="day-card-content">
                    <div className={`day-type-label ${typeClass}`}>
                      {(assignment.dayType || 'MISSION').toUpperCase()}
                      {assignment.dayType === 'tentpole' && ' ★'}
                    </div>
                    <div className="day-card-title">
                      {(assignment.missionTitle || assignment.title || '').toUpperCase()}
                    </div>
                    {assignment.primaryLocation && (
                      <div className="day-card-sub">{assignment.primaryLocation}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MONTH VIEW window */}
      <div className="window">
        <div className="window-title-tab">MONTH VIEW</div>
        <div className="window-inner">

          {/* Month nav */}
          <div className="month-nav">
            <button
              className="month-nav-btn"
              onClick={() => {
                if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
                else setViewMonth(m => m - 1);
              }}
            >‹</button>
            <div className="month-nav-label">{MONTH_FULL[viewMonth].toUpperCase()} {viewYear}</div>
            <button
              className="month-nav-btn"
              onClick={() => {
                if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
                else setViewMonth(m => m + 1);
              }}
            >›</button>
          </div>

          {/* Weekday headers */}
          <div className="cal-weekdays">
            {WEEKDAYS.map(w => <div key={w} className="cal-weekday">{w}</div>)}
          </div>

          {/* Month grid — every non-null cell is clickable */}
          <div className="month-grid">
            {calCells.map((cell, i) => {
              if (!cell) return <div key={`e${i}`} className="cal-day empty" />;
              const isToday = cell.ymd === today;
              const isPast  = cell.ymd < today;
              const a = cell.assignment;
              let dayClass = 'cal-day';
              if (isToday) {
                dayClass += ' today';
              } else if (a?.dayType) {
                dayClass += ' ' + getDayTypeClass(a.dayType);
                if (isPast) dayClass += ' past';
              } else if (isPast) {
                dayClass += ' past';
              }
              return (
                <div
                  key={cell.ymd}
                  className={dayClass}
                  onClick={() => openEditor(cell.ymd)}
                  title={a ? (a.missionTitle || a.title || a.dayType || '') : 'Click to plan this day'}
                >
                  {cell.day}
                </div>
              );
            })}
          </div>

          {/* Legend — all 7 day types */}
          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            {DAY_TYPES.map(({ value, label }) => {
              const col = DAY_TYPE_COLORS[value];
              return (
                <div key={value} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div
                    className={`cal-day ${value}`}
                    style={{ width: 14, height: 14, minHeight: 0, fontSize: 0, padding: 0 }}
                  />
                  <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: col.text }}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Day Editor Modal */}
      {editorYmd && campaign && (
        <DayEditorModal
          ymd={editorYmd}
          existingAssignment={editorAssignment}
          campaign={campaign}
          onClose={closeEditor}
          onSaved={handleSaved}
          onStartSession={handleStartSession}
        />
      )}

    </AppLayout>
  );
}

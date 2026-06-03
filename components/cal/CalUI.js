import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AppLayout from '../layout/AppLayout';
import { getActiveCampaign } from '../../lib/campaign';
import { getAssignmentsForCampaign } from '../../lib/assignment';
import { updateAssignment } from '../../lib/assignment';
import { createSession } from '../../lib/session';

const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const WEEKDAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function toYMD(d) {
  return d.toISOString().slice(0, 10);
}

function parseLocalDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function getDayTypeClass(dayType) {
  if (!dayType) return '';
  if (dayType === 'tentpole') return 'tentpole';
  if (dayType === 'shoot') return 'shoot';
  if (dayType === 'edit') return 'edit';
  if (dayType === 'publish') return 'publish';
  return '';
}

// ── Day View Modal ──────────────────────────────────────────────────────────

function DayViewModal({ assignment, onClose, onStartSession, onToggleCondition }) {
  if (!assignment) return null;

  const conditions = assignment.successConditions || [];
  const completed = assignment.completedSuccessConditions || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxHeight: '85vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div className="modal-title">
            {assignment.date ? `${MONTHS[parseInt(assignment.date.split('-')[1])-1]} ${parseInt(assignment.date.split('-')[2])}` : 'MISSION PACKET'}
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1 }}
          >×</button>
        </div>

        {/* Mission title */}
        <div className="win-title" style={{ marginBottom: 6 }}>
          {(assignment.missionTitle || assignment.title || 'MISSION').toUpperCase()}
        </div>
        {assignment.dayType && (
          <span className={`chip ${getDayTypeClass(assignment.dayType)}`} style={{ marginTop: 0 }}>
            {assignment.dayType.toUpperCase()}
          </span>
        )}

        {/* Objective */}
        {assignment.objective && (
          <div className="objective-box" style={{ marginTop: 12 }}>
            <div className="field-label">OBJECTIVE</div>
            <div className="copy-text" style={{ marginTop: 4 }}>{assignment.objective}</div>
          </div>
        )}

        {/* Success Conditions — interactive checkboxes */}
        {conditions.length > 0 && (
          <div className="window" style={{ marginTop: 14 }}>
            <div className="window-title-tab">SUCCESS CONDITIONS</div>
            <div className="window-inner">
              {conditions.map((cond, i) => {
                const key = String(i);
                const done = completed.includes(key);
                return (
                  <div
                    key={i}
                    className="check-item"
                    onClick={() => onToggleCondition(assignment, key)}
                  >
                    <div className={`check-box${done ? ' done' : ''}`}>{done ? '✓' : ''}</div>
                    <div className={`check-text${done ? ' done' : ''}`}>{cond}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Location */}
        {assignment.primaryLocation && (
          <div className="window" style={{ marginTop: 14 }}>
            <div className="window-title-tab">LOCATION</div>
            <div className="window-inner">
              <div className="dashed-item" style={{ paddingTop: 0 }}>
                <span className="dashed-item-label">PRIMARY</span>
                {assignment.primaryLocation}
              </div>
              {assignment.backupLocation && (
                <div className="dashed-item">
                  <span className="dashed-item-label">BACKUP</span>
                  {assignment.backupLocation}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Required Shots */}
        {assignment.requiredShots?.length > 0 && (
          <div className="window" style={{ marginTop: 14 }}>
            <div className="window-title-tab">REQUIRED SHOTS</div>
            <div className="window-inner">
              {assignment.requiredShots.map((s, i) => (
                <div key={i} className="dashed-item" style={{ paddingTop: i === 0 ? 0 : undefined }}>
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Target Characters */}
        {assignment.targetCharacters?.length > 0 && (
          <div className="window" style={{ marginTop: 14 }}>
            <div className="window-title-tab">TARGET CHARACTERS</div>
            <div className="window-inner">
              {assignment.targetCharacters.map((c, i) => (
                <div key={i} className="dashed-item" style={{ paddingTop: i === 0 ? 0 : undefined }}>{c}</div>
              ))}
            </div>
          </div>
        )}

        {/* Business Opportunities */}
        {assignment.businessOpportunities?.length > 0 && (
          <div className="window" style={{ marginTop: 14 }}>
            <div className="window-title-tab">BUSINESS OPS</div>
            <div className="window-inner">
              {assignment.businessOpportunities.map((b, i) => (
                <div key={i} className="dashed-item" style={{ paddingTop: i === 0 ? 0 : undefined }}>{b}</div>
              ))}
            </div>
          </div>
        )}

        {/* Content Deliverables */}
        {assignment.contentDeliverables?.length > 0 && (
          <div className="window" style={{ marginTop: 14 }}>
            <div className="window-title-tab">DELIVERABLES</div>
            <div className="window-inner">
              {assignment.contentDeliverables.map((d, i) => (
                <div key={i} className="dashed-item" style={{ paddingTop: i === 0 ? 0 : undefined }}>{d}</div>
              ))}
            </div>
          </div>
        )}

        {/* Start Field Session */}
        <button
          className="cta-btn"
          style={{ marginTop: 16 }}
          onClick={() => onStartSession(assignment)}
        >
          START FIELD SESSION →
        </button>
        <button className="cta-btn ghost" onClick={onClose}>CLOSE</button>

      </div>
    </div>
  );
}

// ── Main CAL ────────────────────────────────────────────────────────────────

export default function CalUI() {
  const router = useRouter();
  const [campaign, setCampaign] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const today = toYMD(new Date());
  const todayDate = new Date();
  const [viewMonth, setViewMonth] = useState(todayDate.getMonth());
  const [viewYear, setViewYear] = useState(todayDate.getFullYear());

  useEffect(() => {
    async function load() {
      const c = await getActiveCampaign();
      setCampaign(c);
      if (c) {
        const a = await getAssignmentsForCampaign(c.id);
        setAssignments(a);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Map date → assignment
  const assignmentByDate = {};
  assignments.forEach(a => {
    if (a.date) assignmentByDate[a.date] = a;
  });

  // Today's assignment
  const todayAssignment = assignmentByDate[today];

  // This week (7 days starting today, filter only days with assignments)
  const weekDays = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(todayDate);
    d.setDate(todayDate.getDate() + i);
    const ymd = toYMD(d);
    if (assignmentByDate[ymd]) weekDays.push({ date: ymd, d, assignment: assignmentByDate[ymd] });
    if (weekDays.length >= 5) break;
  }

  // Month grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const calCells = [];
  for (let i = 0; i < firstDay; i++) calCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    calCells.push({ day: d, ymd, assignment: assignmentByDate[ymd] });
  }

  async function handleToggleCondition(assignment, key) {
    const current = assignment.completedSuccessConditions || [];
    const next = current.includes(key)
      ? current.filter(k => k !== key)
      : [...current, key];
    const updated = await updateAssignment(assignment.id, { completedSuccessConditions: next });
    setAssignments(prev => prev.map(a => a.id === assignment.id ? updated : a));
    setSelectedAssignment(updated);
  }

  async function handleStartSession(assignment) {
    if (!campaign) return;
    const title = assignment.missionTitle || assignment.title || 'Field Session';
    const session = await createSession(campaign.id, assignment.id, title, assignment.primaryLocation);
    router.push('/field');
  }

  if (loading) return (
    <AppLayout sysLabel="MISSION BOARD" pageTitle="CAL">
      <div style={{ color: 'var(--muted)', fontSize: 13, padding: '20px 0' }}>LOADING...</div>
    </AppLayout>
  );

  return (
    <AppLayout sysLabel="MISSION BOARD" pageTitle="CAL">

      {/* TODAY window */}
      <div className="window">
        <div className="window-title-tab">TODAY</div>
        <div className="window-inner">
          {todayAssignment ? (
            <>
              <div className="win-title">{(todayAssignment.missionTitle || todayAssignment.title || 'MISSION').toUpperCase()}</div>
              <div className="copy-text">
                {todayAssignment.primaryLocation && `${todayAssignment.primaryLocation}`}
                {todayAssignment.objective && ` // ${todayAssignment.objective}`}
              </div>
              <button
                className="chip"
                style={{ cursor: 'pointer', border: 'none' }}
                onClick={() => setSelectedAssignment(todayAssignment)}
              >
                OPEN DAY
              </button>
            </>
          ) : (
            <div className="copy-text" style={{ color: 'var(--muted)' }}>
              No mission scheduled for today.
            </div>
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
                  onClick={() => setSelectedAssignment(assignment)}
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
            <div className="month-nav-label">{MONTH_FULL[viewMonth]} {viewYear}</div>
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

          {/* Month grid */}
          <div className="month-grid">
            {calCells.map((cell, i) => {
              if (!cell) return <div key={`e${i}`} className="cal-day empty" />;
              const isToday = cell.ymd === today;
              const isPast = cell.ymd < today;
              const a = cell.assignment;
              let dayClass = 'cal-day';
              if (isToday) dayClass += ' today';
              else if (a) {
                dayClass += ' ' + (getDayTypeClass(a.dayType) || 'shoot');
                if (isPast) dayClass += ' past';
              } else if (isPast) {
                dayClass += ' past';
              }
              return (
                <div
                  key={cell.ymd}
                  className={dayClass}
                  onClick={() => a && setSelectedAssignment(a)}
                  title={a ? (a.missionTitle || a.title || '') : ''}
                >
                  {cell.day}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            {[
              { cls: 'shoot', label: 'SHOOT' },
              { cls: 'tentpole', label: 'TENTPOLE' },
              { cls: 'edit', label: 'EDIT' },
              { cls: 'publish', label: 'PUBLISH' },
            ].map(({ cls, label }) => (
              <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div className={`cal-day ${cls}`} style={{ width: 16, height: 16, minHeight: 0, fontSize: 8 }} />
                <span style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted)' }}>{label}</span>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Day View Modal */}
      {selectedAssignment && (
        <DayViewModal
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
          onStartSession={handleStartSession}
          onToggleCondition={handleToggleCondition}
        />
      )}

    </AppLayout>
  );
}

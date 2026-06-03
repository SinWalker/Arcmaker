// SaveStatus — shows current save state for any form
// status: 'saved' | 'saving' | 'unsaved' | 'error'

const CONFIG = {
  saved:   { label: 'Saved', color: '#27AE60', icon: '✓' },
  saving:  { label: 'Saving...', color: '#C9A84C', icon: '↑' },
  unsaved: { label: 'Unsaved changes', color: '#888', icon: '●' },
  error:   { label: 'Save failed', color: '#C0392B', icon: '✗' },
};

export default function SaveStatus({ status, lastSaved }) {
  if (!status) return null;
  const cfg = CONFIG[status] || CONFIG.unsaved;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 13, color: cfg.color, fontWeight: 700 }}>
        {cfg.icon} {cfg.label}
      </span>
      {status === 'saved' && lastSaved && (
        <span style={{ fontSize: 11, color: '#444' }}>
          {new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </div>
  );
}

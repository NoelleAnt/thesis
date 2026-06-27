import { useEffect, useState } from 'react';

const STORAGE_KEY = 'asap-agap-accessibility';

const defaults = {
  theme: 'light',
  fontScale: 'normal',
  highContrast: false,
  reducedMotion: false,
};

function readSettings() {
  if (typeof window === 'undefined') return defaults;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaults;
    return { ...defaults, ...JSON.parse(stored) };
  } catch {
    return defaults;
  }
}

function applySettings(settings) {
  const root = document.documentElement;
  root.dataset.theme = settings.theme;
  root.dataset.fontScale = settings.fontScale;
  root.dataset.contrast = settings.highContrast ? 'high' : 'standard';
  root.dataset.reducedMotion = settings.reducedMotion ? 'true' : 'false';
  root.style.colorScheme = settings.theme === 'dark' ? 'dark' : 'light';
}

export default function AccessibilityControls() {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(defaults);

  useEffect(() => {
    const saved = readSettings();
    setSettings(saved);
    applySettings(saved);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    applySettings(settings);
  }, [settings]);

  function updateSetting(partial) {
    setSettings((prev) => ({ ...prev, ...partial }));
  }

  return (
    <div className="accessibility-controls">
      <button
        type="button"
        className="btn-icon"
        aria-expanded={open}
        aria-controls="accessibility-panel"
        aria-label="Open accessibility settings"
        onClick={() => setOpen((value) => !value)}
      >
        <i className="bi bi-universal-access-circle" />
      </button>

      {open && (
        <div id="accessibility-panel" className="accessibility-panel" role="dialog" aria-label="Accessibility settings">
          <div className="accessibility-panel-header">
            <strong>Accessibility</strong>
            <button
              type="button"
              className="btn-icon small"
              aria-label="Close accessibility settings"
              onClick={() => setOpen(false)}
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>

          <label className="accessibility-row">
            <span>Dark mode</span>
            <input
              type="checkbox"
              checked={settings.theme === 'dark'}
              onChange={(event) => updateSetting({ theme: event.target.checked ? 'dark' : 'light' })}
            />
          </label>

          <label className="accessibility-row">
            <span>Text size</span>
            <select
              value={settings.fontScale}
              onChange={(event) => updateSetting({ fontScale: event.target.value })}
            >
              <option value="normal">Normal</option>
              <option value="large">Large</option>
              <option value="larger">Largest</option>
            </select>
          </label>

          <label className="accessibility-row">
            <span>High contrast</span>
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={(event) => updateSetting({ highContrast: event.target.checked })}
            />
          </label>

          <label className="accessibility-row">
            <span>Reduce motion</span>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(event) => updateSetting({ reducedMotion: event.target.checked })}
            />
          </label>
        </div>
      )}
    </div>
  );
}

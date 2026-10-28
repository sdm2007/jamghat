import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, Check, Settings2, X } from 'lucide-react';

export const COOKIE_STORAGE_KEY = 'mh-cookie-consent';

export function getStoredCookieConsent() {
  try {
    return JSON.parse(localStorage.getItem(COOKIE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function CookieBanner({ onOpenPolicy }) {
  const [showBanner, setShowBanner] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Always locked to true
    functional: true,
    analytics: false
  });

  useEffect(() => {
    const existing = getStoredCookieConsent();
    if (!existing) {
      setShowBanner(true);
    }
  }, []);

  const saveConsent = (prefs) => {
    localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify({
      ...prefs,
      timestamp: new Date().toISOString()
    }));
    setShowBanner(false);
    setShowCustomizer(false);
  };

  const handleAcceptAll = () => {
    saveConsent({ essential: true, functional: true, analytics: true });
  };

  const handleRejectOptional = () => {
    saveConsent({ essential: true, functional: false, analytics: false });
  };

  const handleSaveCustom = () => {
    saveConsent(preferences);
  };

  if (!showBanner) return null;

  return (
    <>
      <aside className="cookie-banner-panel" aria-label="Cookie consent banner">
        <div className="cookie-banner-content">
          <div className="cookie-banner-icon">
            <Cookie size={22} />
          </div>
          <div className="cookie-banner-text">
            <b>We respect your privacy & data choices</b>
            <p>
              Jamghat uses essential cookies to keep you signed in securely and remember your location settings.
              Learn more in our{' '}
              <button type="button" className="inline-link" onClick={() => onOpenPolicy('cookies')}>
                Cookie Policy
              </button>{' '}
              and{' '}
              <button type="button" className="inline-link" onClick={() => onOpenPolicy('privacy')}>
                Privacy Policy
              </button>.
            </p>
          </div>
        </div>
        <div className="cookie-banner-actions">
          <button type="button" className="secondary small" onClick={() => setShowCustomizer(true)}>
            <Settings2 size={14} /> Customize
          </button>
          <button type="button" className="secondary small" onClick={handleRejectOptional}>
            Reject Optional
          </button>
          <button type="button" className="primary small" onClick={handleAcceptAll}>
            <Check size={14} /> Accept All
          </button>
        </div>
      </aside>

      {showCustomizer && (
        <div className="modal-backdrop" onClick={() => setShowCustomizer(false)}>
          <div className="auth-modal cookie-customizer-modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCustomizer(false)}>
              <X size={18} />
            </button>
            <span className="eyebrow">PREFERENCES</span>
            <h2>Cookie Settings</h2>
            <p>Choose which technologies you want to permit on this device.</p>

            <div className="cookie-toggle-row">
              <div>
                <b>Strictly Essential</b>
                <small>Session tokens, CSRF protection, and security headers. Cannot be disabled.</small>
              </div>
              <input type="checkbox" checked disabled />
            </div>

            <div className="cookie-toggle-row">
              <div>
                <b>Functional & Location</b>
                <small>Preserves UI language, light/dark theme, and cached coordinates for distance calculations.</small>
              </div>
              <input
                type="checkbox"
                checked={preferences.functional}
                onChange={e => setPreferences(p => ({ ...p, functional: e.target.checked }))}
              />
            </div>

            <div className="cookie-toggle-row">
              <div>
                <b>Performance & Telemetry</b>
                <small>Anonymous error reporting to help resolve broken search and map listings.</small>
              </div>
              <input
                type="checkbox"
                checked={preferences.analytics}
                onChange={e => setPreferences(p => ({ ...p, analytics: e.target.checked }))}
              />
            </div>

            <button type="button" className="primary full" onClick={handleSaveCustom}>
              Save Preferences
            </button>
          </div>
        </div>
      )}
    </>
  );
}
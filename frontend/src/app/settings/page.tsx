'use client';

import React, { useEffect, useState } from 'react';
import {
  Key,
  Globe,
  Clock,
  Trash2,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { api, SearchPreference } from '@/lib/api';

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<SearchPreference | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-flash-lite-latest');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function load() {
      try {
        const pref = await api.getPreferences();
        setPreferences(pref);
      } catch (e) {}
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!preferences) return;
    setIsSaving(true);
    try {
      await api.updatePreferences(preferences);
      showToast('Settings saved successfully!');
    } catch (e: any) {
      showToast('Failed to save settings: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearLogs = async () => {
    if (confirm('Clear all audit execution logs?')) {
      try {
        await api.clearLogs();
        showToast('Execution logs cleared.');
      } catch (e) {
        showToast('Failed to clear logs.');
      }
    }
  };

  if (!preferences) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
        Loading settings...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            zIndex: 999,
            background: 'var(--surface-glass)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--apple-blue)',
            color: 'var(--text-primary)',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.875rem',
            fontWeight: 500,
          }}
        >
          <CheckCircle2 size={16} color="var(--apple-green)" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em' }}>
          System Settings & Credentials
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Manage Google AI Studio API key, Jobstreet session authentication, and anti-bot safety parameters.
        </p>
      </div>

      {/* SECTION 1: GOOGLE AI STUDIO */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--apple-blue)', fontWeight: 700, fontSize: '1rem' }}>
          <Key size={18} />
          <span>Google AI Studio API Key</span>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            Gemini API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="apple-input"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.35rem' }}>
            API key is stored securely in backend server environment (`.env`).
          </p>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            Active AI Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="apple-input"
            style={{ maxWidth: '440px' }}
          >
            <option value="gemini-flash-lite-latest">Gemini Flash-Lite Latest (Cheapest / Ultra Fast ~ $0.075/1M)</option>
            <option value="gemini-flash-latest">Gemini Flash Latest (High Speed & Precision)</option>
            <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash-Lite (Next-Gen Preview)</option>
            <option value="gemini-pro-latest">Gemini Pro Latest (Deep Reasoning)</option>
          </select>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.35rem' }}>
            💡 <strong>Gemini Flash-Lite</strong> is the fastest and lowest-cost model (and 100% Free on Google AI Studio Free Tier up to 1,500 requests/day).
          </p>
        </div>
      </div>

      {/* SECTION 2: JOBSTREET CREDENTIALS & SESSION */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--apple-green)', fontWeight: 700, fontSize: '1rem' }}>
          <Globe size={18} />
          <span>Jobstreet Account Session (Playwright Automation)</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Jobstreet Account Email
            </label>
            <input
              type="email"
              placeholder="user@email.com"
              value={preferences.jobstreetEmail || ''}
              onChange={(e) => setPreferences({ ...preferences, jobstreetEmail: e.target.value })}
              className="apple-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Jobstreet Password (DB Encrypted)
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              value={preferences.jobstreetPassword || ''}
              onChange={(e) => setPreferences({ ...preferences, jobstreetPassword: e.target.value })}
              className="apple-input"
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
            Session Cookies (Alternative to bypass 2FA / CAPTCHA)
          </label>
          <textarea
            rows={3}
            placeholder="Paste exported session cookies JSON string from your browser here..."
            value={preferences.jobstreetCookies || ''}
            onChange={(e) => setPreferences({ ...preferences, jobstreetCookies: e.target.value })}
            className="apple-input"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
          />
        </div>
      </div>

      {/* SECTION 3: ANTI-BOT SAFETY DELAY */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--apple-amber)', fontWeight: 700, fontSize: '1rem' }}>
          <Clock size={18} />
          <span>Anti-Bot Safety Delays (Humanized Intervals)</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Minimum Delay (Seconds)
            </label>
            <input
              type="number"
              min={10}
              max={180}
              value={preferences.delayBetweenAppsMin}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  delayBetweenAppsMin: parseInt(e.target.value, 10) || 30,
                })
              }
              className="apple-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Maximum Delay (Seconds)
            </label>
            <input
              type="number"
              min={20}
              max={300}
              value={preferences.delayBetweenAppsMax}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  delayBetweenAppsMax: parseInt(e.target.value, 10) || 90,
                })
              }
              className="apple-input"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button onClick={handleClearLogs} className="btn-secondary" style={{ color: 'var(--apple-red)' }}>
          <Trash2 size={15} />
          <span>Clear Execution Logs</span>
        </button>

        <button onClick={handleSave} disabled={isSaving} className="btn-primary">
          <Save size={16} />
          <span>{isSaving ? 'Saving...' : 'Save All Settings'}</span>
        </button>
      </div>
    </div>
  );
}

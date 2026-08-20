'use client';

import React, { useEffect, useState } from 'react';
import {
  Key,
  Globe,
  Clock,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Database,
  Briefcase,
  Sparkles,
  X,
} from 'lucide-react';
import { api, SearchPreference } from '@/lib/api';

interface ScraperStats {
  discoveredCount: number;
  skippedCount: number;
  appliedCount: number;
  totalStored: number;
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<SearchPreference | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-flash-lite-latest');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Scraper data management state
  const [stats, setStats] = useState<ScraperStats | null>(null);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadStats = async () => {
    try {
      const data = await api.getScraperStats();
      setStats(data);
    } catch (e) {
      console.debug('Failed to load scraper stats:', e);
    }
  };

  useEffect(() => {
    async function load() {
      try {
        const pref = await api.getPreferences();
        setPreferences(pref);
        loadStats();
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

  const handleExecutePurge = async () => {
    setIsPurging(true);
    try {
      const res = await api.purgeScrapedJobs();
      showToast(`Purged ${res.deletedCount} discovered & skipped jobs! Reset to 0.`);
      setIsPurgeModalOpen(false);
      await loadStats();
    } catch (err: any) {
      showToast('Failed to purge jobs: ' + err.message);
    } finally {
      setIsPurging(false);
    }
  };

  if (!preferences) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
        Loading settings...
      </div>
    );
  }

  const purgeTargetCount = (stats?.discoveredCount || 0) + (stats?.skippedCount || 0);

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
          System Settings & Data Management
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
          Manage Google AI Studio API key, Jobstreet session authentication, and scraped job data storage.
        </p>
      </div>

      {/* SECTION 1: DATA & SCRAPER DATABASE MANAGEMENT */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--apple-blue)', fontWeight: 700, fontSize: '1rem' }}>
            <Database size={18} />
            <span>Scraped Jobs & Database Storage</span>
          </div>

          <button
            type="button"
            onClick={loadStats}
            title="Refresh database statistics"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '0.25rem',
            }}
          >
            <RefreshCw size={15} />
          </button>
        </div>

        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Discovered matching jobs from LinkedIn & Jobstreet are automatically remembered in PostgreSQL so subsequent scrapes do not re-evaluate duplicates or re-trigger AI API quotas.
        </p>

        {/* Live Stored Data Statistics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div style={{ background: 'var(--surface-sunken)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Unapplied Discoveries</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--apple-blue)', marginTop: '0.25rem' }}>
              {stats ? stats.discoveredCount : '...'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>Available in feed</div>
          </div>

          <div style={{ background: 'var(--surface-sunken)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Skipped Jobs</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {stats ? stats.skippedCount : '...'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>Hidden from feed</div>
          </div>

          <div style={{ background: 'var(--surface-sunken)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Applications</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--apple-green)', marginTop: '0.25rem' }}>
              {stats ? stats.appliedCount : '...'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>Safe in pipeline</div>
          </div>
        </div>

        {/* Purge Reset Action */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Want to clear all previous scrape results and start fresh?
          </div>

          <button
            type="button"
            onClick={() => setIsPurgeModalOpen(true)}
            disabled={purgeTargetCount === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              fontWeight: 700,
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              cursor: purgeTargetCount === 0 ? 'not-allowed' : 'pointer',
              opacity: purgeTargetCount === 0 ? 0.5 : 1,
            }}
          >
            <Trash2 size={14} />
            <span>Reset Scraped Jobs to 0 ({purgeTargetCount})</span>
          </button>
        </div>
      </div>

      {/* SECTION 2: GOOGLE AI STUDIO */}
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

      {/* SECTION 3: JOBSTREET CREDENTIALS & SESSION */}
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

      {/* SECTION 4: ANTI-BOT SAFETY DELAY */}
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

      {/* PURGE CONFIRMATION MODAL */}
      {isPurgeModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setIsPurgeModalOpen(false)}
        >
          <div
            style={{
              background: 'var(--surface-elevated, #18181b)',
              border: '1px solid var(--border-subtle, #27272a)',
              borderRadius: '1.5rem',
              padding: '2rem',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444' }}>
                <div style={{ padding: '0.6rem', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '1rem' }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Reset Scraped Jobs to 0?
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
                    This will permanently clear previously discovered matches.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPurgeModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Details */}
            <div style={{ background: 'var(--surface-sunken, #09090b)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid var(--border-subtle, #27272a)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Discovered matches to delete:</span>
                <strong style={{ color: '#ef4444' }}>{stats?.discoveredCount || 0} jobs</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Skipped entries to clear:</span>
                <strong style={{ color: '#ef4444' }}>{stats?.skippedCount || 0} jobs</strong>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle, #27272a)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Active applications preserved:</span>
                <strong style={{ color: 'var(--apple-green, #10b981)' }}>{stats?.appliedCount || 0} (Safe & Protected)</strong>
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              🛡️ <strong>Safety Guarantee:</strong> Any jobs you have tracked or applied to in your pipeline will remain intact. Only unapplied feed discoveries will be removed.
            </p>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setIsPurgeModalOpen(false)}
                className="btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecutePurge}
                disabled={isPurging}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: isPurging ? 'wait' : 'pointer',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                }}
              >
                {isPurging ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Purging...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    <span>Yes, Purge {purgeTargetCount} Jobs</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import {
  User,
  Sliders,
  Save,
  Plus,
  X,
  CheckCircle2,
  Briefcase,
} from 'lucide-react';
import { api, CandidateProfile, SearchPreference } from '@/lib/api';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile');
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [preferences, setPreferences] = useState<SearchPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newLoc, setNewLoc] = useState('');
  const [newBlacklistComp, setNewBlacklistComp] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [profData, prefData] = await Promise.all([
          api.getProfile(),
          api.getPreferences(),
        ]);
        setProfile(profData);
        setPreferences(prefData);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      const updated = await api.updateProfile(profile);
      setProfile(updated);
      showToast('Candidate profile saved successfully!');
    } catch (e: any) {
      showToast('Failed to save profile: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!preferences) return;
    setIsSaving(true);
    try {
      const updated = await api.updatePreferences(preferences);
      setPreferences(updated);
      showToast('Search criteria & preferences saved successfully!');
    } catch (e: any) {
      showToast('Failed to save criteria: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Skill Helpers
  const addSkill = () => {
    if (newSkill.trim() && profile) {
      setProfile({
        ...profile,
        skills: [...(profile.skills || []), newSkill.trim()],
      });
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => {
    if (profile) {
      const copy = [...profile.skills];
      copy.splice(index, 1);
      setProfile({ ...profile, skills: copy });
    }
  };

  // Tag helpers for preferences
  const addRole = () => {
    if (newRole.trim() && preferences) {
      setPreferences({
        ...preferences,
        targetRoles: [...(preferences.targetRoles || []), newRole.trim()],
      });
      setNewRole('');
    }
  };

  const removeRole = (index: number) => {
    if (preferences) {
      const copy = [...preferences.targetRoles];
      copy.splice(index, 1);
      setPreferences({ ...preferences, targetRoles: copy });
    }
  };

  const addLocation = () => {
    if (newLoc.trim() && preferences) {
      setPreferences({
        ...preferences,
        targetLocations: [...(preferences.targetLocations || []), newLoc.trim()],
      });
      setNewLoc('');
    }
  };

  const removeLocation = (index: number) => {
    if (preferences) {
      const copy = [...preferences.targetLocations];
      copy.splice(index, 1);
      setPreferences({ ...preferences, targetLocations: copy });
    }
  };

  const addBlacklistCompany = () => {
    if (newBlacklistComp.trim() && preferences) {
      setPreferences({
        ...preferences,
        blacklistedCompanies: [...(preferences.blacklistedCompanies || []), newBlacklistComp.trim()],
      });
      setNewBlacklistComp('');
    }
  };

  const removeBlacklistCompany = (index: number) => {
    if (preferences) {
      const copy = [...preferences.blacklistedCompanies];
      copy.splice(index, 1);
      setPreferences({ ...preferences, blacklistedCompanies: copy });
    }
  };

  if (isLoading || !profile || !preferences) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
        Loading profile data...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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

      {/* Header & Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em' }}>
            Profile & Search Criteria
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Manage candidate qualifications and tune AI filter parameters for optimal job matching.
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            padding: '0.3rem',
            background: 'var(--surface-glass-card)',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.5rem 1.15rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'profile' ? 600 : 500,
              background: activeTab === 'profile' ? 'var(--apple-blue)' : 'transparent',
              color: activeTab === 'profile' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <User size={15} />
            <span>Candidate Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.5rem 1.15rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: activeTab === 'preferences' ? 600 : 500,
              background: activeTab === 'preferences' ? 'var(--apple-blue)' : 'transparent',
              color: activeTab === 'preferences' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <Sliders size={15} />
            <span>Criteria & Safety Limits</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CANDIDATE PROFILE */}
      {activeTab === 'profile' && (
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Full Name
              </label>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="apple-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Professional Headline / Title
              </label>
              <input
                type="text"
                value={profile.headline || ''}
                onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
                className="apple-input"
                placeholder="e.g. Senior Fullstack Engineer"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Email Address
              </label>
              <input
                type="email"
                value={profile.email || ''}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="apple-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Phone Number / WhatsApp
              </label>
              <input
                type="text"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="apple-input"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Professional Summary
            </label>
            <textarea
              rows={4}
              value={profile.summary || ''}
              onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
              className="apple-input"
              style={{ lineHeight: 1.6 }}
            />
          </div>

          {/* Skills Management */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Skills & Competencies (Tag Cloud)
            </label>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
              {profile.skills?.map((skill, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.3rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--apple-blue-soft)',
                    color: 'var(--apple-blue)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  <span>{skill}</span>
                  <X
                    size={13}
                    style={{ cursor: 'pointer' }}
                    onClick={() => removeSkill(idx)}
                  />
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '400px' }}>
              <input
                type="text"
                placeholder="Add new skill..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSkill()}
                className="apple-input"
                style={{ fontSize: '0.8rem' }}
              />
              <button onClick={addSkill} className="btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {/* Work Experience Preview */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.95rem' }}>
              <Briefcase size={16} color="var(--apple-blue)" /> Work Experience History
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {profile.experiences && profile.experiences.length > 0 ? (
                profile.experiences.map((exp: any, idx: number) => (
                  <div key={idx} className="glass-card" style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {exp.title} • {exp.company}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        {exp.duration}
                      </span>
                    </div>
                    {exp.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.4rem', lineHeight: 1.5 }}>
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  No experience history available yet. Upload a resume for automatic extraction.
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button onClick={handleSaveProfile} disabled={isSaving} className="btn-primary">
              <Save size={16} />
              <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: SEARCH PREFERENCES & SAFETY LIMITS */}
      {activeTab === 'preferences' && (
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Target Roles */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Target Roles & Positions
            </label>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
              AI prioritizes searching Jobstreet postings matching these keywords.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.75rem' }}>
              {preferences.targetRoles?.map((role, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.3rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--apple-green-soft)',
                    color: 'var(--apple-green)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  <span>{role}</span>
                  <X size={13} style={{ cursor: 'pointer' }} onClick={() => removeRole(idx)} />
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '400px' }}>
              <input
                type="text"
                placeholder="Add target role..."
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addRole()}
                className="apple-input"
                style={{ fontSize: '0.8rem' }}
              />
              <button onClick={addRole} className="btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {/* Target Locations */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Target Locations
            </label>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.75rem' }}>
              {preferences.targetLocations?.map((loc, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.3rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--apple-purple-soft)',
                    color: 'var(--apple-purple)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  <span>{loc}</span>
                  <X size={13} style={{ cursor: 'pointer' }} onClick={() => removeLocation(idx)} />
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '400px' }}>
              <input
                type="text"
                placeholder="Add city or country..."
                value={newLoc}
                onChange={(e) => setNewLoc(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addLocation()}
                className="apple-input"
                style={{ fontSize: '0.8rem' }}
              />
              <button onClick={addLocation} className="btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          {/* Match Score Threshold Slider */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  Minimum Match Score Threshold
                </strong>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                  Jobs will only be applied if AI evaluation score meets or exceeds this threshold.
                </p>
              </div>
              <span
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--apple-blue)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {preferences.matchThreshold}%
              </span>
            </div>

            <input
              type="range"
              min={50}
              max={95}
              step={5}
              value={preferences.matchThreshold}
              onChange={(e) => setPreferences({ ...preferences, matchThreshold: parseInt(e.target.value, 10) })}
              style={{ width: '100%', accentColor: 'var(--apple-blue)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
              <span>50% (Flexible)</span>
              <span>70% (Recommended Standard)</span>
              <span>95% (Strict Alignment)</span>
            </div>
          </div>

          {/* Safety Quota & Delays */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                Maximum Daily Application Quota
              </strong>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Protects account from portal bot detection.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={preferences.maxDailyApplications}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      maxDailyApplications: parseInt(e.target.value, 10) || 15,
                    })
                  }
                  className="apple-input"
                  style={{ width: '100px', fontSize: '0.9rem', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                  applications / day
                </span>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                Simulation Mode (Dry-Run)
              </strong>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Tests full AI reasoning and generation without submitting real applications.
              </p>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={preferences.dryRunMode}
                  onChange={(e) => setPreferences({ ...preferences, dryRunMode: e.target.checked })}
                  style={{ accentColor: 'var(--apple-blue)', transform: 'scale(1.2)' }}
                />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: preferences.dryRunMode ? 'var(--apple-blue)' : 'var(--text-secondary)' }}>
                  {preferences.dryRunMode ? 'Active (Safe for testing)' : 'Inactive (Live Submissions)'}
                </span>
              </label>
            </div>
          </div>

          {/* Blacklist Companies */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Company Blacklist (Never Apply)
            </label>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.75rem' }}>
              {preferences.blacklistedCompanies?.map((comp, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.3rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--apple-red-soft)',
                    color: 'var(--apple-red)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  <span>{comp}</span>
                  <X size={13} style={{ cursor: 'pointer' }} onClick={() => removeBlacklistCompany(idx)} />
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', maxWidth: '400px' }}>
              <input
                type="text"
                placeholder="Company name to blacklist..."
                value={newBlacklistComp}
                onChange={(e) => setNewBlacklistComp(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addBlacklistCompany()}
                className="apple-input"
                style={{ fontSize: '0.8rem' }}
              />
              <button onClick={addBlacklistCompany} className="btn-secondary" style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}>
                <Plus size={14} /> Add
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button onClick={handleSavePreferences} disabled={isSaving} className="btn-primary">
              <Save size={16} />
              <span>{isSaving ? 'Saving...' : 'Save Criteria & Safety Settings'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

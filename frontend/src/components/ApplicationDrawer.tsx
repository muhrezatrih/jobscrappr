'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  Building2,
  MapPin,
  Banknote,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { JobApplication } from '@/lib/api';
import { StatusBadge } from './StatusBadge';

interface ApplicationDrawerProps {
  application: JobApplication | null;
  onClose: () => void;
}

export function ApplicationDrawer({ application, onClose }: ApplicationDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'match' | 'coverLetter' | 'screening' | 'description'>('match');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!application) return null;

  const copyCoverLetter = () => {
    if (application.customCoverLetter) {
      navigator.clipboard.writeText(application.customCoverLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const score = application.matchScore || 0;
  const scoreColor =
    score >= 80 ? 'var(--apple-green)' : score >= 60 ? 'var(--apple-blue)' : 'var(--apple-amber)';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          height: '100%',
          background: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          animation: 'slideLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--surface-glass)',
            backdropFilter: 'blur(20px)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                <StatusBadge status={application.status} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {application.portal} • {new Date(application.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.25 }}>
                {application.jobTitle}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Building2 size={14} color="var(--apple-blue)" /> {application.companyName}
                </span>
                {application.location && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={14} color="var(--apple-green)" /> {application.location}
                  </span>
                )}
                {application.salaryInfo && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Banknote size={14} color="var(--apple-amber)" /> {application.salaryInfo}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--surface-glass-card)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.25rem' }}>
            {[
              { id: 'match', label: 'AI Evaluation', icon: Sparkles },
              { id: 'coverLetter', label: 'Cover Letter', icon: FileText },
              { id: 'screening', label: 'Screening Q&A', icon: HelpCircle },
              { id: 'description', label: 'Job Description', icon: Building2 },
            ].map((tab) => {
              const active = activeTab === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.85rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    fontWeight: active ? 600 : 500,
                    color: active ? 'var(--apple-blue)' : 'var(--text-secondary)',
                    background: active ? 'var(--apple-blue-soft)' : 'transparent',
                    border: 'none',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <TabIcon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Drawer Body Content */}
        <div style={{ padding: '1.5rem', flex: 1 }}>
          {/* TAB 1: MATCH EVALUATION */}
          {activeTab === 'match' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Match Score Card */}
              <div
                className="glass-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  padding: '1.5rem',
                  border: `1px solid ${scoreColor}`,
                  background: 'var(--surface-glass-card)',
                }}
              >
                {/* Score Number Circle */}
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    border: `4px solid ${scoreColor}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: `0 0 20px ${scoreColor}33`,
                  }}
                >
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {score}%
                  </span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Match
                  </span>
                </div>

                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                    {score >= 70 ? 'Highly Recommended by AI' : 'Partial Match'}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {application.matchReason || 'AI evaluation based on candidate core skills and experience alignment.'}
                  </p>
                </div>
              </div>

              {/* Strengths & Missing Gaps Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Strengths */}
                <div className="glass-card" style={{ padding: '1.15rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem', color: 'var(--apple-green)', fontWeight: 600, fontSize: '0.85rem' }}>
                    <CheckCircle2 size={16} /> Key Strengths
                  </div>
                  <ul style={{ paddingLeft: '1.1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {application.strengths && application.strengths.length > 0 ? (
                      application.strengths.map((str, idx) => <li key={idx}>{str}</li>)
                    ) : (
                      <li>Core qualifications align well with requirements.</li>
                    )}
                  </ul>
                </div>

                {/* Skill Gaps */}
                <div className="glass-card" style={{ padding: '1.15rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem', color: 'var(--apple-amber)', fontWeight: 600, fontSize: '0.85rem' }}>
                    <AlertTriangle size={16} /> Notes / Missing Skills
                  </div>
                  <ul style={{ paddingLeft: '1.1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {application.skillGaps && application.skillGaps.length > 0 ? (
                      application.skillGaps.map((gap, idx) => <li key={idx}>{gap}</li>)
                    ) : (
                      <li>No critical skill gaps identified.</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Action Link to Jobstreet */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <a
                  href={application.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ fontSize: '0.825rem' }}
                >
                  Open Original Job Posting <ExternalLink size={14} />
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: COVER LETTER */}
          {activeTab === 'coverLetter' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Tailored Cover Letter generated by Gemini AI for {application.jobTitle}.
                </span>
                <button
                  onClick={copyCoverLetter}
                  className="btn-secondary"
                  style={{ padding: '0.4rem 0.85rem', fontSize: '0.775rem' }}
                >
                  {copied ? <Check size={14} color="var(--apple-green)" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied!' : 'Copy Letter'}</span>
                </button>
              </div>

              <div
                className="glass-card"
                style={{
                  padding: '1.5rem',
                  fontFamily: 'inherit',
                  fontSize: '0.875rem',
                  lineHeight: 1.7,
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  background: 'var(--surface-glass-card)',
                  border: '1px solid var(--border-medium)',
                }}
              >
                {application.customCoverLetter || 'No cover letter has been generated for this posting yet.'}
              </div>
            </div>
          )}

          {/* TAB 3: SCREENING QA */}
          {activeTab === 'screening' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Portal screening questions and AI-optimized candidate responses:
              </p>

              {application.screeningAnswers && application.screeningAnswers.length > 0 ? (
                application.screeningAnswers.map((qa, index) => (
                  <div key={index} className="glass-card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginBottom: '0.5rem' }}>
                      <span
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: 'var(--apple-blue-soft)',
                          color: 'var(--apple-blue)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        Q{index + 1}
                      </span>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {qa.question}
                      </strong>
                    </div>

                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        background: 'var(--surface-glass-card-hover)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        color: 'var(--text-primary)',
                        marginTop: '0.5rem',
                        borderLeft: '3px solid var(--apple-blue)',
                      }}
                    >
                      <strong>AI Answer:</strong> {qa.answer}
                      {qa.reasoning && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.35rem' }}>
                          <em>Rationale: {qa.reasoning}</em>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No screening questions required for this application.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: JOB DESCRIPTION */}
          {activeTab === 'description' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  Job Description
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                  {application.jobDescription || 'Description not available.'}
                </p>
              </div>

              {application.requirements && (
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                    Role Qualifications
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {application.requirements}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

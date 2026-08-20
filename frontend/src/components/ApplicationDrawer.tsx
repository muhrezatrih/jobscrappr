'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  Building2,
  MapPin,
  DollarSign,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  FileText,
  HelpCircle,
  Calendar,
  User,
  MessageSquare,
  History,
  Save,
  Trash2,
} from 'lucide-react';
import { JobApplication, ApplicationStage, api } from '@/lib/api';
import { StatusBadge } from './StatusBadge';

interface ApplicationDrawerProps {
  application: JobApplication | null;
  onClose: () => void;
  onUpdate?: () => void;
}

const STAGES: Array<{ id: ApplicationStage; label: string }> = [
  { id: 'APPLIED', label: 'Applied' },
  { id: 'HR_SCREENING', label: 'HR Screening' },
  { id: 'TECHNICAL_TEST', label: 'Tech Test' },
  { id: 'FINAL_INTERVIEW', label: 'Final Round' },
  { id: 'OFFER_RECEIVED', label: 'Offer 🎉' },
  { id: 'OFFER_ACCEPTED', label: 'Accepted' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'GHOSTED', label: 'Ghosted' },
];

export function ApplicationDrawer({ application, onClose, onUpdate }: ApplicationDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'match' | 'notes' | 'history' | 'description' | 'coverLetter'>('match');

  // Tracking Form Fields
  const [notes, setNotes] = useState('');
  const [recruiterName, setRecruiterName] = useState('');
  const [recruiterContact, setRecruiterContact] = useState('');
  const [offeredSalary, setOfferedSalary] = useState('');
  const [targetSalary, setTargetSalary] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (application) {
      setNotes(application.notes || '');
      setRecruiterName(application.recruiterName || '');
      setRecruiterContact(application.recruiterContact || '');
      setOfferedSalary(application.offeredSalary || '');
      setTargetSalary(application.targetSalary || '');
      setInterviewDate(application.interviewDate ? application.interviewDate.split('T')[0] : '');
      setNextFollowUpDate(application.nextFollowUpDate ? application.nextFollowUpDate.split('T')[0] : '');
    }
  }, [application]);

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

  const handleStageChange = async (newStage: ApplicationStage) => {
    try {
      await api.updateStatus(application.id, newStage, `Moved stage to ${newStage}`);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error changing stage:', err);
    }
  };

  const handleSaveDetails = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await api.updateDetails(application.id, {
        notes,
        recruiterName,
        recruiterContact,
        offeredSalary,
        targetSalary,
        interviewDate: interviewDate || null,
        nextFollowUpDate: nextFollowUpDate || null,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Error saving details:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Remove ${application.jobTitle} from pipeline?`)) {
      try {
        await api.deleteApplication(application.id);
        onClose();
        if (onUpdate) onUpdate();
      } catch (err) {
        console.error('Error deleting application:', err);
      }
    }
  };

  const copyCoverLetter = () => {
    if (application.customCoverLetter) {
      navigator.clipboard.writeText(application.customCoverLetter);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-y-auto animate-slideLeft"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl sticky top-0 z-20">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <StatusBadge status={application.status} />
                <span className="text-xs text-zinc-400">
                  {application.portal} • Tracked {new Date(application.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                {application.jobTitle}
              </h3>
              <div className="flex items-center space-x-3 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center space-x-1 font-medium">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{application.companyName}</span>
                </span>
                {application.location && (
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{application.location}</span>
                  </span>
                )}
                {application.salaryInfo && (
                  <span className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{application.salaryInfo}</span>
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <a
                href={application.jobUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 text-zinc-400 hover:text-blue-600 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Open Original Job Posting"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={handleDelete}
                className="p-2 text-zinc-400 hover:text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                title="Delete Application"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-600 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Stage Progression Bar */}
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
            <span className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
              Move Pipeline Stage:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map((s) => {
                const isActive = application.status === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleStageChange(s.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-2 mt-4">
            {[
              { id: 'match', label: 'AI Match Analysis', icon: Sparkles },
              { id: 'notes', label: 'Notes & Tracking', icon: MessageSquare },
              { id: 'history', label: 'Stage History', icon: History },
              { id: 'description', label: 'Job Description', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Drawer Body Content */}
        <div className="p-6 space-y-6">
          {/* TAB 1: AI Match Analysis */}
          {activeTab === 'match' && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Candidate Compatibility
                  </span>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                    Evaluated by Gemini AI against your CV
                  </p>
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {application.matchScore}%
                </div>
              </div>

              {application.matchReason && (
                <div className="p-4 bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 space-y-2">
                  <h4 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase">
                    AI Evaluation Rationale
                  </h4>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {application.matchReason}
                  </p>
                </div>
              )}

              {application.strengths && application.strengths.length > 0 && (
                <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/60 dark:border-emerald-800/60 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Matching Strengths</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-emerald-900 dark:text-emerald-200 font-medium">
                    {application.strengths.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Notes & Tracking */}
          {activeTab === 'notes' && (
            <form onSubmit={handleSaveDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                  Interview Notes & Journal
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Discussed microservices architecture. Round 2 scheduled next Tuesday with Engineering Manager..."
                  className="w-full p-3.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Recruiter Name
                  </label>
                  <input
                    type="text"
                    value={recruiterName}
                    onChange={(e) => setRecruiterName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Recruiter Contact (Email / LinkedIn)
                  </label>
                  <input
                    type="text"
                    value={recruiterContact}
                    onChange={(e) => setRecruiterContact(e.target.value)}
                    placeholder="sarah@company.com"
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Interview Date
                  </label>
                  <input
                    type="date"
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Next Follow-up Date
                  </label>
                  <input
                    type="date"
                    value={nextFollowUpDate}
                    onChange={(e) => setNextFollowUpDate(e.target.value)}
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Offered Salary
                  </label>
                  <input
                    type="text"
                    value={offeredSalary}
                    onChange={(e) => setOfferedSalary(e.target.value)}
                    placeholder="e.g. Rp 30.000.000"
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Target / Asking Salary
                  </label>
                  <input
                    type="text"
                    value={targetSalary}
                    onChange={(e) => setTargetSalary(e.target.value)}
                    placeholder="e.g. Rp 28.000.000"
                    className="w-full p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                {saveSuccess && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center space-x-1">
                    <Check className="w-4 h-4" />
                    <span>Saved!</span>
                  </span>
                )}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center space-x-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Notes & Details'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: Stage History Timeline */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Application Lifecycle Progression
              </h4>

              {(!application.stageHistory || application.stageHistory.length === 0) ? (
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl text-xs text-zinc-500 text-center">
                  Initial stage recorded as {application.status}
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-6">
                  {application.stageHistory.map((item, idx) => (
                    <div key={item.id || idx} className="relative">
                      <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white dark:border-zinc-900" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            {item.toStatus}
                          </span>
                          <span className="text-[10px] text-zinc-400">
                            {new Date(item.changedAt).toLocaleString()}
                          </span>
                        </div>
                        {item.note && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {item.note}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Job Description */}
          {activeTab === 'description' && (
            <div className="p-5 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {application.jobDescription || 'Full job description not available.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

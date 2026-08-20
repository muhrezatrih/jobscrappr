'use client';

import React, { useState } from 'react';
import { JobApplication, ApplicationStage, api } from '@/lib/api';
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  ExternalLink,
  Calendar,
  Sparkles,
  ChevronRight,
  MoreVertical,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
} from 'lucide-react';

interface KanbanBoardProps {
  applications: JobApplication[];
  onSelectApplication: (app: JobApplication) => void;
  onRefresh: () => void;
}

const STAGES: Array<{
  id: ApplicationStage;
  title: string;
  color: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}> = [
  {
    id: 'APPLIED',
    title: 'Applied',
    color: 'border-blue-500/30 dark:border-blue-500/20',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
    badgeText: 'text-blue-700 dark:text-blue-300',
    description: 'Submitted application',
  },
  {
    id: 'HR_SCREENING',
    title: 'HR Screening',
    color: 'border-purple-500/30 dark:border-purple-500/20',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
    badgeText: 'text-purple-700 dark:text-purple-300',
    description: 'Recruiter call scheduled/done',
  },
  {
    id: 'TECHNICAL_TEST',
    title: 'Tech Test & Interview',
    color: 'border-fuchsia-500/30 dark:border-fuchsia-500/20',
    badgeBg: 'bg-fuchsia-50 dark:bg-fuchsia-950/40 border-fuchsia-200 dark:border-fuchsia-800',
    badgeText: 'text-fuchsia-700 dark:text-fuchsia-300',
    description: 'Coding challenge / Live tech round',
  },
  {
    id: 'FINAL_INTERVIEW',
    title: 'Final Interview',
    color: 'border-pink-500/30 dark:border-pink-500/20',
    badgeBg: 'bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800',
    badgeText: 'text-pink-700 dark:text-pink-300',
    description: 'Leadership / C-level alignment',
  },
  {
    id: 'OFFER_RECEIVED',
    title: 'Offer Received 🎉',
    color: 'border-emerald-500/40 dark:border-emerald-500/30',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    description: 'Compensation package offered',
  },
  {
    id: 'REJECTED',
    title: 'Rejected',
    color: 'border-red-500/30 dark:border-red-500/20',
    badgeBg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800',
    badgeText: 'text-red-700 dark:text-red-300',
    description: 'Not moving forward',
  },
  {
    id: 'GHOSTED',
    title: 'Ghosted',
    color: 'border-zinc-500/30 dark:border-zinc-500/20',
    badgeBg: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700',
    badgeText: 'text-zinc-600 dark:text-zinc-400',
    description: 'No response after 14+ days',
  },
];

export default function KanbanBoard({
  applications,
  onSelectApplication,
  onRefresh,
}: KanbanBoardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [activeMenuAppId, setActiveMenuAppId] = useState<string | null>(null);

  const filteredApps = applications.filter(
    (app) =>
      app.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.location?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    e.dataTransfer.setData('text/plain', appId);
    setDraggedAppId(appId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: ApplicationStage) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData('text/plain');
    if (!appId) return;

    try {
      await api.updateStatus(appId, targetStage, `Moved to ${targetStage} via Kanban drag`);
      onRefresh();
    } catch (err) {
      console.error('Failed to move stage:', err);
    } finally {
      setDraggedAppId(null);
    }
  };

  const handleQuickMove = async (appId: string, targetStage: ApplicationStage) => {
    try {
      await api.updateStatus(appId, targetStage, `Moved to ${targetStage}`);
      setActiveMenuAppId(null);
      onRefresh();
    } catch (err) {
      console.error('Failed to move stage:', err);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Search Header */}
      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tracked applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md rounded-xl border border-zinc-200 dark:border-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Kanban Board Horizontal Columns */}
      <div className="w-full flex space-x-4 overflow-x-auto pb-6 pt-1 select-none">
        {STAGES.map((stage) => {
          const stageApps = filteredApps.filter((a) => a.status === stage.id);

          return (
            <div
              key={stage.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
              className="flex-shrink-0 w-80 bg-zinc-100/60 dark:bg-zinc-900/40 rounded-3xl p-4 border border-zinc-200/70 dark:border-zinc-800/80 flex flex-col min-h-[580px]"
            >
              {/* Stage Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
                    {stage.title}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold border ${stage.badgeBg} ${stage.badgeText}`}
                  >
                    {stageApps.length}
                  </span>
                </div>
              </div>

              {/* Cards Container */}
              <div className="flex-1 flex flex-col space-y-3 overflow-y-auto">
                {stageApps.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800/60 rounded-2xl text-center text-zinc-400 dark:text-zinc-600 text-xs">
                    Drop applications here
                  </div>
                ) : (
                  stageApps.map((app) => (
                    <div
                      key={app.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      onClick={() => onSelectApplication(app)}
                      className={`group relative bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all cursor-grab active:cursor-grabbing ${
                        draggedAppId === app.id ? 'opacity-40 scale-95' : ''
                      }`}
                    >
                      {/* Top Row: Portal & AI Score */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            app.portal === 'LINKEDIN'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                          }`}
                        >
                          {app.portal}
                        </span>

                        {app.matchScore > 0 && (
                          <div className="flex items-center space-x-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full text-[11px] font-bold">
                            <Sparkles className="w-3 h-3" />
                            <span>{app.matchScore}% Match</span>
                          </div>
                        )}
                      </div>

                      {/* Title & Company */}
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                        {app.jobTitle}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center space-x-1 mt-0.5">
                        <Building2 className="w-3 h-3" />
                        <span className="truncate">{app.companyName}</span>
                      </p>

                      {/* Location & Salary */}
                      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400">
                        {app.location && (
                          <span className="flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                            <MapPin className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[120px]">{app.location}</span>
                          </span>
                        )}
                        {app.salaryInfo && (
                          <span className="flex items-center space-x-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md font-medium">
                            <DollarSign className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[130px]">{app.salaryInfo}</span>
                          </span>
                        )}
                      </div>

                      {/* Notes / Interview Date Preview */}
                      {app.interviewDate && (
                        <div className="mt-2.5 flex items-center space-x-1.5 text-[11px] bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 px-2.5 py-1 rounded-xl font-medium border border-pink-200/60 dark:border-pink-800/60">
                          <Calendar className="w-3 h-3" />
                          <span>Interview: {new Date(app.interviewDate).toLocaleDateString()}</span>
                        </div>
                      )}

                      {app.notes && (
                        <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-xl border border-zinc-100 dark:border-zinc-800 line-clamp-2 italic">
                          "{app.notes}"
                        </p>
                      )}

                      {/* Bottom Action Footer */}
                      <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
                        <a
                          href={app.jobUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center space-x-1 text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="text-[10px]">Open Job</span>
                        </a>

                        {/* Quick Stage Mover */}
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuAppId(activeMenuAppId === app.id ? null : app.id)
                            }
                            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-md"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {activeMenuAppId === app.id && (
                            <div className="absolute right-0 bottom-6 w-48 bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-1.5 z-20 space-y-0.5">
                              <span className="block px-2.5 py-1 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                Move to Stage
                              </span>
                              {STAGES.map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() => handleQuickMove(app.id, s.id)}
                                  className="w-full text-left px-2.5 py-1.5 text-xs rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700/60 flex items-center justify-between text-zinc-700 dark:text-zinc-200 font-medium"
                                >
                                  <span>{s.title}</span>
                                  {app.status === s.id && (
                                    <CheckCircle2 className="w-3 h-3 text-blue-500" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

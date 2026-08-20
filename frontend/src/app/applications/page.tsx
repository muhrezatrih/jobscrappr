'use client';

import React, { useEffect, useState } from 'react';
import {
  Search,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Building2,
  Eye,
  Kanban,
  Table as TableIcon,
  Filter,
  Plus,
  RefreshCw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { api, JobApplication } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { ApplicationDrawer } from '@/components/ApplicationDrawer';
import KanbanBoard from '@/components/KanbanBoard';

export default function ApplicationsPage() {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [portal, setPortal] = useState('ALL');
  const [minScore, setMinScore] = useState('');
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const data = await api.getApplications({
        search,
        status: status === 'ALL' ? undefined : status,
        portal: portal === 'ALL' ? undefined : portal,
        minScore: minScore ? minScore : undefined,
        page: viewMode === 'table' ? page : 1,
        limit: viewMode === 'table' ? 20 : 150,
      });
      setApplications(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e) {
      console.error('Failed to load applications:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page, status, portal, minScore, viewMode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this application record?')) {
      try {
        await api.deleteApplication(id);
        fetchApplications();
      } catch (err) {
        alert('Failed to delete');
      }
    }
  };

  return (
    <div className="w-full flex flex-col space-y-6 animate-fadeIn">
      {/* Header & View Mode Switcher */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Job Application Pipeline
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Track, advance stages, and manage interview details across LinkedIn & Jobstreet.
          </p>
        </div>

        {/* View Mode Toggle Button */}
        <div className="flex items-center space-x-2 bg-zinc-200/80 dark:bg-zinc-800/80 p-1 rounded-2xl border border-zinc-200 dark:border-zinc-700">
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'kanban'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'table'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>Table View</span>
          </button>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <KanbanBoard
          applications={applications}
          onSelectApplication={(app) => setSelectedApp(app)}
          onRefresh={fetchApplications}
        />
      ) : (
        /* Table View */
        <div className="space-y-4">
          {/* Table Filters */}
          <form
            onSubmit={handleSearchSubmit}
            className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-4 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-wrap gap-3 items-center"
          >
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by job title or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPLIED">Applied</option>
              <option value="HR_SCREENING">HR Screening</option>
              <option value="TECHNICAL_TEST">Tech Test & Interview</option>
              <option value="FINAL_INTERVIEW">Final Round</option>
              <option value="OFFER_RECEIVED">Offer Received 🎉</option>
              <option value="REJECTED">Rejected</option>
              <option value="GHOSTED">Ghosted</option>
              <option value="SKIPPED">Skipped</option>
            </select>

            <select
              value={portal}
              onChange={(e) => setPortal(e.target.value)}
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold focus:outline-none"
            >
              <option value="ALL">All Portals</option>
              <option value="LINKEDIN">LinkedIn</option>
              <option value="JOBSTREET">Jobstreet</option>
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              Apply Filter
            </button>
          </form>

          {/* Table Container */}
          <div className="bg-white dark:bg-zinc-900/80 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200/80 dark:border-zinc-800 text-zinc-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Job Title & Company</th>
                    <th className="py-3.5 px-4">Portal</th>
                    <th className="py-3.5 px-4">AI Match</th>
                    <th className="py-3.5 px-4">Status / Stage</th>
                    <th className="py-3.5 px-4">Interview Date</th>
                    <th className="py-3.5 px-4">Updated</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-400">
                        No applications found. Scrape new jobs from the Discovery Feed or adjust filters.
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => (
                      <tr
                        key={app.id}
                        onClick={() => setSelectedApp(app)}
                        className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                            {app.jobTitle}
                          </span>
                          <span className="text-zinc-500 dark:text-zinc-400 flex items-center space-x-1 mt-0.5">
                            <Building2 className="w-3 h-3" />
                            <span>{app.companyName}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800">
                            {app.portal}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {app.matchScore > 0 && (
                            <span className="inline-flex items-center space-x-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                              <Sparkles className="w-3 h-3" />
                              <span>{app.matchScore}%</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <StatusBadge status={app.status} />
                        </td>

                        <td className="py-3.5 px-4 text-zinc-500 dark:text-zinc-400">
                          {app.interviewDate
                            ? new Date(app.interviewDate).toLocaleDateString()
                            : '-'}
                        </td>

                        <td className="py-3.5 px-4 text-zinc-400">
                          {new Date(app.updatedAt).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <a
                              href={app.jobUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 text-zinc-400 hover:text-blue-500 rounded-lg"
                              title="Open Original Job Link"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={(e) => handleDelete(e, app.id)}
                              className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-500">
                  Page {page} of {totalPages} ({total} total)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="p-2 border rounded-xl disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-2 border rounded-xl disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Application Detail Drawer */}
      <ApplicationDrawer
        application={selectedApp}
        onClose={() => setSelectedApp(null)}
        onUpdate={fetchApplications}
      />
    </div>
  );
}

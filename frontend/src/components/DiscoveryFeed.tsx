'use client';

import React, { useState } from 'react';
import { EvaluatedScrapedJob, api, JobApplication } from '@/lib/api';
import {
  Search,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Filter,
  Check,
  ChevronDown,
  RefreshCw,
  Plus,
  Globe,
  Award,
  AlertTriangle,
} from 'lucide-react';

interface DiscoveryFeedProps {
  onJobTracked?: (app: JobApplication) => void;
}

type WorkFilterType = 'ALL' | 'REMOTE_ONLY' | 'TARGET_SALARY';

export default function DiscoveryFeed({ onJobTracked }: DiscoveryFeedProps) {
  const [keywords, setKeywords] = useState('Backend Developer');
  const [location, setLocation] = useState('Indonesia');
  const [useLinkedIn, setUseLinkedIn] = useState(true);
  const [useJobstreet, setUseJobstreet] = useState(true);
  const [past24Hours, setPast24Hours] = useState(true);
  const [workFilter, setWorkFilter] = useState<WorkFilterType>('ALL');

  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<EvaluatedScrapedJob[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setHasSearched(true);

    try {
      const portals: ('LINKEDIN' | 'JOBSTREET')[] = [];
      if (useLinkedIn) portals.push('LINKEDIN');
      if (useJobstreet) portals.push('JOBSTREET');

      const results = await api.searchScraper({
        keywords,
        location,
        portals,
        past24Hours,
      });
      setJobs(results);
    } catch (err) {
      console.error('Failed to search and scrape jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyAndTrack = async (job: EvaluatedScrapedJob) => {
    setTrackingId(job.jobId);
    try {
      // 1. Open job posting in new browser tab for the user to apply
      window.open(job.jobUrl, '_blank', 'noopener,noreferrer');

      // 2. Track in database as APPLIED
      const app = await api.trackJob({
        jobId: job.jobId,
        jobTitle: job.title,
        companyName: job.company,
        location: job.location,
        salaryInfo: job.salary || job.estimatedSalaryRange,
        jobUrl: job.jobUrl,
        portal: job.portal,
        jobDescription: job.description,
        matchScore: job.matchScore,
        matchReason: job.matchReason,
        strengths: job.strengths,
        skillGaps: job.skillGaps,
        status: 'APPLIED',
      });

      // Update state locally
      setJobs((prev) =>
        prev.map((j) => (j.jobId === job.jobId ? { ...j, trackedStatus: 'APPLIED', trackedApplicationId: app.id } : j)),
      );

      if (onJobTracked) onJobTracked(app);
    } catch (err) {
      console.error('Error tracking applied job:', err);
    } finally {
      setTrackingId(null);
    }
  };

  const handleSkipJob = async (job: EvaluatedScrapedJob) => {
    try {
      await api.trackJob({
        jobId: job.jobId,
        jobTitle: job.title,
        companyName: job.company,
        location: job.location,
        salaryInfo: job.salary,
        jobUrl: job.jobUrl,
        portal: job.portal,
        matchScore: job.matchScore,
        status: 'SKIPPED',
      });

      setJobs((prev) =>
        prev.map((j) => (j.jobId === job.jobId ? { ...j, trackedStatus: 'SKIPPED' } : j)),
      );
    } catch (err) {
      console.error('Error skipping job:', err);
    }
  };

  // Filter jobs based on active quick-pill
  const filteredJobs = jobs.filter((job) => {
    const isRemote =
      job.workArrangement === 'REMOTE' ||
      job.location.toLowerCase().includes('remote') ||
      job.title.toLowerCase().includes('remote');

    if (workFilter === 'REMOTE_ONLY') {
      return isRemote;
    }

    if (workFilter === 'TARGET_SALARY') {
      // Meets >= 20M or is Remote
      return isRemote || job.salaryFit === 'MEETS_TARGET' || job.salaryFit === 'UNDISCLOSED_ESTIMATED';
    }

    return true;
  });

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Search Header & Filter Controls */}
      <form
        onSubmit={handleSearch}
        className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col space-y-4"
      >
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Job Title or Keywords (e.g. Backend Developer, Golang, Node.js)"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="relative w-full md:w-64">
            <MapPin className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Location (e.g. Indonesia, Remote)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700/80 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold text-sm shadow-md hover:shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Scraping & Evaluating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Scrape Jobs (24h)</span>
              </>
            )}
          </button>
        </div>

        {/* Portal Badges & Preferences Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
          <div className="flex items-center space-x-3">
            <span className="font-medium text-zinc-500 dark:text-zinc-400">Sources:</span>
            <label className="flex items-center space-x-1.5 cursor-pointer bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl">
              <input
                type="checkbox"
                checked={useLinkedIn}
                onChange={(e) => setUseLinkedIn(e.target.checked)}
                className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">LinkedIn (Guest 24h)</span>
            </label>

            <label className="flex items-center space-x-1.5 cursor-pointer bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl">
              <input
                type="checkbox"
                checked={useJobstreet}
                onChange={(e) => setUseJobstreet(e.target.checked)}
                className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Jobstreet (24h)</span>
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-xl font-bold">
              <Globe className="w-3.5 h-3.5" />
              <span>Remote Preferred • Hybrid/Onsite &ge; 20M IDR</span>
            </span>

            <span className="inline-flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-xl font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>24h Only</span>
            </span>
          </div>
        </div>
      </form>

      {/* Quick Filter Pills (Remote vs >= 20M) */}
      {hasSearched && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mr-1">
              Filter View:
            </span>
            <button
              type="button"
              onClick={() => setWorkFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                workFilter === 'ALL'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm'
                  : 'bg-white dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
              }`}
            >
              All Matches ({jobs.length})
            </button>

            <button
              type="button"
              onClick={() => setWorkFilter('REMOTE_ONLY')}
              className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                workFilter === 'REMOTE_ONLY'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Remote Only</span>
            </button>

            <button
              type="button"
              onClick={() => setWorkFilter('TARGET_SALARY')}
              className={`flex items-center space-x-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                workFilter === 'TARGET_SALARY'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>&ge; 20M IDR or Remote</span>
            </button>
          </div>

          <span className="text-xs text-zinc-400">
            Showing {filteredJobs.length} of {jobs.length} postings
          </span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="bg-white/60 dark:bg-zinc-900/60 p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 animate-pulse space-y-4"
            >
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-md w-3/4" />
              <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-md w-1/2" />
              <div className="h-16 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Jobs Feed Grid */}
      {!isLoading && filteredJobs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => {
            const isTracked = !!job.trackedStatus;
            const isRemote =
              job.workArrangement === 'REMOTE' ||
              job.location.toLowerCase().includes('remote') ||
              job.title.toLowerCase().includes('remote');

            return (
              <div
                key={job.jobId}
                className={`bg-white dark:bg-zinc-900/90 rounded-3xl p-5 border shadow-sm transition-all hover:shadow-md flex flex-col justify-between space-y-4 ${
                  job.recommendation === 'STRONG_MATCH'
                    ? 'border-emerald-500/30 hover:border-emerald-500/60'
                    : 'border-zinc-200/90 dark:border-zinc-800 hover:border-blue-500/40'
                }`}
              >
                {/* Top Bar: Portal + Location/Salary Badges + AI Fit Score */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                        job.portal === 'LINKEDIN'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                      }`}
                    >
                      {job.portal}
                    </span>

                    {/* Remote vs Hybrid/Onsite Tag */}
                    {isRemote ? (
                      <span className="flex items-center space-x-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        <Globe className="w-3 h-3" />
                        <span>Remote</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        <Building2 className="w-3 h-3" />
                        <span>{job.workArrangement || 'Hybrid/Onsite'}</span>
                      </span>
                    )}

                    {/* Compensation Fit Tag */}
                    {job.salaryFit === 'MEETS_TARGET' && (
                      <span className="flex items-center space-x-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <Award className="w-3 h-3" />
                        <span>&ge; 20M Target</span>
                      </span>
                    )}

                    {job.salaryFit === 'UNDISCLOSED_ESTIMATED' && (
                      <span className="flex items-center space-x-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                        <span>✨ Est. &ge; 20M</span>
                      </span>
                    )}

                    {job.salaryFit === 'BELOW_TARGET' && (
                      <span className="flex items-center space-x-1 text-[10px] font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                        <AlertTriangle className="w-3 h-3" />
                        <span>&lt; 20M Target</span>
                      </span>
                    )}
                  </div>

                  {/* Glowing AI Fit Score Badge */}
                  <div
                    className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold border flex-shrink-0 ${
                      job.matchScore >= 80
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                        : job.matchScore >= 60
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{job.matchScore}% Match</span>
                  </div>
                </div>

                {/* Job Title & Company */}
                <div>
                  <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                    {job.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    <span className="font-medium flex items-center space-x-1">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{job.company}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{job.location}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{job.postedAt || 'Past 24h'}</span>
                    </span>
                  </div>
                </div>

                {/* Salary Info if available */}
                {(job.salary || job.estimatedSalaryRange) && (
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1 bg-emerald-50/50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-xl border border-emerald-200/50 dark:border-emerald-800/40">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>
                      {job.salary || `Estimated Range: ${job.estimatedSalaryRange}`}
                    </span>
                  </div>
                )}

                {/* AI Rationale Box */}
                <div className="bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl p-3.5 border border-zinc-100 dark:border-zinc-800 text-xs space-y-2">
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                    {job.matchReason}
                  </p>

                  {job.strengths.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {job.strengths.slice(0, 3).map((st, i) => (
                        <span
                          key={i}
                          className="bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-md"
                        >
                          ✓ {st}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  <a
                    href={job.jobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 rounded-xl hover:bg-zinc-200 transition-all flex items-center space-x-1 text-xs"
                    title="View Job Description"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>View JD</span>
                  </a>

                  {isTracked ? (
                    <span className="flex items-center space-x-1.5 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700">
                      <Check className="w-3.5 h-3.5 text-blue-500" />
                      <span>Tracked ({job.trackedStatus})</span>
                    </span>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleSkipJob(job)}
                        className="px-3 py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                      >
                        Skip
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplyAndTrack(job)}
                        disabled={trackingId === job.jobId}
                        className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Apply & Track</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Initial Empty State Guide */}
      {!hasSearched && (
        <div className="bg-white/40 dark:bg-zinc-900/40 rounded-3xl p-12 border border-dashed border-zinc-200 dark:border-zinc-800 text-center flex flex-col items-center justify-center space-y-3">
          <div className="p-4 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-3xl">
            <Search className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-zinc-800 dark:text-zinc-200">
            Ready to find fresh backend jobs?
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md">
            Click <strong>Scrape Jobs (24h)</strong> above to pull live postings from LinkedIn and Jobstreet. Gemini AI will evaluate your CV and highlight Remote roles & compensation $\ge$ 20M IDR automatically.
          </p>
        </div>
      )}
    </div>
  );
}

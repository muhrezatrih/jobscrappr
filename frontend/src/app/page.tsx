'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Briefcase,
  TrendingUp,
  Target,
  Calendar,
  ChevronRight,
  RefreshCw,
  Search,
  CheckCircle2,
  Building2,
  Clock,
  ArrowRight,
  Kanban,
  Award,
} from 'lucide-react';
import { api, DashboardKPIs, SankeyAnalyticsResponse, JobApplication } from '@/lib/api';
import DiscoveryFeed from '@/components/DiscoveryFeed';
import { ApplicationDrawer } from '@/components/ApplicationDrawer';
import { StatusBadge } from '@/components/StatusBadge';

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [sankeyData, setSankeyData] = useState<SankeyAnalyticsResponse | null>(null);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const [kpiData, sankey] = await Promise.all([
        api.getDashboardKPIs(),
        api.getSankeyAnalytics(),
      ]);
      setKpis(kpiData);
      setSankeyData(sankey);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="w-full flex flex-col space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>AI Job Discovery & Pipeline</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            JobFlow Scrappr
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Scrape 24h backend jobs, analyze fit against your CV, track stages, and visualize Sankey funnel.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/applications"
            className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all shadow-sm"
          >
            <Kanban className="w-4 h-4 text-blue-600" />
            <span>Open Kanban Pipeline</span>
          </Link>

          <Link
            href="/analytics"
            className="flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            <span>View Full Sankey Funnel</span>
          </Link>
        </div>
      </div>

      {/* KPI Overview Cards */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Total Tracked
              </span>
              <Briefcase className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-3xl font-black tracking-tight">{kpis.totalTracked}</div>
            <span className="text-xs text-zinc-500 font-medium block">
              {kpis.appliedCount} Applied • {kpis.skippedCount} Skipped
            </span>
          </div>

          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Interviews in Progress
              </span>
              <Calendar className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-3xl font-black tracking-tight text-purple-600 dark:text-purple-400">
              {kpis.activeInterviews}
            </div>
            <span className="text-xs text-zinc-500 font-medium block">
              {kpis.screeningCount} Screen • {kpis.technicalCount} Tech • {kpis.finalCount} Final
            </span>
          </div>

          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Offers Received
              </span>
              <Award className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              {kpis.offerCount}
            </div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold block">
              🎉 Final Conversion Success
            </span>
          </div>

          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Average AI Match
              </span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              {kpis.averageMatchScore}%
            </div>
            <span className="text-xs text-zinc-500 font-medium block">
              Based on your CV qualifications
            </span>
          </div>
        </div>
      )}

      {/* Mini Sankey Funnel Preview Banner */}
      {sankeyData && (
        <div className="bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-pink-950/30 p-6 rounded-3xl border border-blue-200/60 dark:border-blue-800/40 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 max-w-lg">
            <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>Sankey Funnel Velocity</span>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {sankeyData.totals.applied} Applied ➔ {sankeyData.totals.screening} Screened ➔{' '}
              {sankeyData.totals.offer} Offers ({sankeyData.conversionRates.overallConversionRate}% conversion)
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Track real-time candidate flow and drop-offs automatically as you update job application statuses.
            </p>
          </div>

          <Link
            href="/analytics"
            className="flex items-center space-x-2 px-5 py-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-2xl text-xs font-bold hover:scale-105 transition-all shadow-md flex-shrink-0"
          >
            <span>Interactive Sankey Diagram</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Upcoming Interviews Reminder Bar (if any) */}
      {kpis?.upcomingInterviews && kpis.upcomingInterviews.length > 0 && (
        <div className="bg-pink-50/80 dark:bg-pink-950/30 p-5 rounded-3xl border border-pink-200/80 dark:border-pink-800/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-pink-500 text-white rounded-2xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-pink-700 dark:text-pink-300 uppercase tracking-wider block">
                Upcoming Interview Scheduled
              </span>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {kpis.upcomingInterviews[0].jobTitle} at {kpis.upcomingInterviews[0].companyName} —{' '}
                {new Date(kpis.upcomingInterviews[0].interviewDate!).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedApp(kpis.upcomingInterviews[0])}
            className="px-4 py-2 bg-white dark:bg-zinc-900 border border-pink-200 dark:border-pink-800 text-xs font-bold text-pink-700 dark:text-pink-300 rounded-xl"
          >
            View Prep Notes
          </button>
        </div>
      )}

      {/* Main Feature: Discovery Scraper Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold tracking-tight">
              On-Demand 24-Hour Job Scraper
            </h2>
          </div>
          <span className="text-xs text-zinc-500">LinkedIn & Jobstreet</span>
        </div>

        <DiscoveryFeed
          onJobTracked={(app) => {
            loadData();
          }}
        />
      </div>

      {/* Application Drawer */}
      <ApplicationDrawer
        application={selectedApp}
        onClose={() => setSelectedApp(null)}
        onUpdate={loadData}
      />
    </div>
  );
}

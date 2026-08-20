'use client';

import React, { useEffect, useState } from 'react';
import { api, SankeyAnalyticsResponse } from '@/lib/api';
import SankeyDiagram from '@/components/SankeyDiagram';
import {
  TrendingUp,
  Sparkles,
  Download,
  RefreshCw,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<SankeyAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSankeyAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load Sankey analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="w-full flex flex-col space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-semibold text-xs uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4" />
            <span>Application Funnel Analytics</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Sankey Diagram & Flow Velocity
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Visualizing full-lifecycle conversion rates from initial 24h scraping through offers.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Flow</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Sankey Section */}
      {isLoading ? (
        <div className="w-full h-96 bg-white/60 dark:bg-zinc-900/60 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 animate-pulse flex items-center justify-center">
          <div className="flex flex-col items-center space-y-2 text-zinc-400">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="text-xs font-medium">Computing Sankey flow weights...</span>
          </div>
        </div>
      ) : analytics ? (
        <div className="space-y-8">
          <SankeyDiagram data={analytics} height={560} showMetrics={true} />

          {/* Deep-Dive Stage Analysis Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  1st Interview Conversion
                </span>
                <span className="text-xs px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold rounded-lg border border-blue-200 dark:border-blue-800">
                  {analytics.conversionRates.appliedToScreening}%
                </span>
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Applied ➔ 1st Interviews
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Out of <strong>{analytics.totals.applied}</strong> applications,{' '}
                <strong>{analytics.totals.firstInterviews}</strong> advanced to 1st Interviews,{' '}
                <strong>{analytics.totals.rejected}</strong> were rejected, and <strong>{analytics.totals.noReply}</strong> had no reply.
              </p>
            </div>

            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  2nd Round Progression
                </span>
                <span className="text-xs px-2.5 py-1 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold rounded-lg border border-purple-200 dark:border-purple-800">
                  {analytics.conversionRates.screeningTo2nd}%
                </span>
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                1st Round ➔ 2nd Round
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                <strong>{analytics.totals.secondInterviews}</strong> advanced to 2nd round,{' '}
                <strong>{analytics.totals.dropped}</strong> dropped by myself, and{' '}
                <strong>{analytics.totals.noOffer}</strong> received no offer.
              </p>
            </div>

            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-6 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Offer Conversion
                </span>
                <span className="text-xs px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold rounded-lg border border-emerald-200 dark:border-emerald-800">
                  {analytics.conversionRates.overallConversionRate}% Overall
                </span>
              </div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Offers ➔ Outcomes
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                <strong>{analytics.totals.offers}</strong> total offers received ({analytics.totals.accepted} accepted, {analytics.totals.declined} declined).
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

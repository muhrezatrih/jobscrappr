'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Play,
  Pause,
  Square,
  Sparkles,
  Briefcase,
  TrendingUp,
  Target,
  Calendar,
  ChevronRight,
  RefreshCw,
  Search,
} from 'lucide-react';
import { api, DashboardKPIs, WorkerStatusResponse, JobApplication } from '@/lib/api';
import { MetricCard } from '@/components/MetricCard';
import { StatusBadge } from '@/components/StatusBadge';
import { ApplicationDrawer } from '@/components/ApplicationDrawer';
import { LiveLogStream } from '@/components/LiveLogStream';

export default function DashboardPage() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [workerStatus, setWorkerStatus] = useState<WorkerStatusResponse | null>(null);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [dryRun, setDryRun] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      const [kpiData, statusData, prefData] = await Promise.all([
        api.getDashboardKPIs(),
        api.getWorkerStatus(),
        api.getPreferences(),
      ]);
      setKpis(kpiData);
      setWorkerStatus(statusData);
      setDryRun(prefData.dryRunMode);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleStartWorker = async () => {
    setIsLoading(true);
    try {
      const res = await api.startWorker(dryRun);
      showToast(res.message || 'Automation started successfully');
      await loadData();
    } catch (e: any) {
      showToast('Failed to start: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePauseWorker = async () => {
    try {
      await api.pauseWorker();
      showToast('Automation paused');
      await loadData();
    } catch (e: any) {
      showToast('Failed to pause: ' + e.message);
    }
  };

  const handleResumeWorker = async () => {
    try {
      await api.resumeWorker();
      showToast('Automation resumed');
      await loadData();
    } catch (e: any) {
      showToast('Failed to resume: ' + e.message);
    }
  };

  const handleStopWorker = async () => {
    try {
      await api.stopWorker();
      showToast('Automation stopped');
      await loadData();
    } catch (e: any) {
      showToast('Failed to stop: ' + e.message);
    }
  };

  const handleQuickTest = async () => {
    setIsLoading(true);
    try {
      showToast('Running single job evaluation with Gemini AI...');
      const res = await api.runSingleJobTest();
      showToast(`Test completed! Match Score: ${res.matchResult.matchScore}%`);
      await loadData();
      if (res.application) {
        setSelectedApp(res.application);
      }
    } catch (e: any) {
      showToast('Test failed: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const status = workerStatus?.status || 'IDLE';

  const recentApps = (kpis?.recentApplications || []).filter((app) => {
    const matchesFilter = statusFilter === 'ALL' || app.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.companyName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Toast Notification */}
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
            animation: 'fadeIn 0.2s ease-out',
          }}
        >
          <Sparkles size={16} color="var(--apple-blue)" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero / Executive Control Center */}
      <section
        className="glass-panel"
        style={{
          padding: '2rem 2.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span
                className={`pulse-dot ${
                  status === 'RUNNING' ? 'running' : status === 'PAUSED' ? 'paused' : 'idle'
                }`}
              />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Engine Status: {status}
              </span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.035em' }}>
              AI Job Auto-Applier
            </h1>
            <p style={{ fontSize: '0.925rem', color: 'var(--text-secondary)', maxWidth: '580px', marginTop: '0.35rem' }}>
              Precision job search automation powered by Google Gemini AI to evaluate CV compatibility, generate tailored cover letters, and submit applications directly.
            </p>
          </div>

          {/* Action Control Panel */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            {/* Dry-Run Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.5rem 0.95rem',
                background: 'var(--surface-glass-card)',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-medium)',
                fontSize: '0.8rem',
              }}
            >
              <span style={{ color: dryRun ? 'var(--apple-blue)' : 'var(--text-secondary)', fontWeight: 600 }}>
                {dryRun ? 'Simulation Mode (Dry-Run)' : 'Live Apply Mode'}
              </span>
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: 'var(--apple-blue)' }}
              />
            </div>

            {/* Start / Pause / Stop Buttons */}
            {status === 'IDLE' || status === 'STOPPED' ? (
              <button
                onClick={handleStartWorker}
                disabled={isLoading}
                className="btn-primary"
              >
                <Play size={16} fill="currentColor" />
                <span>Start Auto-Apply</span>
              </button>
            ) : status === 'RUNNING' ? (
              <>
                <button onClick={handlePauseWorker} className="btn-secondary">
                  <Pause size={16} />
                  <span>Pause</span>
                </button>
                <button onClick={handleStopWorker} className="btn-danger">
                  <Square size={16} />
                  <span>Stop</span>
                </button>
              </>
            ) : (
              <>
                <button onClick={handleResumeWorker} className="btn-primary">
                  <Play size={16} fill="currentColor" />
                  <span>Resume</span>
                </button>
                <button onClick={handleStopWorker} className="btn-danger">
                  <Square size={16} />
                  <span>Stop</span>
                </button>
              </>
            )}

            {/* Quick Single Test */}
            <button
              onClick={handleQuickTest}
              disabled={isLoading || status === 'RUNNING'}
              className="btn-secondary"
              title="Test evaluation on a single sample job with AI"
            >
              <Sparkles size={15} color="var(--apple-purple)" />
              <span>Test Match</span>
            </button>
          </div>
        </div>

        {/* Live Status Progress Summary Bar */}
        {workerStatus?.progress && workerStatus.progress.totalEvaluated > 0 && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              background: 'var(--surface-glass-card-hover)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.825rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <RefreshCw size={15} className="spin" color="var(--apple-blue)" />
              <span>
                <strong>Latest Activity:</strong> {workerStatus.progress.currentJob || 'Evaluating job postings...'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '1.25rem', color: 'var(--text-secondary)' }}>
              <span>Evaluated: <strong>{workerStatus.progress.totalEvaluated}</strong></span>
              <span>Processed: <strong style={{ color: 'var(--apple-green)' }}>{workerStatus.progress.appliedToday}</strong></span>
              <span>Skipped: <strong>{workerStatus.progress.skipped}</strong></span>
            </div>
          </div>
        )}
      </section>

      {/* 4 Metric Cards */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <MetricCard
          title="Total Processed Applications"
          value={kpis?.totalApplications || 0}
          subtitle="All-time pipeline"
          icon={Briefcase}
          variant="blue"
        />
        <MetricCard
          title="Applications Today"
          value={kpis?.todayApplications || 0}
          subtitle="Daily quota: max 15/day"
          icon={Calendar}
          variant="green"
          trend={`${kpis?.appliedCount || 0} Live / ${kpis?.simulatedCount || 0} Simulated`}
        />
        <MetricCard
          title="Average Match Score"
          value={`${kpis?.averageMatchScore || 0}%`}
          subtitle="Alignment with your CV"
          icon={Target}
          variant="purple"
          trend="Threshold min 70%"
        />
        <MetricCard
          title="Submitted / Qualified"
          value={(kpis?.appliedCount || 0) + (kpis?.simulatedCount || 0)}
          subtitle={`${kpis?.skippedCount || 0} jobs skipped`}
          icon={TrendingUp}
          variant="amber"
        />
      </section>

      {/* Main Content Grid: Recent Applications & Live Terminal */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Recent Applications Pipeline */}
        <section className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Recent Applications Pipeline</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Click any row to inspect AI reasoning, cover letter, and screening answers.
              </p>
            </div>
            <Link
              href="/applications"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--apple-blue)',
              }}
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* Search & Status Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search job title or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="apple-input"
                style={{ paddingLeft: '2.2rem', fontSize: '0.8rem', padding: '0.45rem 0.75rem 0.45rem 2.2rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.3rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
              {['ALL', 'APPLIED', 'SIMULATED', 'SKIPPED', 'FAILED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.725rem',
                    fontWeight: 600,
                    background: statusFilter === st ? 'var(--apple-blue-soft)' : 'var(--surface-glass-card)',
                    color: statusFilter === st ? 'var(--apple-blue)' : 'var(--text-secondary)',
                    border: `1px solid ${statusFilter === st ? 'var(--apple-blue)' : 'var(--border-subtle)'}`,
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {st === 'ALL' ? 'All' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Table of Applications */}
          {recentApps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-secondary)', background: 'var(--surface-glass-card)', borderRadius: 'var(--radius-md)' }}>
              <Briefcase size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
              <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>No applications found</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Click "Test Match" or "Start Auto-Apply" to begin.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {recentApps.map((app) => (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className="glass-card"
                  style={{
                    padding: '0.95rem 1.15rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    {/* Match Score Indicator */}
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background:
                          app.matchScore >= 70
                            ? 'var(--apple-green-soft)'
                            : app.matchScore > 0
                            ? 'var(--apple-amber-soft)'
                            : 'rgba(255,255,255,0.05)',
                        border: `2px solid ${
                          app.matchScore >= 70
                            ? 'var(--apple-green)'
                            : app.matchScore > 0
                            ? 'var(--apple-amber)'
                            : 'var(--border-subtle)'
                        }`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        color: 'var(--text-primary)',
                        flexShrink: 0,
                      }}
                    >
                      {app.matchScore}%
                    </div>

                    <div>
                      <h4 style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                        {app.jobTitle}
                      </h4>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                        {app.companyName} {app.location ? `• ${app.location}` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <StatusBadge status={app.status} size="sm" />
                    <ChevronRight size={16} color="var(--text-tertiary)" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Live Terminal Stream */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <LiveLogStream maxHeight="440px" />

          {/* Quick Profile Summary Card */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Active Criteria
              </span>
              <Link href="/profile" style={{ fontSize: '0.75rem', color: 'var(--apple-blue)', fontWeight: 600 }}>
                Edit Criteria →
              </Link>
            </div>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Target: Fullstack, Backend Engineer • Location: Jakarta, Remote • Min Score: 70%
            </p>
          </div>
        </section>
      </div>

      {/* Drill-down Detail Drawer */}
      <ApplicationDrawer
        application={selectedApp}
        onClose={() => setSelectedApp(null)}
      />
    </div>
  );
}

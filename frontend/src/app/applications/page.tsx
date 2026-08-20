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
} from 'lucide-react';
import { api, JobApplication } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import { ApplicationDrawer } from '@/components/ApplicationDrawer';

export default function ApplicationsPage() {
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
        status,
        portal,
        minScore,
        page,
        limit: 15,
      });
      setApplications(data.items);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page, status, portal, minScore]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchApplications();
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Delete this application history record?')) {
      try {
        await api.deleteApplication(id);
        fetchApplications();
      } catch (err) {
        alert('Failed to delete');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em' }}>
            Application Pipeline & History
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Total <strong>{total}</strong> job postings evaluated and processed by AI.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search by position, company, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="apple-input"
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="apple-input"
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="APPLIED">Applied (Live)</option>
            <option value="SIMULATED">Simulated (Dry-Run)</option>
            <option value="SKIPPED">Skipped (Low Match)</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Min Score Filter */}
          <select
            value={minScore}
            onChange={(e) => {
              setMinScore(e.target.value);
              setPage(1);
            }}
            className="apple-input"
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option value="">All Scores</option>
            <option value="60">Match Score ≥ 60%</option>
            <option value="70">Match Score ≥ 70%</option>
            <option value="80">Match Score ≥ 80%</option>
            <option value="90">Match Score ≥ 90%</option>
          </select>

          <button type="submit" className="btn-primary" style={{ padding: '0.65rem 1.25rem' }}>
            <Search size={14} />
            <span>Filter</span>
          </button>
        </form>
      </div>

      {/* Applications Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            Loading applications...
          </div>
        ) : applications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
            <Briefcase size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
              No applications found
            </h3>
            <p style={{ fontSize: '0.825rem' }}>
              Try adjusting your search terms or status filters.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface-glass-card)', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Position & Company</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Location</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Match Score</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'background var(--transition-fast)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-glass-card-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.925rem' }}>
                        {app.jobTitle}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.775rem', marginTop: '0.2rem' }}>
                        <Building2 size={13} color="var(--apple-blue)" />
                        <span>{app.companyName}</span>
                        <span>•</span>
                        <span>{app.portal}</span>
                      </div>
                    </td>

                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
                      {app.location || 'Indonesia'}
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
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
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {app.matchScore}%
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {app.matchReason || '-'}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <StatusBadge status={app.status} size="sm" />
                    </td>

                    <td style={{ padding: '1rem', color: 'var(--text-tertiary)', fontSize: '0.775rem' }}>
                      {new Date(app.createdAt).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApp(app);
                          }}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                          title="Inspect Details & Cover Letter"
                        >
                          <Eye size={13} />
                          <span>Details</span>
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, app.id)}
                          style={{
                            color: 'var(--text-tertiary)',
                            padding: '0.35rem',
                            borderRadius: '4px',
                          }}
                          title="Delete record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '1rem 1.25rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--surface-glass-card)',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drill-down Detail Drawer */}
      <ApplicationDrawer
        application={selectedApp}
        onClose={() => setSelectedApp(null)}
      />
    </div>
  );
}

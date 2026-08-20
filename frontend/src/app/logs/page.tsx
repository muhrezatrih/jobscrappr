'use client';

import React from 'react';
import { Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { LiveLogStream } from '@/components/LiveLogStream';
import { api } from '@/lib/api';

export default function LogsPage() {
  const handleExport = async () => {
    try {
      const logs = await api.getLogs(500);
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jobflow-execution-logs-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
    } catch (e) {
      alert('Failed to export logs');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <Link href="/" style={{ color: 'var(--apple-blue)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <ArrowLeft size={14} /> Back to Dashboard
            </Link>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em' }}>
            Live Execution Terminal
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Real-time streaming of background worker actions, scraping steps, and Gemini AI inference logs.
          </p>
        </div>

        <button onClick={handleExport} className="btn-secondary">
          <Download size={15} />
          <span>Export Logs (.JSON)</span>
        </button>
      </div>

      {/* Full-width Terminal Component */}
      <LiveLogStream maxHeight="640px" showControls={true} />
    </div>
  );
}

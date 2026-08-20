'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Trash2 } from 'lucide-react';
import { useSSELogs } from '@/lib/useSSELogs';
import { api } from '@/lib/api';

interface LiveLogStreamProps {
  maxHeight?: string;
  showControls?: boolean;
}

export function LiveLogStream({ maxHeight = '360px', showControls = true }: LiveLogStreamProps) {
  const { logs, isConnected, setLogs } = useSSELogs();
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial fetch of recent logs from backend DB
    api.getLogs(60).then((data) => {
      if (Array.isArray(data)) {
        setLogs(data);
      }
    }).catch(() => {});
  }, [setLogs]);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = 0; // In descending order, top is newest
    }
  }, [logs, autoScroll]);

  const handleClear = async () => {
    try {
      await api.clearLogs();
      setLogs([]);
    } catch (e) {}
  };

  const filteredLogs = logs.filter((l) => {
    if (levelFilter === 'ALL') return true;
    return l.level === levelFilter;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return 'var(--apple-green)';
      case 'WARN':
        return 'var(--apple-amber)';
      case 'ERROR':
        return 'var(--apple-red)';
      default:
        return 'var(--apple-blue)';
    }
  };

  return (
    <div
      className="glass-panel"
      style={{
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-medium)',
        background: '#0c0d14',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      {/* macOS Terminal Window Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1.25rem',
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* macOS window controls */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }} />
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.5rem', fontSize: '0.775rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            <Terminal size={14} />
            <span>Worker Activity Stream</span>
          </div>
        </div>

        {/* Status indicator & controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isConnected ? 'var(--apple-green)' : 'var(--text-tertiary)',
                boxShadow: isConnected ? '0 0 6px var(--apple-green)' : 'none',
              }}
            />
            <span style={{ color: isConnected ? 'var(--apple-green)' : 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
              {isConnected ? 'LIVE SSE' : 'RECONNECTING'}
            </span>
          </div>

          {showControls && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.7rem',
                  padding: '0.2rem 0.5rem',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                <option value="ALL">ALL LEVELS</option>
                <option value="INFO">INFO</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
              </select>

              <button
                onClick={handleClear}
                title="Clear logs"
                style={{
                  color: 'var(--text-tertiary)',
                  padding: '0.2rem 0.4rem',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Terminal Log Output */}
      <div
        ref={logContainerRef}
        style={{
          height: maxHeight,
          overflowY: 'auto',
          padding: '0.85rem 1.25rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.775rem',
          lineHeight: 1.6,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
        }}
      >
        {filteredLogs.length === 0 ? (
          <div style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '2rem' }}>
            Waiting for worker activity...
          </div>
        ) : (
          filteredLogs.map((item, idx) => {
            const timeStr = item.timestamp
              ? new Date(item.timestamp).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
              : 'LIVE';

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  padding: '0.2rem 0',
                }}
              >
                <span style={{ color: 'var(--text-tertiary)', flexShrink: 0, fontSize: '0.7rem' }}>
                  {timeStr}
                </span>

                <span
                  style={{
                    color: getLevelColor(item.level),
                    fontWeight: 600,
                    fontSize: '0.68rem',
                    padding: '0.05rem 0.35rem',
                    background: `${getLevelColor(item.level)}18`,
                    borderRadius: '4px',
                    flexShrink: 0,
                    textTransform: 'uppercase',
                  }}
                >
                  {item.action || item.level}
                </span>

                <span style={{ color: item.level === 'ERROR' ? 'var(--apple-red)' : 'var(--text-primary)', wordBreak: 'break-word' }}>
                  {item.message}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

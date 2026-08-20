'use client';

import { useEffect, useState } from 'react';

export interface LogItem {
  id?: string;
  timestamp?: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  source?: string;
  action: string;
  message: string;
  metadata?: any;
}

export function useSSELogs() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const sseUrl = '/api/logs/stream';
    let eventSource: EventSource | null = null;

    try {
      eventSource = new EventSource(sseUrl);

      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const parsed: LogItem = JSON.parse(event.data);
          setLogs((prev) => [parsed, ...prev.slice(0, 499)]); // Keep latest 500 logs
        } catch (e) {
          console.error('Error parsing SSE log event', e);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
      };
    } catch (e) {
      console.warn('SSE connection failed', e);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  return { logs, isConnected, setLogs };
}

import { useEffect, useState } from 'react';
import { useConnectionStore } from '../store/connectionStore.js';

interface Status {
  uptime_seconds: number;
  capture: { connected: boolean; mode: string };
  db: { reachable: boolean };
}

/** Fetches /api/status and displays uptime, capture state, and connection info. */
export default function StatusPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const wsStatus = useConnectionStore((s) => s.status);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetch('/api/status')
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled) setStatus(data);
        })
        .catch(() => {
          if (!cancelled) setStatus(null);
        });
    };
    load();
    const interval = setInterval(load, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <section className="space-y-1">
      <h2 className="text-lg font-medium">Status</h2>
      <div className="text-sm text-slate-300 flex flex-wrap gap-x-6 gap-y-1">
        <span>Uptime: {status ? `${status.uptime_seconds}s` : '—'}</span>
        <span>
          Capture: {status ? (status.capture.connected ? 'connected' : 'disconnected') : '—'}
        </span>
        <span>DB: {status ? (status.db.reachable ? 'reachable' : 'unreachable') : '—'}</span>
        <span>Websocket: {wsStatus}</span>
      </div>
    </section>
  );
}

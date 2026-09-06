import { useEffect } from 'react';
import { useActivityStore } from '../store/activityStore.js';

/**
 * Fetches /api/activity and renders a simple table of rollups. No new
 * charting library — hand-rolled table for Phase 1.
 */
export default function ActivityTimeline() {
  const { rollups, loading, error, setRollups, setLoading, setError } = useActivityStore();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/activity')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setRollups(data.rollups ?? []);
      })
      .catch((err) => {
        if (!cancelled) setError(String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [setRollups, setLoading, setError]);

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-medium">Activity Timeline</h2>
      {loading && <p className="text-slate-400 text-sm">Loading...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {!loading && !error && rollups.length === 0 && (
        <p className="text-slate-400 text-sm">No activity recorded yet.</p>
      )}
      {rollups.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="text-slate-400">
                <th className="pr-4">Time</th>
                <th className="pr-4">Peak dB</th>
                <th className="pr-4">Avg dB</th>
              </tr>
            </thead>
            <tbody>
              {rollups.map((r) => (
                <tr key={r.timestamp}>
                  <td className="pr-4">{new Date(r.timestamp).toLocaleTimeString()}</td>
                  <td className="pr-4">{r.peak_db.toFixed(1)}</td>
                  <td className="pr-4">{r.avg_db.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

import type Database from 'better-sqlite3';
import type { MinuteRollup } from '../dsp/bandActivity.js';

export interface ActivityRow {
  timestamp: number;
  freq_range_start: number;
  freq_range_end: number;
  peak_db: number;
  avg_db: number;
}

/**
 * Typed prepared-statement query functions for the band_activity table.
 */
export function createBandActivityRepo(db: Database.Database) {
  const insertStmt = db.prepare(`
    INSERT INTO band_activity (timestamp, freq_range_start, freq_range_end, peak_db, avg_db)
    VALUES (@timestamp, @freqRangeStart, @freqRangeEnd, @peakDb, @avgDb)
  `);

  const selectStmt = db.prepare<{ since: number; until: number }>(`
    SELECT timestamp, freq_range_start, freq_range_end, peak_db, avg_db
    FROM band_activity
    WHERE timestamp >= @since AND timestamp <= @until
    ORDER BY timestamp ASC
  `);

  return {
    insertRollup(rollup: MinuteRollup): void {
      insertStmt.run(rollup);
    },

    getActivity(sinceTs: number, untilTs: number): ActivityRow[] {
      return selectStmt.all({ since: sinceTs, until: untilTs }) as ActivityRow[];
    },
  };
}

export type BandActivityRepo = ReturnType<typeof createBandActivityRepo>;

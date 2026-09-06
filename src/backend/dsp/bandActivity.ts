import type { WaterfallFrame } from './waterfall.js';

export interface MinuteRollup {
  timestamp: number; // start-of-minute epoch ms
  freqRangeStart: number;
  freqRangeEnd: number;
  peakDb: number;
  avgDb: number;
}

export type RollupSink = (rollup: MinuteRollup) => void;

function startOfMinute(ts: number): number {
  return Math.floor(ts / 60_000) * 60_000;
}

/**
 * Consumes waterfall frames and accumulates a rolling peak/average dB for
 * the current minute, flushing a completed rollup via the provided sink
 * whenever the minute rolls over.
 */
export class BandActivityAggregator {
  private currentMinute: number | null = null;
  private peakDb = Number.NEGATIVE_INFINITY;
  private sumDb = 0;
  private sampleCount = 0;
  private freqRangeStart = 0;
  private freqRangeEnd = 0;

  constructor(private readonly sink: RollupSink) {}

  ingest(frame: WaterfallFrame): void {
    const minute = startOfMinute(frame.timestamp);

    if (this.currentMinute === null) {
      this.currentMinute = minute;
    } else if (minute !== this.currentMinute) {
      this.flush();
      this.currentMinute = minute;
    }

    this.freqRangeStart = frame.freqStart;
    this.freqRangeEnd = frame.freqEnd;

    for (const bin of frame.bins) {
      if (bin > this.peakDb) this.peakDb = bin;
      this.sumDb += bin;
      this.sampleCount += 1;
    }
  }

  /** Flushes the current in-progress minute, if any, and resets accumulators. */
  flush(): void {
    if (this.currentMinute === null || this.sampleCount === 0) return;

    const rollup: MinuteRollup = {
      timestamp: this.currentMinute,
      freqRangeStart: this.freqRangeStart,
      freqRangeEnd: this.freqRangeEnd,
      peakDb: this.peakDb,
      avgDb: this.sumDb / this.sampleCount,
    };
    this.sink(rollup);

    this.peakDb = Number.NEGATIVE_INFINITY;
    this.sumDb = 0;
    this.sampleCount = 0;
  }
}

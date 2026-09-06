import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import type { Logger } from 'pino';
import { env } from '../config/env.js';

const MAX_BACKOFF_MS = 30_000;
const INITIAL_BACKOFF_MS = 1_000;

export interface RtlSdrCaptureEvents {
  data: (chunk: Buffer) => void;
  captureError: (err: Error) => void;
  started: () => void;
  stopped: () => void;
}

/**
 * Spawns rtl_fm tuned across the configured 2m band range and re-spawns it on
 * crash with exponential backoff. There is no real RTL-SDR hardware in CI or
 * in this sandbox, so a missing binary (ENOENT) is logged as a warning and
 * capture simply stays "disconnected" — the rest of the server must keep
 * working without it.
 */
export class RtlSdrCapture extends EventEmitter {
  private child: ChildProcessWithoutNullStreams | null = null;
  private backoffMs = INITIAL_BACKOFF_MS;
  private stopped = false;
  private restartTimer: NodeJS.Timeout | null = null;

  constructor(private readonly logger: Logger) {
    super();
  }

  get connected(): boolean {
    return this.child !== null;
  }

  start(): void {
    this.stopped = false;
    this.spawnProcess();
  }

  stop(): void {
    this.stopped = true;
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    this.child?.kill();
    this.child = null;
  }

  private spawnProcess(): void {
    const centerFreq = Math.round((env.SDR_FREQ_MIN + env.SDR_FREQ_MAX) / 2);
    const args = [
      '-f',
      String(centerFreq),
      '-s',
      String(env.SDR_SAMPLE_RATE),
      '-p',
      String(env.SDR_PPM_CORRECTION),
      ...(env.SDR_GAIN !== undefined ? ['-g', String(env.SDR_GAIN)] : []),
      '-',
    ];

    let child: ChildProcessWithoutNullStreams;
    try {
      child = spawn('rtl_fm', args);
    } catch (err) {
      this.handleSpawnFailure(err as Error);
      return;
    }

    this.child = child;

    child.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT' || err.code === 'EACCES') {
        this.logger.warn(
          { err },
          'rtl_fm binary unavailable — running without SDR capture (expected in dev/CI/sandbox)',
        );
      } else {
        this.logger.error({ err }, 'rtl_fm process error');
      }
      this.child = null;
      this.emit('captureError', err);
      this.scheduleRestart();
    });

    child.stdout.on('data', (chunk: Buffer) => {
      this.backoffMs = INITIAL_BACKOFF_MS;
      this.emit('data', chunk);
    });

    child.stderr.on('data', (chunk: Buffer) => {
      this.logger.debug({ msg: chunk.toString() }, 'rtl_fm stderr');
    });

    child.on('exit', (code, signal) => {
      this.child = null;
      if (!this.stopped) {
        this.logger.warn({ code, signal }, 'rtl_fm exited unexpectedly, scheduling restart');
        this.scheduleRestart();
      } else {
        this.emit('stopped');
      }
    });

    this.emit('started');
  }

  private handleSpawnFailure(err: Error): void {
    this.logger.warn({ err }, 'failed to spawn rtl_fm — continuing without SDR capture');
    this.emit('error', err);
    this.scheduleRestart();
  }

  private scheduleRestart(): void {
    if (this.stopped) return;
    this.restartTimer = setTimeout(() => {
      this.backoffMs = Math.min(this.backoffMs * 2, MAX_BACKOFF_MS);
      this.spawnProcess();
    }, this.backoffMs);
    this.restartTimer.unref?.();
  }
}

import { createServer } from 'node:http';
import type { Logger } from 'pino';
import { RtlSdrCapture } from '../capture/rtlsdr.js';
import { env } from '../config/env.js';
import { BandActivityAggregator } from '../dsp/bandActivity.js';
import { Waterfall } from '../dsp/waterfall.js';
import { createBandActivityRepo } from '../storage/bandActivityRepo.js';
import { openDb } from '../storage/db.js';
import { TwoMeterWebSocketServer } from '../websocket/server.js';
import { createRequestHandler } from './routes.js';

const DISPLAY_WIDTH = 512;
const FFT_SIZE = 2048;

export interface RunningServer {
  close(): Promise<void>;
}

/**
 * Wires config, storage, capture, the DSP pipeline, the websocket server,
 * and the HTTP routes into one listening server. Called by `cli/main.ts serve`.
 */
export async function startServer(logger: Logger): Promise<RunningServer> {
  const startedAt = Date.now();

  const db = openDb();
  const bandActivityRepo = createBandActivityRepo(db);

  const capture = new RtlSdrCapture(logger);
  // Best-effort: start() logs a warning and keeps going if no hardware/binary
  // is present, so the rest of the server still comes up. We still attach a
  // listener here so a missing/unusable rtl_fm binary never surfaces as an
  // unhandled 'error' event.
  capture.on('captureError', () => {
    /* already logged inside RtlSdrCapture; nothing else to do in Phase 1 */
  });
  capture.start();

  const waterfall = new Waterfall({
    fftSize: FFT_SIZE,
    displayWidth: DISPLAY_WIDTH,
    freqStart: env.SDR_FREQ_MIN,
    freqEnd: env.SDR_FREQ_MAX,
    frameRateHz: env.WS_FRAME_RATE_HZ,
  });

  const bandActivity = new BandActivityAggregator((rollup) => {
    bandActivityRepo.insertRollup(rollup);
  });

  waterfall.on('frame', (frame) => {
    bandActivity.ingest(frame);
    wsServer.broadcastWaterfallFrame(frame);
  });

  capture.on('data', (chunk: Buffer) => {
    // rtl_fm emits 16-bit signed PCM; convert to normalized float samples.
    const sampleCount = Math.floor(chunk.length / 2);
    const samples = new Float64Array(sampleCount);
    for (let i = 0; i < sampleCount; i++) {
      samples[i] = chunk.readInt16LE(i * 2) / 32768;
    }
    waterfall.processSamples(samples);
  });

  const requestHandler = createRequestHandler({
    logger,
    startedAt,
    capture,
    dbReachable: () => {
      try {
        db.prepare('SELECT 1').get();
        return true;
      } catch {
        return false;
      }
    },
    bandActivityRepo,
  });

  const httpServer = createServer(requestHandler);
  const wsServer = new TwoMeterWebSocketServer(httpServer, env.WS_MAX_CONNECTIONS, logger);

  await new Promise<void>((resolve) => {
    httpServer.listen(env.PORT, () => resolve());
  });
  logger.info({ port: env.PORT }, 'two-meter-watch server listening');

  return {
    async close() {
      capture.stop();
      bandActivity.flush();
      wsServer.close();
      await new Promise<void>((resolve, reject) => {
        httpServer.close((err) => (err ? reject(err) : resolve()));
      });
      db.close();
    },
  };
}

import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Logger } from 'pino';
import { z } from 'zod';
import type { RtlSdrCapture } from '../capture/rtlsdr.js';
import type { BandActivityRepo } from '../storage/bandActivityRepo.js';

// NOTE: This API is deliberately read-only (GET only, no POST/PUT/DELETE).
// two-meter-watch is exposed publicly, and having zero write/control
// endpoints removes an entire class of exposure by design. See
// docs/DEPLOYMENT.md for the full reasoning.

const __dirname = dirname(fileURLToPath(import.meta.url));

const MAX_RANGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_IMAGES_LIMIT = 100;

const activityQuerySchema = z.object({
  since: z.string().datetime().optional(),
  until: z.string().datetime().optional(),
});

const imagesQuerySchema = z.object({
  since: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(MAX_IMAGES_LIMIT).optional(),
});

export interface RouterDeps {
  logger: Logger;
  startedAt: number;
  capture: RtlSdrCapture;
  dbReachable: () => boolean;
  bandActivityRepo: BandActivityRepo;
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readVersionJson(): unknown {
  try {
    const path = join(__dirname, '..', '..', 'frontend', 'public', 'version.json');
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return { version: 'unknown', gitSha: 'unknown', builtAt: null };
  }
}

/**
 * Hand-rolled router on Node's built-in http module. Deliberately does not
 * pull in Express/Fastify/any framework — see repo scaffold notes.
 */
export function createRequestHandler(deps: RouterDeps) {
  return function handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = new URL(req.url ?? '/', 'http://localhost');

    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'method not allowed — this API is read-only' });
      return;
    }

    if (url.pathname === '/api/status') {
      sendJson(res, 200, {
        uptime_seconds: Math.floor((Date.now() - deps.startedAt) / 1000),
        capture: {
          connected: deps.capture.connected,
          mode: 'waterfall',
        },
        db: {
          reachable: deps.dbReachable(),
        },
      });
      return;
    }

    if (url.pathname === '/api/activity') {
      const parsed = activityQuerySchema.safeParse(Object.fromEntries(url.searchParams));
      if (!parsed.success) {
        sendJson(res, 400, { error: 'invalid query parameters', details: parsed.error.flatten() });
        return;
      }

      const now = Date.now();
      const sinceTs = parsed.data.since ? Date.parse(parsed.data.since) : now - 24 * 60 * 60 * 1000;
      const untilTs = parsed.data.until ? Date.parse(parsed.data.until) : now;

      if (untilTs - sinceTs > MAX_RANGE_MS) {
        sendJson(res, 400, { error: `range exceeds maximum of ${MAX_RANGE_MS}ms (7 days)` });
        return;
      }

      const rows = deps.bandActivityRepo.getActivity(sinceTs, untilTs);
      sendJson(res, 200, {
        rollups: rows.map((r) => ({
          timestamp: r.timestamp,
          freq_range_start: r.freq_range_start,
          freq_range_end: r.freq_range_end,
          peak_db: r.peak_db,
          avg_db: r.avg_db,
        })),
      });
      return;
    }

    if (url.pathname === '/api/sstv/images') {
      const parsed = imagesQuerySchema.safeParse(Object.fromEntries(url.searchParams));
      if (!parsed.success) {
        sendJson(res, 400, { error: 'invalid query parameters', details: parsed.error.flatten() });
        return;
      }
      // Phase 1: SSTV decoding is not implemented, so this is always empty.
      sendJson(res, 200, { images: [] });
      return;
    }

    if (url.pathname === '/version.json') {
      sendJson(res, 200, readVersionJson());
      return;
    }

    sendJson(res, 404, { error: 'not found' });
  };
}

/**
 * SSTV detection/decoding — STUB ONLY.
 *
 * This is intentionally unimplemented in Phase 1. two-meter-watch's initial
 * release covers RTL-SDR capture, FFT waterfall, and band-activity rollups
 * only. SSTV detection and decoding arrive in Phase 2.
 *
 * TODO (Phase 2), from-scratch TypeScript port, no external decode library:
 *  1. VIS (Vertical Interval Signaling) detection:
 *     - 1900 Hz leader tone (~300ms)
 *     - 1200 Hz sync pulse (~10ms)
 *     - 1900 Hz leader tone (~300ms)
 *     - Manchester-encoded VIS byte (7 data bits + 1 parity bit) identifying
 *       the SSTV mode (e.g. Robot 36, Scottie 1/2, Martin M1/M2).
 *  2. Decode Robot 36 first (simplest, YCbCr with separators), then
 *     Scottie / Martin (RGB, sync-pulse-per-line) variants.
 *  3. Reconstruct scanlines into an image buffer and write to
 *     src/backend/storage (sstv_images table) with metadata linked to the
 *     originating sstv_detections row.
 *
 * Until Phase 2 lands, `detect()` below throws so callers cannot silently
 * rely on unimplemented behavior.
 */

export type SstvMode = 'robot36' | 'scottie1' | 'scottie2' | 'martin1' | 'martin2';

export interface SstvDetectionResult {
  mode: SstvMode;
  visCode: number;
  confidence: number;
}

export class SstvDecoder {
  /**
   * Scans a chunk of audio samples for a VIS header indicating the start of
   * an SSTV transmission. Not implemented until Phase 2.
   */
  detect(_samples: Float64Array): SstvDetectionResult | null {
    throw new Error(
      'SstvDecoder.detect() is not implemented — see Phase 2 (docs/API.md, README Roadmap)',
    );
  }
}

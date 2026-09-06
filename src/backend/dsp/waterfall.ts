import { EventEmitter } from 'node:events';
import FFT from 'fft.js';

export interface WaterfallFrame {
  timestamp: number;
  bins: number[];
  freqStart: number;
  freqEnd: number;
}

export interface WaterfallOptions {
  fftSize: number;
  displayWidth: number;
  freqStart: number;
  freqEnd: number;
  frameRateHz: number;
}

/** Precomputed Hann window coefficients for a given FFT size. */
function hannWindow(size: number): Float64Array {
  const window = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
  }
  return window;
}

function magnitudeToDb(re: number, im: number): number {
  const magnitude = Math.sqrt(re * re + im * im) + 1e-12;
  return 20 * Math.log10(magnitude);
}

/** Downsamples an array of dB values to a target width by averaging bins. */
function downsample(values: number[], targetWidth: number): number[] {
  if (values.length <= targetWidth) return values.slice();
  const result: number[] = new Array(targetWidth);
  const ratio = values.length / targetWidth;
  for (let i = 0; i < targetWidth; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.max(start + 1, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j++) sum += values[j] ?? 0;
    result[i] = sum / (end - start);
  }
  return result;
}

/**
 * Computes an FFT-based waterfall from raw sample buffers and emits
 * downsampled dB frames at a configurable rate via the "frame" event.
 */
export class Waterfall extends EventEmitter {
  private readonly fft: FFT;
  private readonly window: Float64Array;
  private readonly complexInput: number[];
  private lastEmit = 0;

  constructor(private readonly options: WaterfallOptions) {
    super();
    this.fft = new FFT(options.fftSize);
    this.window = hannWindow(options.fftSize);
    this.complexInput = this.fft.createComplexArray();
  }

  /**
   * Accepts real-valued samples (e.g. decoded from an IQ or audio buffer),
   * runs a windowed FFT, and emits a downsampled dB frame if the configured
   * frame rate interval has elapsed.
   */
  processSamples(samples: Float64Array): WaterfallFrame | null {
    const size = this.options.fftSize;
    const input = new Array(size).fill(0);
    for (let i = 0; i < size && i < samples.length; i++) {
      input[i] = (samples[i] ?? 0) * (this.window[i] ?? 0);
    }

    const output = this.fft.createComplexArray();
    this.fft.realTransform(output, input);
    this.fft.completeSpectrum(output);

    const halfSize = size / 2;
    const magnitudesDb: number[] = new Array(halfSize);
    for (let i = 0; i < halfSize; i++) {
      const re = output[2 * i] ?? 0;
      const im = output[2 * i + 1] ?? 0;
      magnitudesDb[i] = magnitudeToDb(re, im);
    }

    const now = Date.now();
    const intervalMs = 1000 / this.options.frameRateHz;
    if (now - this.lastEmit < intervalMs) {
      return null;
    }
    this.lastEmit = now;

    const frame: WaterfallFrame = {
      timestamp: now,
      bins: downsample(magnitudesDb, this.options.displayWidth),
      freqStart: this.options.freqStart,
      freqEnd: this.options.freqEnd,
    };

    this.emit('frame', frame);
    return frame;
  }
}

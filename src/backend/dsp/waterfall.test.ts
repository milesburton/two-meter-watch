import { describe, expect, it } from 'vitest';
import { generateSineWave } from '../../test-fixtures.js';
import { Waterfall } from './waterfall.js';

describe('Waterfall', () => {
  it('detects the FFT peak near the expected bin for a synthetic sine wave', () => {
    const fftSize = 1024;
    const sampleRateHz = 48_000;
    const toneHz = 6_000; // expected bin = toneHz / sampleRateHz * fftSize = 128

    const waterfall = new Waterfall({
      fftSize,
      displayWidth: fftSize / 2, // no downsampling, keep bin alignment exact
      freqStart: 144_000_000,
      freqEnd: 146_000_000,
      frameRateHz: 1000, // effectively no throttling for the test
    });

    const samples = generateSineWave(toneHz, sampleRateHz, fftSize);
    const frame = waterfall.processSamples(samples);

    expect(frame).not.toBeNull();
    const bins = frame?.bins ?? [];

    let peakIndex = 0;
    let peakValue = Number.NEGATIVE_INFINITY;
    for (let i = 0; i < bins.length; i++) {
      const value = bins[i] ?? Number.NEGATIVE_INFINITY;
      if (value > peakValue) {
        peakValue = value;
        peakIndex = i;
      }
    }

    const expectedBin = Math.round((toneHz / sampleRateHz) * fftSize);
    expect(Math.abs(peakIndex - expectedBin)).toBeLessThanOrEqual(2);
  });
});

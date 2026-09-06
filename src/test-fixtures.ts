/**
 * Shared test fixtures for backend DSP tests.
 */

/**
 * Generates a synthetic sine wave sample buffer at a given frequency and
 * sample rate, used to verify FFT peak detection in waterfall.test.ts.
 */
export function generateSineWave(
  frequencyHz: number,
  sampleRateHz: number,
  length: number,
): Float64Array {
  const samples = new Float64Array(length);
  for (let i = 0; i < length; i++) {
    samples[i] = Math.sin((2 * Math.PI * frequencyHz * i) / sampleRateHz);
  }
  return samples;
}

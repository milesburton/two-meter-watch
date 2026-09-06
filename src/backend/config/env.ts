import { z } from 'zod';

const numberFromString = () =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? undefined : Number(v)));

const numberListFromCsv = () =>
  z
    .string()
    .optional()
    .default('')
    .transform((v) =>
      v
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map(Number),
    );

const envSchema = z.object({
  SDR_FREQ_MIN: z.coerce.number().default(144_000_000),
  SDR_FREQ_MAX: z.coerce.number().default(146_000_000),
  SDR_GAIN: numberFromString(),
  SDR_PPM_CORRECTION: z.coerce.number().default(0),
  SDR_SAMPLE_RATE: z.coerce.number().default(2_048_000),
  SSTV_WATCH_FREQS: numberListFromCsv(),
  STATION_LATITUDE: numberFromString(),
  STATION_LONGITUDE: numberFromString(),
  STATION_LABEL: z.string().optional(),
  PORT: z.coerce.number().default(3000),
  WS_MAX_CONNECTIONS: z.coerce.number().default(50),
  WS_FRAME_RATE_HZ: z.coerce.number().default(5),
  LOG_LEVEL: z.string().default('info'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }
  return parsed.data;
}

export const env = loadEnv();
export { envSchema };

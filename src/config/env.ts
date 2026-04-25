import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DUCKDB_PATH: z.string().default('./data/processed/analytics.duckdb'),
  UPLOAD_DIR: z.string().default('./data/uploads'),
  DEFAULT_ROLLING_DAYS: z.coerce.number().default(90),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  QUEUE_MODE: z.enum(['memory', 'redis']).default('memory')
});

export const env = envSchema.parse(process.env);

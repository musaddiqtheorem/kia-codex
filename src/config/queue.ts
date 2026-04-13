import { Queue, Worker } from 'bullmq';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { env } from './env';
import { runExec, runQuery } from './database';

const redisUrl = new URL(env.REDIS_URL);
const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || 6379),
  username: redisUrl.username || undefined,
  password: redisUrl.password || undefined
};

export const ingestionQueue = new Queue('ingestion', { connection });
export const aiQueue = new Queue('ai-insights', { connection });

const processIngestion = async (job: { data: { uploadId: string; sourceType: string; fileName: string } }) => {
  const { uploadId, sourceType, fileName } = job.data;
  const mergedPath = path.join(env.UPLOAD_DIR, `${uploadId}_${fileName}`);
  await runExec(`
    INSERT INTO ingestion_jobs VALUES
    ('${uploadId}', '${sourceType}', 'processed', CURRENT_TIMESTAMP, '${mergedPath}');
  `);
};

const processAI = async () => {
  const [row] = await runQuery<{ delivered: number; revenue: number }>(`
    SELECT COALESCE(SUM(total_delivered), 0) AS delivered,
           COALESCE(SUM(total_placed_order_value), 0) AS revenue
    FROM campaign_performance;
  `);

  const delivered = Number(row?.delivered ?? 0);
  const revenue = Number(row?.revenue ?? 0);
  const title = revenue > 0 ? 'Revenue opportunity detected' : 'No revenue data ingested yet';
  const summary = revenue > 0
    ? `Current seeded revenue is $${revenue.toFixed(2)} across ${delivered} delivered emails.`
    : 'Upload campaign files and run ingestion to generate actionable insights.';

  await runExec(`
    INSERT INTO ai_insights VALUES
    ('${randomUUID()}', 'recommendation', 'medium', '${title.replace(/'/g, "''")}', '${summary.replace(/'/g, "''")}', CURRENT_TIMESTAMP);
  `);
};

export const startWorkers = () => {
  const ingestionWorker = new Worker('ingestion', processIngestion, { connection });
  const aiWorker = new Worker('ai-insights', processAI, { connection });

  ingestionWorker.on('failed', async (job, error) => {
    if (!job) return;
    await runExec(`
      INSERT INTO ingestion_jobs VALUES
      ('${job.data.uploadId}', '${job.data.sourceType}', 'failed', CURRENT_TIMESTAMP, '${String(error.message).replace(/'/g, "''")}');
    `);
  });

  aiWorker.on('failed', async (_job, error) => {
    await fs.mkdir(env.UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(env.UPLOAD_DIR, 'ai-worker-error.log'), `${error.message}\n`, { flag: 'a' });
  });
};

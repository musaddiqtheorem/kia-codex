import fs from 'fs/promises';
import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import { env } from '../config/env';
import { enqueueIngestionJob } from '../config/queue';
import { runQuery } from '../config/database';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
const upload = multer({ dest: path.join(env.UPLOAD_DIR, 'chunks') });

router.post('/chunk', upload.single('chunk'), asyncHandler(async (req, res) => {
  const uploadId = String(req.body.uploadId || '');
  const sourceType = String(req.body.sourceType || 'profile');
  const totalChunks = Number(req.body.totalChunks || 1);
  const chunkIndex = Number(req.body.chunkIndex || 0);
  const fileName = String(req.body.fileName || 'upload.bin');

  if (!req.file || !uploadId) {
    res.status(400).json({ message: 'chunk file and uploadId are required' });
    return;
  }

  const uploadDir = path.join(env.UPLOAD_DIR, uploadId);
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.rename(req.file.path, path.join(uploadDir, `${chunkIndex}.part`));

  const files = await fs.readdir(uploadDir);
  const receivedChunks = files.filter((f) => f.endsWith('.part')).length;

  if (receivedChunks === totalChunks) {
    const mergedPath = path.join(env.UPLOAD_DIR, `${uploadId}_${fileName}`);
    const buffers: Buffer[] = [];

    for (let i = 0; i < totalChunks; i += 1) {
      buffers.push(await fs.readFile(path.join(uploadDir, `${i}.part`)));
    }

    await fs.writeFile(mergedPath, Buffer.concat(buffers));
    await enqueueIngestionJob({ uploadId, sourceType, fileName });
  }

  res.status(202).json({ uploadId, receivedChunks, totalChunks, queued: receivedChunks === totalChunks });
}));

router.get('/jobs', asyncHandler(async (_req, res) => {
  const jobs = await runQuery(`SELECT * FROM ingestion_jobs ORDER BY created_at DESC LIMIT 100;`);
  res.json({ jobs });
}));

export default router;

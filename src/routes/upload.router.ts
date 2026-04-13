import { Router } from 'express';

const router = Router();

router.post('/:type', (req, res) => {
  const { type } = req.params;
  res.status(202).json({
    jobId: `job_${Date.now()}`,
    status: 'queued',
    type,
    message: 'Upload pipeline scaffolded. Wire multipart/chunk upload and workers next.'
  });
});

router.get('/jobs', (_req, res) => {
  res.json({ jobs: [] });
});

export default router;

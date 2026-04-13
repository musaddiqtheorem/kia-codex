import { Router } from 'express';
import { getCampaignMetrics, getFlowMetrics, getOverallMetrics } from '../services/analyticsService';

const router = Router();

router.get('/overall', (req, res) => {
  const days = req.query.days ? Number(req.query.days) : undefined;
  res.json(getOverallMetrics(days));
});

router.get('/flows', (_req, res) => {
  res.json(getFlowMetrics());
});

router.get('/campaigns', (_req, res) => {
  res.json(getCampaignMetrics());
});

export default router;

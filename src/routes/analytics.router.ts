import { Router } from 'express';
import { getCampaignMetrics, getFlowMetrics, getOverallMetrics } from '../services/analyticsService';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/overall', asyncHandler(async (req, res) => {
  const days = req.query.days ? Number(req.query.days) : undefined;
  res.json(await getOverallMetrics(days));
}));

router.get('/flows', asyncHandler(async (_req, res) => {
  res.json({ flows: await getFlowMetrics() });
}));

router.get('/campaigns', asyncHandler(async (_req, res) => {
  res.json({ campaigns: await getCampaignMetrics() });
}));

export default router;

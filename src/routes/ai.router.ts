import { Router } from 'express';
import { aiQueue } from '../config/queue';
import { runQuery } from '../config/database';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/insights/generate', asyncHandler(async (_req, res) => {
  await aiQueue.add('generate-insights', {});
  res.status(202).json({ queued: true });
}));

router.get('/insights', asyncHandler(async (_req, res) => {
  const insights = await runQuery(`SELECT * FROM ai_insights ORDER BY created_at DESC LIMIT 20;`);
  res.json({ insights });
}));

router.post('/query', asyncHandler(async (req, res) => {
  const query = String(req.body.query || '').toLowerCase();
  if (query.includes('revenue')) {
    const [row] = await runQuery<{ revenue: number }>(`SELECT COALESCE(SUM(total_placed_order_value),0) AS revenue FROM campaign_performance;`);
    res.json({ answer: `Total campaign revenue is $${Number(row.revenue).toFixed(2)}.` });
    return;
  }

  res.json({ answer: 'I can currently answer simple revenue queries. Expand NLP mapping next.' });
}));

export default router;

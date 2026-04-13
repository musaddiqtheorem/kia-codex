import { randomUUID } from 'crypto';
import { Router } from 'express';
import { runExec, runQuery } from '../config/database';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  const dashboards = await runQuery(`SELECT id, name, widgets_json, global_filters_json, updated_at FROM dashboard_configs ORDER BY updated_at DESC;`);
  res.json({ dashboards });
}));

router.get('/default', asyncHandler(async (_req, res) => {
  const [dashboard] = await runQuery(`SELECT id, name, widgets_json, global_filters_json FROM dashboard_configs ORDER BY updated_at DESC LIMIT 1;`);
  if (!dashboard) {
    res.json({ dashboard: null });
    return;
  }
  res.json({ dashboard });
}));

router.post('/', asyncHandler(async (req, res) => {
  const id = randomUUID();
  const name = String(req.body.name || 'Default Dashboard').replace(/'/g, "''");
  const widgets = JSON.stringify(req.body.widgets || []).replace(/'/g, "''");
  const globalFilters = JSON.stringify(req.body.globalFilters || {}).replace(/'/g, "''");

  await runExec(`
    INSERT INTO dashboard_configs VALUES
    ('${id}', '${name}', '${widgets}', '${globalFilters}', CURRENT_TIMESTAMP);
  `);

  res.status(201).json({ id });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id;
  const name = String(req.body.name || 'Updated Dashboard').replace(/'/g, "''");
  const widgets = JSON.stringify(req.body.widgets || []).replace(/'/g, "''");
  const globalFilters = JSON.stringify(req.body.globalFilters || {}).replace(/'/g, "''");

  await runExec(`
    UPDATE dashboard_configs
    SET name='${name}', widgets_json='${widgets}', global_filters_json='${globalFilters}', updated_at=CURRENT_TIMESTAMP
    WHERE id='${id}';
  `);

  res.json({ id, updated: true });
}));

export default router;

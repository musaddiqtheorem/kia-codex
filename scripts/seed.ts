import { runExec } from '../src/config/database';

const main = async () => {
  await runExec(`
    INSERT INTO campaign_performance VALUES
      ('cmp_1', '20260320_US_EN_ECOM_Mainline__CrossCat__CRM', '2026-03-20', 'US', 120000, 50400, 7200, 0.42, 0.06, 2.5, 300000),
      ('cmp_2', '20260321_UK_EN_ECOM_Targeted__Shoes__CRM', '2026-03-21', 'UK', 65000, 25350, 3250, 0.39, 0.05, 2.1, 136500);

    INSERT INTO flow_performance VALUES
      ('flow_1', 'Welcome Flow', 'US', 30000, 0.55, 0.10, 96000, 3.2),
      ('flow_2', 'Cart Abandonment', 'EU', 25000, 0.48, 0.09, 102500, 4.1);

    INSERT INTO dashboard_configs VALUES
      ('default-dashboard', 'Default Dashboard', '[{"id":"w1","type":"kpi_open_rate","title":"Open Rate","position":{"x":0,"y":0,"w":4,"h":2}}]', '{"days":90}', CURRENT_TIMESTAMP);
  `);

  // eslint-disable-next-line no-console
  console.log('Seed complete.');
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});

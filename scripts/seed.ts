import { runExec } from '../src/config/database';

const main = async () => {
  await runExec(`
    INSERT INTO campaign_performance VALUES
      ('cmp_1', '2026-03-20', 'US', 0.42, 0.06, 2.5),
      ('cmp_2', '2026-03-21', 'UK', 0.39, 0.05, 2.1);

    INSERT INTO flow_performance VALUES
      ('flow_1', 'Welcome Flow', 'US', 0.55, 0.10, 3.2),
      ('flow_2', 'Cart Abandonment', 'EU', 0.48, 0.09, 4.1);
  `);

  // eslint-disable-next-line no-console
  console.log('Seed complete.');
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});

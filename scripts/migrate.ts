import { runExec } from '../src/config/database';

const main = async () => {
  await runExec(`
    CREATE TABLE IF NOT EXISTS ingestion_jobs (
      id VARCHAR,
      source_type VARCHAR,
      status VARCHAR,
      created_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS campaign_performance (
      id VARCHAR,
      send_date DATE,
      region VARCHAR,
      open_rate DOUBLE,
      click_rate DOUBLE,
      revenue_per_recipient DOUBLE
    );

    CREATE TABLE IF NOT EXISTS flow_performance (
      id VARCHAR,
      flow_name VARCHAR,
      region VARCHAR,
      open_rate DOUBLE,
      click_rate DOUBLE,
      revenue_per_recipient DOUBLE
    );
  `);

  // eslint-disable-next-line no-console
  console.log('Migrations complete.');
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});

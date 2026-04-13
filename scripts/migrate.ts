import { runExec } from '../src/config/database';

const main = async () => {
  await runExec(`
    CREATE TABLE IF NOT EXISTS ingestion_jobs (
      id VARCHAR,
      source_type VARCHAR,
      status VARCHAR,
      created_at TIMESTAMP,
      details VARCHAR
    );

    CREATE TABLE IF NOT EXISTS campaign_performance (
      id VARCHAR,
      campaign_message_name VARCHAR,
      send_date DATE,
      region VARCHAR,
      total_delivered BIGINT,
      unique_opens BIGINT,
      unique_clicks BIGINT,
      open_rate DOUBLE,
      click_rate DOUBLE,
      revenue_per_recipient DOUBLE,
      total_placed_order_value DOUBLE
    );

    CREATE TABLE IF NOT EXISTS flow_performance (
      id VARCHAR,
      flow_name VARCHAR,
      region VARCHAR,
      total_delivered BIGINT,
      open_rate DOUBLE,
      click_rate DOUBLE,
      total_placed_order_value DOUBLE,
      revenue_per_recipient DOUBLE
    );

    CREATE TABLE IF NOT EXISTS dashboard_configs (
      id VARCHAR,
      name VARCHAR,
      widgets_json VARCHAR,
      global_filters_json VARCHAR,
      updated_at TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ai_insights (
      id VARCHAR,
      category VARCHAR,
      priority VARCHAR,
      title VARCHAR,
      summary VARCHAR,
      created_at TIMESTAMP
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

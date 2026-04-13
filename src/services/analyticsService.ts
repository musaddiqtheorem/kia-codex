import { env } from '../config/env';
import { runQuery } from '../config/database';

export const getOverallMetrics = async (days?: number) => {
  const windowDays = days ?? env.DEFAULT_ROLLING_DAYS;
  const [row] = await runQuery<{
    delivered: number;
    opens: number;
    clicks: number;
    revenue: number;
  }>(`
    SELECT
      COALESCE(SUM(total_delivered), 0) AS delivered,
      COALESCE(SUM(unique_opens), 0) AS opens,
      COALESCE(SUM(unique_clicks), 0) AS clicks,
      COALESCE(SUM(total_placed_order_value), 0) AS revenue
    FROM campaign_performance
    WHERE send_date >= CURRENT_DATE - INTERVAL ${windowDays} DAY;
  `);

  const delivered = Number(row?.delivered ?? 0);
  const opens = Number(row?.opens ?? 0);
  const clicks = Number(row?.clicks ?? 0);
  const revenue = Number(row?.revenue ?? 0);

  return {
    windowDays,
    summary: {
      delivered,
      openRate: delivered ? opens / delivered : 0,
      clickRate: delivered ? clicks / delivered : 0,
      revenuePerRecipient: delivered ? revenue / delivered : 0,
      totalRevenue: revenue
    }
  };
};

export const getFlowMetrics = async () =>
  runQuery(`
    SELECT
      flow_name,
      region,
      SUM(total_delivered) AS total_delivered,
      AVG(open_rate) AS avg_open_rate,
      AVG(click_rate) AS avg_click_rate,
      SUM(total_placed_order_value) AS total_revenue
    FROM flow_performance
    GROUP BY flow_name, region
    ORDER BY total_revenue DESC;
  `);

export const getCampaignMetrics = async () =>
  runQuery(`
    SELECT
      campaign_message_name,
      region,
      send_date,
      total_delivered,
      open_rate,
      click_rate,
      revenue_per_recipient,
      total_placed_order_value
    FROM campaign_performance
    ORDER BY send_date DESC
    LIMIT 100;
  `);

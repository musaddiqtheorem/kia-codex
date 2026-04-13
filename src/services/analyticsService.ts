import { env } from '../config/env';

export const getOverallMetrics = (days?: number) => ({
  windowDays: days ?? env.DEFAULT_ROLLING_DAYS,
  summary: {
    delivered: 0,
    openRate: 0,
    clickRate: 0,
    revenuePerRecipient: 0,
    totalRevenue: 0
  },
  message: 'Scaffold response. Connect ingestion tables to compute real KPIs.'
});

export const getFlowMetrics = () => ({
  flows: [],
  message: 'Scaffold response. Flow analytics will be available after ETL ingestion.'
});

export const getCampaignMetrics = () => ({
  campaigns: [],
  message: 'Scaffold response. Campaign analytics will be available after ETL ingestion.'
});

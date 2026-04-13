export type FilterSet = {
  days?: number;
  region?: string;
  persona?: string;
  channel?: string;
};

export type HealthResponse = {
  status: 'ok';
  service: string;
  timestamp: string;
};

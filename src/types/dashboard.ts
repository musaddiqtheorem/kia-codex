export type WidgetType = 'kpi_open_rate' | 'kpi_click_rate' | 'trend_revenue' | 'table_campaigns';

export type WidgetConfig = {
  id: string;
  type: WidgetType;
  title: string;
  position: { x: number; y: number; w: number; h: number };
};

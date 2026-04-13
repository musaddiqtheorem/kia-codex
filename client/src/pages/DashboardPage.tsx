import { useEffect, useMemo, useState } from 'react';

type Widget = {
  id: string;
  type: string;
  title: string;
  position: { x: number; y: number; w: number; h: number };
};

type DashboardRecord = {
  id: string;
  name: string;
  widgets_json: string;
};

const API_BASE = 'http://localhost:3001/api';

const DashboardPage = () => {
  const [dashboardId, setDashboardId] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const response = await fetch(`${API_BASE}/dashboard/default`);
      const data: { dashboard: DashboardRecord | null } = await response.json();

      if (!data.dashboard) {
        const initialWidgets: Widget[] = [
          { id: 'open-rate', type: 'kpi_open_rate', title: 'Open Rate', position: { x: 0, y: 0, w: 4, h: 2 } }
        ];

        const createResponse = await fetch(`${API_BASE}/dashboard`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Default Dashboard', widgets: initialWidgets, globalFilters: { days: 90 } })
        });
        const created: { id: string } = await createResponse.json();
        setDashboardId(created.id);
        setWidgets(initialWidgets);
        return;
      }

      setDashboardId(data.dashboard.id);
      setWidgets(JSON.parse(data.dashboard.widgets_json) as Widget[]);
    };

    load().catch(() => {
      setWidgets([]);
    });
  }, []);

  const widgetCountLabel = useMemo(() => `${widgets.length} widget${widgets.length === 1 ? '' : 's'}`, [widgets.length]);

  const addWidget = () => {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type: 'table_campaigns',
      title: 'Top Campaigns',
      position: { x: 0, y: widgets.length, w: 6, h: 3 }
    };
    setWidgets((prev) => [...prev, newWidget]);
  };

  const saveLayout = async () => {
    if (!dashboardId) return;

    setSaving(true);
    await fetch(`${API_BASE}/dashboard/${dashboardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Default Dashboard', widgets, globalFilters: { days: 90 } })
    });
    setSaving(false);
  };

  return (
    <section>
      <h2>Dashboard Widget Engine</h2>
      <p>Persisted layout is stored in DuckDB (`dashboard_configs`). Current: {widgetCountLabel}.</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button type="button" onClick={addWidget}>Add Widget</button>
        <button type="button" onClick={saveLayout} disabled={saving}>{saving ? 'Saving...' : 'Save Layout'}</button>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {widgets.map((widget) => (
          <article key={widget.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10 }}>
            <strong>{widget.title}</strong>
            <div>Type: {widget.type}</div>
            <div>Grid: {widget.position.w}x{widget.position.h}</div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default DashboardPage;

import { useEffect, useState } from 'react';

const API_BASE = 'http://localhost:3001/api';

type Insight = {
  id: string;
  title: string;
  summary: string;
  priority: string;
};

const AIInsightsPage = () => {
  const [insights, setInsights] = useState<Insight[]>([]);

  const load = async () => {
    const response = await fetch(`${API_BASE}/ai/insights`);
    const data: { insights: Insight[] } = await response.json();
    setInsights(data.insights || []);
  };

  useEffect(() => {
    load().catch(() => setInsights([]));
  }, []);

  const generate = async () => {
    await fetch(`${API_BASE}/ai/insights/generate`, { method: 'POST' });
    setTimeout(() => {
      load().catch(() => setInsights([]));
    }, 500);
  };

  return (
    <section>
      <h2>AI Insights</h2>
      <button type="button" onClick={generate}>Generate Insight</button>
      <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
        {insights.map((insight) => (
          <article key={insight.id} style={{ border: '1px solid #ddd', padding: 10, borderRadius: 8 }}>
            <strong>{insight.title}</strong>
            <div>{insight.summary}</div>
            <small>Priority: {insight.priority}</small>
          </article>
        ))}
      </div>
    </section>
  );
};

export default AIInsightsPage;

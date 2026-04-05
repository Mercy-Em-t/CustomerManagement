export default function AnalyticsPanel({ summary }) {
  return (
    <div>
      <h3>Analytics</h3>
      <p>Orders Count: {summary.ordersCount || 0}</p>
      <p>Conversion Rate: {(Number(summary.conversionRate || 0) * 100).toFixed(1)}%</p>
      <h4>Top Intents</h4>
      <ul>
        {(summary.topIntents || []).map((i) => (
          <li key={i.intent || 'unknown'}>
            {i.intent || 'unknown'}: {i.count}
          </li>
        ))}
      </ul>
      <h4>Top Products (by stock)</h4>
      <ul>
        {(summary.topProducts || []).map((p) => (
          <li key={p.id || p.name}>{p.name} ({p.stock})</li>
        ))}
      </ul>
    </div>
  );
}

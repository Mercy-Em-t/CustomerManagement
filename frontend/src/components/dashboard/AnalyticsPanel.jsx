export default function AnalyticsPanel({ summary }) {
  return (
    <div>
      <h3>Analytics</h3>
      <p>Conversion Rate: {(Number(summary.conversionRate || 0) * 100).toFixed(1)}%</p>
      <ul>
        {(summary.topIntents || []).map((i) => (
          <li key={i.intent || 'unknown'}>
            {i.intent || 'unknown'}: {i.count}
          </li>
        ))}
      </ul>
    </div>
  );
}

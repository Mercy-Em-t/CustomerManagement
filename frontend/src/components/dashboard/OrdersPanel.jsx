export default function OrdersPanel({ orders }) {
  const totalRevenue = (orders || []).reduce((sum, o) => sum + Number(o.total || 0), 0);
  return (
    <div>
      <h3>Orders</h3>
      <p><strong>Count:</strong> {(orders || []).length}</p>
      <p><strong>Revenue:</strong> {totalRevenue.toFixed(2)}</p>
      <ul>
        {(orders || []).slice(0, 10).map((o) => (
          <li key={o.id || o.orderId}>
            {(o.id || o.orderId)} - {o.status} - {o.total}
          </li>
        ))}
      </ul>
    </div>
  );
}

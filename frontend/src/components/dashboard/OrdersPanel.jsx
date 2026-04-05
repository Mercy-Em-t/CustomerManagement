export default function OrdersPanel({ orders }) {
  return (
    <div>
      <h3>Orders</h3>
      <ul>
        {orders.map((o) => (
          <li key={o.id || o.orderId}>
            {(o.id || o.orderId)} - {o.status} - {o.total}
          </li>
        ))}
      </ul>
    </div>
  );
}

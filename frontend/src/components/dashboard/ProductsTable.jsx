import { useMemo, useState } from 'react';

export default function ProductsTable({ products, syncStatus }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const categories = useMemo(() => {
    const values = Array.from(new Set((products || []).map((p) => p.category).filter(Boolean)));
    return values.sort();
  }, [products]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (products || []).filter((p) => {
      const matchesText = !needle || String(p.name || '').toLowerCase().includes(needle);
      const matchesCategory = category === 'all' || String(p.category || '') === category;
      return matchesText && matchesCategory;
    });
  }, [products, query, category]);

  return (
    <div>
      <h3>Products</h3>
      {syncStatus && (
        <div className="sync-status">
          <div><strong>Sync mode:</strong> {syncStatus.sync_mode || 'manual'}</div>
          <div><strong>Status:</strong> {syncStatus.sync_status || 'idle'}</div>
          <div><strong>Last synced:</strong> {syncStatus.sync_last_synced_at || 'never'}</div>
          {syncStatus.sync_error ? <div className="error">Sync error: {syncStatus.sync_error}</div> : null}
        </div>
      )}
      <div className="table-filters">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.category || '-'}</td>
              <td>{p.price}</td>
              <td>{p.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

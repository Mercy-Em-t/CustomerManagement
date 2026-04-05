import { useState } from 'react';
import ChatBox from './components/ChatBox.jsx';
import MessageInput from './components/MessageInput.jsx';
import ProductsTable from './components/dashboard/ProductsTable.jsx';
import OrdersPanel from './components/dashboard/OrdersPanel.jsx';
import AnalyticsPanel from './components/dashboard/AnalyticsPanel.jsx';
import BrainEditor from './components/dashboard/BrainEditor.jsx';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_KEY = import.meta.env.VITE_API_KEY || 'demo-key';
const BUSINESS_ID = import.meta.env.VITE_BUSINESS_ID || 'my_shop';
const USER_ID = import.meta.env.VITE_USER_ID || 'demo_user_1';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState({ topIntents: [], conversionRate: 0 });
  const [brain, setBrain] = useState({});
  const [syncStatus, setSyncStatus] = useState(null);
  const [systemManual, setSystemManual] = useState(null);

  async function sendMessage(text) {
    const userMessage = { sender: 'user', text };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'x-business-id': BUSINESS_ID,
        },
        body: JSON.stringify({
          message: text,
          user_id: USER_ID,
          business_id: BUSINESS_ID,
        }),
      });

      const data = await res.json();
      const aiText = data.response || data.reply || 'Sorry, I could not process that.';
      const aiMessage = { sender: 'ai', text: aiText, recommendations: data.recommendations || [] };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'ai', text: 'Network error. Please try again.' }]);
    }
  }

  async function fetchAdminData() {
    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'x-business-id': BUSINESS_ID,
    };

    const [productsRes, ordersRes, analyticsRes, brainRes, syncRes, manualRes] = await Promise.all([
      fetch(`${API_BASE}/api/products`, { headers }),
      fetch(`${API_BASE}/api/orders`, { headers }),
      fetch(`${API_BASE}/api/analytics/summary`, { headers }),
      fetch(`${API_BASE}/api/brain`, { headers }),
      fetch(`${API_BASE}/api/sync/products/status`, { headers }),
      fetch(`${API_BASE}/api/system-admin/manual`, { headers }),
    ]);

    const [productsData, ordersData, analyticsData, brainData, syncData, manualData] = await Promise.all([
      productsRes.json(),
      ordersRes.json(),
      analyticsRes.json(),
      brainRes.json(),
      syncRes.json(),
      manualRes.json(),
    ]);

    setProducts(productsData.products || []);
    setOrders(ordersData.orders || []);
    setSummary((analyticsData && analyticsData.summary) || { topIntents: [], conversionRate: 0 });
    setBrain((brainData && brainData.brain) || {});
    setSyncStatus((syncData && syncData.status) || null);
    setSystemManual((manualData && manualData.manual) || null);
  }

  async function triggerSync() {
    await fetch(`${API_BASE}/api/sync/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'x-business-id': BUSINESS_ID,
      },
    });
    await fetchAdminData();
  }

  async function publishBrain(nextBrain) {
    await fetch(`${API_BASE}/api/brain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'x-business-id': BUSINESS_ID,
      },
      body: JSON.stringify(nextBrain),
    });
    await fetchAdminData();
  }

  return (
    <div className="app">
      <h2>SalesBrain Chat</h2>
      <ChatBox messages={messages} />
      <MessageInput onSend={sendMessage} />
      <hr />
      <h2>Admin Dashboard</h2>
      <div className="dashboard-actions">
        <button onClick={fetchAdminData}>Refresh Dashboard</button>
        <button onClick={triggerSync}>Sync Products</button>
      </div>
      <ProductsTable products={products} syncStatus={syncStatus} />
      <OrdersPanel orders={orders} />
      <AnalyticsPanel summary={summary} />
      <BrainEditor brain={brain} onPublish={publishBrain} />
      <div>
        <h3>System Admin Manual</h3>
        {systemManual ? (
          <pre className="admin-manual">{systemManual.content}</pre>
        ) : (
          <p>Click "Refresh Dashboard" to load manual.</p>
        )}
      </div>
    </div>
  );
}

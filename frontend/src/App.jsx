import { useState } from 'react';
import ChatBox from './components/ChatBox.jsx';
import MessageInput from './components/MessageInput.jsx';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_KEY = import.meta.env.VITE_API_KEY || 'demo-key';
const BUSINESS_ID = import.meta.env.VITE_BUSINESS_ID || 'my_shop';
const USER_ID = import.meta.env.VITE_USER_ID || 'demo_user_1';

export default function App() {
  const [messages, setMessages] = useState([]);

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
      const aiMessage = { sender: 'ai', text: aiText };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      setMessages((prev) => [...prev, { sender: 'ai', text: 'Network error. Please try again.' }]);
    }
  }

  return (
    <div className="app">
      <h2>SalesBrain Chat</h2>
      <ChatBox messages={messages} />
      <MessageInput onSend={sendMessage} />
    </div>
  );
}

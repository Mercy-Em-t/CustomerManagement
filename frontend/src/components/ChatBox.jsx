export default function ChatBox({ messages }) {
  return (
    <div className="chat-box">
      {messages.map((msg, i) => (
        <div key={`${msg.sender}-${i}`} className={msg.sender === 'user' ? 'user' : 'ai'}>
          {msg.text}
        </div>
      ))}
    </div>
  );
}

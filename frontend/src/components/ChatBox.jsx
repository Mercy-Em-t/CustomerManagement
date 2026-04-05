export default function ChatBox({ messages }) {
  return (
    <div className="chat-box">
      {messages.map((msg, i) => (
        <div key={`${msg.sender}-${i}`} className={msg.sender === 'user' ? 'user' : 'ai'}>
          <div>{msg.text}</div>
          {Array.isArray(msg.recommendations) && msg.recommendations.length > 0 && (
            <div className="recommendations">
              <strong>Suggestions:</strong>{' '}
              {msg.recommendations.map((r) => r.name).filter(Boolean).join(', ')}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

import { useEffect, useState } from 'react';

export default function BrainEditor({ brain, onPublish }) {
  const [text, setText] = useState('{}');
  const [status, setStatus] = useState('');

  useEffect(() => {
    setText(JSON.stringify(brain || {}, null, 2));
  }, [brain]);

  async function publish() {
    setStatus('');
    try {
      const parsed = JSON.parse(text);
      await onPublish(parsed);
      setStatus('Brain published successfully.');
    } catch (err) {
      setStatus(`Publish failed: ${err.message || 'Invalid JSON or server error.'}`);
    }
  }

  return (
    <div>
      <h3>Brain</h3>
      <textarea
        className="brain-editor"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="dashboard-actions">
        <button onClick={publish}>Save & Publish</button>
      </div>
      {status ? <p>{status}</p> : null}
    </div>
  );
}

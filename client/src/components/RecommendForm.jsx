import React, { useState } from 'react';

export default function RecommendForm({ onResults }) {
  const [queryText, setQueryText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestRecommendations = async () => {
    if (!queryText || queryText.trim().length === 0) {
      setError('Please enter a query');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8000/api/chat/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      onResults && onResults([], data.answer || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recommend-form upload-card ask-card">
      <div className="upload-card-header">
        <div className="upload-title">❓ Ask Questions</div>
      </div>
      <div className="upload-card-body">
        <div className="info-alert">Please upload a PDF document first before asking questions.</div>

        <label className="field-label" style={{ marginTop: 18 }}>Your Question</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input className="text-input" placeholder="Ask a question about your PDF…" value={queryText} onChange={(e) => setQueryText(e.target.value)} />
          <button className="btn-primary" onClick={requestRecommendations} disabled={loading}>{loading ? 'Asking…' : 'Ask'}</button>
        </div>

        {error && <div className="msg error" style={{ marginTop: 12 }}>{error}</div>}
      </div>
    </div>
  );
}

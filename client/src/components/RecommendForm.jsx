import React, { useState } from 'react';

export default function RecommendForm({ onResults }) {
  const [queryText, setQueryText] = useState('Given the uploaded product catalog, suggest 3 products for a user who likes running and prefers footwear under $100.');
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
      // The /ask endpoint returns { answer, ... }
      onResults && onResults([], data.answer || '');
      console.log(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  



  return (
    <div className="recommend-form panel">
      <h3>Ask (text recommendation)</h3>
      <textarea value={queryText} onChange={(e) => setQueryText(e.target.value)} rows={4} />
      <div>
        <button onClick={requestRecommendations} disabled={loading}>Ask</button>
        {error && <div className="msg error">{error}</div>}
      </div>
    </div>
  );
}

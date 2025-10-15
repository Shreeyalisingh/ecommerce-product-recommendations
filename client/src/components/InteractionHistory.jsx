import React, { useState, useEffect } from 'react';
import { getUserInteractions, getSessionId } from '../utils/api';

export default function InteractionHistory() {
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchInteractions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserInteractions({
        sessionId: getSessionId(),
        type: filter === 'all' ? undefined : filter,
        limit: 30,
      });
      setInteractions(data.interactions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInteractions();
  }, [filter]);

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="interaction-history upload-card">
      <div className="upload-card-header">
        <div className="upload-title">📊 Interaction History</div>
      </div>
      <div className="upload-card-body">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <select
            className="text-input"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="all">All Interactions</option>
            <option value="query">Queries</option>
            <option value="recommendation_shown">Recommendations</option>
            <option value="view">Product Views</option>
            <option value="click">Clicks</option>
          </select>
          <button className="btn-primary" onClick={fetchInteractions} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {error && <div className="msg error">{error}</div>}

        {interactions.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>No interactions yet</p>
            <small>Start browsing products or asking questions</small>
          </div>
        )}

        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {interactions.map((interaction) => (
            <div
              key={interaction._id}
              style={{
                border: '1px solid #f1d8df',
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
                background: '#fff7f9',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 'bold', color: 'var(--accent)', fontSize: '0.85rem' }}>
                  {interaction.interactionType}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#7a6b79' }}>
                  {formatDate(interaction.timestamp)}
                </span>
              </div>
              
              {interaction.query && (
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ fontSize: '0.8rem' }}>Query:</strong>
                  <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#2b2b2b' }}>{interaction.query}</p>
                </div>
              )}
              
              {interaction.products && interaction.products.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <strong style={{ fontSize: '0.8rem' }}>Products ({interaction.products.length}):</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: 20, fontSize: '0.8rem' }}>
                    {interaction.products.slice(0, 3).map((p, i) => (
                      <li key={i} style={{ color: '#2b2b2b' }}>
                        {p.productTitle} {p.relevanceScore && `(Score: ${p.relevanceScore})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {interaction.aiResponse && (
                <div>
                  <strong style={{ fontSize: '0.8rem' }}>AI Response:</strong>
                  <p style={{ margin: '4px 0', fontSize: '0.8rem', color: '#7a6b79', maxHeight: 100, overflow: 'hidden' }}>
                    {interaction.aiResponse.substring(0, 200)}...
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

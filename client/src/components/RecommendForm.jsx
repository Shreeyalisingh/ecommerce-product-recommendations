import React, { useState } from 'react';
import { askQuestion, getRecommendations } from '../utils/api';

export default function RecommendForm({ onResults, onRecommendations }) {
  const [queryText, setQueryText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState('ask'); // 'ask' or 'recommend'

  // For recommendation mode
  const [behavior, setBehavior] = useState({
    preferences: {
      categories: [],
      maxPrice: 100,
      tags: []
    },
    viewed: [],
    purchased: []
  });

  const handleAsk = async () => {
    if (!queryText || queryText.trim().length === 0) {
      setError('Please enter a query');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await askQuestion(queryText);
      onResults && onResults([], data.answer || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommend = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRecommendations(behavior, 5);
      onRecommendations && onRecommendations(data.recommendations || [], data.explanation || '');
      onResults && onResults(data.recommendations || [], data.explanation || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recommend-form upload-card ask-card">
      <div className="upload-card-header">
        <div className="upload-title">
          {mode === 'ask' ? '❓ Ask Questions' : '🎯 Get Recommendations'}
        </div>
      </div>
      <div className="upload-card-body">
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button 
            className={mode === 'ask' ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setMode('ask')}
            style={{ flex: 1 }}
          >
            Ask Questions
          </button>
          <button 
            className={mode === 'recommend' ? 'btn-primary' : 'btn-ghost'}
            onClick={() => setMode('recommend')}
            style={{ flex: 1 }}
          >
            Get Recommendations
          </button>
        </div>

        {mode === 'ask' ? (
          <>
            <div className="info-alert">Please upload a PDF document first before asking questions.</div>
            <label className="field-label" style={{ marginTop: 18 }}>Your Question</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input 
                className="text-input" 
                placeholder="Ask a question about your PDF…" 
                value={queryText} 
                onChange={(e) => setQueryText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
              />
              <button className="btn-primary" onClick={handleAsk} disabled={loading}>
                {loading ? 'Asking…' : 'Ask'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="info-alert">Set your preferences to get personalized product recommendations.</div>
            
            <label className="field-label" style={{ marginTop: 18 }}>Max Price ($)</label>
            <input 
              className="text-input" 
              type="number"
              placeholder="Maximum price" 
              value={behavior.preferences.maxPrice} 
              onChange={(e) => setBehavior({
                ...behavior,
                preferences: { ...behavior.preferences, maxPrice: parseFloat(e.target.value) || 0 }
              })}
            />

            <label className="field-label" style={{ marginTop: 12 }}>Preferred Categories (comma-separated)</label>
            <input 
              className="text-input" 
              placeholder="e.g., running, footwear" 
              value={behavior.preferences.categories.join(', ')} 
              onChange={(e) => setBehavior({
                ...behavior,
                preferences: { 
                  ...behavior.preferences, 
                  categories: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                }
              })}
            />

            <label className="field-label" style={{ marginTop: 12 }}>Preferred Tags (comma-separated)</label>
            <input 
              className="text-input" 
              placeholder="e.g., lightweight, comfortable" 
              value={behavior.preferences.tags.join(', ')} 
              onChange={(e) => setBehavior({
                ...behavior,
                preferences: { 
                  ...behavior.preferences, 
                  tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                }
              })}
            />

            <button 
              className="btn-primary" 
              onClick={handleRecommend} 
              disabled={loading}
              style={{ marginTop: 12, width: '100%' }}
            >
              {loading ? 'Getting Recommendations…' : 'Get Recommendations'}
            </button>
          </>
        )}

        {error && <div className="msg error" style={{ marginTop: 12 }}>{error}</div>}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import CatalogUploader from './CatalogUploader';
import RecommendForm from './RecommendForm';
import RecommendationList from './RecommendationList';
import ProductBrowser from './ProductBrowser';
import InteractionHistory from './InteractionHistory';

export default function RecommendationDashboard() {
  const [recommendations, setRecommendations] = useState([]);
  const [explanation, setExplanation] = useState('');
  const [catalogStatus, setCatalogStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('query'); // 'query', 'products', 'history'

  const handleRecommendations = (recs, exp) => {
    setRecommendations(recs || []);
    setExplanation(exp || '');
  };

  return (
    <div className="dashboard">
      <div style={{ maxWidth: 1700, margin: '0 auto' }}>
        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          gap: 12, 
          marginBottom: 20, 
          borderBottom: '2px solid rgba(255,111,161,0.2)',
          padding: '0 0 12px 0'
        }}>
          <button
            onClick={() => setActiveTab('query')}
            style={{
              padding: '8px 20px',
              background: activeTab === 'query' ? 'linear-gradient(90deg,var(--accent),var(--accent-2))' : 'transparent',
              color: activeTab === 'query' ? 'white' : 'var(--text)',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📝 Query & Upload
          </button>
          <button
            onClick={() => setActiveTab('products')}
            style={{
              padding: '8px 20px',
              background: activeTab === 'products' ? 'linear-gradient(90deg,var(--accent),var(--accent-2))' : 'transparent',
              color: activeTab === 'products' ? 'white' : 'var(--text)',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            🛍️ Browse Products
          </button>
          <button
            onClick={() => setActiveTab('history')}
            style={{
              padding: '8px 20px',
              background: activeTab === 'history' ? 'linear-gradient(90deg,var(--accent),var(--accent-2))' : 'transparent',
              color: activeTab === 'history' ? 'white' : 'var(--text)',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            📊 History
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'query' && (
          <>
            <CatalogUploader onUploaded={(msg) => setCatalogStatus(msg)} />
            <RecommendForm
              onResults={handleRecommendations}
              onRecommendations={handleRecommendations}
            />
            <div style={{ marginTop: 20 }}>
              <RecommendationList items={recommendations} explanation={explanation} />
            </div>
          </>
        )}

        {activeTab === 'products' && (
          <ProductBrowser onProductSelect={(product) => {
            console.log('Selected product:', product);
            // Could add to viewed products for recommendations
          }} />
        )}

        {activeTab === 'history' && (
          <InteractionHistory />
        )}
      </div>
    </div>
  );
}

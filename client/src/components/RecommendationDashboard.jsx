import React, { useState } from 'react';
import CatalogUploader from './CatalogUploader';
import RecommendForm from './RecommendForm';
import RecommendationList from './RecommendationList';

export default function RecommendationDashboard() {
  const [recommendations, setRecommendations] = useState([]);
  const [explanation, setExplanation] = useState('');
  const [catalogStatus, setCatalogStatus] = useState(null);


  return (
    <div className="dashboard">
      <div style={{ maxWidth: 1700, margin: '0 auto' }}>
        <CatalogUploader onUploaded={(msg) => setCatalogStatus(msg)} />
        <RecommendForm
          onResults={(recs, exp) => {
            setRecommendations(recs || []);
            setExplanation(exp || '');
          }}
        />

        <div style={{ marginTop: 20 }}>
          <RecommendationList items={recommendations} explanation={explanation} />
        </div>
      </div>
    </div>
  );
}

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
      <section className="left">
        <CatalogUploader onUploaded={(msg) => setCatalogStatus(msg)} />
        <RecommendForm
          onResults={(recs, exp) => {
            setRecommendations(recs || []);
            setExplanation(exp || '');
          }}
        />
      </section>
      <section className="right">
        <h2>Recommendations</h2>
        <RecommendationList items={recommendations} explanation={explanation}  />
      </section>
    </div>
  );
}

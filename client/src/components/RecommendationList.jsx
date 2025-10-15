import React from 'react';

export default function RecommendationList({ items = [], explanation }) {
  const parseMarkdown = (text) => {
    if (!text) return 'No explanation yet';
    
    let html = text;
    
    // Headers (## and ###)
    html = html.replace(/^### (.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^## (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^# (.+)$/gm, '<h3>$1</h3>');
    
    // Bold (**text**)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Bullet points with dashes
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    
    // Wrap consecutive <li> elements in <ul>
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);
    
    // Horizontal rules (---)
    html = html.replace(/^---$/gm, '<hr />');
    
    // Line breaks
    html = html.replace(/\n/g, '<br />');
    
    return html;
  };

  return (
    <>
      <div className="explanation panel">
        <h4>LLM Explanation</h4>
        <div 
          className="parsed-content"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(explanation) }}
        />
      </div>
      <ul>
        {items.map((it) => (
          <li key={it.id} className="rec-item">
            <div className="title">{it.title} <span className="score">({it.score})</span></div>
            <div className="meta">{it.category} — ${it.price}</div>
            <div className="desc">{it.description}</div>
            {it.tags && it.tags.length > 0 && <div className="tags">Tags: {it.tags.join(', ')}</div>}
          </li>
        ))}
      </ul>
    </>
  );
}
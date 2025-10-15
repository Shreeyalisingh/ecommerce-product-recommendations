import React, { useState } from 'react';
import { uploadPdf } from '../utils/api';

export default function CatalogUploader({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Please choose a PDF file first' });
      return;
    }

    setLoading(true);
    setMessage(null);
    setPreview(null);
    
    try {
      const data = await uploadPdf(file);
      const extractionMsg = data.productsExtracted > 0
        ? `Successfully extracted and saved ${data.productsExtracted} products to database!`
        : data.totalFound > 0
        ? `Found ${data.totalFound} products but could not save them (check for duplicates)`
        : 'PDF uploaded but no products were found in the text';
      
      setMessage({ 
        type: data.productsExtracted > 0 ? 'success' : 'error', 
        text: extractionMsg
      });
      
      if (data.preview) {
        setPreview(data.preview);
      }
      
      // Show detailed stats if available
      if (data.totalFound || data.duplicatesSkipped) {
        const stats = [];
        if (data.totalFound) stats.push(`${data.totalFound} found`);
        if (data.productsExtracted) stats.push(`${data.productsExtracted} saved`);
        if (data.duplicatesSkipped) stats.push(`${data.duplicatesSkipped} duplicates skipped`);
        
        if (stats.length > 0) {
          setMessage(prev => ({
            ...prev,
            text: `${prev.text} (${stats.join(', ')})`
          }));
        }
      }
      
      onUploaded && onUploaded(data);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="catalog-uploader upload-card">
      <div className="upload-card-header">
        <div className="upload-title">☁️ Upload catalog</div>
      </div>

      <div className="upload-card-body">
        <label className="field-label" style={{ marginTop: 12 }}>Choose File to Upload</label>
        <div className="file-drop">
          <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </div>

        <div style={{ marginTop: 12 }}>
          <button className="btn-primary" onClick={handleUpload} disabled={loading}>{loading ? 'Uploading...' : 'Upload PDF'}</button>
        </div>

        {message && <div className={`msg ${message.type}`}>{message.text}</div>}
        {preview && (
          <div className="panel preview-panel" style={{ marginTop: 12 }}>
            <strong>Preview:</strong>
            <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 160, overflow: 'auto' }}>{preview}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

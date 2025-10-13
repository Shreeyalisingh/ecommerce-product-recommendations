import React, { useState } from 'react';

export default function CatalogUploader({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [preview, setPreview] = useState(null);

  const uploadPdf = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Please choose a PDF file first' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append('pdf', file, file.name);

      const res = await fetch('http://localhost:8000/api/chat/pdf-upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setMessage({ type: 'success', text: data.message || 'Uploaded' });
      setPreview(data.preview || null);
      onUploaded && onUploaded(data);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="catalog-uploader panel">
      <h3>PDF Uploader</h3>
      <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <div>
        <button onClick={uploadPdf} disabled={loading}>Upload PDF</button>
      </div>
      {message && <div className={`msg ${message.type}`}>{message.text}</div>}
      {preview && (
        <div className="panel" style={{ marginTop: 8 }}>
          <strong>Preview:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 160, overflow: 'auto' }}>{preview}</pre>
        </div>
      )}
    </div>
  );
}

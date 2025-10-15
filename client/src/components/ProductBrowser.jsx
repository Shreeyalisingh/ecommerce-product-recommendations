import React, { useState, useEffect } from 'react';
import { getProducts } from '../utils/api';

export default function ProductBrowser({ onProductSelect }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
  });

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts({
        ...filters,
        limit: 20,
      });
      setProducts(data.products || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = () => {
    fetchProducts();
  };

  return (
    <div className="product-browser upload-card">
      <div className="upload-card-header">
        <div className="upload-title">🛍️ Browse Products</div>
      </div>
      <div className="upload-card-body">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            className="text-input"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ flex: 1, minWidth: 200 }}
          />
          <input
            className="text-input"
            placeholder="Category"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            style={{ width: 150 }}
          />
          <input
            className="text-input"
            type="number"
            placeholder="Min $"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
            style={{ width: 100 }}
          />
          <input
            className="text-input"
            type="number"
            placeholder="Max $"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
            style={{ width: 100 }}
          />
          <button className="btn-primary" onClick={handleSearch} disabled={loading}>
            {loading ? 'Loading...' : 'Search'}
          </button>
        </div>

        {error && <div className="msg error">{error}</div>}

        {products.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <p>No products found</p>
            <small>Upload a catalog or add products manually</small>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {products.map((product) => (
            <div
              key={product._id}
              className="product-card"
              onClick={() => onProductSelect && onProductSelect(product)}
              style={{
                border: '1px solid #f1d8df',
                borderRadius: 8,
                padding: 12,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(255,111,161,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <h4 style={{ margin: '0 0 8px', fontSize: '1rem', color: '#2b2b2b' }}>{product.title}</h4>
              <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: '#7a6b79' }}>{product.category}</p>
              <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: 'var(--accent)' }}>${product.price}</p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#7a6b79', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {product.description}
              </p>
              {product.tags && product.tags.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {product.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} style={{ fontSize: '0.7rem', background: '#fff7f9', padding: '2px 6px', borderRadius: 4, color: '#7a6b79' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

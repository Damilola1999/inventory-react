import { useEffect, useState } from 'react';
import { ApiError } from '../model';
import {
  productService,
  formatPrice,
  getStockStatus,
  stockLabel,
  type Product,
  type ProductListResponse,
} from '../productService';
import './Product.css';
interface Props {
  onSelect: (id: string) => void;
}

interface Filters {
  search: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
}

const PAGE_SIZE = 8;

const initialFilters: Filters = {
  search: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  inStock: false,
};

function ProductCard({ product, onSelect }: { product: Product; onSelect: (id: string) => void }) {
  const status = getStockStatus(product);

  return (
    <button type="button" className="product-card" onClick={() => onSelect(product._id)}>
      <div className="product-thumb" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
          <path d="m3 8 9 5 9-5M12 13v8" />
        </svg>
      </div>
      <span className="product-name">{product.name}</span>
      <span className="product-price">{formatPrice(product.price)}</span>
      <span className={`badge badge-${status}`}>{stockLabel(product)}</span>
    </button>
  );
}

export default function ProductList({ onSelect }: Props) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [applied, setApplied] = useState<Filters>(initialFilters);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [data, setData] = useState<ProductListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Debounce filter changes and go back to page 1 whenever they change.
  useEffect(() => {
    const t = setTimeout(() => {
      setApplied(filters);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [filters]);

  // Build the category chips from the categories that exist in the backend.
  useEffect(() => {
    productService
      .list({ limit: 100 })
      .then((res) => {
        const unique = Array.from(new Set(res.products.map((p) => p.category))).filter(Boolean);
        setCategories(unique.sort());
      })
      .catch(() => {
        /* chips are optional; the main list shows any real error */
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    productService
      .list({
        search: applied.search.trim() || undefined,
        category: applied.category || undefined,
        minPrice: applied.minPrice !== '' ? Number(applied.minPrice) : undefined,
        maxPrice: applied.maxPrice !== '' ? Number(applied.maxPrice) : undefined,
        inStock: applied.inStock,
        page,
        limit: PAGE_SIZE,
      })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          setError('Please log in to view products.');
        } else {
          setError(err instanceof ApiError ? err.message : 'Network error. Please try again.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [applied, page]);

  const update = <K extends keyof Filters>(key: K, value: Filters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const hasFilters = JSON.stringify(filters) !== JSON.stringify(initialFilters);

  return (
    <section className="shop-panel">
      <h1 className="shop-title">Products</h1>

      <div className="search">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => update('search', e.target.value)}
        />
      </div>

      <div className="chips" role="group" aria-label="Categories">
        <button
          type="button"
          className={`chip ${filters.category === '' ? 'chip-active' : ''}`}
          onClick={() => update('category', '')}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={`chip ${filters.category === c ? 'chip-active' : ''}`}
            onClick={() => update('category', c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="filter-row">
        <label>
          Min price
          <input
            type="number"
            min="0"
            inputMode="decimal"
            value={filters.minPrice}
            onChange={(e) => update('minPrice', e.target.value)}
            placeholder="0"
          />
        </label>
        <label>
          Max price
          <input
            type="number"
            min="0"
            inputMode="decimal"
            value={filters.maxPrice}
            onChange={(e) => update('maxPrice', e.target.value)}
            placeholder="Any"
          />
        </label>
        <label className="switch-row">
          <span>In stock only</span>
          <input
            type="checkbox"
            className="switch"
            checked={filters.inStock}
            onChange={(e) => update('inStock', e.target.checked)}
          />
        </label>
      </div>

      {hasFilters && (
        <button type="button" className="link-btn" onClick={() => setFilters(initialFilters)}>
          Clear filters
        </button>
      )}

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      {loading && !data && <p className="muted center">Loading products…</p>}

      {data && (
        <>
          {data.products.length === 0 ? (
            <p className="muted center">No products match your filters.</p>
          ) : (
            <div className={`product-grid ${loading ? 'is-loading' : ''}`}>
              {data.products.map((p) => (
                <ProductCard key={p._id} product={p} onSelect={onSelect} />
              ))}
            </div>
          )}

          {data.pages > 1 && (
            <nav className="pagination" aria-label="Pagination">
              <button
                type="button"
                className="btn-secondary small"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>
                Page {data.page} of {data.pages} · {data.total} products
              </span>
              <button
                type="button"
                className="btn-secondary small"
                disabled={page >= data.pages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
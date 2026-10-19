import { useEffect, useState } from 'react';
import { ApiError } from '../model';
import {
  productService,
  formatPrice,
  getStockStatus,
  stockLabel,
  type Product,
} from '../productService';
import './Product.css';

interface CartItem {
  product: Product;
  quantity: number;
}

interface Props {
  id: string;
  onBack: () => void;
  onAddToCart?: (product: Product, quantity: number) => void;
}

export default function ProductDetail({ id, onBack, onAddToCart }: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setQuantity(1);
    setAdded('');

    productService
      .getById(id)
      .then((p) => {
        if (!cancelled) setProduct(p);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Network error. Please try again.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleAdd = () => {
    if (!product) return;
    const raw = localStorage.getItem('inventory_cart');
    const existing: CartItem[] = raw ? JSON.parse(raw) : [];
    const next = existing.find((c) => c.product._id === product._id)
      ? existing.map((c) =>
          c.product._id === product._id
            ? { ...c, quantity: c.quantity + quantity }
            : c,
        )
      : [...existing, { product, quantity }];
    localStorage.setItem('inventory_cart', JSON.stringify(next));
    window.dispatchEvent(new Event('cart-updated'));
    onAddToCart?.(product, quantity);
    setAdded(`Added ${quantity} × ${product.name} to cart`);
  };

  return (
    <section className="shop-panel">
      <button type="button" className="link-btn back" onClick={onBack}>
        ← Back to products
      </button>

      {loading && <p className="muted center">Loading product…</p>}

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      {product && (
        <article className="detail">
          <div className="detail-thumb" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M21 8 12 3 3 8v8l9 5 9-5V8Z" />
              <path d="m3 8 9 5 9-5M12 13v8" />
            </svg>
          </div>

          <h1 className="detail-name">{product.name}</h1>
          <p className="detail-price">{formatPrice(product.price)}</p>

          <p className="detail-meta">
            <span className={`stock-text stock-${getStockStatus(product)}`}>
              {stockLabel(product)}
            </span>
            <span className="dot">•</span>
            <span>SKU: {product.sku}</span>
          </p>

          <p className="detail-meta">
            <span className="chip chip-static">{product.category}</span>
            {!product.isActive && <span className="badge badge-out">Inactive</span>}
          </p>

          {product.description && <p className="detail-desc">{product.description}</p>}

          <div className="qty-row">
            <span>Quantity</span>
            <div className="qty">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span aria-live="polite">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={handleAdd}
              disabled={product.stock <= 0 || !product.isActive}
            >
              Add to cart
            </button>
          </div>

          {added && <p className="success">{added}</p>}
        </article>
      )}
    </section>
  );
}
import { useEffect, useRef, useState } from 'react';
import { orderService, authService } from '../service';
import type { Product } from '../model';
import './Cart.css';

interface CartItem {
  product: Product;
  quantity: number;
}

interface Props {
  onBack: () => void;
  onAuthenticated: () => void;
}

const newKey = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `key-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function CartPage({ onBack, onAuthenticated }: Props) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const raw = localStorage.getItem('inventory_cart');
    if (!raw) return [];
    try {
      return JSON.parse(raw) as CartItem[];
    } catch {
      return [];
    }
  });
  const [shippingLine1, setShippingLine1] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const checkoutKey = useRef<string>(newKey());

  useEffect(() => {
    const onCartUpdated = () => {
      const raw = localStorage.getItem('inventory_cart');
      if (!raw) {
        setCart([]);
        return;
      }
      try {
        setCart(JSON.parse(raw) as CartItem[]);
      } catch {
        setCart([]);
      }
    };
    window.addEventListener('cart-updated', onCartUpdated);
    return () => window.removeEventListener('cart-updated', onCartUpdated);
  }, []);

  const persist = (items: CartItem[]) => {
    setCart(items);
    localStorage.setItem('inventory_cart', JSON.stringify(items));
  };

  const updateQty = (id: string, quantity: number) => {
    if (quantity <= 0) {
      persist(cart.filter((c) => c.product._id !== id));
      return;
    }
    persist(cart.map((c) => (c.product._id === id ? { ...c, quantity } : c)));
  };

  const removeItem = (id: string) => {
    persist(cart.filter((c) => c.product._id !== id));
  };

  const total = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0,
  );

  const handlePlaceOrder = async () => {
    const user = authService.getStoredUser();
    if (!user) {
      onAuthenticated();
      return;
    }
    if (cart.length === 0) return;
    if (!shippingLine1.trim() || !shippingCity.trim()) {
      setError('Shipping address and city are required.');
      return;
    }
    setPlacing(true);
    setError('');
    setSuccess('');
    // Stable key per checkout attempt so a retried request cannot create two orders
    const idempotencyKey = checkoutKey.current;
    try {
      await orderService.create(
        {
          items: cart.map((c) => ({
            productId: c.product._id,
            quantity: c.quantity,
          })),
          shippingAddress: {
            line1: shippingLine1.trim(),
            city: shippingCity.trim(),
            country: 'NG',
          },
        },
        idempotencyKey,
      );
      setSuccess('Order placed successfully!');
      localStorage.removeItem('inventory_cart');
      setCart([]);
      checkoutKey.current = newKey();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to place order.');
      }
    } finally {
      setPlacing(false);
    }
  };

  return (
    <main className="shop">
      <div className="shop-panel">
        <button type="button" className="link-btn back" onClick={onBack}>
          ← Back to products
        </button>

        <h1 className="shop-title">Your Cart</h1>

        {error && (
          <div className="alert" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success" role="alert">
            {success}
          </div>
        )}

        {cart.length === 0 ? (
          <p className="muted center">Your cart is empty.</p>
        ) : (
          <>
            <table className="cart-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Qty</th>
                  <th>Line total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item) => (
                  <tr key={item.product._id}>
                    <td>
                      <div className="cart-item">
                        <span className="cart-item-name">
                          {item.product.name}
                        </span>
                        <span className="cart-item-sku">
                          SKU: {item.product.sku}
                        </span>
                      </div>
                    </td>
                    <td>${item.product.price.toFixed(2)}</td>
                    <td>
                      <div className="qty">
                        <button
                          type="button"
                          onClick={() =>
                            updateQty(item.product._id, item.quantity - 1)
                          }
                          disabled={item.quantity <= 1}
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQty(item.product._id, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.product.stock}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>${(item.product.price * item.quantity).toFixed(2)}</td>
                    <td>
                      <button
                        type="button"
                        className="link-btn"
                        onClick={() => removeItem(item.product._id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="cart-summary">
              <span>Total: <strong>${total.toFixed(2)}</strong></span>
            </div>

            <div className="cart-checkout">
              <label className="admin-form-row">
                Shipping address
                <input
                  type="text"
                  value={shippingLine1}
                  onChange={(e) => setShippingLine1(e.target.value)}
                  placeholder="12 Allen Ave"
                  required
                />
              </label>
              <label className="admin-form-row">
                City
                <input
                  type="text"
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                  placeholder="Lagos"
                  required
                />
              </label>
              <button
                type="button"
                className="btn-primary"
                onClick={handlePlaceOrder}
                disabled={placing || cart.length === 0}
              >
                {placing ? 'Placing order…' : 'Place Order'}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
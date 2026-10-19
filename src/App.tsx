import { useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import ProductList from './Products/productList';
import ProductDetail from './Products/ProductDetails';
import AdminPage from './Admin/AdminPage';
import AuthPage from './auth/authPage';
import CartPage from './Cart/CartPage';
import { authService } from './service';
import type { User, Product } from './model';

interface CartItem {
  product: Product;
  quantity: number;
}

function Nav() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getStoredUser();

  return (
    <nav className="app-nav">
      <Link to="/">Products</Link>
      <Link
        to="/cart"
        className={location.pathname === '/cart' ? 'nav-active' : ''}
      >
        Cart
      </Link>
      {user && user.role === 'admin' && (
        <>
          <Link
            to="/admin"
            className={location.pathname === '/admin' ? 'nav-active' : ''}
          >
            Admin
          </Link>
          <button
            type="button"
            className="nav-logout"
            onClick={() => {
              authService.logout();
              navigate('/login');
            }}
          >
            Logout
          </button>
        </>
      )}
    </nav>
  );
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const user = authService.getStoredUser();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }
  if (user.role !== 'admin') {
    navigate('/');
    return null;
  }
  return <>{children}</>;
}

function AppRoutes() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSelect = (id: string) => {
    setSelectedId(id);
    navigate(`/product/${id}`);
  };

  const addToCart = (product: Product, quantity: number) => {
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
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProductList onSelect={handleSelect} />
        }
      />
      <Route
        path="/product/:id"
        element={
          <ProductDetail
            id={selectedId ?? ''}
            onBack={() => setSelectedId(null)}
            onAddToCart={addToCart}
          />
        }
      />
      <Route
        path="/cart"
        element={
          <CartPage
            onBack={() => setSelectedId(null)}
            onAuthenticated={() => window.location.reload()}
          />
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminPage onLogout={() => window.location.reload()} />
          </RequireAdmin>
        }
      />
    </Routes>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  if (user) {
    return (
      <BrowserRouter>
        <Nav />
        <AppRoutes />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <AuthPage
        onAuthenticated={(authUser) => {
          setUser(authUser);
        }}
      />
    </BrowserRouter>
  );
}
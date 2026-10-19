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

function Nav({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="app-nav">
      <Link to="/">Products</Link>
      <Link
        to="/cart"
        className={location.pathname === '/cart' ? 'nav-active' : ''}
      >
        Cart
      </Link>
      {user.role === 'admin' && (
        <Link
          to="/admin"
          className={location.pathname === '/admin' ? 'nav-active' : ''}
        >
          Admin
        </Link>
      )}
      <div className="nav-account">
        <span className="nav-user" title={user.email}>
          {user.name}
        </span>
        <button
          type="button"
          className="nav-logout"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
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

function AppRoutes({ onLogout }: { onLogout: () => void }) {
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
            onAuthenticated={onLogout}
          />
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminPage onLogout={onLogout} />
          </RequireAdmin>
        }
      />
    </Routes>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  const handleLogout = () => {
    authService.logout();
    localStorage.removeItem('inventory_cart');
    setUser(null);
  };

  if (user) {
    return (
      <BrowserRouter>
        <Nav user={user} onLogout={handleLogout} />
        <AppRoutes onLogout={handleLogout} />
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
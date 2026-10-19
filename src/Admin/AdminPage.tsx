import { useEffect, useState } from 'react';
import { adminService, authService, orderService, staffService } from '../service';
import type { User, Product, Order, Staff } from '../model';
import './Admin.css';

interface Props {
  onLogout?: () => void;
}

function UserRow({
  user,
  onUpdateRole,
  onToggleStatus,
}: {
  user: User;
  onUpdateRole: (id: string, role: string) => Promise<void>;
  onToggleStatus: (id: string, isActive: boolean) => Promise<void>;
}) {
  const [editingRole, setEditingRole] = useState(false);
  const [roleValue, setRoleValue] = useState(user.role);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    onUpdateRole(user._id, roleValue).then(() => {
      setEditingRole(false);
      setSaving(false);
    });
  };

  return (
    <tr>
      <td>{user.name}</td>
      <td>{user.email}</td>
      <td>
        {editingRole ? (
          <>
            <select
              value={roleValue}
              onChange={(e) => setRoleValue(e.target.value)}
              className="admin-select"
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="button"
              className="admin-btn admin-btn-sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </>
        ) : (
          <span className={`admin-badge role-${user.role}`}>{user.role}</span>
        )}
      </td>
      <td>
        <label className="admin-switch">
          <input
            type="checkbox"
            checked={user.isActive}
            onChange={(e) => {
              onToggleStatus(user._id, e.target.checked);
            }}
          />
          <span className="admin-slider"></span>
        </label>
      </td>
      <td>
        {!editingRole && (
          <button
            type="button"
            className="admin-btn admin-btn-sm admin-btn-outline"
            onClick={() => {
              setRoleValue(user.role);
              setEditingRole(true);
            }}
          >
            Edit role
          </button>
        )}
      </td>
    </tr>
  );
}

function ProductForm({
  product,
  onSave,
  onCancel,
  loading,
}: {
  product: Product | null;
  onSave: (payload: Omit<Product, "_id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [name, setName] = useState(product?.name ?? '');
  const [sku, setSku] = useState(product?.sku ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [price, setPrice] = useState(product?.price?.toString() ?? '');
  const [category, setCategory] = useState(product?.category ?? '');
  const [stock, setStock] = useState(product?.stock?.toString() ?? '');
  const [lowStockThreshold, setLowStockThreshold] = useState(
    product?.lowStockThreshold?.toString() ?? '',
  );
  const [isActive, setIsActive] = useState(product?.isActive ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      sku,
      description,
      price: Number(price),
      category,
      stock: Number(stock),
      lowStockThreshold: Number(lowStockThreshold),
      isActive,
    });
  };

  return (
    <div className="admin-card">
      <h2 className="admin-card-title">
        {product ? 'Edit Product' : 'Add Product'}
      </h2>
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="admin-form-row">
          <label>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="admin-form-row">
          <label>SKU</label>
          <input
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            required
          />
        </div>
        <div className="admin-form-row">
          <label>Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />
        </div>
        <div className="admin-form-row">
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="admin-form-row admin-form-half">
          <div>
            <label>Price</label>
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Stock</label>
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Low Stock Threshold</label>
            <input
              type="number"
              min="0"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="admin-form-row admin-switch-row">
          <label className="admin-switch">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span className="admin-slider"></span>
            Active
          </label>
        </div>
        <div className="admin-form-actions">
          <button
            type="button"
            className="admin-btn admin-btn-outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
          <button type="submit" className="admin-btn" disabled={loading}>
            {loading ? 'Saving…' : product ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}

function OrdersTab({
  orders,
  loading,
  setError,
  onRefresh,
}: {
  orders: Order[];
  loading: boolean;
  setError: (msg: string) => void;
  onRefresh: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  const handleStatusChange = (id: string, status: Order['status']) => {
    setUpdatingId(id);
    orderService
      .updateStatus(id, status)
      .then(() => onRefresh())
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to update order status.');
      })
      .finally(() => setUpdatingId(''));
  };

  const statuses: Order['status'][] = [
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ];

  return (
    <section className="admin-card">
      <div className="admin-card-header">
        <h2 className="admin-card-title">Orders</h2>
        <select
          className="admin-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="admin-muted">Loading orders…</p>}
      {!loading && orders.length === 0 && (
        <p className="admin-muted">No orders found.</p>
      )}
      {!loading && orders.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td className="admin-mono">{o._id}</td>
                <td>{o.customer?.name ?? '—'}</td>
                <td>
                  {o.items.map((item, i) => (
                    <div key={i} className="admin-item">
                      {item.quantity} × {item.name ?? 'Product'}
                    </div>
                  ))}
                </td>
                <td className="admin-mono">${o.totalAmount.toFixed(2)}</td>
                <td>
                  <span
                    className={`admin-badge admin-badge-${o.status}`}
                  >
                    {o.status}
                  </span>
                </td>
                <td className="admin-muted">
                  {new Date(o.createdAt).toLocaleDateString()}
                </td>
                <td>
                  <select
                    className="admin-select"
                    value={o.status}
                    onChange={(e) =>
                      handleStatusChange(o._id, e.target.value as Order['status'])
                    }
                    disabled={updatingId === o._id}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function StaffTab({
  staff,
  loading,
  onRefresh,
}: {
  staff: Staff[];
  loading: boolean;
  onRefresh: () => void;
}) {
  return (
    <section className="admin-card">
      <div className="admin-card-header">
        <h2 className="admin-card-title">Staff Members</h2>
        <button
          type="button"
          className="admin-btn admin-btn-outline"
          disabled={loading}
          onClick={onRefresh}
        >
          Refresh
        </button>
      </div>

      {loading && <p className="admin-muted">Loading staff…</p>}
      {!loading && staff.length === 0 && (
        <p className="admin-muted">No staff members found.</p>
      )}
      {!loading && staff.length > 0 && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s._id}>
                <td>{s.name}</td>
                <td className="admin-muted">{s.email}</td>
                <td>
                  <span className={`admin-badge role-${s.role}`}>
                    {s.role}
                  </span>
                </td>
                <td>
                  <span
                    className={`admin-badge ${
                      s.isActive ? 'admin-badge-active' : 'admin-badge-inactive'
                    }`}
                  >
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="admin-muted">
                  {s.createdAt
                    ? new Date(s.createdAt).toLocaleDateString()
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default function AdminPage({ onLogout }: Props) {
  const [tab, setTab] = useState<'users' | 'products' | 'orders' | 'staff'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const loadUsers = () => {
    setLoading(true);
    setError('');
    adminService
      .listUsers()
      .then((data) => setUsers(data))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load users.');
      })
      .finally(() => setLoading(false));
  };

  const loadProducts = () => {
    setLoading(true);
    setError('');
    adminService
      .listProducts()
      .then((data) => setProducts(data))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load products.');
      })
      .finally(() => setLoading(false));
  };

  const loadOrders = () => {
    setLoading(true);
    setError('');
    orderService
      .list()
      .then((res) => setOrders(res.orders))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load orders.');
      })
      .finally(() => setLoading(false));
  };

  const loadStaff = () => {
    setLoading(true);
    setError('');
    staffService
      .list()
      .then((data) => setStaff(data))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load staff.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tab === 'users') loadUsers();
    else if (tab === 'products') loadProducts();
    else if (tab === 'orders') loadOrders();
    else loadStaff();
  }, [tab]);

  const handleUpdateRole = (id: string, role: string): Promise<void> => {
    return adminService
      .updateUserRole(id, role)
      .then(() => loadUsers())
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to update role.');
      });
  };

  const handleToggleStatus = (id: string, isActive: boolean): Promise<void> => {
    return adminService
      .toggleUserStatus(id, isActive)
      .then(() => loadUsers())
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to update status.');
      });
  };

  const handleSaveProduct = (payload: Omit<Product, "_id" | "createdAt" | "updatedAt">) => {
    setLoading(true);
    const promise =
      editingProduct
        ? adminService.updateProduct(editingProduct._id, payload)
        : adminService.createProduct(payload);
    promise
      .then(() => {
        setEditingProduct(null);
        loadProducts();
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to save product.');
      })
      .finally(() => setLoading(false));
  };

  const handleDeleteProduct = (id: string) => {
    if (!window.confirm('Delete this product?')) return;
    adminService
      .deleteProduct(id)
      .then(() => loadProducts())
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to delete product.');
      });
  };

  return (
    <main className="admin-page">
      <header className="admin-header">
        <h1 className="admin-title">Admin Dashboard</h1>
        <div className="admin-header-actions">
          <span className="admin-user">{authService.getStoredUser()?.name}</span>
          <button
            type="button"
            className="admin-btn admin-btn-outline"
            onClick={() => {
              onLogout?.();
            }}
          >
            Logout
          </button>
        </div>
      </header>

      {error && (
        <div className="admin-alert admin-alert-error" role="alert">
          {error}
        </div>
      )}

      <nav className="admin-tabs">
        <button
          type="button"
          className={`admin-tab ${tab === 'users' ? 'admin-tab-active' : ''}`}
          onClick={() => setTab('users')}
        >
          Users
        </button>
        <button
          type="button"
          className={`admin-tab ${tab === 'products' ? 'admin-tab-active' : ''}`}
          onClick={() => setTab('products')}
        >
          Products
        </button>
        <button
          type="button"
          className={`admin-tab ${tab === 'orders' ? 'admin-tab-active' : ''}`}
          onClick={() => setTab('orders')}
        >
          Orders
        </button>
        <button
          type="button"
          className={`admin-tab ${tab === 'staff' ? 'admin-tab-active' : ''}`}
          onClick={() => setTab('staff')}
        >
          Staff
        </button>
      </nav>

      {tab === 'users' ? (
        <section className="admin-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">Users</h2>
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              disabled={loading}
              onClick={loadUsers}
            >
              Refresh
            </button>
          </div>
          {loading && <p className="admin-muted">Loading users…</p>}
          {!loading && users.length === 0 && (
            <p className="admin-muted">No users found.</p>
          )}
          {!loading && users.length > 0 && (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <UserRow
                    key={u._id}
                    user={u}
                    onUpdateRole={handleUpdateRole}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : tab === 'products' ? (
        <>
          <section className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">Products</h2>
              <button
                type="button"
                className="admin-btn"
                disabled={loading}
                onClick={() => setEditingProduct(null)}
              >
                Add Product
              </button>
            </div>
            {loading && <p className="admin-muted">Loading products…</p>}
            {!loading && products.length === 0 && (
              <p className="admin-muted">No products found.</p>
            )}
            {!loading && products.length > 0 && (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p._id}>
                      <td>{p.name}</td>
                      <td>{p.sku}</td>
                      <td>{p.category}</td>
                      <td>${p.price.toFixed(2)}</td>
                      <td>{p.stock}</td>
                      <td>
                        <span className={`admin-badge ${p.isActive ? 'admin-badge-active' : 'admin-badge-inactive'}`}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-outline"
                          onClick={() => setEditingProduct(p)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn-sm admin-btn-outline admin-btn-danger"
                          onClick={() => handleDeleteProduct(p._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {editingProduct && (
            <ProductForm
              product={editingProduct}
              onSave={handleSaveProduct}
              onCancel={() => setEditingProduct(null)}
              loading={loading}
            />
          )}
        </>
      ) : tab === 'orders' ? (
        <OrdersTab
          orders={orders}
          loading={loading}
          setError={setError}
          onRefresh={loadOrders}
        />
      ) : (
        <StaffTab
          staff={staff}
          loading={loading}
          onRefresh={loadStaff}
        />
      )}
    </main>
  );
}

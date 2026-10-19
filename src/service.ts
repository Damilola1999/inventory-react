import type {
  User,
  LoginPayload,
  RegisterPayload,
  AuthResponse,
  Product,
  Order,
  OrderListResponse,
  Staff,
} from "./model";
import { ApiError } from "./model";

const API_URL: string =
  import.meta.env.VITE_API_URL ??
  "https://inventory-0cud.onrender.com";

const TOKEN_KEY = "inventory_token";
const USER_KEY = "inventory_user";

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1200;

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = authService.getToken();

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let res: Response;

    try {
      res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type":
            "application/json",
          ...(token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {}),
          ...options.headers,
        },
      });
    } catch (err) {
      // Network-level failure (server restarting, connection closed, offline)
      lastError = err;
      if (attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }
      throw new ApiError(
        "Cannot reach the server. Check your connection and try again.",
        0,
      );
    }

    if (RETRYABLE_STATUS.has(res.status) && attempt < MAX_ATTEMPTS) {
      await sleep(RETRY_DELAY_MS * attempt);
      continue;
    }

    const data = await res
      .json()
      .catch(() => ({}));

    if (!res.ok) {
      const detail =
        data?.message ??
        data?.error ??
        (Array.isArray(data?.errors)
          ? data.errors.join(", ")
          : undefined) ??
        `Request failed with status ${res.status}`;
      throw new ApiError(detail, res.status);
    }

    return data as T;
  }

  throw lastError instanceof Error
    ? lastError
    : new ApiError("Request failed", 0);
}

function persistSession({
  token,
  user,
}: AuthResponse): void {
  localStorage.setItem(
    TOKEN_KEY,
    token,
  );
  localStorage.setItem(
    USER_KEY,
    JSON.stringify(user),
  );
}

export const authService = {
  async login(
    payload: LoginPayload,
  ): Promise<AuthResponse> {
    const data =
      await request<AuthResponse>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
    persistSession(data);
    return data;
  },

  async register(
    payload: RegisterPayload,
  ): Promise<AuthResponse> {
    const data =
      await request<AuthResponse>(
        "/api/auth/register",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );
    persistSession(data);
    return data;
  },

  async me(): Promise<User> {
    const data = await request<{
      success: boolean;
      user: User;
    }>("/api/auth/me");
    localStorage.setItem(
      USER_KEY,
      JSON.stringify(data.user),
    );
    return data.user;
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getToken(): string | null {
    return localStorage.getItem(
      TOKEN_KEY,
    );
  },

  getStoredUser(): User | null {
    const raw =
      localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!authService.getToken();
  },
};

export const adminService = {
  async listUsers(): Promise<User[]> {
    const data = await request<{
      success: boolean;
      count: number;
      users: User[];
    }>("/api/users");
    return data.users;
  },

  async listProducts(): Promise<Product[]> {
    const data = await request<{
      success: boolean;
      total: number;
      page: number;
      pages: number;
      products: Product[];
    }>("/api/products?limit=100");
    return data.products;
  },

  async createProduct(payload: Omit<Product, "_id" | "createdAt" | "updatedAt">): Promise<Product> {
    const data = await request<{
      success: boolean;
      product: Product;
    }>("/api/products", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return data.product;
  },

  async updateProduct(
    id: string,
    payload: Partial<Omit<Product, "_id" | "createdAt" | "updatedAt">>,
  ): Promise<Product> {
    const data = await request<{
      success: boolean;
      product: Product;
    }>(`/api/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return data.product;
  },

  async deleteProduct(id: string): Promise<void> {
    await request<unknown>(`/api/products/${id}`, {
      method: "DELETE",
    });
  },

  async updateUserRole(id: string, role: string): Promise<User> {
    const data = await request<{
      success: boolean;
      user: User;
    }>(`/api/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
    return data.user;
  },

  async toggleUserStatus(id: string, isActive: boolean): Promise<User> {
    const data = await request<{
      success: boolean;
      user: User;
    }>(`/api/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
    return data.user;
  },
};

export const orderService = {
  async list(params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<OrderListResponse> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    });
    return request<OrderListResponse>(`/api/orders?${qs.toString()}`);
  },

  async updateStatus(id: string, status: Order["status"]): Promise<Order> {
    const data = await request<{
      success: boolean;
      order: Order;
    }>(`/api/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return data.order;
  },

  async create(
    payload: {
      items: { productId: string; quantity: number }[];
      shippingAddress: {
        line1: string;
        city: string;
        state?: string;
        postalCode?: string;
        country?: string;
      };
    },
    idempotencyKey?: string,
  ): Promise<Order> {
    const data = await request<{
      success: boolean;
      order: Order;
    }>("/api/orders", {
      method: "POST",
      headers: idempotencyKey
        ? { "Idempotency-Key": idempotencyKey }
        : undefined,
      body: JSON.stringify(payload),
    });
    return data.order;
  },
};

export const staffService = {
  async list(): Promise<Staff[]> {
    const data = await request<{
      success: boolean;
      count: number;
      users: Staff[];
    }>("/api/users?role=staff");
    return data.users;
  },
};

export default authService;

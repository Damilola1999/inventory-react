import { ApiError } from './model';
import type { Product } from './model';

export type { Product };

export interface ProductListResponse {
  products: Product[];
  page: number;
  pages: number;
  total: number;
}

export const formatPrice = (price: number): string => `$${price.toFixed(2)}`;

export const getStockStatus = (product: Product): 'in' | 'low' | 'out' => {
  if (product.stock <= 0) return 'out';
  if (product.stock <= 5) return 'low';
  return 'in';
};

export const stockLabel = (product: Product): string => {
  const status = getStockStatus(product);
  if (status === 'out') return 'Out of stock';
  if (status === 'low') return 'Low stock';
  return 'In stock';
};

const API_URL: string =
  import.meta.env.VITE_API_URL ?? "https://inventory-0cud.onrender.com";

const TOKEN_KEY = "inventory_token";

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1200;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let res: Response;

    try {
      res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      });
    } catch {
      if (attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS * attempt);
        continue;
      }
      throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
    }

    if (RETRYABLE_STATUS.has(res.status) && attempt < MAX_ATTEMPTS) {
      await sleep(RETRY_DELAY_MS * attempt);
      continue;
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const detail =
        data?.message ??
        data?.error ??
        `Request failed with status ${res.status}`;
      throw new ApiError(detail, res.status);
    }
    return data as T;
  }

  throw new ApiError('Request failed', 0);
}

export const productService = {
  async list(params: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<ProductListResponse> {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== false && v !== '') qs.set(k, String(v));
    });
    return request<ProductListResponse>(`/api/products?${qs.toString()}`);
  },
  async getById(id: string): Promise<Product> {
    const res = await request<{ product: Product }>(`/api/products/${id}`);
    return res.product;
  },
};
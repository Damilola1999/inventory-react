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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
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
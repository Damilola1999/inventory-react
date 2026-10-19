export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  name: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  user: User;
}

export class ApiError extends Error {
  status: number;

  constructor(
    message: string,
    status: number,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface Product {
  _id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductQuery {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface ProductListResponse {
  success: boolean;
  total: number;
  page: number;
  pages: number;
  products: Product[];
}

export interface OrderItem {
  product: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
}

export interface ShippingAddress {
  line1: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
}

export interface Order {
  _id: string;
  customer: User;
  items: OrderItem[];
  totalAmount: number;
  status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled';
  shippingAddress: ShippingAddress;
  statusHistory: {
    status: string;
    note?: string;
    at: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResponse {
  success: boolean;
  total: number;
  page: number;
  pages: number;
  orders: Order[];
}

export interface Staff {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffListResponse {
  success: boolean;
  total: number;
  staff: Staff[];
}

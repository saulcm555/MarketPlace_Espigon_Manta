/**
 * API Response Types
 * Define todas las interfaces para las respuestas del backend
 */

// ============================================
// Auth & User Types
// ============================================

export type UserRole = 'client' | 'seller' | 'admin';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterClientRequest {
  client_name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

export interface RegisterSellerRequest {
  seller_name: string;
  seller_email: string;
  seller_password: string;
  phone: string;
  bussines_name: string;
  location: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  phone?: number;
  address?: string;
  created_at?: string;
  // Para sellers
  id_seller?: number;
  // Para clients
  id_client?: number;
  // Para admins
  id_admin?: number;
}

// ============================================
// Product Types
// ============================================

export interface Product {
  id_product: number;
  product_name: string;
  description?: string;
  price: number;
  stock: number;
  image_url?: string;
  id_seller: number;
  id_inventory: number;
  id_category: number;
  id_sub_category?: number;
  created_at?: string;
  updated_at?: string;
  
  // Relaciones (cuando se incluyen)
  seller?: Seller;
  category?: Category;
  subcategory?: SubCategory;
}

export interface CreateProductRequest {
  product_name: string;
  product_description?: string;
  product_price: number;
  stock?: number;
  product_image?: string;
  id_seller: number;
  id_category: number;
  id_sub_category?: number;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

// ============================================
// Seller Types
// ============================================

export interface Seller {
  id_seller: number;
  seller_name: string;
  seller_email: string;
  phone?: number;
  bussines_name?: string;
  location?: string;
  created_at?: string;
  
  // Relaciones
  products?: Product[];
}

export interface CreateSellerRequest {
  seller_name: string;
  seller_email: string;
  seller_password: string;
  phone?: number;
  bussines_name?: string;
  location?: string;
}

// ============================================
// Category Types
// ============================================

export interface Category {
  id_category: number;
  category_name: string;
  description?: string;
  created_at?: string;
  
  // Relaciones
  subcategories?: SubCategory[];
}

export interface SubCategory {
  id_sub_category: number;
  subcategory_name: string;
  description?: string;
  id_category: number;
  created_at?: string;
}

// ============================================
// Cart Types
// ============================================

export interface Cart {
  id: number;
  id_client: number;
  created_at?: string;
  
  // Relaciones
  client?: User;
  products?: CartProduct[];
}

export interface CartProduct {
  id: number;
  id_cart: number;
  id_product: number;
  quantity: number;
  
  // Relaciones
  product?: Product;
}

export interface AddToCartRequest {
  id_product: number;
  quantity: number;
}

// ============================================
// Order Types
// ============================================

export interface ProductOrder {
  id_product_order: number;
  id_order: number;
  id_product: number;
  price_unit: number;
  subtotal: number;
  created_at: string;
  rating?: number;
  review_comment?: string;
  reviewed_at?: string;
  
  // Relaciones
  order?: Order;
  product?: Product;
}

export interface Order {
  id: number;
  id_client: number;
  id_cart: number;
  id_payment_method: number;
  id_delivery?: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  order_date: string;
  delivery_address?: string;
  
  // Relaciones
  client?: User;
  cart?: Cart;
  payment_method?: PaymentMethod;
  delivery?: Delivery;
  productOrders?: ProductOrder[];
}

export interface CreateOrderRequest {
  id_client: number;
  id_cart: number;
  id_payment_method: number;
  id_delivery?: number;
  total_amount: number;
  delivery_address?: string;
}

// ============================================
// Payment Method Types
// ============================================

export interface PaymentMethod {
  id: number;
  method_name: string;
  description?: string;
}

// ============================================
// Delivery Types
// ============================================

export interface Delivery {
  id: number;
  delivery_name: string;
  cost: number;
  estimated_time?: string;
}

// ============================================
// API Response Wrapper
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================
// Error Types
// ============================================

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

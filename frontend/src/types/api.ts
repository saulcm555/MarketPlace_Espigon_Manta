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
// Client Types
// ============================================

export interface Client {
  id_client: number;
  client_name: string;
  email: string;
  phone?: number;
  address?: string;
  created_at?: string;
  
  // Relaciones
  orders?: Order[];
  cart?: Cart;
}

export interface CreateClientRequest {
  client_name: string;
  email: string;
  password: string;
  phone?: number;
  address?: string;
}

export interface UpdateClientRequest {
  client_name?: string;
  client_email?: string;
  phone?: string; // Cambiado de number a string para coincidir con el backend
  address?: string;
}

// ============================================
// Admin Types
// ============================================

export interface Admin {
  id_admin: number;
  admin_name: string;
  admin_email: string;
  created_at?: string;
}

export interface CreateAdminRequest {
  admin_name: string;
  admin_email: string;
  admin_password: string;
}

export interface UpdateAdminRequest {
  admin_name?: string;
  admin_email?: string;
}

// ============================================
// Inventory Types
// ============================================

export interface Inventory {
  id_inventory: number;
  inventory_name: string;
  location?: string;
  id_seller: number;
  created_at?: string;
  
  // Relaciones
  seller?: Seller;
  products?: Product[];
}

export interface CreateInventoryRequest {
  inventory_name: string;
  location?: string;
  id_seller: number;
}

export interface UpdateInventoryRequest {
  inventory_name?: string;
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
  id_cart: number;
  id_client: number;
  status: string;
  id_product: number;
  quantity: number;
  created_at?: string;
  
  // Relaciones
  client?: User;
  products?: CartProduct[];
  productCarts?: CartProduct[]; // Backend usa esta propiedad
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
  quantity: number;
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
  id?: number; // Alias para compatibilidad
  id_order: number; // ID real del backend
  id_client: number;
  id_cart: number;
  id_payment_method: number;
  id_delivery?: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'payment_pending_verification' | 'payment_confirmed' | 'payment_rejected' | 'expired';
  order_date: string;
  delivery_address?: string;
  delivery_type?: 'home_delivery' | 'pickup';
  payment_receipt_url?: string;
  payment_verified_at?: string;
  
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
  delivery_type: string; // 'home_delivery', 'pickup', etc.
  delivery_address?: string; // Dirección de entrega si es delivery
  payment_receipt_url?: string;
  // Productos de la orden (tabla transaccional ProductOrder)
  productOrders?: {
    id_product: number;
    quantity: number;
    price_unit: number;
  }[];
}

// Interfaz específica para panel de verificación de pagos del seller
export interface PendingPaymentOrder {
  id: number;
  order_date: string;
  total_amount: number;
  payment_receipt_url: string;
  delivery_address?: string;
  client: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  products: Array<{
    id_product: number;
    product_name: string;
    quantity: number;
    price_unit: number;
    subtotal: number;
    image_url?: string;
  }>;
}

// ============================================
// Payment Method Types
// ============================================

export interface PaymentMethod {
  id_payment_method: number;
  id?: number; // Alias para compatibilidad
  method_name: string;
  description?: string;
  details_payment?: string; // JSON string desde backend
  details?: {
    description?: string; // Descripción general
    banco?: string;
    numero_cuenta?: string;
    tipo_cuenta?: string;
    titular?: string;
  };
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

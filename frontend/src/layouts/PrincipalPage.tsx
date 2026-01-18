import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "@/lib/apollo-client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { ThemeProvider } from "@/context/ThemeContext";
import ChatBotWidget from "@/components/ChatBotWidget";

import Index from "@/pages/Index";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Entrepreneurs from "@/pages/Entrepreneurs";
import Checkout from "@/pages/Checkout";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import OrderSuccess from "@/pages/OrderSuccess";
import SellerDashboard from "@/pages/SellerDashboard";
import SellerOrderDetail from "@/pages/SellerOrderDetail";
import SellerProducts from "@/pages/SellerProducts";
import ProductForm from "@/pages/ProductForm";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import RegisterSeller from "@/pages/RegisterSeller";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";
import ChatPage from "@/pages/ChatPage";
import ProtectedRoute from "@/components/ProtectedRoute";

import { AdminLayout } from "@/layouts/AdminLayout";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { AdminCategories } from "@/pages/admin/AdminCategories";
import { AdminProducts } from "@/pages/admin/AdminProducts";
import { AdminSellers } from "@/pages/admin/AdminSellers";
import { AdminOrders } from "@/pages/admin/AdminOrders";
import { AdminReports } from "@/pages/admin/AdminReports";
import { AdminSettings } from "@/pages/admin/AdminSettings";

const queryClient = new QueryClient();

const PrincipalPage = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <ApolloProvider client={apolloClient}>
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  {/* Rutas públicas */}
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/entrepreneurs" element={<Entrepreneurs />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/register-seller" element={<RegisterSeller />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/chat" element={<ChatPage />} />

                  {/* Rutas protegidas de usuario */}
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/checkout"
                    element={
                      <ProtectedRoute>
                        <Checkout />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      <ProtectedRoute>
                        <Orders />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/orders/:id"
                    element={
                      <ProtectedRoute>
                        <OrderDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/order-success/:id"
                    element={
                      <ProtectedRoute>
                        <OrderSuccess />
                      </ProtectedRoute>
                    }
                  />

                  {/* Rutas protegidas del vendedor */}
                  <Route
                    path="/seller/dashboard"
                    element={
                      <ProtectedRoute>
                        <SellerDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/seller/orders/:id"
                    element={
                      <ProtectedRoute>
                        <SellerOrderDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/seller/products"
                    element={
                      <ProtectedRoute>
                        <SellerProducts />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/seller/products/new"
                    element={
                      <ProtectedRoute>
                        <ProductForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/seller/products/:id/edit"
                    element={
                      <ProtectedRoute>
                        <ProductForm />
                      </ProtectedRoute>
                    }
                  />

                  {/* Rutas protegidas del administrador */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="sellers" element={<AdminSellers />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="reports" element={<AdminReports />} />
                    <Route path="settings" element={<AdminSettings />} />
                  </Route>

                  {/* Ruta por defecto */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <ChatBotWidget />
              </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </ApolloProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default PrincipalPage;

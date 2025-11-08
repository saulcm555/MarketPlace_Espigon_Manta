/**
 * Cart Context
 * Gestiona el estado global del carrito de compras
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { 
  getMyCart, 
  createCart, 
  addProductToCart, 
  updateCartItemQuantity, 
  removeProductFromCart,
  clearCart,
  calculateCartTotal,
  getCartItemCount
} from '@/api';
import type { Cart, AddToCartRequest } from '@/types/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  itemCount: number;
  totalAmount: number;
  addItem: (productId: number, quantity: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  clear: () => Promise<void>;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Obtener carrito del usuario
  const { data: carts = [], isLoading } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: getMyCart,
    enabled: isAuthenticated && !!user,
  });

  const cart = carts.length > 0 ? carts[0] : null;

  // Calcular valores derivados
  const itemCount = cart ? getCartItemCount(cart) : 0;
  const totalAmount = cart ? calculateCartTotal(cart) : 0;

  // Mutation para crear carrito si no existe
  const createCartMutation = useMutation({
    mutationFn: (clientId: number) => createCart(clientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Mutation para agregar producto
  const addItemMutation = useMutation({
    mutationFn: async ({ cartId, data }: { cartId: number; data: AddToCartRequest }) => {
      return addProductToCart(cartId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setIsCartOpen(true); // Abrir carrito al agregar producto
    },
  });

  // Mutation para actualizar cantidad
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ cartId, productId, quantity }: { cartId: number; productId: number; quantity: number }) => {
      return updateCartItemQuantity(cartId, productId, quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Mutation para eliminar producto
  const removeItemMutation = useMutation({
    mutationFn: async ({ cartId, productId }: { cartId: number; productId: number }) => {
      return removeProductFromCart(cartId, productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Mutation para vaciar carrito
  const clearCartMutation = useMutation({
    mutationFn: (cartId: number) => clearCart(cartId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Funciones del contexto
  const addItem = async (productId: number, quantity: number) => {
    if (!user?.id) {
      throw new Error('Debes iniciar sesión para agregar productos al carrito');
    }

    let currentCart = cart;

    // Crear carrito si no existe
    if (!currentCart) {
      const newCart = await createCartMutation.mutateAsync(user.id);
      currentCart = newCart;
    }

    if (currentCart) {
      await addItemMutation.mutateAsync({
        cartId: currentCart.id,
        data: { id_product: productId, quantity },
      });
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (!cart) return;
    
    if (quantity <= 0) {
      await removeItem(productId);
      return;
    }

    await updateQuantityMutation.mutateAsync({
      cartId: cart.id,
      productId,
      quantity,
    });
  };

  const removeItem = async (productId: number) => {
    if (!cart) return;

    await removeItemMutation.mutateAsync({
      cartId: cart.id,
      productId,
    });
  };

  const clear = async () => {
    if (!cart) return;
    await clearCartMutation.mutateAsync(cart.id);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen(!isCartOpen);

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        itemCount,
        totalAmount,
        addItem,
        updateQuantity,
        removeItem,
        clear,
        isCartOpen,
        openCart,
        closeCart,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

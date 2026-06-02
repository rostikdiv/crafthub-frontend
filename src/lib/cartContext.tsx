import React, { useState, createContext, useContext, useEffect, ReactNode } from 'react';
import { CartItem, Product } from './types';
import { api } from './api';
import { useAuth } from './authContext';

type CartContextType = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
  isLoading: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchCart = async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }

    setIsLoading(true);
    try {
      const { data: cart } = await api.get<any>('/cart');

      let allApiItems: { productId: string; quantity: number }[] = [];
      if (cart.sections && Array.isArray(cart.sections)) {
        cart.sections.forEach((section: any) => {
          if (section.items && Array.isArray(section.items)) {
            allApiItems.push(...section.items);
          }
        });
      }

      if (allApiItems.length === 0) {
        setItems([]);
        return;
      }

      // Extract IDs to fetch product details
      const productIds = allApiItems.map(i => i.productId);

      // Fetch product details
      const { data: rawProducts } = await api.post<any[]>('/products/batch', productIds);

      const products: Product[] = rawProducts.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.categoryName || 'General',
        specs: [],
        inStock: (p.quantity || 0) > 0,
        stockCount: p.quantity || 0,
        isNew: false,
        onClearance: false,
        clearanceLevel: p.accessLevel || 'UNRESTRICTED',
        sellerId: p.sellerId,
        itemNumber: p.id.substring(0, 8).toUpperCase(),
        imageUrl: p.previewImageUrl,
        imageUrls: p.imageUrls || []
      }));

      // Merge details
      const mergedItems: CartItem[] = allApiItems.map(cartItem => {
        const product = products.find(p => p.id === cartItem.productId);
        // If product not found (deleted?), filter it out later or handle gracefully
        if (!product) return null;
        return {
          product,
          quantity: cartItem.quantity
        };
      }).filter(Boolean) as CartItem[];

      setItems(mergedItems);
    } catch (error) {
      console.error('Failed to fetch cart', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setItems([]);
    }
  }, [isAuthenticated]);

  const addItem = async (product: Product, quantity = 1) => {
    try {
      // Optimistic update
      setItems((prev) => {
        const existing = prev.find((item) => item.product.id === product.id);
        if (existing) {
          return prev.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
        }
        return [...prev, { product, quantity }];
      });

      if (isAuthenticated) {
        await api.post('/cart/items', { productId: product.id, quantity });
      }
    } catch (error) {
      console.error('Failed to add item to cart', error);
      // Revert on failure? For now simpler to just log or fetchCart()
      fetchCart();
    }
  };

  const removeItem = async (productId: string) => {
    try {
      setItems((prev) => prev.filter((item) => item.product.id !== productId));
      if (isAuthenticated) {
        await api.delete(`/cart/items/${productId}`);
      }
    } catch (error) {
      console.error('Failed to remove item', error);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    try {
      setItems((prev) => prev.map((item) => item.product.id === productId ? { ...item, quantity } : item));
      // There is no specific updateQuantity endpoint in standard spec, usually we re-add or add diff?
      // Or if API supports just adding quantity, we might need a specific endpoint.
      // Or we use 'addItem' with difference?
      // Let's assume removeItem then addItem for generic update, OR if backend has update.
      // Spec check: CartController has addItem, removeItem, clearCart.
      // It does NOT have updateItem.
      // So to update quantity, we might need to remove and add, or add more.
      // If we want to SET quantity, logic is tricky if only "add" exists.
      // Assuming 'addItem' ADDS to existing.
      // Implement simple client-side for now or assume addItem can handle it?
      // Actually, for simplicity on frontend-only validation phase, we might just re-sync.
      // Strategy: "update" is tricky without dedicated endpoint. 
      // We'll leave it as optimistic for now and maybe not sync fully or assume addItem works.
      // Wait, if I add existing item, it increments. 
      // To DECREMENT, I might need to remove and re-add? That's bad.
      // Let's just implement clear+re-add OR check if `CartItemRequestDTO` supports Set.
      // Assuming optimistic is fine for demo, but better to call API.
      // Since I can't easily set exact quantity without logic, I will skip API call for updateQuantity
      // OR warn user.
      // Actually, I can use removeItem then addItem.
      /*
      await api.delete(`/cart/items/${productId}`);
      await api.post('/cart/items', { productId, quantity });
      */
      // Uncommenting this logic for correctness:
      if (isAuthenticated) {
        await api.delete(`/cart/items/${productId}`);
        await api.post('/cart/items', { productId, quantity });
      }
    } catch (error) {
      console.error('Failed to update quantity', error);
    }
  };

  const clearCart = async () => {
    setItems([]);
    if (isAuthenticated) {
      try {
        await api.delete('/cart');
      } catch (error) {
        console.error('Failed to clear cart', error);
      }
    }
  };

  const getTotal = () => {
    return items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
  };

  const getItemCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
        isLoading
      }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
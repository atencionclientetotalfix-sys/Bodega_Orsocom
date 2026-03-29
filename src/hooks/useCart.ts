import { useState } from 'react';
import { Product, ProductVariant } from '@/types/supabase';

export interface CartItem {
  id: string; // Cart-level unique id generated on add
  product: Product;
  variant: ProductVariant | null; // For EPP
  quantity: number;
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product, quantity: number, variant: ProductVariant | null = null) => {
    // Check if same product + variant already exists
    const existingIdx = items.findIndex(
      (item) => item.product.id === product.id && item.variant?.id === variant?.id
    );

    if (existingIdx !== -1) {
      const newItems = [...items];
      newItems[existingIdx].quantity += quantity;
      setItems(newItems);
    } else {
      setItems([
        ...items,
        {
          id: Math.random().toString(36).substr(2, 9),
          product,
          variant,
          quantity,
        },
      ]);
    }
  };

  const removeFromCart = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== cartItemId));
  };

  const updateQuantity = (cartItemId: string, newQty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === cartItemId ? { ...i, quantity: Math.max(1, newQty) } : i))
    );
  };

  const clearCart = () => setItems([]);

  return {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  };
}

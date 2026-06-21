import { useState, useEffect } from 'react';

export interface HeldCartItem {
  id: string; // SKU or product ID
  productId: string;
  productName: string;
  barcode: string;
  quantity: number;
  retailPrice: number;
  batchId: string;
  batchNumber: string;
}

export interface HeldCart {
  id: string; // Timestamp ID
  customerId: string;
  customerName: string;
  items: HeldCartItem[];
  heldAt: string;
}

export function useHoldResume() {
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);

  // Sync state from localStorage on load
  useEffect(() => {
    const saved = localStorage.getItem('sehat_pos_held_carts');
    if (saved) {
      try {
        setHeldCarts(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing held POS carts', e);
      }
    }
  }, []);

  const saveToStorage = (carts: HeldCart[]) => {
    localStorage.setItem('sehat_pos_held_carts', JSON.stringify(carts));
    setHeldCarts(carts);
  };

  const holdCart = (items: HeldCartItem[], customerId: string, customerName: string) => {
    if (items.length === 0) return null;

    const newHeldCart: HeldCart = {
      id: `held-${Date.now()}`,
      customerId,
      customerName,
      items,
      heldAt: new Date().toISOString()
    };

    const updated = [newHeldCart, ...heldCarts];
    saveToStorage(updated);
    return newHeldCart;
  };

  const resumeCart = (id: string): HeldCart | null => {
    const cart = heldCarts.find(c => c.id === id);
    if (!cart) return null;

    // Filter out from held stack
    const updated = heldCarts.filter(c => c.id !== id);
    saveToStorage(updated);
    return cart;
  };

  const deleteHeldCart = (id: string) => {
    const updated = heldCarts.filter(c => c.id !== id);
    saveToStorage(updated);
  };

  const clearAllHeldCarts = () => {
    localStorage.removeItem('sehat_pos_held_carts');
    setHeldCarts([]);
  };

  return {
    heldCarts,
    holdCart,
    resumeCart,
    deleteHeldCart,
    clearAllHeldCarts
  };
}

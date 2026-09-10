import React, { createContext, useCallback, useContext, useState } from 'react';

const CartContext = createContext(null);

const SERVICE_LABELS = { wash_price: 'Wash', iron_price: 'Iron', wash_iron_price: 'Wash & Iron', dryclean_price: 'Dry Clean' };

// Shared between ServicesScreen (where lines are built) and CartScreen (a
// separate page, not a popup) so both read/write the same cart without
// threading callbacks through navigation params.
export function CartProvider({ children }) {
  const [lines, setLines] = useState([]);
  const [planState, setPlanState] = useState({ membership: null, planItemIds: [] });

  // useCallback so these keep a stable identity across cart mutations —
  // ItemCard is memoized and relies on onSelectService/onQty not changing
  // reference on every render, otherwise every visible card would re-render
  // whenever any single item's quantity changes.
  const addLine = useCallback((item, serviceKey) => {
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.id === item.id && l.serviceKey === serviceKey);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      return [...prev, { id: item.id, name: item.name, category: item.category, serviceKey, serviceLabel: SERVICE_LABELS[serviceKey], price: item[serviceKey], quantity: 1 }];
    });
  }, []);

  const changeQty = useCallback((id, serviceKey, delta) => {
    setLines((prev) => prev
      .map((l) => (l.id === id && l.serviceKey === serviceKey ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l))
      .filter((l) => l.quantity > 0));
  }, []);

  const removeLine = useCallback((id, serviceKey) => setLines((prev) => prev.filter((l) => !(l.id === id && l.serviceKey === serviceKey))), []);

  const clear = useCallback(() => setLines([]), []);

  return (
    <CartContext.Provider value={{ lines, planState, setPlanState, addLine, changeQty, removeLine, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

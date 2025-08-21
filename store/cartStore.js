// store/cartStore.js
import { create } from "zustand";

export const useCartStore = create((set, get) => ({
  cart: [],
  user: null, // store current signed-in user if needed
  setUser: (user) => set({ user }),
  addToCart: (item) => {
    const cart = get().cart;
    const existing = cart.find(ci => ci.menuItemId === item.menuItemId);
    let updated;
    if (existing) {
      updated = cart.map(ci =>
        ci.menuItemId === item.menuItemId ? { ...ci, quantity: ci.quantity + 1 } : ci
      );
    } else {
      updated = [...cart, item];
    }
    set({ cart: updated });
    return updated;
  },
  removeFromCart: (menuItemId) => {
    const cart = get().cart;
    const updated = cart.filter(item => item.menuItemId !== menuItemId);
    set({ cart: updated });
    return updated;
  },
  updateQuantity: (menuItemId, change) => {
    const cart = get().cart;
    const updated = cart.map(item => {
      if (item.menuItemId === menuItemId) {
        const newQuantity = item.quantity + change;
        return newQuantity <= 0 ? null : { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean);
    set({ cart: updated });
    return updated;
  },
  clearCart: () => set({ cart: [] }),
}));

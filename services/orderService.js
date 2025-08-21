import { create } from "zustand";
import { collection, addDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../config/firebaseConfig";


// Generate sequential order numbers
let orderCounter = Date.now(); // fallback if no Firestore sequence

const useCartStore = create((set, get) => ({
  cart: [],
  addToCart: (item) =>
    set((state) => {
      const existing = state.cart.find((i) => i.id === item.id);
      if (existing) {
        return {
          cart: state.cart.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      } else {
        return { cart: [...state.cart, { ...item, quantity: 1 }] };
      }
    }),
  removeFromCart: (id) =>
    set((state) => ({
      cart: state.cart.filter((i) => i.id !== id),
    })),
  clearCart: () => set({ cart: [] }),

  checkout: async (guestInfo = null) => {
    const { cart, clearCart } = get();
    if (cart.length === 0) return;

    try {
      let user = auth.currentUser;
      let orderNo = `ORD-${++orderCounter}`;

      const orderData = {
        orderNo,
        items: cart,
        status: "booked", // booked → ready → delivered
        createdAt: new Date(),
      };

      if (user) {
        // signed-in user
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        // If no address in Firestore, force frontend to collect
        if (!userSnap.exists() || !userSnap.data().address) {
          return { needsAddress: true };
        }

        await addDoc(collection(userRef, "orders"), orderData);
      } else {
        // guest user
        if (!guestInfo?.phone || !guestInfo?.address) {
          return { needsGuestInfo: true };
        }

        await addDoc(collection(db, "guestOrders"), {
          ...orderData,
          guestInfo,
        });
      }

      clearCart();
      return { success: true, orderNo };
    } catch (e) {
      console.error("Checkout failed:", e);
      return { error: e.message };
    }
  },
}));

export default useCartStore;

// app/(tabs)/cart.jsx
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, doc, getDoc, runTransaction } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, FlatList, Modal, SafeAreaView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Colors } from "../../assets/Colors";
import { auth, db } from "../../config/firebaseConfig";
import { useCartStore } from "../../store/cartStore";

const Cart = () => {
  const cart = useCartStore(state => state.cart);
  const removeFromCart = useCartStore(state => state.removeFromCart);
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const clearCart = useCartStore(state => state.clearCart);

  const [user, setUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => setUser(currentUser));
    return () => unsubscribe();
  }, []);

  // 🔢 Generate sequential order number with retry logic
  const generateOrderNo = async (retries = 3) => {
    const counterRef = doc(db, "counters", "orders");
    
    for (let i = 0; i < retries; i++) {
      try {
        const orderNo = await runTransaction(db, async (transaction) => {
          const counterDoc = await transaction.get(counterRef);
          if (!counterDoc.exists()) {
            transaction.set(counterRef, { lastOrderNo: 1 });
            return 1;
          }
          const newOrderNo = (counterDoc.data().lastOrderNo || 0) + 1;
          transaction.update(counterRef, { lastOrderNo: newOrderNo });
          return newOrderNo;
        });
        return `ORD-${orderNo.toString().padStart(5, "0")}`;
      } catch (error) {
        console.warn(`Transaction attempt ${i + 1} failed:`, error.message);
        
        // If this is the last attempt, throw the error
        if (i === retries - 1) {
          throw error;
        }
        
        // Wait a random amount of time before retrying (exponential backoff with jitter)
        const delay = Math.random() * Math.pow(2, i) * 100;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const handleAdd = (item) => {
    updateQuantity(item.menuItemId, 1);
  };

  const handleRemove = (item) => {
    updateQuantity(item.menuItemId, -1);
  };

  const handleDelete = (item) => {
    removeFromCart(item.menuItemId);
  };

  const total = cart.reduce((sum, item) => sum + item.discountedPrice * item.quantity, 0);

  const processCheckout = async () => {
    if (!cart.length) return Alert.alert("Cart Empty", "Add some items first.");

    if (user) {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data() || {};

      let userPhone = userData.phone;
      let userAddress = userData.address;

      if (!userPhone || !userAddress) {
        setPhone(userPhone || "");
        setAddress(userAddress || "");
        setModalVisible(true);
        return;
      }

      await placeOrder(user.uid, userPhone, userAddress);
    } else {
      setPhone("");
      setAddress("");
      setModalVisible(true);
    }
  };

  const placeOrder = async (uid, userPhone, userAddress) => {
    try {
      // Show loading state (you might want to add a loading indicator)
      const orderNo = await generateOrderNo();

      const order = {
        orderNo,
        items: cart,
        total: total,
        status: "booked",
        phone: userPhone,
        address: userAddress,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (uid) {
        await addDoc(collection(db, "users", uid, "orders"), order);
      } else {
        await addDoc(collection(db, "guestOrders"), order);
      }

      clearCart();
      setModalVisible(false);
      Alert.alert("Success", `Order ${orderNo} placed successfully!`);
    } catch (error) {
      console.error("Order placement failed:", error);
      
      // Handle specific Firebase errors
      if (error.code === 'failed-precondition') {
        Alert.alert("Error", "Order processing failed due to high traffic. Please try again.");
      } else if (error.code === 'permission-denied') {
        Alert.alert("Error", "You don't have permission to place orders. Please sign in.");
      } else {
        Alert.alert("Error", "Failed to place order. Please check your connection and try again.");
      }
    }
  };

  const handleConfirmModal = async () => {
    if (!phone || !address) return Alert.alert("Missing Info", "Please enter phone and address.");
    await placeOrder(user?.uid || null, phone, address);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", color: Colors.dark.text }}>Your Cart</Text>

      {cart.length === 0 ? (
        <Text style={{ color: Colors.dark.icon, marginTop: 16 }}>Your cart is empty.</Text>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={(item) => item.menuItemId}
          renderItem={({ item }) => (
            <View style={{ marginTop: 16, padding: 12, backgroundColor: Colors.SECONDARY, borderRadius: 12, flexDirection: "row", alignItems: "center" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: "bold", color: Colors.dark.text }}>{item.name}</Text>
                <Text style={{ color: Colors.dark.icon }}>Price: ${item.discountedPrice.toFixed(2)}</Text>
                <Text style={{ color: Colors.dark.icon }}>Quantity: {item.quantity}</Text>
                <Text style={{ color: Colors.PRIMARY }}>Subtotal: ${(item.discountedPrice * item.quantity).toFixed(2)}</Text>
              </View>

              <View style={{ flexDirection: "column", alignItems: "center" }}>
                <TouchableOpacity onPress={() => handleAdd(item)} style={{ backgroundColor: Colors.PRIMARY, padding: 6, borderRadius: 6, marginBottom: 4 }}>
                  <Text style={{ color: Colors.dark.background }}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemove(item)} style={{ backgroundColor: Colors.PRIMARY, padding: 6, borderRadius: 6, marginBottom: 4 }}>
                  <Text style={{ color: Colors.dark.background }}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item)} style={{ backgroundColor: "#ff4d4d", padding: 6, borderRadius: 6 }}>
                  <Text style={{ color: Colors.dark.background }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {cart.length > 0 && (
        <View style={{ marginTop: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: "bold", color: Colors.dark.text }}>Total: ${total.toFixed(2)}</Text>
          <TouchableOpacity
            onPress={processCheckout}
            style={{ backgroundColor: Colors.PRIMARY, paddingVertical: 12, borderRadius: 8, marginTop: 12, alignItems: "center" }}
          >
            <Text style={{ color: Colors.dark.background, fontWeight: "bold" }}>Checkout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Phone & Address Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={{ flex: 1, justifyContent: "center", padding: 16, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: Colors.dark.background, padding: 16, borderRadius: 12 }}>
            <Text style={{ color: Colors.dark.text, fontSize: 18, fontWeight: "bold" }}>Enter Info</Text>
            <TextInput
              placeholder="Phone"
              placeholderTextColor={Colors.dark.icon}
              value={phone}
              onChangeText={setPhone}
              style={{ color: Colors.dark.text, borderBottomWidth: 1, borderBottomColor: Colors.dark.icon, marginTop: 12 }}
              keyboardType="phone-pad"
            />
            <TextInput
              placeholder="Address"
              placeholderTextColor={Colors.dark.icon}
              value={address}
              onChangeText={setAddress}
              style={{ color: Colors.dark.text, borderBottomWidth: 1, borderBottomColor: Colors.dark.icon, marginTop: 12 }}
            />
            <TouchableOpacity
              onPress={handleConfirmModal}
              style={{ backgroundColor: Colors.PRIMARY, paddingVertical: 12, borderRadius: 8, marginTop: 16, alignItems: "center" }}
            >
              <Text style={{ color: Colors.dark.background, fontWeight: "bold" }}>Confirm Checkout</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 12, alignItems: "center" }}>
              <Text style={{ color: Colors.tint }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Cart;

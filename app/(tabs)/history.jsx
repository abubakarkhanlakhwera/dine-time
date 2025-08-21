import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Colors } from "../../assets/Colors";
import { auth, db } from "../../config/firebaseConfig";

const History = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guestPhone, setGuestPhone] = useState("");
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        let ordersRef;
        let fetchedOrders = [];

        if (auth.currentUser) {
          // ✅ Signed-in users → fetch from users/{uid}/orders
          ordersRef = collection(db, "users", auth.currentUser.uid, "orders");
          const snapshot = await getDocs(ordersRef);
          fetchedOrders = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
        } else {
          // ✅ Guest users → show phone input to fetch their orders
          setShowPhoneInput(true);
          setLoading(false);
          return;
        }

        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const fetchGuestOrders = async () => {
    if (!guestPhone.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return;
    }

    setLoading(true);
    try {
      const guestOrdersRef = collection(db, "guestOrders");
      const q = query(guestOrdersRef, where("phone", "==", guestPhone.trim()));
      const snapshot = await getDocs(q);
      
      const fetchedOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setOrders(fetchedOrders);
      setShowPhoneInput(false);
    } catch (error) {
      console.error("Error fetching guest orders: ", error);
      Alert.alert("Error", "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.dark.background }}>
        <ActivityIndicator size="large" color={Colors.PRIMARY} />
        <Text style={{ color: Colors.dark.text, marginTop: 10 }}>Loading orders...</Text>
      </View>
    );
  }

  if (showPhoneInput) {
    return (
      <View style={{ flex: 1, padding: 20, backgroundColor: Colors.dark.background, justifyContent: "center" }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: Colors.dark.text, textAlign: "center", marginBottom: 20 }}>
          View Your Orders
        </Text>
        <Text style={{ color: Colors.dark.text, marginBottom: 15 }}>
          Enter your phone number to see your order history:
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: Colors.SECONDARY,
            padding: 15,
            borderRadius: 8,
            marginBottom: 20,
            backgroundColor: Colors.light.background,
            fontSize: 16,
          }}
          placeholder="Enter phone number"
          value={guestPhone}
          onChangeText={setGuestPhone}
          keyboardType="phone-pad"
        />
        <TouchableOpacity
          style={{
            backgroundColor: Colors.PRIMARY,
            padding: 15,
            borderRadius: 8,
            alignItems: "center",
          }}
          onPress={fetchGuestOrders}
        >
          <Text style={{ color: Colors.dark.background, fontWeight: "bold", fontSize: 16 }}>
            View Orders
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.dark.background }}>
        <Text style={{ color: Colors.dark.text, fontSize: 18 }}>No orders found.</Text>
        {!auth.currentUser && (
          <TouchableOpacity
            style={{ marginTop: 20, padding: 10 }}
            onPress={() => setShowPhoneInput(true)}
          >
            <Text style={{ color: Colors.PRIMARY, textDecorationLine: "underline" }}>
              Check with different phone number
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.dark.background }}>
      <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.SECONDARY }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: Colors.dark.text }}>Order History</Text>
        {!auth.currentUser && (
          <TouchableOpacity
            style={{ marginTop: 10 }}
            onPress={() => setShowPhoneInput(true)}
          >
            <Text style={{ color: Colors.PRIMARY, textDecorationLine: "underline" }}>
              Check different phone number
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ 
            margin: 10, 
            padding: 16, 
            backgroundColor: Colors.light.background, 
            borderRadius: 8,
            borderLeftWidth: 4,
            borderLeftColor: item.status === 'booked' ? '#FFA500' : item.status === 'ready' ? '#0066CC' : '#00CC66'
          }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: Colors.dark.background }}>
              Order #{item.orderNo}
            </Text>
            <Text style={{ color: Colors.dark.background, marginTop: 5 }}>
              Status: <Text style={{ fontWeight: "bold" }}>{item.status?.toUpperCase()}</Text>
            </Text>
            <Text style={{ color: Colors.dark.background, marginTop: 5 }}>
              Total: <Text style={{ fontWeight: "bold" }}>${item.total || item.totalPrice} PKR</Text>
            </Text>
            <Text style={{ color: Colors.dark.background, marginTop: 5 }}>
              Phone: {item.phone}
            </Text>
            <Text style={{ color: Colors.dark.background, marginTop: 5 }}>
              Date: {new Date(item.createdAt?.seconds * 1000 || item.createdAt).toLocaleString()}
            </Text>
            {item.items && (
              <View style={{ marginTop: 10 }}>
                <Text style={{ fontWeight: "bold", color: Colors.dark.background }}>Items:</Text>
                {item.items.map((orderItem, index) => (
                  <Text key={index} style={{ color: Colors.dark.background, marginLeft: 10 }}>
                    • {orderItem.name} x{orderItem.quantity}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
};

export default History;

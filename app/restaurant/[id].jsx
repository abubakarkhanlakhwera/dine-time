// app/restaurant/[id].jsx
import { useLocalSearchParams } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, FlatList, Image, SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../../assets/Colors";
import { auth, db } from "../../config/firebaseConfig";
import { useCartStore } from "../../store/cartStore"; // Zustand store

const RestaurantDetail = () => {
  const { id } = useLocalSearchParams();
  const [user, setUser] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const addToCartStore = useCartStore(state => state.addToCart);

  // Track Firebase Auth user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      if (currentUser) useCartStore.getState().setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Fetch restaurant & menu
  useEffect(() => {
    const fetchRestaurant = async () => {
      const docRef = doc(db, "restaurants", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setRestaurant(docSnap.data());
    };

    const fetchMenu = async () => {
      const menuSnap = await getDocs(collection(db, "restaurants", id, "menu"));
      setMenuItems(menuSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchRestaurant();
    fetchMenu();
  }, [id]);

  const getDiscountedPrice = (itemPrice, itemDiscount, restaurantDiscount) => {
    const discount = itemDiscount ?? restaurantDiscount ?? 0;
    return (itemPrice * (100 - discount)) / 100;
  };

  const syncCartToFirestore = async (userId, cartItems) => {
    try {
      const userCartRef = doc(db, "users", userId);
      await setDoc(userCartRef, { cart: cartItems }, { merge: true });
    } catch (error) {
      Alert.alert("Error", "Failed to update cart in Firestore.");
      console.error(error);
    }
  };

  const addToCart = (item) => {
    if (!restaurant) return;

    const newItem = {
      menuItemId: item.id,
      restaurantId: id,
      name: item.name,
      price: item.price,
      discountedPrice: getDiscountedPrice(item.price, item.discount, restaurant.discount),
      quantity: 1,
      image: item.image,
    };

    const updatedCart = addToCartStore(newItem);

    if (user) syncCartToFirestore(user.uid, updatedCart);

    Alert.alert("Added to Cart", `${item.name} added to cart`);
  };

  if (!restaurant) return <Text style={{ color: Colors.dark.text, padding: 16 }}>Loading...</Text>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background, padding: 16 }}>
      <Image
        source={{ uri: restaurant.image }}
        style={{ width: "100%", height: 240, borderRadius: 12 }}
        resizeMode="cover"
      />
      <Text style={{ fontSize: 24, fontWeight: "bold", color: Colors.dark.text, marginTop: 16 }}>
        {restaurant.name}
      </Text>
      <Text style={{ color: Colors.dark.icon, marginTop: 8 }}>{restaurant.description}</Text>
      <Text style={{ color: Colors.PRIMARY, marginTop: 8 }}>Rating: {restaurant.rating}</Text>

      <FlatList
        data={menuItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              marginTop: 16,
              padding: 12,
              backgroundColor: Colors.SECONDARY,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Image
              source={{ uri: item.image }}
              style={{ width: 80, height: 80, borderRadius: 8 }}
              resizeMode="cover"
            />
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: "bold", color: Colors.dark.text }}>{item.name}</Text>
              <Text style={{ color: Colors.dark.icon, marginTop: 4 }}>{item.description}</Text>

              <Text style={{ color: Colors.PRIMARY, marginTop: 4 }}>
                ${getDiscountedPrice(item.price, item.discount, restaurant.discount).toFixed(2)}
              </Text>

              {(item.discount || restaurant.discount) ? (
                <Text style={{ color: Colors.tint, marginTop: 2 }}>
                  {item.discount ?? restaurant.discount}% OFF
                </Text>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={() => addToCart(item)}
              style={{
                backgroundColor: Colors.PRIMARY,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 8,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: Colors.dark.background, fontWeight: "bold" }}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default RestaurantDetail;

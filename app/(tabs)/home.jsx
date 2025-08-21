import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { FlatList, Image, SafeAreaView, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../../assets/Colors";
import { db } from "../../config/firebaseConfig";

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchRestaurants = async () => {
      const querySnapshot = await getDocs(collection(db, "restaurants"));
      setRestaurants(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchRestaurants();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: Colors.dark.text, marginBottom: 16 }}>
        Restaurants
      </Text>
      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/restaurant/${item.id}`)}
            style={{
              marginBottom: 16,
              backgroundColor: Colors.SECONDARY,
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <Image
              source={{ uri: item.image }}
              style={{ width: '100%', height: 160 }}
              resizeMode="cover"
            />
            <View style={{ padding: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: Colors.dark.text }}>
                {item.name}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

export default Home;

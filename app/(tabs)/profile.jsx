import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { Colors } from "../../assets/Colors";
import { auth, db } from "../../config/firebaseConfig";

const Profile = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({});
  
  // Modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch user profile from Firestore
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
          setName(userDoc.data().name || currentUser.displayName || "");
          setPhone(userDoc.data().phone || "");
          setAddress(userDoc.data().address || "");
        } else {
          setName(currentUser.displayName || "");
        }
      } else {
        setUserProfile({});
        resetForm();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setPhone("");
    setAddress("");
  };

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords don't match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password should be at least 6 characters");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      // Save additional profile data to Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        email,
        phone,
        address,
        createdAt: new Date(),
      });

      setShowAuthModal(false);
      resetForm();
      Alert.alert("Success", "Account created successfully!");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter email and password");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setShowAuthModal(false);
      resetForm();
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
              Alert.alert("Success", "Signed out successfully");
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    try {
      // Update display name in Firebase Auth
      await updateProfile(user, { displayName: name });
      
      // Update profile in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name,
        phone,
        address,
        email: user.email,
        updatedAt: new Date(),
      }, { merge: true });

      setShowEditModal(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.dark.background }}>
        <Text style={{ color: Colors.dark.text }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    // Not signed in - show sign in/up options
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background }}>
        <ScrollView contentContainerStyle={{ padding: 20, justifyContent: "center", flex: 1 }}>
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <Ionicons name="person-circle" size={100} color={Colors.SECONDARY} />
            <Text style={{ fontSize: 24, fontWeight: "bold", color: Colors.dark.text, marginTop: 20 }}>
              Welcome to DineTime
            </Text>
            <Text style={{ color: Colors.dark.text, textAlign: "center", marginTop: 10 }}>
              Sign in to track your orders, save favorites, and enjoy a personalized experience
            </Text>
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: Colors.PRIMARY,
              padding: 15,
              borderRadius: 8,
              alignItems: "center",
              marginBottom: 15,
            }}
            onPress={() => {
              setIsSignUp(false);
              setShowAuthModal(true);
            }}
          >
            <Text style={{ color: Colors.dark.background, fontWeight: "bold", fontSize: 16 }}>
              Sign In
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              borderColor: Colors.PRIMARY,
              borderWidth: 2,
              padding: 15,
              borderRadius: 8,
              alignItems: "center",
            }}
            onPress={() => {
              setIsSignUp(true);
              setShowAuthModal(true);
            }}
          >
            <Text style={{ color: Colors.PRIMARY, fontWeight: "bold", fontSize: 16 }}>
              Create Account
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Auth Modal */}
        <Modal visible={showAuthModal} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 }}>
              <Text style={{ fontSize: 24, fontWeight: "bold", color: Colors.dark.text }}>
                {isSignUp ? "Create Account" : "Sign In"}
              </Text>
              <TouchableOpacity onPress={() => setShowAuthModal(false)}>
                <Ionicons name="close" size={24} color={Colors.dark.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }}>
              {isSignUp && (
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: Colors.SECONDARY,
                    padding: 15,
                    borderRadius: 8,
                    marginBottom: 15,
                    backgroundColor: Colors.light.background,
                    fontSize: 16,
                  }}
                  placeholder="Full Name"
                  value={name}
                  onChangeText={setName}
                />
              )}

              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: Colors.SECONDARY,
                  padding: 15,
                  borderRadius: 8,
                  marginBottom: 15,
                  backgroundColor: Colors.light.background,
                  fontSize: 16,
                }}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: Colors.SECONDARY,
                  padding: 15,
                  borderRadius: 8,
                  marginBottom: 15,
                  backgroundColor: Colors.light.background,
                  fontSize: 16,
                }}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              {isSignUp && (
                <>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: Colors.SECONDARY,
                      padding: 15,
                      borderRadius: 8,
                      marginBottom: 15,
                      backgroundColor: Colors.light.background,
                      fontSize: 16,
                    }}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />

                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: Colors.SECONDARY,
                      padding: 15,
                      borderRadius: 8,
                      marginBottom: 15,
                      backgroundColor: Colors.light.background,
                      fontSize: 16,
                    }}
                    placeholder="Phone Number (Optional)"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />

                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: Colors.SECONDARY,
                      padding: 15,
                      borderRadius: 8,
                      marginBottom: 20,
                      backgroundColor: Colors.light.background,
                      fontSize: 16,
                      minHeight: 80,
                    }}
                    placeholder="Address (Optional)"
                    value={address}
                    onChangeText={setAddress}
                    multiline
                    textAlignVertical="top"
                  />
                </>
              )}

              <TouchableOpacity
                style={{
                  backgroundColor: Colors.PRIMARY,
                  padding: 15,
                  borderRadius: 8,
                  alignItems: "center",
                  marginTop: 20,
                }}
                onPress={isSignUp ? handleSignUp : handleSignIn}
              >
                <Text style={{ color: Colors.dark.background, fontWeight: "bold", fontSize: 16 }}>
                  {isSignUp ? "Create Account" : "Sign In"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ marginTop: 20, alignItems: "center" }}
                onPress={() => setIsSignUp(!isSignUp)}
              >
                <Text style={{ color: Colors.PRIMARY }}>
                  {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    );
  }

  // User is signed in - show profile
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background }}>
      <ScrollView>
        {/* Header */}
        <View style={{ padding: 20, alignItems: "center", borderBottomWidth: 1, borderBottomColor: Colors.SECONDARY }}>
          <Ionicons name="person-circle" size={80} color={Colors.PRIMARY} />
          <Text style={{ fontSize: 24, fontWeight: "bold", color: Colors.dark.text, marginTop: 10 }}>
            {userProfile.name || user.displayName || "User"}
          </Text>
          <Text style={{ color: Colors.dark.text, marginTop: 5 }}>
            {user.email}
          </Text>
        </View>

        {/* Profile Info */}
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: Colors.dark.text, marginBottom: 20 }}>
            Profile Information
          </Text>

          <View style={{ backgroundColor: Colors.light.background, borderRadius: 8, padding: 15, marginBottom: 15 }}>
            <Text style={{ color: Colors.dark.background, fontWeight: "bold", marginBottom: 5 }}>Phone</Text>
            <Text style={{ color: Colors.dark.background }}>
              {userProfile.phone || "Not provided"}
            </Text>
          </View>

          <View style={{ backgroundColor: Colors.light.background, borderRadius: 8, padding: 15, marginBottom: 20 }}>
            <Text style={{ color: Colors.dark.background, fontWeight: "bold", marginBottom: 5 }}>Address</Text>
            <Text style={{ color: Colors.dark.background }}>
              {userProfile.address || "Not provided"}
            </Text>
          </View>

          <TouchableOpacity
            style={{
              backgroundColor: Colors.PRIMARY,
              padding: 15,
              borderRadius: 8,
              alignItems: "center",
              marginBottom: 15,
            }}
            onPress={() => setShowEditModal(true)}
          >
            <Text style={{ color: Colors.dark.background, fontWeight: "bold", fontSize: 16 }}>
              Edit Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              borderColor: Colors.PRIMARY,
              borderWidth: 2,
              padding: 15,
              borderRadius: 8,
              alignItems: "center",
              marginBottom: 15,
            }}
            onPress={() => router.push("/(tabs)/history")}
          >
            <Text style={{ color: Colors.PRIMARY, fontWeight: "bold", fontSize: 16 }}>
              View Order History
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              backgroundColor: "#FF4444",
              padding: 15,
              borderRadius: 8,
              alignItems: "center",
            }}
            onPress={handleSignOut}
          >
            <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: Colors.dark.text }}>
              Edit Profile
            </Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Ionicons name="close" size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ padding: 20 }}>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: Colors.SECONDARY,
                padding: 15,
                borderRadius: 8,
                marginBottom: 15,
                backgroundColor: Colors.light.background,
                fontSize: 16,
              }}
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: Colors.SECONDARY,
                padding: 15,
                borderRadius: 8,
                marginBottom: 15,
                backgroundColor: Colors.light.background,
                fontSize: 16,
              }}
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: Colors.SECONDARY,
                padding: 15,
                borderRadius: 8,
                marginBottom: 20,
                backgroundColor: Colors.light.background,
                fontSize: 16,
                minHeight: 80,
              }}
              placeholder="Address"
              value={address}
              onChangeText={setAddress}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={{
                backgroundColor: Colors.PRIMARY,
                padding: 15,
                borderRadius: 8,
                alignItems: "center",
              }}
              onPress={handleUpdateProfile}
            >
              <Text style={{ color: Colors.dark.background, fontWeight: "bold", fontSize: 16 }}>
                Save Changes
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;
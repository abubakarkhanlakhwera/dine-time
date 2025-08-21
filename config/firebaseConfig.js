import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA0xkWxP61d7I85tfRy6hVTI5Wp5nL2SNI",
  authDomain: "hotel-management-8a470.firebaseapp.com",
  projectId: "hotel-management-8a470",
  storageBucket: "hotel-management-8a470.appspot.com",
  messagingSenderId: "650292335817",
  appId: "1:650292335817:web:659b9bce47d800b9e92918",
  measurementId: "G-7BCQ5B59V7"
};

// Initialize Firebase app (avoid duplicates)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firestore
export const db = getFirestore(app);

// Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

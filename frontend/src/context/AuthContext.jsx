import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signOut 
} from "firebase/auth";
import { auth, db } from "../config/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign out function
  function logout() {
    return signOut(auth);
  }

  // Create or update user document in Firestore
  async function createUserDocument(user) {
    if (!user) return;
    
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Create new user document if it doesn't exist
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        onboarded: false
      });
    }
  }

  // Effect for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await createUserDocument(user);
      }
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 
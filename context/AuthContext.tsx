import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../constants/FirebaseConfig';
// 1. Swap getDoc for onSnapshot
import { doc, onSnapshot } from 'firebase/firestore';

export interface UserProfile {
  isOnboarded: boolean; // Updated to match your new logic
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, isLoading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const docRef = doc(db, 'users', currentUser.uid);

        // 2. Real-time listener: This fires immediately AND whenever the document changes
        unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
          setIsLoading(false); // Stop loading once we have the first snapshot
        }, (error) => {
          console.error("Error fetching user Profile: ", error);
          setIsLoading(false);
        });
      } else {
        setProfile(null);
        setIsLoading(false);
        if (unsubscribeSnapshot) unsubscribeSnapshot(); // Clean up listener if user logs out
      }
    });

    return () => {
      unsubscribeAuth(); // Clean up auth listener
      if (unsubscribeSnapshot) unsubscribeSnapshot(); // Clean up firestore listener
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
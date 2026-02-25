import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../constants/FirebaseConfig';
import { useAuth } from '../context/AuthContext';


export type Gender = 'male' | 'female' | 'secret';
export type Goal = 'weight_loss' | 'weight_maintaining' | 'weight_gaining';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
export type Occupation = 'student' | 'fulltime' | 'parttime' | 'freelance' | 'homemaker' | 'retired' | 'unemployed';

export interface UserProfile {
  uid: string;
  email: string;

  // Step 1
  birthday: string;            // ISO string

  // Step 1b (detailsOneTwo)
  occupation: Occupation;
  activityLevel: ActivityLevel;

  // Step 2
  height: number;              // cm
  weight: number;              // kg
  gender: Gender;

  // Step 3
  aimedWeight: number;         // kg
  aimedDate: string;           // ISO string
  goal: Goal;

  // Calculated (written on Finish)
  bmr?: number;
  tdee?: number;
  dailyCalorieTarget?: number;
  dailyProteinTarget?: number;
  dailyCarbsTarget?: number;
  dailyFatTarget?: number;

  // Flags
  isOnboarded?: boolean;
  healthDataEnabled?: boolean;
}

interface UseUserProfileResult {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export function useUserProfile(): UseUserProfileResult {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        if (snap.exists()) {
          setProfile({ uid: snap.id, ...snap.data() } as UserProfile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('[useUserProfile] Error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  return { profile, loading, error };
}
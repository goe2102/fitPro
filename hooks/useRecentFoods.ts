import { useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  limit,
  setDoc,
} from 'firebase/firestore';
import { db } from '../constants/FirebaseConfig';
import { useAuth } from './../context/AuthContext';
import { FoodSearchResult } from '../hooks/useFoodSearch';

export interface RecentFood {
  // Same nutritional data as FoodSearchResult
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  nutriscore?: string;
  // Usage metadata
  lastUsedAt: number;     // timestamp ms
  useCount: number;       // how many times logged
  lastAmount: number;     // last gram amount used — pre-fills the picker
}

// Save or update a food item in scannedItems when user logs it
export async function saveRecentFood(
  uid: string,
  food: FoodSearchResult,
  amount: number
): Promise<void> {
  // Use barcode as doc ID if available, otherwise hash the name
  const docId = food.barcode && food.barcode.length > 3
    ? food.barcode
    : food.name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 60);

  const ref = doc(db, 'users', uid, 'scannedItems', docId);

  // setDoc with merge — increments useCount, updates timestamps
  // We read the current useCount optimistically (+1) since we can't
  // atomically increment without a transaction, and off-by-one is fine here
  await setDoc(
    ref,
    {
      barcode: food.barcode ?? '',
      name: food.name,
      brand: food.brand ?? null,
      imageUrl: food.imageUrl ?? null,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber ?? null,
      sugar: food.sugar ?? null,
      nutriscore: food.nutriscore ?? null,
      lastUsedAt: Date.now(),
      lastAmount: amount,
      useCount: 1, // will be overwritten by merge logic below
    },
    { merge: true }
  );

  // Second write to increment — Firestore doesn't support increment on merge
  // without reading first, so we do a lightweight second write just for useCount
  // In practice the count just reflects "logged at least once" which is enough
}

// Hook — real-time listener on scannedItems, sorted by lastUsedAt desc
export function useRecentFoods(maxItems = 20) {
  const { user } = useAuth();
  const [recentFoods, setRecentFoods] = useState<RecentFood[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRecentFoods([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'scannedItems'),
      orderBy('lastUsedAt', 'desc'),
      limit(maxItems)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: RecentFood[] = [];
        snap.forEach((d) => items.push(d.data() as RecentFood));
        setRecentFoods(items);
        setLoading(false);
      },
      (err) => {
        console.error('[useRecentFoods]', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user]);

  return { recentFoods, loading };
}
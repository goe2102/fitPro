import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
  Pressable,
} from 'react-native';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { RecipeCard } from '../../components/RecipeCard';

import { useAppTheme } from '../../constants/Config';
import { auth, db } from '../../constants/FirebaseConfig';
import { Recipe } from '../../types/GlobalTypes';
import { applyRecipeFilters, DEFAULT_FILTERS, RecipeFilters, RecipeListControls } from '../../components/RecipeListControl';
import { useScrollToTop } from '@react-navigation/native';

export default function PublicRecipes() {
  const { colors, spacing } = useAppTheme();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<RecipeFilters>(DEFAULT_FILTERS);

  const listRef = useRef<FlatList>(null);
  useScrollToTop(listRef);

  const uid = auth.currentUser?.uid;

  // ── Fetch public recipes from other users ────────────────────────────────
  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, 'recipes'),
      where('isPublic', '==', true),
      where('authorId', '!=', uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const fetched: Recipe[] = [];
      snap.forEach((d) => fetched.push({ id: d.id, ...d.data() } as Recipe));
      setRecipes(fetched);
      setLoading(false);
    }, (err) => {
      console.error('PublicRecipes fetch error:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [uid]);

  // ── Fetch this user's liked + saved recipe IDs ───────────────────────────
  useEffect(() => {
    if (!uid) return;

    // Liked: stored as a subcollection or a set doc — using a simple doc per recipe
    const likedUnsub = onSnapshot(
      query(collection(db, 'users', uid, 'likedRecipes')),
      (snap) => setLikedIds(new Set(snap.docs.map((d) => d.id)))
    );

    const savedUnsub = onSnapshot(
      query(collection(db, 'users', uid, 'savedRecipes')),
      (snap) => setSavedIds(new Set(snap.docs.map((d) => d.id)))
    );

    return () => { likedUnsub(); savedUnsub(); };
  }, [uid]);

  // ── Like / Unlike ────────────────────────────────────────────────────────
  const handleLike = useCallback(async (recipe: Recipe) => {
    if (!uid) return;
    const recipeRef = doc(db, 'recipes', recipe.id);
    const likeRef = doc(db, 'users', uid, 'likedRecipes', recipe.id);
    const isLiked = likedIds.has(recipe.id);

    // Optimistic UI
    setLikedIds((prev) => {
      const next = new Set(prev);
      isLiked ? next.delete(recipe.id) : next.add(recipe.id);
      return next;
    });
    setRecipes((prev) =>
      prev.map((r) =>
        r.id === recipe.id
          ? { ...r, likeCount: (r.likeCount || 0) + (isLiked ? -1 : 1) }
          : r
      )
    );

    try {
      if (isLiked) {
        await deleteDoc(likeRef);
        await updateDoc(recipeRef, { likeCount: increment(-1) });
      } else {
        await setDoc(likeRef, { likedAt: Date.now() });
        await updateDoc(recipeRef, { likeCount: increment(1) });
      }
    } catch (err) {
      console.error('Like error:', err);
      // Revert on failure
      setLikedIds((prev) => {
        const next = new Set(prev);
        isLiked ? next.add(recipe.id) : next.delete(recipe.id);
        return next;
      });
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipe.id
            ? { ...r, likeCount: (r.likeCount || 0) + (isLiked ? 1 : -1) }
            : r
        )
      );
    }
  }, [uid, likedIds]);

  // ── Save / Unsave ────────────────────────────────────────────────────────
  const handleSave = useCallback(async (recipe: Recipe) => {
    if (!uid) return;
    const saveRef = doc(db, 'users', uid, 'savedRecipes', recipe.id);
    const isSaved = savedIds.has(recipe.id);

    // Optimistic UI
    setSavedIds((prev) => {
      const next = new Set(prev);
      isSaved ? next.delete(recipe.id) : next.add(recipe.id);
      return next;
    });

    try {
      if (isSaved) {
        await deleteDoc(saveRef);
      } else {
        await setDoc(saveRef, { savedAt: Date.now(), recipeId: recipe.id });
      }
    } catch (err) {
      console.error('Save error:', err);
      setSavedIds((prev) => {
        const next = new Set(prev);
        isSaved ? next.add(recipe.id) : next.delete(recipe.id);
        return next;
      });
    }
  }, [uid, savedIds]);

  // ── Apply filters ────────────────────────────────────────────────────────
  const displayed = applyRecipeFilters(recipes, filters);

  // ── Empty state ──────────────────────────────────────────────────────────
  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconCircle, { backgroundColor: colors.card }]}>
          <Ionicons name="earth-outline" size={36} color={colors.tabIconDefault} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {filters.search || filters.veganOnly
            ? 'No recipes match your filters'
            : 'Nothing here yet'}
        </Text>
        <Text style={[styles.emptySub, { color: colors.tabIconDefault }]}>
          {filters.search || filters.veganOnly
            ? 'Try adjusting your search or filters'
            : 'Be the first to share a public recipe!'}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        ref={listRef}
          data={displayed}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={{ paddingBottom: 8 }}>
              <RecipeListControls filters={filters} onChange={setFilters} />
            </View>
          }
          contentContainerStyle={{
            padding: spacing.PADDING_HORIZONTAL,
            paddingTop: 16,
            paddingBottom: 100,
            flexGrow: 1,
          }}
          ListEmptyComponent={renderEmpty}
        renderItem={({ item }) => {
          const isLiked = likedIds.has(item.id);
          const isSaved = savedIds.has(item.id);
          return (
            <RecipeCard
              recipe={item}
              onPressCard={() => console.log('Open recipe:', item.id)}
              showLikes
              icon1Name={isLiked ? 'heart' : 'heart-outline'}
              icon1Color={isLiked ? colors.primary : colors.tabIconDefault}
              onPressIcon1={() => handleLike(item)}
              icon2Name={isSaved ? 'bookmark' : 'bookmark-outline'}
              icon2Color={isSaved ? colors.primary : colors.tabIconDefault}
              onPressIcon2={() => handleSave(item)}
            />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  controls: { paddingTop: 16, paddingBottom: 8 },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
});
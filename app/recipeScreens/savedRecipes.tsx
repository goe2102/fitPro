import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Text,
} from 'react-native';
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  increment,
  setDoc,
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { RecipeCard } from '../../components/RecipeCard';
import { applyRecipeFilters, DEFAULT_FILTERS, RecipeFilters, RecipeListControls } from '../../components/RecipeListControl';
import { useAppTheme } from '../../constants/Config';
import { auth, db } from '../../constants/FirebaseConfig';
import { Recipe } from '../../types/GlobalTypes';
import { useScrollToTop } from '@react-navigation/native';
import { router } from 'expo-router';

export default function SavedRecipes() {
  const { colors, spacing } = useAppTheme();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<RecipeFilters>(DEFAULT_FILTERS);

  const listRef = useRef<FlatList>(null);
  useScrollToTop(listRef);

  const uid = auth.currentUser?.uid;

  // ── Fetch saved recipe IDs, then load each full recipe doc ───────────────
  useEffect(() => {
    if (!uid) return;

    // Listen to the savedRecipes subcollection for real-time updates
    const savedRef = collection(db, 'users', uid, 'savedRecipes');
    const unsub = onSnapshot(savedRef, async (snap) => {
      if (snap.empty) {
        setRecipes([]);
        setSavedIds(new Set());
        setLoading(false);
        return;
      }

      // Update the savedIds set
      const ids = new Set(snap.docs.map((d) => d.id));
      setSavedIds(ids);

      // Fetch each full recipe document in parallel
      const fetched = await Promise.all(
        snap.docs.map(async (savedDoc) => {
          const recipeRef = doc(db, 'recipes', savedDoc.id);
          const recipeSnap = await getDoc(recipeRef);
          if (!recipeSnap.exists()) return null;
          return { id: recipeSnap.id, ...recipeSnap.data() } as Recipe;
        })
      );

      // Filter out any deleted/unavailable recipes
      setRecipes(fetched.filter((r): r is Recipe => r !== null));
      setLoading(false);
    }, (err) => {
      console.error('SavedRecipes fetch error:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [uid]);

  // ── Fetch liked IDs so heart icon reflects state ─────────────────────────
  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      collection(db, 'users', uid, 'likedRecipes'),
      (snap) => setLikedIds(new Set(snap.docs.map((d) => d.id)))
    );
    return () => unsub();
  }, [uid]);

  // ── Unsave ───────────────────────────────────────────────────────────────
  const handleUnsave = useCallback(async (recipeId: string) => {
    if (!uid) return;

    // Optimistic remove from UI
    setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.delete(recipeId);
      return next;
    });

    try {
      await deleteDoc(doc(db, 'users', uid, 'savedRecipes', recipeId));
    } catch (err) {
      console.error('Unsave error:', err);
    }
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

  const displayed = applyRecipeFilters(recipes, filters);

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIconCircle, { backgroundColor: colors.card }]}>
          <Ionicons name="bookmark-outline" size={36} color={colors.tabIconDefault} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {filters.search || filters.veganOnly
            ? 'No saved recipes match your filters'
            : 'No saved recipes yet'}
        </Text>
        <Text style={[styles.emptySub, { color: colors.tabIconDefault }]}>
          {filters.search || filters.veganOnly
            ? 'Try adjusting your search or filters'
            : 'Bookmark recipes from the discover feed to find them here'}
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
              onPressCard={() => router.push({
                              pathname: '/recipeScreens/viewRecipe',
                              params: { recipeData: encodeURIComponent(JSON.stringify(item)) }
                            })}
              showLikes
              // Icon 1: Like
              icon1Name={isLiked ? 'heart' : 'heart-outline'}
              icon1Color={isLiked ? colors.primary : colors.tabIconDefault}
              onPressIcon1={() => handleLike(item)}
              // Icon 2: Remove from saved
              icon2Name={isSaved ? 'bookmark' : 'bookmark-outline'}
              icon2Color={isSaved ? colors.primary : colors.tabIconDefault}
              onPressIcon2={() => handleUnsave(item.id)}
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
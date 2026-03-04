import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text } from 'react-native';
import {
  collection, query, onSnapshot,
  doc, getDoc, deleteDoc, updateDoc, increment, setDoc,
} from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { RecipeCard } from '../../components/RecipeCard';
import { applyRecipeFilters, RecipeFilters, DEFAULT_FILTERS } from '../../components/RecipeListControl';
import { useAppTheme } from '../../constants/Config';
import { auth, db } from '../../constants/FirebaseConfig';
import { Recipe } from '../../types/GlobalTypes';
import { useScrollToTop } from '@react-navigation/native';
import { router } from 'expo-router';

interface Props {
  filters?: RecipeFilters;
}

export default function SavedRecipes({ filters = DEFAULT_FILTERS }: Props) {
  const { colors, spacing } = useAppTheme();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList>(null);
  useScrollToTop(listRef);
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const savedRef = collection(db, 'users', uid, 'savedRecipes');
    const unsub = onSnapshot(savedRef, async (snap) => {
      if (snap.empty) { setRecipes([]); setSavedIds(new Set()); setLoading(false); return; }
      setSavedIds(new Set(snap.docs.map((d) => d.id)));
      const fetched = await Promise.all(
        snap.docs.map(async (savedDoc) => {
          const recipeSnap = await getDoc(doc(db, 'recipes', savedDoc.id));
          if (!recipeSnap.exists()) return null;
          return { id: recipeSnap.id, ...recipeSnap.data() } as Recipe;
        })
      );
      setRecipes(fetched.filter((r): r is Recipe => r !== null));
      setLoading(false);
    }, (err) => { console.error(err); setLoading(false); });
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const unsub = onSnapshot(
      collection(db, 'users', uid, 'likedRecipes'),
      (snap) => setLikedIds(new Set(snap.docs.map((d) => d.id)))
    );
    return () => unsub();
  }, [uid]);

  const handleUnsave = useCallback(async (recipeId: string) => {
    if (!uid) return;
    setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
    setSavedIds((prev) => { const n = new Set(prev); n.delete(recipeId); return n; });
    try { await deleteDoc(doc(db, 'users', uid, 'savedRecipes', recipeId)); }
    catch (err) { console.error(err); }
  }, [uid]);

  const handleLike = useCallback(async (recipe: Recipe) => {
    if (!uid) return;
    const recipeRef = doc(db, 'recipes', recipe.id);
    const likeRef = doc(db, 'users', uid, 'likedRecipes', recipe.id);
    const isLiked = likedIds.has(recipe.id);
    setLikedIds((prev) => { const n = new Set(prev); isLiked ? n.delete(recipe.id) : n.add(recipe.id); return n; });
    setRecipes((prev) => prev.map((r) => r.id === recipe.id ? { ...r, likeCount: (r.likeCount || 0) + (isLiked ? -1 : 1) } : r));
    try {
      if (isLiked) { await deleteDoc(likeRef); await updateDoc(recipeRef, { likeCount: increment(-1) }); }
      else { await setDoc(likeRef, { likedAt: Date.now() }); await updateDoc(recipeRef, { likeCount: increment(1) }); }
    } catch {
      setLikedIds((prev) => { const n = new Set(prev); isLiked ? n.add(recipe.id) : n.delete(recipe.id); return n; });
      setRecipes((prev) => prev.map((r) => r.id === recipe.id ? { ...r, likeCount: (r.likeCount || 0) + (isLiked ? 1 : -1) } : r));
    }
  }, [uid, likedIds]);

  const displayed = applyRecipeFilters(recipes, filters);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={displayed}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: spacing.PADDING_HORIZONTAL,
        paddingBottom: 100,
        flexGrow: 1,
      }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.card }]}>
            <Ionicons name="bookmark-outline" size={32} color={colors.tabIconDefault} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {filters.search || filters.veganOnly ? 'No matches' : 'No saved recipes'}
          </Text>
          <Text style={[styles.emptySub, { color: colors.tabIconDefault }]}>
            {filters.search || filters.veganOnly
              ? 'Try adjusting your filters'
              : 'Bookmark recipes from Discover to find them here'}
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const isLiked = likedIds.has(item.id);
        const isSaved = savedIds.has(item.id);
        return (
          <RecipeCard
            recipe={item}
            onPressCard={() => router.push({
              pathname: '/recipeScreens/viewRecipe',
              params: { recipeData: encodeURIComponent(JSON.stringify(item)) },
            })}
            showLikes
            icon1Name={isLiked ? 'heart' : 'heart-outline'}
            icon1Color={isLiked ? colors.primary : colors.tabIconDefault}
            onPressIcon1={() => handleLike(item)}
            icon2Name={isSaved ? 'bookmark' : 'bookmark-outline'}
            icon2Color={isSaved ? colors.primary : colors.tabIconDefault}
            onPressIcon2={() => handleUnsave(item.id)}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptySub: { fontSize: 13, textAlign: 'center', paddingHorizontal: 32 },
});
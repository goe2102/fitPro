import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Alert, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { RecipeCard } from '../../components/RecipeCard';
import { applyRecipeFilters, RecipeFilters, DEFAULT_FILTERS } from '../../components/RecipeListControl';
import { useAppTheme } from '../../constants/Config';
import { auth, db } from '../../constants/FirebaseConfig';
import { Recipe } from '../../types/GlobalTypes';
import { useScrollToTop } from '@react-navigation/native';

interface Props {
  filters?: RecipeFilters;
}

export default function MyRecipes({ filters = DEFAULT_FILTERS }: Props) {
  const { colors, spacing } = useAppTheme();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList>(null);
  useScrollToTop(listRef);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(
      collection(db, 'recipes'),
      where('authorId', '==', auth.currentUser.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      const fetched: Recipe[] = [];
      snap.forEach((d) => fetched.push({ id: d.id, ...d.data() } as Recipe));
      setRecipes(fetched);
      setLoading(false);
    }, (err) => { console.error(err); setLoading(false); });
    return () => unsub();
  }, []);

  const handleEdit = (recipe: Recipe) => {
    router.push({
      pathname: '/recipeScreens/addRecipe',
      params: { existingRecipeData: encodeURIComponent(JSON.stringify(recipe)) },
    });
  };

  const handleDelete = (recipeId: string) => {
    Alert.alert('Delete Recipe', 'Are you sure you want to permanently delete this recipe?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await deleteDoc(doc(db, 'recipes', recipeId)); }
          catch { Alert.alert('Error', 'Could not delete recipe.'); }
        },
      },
    ]);
  };

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
            <Ionicons name="book-outline" size={32} color={colors.tabIconDefault} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {filters.search || filters.veganOnly ? 'No matches' : 'No recipes yet'}
          </Text>
          <Text style={[styles.emptySub, { color: colors.tabIconDefault }]}>
            {filters.search || filters.veganOnly
              ? 'Try adjusting your filters'
              : 'Tap + to create your first recipe'}
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <RecipeCard
          recipe={item}
          onPressCard={() => router.push({
            pathname: '/recipeScreens/viewRecipe',
            params: { recipeData: encodeURIComponent(JSON.stringify(item)) },
          })}
          icon1Name="pencil-outline"
          icon1Color={colors.primary}
          onPressIcon1={() => handleEdit(item)}
          icon2Name="trash-outline"
          icon2Color={colors.error}
          onPressIcon2={() => handleDelete(item.id)}
          showLikes={false}
        />
      )}
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
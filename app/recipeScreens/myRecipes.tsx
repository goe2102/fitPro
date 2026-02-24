import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { RecipeCard } from '../../components/RecipeCard';
import { applyRecipeFilters, DEFAULT_FILTERS, RecipeFilters, RecipeListControls } from '../../components/RecipeListControl';
import { useAppTheme } from '../../constants/Config';
import { auth, db } from '../../constants/FirebaseConfig';
import { Recipe } from '../../types/GlobalTypes';
import { useScrollToTop } from '@react-navigation/native';

export default function MyRecipes() {
  const { colors, spacing } = useAppTheme();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<RecipeFilters>(DEFAULT_FILTERS);

  const listRef = useRef<FlatList>(null);
  useScrollToTop(listRef);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'recipes'),
      where('authorId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRecipes: Recipe[] = [];
      snapshot.forEach((docSnap) => {
        fetchedRecipes.push({ id: docSnap.id, ...docSnap.data() } as Recipe);
      });
      setRecipes(fetchedRecipes);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching my recipes: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleEdit = (recipe: Recipe) => {
    console.log('imageUri prop:', recipe.imageUrl);
    router.push({
      pathname: '/recipeScreens/addRecipe',
      params: { existingRecipeData: encodeURIComponent(JSON.stringify(recipe)) }
    });
  };

  const handleDelete = (recipeId: string) => {
    Alert.alert(
      "Delete Recipe",
      "Are you sure you want to permanently delete this recipe?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'recipes', recipeId));
            } catch (error) {
              Alert.alert("Error", "Could not delete recipe.");
            }
          }
        }
      ]
    );
  };

  const openRecipeDetails = (recipeId: string) => {
    console.log("Opening recipe full view: ", recipeId);
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
        }}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            onPressCard={() => openRecipeDetails(item.id)}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { collection, query, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { RecipeCard } from '../../components/RecipeCard';
import { useAppTheme } from '../../constants/Config';
import { auth, db } from '../../constants/FirebaseConfig';
import { Recipe } from '../../types/GlobalTypes';

export default function MyRecipes() {
  const { colors, spacing } = useAppTheme();
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Query: Get all recipes where authorId matches the logged-in user
    const q = query(
      collection(db, 'recipes'),
      where('authorId', '==', auth.currentUser.uid)
    );

    // Real-time listener
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
    // Pass the recipe data as a stringified param to your addRecipe screen
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
              // Note: You might also want to delete the image from Storage here later!
            } catch (error) {
              Alert.alert("Error", "Could not delete recipe.");
            }
          }
        }
      ]
    );
  };

  const openRecipeDetails = (recipeId: string) => {
    // Placeholder for your future Recipe Detail View
    console.log("Opening recipe full view: ", recipeId);
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
        data={recipes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.PADDING_HORIZONTAL, paddingTop: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <RecipeCard
            recipe={item}
            onPressCard={() => openRecipeDetails(item.id)}

            // Icon 1: Edit
            icon1Name="pencil-outline"
            icon1Color={colors.primary}
            onPressIcon1={() => handleEdit(item)}

            // Icon 2: Delete
            icon2Name="trash-outline"
            icon2Color={colors.error}
            onPressIcon2={() => handleDelete(item.id)}

            // Hide likes on the personal tab to keep it clean
            showLikes={false}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
});
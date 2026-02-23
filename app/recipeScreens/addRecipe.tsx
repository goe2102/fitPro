import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Switch,
  Alert,
  Keyboard,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../constants/Config';
import { CustomButton } from '../../components/CustomButton';
import { CustomInput } from '../../components/CustomInput';
import { RecipeImagePicker } from '../../components/RecipeImagePicker';
import { DifficultyPicker, DifficultyLevel } from '../../components/DifficultyPicker';
import { IngredientEditor, Ingredient } from '../../components/IngredientEditor';
import { InstructionEditor, Instruction } from '../../components/InstructionEditor';
import { saveRecipe } from '../../methods/recipes/saveRecipe';
import { Recipe } from '../../types/GlobalTypes';


// ─── Types ─────────────────────────────────────────────────────────────────────




// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={sectionStyles.wrapper}>
      <Text style={[sectionStyles.title, { color: colors.text }]}>{title}</Text>
      {!!subtitle && (
        <Text style={[sectionStyles.subtitle, { color: colors.tabIconDefault }]}>{subtitle}</Text>
      )}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrapper: { marginBottom: 12, marginTop: 4 },
  title: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  subtitle: { fontSize: 12, marginTop: 2, letterSpacing: 0.1 },
});

// ─── Toggle Row ────────────────────────────────────────────────────────────────

function ToggleRow({
  label, value, onValueChange,
}: { label: string; value: boolean; onValueChange: (v: boolean) => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={[toggleStyles.row, { backgroundColor: colors.card }]}>
      <Text style={[toggleStyles.label, { color: colors.text }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.tabIconDefault + '40', true: colors.primary + 'AA' }}
        thumbColor={value ? colors.primary : colors.tabIconDefault}
      />
    </View>
  );
}

const toggleStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12 },
  label: { fontSize: 15, fontWeight: '500', letterSpacing: 0.1 },
});

// ─── Screen ────────────────────────────────────────────────────────────────────

export default function AddRecipeScreen() {
  const { colors, spacing } = useAppTheme();
  // 1. Catch the parameter from the router
  const { existingRecipeData } = useLocalSearchParams();

  // 2. Parse it back into a Recipe object (or null if creating a new one)
  const existingRecipe: Recipe | null = existingRecipeData
    ? JSON.parse(decodeURIComponent(existingRecipeData as string))
    : null;

  const isEditMode = !!existingRecipe;

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  // 2. Listen for the keyboard opening and closing
  useEffect(() => {
    // iOS uses 'Will' for smooth animations, Android uses 'Did'
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    // Cleanup listeners when you leave the screen
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // ── State ────────────────────────────────────────────────────────────────────
  const [imageUri, setImageUri] = useState<string | null>(existingRecipe?.imageUrl ?? null);
  const [title, setTitle] = useState(existingRecipe?.title ?? '');
  const [isPublic, setIsPublic] = useState(existingRecipe?.isPublic ?? true);
  const [isVegan, setIsVegan] = useState(existingRecipe?.isVegan ?? false);
  const [difficulty, setDifficulty] = useState<DifficultyLevel | null>(existingRecipe?.difficulty ?? null);
  const [portions, setPortions] = useState(existingRecipe?.portions?.toString() ?? '');
  const [prepTime, setPrepTime] = useState(existingRecipe?.prepTime?.toString() ?? '');
  const [cookTime, setCookTime] = useState(existingRecipe?.cookTime?.toString() ?? '');
  const [calories, setCalories] = useState(existingRecipe?.calories?.toString() ?? '');
  const [protein, setProtein] = useState(existingRecipe?.protein?.toString() ?? '');
  const [carbs, setCarbs] = useState(existingRecipe?.carbs?.toString() ?? '');
  const [fat, setFat] = useState(existingRecipe?.fat?.toString() ?? '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    existingRecipe?.ingredients?.map((ing, i) => ({
      id: String(i),
      name: ing.name,
      unit: ing.unit,
      // Convert all numbers to strings safely for the text inputs
      amount: ing.amount !== undefined ? String(ing.amount) : '',
      calories: ing.calories !== undefined ? String(ing.calories) : undefined,
      protein: ing.protein !== undefined ? String(ing.protein) : undefined,
      carbs: ing.carbs !== undefined ? String(ing.carbs) : undefined,
      fat: ing.fat !== undefined ? String(ing.fat) : undefined,
    })) ?? []
  );
  const [instructions, setInstructions] = useState<Instruction[]>(
    existingRecipe?.instructions?.map((text, i) => ({ id: String(i), text })) ?? []
  );
  const [loading, setLoading] = useState(false);

  // ── Validation ───────────────────────────────────────────────────────────────
  const canSubmit =
    title.trim().length > 0 &&
    difficulty !== null &&
    portions.trim().length > 0 &&
    prepTime.trim().length > 0 &&
    cookTime.trim().length > 0;

  const handleSubmit = async () => {
    setLoading(true);

    // 1. Build the base object with ONLY the required fields
    const recipe: any = {
      title: title.trim(),
      isPublic,
      isVegan,
      difficulty: difficulty!,
      portions: Number(portions),
      prepTime: Number(prepTime),
      cookTime: Number(cookTime),
      instructions: instructions.map(i => i.text).filter(Boolean),
    };

    // 2. Safely add overall recipe macros ONLY if the user typed them
    if (calories) recipe.calories = Number(calories);
    if (protein) recipe.protein = Number(protein);
    if (carbs) recipe.carbs = Number(carbs);
    if (fat) recipe.fat = Number(fat);

    // 3. Map ingredients and safely omit empty macro fields
    recipe.ingredients = ingredients.map(ing => {
      // Required ingredient fields
      const cleanIng: any = {
        name: ing.name,
        unit: ing.unit,
        amount: Number(ing.amount),
      };

      // Optional ingredient macros
      if (ing.calories) cleanIng.calories = Number(ing.calories);
      if (ing.protein) cleanIng.protein = Number(ing.protein);
      if (ing.carbs) cleanIng.carbs = Number(ing.carbs);
      if (ing.fat) cleanIng.fat = Number(ing.fat);

      return cleanIng;
    });

    try {
      // 4. Send the clean object to Firebase!
      await saveRecipe(recipe as Recipe, imageUri, existingRecipe?.id);

      Alert.alert("Success!", `Recipe ${isEditMode ? 'updated' : 'created'} successfully.`);
      router.back();

    } catch (error: any) {
      console.error("Error saving recipe:", error);
      Alert.alert("Error", error.message || "Failed to save the recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: spacing.GLOBAL_MARGIN_TOP, paddingHorizontal: spacing.PADDING_HORIZONTAL },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top nav ─────────────────────────────────────────────────────── */}
        <View style={styles.topNav}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.card }]}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={18} color={colors.text} />
          </Pressable>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>
              {isEditMode ? 'Edit Recipe' : 'New Recipe'}
            </Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        <Text style={[styles.pageTitle, { color: colors.text }]}>
          {isEditMode ? 'Edit your recipe' : 'Create a recipe'}
        </Text>

        {/* ── Cover image ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <RecipeImagePicker imageUri={imageUri} onChange={setImageUri} />
        </View>

        {/* ── Basic info ──────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader title="Basic Info" />
          <CustomInput
            label="Recipe Title"
            value={title}
            onChangeText={setTitle}
          />

          <View style={styles.row3}>
            <View style={{ flex: 1 }}>
              <CustomInput
                label="Portions"
                value={portions}
                onChangeText={(t) => setPortions(t.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <CustomInput
                label="Prep (min)"
                value={prepTime}
                onChangeText={(t) => setPrepTime(t.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <CustomInput
                label="Cook (min)"
                value={cookTime}
                onChangeText={(t) => setCookTime(t.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* ── Toggles ─────────────────────────────────────────────────────── */}
        <View style={[styles.section, { gap: 8 }]}>
          <SectionHeader title="Options" />
          <ToggleRow label="🌍  Public recipe" value={isPublic} onValueChange={setIsPublic} />
          <ToggleRow label="🌿  Vegan" value={isVegan} onValueChange={setIsVegan} />
        </View>

        {/* ── Difficulty ──────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader title="Difficulty" />
          <DifficultyPicker value={difficulty} onChange={setDifficulty} />
        </View>

        {/* ── Ingredients ─────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader
            title="Ingredients"
            subtitle="Tap the leaf icon on each ingredient to add its nutritional values"
          />
          <IngredientEditor ingredients={ingredients} onChange={setIngredients} />
        </View>

        {/* ── Instructions ────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader title="Instructions" subtitle="Max 300 characters per step" />
          <InstructionEditor instructions={instructions} onChange={setInstructions} />
        </View>

        {/* ── Recipe-level macros ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <SectionHeader
            title="Recipe Nutrition"
            subtitle="Optional — enter totals for the whole recipe if known"
          />
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <CustomInput label="Calories" value={calories} onChangeText={(t) => setCalories(t.replace(/[^0-9]/g, ''))} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <CustomInput label="Protein (g)" value={protein} onChangeText={(t) => setProtein(t.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" />
            </View>
          </View>
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <CustomInput label="Carbs (g)" value={carbs} onChangeText={(t) => setCarbs(t.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 1 }}>
              <CustomInput label="Fat (g)" value={fat} onChangeText={(t) => setFat(t.replace(/[^0-9.]/g, ''))} keyboardType="decimal-pad" />
            </View>
          </View>
        </View>



      </ScrollView>

      {!isKeyboardVisible && (
        <View
          style={[
            styles.footer,
            {
              paddingHorizontal: spacing.PADDING_HORIZONTAL,
              paddingBottom: spacing.BOTTOM_INSET > 0 ? spacing.BOTTOM_INSET + 8 : 24,
              backgroundColor: colors.background,
              borderTopWidth: 1,
              borderColor: colors.card,
            },
          ]}
        >
          <CustomButton
            title={isEditMode ? 'Save Changes' : 'Create Recipe'}
            onPress={handleSubmit}
            loading={loading}
            disabled={!canSubmit}
          />
        </View>
      )}

    </KeyboardAvoidingView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 120 },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 13, fontWeight: '600', letterSpacing: 1.2,
    textTransform: 'uppercase', opacity: 0.8,
  },
  pageTitle: {
    fontSize: 30, fontWeight: '700', letterSpacing: -0.5,
    marginBottom: 24,
  },
  section: { marginBottom: 28 },
  row2: { flexDirection: 'row', gap: 10 },
  row3: { flexDirection: 'row', gap: 10 },
  footer: { paddingTop: 12 },
});
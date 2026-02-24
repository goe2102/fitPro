import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useAppTheme } from '../../constants/Config';
import { Recipe } from '../../types/GlobalTypes';
import { useFirebaseImageUrl } from '../../methods/recipes/useFirebaseImageUrl';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Cook Mode Overlay ────────────────────────────────────────────────────────

function CookMode({ instructions, onClose }: { instructions: string[]; onClose: () => void }) {
  const { colors } = useAppTheme();
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const total = instructions.length;

  const goToStep = (next: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setStep(next);
  };

  const progress = (step + 1) / total;

  return (
    <View style={[StyleSheet.absoluteFill, cookStyles.overlay, { backgroundColor: colors.background }]}>

      {/* Header */}
      <View style={[cookStyles.header, { borderBottomColor: colors.card }]}>
        <Pressable onPress={onClose} hitSlop={12} style={[cookStyles.closeBtn, { backgroundColor: colors.card }]}>
          <Ionicons name="close" size={20} color={colors.text} />
        </Pressable>
        <Text style={[cookStyles.headerTitle, { color: colors.text }]}>Cook Mode</Text>
        <Text style={[cookStyles.counter, { color: colors.tabIconDefault }]}>
          {step + 1} / {total}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={[cookStyles.progressTrack, { backgroundColor: colors.card }]}>
        <Animated.View
          style={[cookStyles.progressFill, { backgroundColor: colors.primary, width: `${progress * 100}%` }]}
        />
      </View>

      {/* Step dots */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={cookStyles.dotsRow}
      >
        {instructions.map((_, i) => (
          <Pressable key={i} onPress={() => goToStep(i)} hitSlop={8}>
            <View
              style={[
                cookStyles.dot,
                {
                  backgroundColor: i < step ? colors.primary : i === step ? colors.primary : colors.card,
                  width: i === step ? 24 : 8,
                  opacity: i < step ? 0.5 : 1,
                },
              ]}
            />
          </Pressable>
        ))}
      </ScrollView>

      {/* Step content */}
      <View style={cookStyles.stepContent}>
        <View style={[cookStyles.stepBadge, { backgroundColor: colors.primary + '18' }]}>
          <Text style={[cookStyles.stepBadgeText, { color: colors.primary }]}>
            Step {step + 1}
          </Text>
        </View>
        <Animated.Text style={[cookStyles.stepText, { color: colors.text, opacity: fadeAnim }]}>
          {instructions[step]}
        </Animated.Text>
      </View>

      {/* Navigation */}
      <View style={cookStyles.navRow}>
        <Pressable
          onPress={() => step > 0 && goToStep(step - 1)}
          disabled={step === 0}
          style={[cookStyles.navBtnSecondary, { backgroundColor: colors.card, opacity: step === 0 ? 0.35 : 1 }]}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text} />
          <Text style={[cookStyles.navBtnSecondaryText, { color: colors.text }]}>Back</Text>
        </Pressable>

        {step < total - 1 ? (
          <Pressable
            onPress={() => goToStep(step + 1)}
            style={[cookStyles.navBtnPrimary, { backgroundColor: colors.primary }]}
          >
            <Text style={cookStyles.navBtnPrimaryText}>Next Step</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </Pressable>
        ) : (
          <Pressable
            onPress={onClose}
            style={[cookStyles.navBtnPrimary, { backgroundColor: '#16a34a' }]}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={cookStyles.navBtnPrimaryText}>Finished!</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, value, label }: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[statStyles.card, { backgroundColor: colors.card }]}>
      <View style={[statStyles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={[statStyles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[statStyles.label, { color: colors.tabIconDefault }]}>{label}</Text>
    </View>
  );
}

// ─── Macro Bar ────────────────────────────────────────────────────────────────

function MacroRow({ label, value, unit, color }: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={macroStyles.row}>
      <View style={[macroStyles.dot, { backgroundColor: color }]} />
      <Text style={[macroStyles.label, { color: colors.tabIconDefault }]}>{label}</Text>
      <Text style={[macroStyles.value, { color: colors.text }]}>
        {value}{unit}
      </Text>
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionTitle({ title }: { title: string }) {
  const { colors } = useAppTheme();
  return (
    <Text style={[sectionStyles.title, { color: colors.text }]}>{title}</Text>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ViewRecipeScreen() {
  const { colors, spacing } = useAppTheme();
  const router = useRouter();
  const { recipeData } = useLocalSearchParams();
  const [cookMode, setCookMode] = useState(false);

  const recipe: Recipe | null = recipeData
    ? JSON.parse(decodeURIComponent(recipeData as string))
    : null;

  const imageUrl = useFirebaseImageUrl(recipe?.imageUrl);

  if (!recipe) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Recipe not found.</Text>
      </View>
    );
  }

  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
  const hasNutrition = recipe.hasCompleteNutrionalDetails;
  const instructions = recipe.instructions ?? [];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* Cook Mode overlay */}
      {cookMode && instructions.length > 0 && (
        <CookMode instructions={instructions} onClose={() => setCookMode(false)} />
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── Hero Image ──────────────────────────────────────────────── */}
        <View style={styles.heroContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.heroImage}
              contentFit="cover"
              transition={300}
            />
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: colors.card }]}>
              <Ionicons name="restaurant-outline" size={48} color={colors.tabIconDefault} />
            </View>
          )}

          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.background + 'EE' }]}
            hitSlop={8}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>

          {/* Like badge */}
          <View style={[styles.likeBadge, { backgroundColor: colors.background + 'EE' }]}>
            <Ionicons name="heart" size={14} color={colors.primary} />
            <Text style={[styles.likeText, { color: colors.text }]}>{recipe.likeCount || 0}</Text>
          </View>
        </View>

        <View style={[styles.content, { paddingHorizontal: spacing.PADDING_HORIZONTAL }]}>

          {/* ── Title + Tags ──────────────────────────────────────────── */}
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text }]}>{recipe.title}</Text>
          </View>

          <View style={styles.tagsRow}>
            <View style={[styles.tag, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="bar-chart-outline" size={13} color={colors.primary} />
              <Text style={[styles.tagText, { color: colors.primary }]}>{recipe.difficulty}</Text>
            </View>
            {recipe.isVegan && (
              <View style={[styles.tag, { backgroundColor: '#16a34a18' }]}>
                <Text style={[styles.tagText, { color: '#16a34a' }]}>🌿 Vegan</Text>
              </View>
            )}
            {!recipe.isPublic && (
              <View style={[styles.tag, { backgroundColor: colors.card }]}>
                <Ionicons name="lock-closed-outline" size={13} color={colors.tabIconDefault} />
                <Text style={[styles.tagText, { color: colors.tabIconDefault }]}>Private</Text>
              </View>
            )}
          </View>

          {/* ── Stats ─────────────────────────────────────────────────── */}
          <View style={styles.statsRow}>
            <StatCard icon="time-outline" value={`${recipe.prepTime}m`} label="Prep" />
            <StatCard icon="flame-outline" value={`${recipe.cookTime}m`} label="Cook" />
            <StatCard icon="stopwatch-outline" value={`${totalTime}m`} label="Total" />
            <StatCard icon="people-outline" value={`${recipe.portions}`} label="Portions" />
          </View>

          {/* ── Nutrition ─────────────────────────────────────────────── */}
          {hasNutrition && (
            <View style={styles.section}>
              <SectionTitle title="Nutrition per portion" />
              <View style={[styles.nutritionCard, { backgroundColor: colors.card }]}>
                <View style={nutritionStyles.calorieRow}>
                  <Text style={[nutritionStyles.calorieValue, { color: colors.text }]}>
                    {recipe.totalCaloriesPerPortion ?? '—'}
                  </Text>
                  <Text style={[nutritionStyles.calorieLabel, { color: colors.tabIconDefault }]}>
                    kcal
                  </Text>
                </View>
                <View style={nutritionStyles.divider} />
                <View style={nutritionStyles.macrosColumn}>
                  {recipe.totalProteinPerPortion != null && (
                    <MacroRow label="Protein" value={recipe.totalProteinPerPortion} unit="g" color="#3b82f6" />
                  )}
                  {recipe.totalCarbsPerPortion != null && (
                    <MacroRow label="Carbs" value={recipe.totalCarbsPerPortion} unit="g" color="#f59e0b" />
                  )}
                  {recipe.totalFatPerPortion != null && (
                    <MacroRow label="Fat" value={recipe.totalFatPerPortion} unit="g" color="#ec4899" />
                  )}
                </View>
              </View>
            </View>
          )}

          {/* ── Ingredients ───────────────────────────────────────────── */}
          {recipe.ingredients?.length > 0 && (
            <View style={styles.section}>
              <SectionTitle title={`Ingredients  ·  ${recipe.portions} portions`} />
              <View style={[styles.ingredientsList, { backgroundColor: colors.card }]}>
                {recipe.ingredients.map((ing, i) => (
                  <View
                    key={i}
                    style={[
                      styles.ingredientRow,
                      i < recipe.ingredients.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.background,
                      },
                    ]}
                  >
                    <View style={[styles.ingredientBullet, { backgroundColor: colors.primary }]} />
                    <Text style={[styles.ingredientName, { color: colors.text }]}>{ing.name}</Text>
                    <Text style={[styles.ingredientAmount, { color: colors.tabIconDefault }]}>
                      {ing.amount} {ing.unit}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Instructions ──────────────────────────────────────────── */}
          {instructions.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <SectionTitle title="Instructions" />
                <Pressable
                  onPress={() => setCookMode(true)}
                  style={[styles.cookModeBtn, { backgroundColor: colors.primary }]}
                >
                  <Ionicons name="play" size={13} color="#fff" />
                  <Text style={styles.cookModeBtnText}>Start Cooking</Text>
                </Pressable>
              </View>

              {instructions.map((step, i) => (
                <View
                  key={i}
                  style={[styles.stepCard, { backgroundColor: colors.card }]}
                >
                  <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                    <Text style={styles.stepNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Sticky Start Cooking button ───────────────────────────────── */}
      {instructions.length > 0 && (
        <View style={[styles.stickyFooter, {
          backgroundColor: colors.background,
          borderTopColor: colors.card,
          paddingBottom: spacing.BOTTOM_INSET > 0 ? spacing.BOTTOM_INSET + 8 : 24,
        }]}>
          <Pressable
            onPress={() => router.push({
              pathname: '/recipeScreens/cookMode',
              params: {
                instructionsData: encodeURIComponent(JSON.stringify(recipe.instructions)),
                recipeTitle: recipe.title,
              }
            })}
            style={({ pressed }) => [
              styles.startCookingBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="restaurant-outline" size={20} color="#fff" />
            <Text style={styles.startCookingText}>Start Cooking</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroContainer: { width: '100%', height: 280, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  backBtn: {
    position: 'absolute', top: 52, left: 16,
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  likeBadge: {
    position: 'absolute', top: 52, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12,
  },
  likeText: { fontSize: 13, fontWeight: '700' },
  content: { paddingTop: 20 },
  titleRow: { marginBottom: 10 },
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, lineHeight: 32 },
  tagsRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  tagText: { fontSize: 12, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  section: { marginBottom: 28 },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  cookModeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  cookModeBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  nutritionCard: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  ingredientsList: { borderRadius: 16, overflow: 'hidden' },
  ingredientRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 10 },
  ingredientBullet: { width: 6, height: 6, borderRadius: 3 },
  ingredientName: { flex: 1, fontSize: 15, fontWeight: '500' },
  ingredientAmount: { fontSize: 14, fontWeight: '500' },
  stepCard: {
    borderRadius: 16, padding: 16,
    flexDirection: 'row', gap: 14,
    marginBottom: 10, alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 1,
  },
  stepNumberText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  stepText: { flex: 1, fontSize: 15, lineHeight: 22, fontWeight: '400' },
  stickyFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingTop: 12, paddingHorizontal: 20,
    borderTopWidth: 1,
  },
  startCookingBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 16,
  },
  startCookingText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1, borderRadius: 14, padding: 12,
    alignItems: 'center', gap: 4,
  },
  iconCircle: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  value: { fontSize: 15, fontWeight: '800' },
  label: { fontSize: 11, fontWeight: '500' },
});

const nutritionStyles = StyleSheet.create({
  calorieRow: { alignItems: 'center' },
  calorieValue: { fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  calorieLabel: { fontSize: 12, fontWeight: '500', marginTop: -2 },
  divider: { width: 1, height: '100%', backgroundColor: '#00000015', marginHorizontal: 4 },
  macrosColumn: { flex: 1, gap: 8 },
});

const macroStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { flex: 1, fontSize: 13, fontWeight: '500' },
  value: { fontSize: 14, fontWeight: '700' },
});

const sectionStyles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3, marginBottom: 14 },
});

const cookStyles = StyleSheet.create({
  overlay: { zIndex: 100, paddingTop: 56 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1,
  },
  closeBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  counter: { fontSize: 14, fontWeight: '600' },
  progressTrack: { height: 4, marginHorizontal: 20, marginTop: 16, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  dotsRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingVertical: 16, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4 },
  stepContent: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 20 },
  stepBadge: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  stepBadgeText: { fontSize: 14, fontWeight: '700' },
  stepText: { fontSize: 22, fontWeight: '500', lineHeight: 34, letterSpacing: -0.3 },
  navRow: {
    flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20,
  },
  navBtnSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 16, borderRadius: 16,
  },
  navBtnSecondaryText: { fontSize: 15, fontWeight: '600' },
  navBtnPrimary: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: 16,
  },
  navBtnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
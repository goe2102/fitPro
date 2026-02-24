import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../constants/Config';
import { Recipe } from '../types/GlobalTypes';
import { Image } from 'expo-image';

interface RecipeCardProps {
  recipe: Recipe;
  onPressCard: () => void;

  // Icon 1 (e.g., Edit or Save)
  icon1Name?: keyof typeof Ionicons.glyphMap;
  onPressIcon1?: () => void;
  icon1Color?: string;

  // Icon 2 (e.g., Delete or Share)
  icon2Name?: keyof typeof Ionicons.glyphMap;
  onPressIcon2?: () => void;
  icon2Color?: string;

  // Optional Like view
  showLikes?: boolean;

  style?: ViewStyle;
}

// ✅ FIX: Normalize Firebase Storage URLs so they load correctly on all platforms
function normalizeFirebaseUrl(uri: string | null | undefined): string | null {
  if (!uri) return null;
  return uri.replace('firebasestorage.app', 'googleapis.com');
}

export function RecipeCard({
  recipe,
  onPressCard,
  icon1Name,
  onPressIcon1,
  icon1Color,
  icon2Name,
  onPressIcon2,
  icon2Color,
  showLikes = false,
  style,
}: RecipeCardProps) {
  const { colors } = useAppTheme();

  // ✅ FIX: Normalize the URL once here so the Image always gets a working URL
  const imageUrl = normalizeFirebaseUrl(recipe.imageUrl);

  return (
    <Pressable
      onPress={onPressCard}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.card },
        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
        style
      ]}
    >
      {/* 1. Image Section */}
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}  // ✅ was: recipe.imageUrl — raw Firebase URL that may fail
            style={styles.image}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: colors.background }]}>
            <Ionicons name="restaurant-outline" size={32} color={colors.tabIconDefault} />
          </View>
        )}

        {/* Optional Like Badge overlay */}
        {showLikes && (
          <View style={[styles.likeBadge, { backgroundColor: colors.background + 'CC' }]}>
            <Ionicons name="heart" size={14} color={colors.primary} />
            <Text style={[styles.likeText, { color: colors.text }]}>{recipe.likeCount || 0}</Text>
          </View>
        )}
      </View>

      {/* 2. Details Section */}
      <View style={styles.detailsContainer}>
        <View style={styles.textColumn}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {recipe.title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
            {recipe.difficulty} • {recipe.prepTime + recipe.cookTime} min • {recipe.calories ? `${recipe.calories} kcal` : 'Macros hidden'}
          </Text>
        </View>

        {/* 3. Action Icons */}
        <View style={styles.actionsRow}>
          {icon1Name && (
            <Pressable onPress={onPressIcon1} style={styles.iconButton} hitSlop={10}>
              <Ionicons name={icon1Name} size={22} color={icon1Color || colors.text} />
            </Pressable>
          )}
          {icon2Name && (
            <Pressable onPress={onPressIcon2} style={styles.iconButton} hitSlop={10}>
              <Ionicons name={icon2Name} size={22} color={icon2Color || colors.error} />
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  imageContainer: {
    height: 160,
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  likeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  detailsContainer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textColumn: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  }
});
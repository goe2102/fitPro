import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Text,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../constants/Config';

export type SortOption = 'recent' | 'most_liked' | 'lowest_calories' | 'highest_calories';

export interface RecipeFilters {
  search: string;
  veganOnly: boolean;
  sort: SortOption;
}

interface RecipeListControlsProps {
  filters: RecipeFilters;
  onChange: (filters: RecipeFilters) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'recent', label: '🕐 Recent' },
  { value: 'most_liked', label: '❤️ Most Liked' },
  { value: 'lowest_calories', label: '🥗 Lowest Cal' },
  { value: 'highest_calories', label: '🔥 Highest Cal' },
];

export function RecipeListControls({ filters, onChange }: RecipeListControlsProps) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);

  const update = (partial: Partial<RecipeFilters>) =>
    onChange({ ...filters, ...partial });

  return (
    <View style={styles.wrapper}>
      {/* Search Bar */}
      <View
        style={[
          styles.searchRow,
          {
            backgroundColor: colors.card,
            borderColor: focused ? colors.primary : 'transparent',
          },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={18}
          color={focused ? colors.primary : colors.tabIconDefault}
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search recipes..."
          placeholderTextColor={colors.tabIconDefault}
          value={filters.search}
          onChangeText={(t) => update({ search: t })}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.searchInput, { color: colors.text }]}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {filters.search.length > 0 && (
          <Pressable onPress={() => update({ search: '' })} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.tabIconDefault} />
          </Pressable>
        )}
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {/* Vegan toggle */}
        <Pressable
          onPress={() => update({ veganOnly: !filters.veganOnly })}
          style={[
            styles.chip,
            {
              backgroundColor: filters.veganOnly ? colors.primary : colors.card,
              borderColor: filters.veganOnly ? colors.primary : colors.card,
            },
          ]}
        >
          <Text
            style={[
              styles.chipText,
              { color: filters.veganOnly ? '#fff' : colors.tabIconDefault },
            ]}
          >
            🌿 Vegan
          </Text>
        </Pressable>

        {/* Sort options */}
        {SORT_OPTIONS.map((opt) => {
          const active = filters.sort === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => update({ sort: opt.value })}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  borderColor: active ? colors.primary : colors.card,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: active ? '#fff' : colors.tabIconDefault },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// Pure helper — apply filters + sort to any Recipe array
import { Recipe } from '../types/GlobalTypes';

export function applyRecipeFilters(recipes: Recipe[], filters: RecipeFilters): Recipe[] {
  let result = [...recipes];

  // Search by title
  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    result = result.filter((r) => r.title.toLowerCase().includes(q));
  }

  // Vegan only
  if (filters.veganOnly) {
    result = result.filter((r) => r.isVegan);
  }

  // Sort
  switch (filters.sort) {
    case 'most_liked':
      result.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
      break;
    case 'lowest_calories':
      result.sort(
        (a, b) =>
          (a.totalCaloriesPerPortion ?? a.calories ?? Infinity) -
          (b.totalCaloriesPerPortion ?? b.calories ?? Infinity)
      );
      break;
    case 'highest_calories':
      result.sort(
        (a, b) =>
          (b.totalCaloriesPerPortion ?? b.calories ?? 0) -
          (a.totalCaloriesPerPortion ?? a.calories ?? 0)
      );
      break;
    case 'recent':
    default:
      result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      break;
  }

  return result;
}

export const DEFAULT_FILTERS: RecipeFilters = {
  search: '',
  veganOnly: false,
  sort: 'recent',
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
    paddingBottom: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
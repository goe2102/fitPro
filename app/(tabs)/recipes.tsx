import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useAppTheme } from '../../constants/Config';

import MyRecipes from '../recipeScreens/myRecipes';
import SavedRecipes from '../recipeScreens/savedRecipes';
import PublicRecipes from '../recipeScreens/publicRecipes';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// We will create these next!


type TabType = 'public' | 'mine' | 'saved';

const RecipeScreen = () => {
  const { colors, spacing } = useAppTheme();
  const [activeTab, setActiveTab] = useState<TabType>('public');

  // A helper component for the top toggle buttons
  const TabButton = ({ title, tab }: { title: string; tab: TabType }) => {
    const isActive = activeTab === tab;
    return (
      <Pressable
        onPress={() => setActiveTab(tab)}
        style={[
          styles.tabButton,
          {
            backgroundColor: isActive ? colors.primary : colors.card,
            borderColor: isActive ? colors.primary : colors.card,
          },
        ]}
      >
        <Text style={[
          styles.tabText,
          { color: isActive ? colors.background : colors.text }
        ]}>
          {title}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: spacing.GLOBAL_MARGIN_TOP }]}>

      {/* Header */}
      <View style={{ paddingHorizontal: spacing.PADDING_HORIZONTAL, marginBottom: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: 'bold' }}>
          Recipes
        </Text>
        <Pressable
          onPress={() => router.push('../recipeScreens/addRecipe')}
          style={[styles.backButton, { backgroundColor: colors.card }]}
          hitSlop={8}
        >
          <Ionicons name="add" size={18} color={colors.text} />
        </Pressable>
      </View>

      {/* Segmented Control / Tabs */}
      <View style={[styles.tabContainer, { paddingHorizontal: spacing.PADDING_HORIZONTAL }]}>
        <TabButton title="Discover" tab="public" />
        <TabButton title="My Recipes" tab="mine" />
        <TabButton title="Saved" tab="saved" />
      </View>

      {/* The Actual Screens (Components) */}
      <View style={styles.contentContainer}>
        {activeTab === 'public' && <PublicRecipes />}
        {activeTab === 'mine' && <MyRecipes />}
        {activeTab === 'saved' && <SavedRecipes />}
      </View>

    </View>
  );
};

export default RecipeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1, // Takes up the rest of the screen
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
});
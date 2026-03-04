import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet, Text, View, Pressable, Modal,
  ScrollView, Switch, Animated,
} from 'react-native';
import { useAppTheme } from '../../constants/Config';
import MyRecipes from '../recipeScreens/myRecipes';
import SavedRecipes from '../recipeScreens/savedRecipes';
import PublicRecipes from '../recipeScreens/publicRecipes';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { RecipeFilters, DEFAULT_FILTERS } from '../../components/RecipeListControl';

type TabType = 'public' | 'mine' | 'saved';

const TABS: { key: TabType; label: string; icon: string }[] = [
  { key: 'public', label: 'Discover', icon: 'compass-outline' },
  { key: 'mine', label: 'My Recipes', icon: 'book-outline' },
  { key: 'saved', label: 'Saved', icon: 'bookmark-outline' },
];

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'az', label: 'A → Z' },
  { key: 'mostLiked', label: 'Most liked' },
];

export default function RecipeScreen() {
  const { colors, spacing } = useAppTheme();
  const [activeTab, setActiveTab] = useState<TabType>('public');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<RecipeFilters>(DEFAULT_FILTERS);
  const [searchText, setSearchText] = useState('');

  // count active non-default filters for badge
  const activeFilterCount =
    (filters.veganOnly ? 1 : 0) +
    (filters.sortBy !== DEFAULT_FILTERS.sortBy ? 1 : 0);

  const mergedFilters: RecipeFilters = { ...filters, search: searchText };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: spacing.GLOBAL_MARGIN_TOP, paddingHorizontal: spacing.PADDING_HORIZONTAL }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Recipes</Text>
          <Text style={[styles.headerSub, { color: colors.tabIconDefault }]}>
            {activeTab === 'public' ? 'Discover from the community' :
              activeTab === 'mine' ? 'Your creations' :
                'Your bookmarks'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {/* Filter button with active-count badge */}
          <Pressable
            onPress={() => setFilterOpen(true)}
            style={[styles.iconBtn, { backgroundColor: colors.card }]}
            hitSlop={8}
          >
            <Ionicons name="options-outline" size={18} color={activeFilterCount > 0 ? colors.primary : colors.text} />
            {activeFilterCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </Pressable>

          {/* Add recipe */}
          <Pressable
            onPress={() => router.push('../recipeScreens/addRecipe')}
            style={[styles.iconBtn, { backgroundColor: colors.primary }]}
            hitSlop={8}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* ── Tab pills ──────────────────────────────────────────── */}
      <View style={[styles.tabRow, { paddingHorizontal: spacing.PADDING_HORIZONTAL }]}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabPill,
                {
                  backgroundColor: active ? colors.primary : colors.card,
                  flex: 1,
                },
              ]}
            >
              <Ionicons
                name={tab.icon as any}
                size={14}
                color={active ? '#fff' : colors.tabIconDefault}
              />
              <Text style={[styles.tabLabel, { color: active ? '#fff' : colors.tabIconDefault }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Content ────────────────────────────────────────────── */}
      <View style={styles.content}>
        {activeTab === 'public' && <PublicRecipes filters={mergedFilters} />}
        {activeTab === 'mine' && <MyRecipes filters={mergedFilters} />}
        {activeTab === 'saved' && <SavedRecipes filters={mergedFilters} />}
      </View>

      {/* ── Filter bottom sheet ─────────────────────────────────── */}
      <FilterSheet
        visible={filterOpen}
        filters={filters}
        onClose={() => setFilterOpen(false)}
        onChange={setFilters}
        colors={colors}
      />
    </View>
  );
}

// ─── Filter Bottom Sheet ──────────────────────────────────────────────────────

function FilterSheet({ visible, filters, onClose, onChange, colors }: {
  visible: boolean;
  filters: RecipeFilters;
  onClose: () => void;
  onChange: (f: RecipeFilters) => void;
  colors: any;
}) {
  const SORT_OPTIONS = [
    { key: 'newest', label: 'Newest first' },
    { key: 'oldest', label: 'Oldest first' },
    { key: 'az', label: 'A → Z' },
    { key: 'mostLiked', label: 'Most liked' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.card }]}>

        {/* Handle */}
        <View style={[styles.sheetHandle, { backgroundColor: colors.tabIconDefault + '40' }]} />

        {/* Title row */}
        <View style={styles.sheetHeader}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Filters</Text>
          <Pressable
            onPress={() => onChange(DEFAULT_FILTERS)}
            hitSlop={10}
          >
            <Text style={[styles.resetText, { color: colors.primary }]}>Reset</Text>
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>

          {/* Sort by */}
          <Text style={[styles.sheetSection, { color: colors.tabIconDefault }]}>SORT BY</Text>
          <View style={styles.sortGrid}>
            {SORT_OPTIONS.map((opt) => {
              const active = filters.sortBy === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => onChange({ ...filters, sortBy: opt.key as any })}
                  style={[
                    styles.sortChip,
                    {
                      backgroundColor: active ? colors.primary : colors.background,
                      borderColor: active ? colors.primary : colors.background,
                    },
                  ]}
                >
                  {active && <Ionicons name="checkmark" size={13} color="#fff" />}
                  <Text style={[styles.sortChipText, { color: active ? '#fff' : colors.text }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Toggles */}
          <Text style={[styles.sheetSection, { color: colors.tabIconDefault }]}>DIETARY</Text>
          <View style={[styles.toggleRow, { backgroundColor: colors.background }]}>
            <View style={styles.toggleLeft}>
              <Text style={styles.toggleEmoji}>🌱</Text>
              <View>
                <Text style={[styles.toggleLabel, { color: colors.text }]}>Vegan only</Text>
                <Text style={[styles.toggleSub, { color: colors.tabIconDefault }]}>Show only vegan recipes</Text>
              </View>
            </View>
            <Switch
              value={filters.veganOnly}
              onValueChange={(v) => onChange({ ...filters, veganOnly: v })}
              trackColor={{ false: colors.tabIconDefault + '40', true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>

        {/* Done button */}
        <Pressable
          onPress={onClose}
          style={[styles.doneBtn, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.doneBtnText}>Done</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  headerSub: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
  },
  iconBtn: {
    width: 38, height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4, right: -4,
    width: 16, height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 20,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },

  content: { flex: 1 },

  // Filter sheet
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '75%',
  },
  sheetHandle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12, marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  resetText: { fontSize: 14, fontWeight: '600' },
  sheetSection: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 4,
  },
  sortGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  sortChipText: { fontSize: 13, fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleEmoji: { fontSize: 22 },
  toggleLabel: { fontSize: 15, fontWeight: '600' },
  toggleSub: { fontSize: 12, marginTop: 1 },
  doneBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
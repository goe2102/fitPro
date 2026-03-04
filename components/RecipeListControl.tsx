import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, Modal, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../constants/Config';

export interface RecipeFilters {
  search: string;
  veganOnly: boolean;
  sortBy: 'newest' | 'popular' | 'quickest';
}

export const DEFAULT_FILTERS: RecipeFilters = {
  search: '', veganOnly: false, sortBy: 'newest',
};

export function applyRecipeFilters(recipes: any[], filters: RecipeFilters) {
  let result = [...recipes];
  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (r) => r.title?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)
    );
  }
  if (filters.veganOnly) {
    result = result.filter((r) => r.isVegan || r.tags?.includes('vegan'));
  }
  if (filters.sortBy === 'popular') result.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
  else if (filters.sortBy === 'newest') result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  else if (filters.sortBy === 'quickest') result.sort((a, b) => (a.totalTime || 999) - (b.totalTime || 999));
  return result;
}

interface Props { filters: RecipeFilters; onChange: (f: RecipeFilters) => void; }

export function RecipeListControls({ filters, onChange }: Props) {
  const { colors } = useAppTheme();
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeCount = (filters.veganOnly ? 1 : 0) + (filters.sortBy !== 'newest' ? 1 : 0);

  return (
    <>
      <View style={row.wrap}>
        <View style={[row.bar, { backgroundColor: colors.card }]}>
          <Ionicons name="search-outline" size={16} color={colors.tabIconDefault} />
          <TextInput
            value={filters.search}
            onChangeText={(t) => onChange({ ...filters, search: t })}
            placeholder="Search recipes…"
            placeholderTextColor={colors.tabIconDefault}
            style={[row.input, { color: colors.text }]}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {filters.search.length > 0 && Platform.OS !== 'ios' && (
            <Pressable onPress={() => onChange({ ...filters, search: '' })} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.tabIconDefault} />
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={() => setSheetOpen(true)}
          style={[row.btn, { backgroundColor: activeCount > 0 ? colors.primary : colors.card }]}
        >
          <Ionicons name="options-outline" size={18} color={activeCount > 0 ? '#fff' : colors.tabIconDefault} />
          {activeCount > 0 && (
            <View style={row.badge}><Text style={row.badgeText}>{activeCount}</Text></View>
          )}
        </Pressable>
      </View>

      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <Pressable style={sheet.backdrop} onPress={() => setSheetOpen(false)} />
        <View style={[sheet.wrap, { backgroundColor: colors.card }]}>
          <View style={[sheet.handle, { backgroundColor: colors.tabIconDefault + '40' }]} />
          <View style={sheet.header}>
            <Text style={[sheet.title, { color: colors.text }]}>Filters</Text>
            {activeCount > 0 && (
              <Pressable onPress={() => onChange({ ...filters, veganOnly: false, sortBy: 'newest' })}>
                <Text style={[sheet.reset, { color: colors.primary }]}>Reset</Text>
              </Pressable>
            )}
          </View>

          <Text style={[sheet.label, { color: colors.tabIconDefault }]}>SORT BY</Text>
          <View style={sheet.chips}>
            {(['newest', 'popular', 'quickest'] as const).map((s) => (
              <Pressable
                key={s}
                onPress={() => onChange({ ...filters, sortBy: s })}
                style={[sheet.chip, { backgroundColor: filters.sortBy === s ? colors.primary : colors.background }]}
              >
                <Text style={[sheet.chipText, { color: filters.sortBy === s ? '#fff' : colors.tabIconDefault }]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[sheet.label, { color: colors.tabIconDefault }]}>DIET</Text>
          <Pressable
            onPress={() => onChange({ ...filters, veganOnly: !filters.veganOnly })}
            style={[sheet.toggleRow, { backgroundColor: colors.background }]}
          >
            <Text style={[sheet.toggleLabel, { color: colors.text }]}>🌱  Vegan only</Text>
            <View style={[sheet.track, { backgroundColor: filters.veganOnly ? colors.primary : colors.tabIconDefault + '40' }]}>
              <View style={[sheet.thumb, { transform: [{ translateX: filters.veganOnly ? 18 : 2 }] }]} />
            </View>
          </Pressable>

          <Pressable onPress={() => setSheetOpen(false)} style={[sheet.done, { backgroundColor: colors.primary }]}>
            <Text style={sheet.doneText}>Done</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const row = StyleSheet.create({
  wrap: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  bar: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 14 },
  input: { flex: 1, fontSize: 14 },
  btn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});

const sheet = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  wrap: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 44, gap: 14 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: '800' },
  reset: { fontSize: 14, fontWeight: '600' },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20 },
  chipText: { fontSize: 14, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 14 },
  toggleLabel: { fontSize: 15, fontWeight: '600' },
  track: { width: 42, height: 26, borderRadius: 13, justifyContent: 'center' },
  thumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  done: { paddingVertical: 15, borderRadius: 16, alignItems: 'center', marginTop: 4 },
  doneText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
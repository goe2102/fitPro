import React, { useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, TextInput, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../constants/Config';

export interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit: string;
  calories?: string;
  protein?: string;
  carbs?: string;
  fat?: string;
}

interface IngredientEditorProps {
  ingredients: Ingredient[];
  onChange: (ingredients: Ingredient[]) => void;
}

function IngredientRow({
  ingredient,
  onUpdate,
  onDelete,
}: {
  ingredient: Ingredient;
  onUpdate: (updated: Ingredient) => void;
  onDelete: () => void;
}) {
  const { colors } = useAppTheme();
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  const toggleExpand = () => {
    Animated.timing(rotateAnim, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    setExpanded(e => !e);
  };

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  const set = (field: keyof Ingredient) => (val: string) =>
    onUpdate({ ...ingredient, [field]: val });

  const hasMacros = !!(ingredient.calories || ingredient.protein || ingredient.carbs || ingredient.fat);

  return (
    <View style={[styles.row, { backgroundColor: colors.card }]}>
      {/* Main row */}
      <View style={styles.rowMain}>
        <Input
          value={ingredient.name}
          onChangeText={set('name')}
          placeholder="Ingredient"
          flex={3}
          colors={colors}
        />
        <Input
          value={ingredient.amount}
          onChangeText={set('amount')}
          placeholder="Amt"
          flex={1.2}
          keyboardType="decimal-pad"
          colors={colors}
        />
        <Input
          value={ingredient.unit}
          onChangeText={set('unit')}
          placeholder="Unit"
          flex={1.2}
          colors={colors}
        />
        {/* Expand macros */}
        <Pressable onPress={toggleExpand} style={styles.iconBtn} hitSlop={8}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Ionicons
              name="nutrition-outline"
              size={18}
              color={hasMacros ? colors.primary : colors.tabIconDefault}
            />
          </Animated.View>
        </Pressable>
        {/* Delete */}
        <Pressable onPress={onDelete} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="close-circle-outline" size={18} color={colors.error} />
        </Pressable>
      </View>

      {/* Macro row */}
      {expanded && (
        <View style={styles.macroRow}>
          <MacroInput label="kcal" value={ingredient.calories} onChangeText={set('calories')} colors={colors} />
          <MacroInput label="Prot" value={ingredient.protein} onChangeText={set('protein')} colors={colors} />
          <MacroInput label="Carb" value={ingredient.carbs} onChangeText={set('carbs')} colors={colors} />
          <MacroInput label="Fat" value={ingredient.fat} onChangeText={set('fat')} colors={colors} />
        </View>
      )}
    </View>
  );
}

function Input({
  value, onChangeText, placeholder, flex, keyboardType, colors,
}: {
  value: string; onChangeText: (t: string) => void; placeholder: string;
  flex: number; keyboardType?: any; colors: any;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.tabIconDefault + '70'}
      keyboardType={keyboardType}
      style={[
        styles.inlineInput,
        {
          flex,
          color: colors.text,
          borderColor: focused ? colors.primary : 'transparent',
          backgroundColor: colors.background + 'CC',
        },
      ]}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function MacroInput({
  label, value, onChangeText, colors,
}: {
  label: string; value?: string; onChangeText: (t: string) => void; colors: any;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.macroItem}>
      <Text style={[styles.macroLabel, { color: colors.tabIconDefault }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="—"
        placeholderTextColor={colors.tabIconDefault + '50'}
        keyboardType="decimal-pad"
        style={[
          styles.macroInput,
          {
            color: colors.text,
            borderColor: focused ? colors.primary : colors.tabIconDefault + '30',
            backgroundColor: colors.background + 'CC',
          },
        ]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

export function IngredientEditor({ ingredients, onChange }: IngredientEditorProps) {
  const { colors } = useAppTheme();

  const add = () => {
    onChange([
      ...ingredients,
      { id: Date.now().toString(), name: '', amount: '', unit: 'g' },
    ]);
  };

  const update = (id: string, updated: Ingredient) =>
    onChange(ingredients.map(i => i.id === id ? updated : i));

  const remove = (id: string) =>
    onChange(ingredients.filter(i => i.id !== id));

  return (
    <View style={styles.container}>
      {ingredients.length > 0 && (
        <View style={[styles.header, { borderBottomColor: colors.tabIconDefault + '18' }]}>
          <Text style={[styles.col, { flex: 3, color: colors.tabIconDefault }]}>Ingredient</Text>
          <Text style={[styles.col, { flex: 1.2, color: colors.tabIconDefault }]}>Amt</Text>
          <Text style={[styles.col, { flex: 1.2, color: colors.tabIconDefault }]}>Unit</Text>
          <View style={{ width: 52 }} />
        </View>
      )}

      {ingredients.map(ing => (
        <IngredientRow
          key={ing.id}
          ingredient={ing}
          onUpdate={updated => update(ing.id, updated)}
          onDelete={() => remove(ing.id)}
        />
      ))}

      <Pressable
        onPress={add}
        style={[styles.addBtn, { borderColor: colors.primary + '50', backgroundColor: colors.primary + '0C' }]}
      >
        <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
        <Text style={[styles.addBtnText, { color: colors.primary }]}>Add Ingredient</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    marginBottom: 2,
  },
  col: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4, textTransform: 'uppercase' },
  row: {
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  rowMain: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  inlineInput: {
    height: 38,
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 8,
    fontSize: 14,
    letterSpacing: 0.1,
  },
  iconBtn: { width: 26, alignItems: 'center', justifyContent: 'center' },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 4,
  },
  macroItem: { flex: 1, gap: 4 },
  macroLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'center' },
  macroInput: {
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 6,
    fontSize: 13,
    textAlign: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 2,
  },
  addBtnText: { fontSize: 14, fontWeight: '600', letterSpacing: 0.2 },
});
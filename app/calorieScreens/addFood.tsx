import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection } from 'firebase/firestore';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAppTheme } from '../../constants/Config';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../constants/FirebaseConfig';
import { CustomButton } from '../../components/CustomButton';
import { FoodSearchResult, lookupBarcode, useFoodSearch } from '../../hooks/useFoodSearch';
import { getTodayString, MealType } from '../../hooks/useDailyNutrition';
import { useRecentFoods, saveRecentFood } from '../../hooks/useRecentFoods';


// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingItem {
  key: string;
  food: FoodSearchResult;
  amount: string;
}

const MEAL_META: Record<MealType, { label: string; emoji: string; color: string }> = {
  breakfast: { label: 'Frühstück', emoji: '🌅', color: '#f59e0b' },
  lunch: { label: 'Mittagessen', emoji: '☀️', color: '#22c55e' },
  dinner: { label: 'Abendessen', emoji: '🌙', color: '#6366f1' },
  snack: { label: 'Snacks', emoji: '🍎', color: '#ec4899' },
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function calc(base: number, grams: number) {
  return Math.round(((base * grams) / 100) * 10) / 10;
}

function NutriScoreBadge({ score }: { score?: string }) {
  if (!score) return null;
  const colors: Record<string, string> = {
    a: '#038141', b: '#85BB2F', c: '#FECB02', d: '#EE8100', e: '#E63312',
  };
  const bg = colors[score.toLowerCase()] ?? '#999';
  return (
    <View style={[nsStyles.badge, { backgroundColor: bg }]}>
      <Text style={nsStyles.text}>{score.toUpperCase()}</Text>
    </View>
  );
}
const nsStyles = StyleSheet.create({
  badge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  text: { color: '#fff', fontSize: 11, fontWeight: '800' },
});

// ─── Barcode Scanner Modal ────────────────────────────────────────────────────

function BarcodeScannerModal({
  visible,
  onScanned,
  onClose,
}: {
  visible: boolean;
  onScanned: (barcode: string) => void;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarcode = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    onScanned(data);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={scanStyles.root}>
        {!permission?.granted ? (
          <View style={[scanStyles.permBox, { backgroundColor: colors.background }]}>
            <Ionicons name="camera-outline" size={48} color={colors.tabIconDefault} />
            <Text style={[scanStyles.permTitle, { color: colors.text }]}>
              Kamera-Zugriff benötigt
            </Text>
            <Pressable
              onPress={requestPermission}
              style={[scanStyles.permBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={scanStyles.permBtnText}>Zugriff erlauben</Text>
            </Pressable>
            <Pressable onPress={onClose} style={{ marginTop: 12 }}>
              <Text style={{ color: colors.tabIconDefault }}>Abbrechen</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              onBarcodeScanned={handleBarcode}
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'] }}
            />
            {/* Overlay */}
            <View style={scanStyles.overlay}>
              <Pressable onPress={onClose} style={scanStyles.closeBtn}>
                <Ionicons name="close" size={24} color="#fff" />
              </Pressable>
              <View style={scanStyles.frame}>
                <View style={[scanStyles.corner, scanStyles.tl]} />
                <View style={[scanStyles.corner, scanStyles.tr]} />
                <View style={[scanStyles.corner, scanStyles.bl]} />
                <View style={[scanStyles.corner, scanStyles.br]} />
              </View>
              <Text style={scanStyles.hint}>
                Barcode in den Rahmen halten
              </Text>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const scanStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  permBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  permTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  permBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    position: 'absolute', top: 60, right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20, padding: 8,
  },
  frame: {
    width: 260, height: 160,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24, height: 24,
    borderColor: '#fff',
  },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  hint: {
    color: '#fff', fontSize: 14, fontWeight: '600',
    marginTop: 24, textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});

// ─── Search result row ────────────────────────────────────────────────────────

function SearchRow({ food, onAdd }: { food: FoodSearchResult; onAdd: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onAdd}
      style={({ pressed }) => [
        rowStyles.row,
        { backgroundColor: pressed ? colors.primary + '10' : colors.background },
      ]}
    >
      {food.imageUrl ? (
        <Image source={{ uri: food.imageUrl }} style={rowStyles.thumb} />
      ) : (
        <View style={[rowStyles.thumbPlaceholder, { backgroundColor: colors.card }]}>
          <Ionicons name="fast-food-outline" size={20} color={colors.tabIconDefault} />
        </View>
      )}
      <View style={rowStyles.mid}>
        <Text style={[rowStyles.name, { color: colors.text }]} numberOfLines={2}>
          {food.name}
        </Text>
        {food.brand && (
          <Text style={[rowStyles.brand, { color: colors.tabIconDefault }]} numberOfLines={1}>
            {food.brand}
          </Text>
        )}
        <Text style={[rowStyles.macros, { color: colors.tabIconDefault }]}>
          P {food.protein}g · K {food.carbs}g · F {food.fat}g
        </Text>
      </View>
      <View style={rowStyles.right}>
        <View style={[rowStyles.calBox, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[rowStyles.calVal, { color: colors.primary }]}>{food.calories}</Text>
          <Text style={[rowStyles.calSub, { color: colors.primary + '90' }]}>kcal</Text>
          <Text style={[rowStyles.per100, { color: colors.tabIconDefault }]}>/100g</Text>
        </View>
        <NutriScoreBadge score={food.nutriscore} />
      </View>
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 11, gap: 10 },
  thumb: { width: 48, height: 48, borderRadius: 10 },
  thumbPlaceholder: { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  mid: { flex: 1, gap: 2 },
  name: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  brand: { fontSize: 11 },
  macros: { fontSize: 11, fontWeight: '500' },
  right: { alignItems: 'center', gap: 5 },
  calBox: { alignItems: 'center', borderRadius: 10, padding: 8, minWidth: 54 },
  calVal: { fontSize: 15, fontWeight: '800', letterSpacing: -0.5 },
  calSub: { fontSize: 10, fontWeight: '600' },
  per100: { fontSize: 9 },
});

// ─── Pending item card ────────────────────────────────────────────────────────

function PendingCard({
  item,
  onChange,
  onRemove,
}: {
  item: PendingItem;
  onChange: (key: string, amount: string) => void;
  onRemove: (key: string) => void;
}) {
  const { colors } = useAppTheme();
  const g = Number(item.amount) || 0;

  return (
    <View style={[cardStyles.card, { backgroundColor: colors.card }]}>
      <View style={cardStyles.top}>
        {item.food.imageUrl && (
          <Image source={{ uri: item.food.imageUrl }} style={cardStyles.img} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={[cardStyles.name, { color: colors.text }]} numberOfLines={2}>
            {item.food.name}
          </Text>
          {item.food.brand && (
            <Text style={[cardStyles.brand, { color: colors.tabIconDefault }]}>{item.food.brand}</Text>
          )}
        </View>
        <Pressable onPress={() => onRemove(item.key)} hitSlop={10}>
          <Ionicons name="close-circle" size={22} color={colors.tabIconDefault + '70'} />
        </Pressable>
      </View>

      <View style={cardStyles.bottom}>
        {/* Amount input */}
        <View style={[cardStyles.amountBox, { backgroundColor: colors.background }]}>
          <TextInput
            value={item.amount}
            onChangeText={(t) => onChange(item.key, t.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            style={[cardStyles.amountInput, { color: colors.text }]}
            selectTextOnFocus
          />
          <Text style={[cardStyles.amountUnit, { color: colors.tabIconDefault }]}>g</Text>
        </View>

        {/* Live macros */}
        <View style={cardStyles.macroRow}>
          {[
            { label: 'kcal', val: Math.round(calc(item.food.calories, g)), color: colors.text },
            { label: 'Prot', val: calc(item.food.protein, g), color: '#3b82f6' },
            { label: 'Kohl', val: calc(item.food.carbs, g), color: '#f59e0b' },
            { label: 'Fett', val: calc(item.food.fat, g), color: '#ec4899' },
          ].map((m, i, arr) => (
            <React.Fragment key={m.label}>
              <View style={cardStyles.macroItem}>
                <Text style={[cardStyles.macroVal, { color: m.color }]}>{m.val}</Text>
                <Text style={[cardStyles.macroLabel, { color: colors.tabIconDefault }]}>{m.label}</Text>
              </View>
              {i < arr.length - 1 && (
                <View style={[cardStyles.macroDivider, { backgroundColor: colors.background }]} />
              )}
            </React.Fragment>
          ))}
        </View>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: { borderRadius: 16, padding: 14, marginBottom: 10 },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  img: { width: 44, height: 44, borderRadius: 8 },
  name: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  brand: { fontSize: 11, marginTop: 2 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  amountBox: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    gap: 4, minWidth: 80,
  },
  amountInput: { fontSize: 22, fontWeight: '800', minWidth: 40 },
  amountUnit: { fontSize: 13, fontWeight: '600' },
  macroRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'transparent', borderRadius: 10, overflow: 'hidden',
  },
  macroItem: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  macroVal: { fontSize: 14, fontWeight: '800', letterSpacing: -0.3 },
  macroLabel: { fontSize: 9, fontWeight: '600', marginTop: 1 },
  macroDivider: { width: 1, height: 28 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AddFoodScreen() {
  const { colors, spacing } = useAppTheme();
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();

  const mealType = (params.mealType as MealType) ?? 'breakfast';
  const dateString = (params.dateString as string) ?? getTodayString();
  const meta = MEAL_META[mealType];

  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [barcodeLoading, setBarcodeLoading] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const amountInputRef = useRef<TextInput>(null);
  const keyCounter = useRef(0);
  const makeKey = () => `item-${Date.now()}-${++keyCounter.current}`;
  const { results, loading: searching, error: searchError } = useFoodSearch(query);
  const { recentFoods } = useRecentFoods(15);

  // Amount picker modal state
  const [pendingFood, setPendingFood] = useState<FoodSearchResult | null>(null);
  const [pendingAmount, setPendingAmount] = useState('100');

  // ── Barcode scanned ──────────────────────────────────────────────────────
  const handleBarcodeScanned = async (barcode: string) => {
    setScannerOpen(false);
    setBarcodeLoading(true);
    try {
      const food = await lookupBarcode(barcode);
      if (food) {
        openAmountPickerForBarcode(food);
      } else {
        Alert.alert(
          'Produkt nicht gefunden',
          `Barcode ${barcode} wurde in der OpenFoodFacts-Datenbank nicht gefunden.`
        );
      }
    } catch {
      Alert.alert('Fehler', 'Barcode konnte nicht abgefragt werden.');
    } finally {
      setBarcodeLoading(false);
    }
  };

  // ── Select from search → open amount picker ────────────────────────────
  const handleSelect = (food: FoodSearchResult) => {
    setShowDropdown(false);
    inputRef.current?.blur();
    setPendingAmount('100');
    setPendingFood(food);
    // Focus amount input after modal animates in
    setTimeout(() => amountInputRef.current?.focus(), 350);
  };

  const handleConfirmAmount = () => {
    if (!pendingFood) return;
    const amount = pendingAmount.trim() || '100';
    setPendingItems((prev) => [...prev, { key: makeKey(), food: pendingFood, amount }]);
    // Save to scannedItems for future suggestions (fire and forget)
    if (user) saveRecentFood(user.uid, pendingFood, Number(amount) || 100).catch(console.error);
    setPendingFood(null);
    setQuery('');
  };

  const handleCancelAmount = () => {
    setPendingFood(null);
  };

  const handleAmountChange = (key: string, amount: string) => {
    setPendingItems((prev) => prev.map((i) => i.key === key ? { ...i, amount } : i));
  };

  const handleRemove = (key: string) => {
    setPendingItems((prev) => prev.filter((i) => i.key !== key));
  };

  // ── Save all ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user || pendingItems.length === 0) return;
    setSaving(true);
    try {
      const ref = collection(db, 'users', user.uid, 'foodLog', dateString, 'entries');
      await Promise.all(
        pendingItems.map((item) => {
          const g = Number(item.amount) || 100;
          return addDoc(ref, {
            name: item.food.name,
            brand: item.food.brand ?? null,
            barcode: item.food.barcode ?? null,
            amount: g,
            unit: 'g',
            calories: Math.round(calc(item.food.calories, g)),
            protein: calc(item.food.protein, g),
            carbs: calc(item.food.carbs, g),
            fat: calc(item.food.fat, g),
            fiber: item.food.fiber ? calc(item.food.fiber, g) : null,
            sugar: item.food.sugar ? calc(item.food.sugar, g) : null,
            mealType,
            loggedAt: Date.now(),
          });
        })
      );
      router.back();
    } catch (err) {
      console.error('[AddFood]', err);
      Alert.alert('Fehler', 'Einträge konnten nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  const totals = pendingItems.reduce(
    (acc, item) => {
      const g = Number(item.amount) || 0;
      acc.calories += calc(item.food.calories, g);
      acc.protein += calc(item.food.protein, g);
      acc.carbs += calc(item.food.carbs, g);
      acc.fat += calc(item.food.fat, g);
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // ── Amount picker for barcode too ──────────────────────────────────────
  const openAmountPickerForBarcode = (food: FoodSearchResult) => {
    setPendingAmount('100');
    setPendingFood(food);
    setTimeout(() => amountInputRef.current?.focus(), 350);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Barcode scanner */}
      <BarcodeScannerModal
        visible={scannerOpen}
        onScanned={handleBarcodeScanned}
        onClose={() => setScannerOpen(false)}
      />

      {/* ── Amount picker modal ─────────────────────────────────── */}
      <Modal
        visible={!!pendingFood}
        transparent
        animationType="slide"
        onRequestClose={handleCancelAmount}
      >
        <Pressable style={amountStyles.backdrop} onPress={handleCancelAmount} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[amountStyles.sheet, { backgroundColor: colors.card }]}>
            <View style={[amountStyles.handle, { backgroundColor: colors.tabIconDefault + '40' }]} />

            {/* Product info */}
            <View style={amountStyles.productRow}>
              {pendingFood?.imageUrl ? (
                <Image source={{ uri: pendingFood.imageUrl }} style={amountStyles.productImg} />
              ) : (
                <View style={[amountStyles.productImgPlaceholder, { backgroundColor: colors.background }]}>
                  <Ionicons name="fast-food-outline" size={22} color={colors.tabIconDefault} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[amountStyles.productName, { color: colors.text }]} numberOfLines={2}>
                  {pendingFood?.name}
                </Text>
                {pendingFood?.brand && (
                  <Text style={[amountStyles.productBrand, { color: colors.tabIconDefault }]}>
                    {pendingFood.brand}
                  </Text>
                )}
                <Text style={[amountStyles.per100, { color: colors.tabIconDefault }]}>
                  {pendingFood?.calories} kcal · P {pendingFood?.protein}g · K {pendingFood?.carbs}g · F {pendingFood?.fat}g pro 100g
                </Text>
              </View>
            </View>

            {/* Quick presets */}
            <Text style={[amountStyles.label, { color: colors.tabIconDefault }]}>Menge wählen</Text>
            <View style={amountStyles.presetsRow}>
              {['50', '100', '150', '200', '250', '300'].map((g) => (
                <Pressable
                  key={g}
                  onPress={() => setPendingAmount(g)}
                  style={[
                    amountStyles.presetBtn,
                    {
                      backgroundColor: pendingAmount === g ? colors.primary : colors.background,
                    },
                  ]}
                >
                  <Text style={[
                    amountStyles.presetText,
                    { color: pendingAmount === g ? '#fff' : colors.tabIconDefault },
                  ]}>
                    {g}g
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Custom input */}
            <View style={[amountStyles.customRow, { backgroundColor: colors.background }]}>
              <TextInput
                ref={amountInputRef}
                value={pendingAmount}
                onChangeText={(t) => setPendingAmount(t.replace(/[^0-9.]/g, ''))}
                keyboardType="decimal-pad"
                style={[amountStyles.customInput, { color: colors.text }]}
                selectTextOnFocus
              />
              <Text style={[amountStyles.customUnit, { color: colors.tabIconDefault }]}>g</Text>
            </View>

            {/* Live preview */}
            {pendingFood && Number(pendingAmount) > 0 && (
              <View style={[amountStyles.preview, { backgroundColor: colors.primary + '12' }]}>
                {[
                  { label: 'kcal', val: Math.round(calc(pendingFood.calories, Number(pendingAmount))), color: colors.primary },
                  { label: 'Prot', val: calc(pendingFood.protein, Number(pendingAmount)), color: '#3b82f6' },
                  { label: 'Kohl', val: calc(pendingFood.carbs, Number(pendingAmount)), color: '#f59e0b' },
                  { label: 'Fett', val: calc(pendingFood.fat, Number(pendingAmount)), color: '#ec4899' },
                ].map((m) => (
                  <View key={m.label} style={amountStyles.previewItem}>
                    <Text style={[amountStyles.previewVal, { color: m.color }]}>{m.val}</Text>
                    <Text style={[amountStyles.previewLabel, { color: colors.tabIconDefault }]}>{m.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Confirm button */}
            <Pressable
              onPress={handleConfirmAmount}
              style={[amountStyles.confirmBtn, { backgroundColor: meta.color }]}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={amountStyles.confirmText}>Hinzufügen</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Header ───────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: spacing.GLOBAL_MARGIN_TOP,
            paddingHorizontal: spacing.PADDING_HORIZONTAL,
            backgroundColor: colors.background,
            borderBottomColor: colors.card,
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.card }]}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={18} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Lebensmittel erfassen</Text>
          <View style={[styles.mealPill, { backgroundColor: meta.color + '20' }]}>
            <Text style={styles.mealPillEmoji}>{meta.emoji}</Text>
            <Text style={[styles.mealPillText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
        {/* Barcode button */}
        <Pressable
          onPress={() => setScannerOpen(true)}
          style={[styles.scanBtn, { backgroundColor: colors.card }]}
          hitSlop={8}
        >
          {barcodeLoading
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Ionicons name="barcode-outline" size={22} color={colors.primary} />
          }
        </Pressable>
      </View>

      {/* ── Search bar ───────────────────────────────────────────── */}
      <View style={[styles.searchWrap, { paddingHorizontal: spacing.PADDING_HORIZONTAL }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={18} color={colors.tabIconDefault} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={(t) => { setQuery(t); setShowDropdown(t.length >= 2); }}
            onFocus={() => query.length >= 2 && setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 180)}
            placeholder="Lebensmittel suchen…"
            placeholderTextColor={colors.tabIconDefault}
            style={[styles.searchInput, { color: colors.text }]}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searching && <ActivityIndicator size="small" color={colors.primary} />}
          {query.length > 0 && !searching && (
            <Pressable onPress={() => { setQuery(''); setShowDropdown(false); }} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.tabIconDefault} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Dropdown ─────────────────────────────────────────────── */}
      {showDropdown && (
        <View
          style={[
            styles.dropdown,
            {
              backgroundColor: colors.card,
              marginHorizontal: spacing.PADDING_HORIZONTAL,
              borderColor: colors.background,
              shadowColor: colors.text,
            },
          ]}
        >
          {searchError ? (
            <View style={styles.dropMsg}>
              <Ionicons name="warning-outline" size={18} color="#ef4444" />
              <Text style={[styles.dropMsgText, { color: '#ef4444' }]}>
                Suche fehlgeschlagen. Netzwerk prüfen.
              </Text>
            </View>
          ) : results.length === 0 && !searching ? (
            <View style={styles.dropMsg}>
              <Ionicons name="search-outline" size={18} color={colors.tabIconDefault} />
              <Text style={[styles.dropMsgText, { color: colors.tabIconDefault }]}>
                Keine Ergebnisse für „{query}"
              </Text>
            </View>
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 340 }}
              showsVerticalScrollIndicator={false}
            >
              {results.map((food, i) => (
                <View key={`result-${i}-${food.barcode || food.name}`}>
                  {i > 0 && <View style={[styles.rowDivider, { backgroundColor: colors.background }]} />}
                  <SearchRow food={food} onAdd={() => handleSelect(food)} />
                </View>
              ))}
              <View style={styles.attribution}>
                <Text style={[styles.attributionText, { color: colors.tabIconDefault }]}>
                  Daten: Open Food Facts · openfoodfacts.org · ODbL
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      )}

      {/* ── Items list ───────────────────────────────────────────── */}
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: spacing.PADDING_HORIZONTAL },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {pendingItems.length === 0 ? (
          <View>
            {recentFoods.length > 0 && !showDropdown && query.length < 2 ? (
              <>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>
                  Zuletzt verwendet
                </Text>
                {recentFoods.map((food, i) => (
                  <View key={`recent-${food.barcode || food.name}-${i}`}>
                    {i > 0 && <View style={[styles.recentDivider, { backgroundColor: colors.card }]} />}
                    <Pressable
                      onPress={() => handleSelect(food)}
                      style={({ pressed }) => [
                        styles.recentRow,
                        { backgroundColor: pressed ? colors.primary + '10' : colors.card },
                        i === 0 && styles.recentRowFirst,
                        i === recentFoods.length - 1 && styles.recentRowLast,
                      ]}
                    >
                      {food.imageUrl ? (
                        <Image source={{ uri: food.imageUrl }} style={styles.recentImg} />
                      ) : (
                        <View style={[styles.recentImgPlaceholder, { backgroundColor: colors.background }]}>
                          <Ionicons name="fast-food-outline" size={18} color={colors.tabIconDefault} />
                        </View>
                      )}
                      <View style={styles.recentMid}>
                        <Text style={[styles.recentName, { color: colors.text }]} numberOfLines={1}>
                          {food.name}
                        </Text>
                        <Text style={[styles.recentMacros, { color: colors.tabIconDefault }]}>
                          {food.calories} kcal · P {food.protein}g · K {food.carbs}g · F {food.fat}g
                          {food.brand ? `  ·  ${food.brand}` : ''}
                        </Text>
                      </View>
                      <View style={styles.recentRight}>
                        <Text style={[styles.recentLastAmount, { color: colors.tabIconDefault }]}>
                          zul. {food.lastAmount}g
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color={colors.tabIconDefault} />
                      </View>
                    </Pressable>
                  </View>
                ))}
              </>
            ) : query.length < 2 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🥦</Text>
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Lebensmittel suchen oder scannen
                </Text>
                <Text style={[styles.emptySub, { color: colors.tabIconDefault }]}>
                  Nutze die Suchleiste oben oder scanne{'\n'}den Barcode eines Produkts.
                </Text>
              </View>
            ) : null}
          </View>
        ) : (
          <>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              {pendingItems.length} Einträge
            </Text>

            {pendingItems.map((item) => (
              <PendingCard
                key={item.key}
                item={item}
                onChange={handleAmountChange}
                onRemove={handleRemove}
              />
            ))}

            {/* Totals */}
            <View style={[styles.totalsCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.totalsTitle, { color: colors.tabIconDefault }]}>Gesamt</Text>
              <View style={styles.totalsRow}>
                {[
                  { label: 'kcal', val: Math.round(totals.calories), color: colors.text },
                  { label: 'Protein', val: Math.round(totals.protein * 10) / 10, color: '#3b82f6' },
                  { label: 'Kohlenhydr.', val: Math.round(totals.carbs * 10) / 10, color: '#f59e0b' },
                  { label: 'Fett', val: Math.round(totals.fat * 10) / 10, color: '#ec4899' },
                ].map((t, i, arr) => (
                  <React.Fragment key={t.label}>
                    <View style={styles.totalItem}>
                      <Text style={[styles.totalVal, { color: t.color }]}>{t.val}</Text>
                      <Text style={[styles.totalLabel, { color: colors.tabIconDefault }]}>{t.label}</Text>
                    </View>
                    {i < arr.length - 1 && (
                      <View style={[styles.totalDivider, { backgroundColor: colors.background }]} />
                    )}
                  </React.Fragment>
                ))}
              </View>
            </View>
          </>
        )}
        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ── Footer ───────────────────────────────────────────────── */}
      {pendingItems.length > 0 && (
        <View
          style={[
            styles.footer,
            {
              paddingHorizontal: spacing.PADDING_HORIZONTAL,
              paddingBottom: spacing.BOTTOM_INSET > 0 ? spacing.BOTTOM_INSET + 8 : 24,
              backgroundColor: colors.background,
              borderTopColor: colors.card,
            },
          ]}
        >
          <CustomButton
            title={`${pendingItems.length} Eintrag${pendingItems.length > 1 ? 'einträge' : ''} speichern`}
            onPress={handleSave}
            loading={saving}
          />
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingBottom: 12,
    borderBottomWidth: 1, gap: 8,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  scanBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: 4 },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  mealPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
  },
  mealPillEmoji: { fontSize: 13 },
  mealPillText: { fontSize: 12, fontWeight: '700' },
  searchWrap: { paddingTop: 12, paddingBottom: 6 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12, borderRadius: 14,
  },
  searchInput: { flex: 1, fontSize: 15 },
  dropdown: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    marginTop: 2,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 14,
  },
  dropMsg: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  dropMsgText: { fontSize: 13, fontWeight: '500', flex: 1 },
  rowDivider: { height: 1, marginHorizontal: 14 },
  attribution: { padding: 10, alignItems: 'center' },
  attributionText: { fontSize: 10 },
  listScroll: { flex: 1 },
  listContent: { paddingTop: 16 },
  empty: { alignItems: 'center', paddingTop: 56, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 21 },
  sectionLabel: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  totalsCard: { borderRadius: 16, padding: 16, marginTop: 4 },
  totalsTitle: { fontSize: 11, fontWeight: '600', marginBottom: 10 },
  totalsRow: { flexDirection: 'row', alignItems: 'center' },
  totalItem: { flex: 1, alignItems: 'center' },
  totalVal: { fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  totalLabel: { fontSize: 10, fontWeight: '500', marginTop: 2 },
  totalDivider: { width: 1, height: 30, marginHorizontal: 2 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingTop: 12, borderTopWidth: 1,
  },
  recentDivider: { height: 1 },
  recentRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  recentRowFirst: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  recentRowLast: { borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
  recentImg: { width: 40, height: 40, borderRadius: 8 },
  recentImgPlaceholder: {
    width: 40, height: 40, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  recentMid: { flex: 1 },
  recentName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  recentMacros: { fontSize: 11, fontWeight: '500' },
  recentRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recentLastAmount: { fontSize: 11, fontWeight: '500' },
});

const amountStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    paddingBottom: 36,
    gap: 16,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 4,
  },
  productRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
  },
  productImg: { width: 52, height: 52, borderRadius: 12 },
  productImgPlaceholder: {
    width: 52, height: 52, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  productName: { fontSize: 15, fontWeight: '700', lineHeight: 20, marginBottom: 2 },
  productBrand: { fontSize: 12, marginBottom: 3 },
  per100: { fontSize: 11, lineHeight: 16 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: -8 },
  presetsRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  presetBtn: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20,
  },
  presetText: { fontSize: 14, fontWeight: '700' },
  customRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, gap: 8,
  },
  customInput: {
    flex: 1, fontSize: 28, fontWeight: '800', letterSpacing: -1,
  },
  customUnit: { fontSize: 18, fontWeight: '600' },
  preview: {
    flexDirection: 'row', borderRadius: 14, padding: 14,
  },
  previewItem: { flex: 1, alignItems: 'center' },
  previewVal: { fontSize: 16, fontWeight: '800', letterSpacing: -0.5 },
  previewLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: 16,
  },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
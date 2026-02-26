import { useEffect, useRef, useState } from 'react';

export interface FoodSearchResult {
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  // per 100g
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  nutriscore?: string;
}

const OFF_BASE = 'https://world.openfoodfacts.org';
const USER_AGENT = 'FitPro/1.0 (fitpro@example.com)';

// ─── Nutriment extractor ──────────────────────────────────────────────────────
// OFF stores values per 100g with keys like "energy-kcal_100g", "proteins_100g"
// It sometimes uses "energy_100g" in kJ instead — we handle both.
function extractNutriments(n: any): Pick<FoodSearchResult, 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber' | 'sugar'> {
  if (!n) return { calories: 0, protein: 0, carbs: 0, fat: 0 };

  // Calories: prefer kcal field, fall back to kJ ÷ 4.184
  let calories = Number(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0);
  if (!calories) {
    const kj = Number(n['energy_100g'] ?? n['energy'] ?? 0);
    calories = kj > 0 ? Math.round(kj / 4.184) : 0;
  }

  return {
    calories: Math.round(calories),
    protein: Math.round((Number(n['proteins_100g'] ?? n['proteins'] ?? 0)) * 10) / 10,
    carbs: Math.round((Number(n['carbohydrates_100g'] ?? n['carbohydrates'] ?? 0)) * 10) / 10,
    fat: Math.round((Number(n['fat_100g'] ?? n['fat'] ?? 0)) * 10) / 10,
    fiber: Math.round((Number(n['fiber_100g'] ?? n['fiber'] ?? 0)) * 10) / 10,
    sugar: Math.round((Number(n['sugars_100g'] ?? n['sugars'] ?? 0)) * 10) / 10,
  };
}

function mapProduct(p: any): FoodSearchResult | null {
  if (!p) return null;

  // Prefer German name, fall back through multiple fields
  const name = (
    p.product_name_de ||
    p.product_name ||
    p.generic_name_de ||
    p.generic_name ||
    p.abbreviated_product_name ||
    ''
  ).trim();

  if (!name) return null;

  // nutriments can be nested differently — try multiple paths
  const nutriments = p.nutriments ?? p.nutrient_levels ?? {};
  const macros = extractNutriments(nutriments);

  // Only filter out if we have truly zero data across ALL macros
  const hasAnyData = macros.calories > 0 || macros.protein > 0 ||
    macros.carbs > 0 || macros.fat > 0;
  if (!hasAnyData) return null;

  return {
    barcode: (p.code ?? p._id ?? p.id ?? '').toString(),
    name,
    brand: p.brands?.split(',')[0]?.trim() || undefined,
    imageUrl: p.image_front_small_url ?? p.image_small_url ?? p.image_url,
    nutriscore: p.nutrition_grades ?? p.nutriscore_grade ?? p.nutriscore ?? undefined,
    ...macros,
  };
}

// ─── Text search ──────────────────────────────────────────────────────────────
export async function searchFoodByName(query: string): Promise<FoodSearchResult[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    search_terms: query.trim(),
    search_simple: '1',
    action: 'process',
    json: '1',
    lc: 'de',
    cc: 'de',
    page_size: '24',
    sort_by: 'unique_scans_n',  // Sort by popularity — more relevant results
    fields: [
      'code', '_id',
      'product_name', 'product_name_de',
      'generic_name', 'generic_name_de',
      'abbreviated_product_name',
      'brands',
      'nutriments',
      'nutrition_grades', 'nutriscore_grade',
      'image_front_small_url', 'image_small_url',
    ].join(','),
  });

  const res = await fetch(`${OFF_BASE}/cgi/search.pl?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!res.ok) throw new Error(`OpenFoodFacts Fehler: ${res.status}`);
  const data = await res.json();

  return (data.products ?? [])
    .map(mapProduct)
    .filter((p: FoodSearchResult | null): p is FoodSearchResult => p !== null);
}

// ─── Barcode lookup ───────────────────────────────────────────────────────────
export async function lookupBarcode(barcode: string): Promise<FoodSearchResult | null> {
  const fields = [
    'code', 'product_name', 'product_name_de',
    'generic_name', 'generic_name_de',
    'brands', 'nutriments', 'nutrition_grades',
    'image_front_small_url',
  ].join(',');

  const res = await fetch(
    `${OFF_BASE}/api/v2/product/${barcode}.json?fields=${fields}&lc=de`,
    { headers: { 'User-Agent': USER_AGENT } }
  );

  if (!res.ok) throw new Error(`OpenFoodFacts Fehler: ${res.status}`);
  const data = await res.json();

  if (data.status !== 1 || !data.product) return null;
  return mapProduct({ ...data.product, code: barcode });
}

// ─── Search hook with debounce ────────────────────────────────────────────────
interface UseFoodSearchResult {
  results: FoodSearchResult[];
  loading: boolean;
  error: string | null;
}

export function useFoodSearch(query: string, debounceMs = 350): UseFoodSearchResult {
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    // Require at least 2 chars to avoid hammering API on every keystroke
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    timerRef.current = setTimeout(async () => {
      try {
        const foods = await searchFoodByName(query);
        setResults(foods);
      } catch (err: any) {
        setError(err.message ?? 'Suche fehlgeschlagen');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  return { results, loading, error };
}
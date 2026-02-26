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

const USER_AGENT = 'FitPro/1.0 (fitpro@example.com)';

// ─── Nutriment extractor ──────────────────────────────────────────────────────
function round1(v: any) { return Math.round(Number(v ?? 0) * 10) / 10; }

function extractNutriments(n: any) {
  if (!n || typeof n !== 'object') return null;

  let calories = Number(n['energy-kcal_100g'] ?? n['energy-kcal'] ?? 0);
  if (!calories) {
    const kj = Number(n['energy_100g'] ?? n['energy'] ?? 0);
    if (kj > 0) calories = kj / 4.184;
  }

  const protein = round1(n['proteins_100g'] ?? n['proteins'] ?? 0);
  const carbs = round1(n['carbohydrates_100g'] ?? n['carbohydrates'] ?? 0);
  const fat = round1(n['fat_100g'] ?? n['fat'] ?? 0);

  // Require at least calories OR two macros to be non-zero
  if (Math.round(calories) === 0 && protein === 0 && carbs === 0 && fat === 0) return null;

  return {
    calories: Math.round(calories),
    protein,
    carbs,
    fat,
    fiber: round1(n['fiber_100g'] ?? n['fiber'] ?? n['fibers_100g'] ?? 0),
    sugar: round1(n['sugars_100g'] ?? n['sugars'] ?? 0),
  };
}

// ─── Map raw OFF product → FoodSearchResult ───────────────────────────────────
function mapProduct(p: any): FoodSearchResult | null {
  if (!p || typeof p !== 'object') return null;

  const name = (
    p.product_name_de ||
    p.product_name ||
    p.generic_name_de ||
    p.generic_name ||
    ''
  ).trim();
  if (!name) return null;

  const macros = extractNutriments(p.nutriments);
  if (!macros) return null;  // no usable nutrient data

  return {
    barcode: String(p.code ?? p._id ?? p.id ?? ''),
    name,
    brand: Array.isArray(p.brands)
      ? p.brands[0]
      : p.brands?.split(',')[0]?.trim() || undefined,
    imageUrl: p.image_front_small_url ?? p.image_small_url ?? p.image_url ?? undefined,
    nutriscore: p.nutrition_grades !== 'unknown' ? (p.nutrition_grades ?? p.nutriscore_grade) : undefined,
    ...macros,
  };
}

// ─── Search-a-licious only (v1 cgi/search times out — do not use) ─────────────
// Debug confirmed: Search-a-licious responds in ~130ms, v1 times out at 60s.
export async function searchFoodByName(query: string): Promise<FoodSearchResult[]> {
  if (query.trim().length < 2) return [];

  // Search-a-licious does NOT support the `fields` filter properly for nutriments —
  // debug showed products[0] had no nutriments when fields param was passed.
  // Fetch without fields restriction so all data comes through, then map client-side.
  const url =
    `https://search.openfoodfacts.org/search` +
    `?q=${encodeURIComponent(query.trim())}` +
    `&page_size=24` +
    `&sort_by=unique_scans_n`;

  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`Search error: ${res.status}`);
  const data = await res.json();

  // Search-a-licious returns { hits: [...products] }
  const hits: any[] = data.hits ?? [];

  const results = hits
    .map(mapProduct)
    .filter((p): p is FoodSearchResult => p !== null);

  return results;
}

// ─── Barcode lookup ───────────────────────────────────────────────────────────
// Uses v2 product endpoint — confirmed working in debug (470ms, full nutriments)
export async function lookupBarcode(barcode: string): Promise<FoodSearchResult | null> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?lc=de`,
    {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(8000),
    }
  );

  if (!res.ok) throw new Error(`Barcode error: ${res.status}`);
  const data = await res.json();

  // v2 returns { status: 1, product: {...} }  — NOT products array
  if (data.status !== 1 || !data.product) return null;
  return mapProduct({ ...data.product, code: barcode });
}

// ─── React hook ───────────────────────────────────────────────────────────────
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

    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    timerRef.current = setTimeout(async () => {
      try {
        const foods = await searchFoodByName(query);
        setResults(foods);
        if (foods.length === 0) setError(`Nichts gefunden für "${query}"`);
      } catch (err: any) {
        setError('Suche fehlgeschlagen. Internetverbindung prüfen.');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  return { results, loading, error };
}
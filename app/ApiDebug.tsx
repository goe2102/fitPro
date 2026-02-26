/**
 * DEBUG SCREEN — paste this temporarily into any screen to test the API.
 * Navigate to it, tap "Test Search" and "Test Elastic" and check what comes back.
 * DELETE after debugging.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';

export default function FoodApiDebug() {
  const [log, setLog] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg: string) => {
    console.log(msg); // <-- Prints to your terminal
    setLog((prev) => [...prev, msg]); // <-- Prints to the screen
  };

  const clearLog = () => {
    console.log('\n--- LOG CLEARED ---\n');
    setLog([]);
  };

  const testEndpoint = async (label: string, url: string) => {
    addLog(`\n▶ ${label}`);
    addLog(`URL: ${url}`);
    try {
      const start = Date.now();
      const res = await fetch(url, {
        headers: { 'User-Agent': 'FitPro/1.0 (debug)' },
      });
      addLog(`Status: ${res.status} (${Date.now() - start}ms)`);

      const text = await res.text();
      addLog(`Raw (first 500 chars): ${text.slice(0, 500)}`);

      try {
        const json = JSON.parse(text);
        // Try to find products array wherever it is
        const products =
          json.products ??
          json.hits?.hits?.map((h: any) => h._source ?? h) ??
          json.hits ??
          [];
        addLog(`Products found: ${products.length}`);

        if (products.length > 0) {
          const p = products[0];
          addLog(`First product name: ${p.product_name ?? p.product_name_de ?? 'N/A'}`);
          addLog(`Nutriments keys: ${Object.keys(p.nutriments ?? {}).slice(0, 8).join(', ')}`);
          addLog(`energy-kcal_100g: ${p.nutriments?.['energy-kcal_100g'] ?? 'MISSING'}`);
          addLog(`energy_100g (kJ): ${p.nutriments?.['energy_100g'] ?? 'MISSING'}`);
          addLog(`proteins_100g: ${p.nutriments?.['proteins_100g'] ?? 'MISSING'}`);
          addLog(`carbohydrates_100g: ${p.nutriments?.['carbohydrates_100g'] ?? 'MISSING'}`);
          addLog(`fat_100g: ${p.nutriments?.['fat_100g'] ?? 'MISSING'}`);
        }
      } catch {
        addLog('⚠ Could not parse as JSON');
      }
    } catch (err: any) {
      addLog(`❌ FETCH ERROR: ${err.message}`);
    }
  };

  const runTests = async () => {
    setLoading(true);
    clearLog();

    // Test 1: Search-a-licious Elasticsearch
    await testEndpoint(
      'Search-a-licious (Elastic)',
      'https://search.openfoodfacts.org/search?q=banana&page_size=3&fields=code,product_name,product_name_de,brands,nutriments,nutrition_grades'
    );

    // Test 2: OFF v1 cgi search
    await testEndpoint(
      'OFF v1 cgi/search',
      'https://world.openfoodfacts.org/cgi/search.pl?search_terms=banana&search_simple=1&action=process&json=1&lc=de&page_size=3&fields=code,product_name,product_name_de,brands,nutriments'
    );

    // Test 3: Barcode lookup (Nutella)
    await testEndpoint(
      'Barcode lookup (Nutella 3017620422003)',
      'https://world.openfoodfacts.org/api/v2/product/3017620422003.json?fields=code,product_name,product_name_de,brands,nutriments&lc=de'
    );

    setLoading(false);
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.title}>🔍 Food API Debug</Text>
        <Pressable onPress={runTests} style={s.btn} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Run Tests</Text>
          }
        </Pressable>
        <Pressable onPress={clearLog} style={[s.btn, { backgroundColor: '#666' }]}>
          <Text style={s.btnText}>Clear</Text>
        </Pressable>
      </View>
      <ScrollView style={s.scroll} contentContainerStyle={{ padding: 12 }}>
        {log.length === 0
          ? <Text style={s.hint}>Tap "Run Tests" to diagnose the API responses on this device.</Text>
          : log.map((line, i) => (
            <Text key={i} style={[
              s.line,
              line.startsWith('❌') && { color: '#ef4444' },
              line.startsWith('▶') && { color: '#60a5fa', fontWeight: '700', marginTop: 8 },
              line.startsWith('URL') && { color: '#9ca3af' },
            ]}>
              {line}
            </Text>
          ))
        }
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10, paddingTop: 60 },
  title: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '700' },
  btn: { backgroundColor: '#3b82f6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
  scroll: { flex: 1 },
  line: { color: '#e5e7eb', fontSize: 11, fontFamily: 'monospace', lineHeight: 18 },
  hint: { color: '#6b7280', textAlign: 'center', marginTop: 40 },
});
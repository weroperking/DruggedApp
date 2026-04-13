import { Platform } from 'react-native';
import { copyAsync, documentDirectory } from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';
import WEB_FALLBACK from '../assets/drugs_web_fallback.json';

export interface Drug {
  id: number;
  trade_name: string;
  active_ingredient: string;
  price: number;
  price_old: number | null;
  manufacturer: string | null;
  distributor: string | null;
  category: string | null;
  subcategory: string | null;
  subcategory2: string | null;
  route: string | null;
  search_index: string | null;
}

const WEB_SAMPLE: Drug[] = WEB_FALLBACK as Drug[];

// Native SQLite

const DB_NAME = 'drugged.db';
let db: SQLite.SQLiteDatabase | null = null;

async function copyDatabaseIfNeeded(): Promise<void> {
  const destPath = documentDirectory + DB_NAME;
  console.log('[DB] Destination path:', destPath);

  const destInfo = await import('expo-file-system/legacy').then(fs => fs.getInfoAsync(destPath));
  console.log('[DB] Destination exists:', destInfo.exists);
  if (destInfo.exists) return;

  console.log('[DB] Loading asset...');
  const asset = Asset.fromModule(require('../assets/drugged.db'));
  await asset.downloadAsync();

  if (!asset.localUri) throw new Error('Failed to load drugged.db asset');
  console.log('[DB] Asset localUri:', asset.localUri);

  await copyAsync({
    from: asset.localUri,
    to: destPath,
  });
  console.log('[DB] Database copied successfully');
}

async function getNativeDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    console.log('[DB] Returning cached database instance');
    return db;
  }
  console.log('[DB] Getting database, copying if needed...');
  await copyDatabaseIfNeeded();
  const dbPath = documentDirectory + DB_NAME;
  console.log('[DB] Opening database at:', dbPath);
  const absPath = dbPath.startsWith('file://') ? dbPath.slice(7) : dbPath;
  console.log('[DB] Absolute path:', absPath);
  db = await SQLite.openDatabaseAsync(absPath);
  console.log('[DB] Database opened successfully');
  return db;
}

// Public API

export async function initDatabase(): Promise<void> {
  if (Platform.OS === 'web') return;
  await getNativeDb();
}

export async function searchDrugs(query: string): Promise<Drug[]> {
  const q = query.trim();
  if (!q) return [];

  // DEBUG: Log platform and query
  console.log('[DEBUG] Platform.OS:', Platform.OS);
  console.log('[DEBUG] Query:', q);
  console.log('[DEBUG] WEB_SAMPLE length:', WEB_SAMPLE.length);

  if (Platform.OS === 'web') {
    const lower = q.toLowerCase();
    const results = WEB_SAMPLE.filter(d =>
      d.trade_name?.toLowerCase().includes(lower) ||
      d.active_ingredient?.toLowerCase().includes(lower)
    );
    console.log('[DEBUG] Web results:', results.length);
    return results;
  }

  const db = await getNativeDb();
  console.log('[DB] Database opened, executing search...');
  const pattern = `%${q}%`;
  console.log('[DB] Search pattern:', pattern);

  const results = await db.getAllAsync<Drug>(
    `SELECT * FROM drugs
     WHERE trade_name LIKE ?
        OR active_ingredient LIKE ?
        OR search_index LIKE ?
     ORDER BY
       CASE WHEN trade_name LIKE ? THEN 0 ELSE 1 END,
       trade_name
     LIMIT 50`,
    [pattern, pattern, pattern, `${q}%`]
  );
  console.log('[DB] Search results count:', results.length);
  return results;
}

export async function getDrugById(id: number): Promise<Drug | null> {
  if (Platform.OS === 'web') {
    return WEB_SAMPLE.find(d => d.id === id) ?? null;
  }
  const db = await getNativeDb();
  return db.getFirstAsync<Drug>('SELECT * FROM drugs WHERE id = ?', [id]);
}

export async function getDrugsByActiveIngredient(ingredient: string): Promise<Drug[]> {
  if (Platform.OS === 'web') {
    return WEB_SAMPLE
      .filter(d => d.active_ingredient?.toLowerCase() === ingredient.toLowerCase())
      .sort((a, b) => a.price - b.price);
  }
  const db = await getNativeDb();
  return db.getAllAsync<Drug>(
    'SELECT * FROM drugs WHERE active_ingredient = ? ORDER BY price ASC',
    [ingredient]
  );
}

export async function getAlternativeDrugs(drugId: number): Promise<Drug[]> {
  if (Platform.OS === 'web') {
    const drug = WEB_SAMPLE.find(d => d.id === drugId);
    if (!drug) return [];
    return WEB_SAMPLE
      .filter(d => d.active_ingredient === drug.active_ingredient && d.id !== drugId)
      .sort((a, b) => a.price - b.price);
  }
  const db = await getNativeDb();
  const source = await db.getFirstAsync<{ active_ingredient: string }>(
    'SELECT active_ingredient FROM drugs WHERE id = ?', [drugId]
  );
  if (!source?.active_ingredient) return [];

  return db.getAllAsync<Drug>(
    `SELECT * FROM drugs
     WHERE active_ingredient = ? AND id != ?
     ORDER BY price ASC`,
    [source.active_ingredient, drugId]
  );
}

export async function getDrugsByCategory(category: string, limit = 50): Promise<Drug[]> {
  if (Platform.OS === 'web') {
    return WEB_SAMPLE.filter(d => d.category === category).slice(0, limit);
  }
  const db = await getNativeDb();
  return db.getAllAsync<Drug>(
    'SELECT * FROM drugs WHERE category = ? ORDER BY trade_name LIMIT ?',
    [category, limit]
  );
}

export async function getCategories(): Promise<{ category: string; count: number }[]> {
  if (Platform.OS === 'web') {
    return [{ category: 'ANALGESIC', count: 1 }, { category: 'NSAID', count: 2 }];
  }
  const db = await getNativeDb();
  return db.getAllAsync<{ category: string; count: number }>(
    `SELECT category, COUNT(*) as count FROM drugs
     WHERE category IS NOT NULL
     GROUP BY category
     ORDER BY count DESC`
  );
}

export async function getPriceDrops(limit = 20): Promise<Drug[]> {
  if (Platform.OS === 'web') {
    return WEB_SAMPLE
      .filter(d => d.price_old && d.price_old > d.price)
      .sort((a, b) => (b.price_old! - b.price) - (a.price_old! - a.price))
      .slice(0, limit);
  }
  const db = await getNativeDb();
  return db.getAllAsync<Drug>(
    `SELECT * FROM drugs
     WHERE price_old IS NOT NULL AND price_old > price
     ORDER BY (price_old - price) DESC
     LIMIT ?`,
    [limit]
  );
}

export async function getDrugCount(): Promise<number> {
  if (Platform.OS === 'web') return WEB_SAMPLE.length;
  const db = await getNativeDb();
  const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM drugs');
  return result?.count ?? 0;
}
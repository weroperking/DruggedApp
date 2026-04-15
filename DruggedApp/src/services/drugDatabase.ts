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

export type SearchField =
  | 'all'
  | 'trade_name'
  | 'active_ingredient'
  | 'category'
  | 'subcategory'
  | 'manufacturer'
  | 'distributor'
  | 'route';

const WEB_SAMPLE: Drug[] = WEB_FALLBACK as Drug[];

// Native SQLite

const DB_NAME = 'drugged.db';
let db: SQLite.SQLiteDatabase | null = null;

async function copyDatabaseIfNeeded(): Promise<void> {
  try {
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
  } catch (error) {
    console.error('[DB] Error copying database:', error);
    throw error;
  }
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

export async function searchDrugs(
  query: string,
  field: SearchField = 'all'
): Promise<Drug[]> {
  const q = query.trim();
  if (!q) return [];

  console.log('[DEBUG] Platform.OS:', Platform.OS, '| field:', field, '| query:', q);

  try {
    const db = await getNativeDb();
    const pattern = `%${q}%`;
    const startPattern = `${q}%`;

    let querySQL: string;
    let params: string[];

    if (field === 'all') {
      querySQL = `
        SELECT * FROM drugs
        WHERE trade_name LIKE ? COLLATE NOCASE
           OR active_ingredient LIKE ? COLLATE NOCASE
           OR category LIKE ? COLLATE NOCASE
           OR manufacturer LIKE ? COLLATE NOCASE
           OR search_index LIKE ? COLLATE NOCASE
        ORDER BY
          CASE WHEN trade_name LIKE ? THEN 0
               WHEN active_ingredient LIKE ? THEN 1
               ELSE 2 END,
          trade_name
        LIMIT 50
      `;
      params = [pattern, pattern, pattern, pattern, pattern, startPattern, startPattern];
    } else {
      querySQL = `
        SELECT * FROM drugs
        WHERE ${field} LIKE ? COLLATE NOCASE
        ORDER BY
          CASE WHEN ${field} LIKE ? THEN 0 ELSE 1 END,
          trade_name
        LIMIT 50
      `;
      params = [pattern, startPattern];
    }

    console.log('[DB] Executing query');
    
    const nativeResults = await db.getAllAsync<Drug>(querySQL, params);
    console.log('[DB] Native results:', nativeResults.length);
    
    if (nativeResults.length > 0) {
      return nativeResults;
    }

    const lower = q.toLowerCase();
    const webResults = WEB_SAMPLE.filter(d => {
      switch (field) {
        case 'trade_name':
          return d.trade_name?.toLowerCase().includes(lower);
        case 'active_ingredient':
          return d.active_ingredient?.toLowerCase().includes(lower);
        case 'category':
          return d.category?.toLowerCase().includes(lower);
        case 'subcategory':
          return d.subcategory?.toLowerCase().includes(lower);
        case 'manufacturer':
          return d.manufacturer?.toLowerCase().includes(lower);
        case 'distributor':
          return d.distributor?.toLowerCase().includes(lower);
        default:
          return (
            d.trade_name?.toLowerCase().includes(lower) ||
            d.active_ingredient?.toLowerCase().includes(lower)
          );
      }
    });
    console.log('[DEBUG] Web fallback results:', webResults.length);
    return webResults.slice(0, 50);
  } catch (error) {
    console.error('[DB] Search error, using web fallback:', error);
    
    const lower = q.toLowerCase();
    const webResults = WEB_SAMPLE.filter(d => {
      switch (field) {
        case 'trade_name':
          return d.trade_name?.toLowerCase().includes(lower);
        case 'active_ingredient':
          return d.active_ingredient?.toLowerCase().includes(lower);
        case 'category':
          return d.category?.toLowerCase().includes(lower);
        default:
          return (
            d.trade_name?.toLowerCase().includes(lower) ||
            d.active_ingredient?.toLowerCase().includes(lower)
          );
      }
    });
    return webResults.slice(0, 50);
  }
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
  try {
    const db = await getNativeDb();
    const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM drugs');
    console.log('[DB] Drug count:', result?.count);
    return result?.count ?? 0;
  } catch (error) {
    console.error('[DB] getDrugCount error:', error);
    return 0;
  }
}
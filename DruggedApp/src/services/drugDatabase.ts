import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
const { documentDirectory, getInfoAsync, copyAsync, writeAsStringAsync, readAsStringAsync } = FileSystem;
import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';

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

const DB_NAME = 'drugged.db';
const DB_VERSION = 1; // Increment this when updating the database asset
let db: SQLite.SQLiteDatabase | null = null;

const dbAsset = require('../assets/drugged.db');

async function loadAssetAsUint8Array(): Promise<Uint8Array> {
  const asset = Asset.fromModule(dbAsset);
  await asset.downloadAsync();
  if (!asset.localUri) {
    throw new Error('Failed to download drugged.db asset');
  }
  const response = await fetch(asset.localUri);
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

async function getNativeDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db;
  }

  console.log('[DB] Opening database on:', Platform.OS);

  if (Platform.OS === 'web') {
    const serializedData = await loadAssetAsUint8Array();
    db = await SQLite.deserializeDatabaseAsync(serializedData);
    console.log('[DB] Web database opened with serialized data');
    return db;
  }

  if (!documentDirectory) {
    throw new Error('documentDirectory is null');
  }

  const destPath = documentDirectory + '/' + DB_NAME;
  const versionPath = documentDirectory + '/' + DB_NAME + '.version';
  
  const [destInfo, versionInfo] = await Promise.all([
    getInfoAsync(destPath),
    getInfoAsync(versionPath)
  ]);
  
  let existingVersion = 0;
  if (versionInfo.exists) {
    try {
      const versionContent = await readAsStringAsync(versionPath);
      existingVersion = parseInt(versionContent, 10);
      if (Number.isNaN(existingVersion)) {
        existingVersion = 0;
      }
    } catch {}
  }
  
  if (!destInfo.exists || existingVersion < DB_VERSION) {
    const asset = Asset.fromModule(dbAsset);
    await asset.downloadAsync();
    if (!asset.localUri) throw new Error('Failed to load drugged.db asset');
    await copyAsync({ from: asset.localUri, to: destPath });
    await writeAsStringAsync(versionPath, DB_VERSION.toString());
  }
  
  db = await SQLite.openDatabaseAsync(destPath);
  console.log('[DB] Native database opened successfully');
  return db;
}

export async function initDatabase(): Promise<void> {
  const database = await getNativeDb();
  
  try {
    // Create FTS5 virtual table for full-text search if it doesn't exist
    await database.execAsync(`
      CREATE VIRTUAL TABLE IF NOT EXISTS drugs_fts USING fts5(
        trade_name,
        active_ingredient,
        category,
        subcategory,
        manufacturer,
        distributor,
        route,
        search_index,
        content='drugs',
        content_rowid='id',
        tokenize='unicode61 remove_diacritics 2'
      );
    `);

    // Rebuild/sync the FTS5 index using the documented rebuild command
    await database.execAsync(`
      INSERT INTO drugs_fts(drugs_fts) VALUES('rebuild');
    `);
    
    // Create triggers to automatically keep FTS index in sync
    await database.execAsync(`
      CREATE TRIGGER IF NOT EXISTS drugs_fts_insert AFTER INSERT ON drugs BEGIN
        INSERT INTO drugs_fts(rowid, trade_name, active_ingredient, category, subcategory,
                             manufacturer, distributor, route, search_index)
        VALUES (new.id, new.trade_name, new.active_ingredient, new.category, new.subcategory,
                new.manufacturer, new.distributor, new.route, new.search_index);
      END;

      CREATE TRIGGER IF NOT EXISTS drugs_fts_update AFTER UPDATE ON drugs BEGIN
        UPDATE drugs_fts SET
          trade_name = new.trade_name,
          active_ingredient = new.active_ingredient,
          category = new.category,
          subcategory = new.subcategory,
          manufacturer = new.manufacturer,
          distributor = new.distributor,
          route = new.route,
          search_index = new.search_index
        WHERE rowid = new.id;
      END;

      CREATE TRIGGER IF NOT EXISTS drugs_fts_delete AFTER DELETE ON drugs BEGIN
        DELETE FROM drugs_fts WHERE rowid = old.id;
      END;
    `);
    
    console.log('[DB] FTS5 initialized successfully');
  } catch (error) {
    console.warn('[DB] FTS5 not available, falling back to standard search:', error);
    // FTS5 not available - continue without it, search function will use LIKE fallback
  }
}

export async function searchDrugs(
  query: string,
  field: SearchField = 'all'
): Promise<Drug[]> {
  const q = query.trim();
  if (!q) return [];

  console.log('[DEBUG] Platform.OS:', Platform.OS, '| field:', field, '| query:', q);

  const database = await getNativeDb();
  
  // Check if FTS5 table exists first
  let ftsAvailable = false;
  try {
    const ftsCheck = await database.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='drugs_fts'"
    );
    ftsAvailable = !!ftsCheck;
  } catch (e) {
    ftsAvailable = false;
  }

  if (ftsAvailable) {
    // Escape FTS special characters and prepare search term
    const ftsTerm = q.replace(/[*+'"():]/g, ' ').trim().replace(/\s+/g, '* ') + '*';
    
    let querySQL: string;
    let params: string[];

    try {
      if (field === 'all') {
        querySQL = `
          SELECT d.* FROM drugs d
          JOIN drugs_fts fts ON d.id = fts.rowid
          WHERE drugs_fts MATCH ?
          ORDER BY bm25(drugs_fts, 1, 2, 4, 3, 5, 6, 7, 8), trade_name
          LIMIT 50
        `;
        params = [ftsTerm];
      } else {
        querySQL = `
          SELECT d.* FROM drugs d
          JOIN drugs_fts fts ON d.id = fts.rowid
          WHERE ${field} MATCH ?
          ORDER BY bm25(drugs_fts), trade_name
          LIMIT 50
        `;
        params = [ftsTerm];
      }

      console.log('[DB] Executing FTS5 query');
      const results = await database.getAllAsync<Drug>(querySQL, params);
      console.log('[DB] FTS Results:', results.length);
      
      return results;
    } catch (error) {
      console.warn('[DB] FTS5 query failed, falling back to LIKE search:', error);
    }
  }
  
  // Fallback to original LIKE queries for backwards compatibility
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

  console.log('[DB] Executing fallback LIKE query');
  const results = await database.getAllAsync<Drug>(querySQL, params);
  console.log('[DB] LIKE Results:', results.length);
  
  return results;
}

export async function getDrugById(id: number): Promise<Drug | null> {
  const db = await getNativeDb();
  return db.getFirstAsync<Drug>('SELECT * FROM drugs WHERE id = ?', [id]);
}

export async function getDrugsByActiveIngredient(ingredient: string): Promise<Drug[]> {
  const db = await getNativeDb();
  return db.getAllAsync<Drug>(
    'SELECT * FROM drugs WHERE active_ingredient = ? ORDER BY price ASC',
    [ingredient]
  );
}

export async function getAlternativeDrugs(drugId: number): Promise<Drug[]> {
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
  const db = await getNativeDb();
  return db.getAllAsync<Drug>(
    'SELECT * FROM drugs WHERE category = ? ORDER BY trade_name LIMIT ?',
    [category, limit]
  );
}

export async function getCategories(): Promise<{ category: string; count: number }[]> {
  const db = await getNativeDb();
  return db.getAllAsync<{ category: string; count: number }>(
    `SELECT category, COUNT(*) as count FROM drugs
     WHERE category IS NOT NULL
     GROUP BY category
     ORDER BY count DESC`
  );
}

export async function getPriceDrops(limit = 20): Promise<Drug[]> {
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
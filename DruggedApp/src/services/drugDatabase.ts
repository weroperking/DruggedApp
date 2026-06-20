import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
const { documentDirectory, getInfoAsync, copyAsync, writeAsStringAsync, readAsStringAsync } = FileSystem;
import * as SQLite from 'expo-sqlite';
import { Asset } from 'expo-asset';
import WEB_SAMPLE from '../assets/drugs_web_fallback.json';

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

// Track if we're using web fallback mode
let webFallbackMode = false;

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
let dbInitPromise: Promise<SQLite.SQLiteDatabase> | null = null;

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
  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = (async () => {
    console.log('[DB] Opening database on:', Platform.OS);

    // Check if running on web and try WASM-based SQLite
    if (Platform.OS === 'web') {
      try {
        const serializedData = await loadAssetAsUint8Array();
        db = await SQLite.deserializeDatabaseAsync(serializedData);
        console.log('[DB] Web database opened with serialized data');
        return db;
      } catch (error) {
        console.warn('[DB] Web SQLite failed, falling back to sample data:', error);
        webFallbackMode = true;
        // Return a mock database with sample data - we'll handle this in searchDrugs
        throw error;
      }
    }

    if (!documentDirectory) {
      throw new Error('documentDirectory is null');
    }

    const destPath = documentDirectory + DB_NAME;
    const versionPath = documentDirectory + DB_NAME + '.version';
    
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
      } catch {
        existingVersion = 0;
      }
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
  })();

  try {
    return await dbInitPromise;
  } catch (error) {
    dbInitPromise = null;
    // If we're in web fallback mode, re-throw to let search functions handle it
    if (Platform.OS === 'web') {
      webFallbackMode = true;
    }
    throw error;
  }
}

// Wildcard pattern helpers
function isWildcardPattern(pattern: string): boolean {
  return pattern.includes('*');
}

function normalizeWildcardPattern(pattern: string): string {
  // Trim, collapse multiple * into one, lowercase
  return pattern
    .trim()
    .toLowerCase()
    .replace(/\*+/g, '*');
}

function patternToSqlLike(pattern: string): string {
  // Convert wildcard pattern * to SQL LIKE %
  let normalized = normalizeWildcardPattern(pattern);
  
  // If pattern has internal wildcards but doesn't end with *, add implicit trailing wildcard
  // This makes patterns like "top*x" work like "top*x*" to match partial names with suffixes
  const hasInternalWildcards = normalized.indexOf('*') > 0 && normalized.lastIndexOf('*') < normalized.length - 1;
  if (hasInternalWildcards && !normalized.endsWith('*')) {
    normalized = normalized + '*';
  }
  
  return normalized.replace(/\*/g, '%');
}

function getStartChar(pattern: string): string | null {
  const normalized = normalizeWildcardPattern(pattern);
  // Only use start char optimization if pattern starts with literal and has exactly one trailing wildcard
  if (!normalized.startsWith("*") && normalized.indexOf("*") === normalized.length - 1 && (normalized.match(/\*/g) || []).length === 1) {
    return normalized[0].toLowerCase();
  }
  return null;
}

function getEndChar(pattern: string): string | null {
  const normalized = normalizeWildcardPattern(pattern);
  // Only use end char optimization if pattern ends with literal and has exactly one leading wildcard
  if (!normalized.endsWith("*") && normalized.lastIndexOf("*") === 0 && (normalized.match(/\*/g) || []).length === 1) {
    return normalized[normalized.length - 1].toLowerCase();
  }
  return null;
}

export async function initDatabase(): Promise<void> {
  try {
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
          DELETE FROM drugs_fts WHERE rowid = old.id;
          INSERT INTO drugs_fts(rowid, trade_name, active_ingredient, category, subcategory,
                               manufacturer, distributor, route, search_index)
          VALUES (new.id, new.trade_name, new.active_ingredient, new.category, new.subcategory,
                  new.manufacturer, new.distributor, new.route, new.search_index);
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
  } catch (error) {
    // If on web and database fails, use fallback mode
    if (Platform.OS === 'web') {
      console.warn('[DB] Web database unavailable, using fallback sample data');
      webFallbackMode = true;
      return;
    }
    throw error;
  }
}

export async function searchDrugs(
  query: string,
  field: SearchField = 'all'
): Promise<Drug[]> {
  const q = query.trim();
  if (!q) return [];

  // Web fallback mode - use JavaScript filtering on sample data
  if (webFallbackMode) {
    console.log('[DEBUG] Web fallback mode - Platform.OS:', Platform.OS);
    console.log('[DEBUG] Query:', q, '| field:', field);
    console.log('[DEBUG] WEB_SAMPLE length:', WEB_SAMPLE.length);
    
    const normalizedQuery = q.toLowerCase();
    const results = WEB_SAMPLE.filter((drug: Drug) => {
      if (field === 'all') {
        return (
          (drug.trade_name && drug.trade_name.toLowerCase().includes(normalizedQuery)) ||
          (drug.active_ingredient && drug.active_ingredient.toLowerCase().includes(normalizedQuery)) ||
          (drug.category && drug.category.toLowerCase().includes(normalizedQuery)) ||
          (drug.manufacturer && drug.manufacturer.toLowerCase().includes(normalizedQuery)) ||
          (drug.search_index && drug.search_index.toLowerCase().includes(normalizedQuery))
        );
      }
      const fieldValue = drug[field as keyof Drug];
      return fieldValue && String(fieldValue).toLowerCase().includes(normalizedQuery);
    }).sort((a, b) => {
      // Priority: exact match on trade_name, then partial match
      const aExact = a.trade_name.toLowerCase() === normalizedQuery ? 0 : 1;
      const bExact = b.trade_name.toLowerCase() === normalizedQuery ? 0 : 1;
      if (aExact !== bExact) return aExact - bExact;
      return a.trade_name.localeCompare(b.trade_name);
    });
    
    console.log('[DEBUG] Web results:', results.length);
    return results.slice(0, 50);
  }

  const searchableColumns = [
    'trade_name',
    'active_ingredient',
    'category',
    'subcategory',
    'manufacturer',
    'distributor',
    'route',
  ] as const;

  if (field !== 'all' && !searchableColumns.includes(field)) {
    throw new Error(`Invalid search field: ${field}`);
  }

  console.log('[DEBUG] Platform.OS:', Platform.OS, '| field:', field, '| query:', q);

  const database = await getNativeDb();
  
  // Handle wildcard pattern search
  if (isWildcardPattern(q)) {
    console.log('[DB] Using wildcard pattern search');
    const likePattern = patternToSqlLike(q);
    const startChar = getStartChar(q);
    const endChar = getEndChar(q);
    
    let querySQL: string;
    let params: string[];

    // Build where clause with optimizations
    let whereConditions: string[] = [];
    const whereParams: string[] = [];

    // Add start/end character pre-filtering for optimization
    if (startChar) {
      if (field === 'all') {
        whereConditions.push(`(LOWER(trade_name) LIKE ? OR LOWER(active_ingredient) LIKE ? OR LOWER(category) LIKE ? OR LOWER(manufacturer) LIKE ? OR LOWER(search_index) LIKE ?)`);
        whereParams.push(`${startChar}%`, `${startChar}%`, `${startChar}%`, `${startChar}%`, `${startChar}%`);
      } else {
        whereConditions.push(`LOWER(${field}) LIKE ?`);
        whereParams.push(`${startChar}%`);
      }
    }
    
    if (endChar) {
      if (field === 'all') {
        whereConditions.push(`(LOWER(trade_name) LIKE ? OR LOWER(active_ingredient) LIKE ? OR LOWER(category) LIKE ? OR LOWER(manufacturer) LIKE ? OR LOWER(search_index) LIKE ?)`);
        whereParams.push(`%${endChar}`, `%${endChar}`, `%${endChar}`, `%${endChar}`, `%${endChar}`);
      } else {
        whereConditions.push(`LOWER(${field}) LIKE ?`);
        whereParams.push(`%${endChar}`);
      }
    }

    // Add actual wildcard pattern match
    if (field === 'all') {
      whereConditions.push(`(LOWER(trade_name) LIKE ? OR LOWER(active_ingredient) LIKE ? OR LOWER(category) LIKE ? OR LOWER(manufacturer) LIKE ? OR LOWER(search_index) LIKE ?)`);
      whereParams.push(likePattern, likePattern, likePattern, likePattern, likePattern);
    } else {
      whereConditions.push(`LOWER(${field}) LIKE ?`);
      whereParams.push(likePattern);
    }

    const whereClause = whereConditions.join(' AND ');

    // Priority ranking:
    // 0 = Exact match
    // 1 = Wildcard match on trade name
    // 2 = Wildcard match on active ingredient  
    // 3 = Other wildcard matches
    if (field === 'all') {
      querySQL = `
        SELECT * FROM drugs
        WHERE ${whereClause}
        ORDER BY
          CASE 
            WHEN LOWER(trade_name) = LOWER(?) THEN 0
            WHEN LOWER(trade_name) LIKE ? THEN 1
            WHEN LOWER(active_ingredient) LIKE ? THEN 2
            ELSE 3 
          END,
          trade_name
        LIMIT 50
      `;
      params = [...whereParams, q, likePattern, likePattern];
    } else {
      querySQL = `
        SELECT * FROM drugs
        WHERE ${whereClause}
        ORDER BY
          CASE 
            WHEN LOWER(${field}) = LOWER(?) THEN 0
            WHEN LOWER(${field}) LIKE ? THEN 1
            ELSE 2 
          END,
          trade_name
        LIMIT 50
      `;
      params = [...whereParams, q, likePattern];
    }

    console.log('[DB] Executing wildcard query');
    const results = await database.getAllAsync<Drug>(querySQL, params);
    console.log('[DB] Wildcard Results:', results.length);
    
    return results;
  }

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
          SELECT d.* FROM drugs_fts
          JOIN drugs d ON d.id = drugs_fts.rowid
          WHERE drugs_fts MATCH ?
          ORDER BY bm25(drugs_fts, 1, 2, 4, 3, 5, 6, 7, 8), d.trade_name
          LIMIT 50
        `;
        params = [ftsTerm];
      } else {
        querySQL = `
          SELECT d.* FROM drugs_fts
          JOIN drugs d ON d.id = drugs_fts.rowid
          WHERE drugs_fts MATCH ?
          ORDER BY bm25(drugs_fts), d.trade_name
          LIMIT 50
        `;
        params = [`${field}:${ftsTerm}`];
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
  if (webFallbackMode) {
    return WEB_SAMPLE.find((drug: Drug) => drug.id === id) ?? null;
  }
  const db = await getNativeDb();
  return db.getFirstAsync<Drug>('SELECT * FROM drugs WHERE id = ?', [id]);
}

export async function getDrugsByActiveIngredient(ingredient: string): Promise<Drug[]> {
  if (webFallbackMode) {
    return WEB_SAMPLE.filter((drug: Drug) => drug.active_ingredient === ingredient)
      .sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  }
  const db = await getNativeDb();
  return db.getAllAsync<Drug>(
    'SELECT * FROM drugs WHERE active_ingredient = ? ORDER BY price ASC',
    [ingredient]
  );
}

export async function getSimilarDrugs(drugId: number): Promise<Drug[]> {
  if (webFallbackMode) {
    const source = WEB_SAMPLE.find((drug: Drug) => drug.id === drugId);
    if (!source?.active_ingredient) return [];
    return WEB_SAMPLE.filter((drug: Drug) => 
      drug.active_ingredient === source.active_ingredient && drug.id !== drugId
    ).sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
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

export async function getAlternativeDrugs(drugId: number): Promise<Drug[]> {
  if (webFallbackMode) {
    const source = WEB_SAMPLE.find((drug: Drug) => drug.id === drugId);
    if (!source) return [];

    // Get unique drugs with matching category/subcategory but different active ingredient
    const alternatives = WEB_SAMPLE.filter((drug: Drug) => {
      if (drug.active_ingredient === source.active_ingredient) return false;
      if (drug.id === drugId) return false;
      if (source.subcategory2 && drug.subcategory2 === source.subcategory2) return true;
      if (source.subcategory && drug.subcategory === source.subcategory) return true;
      if (source.category && drug.category === source.category) return true;
      return false;
    }).sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    
    return alternatives;
  }
  const db = await getNativeDb();
  const source = await db.getFirstAsync<{ 
    active_ingredient: string; 
    category: string; 
    subcategory: string;
    subcategory2: string;
  }>(
    'SELECT active_ingredient, category, subcategory, subcategory2 FROM drugs WHERE id = ?', 
    [drugId]
  );
  
  if (!source) return [];

  let query = `SELECT * FROM drugs WHERE active_ingredient != ? AND id != ?`;
  const params: (string | number)[] = [source.active_ingredient, drugId];
  
  if (source.subcategory2) {
    query += ` AND subcategory2 = ?`;
    params.push(source.subcategory2);
  } else if (source.subcategory) {
    query += ` AND subcategory = ?`;
    params.push(source.subcategory);
  } else if (source.category) {
    query += ` AND category = ?`;
    params.push(source.category);
  } else {
    return [];
  }
  
  query += ` ORDER BY price ASC`;

  return db.getAllAsync<Drug>(query, params);
}

export async function getDrugsByCategory(category: string, limit = 50): Promise<Drug[]> {
  if (webFallbackMode) {
    return WEB_SAMPLE.filter((drug: Drug) => drug.category === category)
      .sort((a, b) => a.trade_name.localeCompare(b.trade_name))
      .slice(0, limit);
  }
  const db = await getNativeDb();
  return db.getAllAsync<Drug>(
    'SELECT * FROM drugs WHERE category = ? ORDER BY trade_name LIMIT ?',
    [category, limit]
  );
}

export async function getCategories(): Promise<{ category: string; count: number }[]> {
  if (webFallbackMode) {
    const categoryMap = new Map<string, number>();
    WEB_SAMPLE.forEach((drug: Drug) => {
      if (drug.category) {
        categoryMap.set(drug.category, (categoryMap.get(drug.category) ?? 0) + 1);
      }
    });
    return Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
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
  if (webFallbackMode) {
    return WEB_SAMPLE.filter((drug: Drug) => 
      drug.price_old !== null && drug.price_old > (drug.price ?? 0)
    ).sort((a, b) => ((a.price_old ?? 0) - (a.price ?? 0)) - ((b.price_old ?? 0) - (b.price ?? 0)))
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
  if (webFallbackMode) {
    console.log('[DB] Web fallback - returning sample count:', WEB_SAMPLE.length);
    return WEB_SAMPLE.length;
  }
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
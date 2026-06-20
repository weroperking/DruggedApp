# DruggedApp - Issues & Technical Notes

## Issues Faced

### 1. expo-sqlite Version Mismatch

**Problem:** Initial installation of `expo-sqlite` installed version `55.x`.

**Status:** FIXED - Reinstalled correct version `expo-sqlite@~16.0.10`

---

### 2. WASM Loading Failure on Web

**Problem:** SQLite fails on web due to WASM module loading.

**Root Cause:** The expo-sqlite library uses WebAssembly (wa-sqlite) for SQLite operations. On web, Metro bundler may have issues resolving WASM files from worker scripts in certain environments.

**Current Status:** 
- Native apps: SQLite database `drugged.db` works ✅
- Web: Uses JavaScript fallback with sample data (5 drugs)

---

### 3. Drug Search on Web - Fallback Implementation

**Solution:** Implemented platform detection with JavaScript fallback:
- `Platform.OS === 'web'` → Uses `drugs_web_fallback.json` sample data (5 drugs)
- Native (iOS/Android) → Uses full SQLite database (23,596 drugs)

The fallback is implemented in `src/services/drugDatabase.ts`:
- `webFallbackMode` flag tracks when SQLite fails to initialize on web
- All database functions check this flag and use in-memory JavaScript filtering when true
- Sample data includes PANADOL, PARACETAMOL, and CETIRIZINE based medications

---

## Implementation Details

### Database Service (`drugDatabase.ts`)

Uses `Platform` check and `expo-file-system` with Asset API:

```typescript
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import WEB_SAMPLE from '../assets/drugs_web_fallback.json';
```

- **Web:** Falls back to `WEB_SAMPLE` array (5 drugs for demo) when SQLite fails
- **Native:** Copies bundled `drugged.db` from assets to document directory, then opens with SQLite

### Required Packages

```bash
npm install expo-file-system expo-asset expo-sqlite@~16.0.10
```

### Database File Location

For the database to work:
1. Place `drugged.db` in `src/assets/` folder
2. Use `Asset.fromModule(require('../assets/drugged.db'))` to load
3. Copy to document directory using `FileSystem.File.copy()`

---

## Summary

| Platform | Database | Status |
|----------|----------|--------|
| Android  | SQLite   | Full 23,596 drugs ✅ |
| iOS       | SQLite   | Full 23,596 drugs ✅ |
| Web       | JS Array | 7 sample drugs ✅ |

---

## Debug Logging

The search function logs:
- Platform.OS value
- Query string
- WEB_SAMPLE length (when in fallback mode)
- Results count

Open browser DevTools (F12) → Console to see debug output.

---
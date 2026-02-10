# External Integrations

**Analysis Date:** 2026-02-10

## APIs & External Services

**None detected** - The application uses only Firebase services. No third-party REST APIs or webhooks are integrated.

## Data Storage

**Databases:**
- Cloud Firestore (Firebase)
  - SDK: firebase 11.0.0 (modular SDK)
  - Client implementation: `FirestoreService` in `src/firebase/firestore.ts`
  - Collections used: `users`
  - Data stored per user (`users/{uid}`):
    - `UserProgress`: current_level, completed_levels, stars, level_stars, last_seen
    - `EconomyState`: lives, bonuses, lives_regen_start
  - Offline persistence: Multi-tab IndexedDB enabled via `enableMultiTabIndexedDbPersistence()`
  - Error handling for browser incompatibility documented in `src/firebase/index.ts` lines 55-73

**File Storage:**
- Local filesystem only - no Cloud Storage integration

**Local Storage:**
- Browser localStorage: SettingsManager (`src/game/SettingsManager.ts`) stores user preferences
  - Storage key: `klo_match3_settings`
  - Data: sfxEnabled, sfxVolume, animationsEnabled, version
- Browser IndexedDB: Firebase offline persistence (automatic, managed by SDK)

## Authentication & Identity

**Auth Provider:**
- Firebase Authentication
  - Method: Anonymous sign-in only
  - Implementation: `AuthService` in `src/firebase/auth.ts`
  - Session persistence: IndexedDB (Firebase-managed, persists across browser sessions)
  - Sign-in flow: Automatic on app startup via `initFirebase()` in `src/main.ts` line 80
  - UID-based tracking: All user data keyed by Firebase UID
  - No user-facing login UI (anonymous session transparent to player)

## Monitoring & Observability

**Error Tracking:**
- None detected - no Sentry, Crashlytics, or similar service

**Logs:**
- Console logging only (development/debugging)
  - Firebase initialization: `[Firebase]` prefix
  - Auth operations: `[AuthService]` prefix
  - Firestore operations: `[FirestoreService]` prefix
  - Main initialization: `[Main]` prefix

## CI/CD & Deployment

**Hosting:**
- Vercel (single-page app)
  - Build command: `npm run build`
  - Output directory: `dist`

**CI Pipeline:**
- None detected - no GitHub Actions, CircleCI, or similar automation

## Environment Configuration

**Required Environment Variables:**
All Firebase configuration must be set in `.env` before build:
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain (e.g., example.firebaseapp.com)
- `VITE_FIREBASE_PROJECT_ID` - Firestore project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Cloud Storage bucket (unused currently)
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Messaging sender ID (unused currently)
- `VITE_FIREBASE_APP_ID` - Firebase app ID

**Secrets Management:**
- `.env` file (not committed - per `.gitignore`)
- Validation: Runtime error thrown in `src/firebase/config.ts` if any var missing
- Environment variables exposed at build time via Vite and accessible via `import.meta.env`

## Initialization Sequence

**On Application Startup (`src/main.ts`):**
1. Firebase initialized before Phaser (line 37)
2. Anonymous user signed in (line 80)
3. User progress loaded or created if first-time user (lines 41-51)
4. Economy state loaded or created (lines 65-75)
5. SettingsManager initialized from localStorage (lines 85-86)
6. Phaser game created with managers stored in registry (lines 91-96)

**Critical Note:** Firebase must initialize before Phaser to avoid race conditions (documented in comments)

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

## Data Persistence Flow

1. **User Authentication**
   - App calls `signInAnonymously()` (Firebase Auth)
   - Firebase manages session in IndexedDB
   - UID returned for all subsequent operations

2. **Game Progress**
   - ProgressManager (`src/game/ProgressManager.ts`) listens for level completions
   - Changes saved via `firestoreService.saveProgress(uid, data)`
   - Persisted to Firestore `users/{uid}` document

3. **Economy Management**
   - EconomyManager (`src/game/EconomyManager.ts`) tracks lives and bonuses
   - Changes saved via `firestoreService.saveEconomy(uid, data)`
   - Persisted to same Firestore document (merged update)

4. **User Settings**
   - SettingsManager saves changes to `localStorage` (key: `klo_match3_settings`)
   - Settings NOT synchronized to Firestore (local-only)

5. **Offline Support**
   - Firestore offline persistence enabled via IndexedDB
   - Reads/writes cached locally while offline
   - Synced to Firestore when connection restored
   - Multi-tab support: Other tabs warned if persistence unavailable in that tab

## Firestore Data Schema

**Collection: users**

```
{
  uid: string (document ID - Firebase Auth UID)

  UserProgress fields:
  - current_level: number
  - completed_levels: number[]
  - stars: number (total)
  - level_stars: Record<string, number> (e.g., {"1": 3, "2": 2})
  - last_seen: Timestamp (server timestamp)

  EconomyState fields:
  - lives: number
  - bonuses: number
  - lives_regen_start: Timestamp | null
}
```

---

*Integration audit: 2026-02-10*

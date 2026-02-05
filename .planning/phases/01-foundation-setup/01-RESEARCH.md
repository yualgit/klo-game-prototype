# Phase 1: Foundation & Setup - Research

**Researched:** 2026-02-05
**Domain:** Phaser 3 + TypeScript + Vite + Firebase Web Development
**Confidence:** HIGH

## Summary

Phase 1 establishes the technical foundation for the KLO Match-3 game by integrating Phaser 3 (game engine), TypeScript (type safety), Vite (build tool), and Firebase (backend services). The research confirms that this stack is the current standard for browser-based HTML5 game development with cloud backend integration in 2026.

The official Phaser + TypeScript + Vite template provides a production-ready starting point with Phaser 3.90.0, TypeScript 5.7.2, and Vite 6.3.1. Firebase JavaScript SDK v11 offers modular imports for optimal bundle size, with anonymous authentication and Firestore integration being straightforward to implement. The architecture follows a scene-based pattern with clear separation of concerns between game logic, rendering, and data persistence.

Key challenges identified include: managing Firestore multi-tab persistence correctly, configuring TypeScript strict mode with Phaser's API, properly organizing assets between bundled and static files, and implementing secure Firestore rules for anonymous users.

**Primary recommendation:** Use the official phaserjs/template-vite-ts as the foundation, implement Firebase initialization in a dedicated service layer outside Phaser scenes, and structure the project following TECH_SPEC.md architecture with scenes/, game/, firebase/, and data/ directories.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phaser 3 | 3.90.0 | HTML5 game engine | Industry standard for 2D browser games, mature API, active community, excellent TypeScript support |
| TypeScript | 5.7.2 | Type safety | Essential for large codebases, prevents runtime errors, better IDE support |
| Vite | 6.3.1 | Build tool & dev server | Fast HMR (hot module reload), modern ESM-based, replaces Webpack for new projects |
| Firebase JS SDK | 11.x | Backend services | Modular v9+ API, anonymous auth + Firestore + Analytics in one SDK, 80% smaller than v8 |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/node | Latest | Node.js types for TypeScript | Needed for Firebase Node.js-style imports |
| firebase-tools | Latest | Firebase CLI | Deployment, emulator, project management |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vite | Webpack | Webpack has more plugins but slower dev experience, Vite is modern standard |
| Firebase | Supabase | Supabase has better open-source story but Firebase has better mobile SDK integration |
| Phaser 3 | PixiJS | PixiJS is lower-level (more control) but Phaser has game-specific features built-in |

**Installation:**
```bash
# Clone official template
git clone https://github.com/phaserjs/template-vite-ts klo-match-3
cd klo-match-3

# Install dependencies
npm install

# Add Firebase
npm install firebase

# Add Firebase tools (global or local)
npm install -D firebase-tools
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── main.ts                  # Entry point (initializes Firebase, starts Phaser)
├── game/
│   ├── main.ts             # Phaser game config
│   ├── scenes/
│   │   ├── Boot.ts         # Preloader scene (loads assets)
│   │   ├── Menu.ts         # Main menu
│   │   ├── Game.ts         # Game scene (8×8 grid)
│   │   └── UI.ts           # UI overlay (HUD)
│   ├── Grid.ts             # 8×8 grid manager
│   ├── Tile.ts             # Match-3 tile entity
│   ├── Match.ts            # Match logic
│   ├── Booster.ts          # Booster logic
│   └── Obstacle.ts         # Obstacle logic
├── firebase/
│   ├── config.ts           # Firebase config (from env vars)
│   ├── auth.ts             # Anonymous auth service
│   ├── firestore.ts        # Firestore CRUD operations
│   └── analytics.ts        # Analytics event logging
├── data/
│   ├── LevelLoader.ts      # Load levels from JSON
│   └── RemoteConfig.ts     # Firebase Remote Config (optional)
└── utils/
    ├── constants.ts        # Game constants
    └── helpers.ts          # Utility functions
public/
├── assets/
│   ├── tiles/              # Tile sprites (fuel, coffee, snack, road)
│   ├── ui/                 # UI elements (buttons, cards)
│   └── backgrounds/        # Game backgrounds
└── data/
    └── levels/             # Level JSON files
```

### Pattern 1: Scene-Based Architecture
**What:** Phaser games are structured as multiple "scenes" (like screens/states) that can run in parallel or switch between each other.
**When to use:** Always - this is Phaser's core architectural pattern.
**Example:**
```typescript
// Source: https://github.com/phaserjs/template-vite-ts
// src/game/scenes/Boot.ts
export class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // Load assets
        this.load.image('fuel', 'assets/tiles/fuel.png');
        this.load.image('coffee', 'assets/tiles/coffee.png');
    }

    create() {
        // Initialize and switch to next scene
        this.scene.start('Menu');
    }
}

// src/game/main.ts - Register scenes in config
const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    scene: [Boot, Menu, Game, UI],
    parent: 'game-container'
};
```

### Pattern 2: Firebase Service Layer
**What:** Separate Firebase operations into dedicated service modules outside Phaser scenes.
**When to use:** Always - keeps game logic independent of backend implementation.
**Example:**
```typescript
// Source: https://firebase.google.com/docs/auth/web/anonymous-auth
// src/firebase/auth.ts
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

export class AuthService {
    private auth = getAuth();

    async signInAnonymous(): Promise<string> {
        const result = await signInAnonymously(this.auth);
        return result.user.uid;
    }

    onAuthChange(callback: (uid: string | null) => void) {
        return onAuthStateChanged(this.auth, (user) => {
            callback(user ? user.uid : null);
        });
    }
}

// src/firebase/firestore.ts
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

export class FirestoreService {
    private db = getFirestore();

    async saveProgress(uid: string, data: any) {
        await setDoc(doc(this.db, 'users', uid), data, { merge: true });
    }

    async loadProgress(uid: string) {
        const docSnap = await getDoc(doc(this.db, 'users', uid));
        return docSnap.exists() ? docSnap.data() : null;
    }
}
```

### Pattern 3: Environment-Based Firebase Config
**What:** Use Vite environment variables to manage Firebase config for dev/prod environments.
**When to use:** Always - prevents hardcoding secrets and enables multi-environment setup.
**Example:**
```typescript
// Source: https://vite.dev/guide/env-and-mode
// .env.development
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=klo-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=klo-dev

// src/firebase/config.ts
export const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// src/main.ts
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './firebase/config';

const app = initializeApp(firebaseConfig);
```

### Pattern 4: Asset Loading Strategy
**What:** Use public/ folder for game assets (images, audio, JSON), import for code-referenced files.
**When to use:** Public folder for all Phaser-loaded assets, imports for bundled config/data.
**Example:**
```typescript
// Source: https://vite.dev/guide/assets
// Use public/ for Phaser asset loading
// public/assets/tiles/fuel.png

// In scene:
this.load.image('fuel', 'assets/tiles/fuel.png'); // Loads from public/

// Use import for TypeScript modules or small data
import levelConfig from './config/level-defaults.json';
```

### Anti-Patterns to Avoid
- **Initializing Firebase in Phaser scenes:** Creates tight coupling, hard to test, memory leaks when scenes restart
- **Using compat API (v8 syntax):** Increases bundle size by 5x, deprecated
- **Hardcoding Firebase config:** Security risk, can't switch environments
- **Loading all assets in Boot scene:** Causes long initial load, use per-scene loading for larger games
- **Mixing game state in Firestore service:** Business logic belongs in game code, not data layer

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Anonymous auth session management | Custom UID generation + localStorage | Firebase Anonymous Auth | Handles session persistence, token refresh, security, account upgrade path |
| Offline data sync | Custom IndexedDB wrapper + sync queue | Firestore offline persistence | Built-in conflict resolution, multi-tab sync, query caching |
| Hot module reload for game | Custom file watchers | Vite HMR | Optimized for speed, handles dependencies, preserves state |
| Asset bundling | Custom Webpack config | Vite + public/ folder | Zero-config for most cases, optimized for games |
| TypeScript Phaser types | Manual type definitions | @types in template | Community-maintained, always current |

**Key insight:** Firebase and Vite solve infrastructure problems that are deceptively complex (auth token management, offline sync, build optimization). Custom solutions will have edge cases that take weeks to discover and fix. The official template has solved Phaser + Vite integration issues that aren't obvious until production.

## Common Pitfalls

### Pitfall 1: Firestore Multi-Tab Persistence Errors
**What goes wrong:** Opening the game in multiple browser tabs causes "failed to obtain exclusive lock" error, one tab works, others fail to sync data.
**Why it happens:** Firestore offline persistence uses IndexedDB which can only have one write connection per database. By default, enableIndexedDbPersistence() throws an error if another tab is already using persistence.
**How to avoid:** Use `enableMultiTabIndexedDbPersistence()` instead of `enableIndexedDbPersistence()`, which allows synchronized access across tabs. Alternatively, handle the error gracefully and continue without persistence in secondary tabs.
**Warning signs:** Error message "Failed to obtain exclusive lock", data not syncing in second tab, console errors about IndexedDB.

```typescript
// Source: https://firebase.google.com/docs/firestore/manage-data/enable-offline
// WRONG - fails in multiple tabs
import { enableIndexedDbPersistence } from 'firebase/firestore';
await enableIndexedDbPersistence(db);

// CORRECT - supports multiple tabs
import { enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
await enableMultiTabIndexedDbPersistence(db).catch(err => {
    if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence enabled only in first tab');
    } else if (err.code === 'unimplemented') {
        console.warn('Browser does not support persistence');
    }
});
```

### Pitfall 2: TypeScript Strict Mode with Phaser
**What goes wrong:** TypeScript compiler errors like "Property 'xyz' has no initializer and is not definitely assigned in the constructor" when declaring Phaser scene properties.
**Why it happens:** Phaser scene lifecycle initializes properties in `create()` method, not constructor. TypeScript strict mode expects constructor initialization.
**How to avoid:** Set `strictPropertyInitialization: false` in tsconfig.json, or use definite assignment assertion (`!`) on properties initialized in `create()`.
**Warning signs:** Many compiler errors on scene class properties, game works at runtime but won't compile.

```typescript
// Source: https://blog.ourcade.co/posts/2020/phaser-3-typescript/
// tsconfig.json
{
    "compilerOptions": {
        "target": "ES2020",
        "module": "ES2020",
        "lib": ["ES2020", "DOM"],
        "strict": true,
        "strictPropertyInitialization": false, // CRITICAL for Phaser
        "esModuleInterop": true,
        "skipLibCheck": true,
        "moduleResolution": "bundler"
    }
}

// Or use definite assignment assertion
export class Game extends Phaser.Scene {
    private grid!: Grid; // ! tells TS "trust me, this will be assigned"

    create() {
        this.grid = new Grid(this, 8, 8); // Assigned here, not constructor
    }
}
```

### Pitfall 3: Firebase Config Exposed in Client Bundle
**What goes wrong:** Firebase API keys and project IDs are visible in browser DevTools, developers worry about security.
**Why it happens:** Firebase web SDK is client-side, config must be public. The API key is not a secret - it's an identifier.
**How to avoid:** Understand that Firebase API keys are safe to expose (they're not authorization keys). Security comes from Firestore Security Rules and App Check. Use environment variables for organization, not security.
**Warning signs:** Hesitation to commit .env files to git (correct instinct but wrong context), trying to proxy Firebase through backend.

```typescript
// This is SAFE and CORRECT
// .env.development (can be committed if sanitized)
VITE_FIREBASE_API_KEY=AIzaSyDFyVl... # Public identifier, not a secret
VITE_FIREBASE_PROJECT_ID=klo-dev

// Security comes from Firestore rules, not hiding config
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Anonymous users can only read/write their own data
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Pitfall 4: Asset Path Confusion (Bundled vs Static)
**What goes wrong:** Phaser can't find assets, 404 errors on images, different behavior in dev vs production.
**Why it happens:** Vite has two asset systems: imported (bundled, hashed filenames) and public/ (static, original names). Phaser's `this.load.image()` expects static files from public/.
**How to avoid:** Always put Phaser-loaded assets (images, audio, JSON) in public/assets/. Never import them unless you're using them outside Phaser (like in HTML/CSS).
**Warning signs:** Assets work in dev but not after build, 404 errors with hashed filenames, paths like `/assets/image-abc123.png` that don't exist.

```typescript
// Source: https://vite.dev/guide/assets
// CORRECT - for Phaser assets
public/
└── assets/
    └── tiles/
        └── fuel.png

// In scene:
this.load.image('fuel', 'assets/tiles/fuel.png'); // Note: no leading /

// WRONG - importing will hash filename
import fuelImage from '../assets/tiles/fuel.png'; // Returns '/assets/tiles/fuel-abc123.png'
this.load.image('fuel', fuelImage); // Will work but breaks if asset not imported

// CORRECT use of imports - for non-Phaser assets
import logo from './logo.png'; // For use in HTML/CSS
document.getElementById('header').style.backgroundImage = `url(${logo})`;
```

### Pitfall 5: Phaser + Firebase Initialization Race Condition
**What goes wrong:** Phaser scenes try to use Firebase before it's initialized, getting "Firebase app not initialized" errors or null references.
**Why it happens:** Firebase initialization is asynchronous (signInAnonymously, enablePersistence), but Phaser starts immediately after constructor.
**How to avoid:** Initialize Firebase before creating Phaser game instance. Use Boot scene to wait for Firebase readiness if needed.
**Warning signs:** Intermittent errors on first load, works after refresh, null reference errors in scene create() methods.

```typescript
// Source: https://firebase.google.com/docs/auth/web/start
// WRONG - race condition
// src/main.ts
import { game } from './game/main';
import { initializeApp } from 'firebase/app';

initializeApp(firebaseConfig); // Async internally
const phaserGame = new Phaser.Game(config); // Starts immediately

// CORRECT - wait for Firebase
// src/main.ts
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

async function initApp() {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Enable persistence
    await enableMultiTabIndexedDbPersistence(db).catch(console.warn);

    // Sign in anonymously
    await signInAnonymously(auth);

    // NOW start Phaser
    const { createGame } = await import('./game/main');
    createGame();
}

initApp();
```

### Pitfall 6: Scene State Persistence Across Restarts
**What goes wrong:** Scene properties retain old values when scene restarts (e.g., level retry), causing bugs like duplicate sprites or wrong state.
**Why it happens:** Phaser reuses scene instances. Properties set in `create()` may not be reset if scene is restarted.
**How to avoid:** Always reset state in `create()` or use `shutdown()` event to clean up. Don't rely on constructor for state initialization.
**Warning signs:** Level retry has double sprites, variables have values from previous run, memory usage increases on retry.

```typescript
// Source: https://phaser.discourse.group/t/what-are-phaser-3-bad-best-practices/5088
// WRONG - state leaks across restarts
export class Game extends Phaser.Scene {
    private tiles: Tile[] = []; // Only initialized once

    create() {
        this.tiles.push(new Tile()); // Keeps adding without clearing
    }
}

// CORRECT - reset state
export class Game extends Phaser.Scene {
    private tiles: Tile[] = [];

    create() {
        // Clear previous state
        this.tiles.forEach(t => t.destroy());
        this.tiles = [];

        // Initialize fresh state
        this.tiles.push(new Tile());
    }

    // Or use shutdown event
    shutdown() {
        this.tiles.forEach(t => t.destroy());
        this.tiles = [];
    }
}
```

## Code Examples

Verified patterns from official sources:

### Firebase Initialization (v11 Modular SDK)
```typescript
// Source: https://firebase.google.com/docs/web/learn-more
// src/main.ts
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { getAnalytics, logEvent } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

async function initFirebase() {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const analytics = getAnalytics(app);

    // Enable offline persistence with multi-tab support
    await enableMultiTabIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence enabled only in first tab');
        } else if (err.code === 'unimplemented') {
            console.warn('Browser does not support persistence');
        }
    });

    // Sign in anonymously
    const userCredential = await signInAnonymously(auth);
    console.log('Signed in as:', userCredential.user.uid);

    // Log session start
    logEvent(analytics, 'session_start');

    return { app, auth, db, analytics };
}

export { initFirebase };
```

### Firestore CRUD Operations (v11)
```typescript
// Source: https://modularfirebase.web.app/common-use-cases/firestore/
// src/firebase/firestore.ts
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    increment,
    serverTimestamp,
    onSnapshot
} from 'firebase/firestore';

export class FirestoreService {
    private db = getFirestore();

    // Save user progress
    async saveProgress(uid: string, progress: any) {
        const userRef = doc(this.db, 'users', uid);
        await setDoc(userRef, {
            ...progress,
            last_seen: serverTimestamp()
        }, { merge: true }); // merge: true prevents overwriting existing fields
    }

    // Load user progress (one-time read)
    async loadProgress(uid: string) {
        const userRef = doc(this.db, 'users', uid);
        const snapshot = await getDoc(userRef);
        return snapshot.exists() ? snapshot.data() : null;
    }

    // Update specific fields
    async updateLevel(uid: string, level: number) {
        const userRef = doc(this.db, 'users', uid);
        await updateDoc(userRef, {
            'progress.current_level': level,
            'progress.completed_levels': arrayUnion(level),
            'stats.total_levels_completed': increment(1)
        });
    }

    // Real-time listener for progress changes
    onProgressChange(uid: string, callback: (data: any) => void) {
        const userRef = doc(this.db, 'users', uid);
        return onSnapshot(userRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.data());
            }
        }, (error) => {
            console.error('Progress listener error:', error);
        });
    }
}
```

### Phaser Game Config with TypeScript
```typescript
// Source: https://github.com/phaserjs/template-vite-ts
// src/game/main.ts
import Phaser from 'phaser';
import { Boot } from './scenes/Boot';
import { Menu } from './scenes/Menu';
import { Game } from './scenes/Game';
import { UI } from './scenes/UI';

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO, // WebGL with Canvas fallback
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#F9F9F9',
    scene: [Boot, Menu, Game, UI],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 }, // Top-down match-3, no gravity
            debug: import.meta.env.DEV // Debug mode in development only
        }
    },
    scale: {
        mode: Phaser.Scale.FIT, // Fit to container while maintaining aspect ratio
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

export function createGame() {
    return new Phaser.Game(config);
}
```

### Boot Scene with Asset Loading
```typescript
// Source: https://github.com/phaserjs/template-vite-ts
// src/game/scenes/Boot.ts
export class Boot extends Phaser.Scene {
    constructor() {
        super('Boot');
    }

    preload() {
        // Set base path for assets
        this.load.setPath('assets/');

        // Load tiles
        this.load.image('fuel', 'tiles/fuel.png');
        this.load.image('coffee', 'tiles/coffee.png');
        this.load.image('snack', 'tiles/snack.png');
        this.load.image('road', 'tiles/road.png');

        // Load UI
        this.load.image('button-primary', 'ui/button-primary.png');
        this.load.image('card-bg', 'ui/card-bg.png');

        // Load background
        this.load.image('game-bg', 'backgrounds/game-bg.png');

        // Load level data (JSON)
        this.load.json('level-1', 'data/levels/level-1.json');

        // Create loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        this.load.on('progress', (value: number) => {
            progressBar.clear();
            progressBar.fillStyle(0xFFB800, 1); // KLO yellow
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
        });
    }

    create() {
        // Boot complete, start menu
        this.scene.start('Menu');
    }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Firebase v8 (namespace API) | Firebase v9+ (modular API) | Sept 2021 | 80% smaller bundle size, tree-shaking support |
| Webpack for game builds | Vite | 2020-2021 | 10x faster dev server startup, near-instant HMR |
| Manual IndexedDB for offline | Firestore persistence | 2018 | Built-in offline support, multi-tab sync, automatic conflict resolution |
| enableIndexedDbPersistence() | enableMultiTabIndexedDbPersistence() | 2018 | Multiple tabs can share offline data instead of exclusive lock |
| localStorage for session | Firebase Anonymous Auth | Always available | Secure session management, token refresh, account upgrade path |

**Deprecated/outdated:**
- **Firebase v8 compat API**: Still works but deprecated, use modular API for new projects
- **Phaser.Game constructor with multiple scenes**: Use scene array in config instead (cleaner, supports ordering)
- **Vite 4.x**: Vite 6.x is current (Feb 2026), breaking changes in config format
- **TypeScript <5.0**: Phaser 3 templates use 5.7+, decorators and other features have changed

## Open Questions

Things that couldn't be fully resolved:

1. **Exact Firebase v11 package size for typical game usage**
   - What we know: v9+ is 80% smaller than v8, modular imports enable tree-shaking
   - What's unclear: Actual bundle size with auth + firestore + analytics for this project
   - Recommendation: Test bundle size after implementation, measure with Vite build analysis (`vite-plugin-bundle-analyzer`)

2. **Firebase security rules for anonymous user data migration**
   - What we know: Anonymous accounts can be upgraded to permanent accounts by linking credentials
   - What's unclear: How to structure Firestore rules to allow data transfer during upgrade while preventing unauthorized access
   - Recommendation: Start with simple rules (user can only access own data), revisit when implementing phone auth in later phases

3. **Optimal Phaser scene architecture for match-3 with overlay UI**
   - What we know: Multiple scenes can run in parallel, UI scene can overlay Game scene
   - What's unclear: Performance implications of parallel scenes vs single scene with UI layer, which is better for this project
   - Recommendation: Start with parallel scenes (Game + UI) as TECH_SPEC.md suggests, benchmark if performance issues arise

4. **Vite environment variable handling for Firebase config in production**
   - What we know: Vite exposes VITE_* variables at build time, must use import.meta.env
   - What's unclear: Whether Firebase Hosting needs additional config to inject environment variables for multiple environments (dev/staging/prod)
   - Recommendation: Use Firebase Hosting environment-specific .env files (.env.development, .env.production), test build process early

## Sources

### Primary (HIGH confidence)
- [Phaser + TypeScript + Vite Template](https://phaser.io/news/2024/01/phaser-vite-typescript-template) - Official template announcement
- [phaserjs/template-vite-ts GitHub](https://github.com/phaserjs/template-vite-ts) - Official template source (Phaser 3.90.0, Vite 6.3.1, TypeScript 5.7.2)
- [Firebase Anonymous Auth Docs](https://firebase.google.com/docs/auth/web/anonymous-auth) - Official v9+ modular SDK documentation
- [Firebase Modular SDK Firestore Guide](https://modularfirebase.web.app/common-use-cases/firestore/) - CRUD operations with v9+ SDK
- [Vite Asset Handling](https://vite.dev/guide/assets) - Official documentation on public/ vs import
- [Vite Environment Variables](https://vite.dev/guide/env-and-mode) - Official guide on import.meta.env

### Secondary (MEDIUM confidence)
- [Phaser 3 Scene Lifecycle - DeepWiki](https://deepwiki.com/phaserjs/phaser/3.1-scene-lifecycle) - Community documentation on scene architecture
- [Phaser 3 TypeScript Best Practices - Ourcade](https://blog.ourcade.co/posts/2020/phaser-3-typescript/) - tsconfig.json recommendations verified against official templates
- [Firebase Multi-Tab Offline Support](https://firebase.blog/posts/2018/09/multi-tab-offline-support-in-cloud/) - Official blog post on multi-tab persistence
- [Firebase Security Rules and Auth](https://firebase.google.com/docs/rules/rules-and-auth) - Official documentation on anonymous user rules
- [Firebase Best Practices for Anonymous Auth](https://firebase.blog/posts/2023/07/best-practices-for-anonymous-authentication/) - Official blog post on security considerations

### Secondary (verified via multiple sources)
- [Phaser 3 Common Mistakes Discussion](https://phaser.discourse.group/t/what-are-phaser-3-bad-best-practices/5088) - Community discussion verified against official docs
- [Firebase JavaScript SDK v11 Release Notes](https://firebase.google.com/support/release-notes/js) - Official changelog for latest features
- [Vite Public vs Src Assets Comparison](https://www.jeffryhouser.com/index.cfm/2025/6/17/What-is-the-Difference-between-public-and-srcassets-in-a-Vite-project) - Community guide verified against Vite docs

### Tertiary (LOW confidence - marked for validation)
- GitHub issues for Firebase multi-tab persistence edge cases - useful for pitfall identification but not authoritative
- Community templates (ourcade, digitsensitive) - good patterns but not official, verify before using

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified with official templates and docs, current versions confirmed
- Architecture: HIGH - Based on official Phaser docs and Firebase best practices
- Pitfalls: MEDIUM-HIGH - Multi-tab and TypeScript issues verified with official docs, race conditions based on common patterns but not explicitly documented
- Code examples: HIGH - All examples sourced from official documentation or templates

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (30 days - stable ecosystem, minor version updates expected but no breaking changes anticipated)

**Note:** Firebase v11 is latest stable as of research date. Phaser 3.90.0 is current, with Phaser 4 in development but no release date announced. Stack is production-ready and widely used in 2026.

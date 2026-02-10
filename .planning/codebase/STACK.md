# Technology Stack

**Analysis Date:** 2026-02-10

## Languages

**Primary:**
- TypeScript 5.7.0 - All source code (.ts files in `src/`)

**Secondary:**
- JavaScript - Configuration files (vite.config.ts compiled, jest.config.js)
- HTML - Page structure (`index.html`)
- CSS - Inline styles in HTML

## Runtime

**Environment:**
- Browser (modern ES2020+ support)
- Node.js - Development and testing

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Phaser 3.90.0 - Game framework (canvas rendering, scene management, input handling, animations)
  - Used in all scenes: Boot, Menu, LevelSelect, Game
  - Provides AUTO renderer (WebGL with Canvas fallback)

**Testing:**
- Jest 30.2.0 - Unit test runner
- ts-jest 29.4.6 - TypeScript support for Jest

**Build/Dev:**
- Vite 6.0.0 - Frontend build tool and dev server
- TypeScript 5.7.0 - Static type checking and transpilation

## Key Dependencies

**Critical:**
- firebase 11.0.0 - Backend platform for user authentication and data persistence
  - Authentication: Anonymous sign-in
  - Database: Cloud Firestore with offline IndexedDB persistence
  - Requires 6 environment variables (VITE_FIREBASE_*)

**Infrastructure:**
- None beyond Node.js/npm toolchain

## Configuration

**Environment:**
- Vite-managed environment variables with VITE_ prefix
- `.env` file required but not committed (per `.gitignore`)
- Configuration validated at startup in `src/firebase/config.ts`

**Required Environment Variables:**
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

**Build Configuration Files:**
- `tsconfig.json` - TypeScript compiler
  - Target: ES2020
  - Module: ES2020
  - Module resolution: bundler
  - Strict mode enabled
- `vite.config.ts` - Vite bundler
  - Output directory: `dist`
  - Dev server port: 5173
  - Source maps enabled in production build
- `jest.config.js` - Test runner
  - Preset: ts-jest
  - Test environment: node
  - Test file pattern: `**/*.test.ts`

## Platform Requirements

**Development:**
- Node.js with npm
- Modern browser with WebGL support
- `.env` file with valid Firebase credentials

**Production:**
- Deployment via Vercel (configured in `vercel.json`)
- Static hosting (single-page application)
- Browser requirements: ES2020+ support

## Deployment

**Hosting Provider:**
- Vercel
  - Build command: `npm run build` (TypeScript compilation + Vite bundling)
  - Output directory: `dist`
  - Dev command: `npm run dev` (Vite dev server)
  - Framework: Vite

**Build Process:**
1. TypeScript compilation to ES2020
2. Vite bundling and minification
3. Source maps generated for debugging
4. Static artifacts in `dist/` directory

---

*Stack analysis: 2026-02-10*

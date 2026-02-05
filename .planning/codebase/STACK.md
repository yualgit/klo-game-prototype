# Technology Stack

**Analysis Date:** 2026-02-05

## Languages

**Primary:**
- TypeScript - Frontend (Phaser 3 PWA) and Cloud Functions implementation

**Supporting:**
- JSON - Level data format (`data/levels/*.json`)

## Runtime

**Environment:**
- Node.js 18+ (specified in `TECH_SPEC.md` for Firebase Cloud Functions)

**Package Manager:**
- npm (referenced in `TECH_SPEC.md` for project setup)
- Lockfile: Not yet present (project in prototype phase)

## Frameworks

**Core:**
- Phaser 3 [Version TBD] - Match-3 game engine, recommended over pixi.js per `TECH_SPEC.md`
- Firebase [Latest] - Complete backend platform

**Build/Dev:**
- Vite or Webpack - Build tool for bundling (recommended Vite per `TECH_SPEC.md`)

**Backend Runtime:**
- Firebase Cloud Functions - Serverless execution for `generateCoupon`, `redeemCoupon`, and antifraud logic

## Key Dependencies

**Critical:**
- firebase-admin (for Cloud Functions server-side operations)
- @firebase/app, @firebase/firestore, @firebase/auth, @firebase/analytics, @firebase/remote-config - Frontend SDKs
- phaser [3.x] - Game engine (grid, swap, match, gravity, spawn mechanics)

**Infrastructure:**
- firebase-tools - CLI for development, deployment, and emulation
- typescript - Language support for type-safe code
- nodejs runtime - Execution environment for Cloud Functions

## Configuration

**Environment:**
- Firebase project configuration via `firebase.json` and `.firebaserc` (referenced in `TECH_SPEC.md`)
- Environment variables: Not yet documented (project in early stage)

**Build:**
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` or `webpack.config.js` - Build configuration
- `firebase.json` - Firebase deployment config

## Platform Requirements

**Development:**
- Node.js 18+
- npm
- Firebase CLI (firebase-tools)
- Modern browser with WebGL support

**Production:**
- Firebase Hosting (PWA deployment specified in `README.md`)
- Firestore database
- Cloud Functions runtime (Node.js 18)
- Firebase Authentication
- Firebase Analytics
- Firebase Remote Config

## Deployment Infrastructure

**Hosting:**
- Firebase Hosting - PWA serving at custom Firebase domain

**Database:**
- Firestore (NoSQL) - User data, progress, coupons, analytics

**Storage:**
- Firebase Storage (optional per `TECH_SPEC.md`) - Graphics, audio assets

**Serverless Functions:**
- Firebase Cloud Functions - Coupon generation, redemption, antifraud checks

**Authentication:**
- Firebase Authentication - Anonymous + phone verification for loyalty_id binding

## Project Structure

```
klo-match3/
├── package.json              # Frontend dependencies
├── tsconfig.json             # TypeScript config
├── vite.config.ts (or webpack.config.js)  # Build config
├── firebase.json             # Firebase deployment config
├── .firebaserc              # Firebase project reference
├── src/                      # Frontend source code
│   ├── main.ts              # Entry point
│   ├── scenes/              # Phaser scenes
│   ├── game/                # Game logic (Grid, Tile, Match, Booster, Obstacle)
│   ├── data/                # Level loader, Remote Config
│   ├── firebase/            # Firebase SDK integration
│   └── utils/               # Constants, helpers
├── public/                   # Static assets
│   ├── index.html
│   ├── assets/              # Graphics, sounds
│   └── data/levels/         # JSON level copies
├── functions/               # Cloud Functions source
│   ├── package.json         # Functions dependencies
│   ├── tsconfig.json        # Functions TypeScript config
│   └── src/
│       ├── index.ts
│       ├── coupons.ts       # generateCoupon, redeemCoupon
│       └── antifraud.ts
└── data/                    # Original level JSON files
    └── levels/              # Level_001.json through level_005.json
```

## Version Control & CI/CD

**Status:** Not yet configured (project in documentation phase)

- No CI/CD pipeline documented
- Firebase automatic deployments available via `firebase deploy` command

---

*Stack analysis: 2026-02-05*

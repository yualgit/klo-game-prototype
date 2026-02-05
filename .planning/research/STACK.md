# Technology Stack Research

**Project:** KLO Match-3 Demo
**Researched:** 2026-02-05

## Recommended Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Phaser 3 | 3.80.1+ | Game engine — built-in tweens, particles, input |
| TypeScript | 5.3+ | Type safety for game state |
| Vite | 5.0+ | Build tool — fast HMR, excellent Phaser support |
| Firebase SDK | 10.7+ | Modular imports for smaller bundle |
| vite-plugin-pwa | 0.17+ | PWA generation |

## Key Recommendations

### Phaser 3 Built-in Systems (No Plugins Needed)

| System | Purpose in Match-3 |
|--------|-------------------|
| `Tweens` | Tile swap, fall, destroy animations |
| `Particles` | Match explosions, booster effects |
| `Input` | Touch/mouse tile selection |
| `Cameras` | Screen shake on combos |

### Firebase Modular Imports

**GOOD:**
```typescript
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
```

**BAD:**
```typescript
import firebase from 'firebase/compat/app'; // Pulls entire SDK
```

Bundle size: ~180kb (modular) vs ~600kb (compat)

### Bundle Optimization

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        phaser: ['phaser'],
        firebase: ['firebase/app', 'firebase/firestore', 'firebase/analytics']
      }
    }
  }
}
```

## What NOT to Use

- ~~lodash~~ — ES6 covers use cases
- ~~rxjs~~ — Overkill for match-3
- ~~pixi.js~~ — Phaser uses Pixi internally
- ~~Physics engines~~ — Use tweens for deterministic animations

## Installation

```bash
npm create vite@latest klo-match-3 -- --template vanilla-ts
npm install phaser firebase
npm install -D vite-plugin-pwa @types/node vitest
```

---
*Confidence: MEDIUM — verify specific versions at project start*

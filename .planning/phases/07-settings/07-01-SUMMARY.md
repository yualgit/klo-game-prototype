---
phase: 07-settings
plan: 01
subsystem: settings
tags: [settings, localStorage, reactive, audio, vfx]
dependency_graph:
  requires: [economy-manager, audio-manager, vfx-manager]
  provides: [settings-manager, settings-persistence, reactive-settings]
  affects: [audio-playback, vfx-rendering]
tech_stack:
  added: [localStorage-api]
  patterns: [subscription-pattern, registry-singleton]
key_files:
  created: [src/game/SettingsManager.ts]
  modified: [src/main.ts, src/game/AudioManager.ts, src/game/VFXManager.ts]
key_decisions:
  - decision: "Subscription callbacks fire only on set(), not on subscribe()"
    rationale: "Prevents duplicate initialization — initial state already set via get()"
    phase: 07-01
  - decision: "Defensive fallback if settings registry not found"
    rationale: "AudioManager/VFXManager remain functional if SettingsManager fails to load"
    phase: 07-01
  - decision: "Version field in SettingsData for future migrations"
    rationale: "Enables schema evolution without breaking existing localStorage data"
    phase: 07-01
metrics:
  duration_minutes: 2
  tasks_completed: 2
  files_modified: 4
  commits: 2
  completed_at: 2026-02-10
---

# Phase 07 Plan 01: Settings Data Layer Summary

**One-liner:** Reactive settings manager with localStorage persistence controlling AudioManager mute/volume and VFXManager animation toggle.

## Objective

Establish settings data layer with localStorage persistence and reactive subscriptions, enabling AudioManager to respect sfxEnabled/sfxVolume and VFXManager to skip effects when animationsEnabled is false.

## Tasks Completed

### Task 1: Create SettingsManager and wire into app startup
- **Status:** Complete
- **Commit:** 46bf7e4
- **Duration:** ~1 min
- **Files:** src/game/SettingsManager.ts (created), src/main.ts (modified)
- **Implementation:**
  - Created SettingsData interface with sfxEnabled, sfxVolume, animationsEnabled, version fields
  - Implemented SettingsManager with typed get/set, subscription pattern, localStorage save/load
  - Wired into main.ts after EconomyManager initialization
  - Stored in Phaser registry as 'settings'
- **Verification:** TypeScript compilation passed, exports confirmed

### Task 2: Integrate settings subscriptions into AudioManager and VFXManager
- **Status:** Complete
- **Commit:** fa973a9
- **Duration:** ~1 min
- **Files:** src/game/AudioManager.ts (modified), src/game/VFXManager.ts (modified)
- **Implementation:**
  - AudioManager: subscribed to sfxEnabled/sfxVolume, set initial state from settings
  - VFXManager: added animationsEnabled field, subscribed to animationsEnabled setting
  - Added `if (!this.animationsEnabled) return;` guard to all 6 VFX methods:
    - matchPop, boosterLineSweep, boosterBombExplosion
    - boosterSphereWave, confettiBurst, cascadeCombo
- **Verification:** TypeScript compilation passed, all 6 guards confirmed via grep

## Architecture

**SettingsManager Flow:**
```
localStorage → SettingsManager.load() → SettingsData
                       ↓
SettingsManager(data) → registry.set('settings')
                       ↓
AudioManager.constructor → registry.get('settings') → subscribe(sfxEnabled, sfxVolume)
VFXManager.constructor → registry.get('settings') → subscribe(animationsEnabled)
                       ↓
User calls set('sfxEnabled', false) → save() → localStorage
                                    ↓
                                  notify() → all subscribed callbacks fire
                                           ↓
                                  AudioManager.muted = true
```

**Key Pattern:** Subscription callbacks fire ONLY on set(), not on subscribe(). Initial state is read via get() during construction.

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

All verification criteria passed:

1. ✓ `npx tsc --noEmit` passes with zero errors
2. ✓ `src/game/SettingsManager.ts` exports `SettingsManager` class and `SettingsData` interface
3. ✓ `src/main.ts` creates SettingsManager and stores in registry
4. ✓ `src/game/AudioManager.ts` subscribes to sfxEnabled and sfxVolume
5. ✓ `src/game/VFXManager.ts` has animationsEnabled guard in all 6 public methods
6. ✓ `npx vite build` succeeds (production build)

## Success Criteria Met

- ✓ SettingsManager loads/saves to localStorage with try-catch safety
- ✓ AudioManager mutes when sfxEnabled=false, adjusts volume from sfxVolume
- ✓ VFXManager skips all effects when animationsEnabled=false
- ✓ All changes are reactive (take effect immediately when set() is called)
- ✓ TypeScript compiles cleanly

## Must-Haves Delivered

All 5 truths confirmed:

1. ✓ Settings default to sfxEnabled=true, sfxVolume=0.5, animationsEnabled=true on first launch
2. ✓ Changing a setting value via SettingsManager persists it to localStorage
3. ✓ AudioManager respects sfxEnabled and sfxVolume settings when playing sounds
4. ✓ VFXManager skips all particle/visual effects when animationsEnabled is false
5. ✓ Settings loaded from localStorage on app startup override defaults

All 4 artifacts confirmed:

1. ✓ src/game/SettingsManager.ts exports SettingsManager and SettingsData
2. ✓ src/main.ts calls SettingsManager.load() and stores in registry
3. ✓ src/game/AudioManager.ts subscribes to settings in constructor
4. ✓ src/game/VFXManager.ts checks animationsEnabled before rendering effects

All 3 key-links verified:

1. ✓ main.ts → SettingsManager via SettingsManager.load()
2. ✓ AudioManager → SettingsManager via registry.get('settings').subscribe
3. ✓ VFXManager → SettingsManager via registry.get('settings').subscribe

## Technical Details

**SettingsManager API:**
```typescript
interface SettingsData {
  sfxEnabled: boolean;      // default: true
  sfxVolume: number;        // 0.0-1.0, default: 0.5
  animationsEnabled: boolean; // default: true
  version: number;          // default: 1
}

class SettingsManager {
  static readonly STORAGE_KEY = 'klo_match3_settings';
  get<K>(key: K): SettingsData[K];
  set<K>(key: K, value: SettingsData[K]): void;
  subscribe<K>(key: K, callback: (value) => void): void;
  static load(): SettingsData;
}
```

**Error Handling:**
- localStorage save failures logged to console (warn), do not throw
- localStorage load failures fall back to defaults
- Registry.get('settings') returns undefined if missing — managers default to enabled state

**Defensive Design:**
- AudioManager: keeps muted=false, volume=0.5 if settings not found
- VFXManager: keeps animationsEnabled=true if settings not found
- Both managers remain functional without SettingsManager

## Next Steps

This plan establishes the data layer. Next plan (07-02) will:
- Create settings UI overlay scene
- Add toggle switches for sfxEnabled/animationsEnabled
- Add volume slider for sfxVolume
- Wire UI controls to SettingsManager.set()
- Add settings button to Menu/LevelSelect scenes

## Self-Check: PASSED

**Created files exist:**
```
FOUND: src/game/SettingsManager.ts
```

**Modified files exist:**
```
FOUND: src/main.ts
FOUND: src/game/AudioManager.ts
FOUND: src/game/VFXManager.ts
```

**Commits exist:**
```
FOUND: 46bf7e4 (feat(07-01): create SettingsManager with localStorage persistence)
FOUND: fa973a9 (feat(07-01): integrate settings with AudioManager and VFXManager)
```

**Build artifacts:**
```
PASSED: npx tsc --noEmit (0 errors)
PASSED: npx vite build (dist/index.html, dist/assets/index-DmcXTRLU.js)
```

All claims verified. Plan 07-01 complete.

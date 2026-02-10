---
phase: 05-assets-polish
plan: 01
subsystem: assets-infrastructure
tags: [assets, sprites, audio, preloading, visual-upgrade]
completed: 2026-02-10T09:18:18Z
duration: 189s

dependency_graph:
  requires: []
  provides:
    - PNG sprite rendering for all 4 tile types
    - 3-stage damage progression sprites for ice obstacles
    - 3-stage damage progression sprites for dirt/grass obstacles
    - bubble.png display for crate (1-hit blocker) obstacles
    - Boot scene preloading for 4 tiles + 7 obstacles + 17 GUI + 6 sounds
    - AudioManager wrapper for centralized sound playback
  affects:
    - src/game/TileSprite.ts (now uses Image instead of Graphics)
    - src/scenes/Boot.ts (preloads all PNG/WAV assets)
    - All future plans in phase 05 (depend on asset loading)

tech_stack:
  added:
    - Phaser.GameObjects.Image for tile rendering
    - AudioManager class for sound management
  patterns:
    - Asset key constants (TEXTURE_KEYS, OBSTACLE_TEXTURE_KEYS, GUI_TEXTURE_KEYS, SOUND_KEYS)
    - Image-based sprites with scaled display size
    - Obstacle sprite progression based on remaining layers
    - Tint-based selection instead of stroke borders

key_files:
  created:
    - src/game/AudioManager.ts
  modified:
    - src/game/constants.ts (added TEXTURE_KEYS, OBSTACLE_TEXTURE_KEYS, GUI_TEXTURE_KEYS, SOUND_KEYS)
    - src/scenes/Boot.ts (preload 34 assets: 4 tiles + 7 obstacles + 17 GUI + 6 sounds)
    - src/game/TileSprite.ts (replaced Graphics with Image, added obstacle sprite logic)

decisions:
  - bubble.png maps to crate obstacle type (1-hit blocker per user decision)
  - blocked cells keep programmatic fallback (no PNG asset available)
  - Booster overlays remain Graphics-based (arrows, stars, glows are overlay effects)
  - Selection uses tint (0xffffcc) + scale (1.1) instead of stroke border
  - Obstacle sprites use alpha 0.85 for semi-transparency
  - Ice/dirt damage progression: layers 3->sprite01 (full), 2->sprite02 (cracked), 1->sprite03 (broken)

metrics:
  tasks_completed: 2
  commits: 2
  files_created: 1
  files_modified: 3
  typescript_errors: 0
  build_status: success
---

# Phase 5 Plan 1: Asset Infrastructure - PNG Sprites & Audio Setup Summary

**One-liner:** Replaced all programmatic tile/obstacle graphics with PNG sprites (4 tiles, 7 obstacles, 17 GUI) and set up AudioManager for sound playback.

## What Was Built

This plan established the asset foundation for Phase 5 by replacing programmatic placeholder graphics with real PNG sprites and setting up audio infrastructure.

**Core changes:**
1. **Asset constants added** - TEXTURE_KEYS (tiles), OBSTACLE_TEXTURE_KEYS (ice/grass/bubble), GUI_TEXTURE_KEYS (17 UI elements), SOUND_KEYS (6 effects)
2. **Boot scene preloading** - Loads 4 tile PNGs + 7 obstacle PNGs + 17 GUI PNGs + 6 sound WAVs
3. **TileSprite refactored** - Replaced Graphics-based drawing with Phaser.GameObjects.Image for tiles and obstacle overlays
4. **Obstacle sprite progression** - Ice and grass obstacles show 3-stage visual damage (full -> cracked -> broken)
5. **AudioManager created** - Centralized sound playback wrapper with volume control and mute toggle

**Visual upgrade:**
- Tiles now display semantic PNG images (fuel can, coffee cup, wheel, light) instead of colored rectangles
- Ice obstacles show ice01.png (full) -> ice02.png (cracked) -> ice03.png (broken)
- Dirt obstacles show grss01.png (full) -> grss02.png (cracked) -> grss03.png (broken)
- Crate obstacles display bubble.png (1-hit blocker per user decision)
- Selection uses yellow tint + 1.1 scale instead of white stroke border

## Tasks Completed

### Task 1: Asset constants, Boot preloading, and AudioManager
**Commit:** f72c147

Added asset key constants to `src/game/constants.ts`:
- TEXTURE_KEYS: fuel_can, coffee, wheel, light (mapping game types to PNG filenames)
- OBSTACLE_TEXTURE_KEYS: ice01-03, grss01-03, bubble
- GUI_TEXTURE_KEYS: 17 GUI elements (buttons, crowns, hearts, locks, progress bars, etc.)
- SOUND_KEYS: match, bomb, sphere, horizontal, level_win, level_loose

Updated `src/scenes/Boot.ts` to preload all assets:
- 4 tile PNGs from assets/tiles/
- 7 obstacle PNGs from assets/blockers/
- 17 GUI PNGs from assets/gui/
- 6 sound WAVs from assets/sound/

Created `src/game/AudioManager.ts`:
- Centralized sound playback wrapper
- Methods: play(), playMatch(), playBomb(), playSphere(), playLineClear(), playWin(), playLose()
- Volume control (setVolume) and mute toggle (toggleMute)
- Handles mobile autoplay restrictions

**Files changed:** src/game/constants.ts, src/scenes/Boot.ts, src/game/AudioManager.ts (created)

### Task 2: Replace TileSprite programmatic drawing with PNG Image sprites and obstacle sprites
**Commit:** 0a61e42

Refactored `src/game/TileSprite.ts` to use Image-based rendering:

**Main tile visual:**
- Replaced `private graphics: Phaser.GameObjects.Graphics` with `private tileImage: Phaser.GameObjects.Image`
- Constructor creates Image using TEXTURE_KEYS[type]
- Scales image to fit tile size (assets are ~400-500px, scaled to ~60px)
- draw() updates texture and applies tint for selection (0xffffcc)

**Obstacle overlays:**
- Added `private obstacleImage?: Phaser.GameObjects.Image`
- Ice obstacles: Display ice01/02/03 based on layers (3->ice01 full, 2->ice02 cracked, 1->ice03 broken)
- Dirt obstacles: Display grss01/02/03 based on layers (same progression logic)
- Crate obstacles: Display bubble.png (1-hit blocker per user decision)
- Blocked cells: Keep programmatic fallback (dark gray with red X - no asset available)
- All sprite-backed obstacles use alpha 0.85-0.9 for semi-transparency

**Selection behavior:**
- Replaced Graphics stroke border with tint (0xffffcc) + scale (1.1)
- setSelected() applies both tint and scale for visual feedback

**Cleanup:**
- reset() now destroys and clears obstacleImage
- Booster overlays remain Graphics-based (arrows, stars, glows are overlay effects)

**Files changed:** src/game/TileSprite.ts

## Verification Results

✅ `npx tsc --noEmit` - No TypeScript errors
✅ `npm run build` - Build succeeds (2073.84 kB minified bundle)
✅ Asset paths verified - All tile, obstacle, GUI, and sound files exist
✅ TEXTURE_KEYS constants defined for all 4 tile types
✅ OBSTACLE_TEXTURE_KEYS constants defined for ice, grass, and bubble
✅ GUI_TEXTURE_KEYS constants defined for 17 GUI elements
✅ SOUND_KEYS constants defined for 6 sound effects
✅ Boot scene loads all 34 assets (4 tiles + 7 obstacles + 17 GUI + 6 sounds)
✅ TileSprite uses Phaser.GameObjects.Image instead of Graphics
✅ Obstacle sprites show damage progression
✅ AudioManager class ready for sound playback

## Deviations from Plan

None - plan executed exactly as written.

## Architecture Notes

**Asset loading pattern:**
- Boot scene preloads all assets before game starts
- Constants file (constants.ts) provides single source of truth for asset keys
- TileSprite looks up texture keys via TEXTURE_KEYS[type]
- Obstacle sprites selected by indexing array keys (ice[0-2], grass[0-2])

**Image vs Graphics trade-offs:**
- Images provide higher visual quality (PNG sprites with transparency)
- Images scale well (assets are large, scaled down to tile size)
- Graphics still used for boosters (overlay effects) and blocked cells (no asset available)
- Selection moved from stroke border to tint (better for image-based rendering)

**Obstacle sprite progression logic:**
```typescript
const idx = Math.max(0, Math.min(2, 3 - this.obstacleData.layers));
```
- 3 layers -> idx 0 (sprite01 - full)
- 2 layers -> idx 1 (sprite02 - cracked)
- 1 layer -> idx 2 (sprite03 - broken)

**AudioManager design:**
- Singleton pattern via scene instance
- Play-by-name with key validation
- Volume override per sound type (bomb/sphere 0.6, win/lose 0.7, match 0.5)
- Console warns on missing sound keys (no crashes)

## Dependencies

**Requires:**
- Phase 4 complete (scene flow, UI scaffolding)
- Assets present in assets/ directory (tiles, blockers, gui, sound)

**Provides:**
- PNG sprite rendering for tiles and obstacles
- Boot scene asset preloading
- AudioManager for sound playback
- Asset key constants for future plans

**Affects:**
- All subsequent Phase 5 plans (depend on assets being loaded)
- Future UI improvements (can use GUI_TEXTURE_KEYS)
- Future audio integration (can use AudioManager)

## Next Steps

With asset infrastructure in place:
1. Plan 05-02 can add animations (particle effects, tile animations, obstacle break animations)
2. Plan 05-03 can integrate sounds (match, bomb, sphere, win/lose)
3. UI scenes can now use GUI_TEXTURE_KEYS for button styling
4. LevelSelect and overlays can use crown/heart/star sprites

## Self-Check: PASSED

✅ **Created files exist:**
- [FOUND] /Users/vasiliyhrebenuyk/work/KLO/klo-match-3/src/game/AudioManager.ts

✅ **Modified files exist:**
- [FOUND] /Users/vasiliyhrebenuyk/work/KLO/klo-match-3/src/game/constants.ts
- [FOUND] /Users/vasiliyhrebenuyk/work/KLO/klo-match-3/src/scenes/Boot.ts
- [FOUND] /Users/vasiliyhrebenuyk/work/KLO/klo-match-3/src/game/TileSprite.ts

✅ **Commits exist:**
- [FOUND] f72c147: feat(05-01): add asset constants, Boot preloading, and AudioManager
- [FOUND] 0a61e42: feat(05-01): replace TileSprite programmatic graphics with PNG sprites

✅ **Asset constants defined:**
```bash
$ grep -n "TEXTURE_KEYS" src/game/constants.ts
25:export const TEXTURE_KEYS: Record<TileType, string> = {

$ grep -n "OBSTACLE_TEXTURE_KEYS" src/game/constants.ts
35:export const OBSTACLE_TEXTURE_KEYS = {

$ grep -n "GUI_TEXTURE_KEYS" src/game/constants.ts
43:export const GUI_TEXTURE_KEYS = {

$ grep -n "SOUND_KEYS" src/game/constants.ts
63:export const SOUND_KEYS = {
```

✅ **Boot scene loads assets:**
```bash
$ grep -n "this.load.image" src/scenes/Boot.ts | wc -l
      28

$ grep -n "this.load.audio" src/scenes/Boot.ts | wc -l
       6
```

✅ **TileSprite uses Image:**
```bash
$ grep -n "tileImage: Phaser.GameObjects.Image" src/game/TileSprite.ts
20:  private tileImage: Phaser.GameObjects.Image;

$ grep -n "obstacleImage" src/game/TileSprite.ts
28:  private obstacleImage?: Phaser.GameObjects.Image;
```

All verification checks passed. Plan 05-01 complete.

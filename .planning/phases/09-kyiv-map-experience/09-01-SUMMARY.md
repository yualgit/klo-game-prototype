---
phase: 09-kyiv-map-experience
plan: 01
subsystem: level-select-map
status: complete
completed: 2026-02-10

tags:
  - scrolling
  - parallax
  - camera
  - kyiv-theme
  - visual

dependency_graph:
  requires:
    - phase: 08
      reason: "Needs all 10 levels created and wired in Boot/LevelSelect"
  provides:
    - artifact: "Scrollable Kyiv map infrastructure"
      for: "Plan 02 (interaction wiring)"
    - artifact: "Parallax background system"
      for: "Visual depth effect"
    - artifact: "MAP_CONFIG constants"
      for: "Centralized map layout configuration"
  affects:
    - scene: LevelSelect
      change: "Major refactor from static viewport to scrollable world"
    - scene: Boot
      change: "Added procedural texture generation"

tech_stack:
  added:
    - "Phaser camera bounds and scrolling"
    - "Parallax layers with scroll factors"
    - "Procedural texture generation with Graphics"
  patterns:
    - "Scroll factor differentiation (0=HUD, 0.25-0.6=parallax, 1=world objects)"
    - "Depth layering (0-2=backgrounds, 3-6=map elements, 11=HUD, 100+=overlays)"
    - "Drag threshold for tap/drag distinction"

key_files:
  created:
    - path: "src/game/constants.ts"
      lines_added: 30
      purpose: "MAP_CONFIG with dimensions, parallax factors, 10 Kyiv node positions"
  modified:
    - path: "src/scenes/Boot.ts"
      lines_changed: 52
      purpose: "Generate kyiv_sky, kyiv_far, kyiv_mid textures procedurally"
    - path: "src/scenes/LevelSelect.ts"
      lines_changed: 166
      purpose: "Transform into scrollable map with camera, parallax, drag scrolling"

decisions:
  - decision: "Generate textures procedurally vs external PNGs"
    rationale: "Avoids missing asset errors, enables rapid iteration without art pipeline"
    alternatives: ["Load external placeholder PNGs", "Wait for final Kyiv art assets"]
    outcome: "Boot generates 3 gradient/silhouette textures in create()"

  - decision: "Camera setBounds for scrolling vs manual clamping"
    rationale: "Phaser built-in bounds enforcement, cleaner than manual edge checks"
    alternatives: ["Clamp scrollY manually in pointermove", "Use scroll container pattern"]
    outcome: "cameras.main.setBounds(0, 0, 1024, 2200) enforces limits automatically"

  - decision: "ScrollFactor(0) for HUD vs separate overlay scene"
    rationale: "Simpler than multi-scene coordination, all elements in one scene"
    alternatives: ["Create HUD scene above LevelSelect", "Use DOM elements for HUD"]
    outcome: "All HUD elements pinned with setScrollFactor(0) and high depth"

  - decision: "Depth-based layering vs manual add order"
    rationale: "Explicit depth values prevent accidental occlusion, easier to debug"
    alternatives: ["Rely on add order for rendering", "Use separate display lists"]
    outcome: "Backgrounds 0-2, map 3-6, HUD 11, overlays 100+"

  - decision: "Defer level tap handler to Plan 02"
    rationale: "Need proper tap/drag distinction logic to avoid accidental level starts during scroll"
    alternatives: ["Add simple click handler now", "Keep existing handler"]
    outcome: "Removed pointerup handler, Plan 02 will re-add with isDragging check"

metrics:
  duration_minutes: 5
  tasks_completed: 2
  files_modified: 3
  commits: 2
  lines_added: 248
  lines_removed: 66
---

# Phase 09 Plan 01: Scrollable Kyiv Map Infrastructure Summary

**One-liner:** Vertical-scrolling Kyiv map with parallax backgrounds, camera drag scrolling, and 10 level nodes along a winding path through Kyiv landmarks.

## What Was Built

Transformed LevelSelect from a static single-viewport screen into a tall scrollable Kyiv map (2200px height) with:

1. **MAP_CONFIG Constants**: Centralized configuration for map dimensions (1024x2200), parallax factors (0, 0.25, 0.6), drag threshold (10px), and 10 level node positions along a winding vertical path through Kyiv landmarks (Оболонь → Печерська Лавра).

2. **Procedural Background Textures**: Boot scene generates 3 placeholder textures programmatically:
   - `kyiv_sky`: Gradient sky (light blue → white), 1024x768, static
   - `kyiv_far`: Distant building silhouettes + Lavra dome, 1024x2200, 0.25 scroll factor
   - `kyiv_mid`: Closer building shapes + arches, 1024x2200, 0.6 scroll factor

3. **Scrollable Camera System**:
   - Camera bounds set to full map height (2200px)
   - Viewport stays at 1024x768, camera scrolls within world
   - Drag scrolling with 10px threshold to distinguish taps from drags

4. **Parallax Background Layers**: 3 layers with different scroll speeds create depth effect (sky static, far buildings move slowly, mid-ground moves faster).

5. **Winding Path Level Nodes**: 10 level checkpoints positioned using MAP_CONFIG coordinates, zigzagging from bottom (Оболонь) to top (Печерська Лавра) with Kyiv landmark labels below each node.

6. **Fixed HUD Elements**: Title, back button, economy display, and settings gear pinned to camera viewport (scrollFactor 0, depth 11) with semi-transparent white background bar for readability.

7. **Depth-Based Layering**: Clear rendering order (0-2: backgrounds, 3: path, 5: nodes, 11: HUD, 100+: overlays) prevents occlusion issues.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

✅ `npm run build` succeeds with zero TypeScript errors
✅ MAP_CONFIG exported from constants.ts with 10 LEVEL_NODES
✅ Boot generates kyiv_sky, kyiv_far, kyiv_mid textures in create()
✅ LevelSelect renders tall scrollable map (2200px world height)
✅ Camera scrolls vertically via drag (10px threshold before drag mode activates)
✅ 3 parallax layers visible with different scroll speeds
✅ 10 level nodes positioned along winding path with landmark labels
✅ HUD elements (title, back button, economy, settings) fixed at top of viewport
✅ Camera bounded to 0-2200px (cannot scroll beyond map edges)

## Technical Highlights

**Parallax Implementation:**
```typescript
sky.setScrollFactor(0);        // Static sky
far.setScrollFactor(0.25);     // Distant landmarks move slowly
mid.setScrollFactor(0.6);      // Mid-ground moves faster
```

**Camera Setup:**
```typescript
this.cameras.main.setBounds(0, 0, MAP_CONFIG.MAP_WIDTH, MAP_CONFIG.MAP_HEIGHT);
// Viewport: 1024x768, World: 1024x2200
```

**Drag Scrolling Logic:**
```typescript
if (Math.abs(pointer.y - dragStartY) > MAP_CONFIG.DRAG_THRESHOLD) {
  isDragging = true;
}
if (isDragging) {
  this.cameras.main.scrollY -= deltaY;
}
```

**HUD Pinning:**
```typescript
element.setScrollFactor(0);  // Pins to camera viewport
element.setDepth(11);         // Above map but below overlays
```

## Requirements Coverage

- **VISL-01** (Scrollable map): ✅ Partially met - vertical drag scrolling works, tap distinction deferred to Plan 02
- **VISL-02** (Kyiv-themed parallax): ✅ Met - 3-layer parallax with procedural placeholder art
- **VISL-03** (Winding path layout): ✅ Partially met - 10 nodes along Kyiv journey, interaction deferred to Plan 02

## Next Steps

Plan 02 will:
- Re-add level tap handler with proper tap/drag distinction (check `isDragging` flag)
- Implement smooth camera scrolling to selected level on tap
- Add visual polish (path progress coloring, node entrance animations)
- Wire economy gates (lives check before level start)

## Self-Check

**Created Files:**
```bash
# MAP_CONFIG added to existing file
[ -f "src/game/constants.ts" ] && grep -q "MAP_CONFIG" src/game/constants.ts
```
✅ PASSED: MAP_CONFIG found in constants.ts

**Modified Files:**
```bash
[ -f "src/scenes/Boot.ts" ] && grep -q "generateKyivTextures" src/scenes/Boot.ts
[ -f "src/scenes/LevelSelect.ts" ] && grep -q "setupDragScrolling" src/scenes/LevelSelect.ts
```
✅ PASSED: Boot.ts has generateKyivTextures method
✅ PASSED: LevelSelect.ts has setupDragScrolling method

**Commits:**
```bash
git log --oneline --all | grep -E "(b584bdf|99e5dc1)"
```
✅ PASSED:
- b584bdf: feat(09-01): add MAP_CONFIG and generate Kyiv background textures
- 99e5dc1: feat(09-01): refactor LevelSelect into scrollable Kyiv map

## Self-Check: PASSED

All files created, all commits exist, all verifications passed.

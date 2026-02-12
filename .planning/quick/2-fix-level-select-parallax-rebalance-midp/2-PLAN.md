---
phase: quick-2
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [src/scenes/LevelSelect.ts]
autonomous: false

must_haves:
  truths:
    - "First midPart (kyiv_mid) appears at the bottom of the scrollable map area"
    - "Both midPart images are visibly larger than before the fix"
    - "farParts are distributed harmoniously across the full scroll range with content visible"
    - "Parallax scrolling still works smoothly without visual gaps or overlaps"
  artifacts:
    - path: "src/scenes/LevelSelect.ts"
      provides: "Rebalanced parallax layer positioning and sizing"
      contains: "createParallaxBackground"
  key_links:
    - from: "src/scenes/LevelSelect.ts"
      to: "MAP_CONFIG"
      via: "PARALLAX_MID, PARALLAX_FAR, MAP_HEIGHT constants"
      pattern: "MAP_CONFIG\\.PARALLAX"
---

<objective>
Fix level select parallax background: rebalance midParts and farParts positioning, increase image sizes after DPR rendering change.

Purpose: After the DPR fix (quick task 1), parallax background images appear smaller and positioning is off. The first midPart (kyiv_mid - Kyiv landmarks) needs to be at the bottom of the page, images need to be larger, and farParts (distant skyline silhouettes) need more harmonious placement.

Output: Updated `createParallaxBackground()` in LevelSelect.ts with correct positioning and sizing.
</objective>

<execution_context>
@/Users/vasiliyhrebenuyk/.claude/get-shit-done/workflows/execute-plan.md
@/Users/vasiliyhrebenuyk/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/scenes/LevelSelect.ts
@src/game/constants.ts (MAP_CONFIG section)
@src/utils/responsive.ts (mapToGame, cssToGame, getDpr functions)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Rebalance parallax layer positioning and sizing</name>
  <files>src/scenes/LevelSelect.ts</files>
  <action>
Modify the `createParallaxBackground()` method in LevelSelect.ts. Only change the mid layer and far layer sections (lines ~205-229). Do NOT change the sky layer.

**Understanding the coordinate system:**
- `mapToGame(MAP_CONFIG.MAP_HEIGHT)` = `4400 * dpr` = total world height in game pixels
- `maxScroll` = world height - viewport height = how far camera can scroll
- Parallax layers use `setScrollFactor()` so their effective y-position is: `worldY - camera.scrollY * scrollFactor`
- For scrollFactor < 1, the layer scrolls slower than camera, creating depth illusion
- The effective range a parallax layer traverses = `maxScroll * scrollFactor + height` (what's visible across full camera scroll)

**Mid layer fixes (2 images, each 1024x1536 portrait):**
1. Increase scale: Change `midScale` calculation to be approximately 1.5x larger than current. Use:
   ```ts
   const midScale = Math.max(width / 1024, mapToGame(MAP_CONFIG.MAP_WIDTH) / 1024) * 1.5;
   ```
   Note the denominator is 1024 (image width), not 1536. The current code already uses 1024 for width but 1536 for the second term which is wrong - the MAP_WIDTH comparison should also divide by the image width dimension (1024). The `* 1.5` enlarges them further.

2. Reposition so first midPart (kyiv_mid, index 0) is at the BOTTOM of the map. The midParts array is `['kyiv_mid', 'kyiv_mid_0']`. In parallax coordinates, "bottom of the map" means placing it so when the camera is scrolled to the bottom (scrollY near maxScroll, since level 1 is at y=4050), the image is visible and centered vertically.

   Replace the current midParts positioning loop with explicit positioning:
   ```ts
   // Mid layer - 2 images with parallax
   const midScale = Math.max(width / 1024, mapToGame(MAP_CONFIG.MAP_WIDTH) / 1024) * 1.5;
   const midParts = ['kyiv_mid', 'kyiv_mid_0'];

   // Position in parallax-adjusted coordinates:
   // When camera.scrollY = S, an object at worldY with scrollFactor F appears at screenY = worldY - S*F
   // We want kyiv_mid visible when viewing bottom of map (high scrollY near maxScroll)
   // and kyiv_mid_0 visible when viewing top of map (low scrollY near 0)
   const midPositions = [
     midEffectiveRange * 0.75,  // kyiv_mid: bottom portion (visible when scrolled to bottom)
     midEffectiveRange * 0.25,  // kyiv_mid_0: top portion (visible when scrolled to top)
   ];

   midParts.forEach((key, i) => {
     const part = this.add.image(width / 2, midPositions[i], key);
     part.setScale(midScale);
     part.setScrollFactor(MAP_CONFIG.PARALLAX_MID);
     part.setDepth(2);
   });
   ```

**Far layer fixes (3 images, each 1536x1024 landscape):**
1. Increase scale: The far images have their content (skyline silhouettes) concentrated at the bottom edge of each image. Scale them up to make the silhouettes more prominent:
   ```ts
   const farScale = Math.max(width / 1536, mapToGame(MAP_CONFIG.MAP_WIDTH) / 1536) * 1.4;
   ```

2. Reposition for harmonious distribution. The far images are:
   - `kyiv_far_top`: Pecherska Lavra (golden domes) - content at bottom
   - `kyiv_far_mid`: Motherland monument + Independence column - content at bottom
   - `kyiv_far_bottom`: Bridge + buildings - content at bottom

   Since content is at the bottom of each image, position them so their bottom edges align with meaningful points in the scroll range, distributing across bottom/middle/top:
   ```ts
   const farPositions = [
     farEffectiveRange * 0.85,   // kyiv_far_bottom: near bottom of map (bridge scene)
     farEffectiveRange * 0.50,   // kyiv_far_mid: middle (Motherland monument)
     farEffectiveRange * 0.15,   // kyiv_far_top: near top (Pecherska Lavra)
   ];
   // Note: reorder array to match position semantics
   const farParts = ['kyiv_far_bottom', 'kyiv_far_mid', 'kyiv_far_top'];
   farParts.forEach((key, i) => {
     const part = this.add.image(width / 2, farPositions[i], key);
     part.setScale(farScale);
     part.setScrollFactor(MAP_CONFIG.PARALLAX_FAR);
     part.setDepth(1);
   });
   ```

**Important:** Keep the `farEffectiveRange` and `midEffectiveRange` calculations unchanged - they correctly compute the visible scroll range for each parallax factor.
  </action>
  <verify>Run `npx tsc --noEmit` to verify no TypeScript errors. Then run `npm run dev` and visually inspect the level select screen by scrolling through the full map.</verify>
  <done>First midPart (kyiv_mid) is positioned at the bottom of the scrollable area; both mid images are ~1.5x larger; farParts are distributed harmoniously (bottom/middle/top) with increased size; parallax scrolling works without visual gaps.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 2: Visual verification of parallax rebalancing</name>
  <files>src/scenes/LevelSelect.ts</files>
  <action>
Human verifies the parallax background looks correct after rebalancing.

**What was built:** Rebalanced parallax background layers - repositioned midParts so first one is at the bottom of the page, enlarged both mid and far images, redistributed farParts harmoniously across the scroll range.

**How to verify:**
1. Run `npm run dev` and open the level select screen
2. Scroll to the BOTTOM of the map (level 1 area) - verify kyiv_mid (Kyiv landmarks watercolor) is visible as background
3. Scroll to the TOP of the map (level 20 area) - verify kyiv_mid_0 (KLO gas station) is visible as background
4. Check that both mid-layer images appear noticeably larger than before
5. While scrolling full range, verify far-layer silhouettes (bridge at bottom, monument in middle, Lavra domes at top) are visible and harmoniously distributed
6. Verify smooth parallax effect - no visual gaps, no jarring jumps between layers

**Resume signal:** Type "approved" or describe what needs adjustment (positioning, sizing, layer ordering)
  </action>
  <verify>User confirms visual quality of parallax layers.</verify>
  <done>User approves the parallax background positioning, sizing, and harmonious distribution.</done>
</task>

</tasks>

<verification>
- TypeScript compiles without errors: `npx tsc --noEmit`
- Dev server runs without console errors
- Parallax layers render at correct positions across full scroll range
- No visual gaps between parallax segments
</verification>

<success_criteria>
- First midPart (kyiv_mid landmarks) visible at bottom of map when viewing level 1
- Both mid-layer images are enlarged (~1.5x previous size)
- Far-layer silhouettes distributed harmoniously: bridge at bottom, monument middle, Lavra top
- Smooth parallax scrolling maintained throughout
</success_criteria>

<output>
After completion, create `.planning/quick/2-fix-level-select-parallax-rebalance-midp/2-SUMMARY.md`
</output>

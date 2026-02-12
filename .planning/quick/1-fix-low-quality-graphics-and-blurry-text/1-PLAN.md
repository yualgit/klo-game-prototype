---
phase: quick-fix
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/utils/responsive.ts
  - src/main.ts
autonomous: true

must_haves:
  truths:
    - "getDpr() returns the same capped DPR value as main.ts (max 3)"
    - "All text and UI elements sized via cssToGame() appear at correct CSS pixel sizes on DPR 3 devices"
    - "Text renders crisply on high-DPR devices (not blurry)"
  artifacts:
    - path: "src/utils/responsive.ts"
      provides: "Fixed getDpr() with cap at 3 matching main.ts"
      contains: "Math.min(window.devicePixelRatio || 2, 3)"
    - path: "src/main.ts"
      provides: "DPR stored in registry for text resolution access"
  key_links:
    - from: "src/utils/responsive.ts"
      to: "src/main.ts"
      via: "Matching DPR cap value (3)"
      pattern: "Math\\.min.*devicePixelRatio.*3\\)"
---

<objective>
Fix blurry text and undersized UI elements on high-DPR mobile devices (DPR 3 iPhones etc).

Purpose: The DPR cap mismatch between main.ts (cap 3) and responsive.ts (cap 2) causes all cssToGame()-sized elements to be 2/3 their intended size on DPR 3 devices. The game canvas is 3x but UI calculations use 2x, so text and elements appear shrunken and blurry. A secondary issue is that Phaser Text objects render their internal canvas at resolution=1 by default, which can cause slight blurriness even when font sizes are correct.

Output: Fixed responsive.ts with matching DPR cap, and optional text resolution improvement via factory override in main.ts.
</objective>

<execution_context>
@/Users/vasiliyhrebenuyk/.claude/get-shit-done/workflows/execute-plan.md
@/Users/vasiliyhrebenuyk/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/main.ts
@src/utils/responsive.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix DPR cap mismatch in responsive.ts</name>
  <files>src/utils/responsive.ts</files>
  <action>
In `src/utils/responsive.ts` line 12, change the DPR cap from 2 to 3 to match main.ts:

BEFORE: `return Math.min(window.devicePixelRatio || 2, 2);`
AFTER:  `return Math.min(window.devicePixelRatio || 2, 3);`

Also update the comment on line 10 to confirm it matches main.ts:
BEFORE: `// Get DPR (same logic as main.ts, capped at 3)`  (comment was already wrong/aspirational)
AFTER:  `// Get DPR (same logic as main.ts, capped at 3 for retina without perf issues)`

This is the PRIMARY fix. On DPR 3 devices, cssToGame() will now correctly multiply by 3 instead of 2, making all text and UI elements render at the correct CSS pixel size on the 3x game canvas.
  </action>
  <verify>
Run `grep -n "Math.min" src/utils/responsive.ts` and confirm the cap is 3, not 2.
Run `npx tsc --noEmit` to verify no type errors.
  </verify>
  <done>getDpr() returns Math.min(window.devicePixelRatio || 2, 3), matching the DPR calculation in main.ts line 10 exactly.</done>
</task>

<task type="auto">
  <name>Task 2: Add automatic text resolution for crisp rendering</name>
  <files>src/main.ts</files>
  <action>
In `src/main.ts`, after the Phaser Game is created (after line `const game = new Phaser.Game(config);` on line 117), add a factory override that automatically sets text resolution to match DPR. This ensures ALL text objects created anywhere in the game get crisp high-DPI rendering without modifying any of the 40+ text creation call sites.

Add this code block right after `const game = new Phaser.Game(config);`:

```typescript
// Override text factory to auto-set resolution for crisp text on high-DPI displays.
// Phaser Text objects render to an internal canvas at resolution=1 by default,
// which can appear slightly blurry on retina displays even with correct font sizes.
const originalTextFactory = Phaser.GameObjects.GameObjectFactory.prototype.text;
Phaser.GameObjects.GameObjectFactory.prototype.text = function(
  x: number, y: number, text: string | string[], style?: Phaser.Types.GameObjects.Text.TextStyle
) {
  const enhancedStyle = { resolution: dpr, ...style };
  return originalTextFactory.call(this, x, y, text, enhancedStyle);
};
```

Key details:
- Uses spread with `resolution: dpr` BEFORE `...style` so that if any call site explicitly sets resolution, it won't be overridden (user-provided style wins).

  CORRECTION: Actually, use `{ ...style, resolution: dpr }` so DPR always applies (no call site currently sets resolution, and we want to ensure it). But wait -- this would mean explicit overrides are impossible. Since NO call site sets resolution and we ALWAYS want DPR, put dpr AFTER: `{ ...style, resolution: dpr }`.

The final code should use: `const enhancedStyle = { ...style, resolution: dpr };`

This is a supplementary improvement. The primary fix is Task 1 (DPR cap). This task ensures text internal canvases render at device pixel density for maximum crispness.

NOTE: This override must be placed BEFORE `game.registry.set(...)` calls to ensure it's active when the first scene (Boot) creates text objects. Actually, since scenes don't start until after the game constructor returns and the event loop ticks, placing it after `new Phaser.Game(config)` but before or among the registry.set calls is fine. However, to be safest, place it immediately after `const game = new Phaser.Game(config);`.
  </action>
  <verify>
Run `npx tsc --noEmit` to verify no type errors.
Run `npx vite build` to verify the build succeeds.
Open the game in a browser, inspect any Text object in the console: `game.scene.scenes[1].children.list.find(c => c.type === 'Text')?.style?.resolution` should equal the device's DPR (capped at 3).
  </verify>
  <done>All Phaser Text objects automatically have resolution set to the device DPR. Build passes without errors. Text appears crisp on high-DPI devices.</done>
</task>

</tasks>

<verification>
1. `grep -n "Math.min" src/utils/responsive.ts` shows cap of 3
2. `grep -n "Math.min" src/main.ts` shows cap of 3 (line 10, unchanged)
3. `grep -n "resolution" src/main.ts` shows the text factory override
4. `npx tsc --noEmit` passes
5. `npx vite build` succeeds
</verification>

<success_criteria>
- getDpr() in responsive.ts caps at 3, matching main.ts DPR calculation exactly
- Text factory override in main.ts automatically injects resolution: dpr into all Text objects
- TypeScript compilation passes with no errors
- Production build succeeds
- On DPR 3 devices: UI elements and text appear at correct intended CSS pixel sizes (not 2/3 size)
- On DPR 2 devices: No change in behavior (both files already agreed on cap of 2, now both agree on 3 but device is 2)
- On DPR 1 devices: No change in behavior
</success_criteria>

<output>
After completion, create `.planning/quick/1-fix-low-quality-graphics-and-blurry-text/1-SUMMARY.md`
</output>

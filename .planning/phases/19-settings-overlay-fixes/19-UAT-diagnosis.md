# Settings Overlay Mobile Layout - Root Cause Diagnosis

**File:** `src/scenes/UIScene.ts`
**Method:** `showSettingsOverlay()` (lines 363-633)

## Device Context

With `Scale.RESIZE` + `zoom: 1/dpr`, Phaser coordinates are in device pixels.
`cssToGame(n)` = `n * dpr`. On a typical mobile device (DPR=2), `cssToGame(n)` = `2n`.

**Reference device:** iPhone SE (375x667 CSS) => 750x1334 Phaser coords, DPR=2.

---

## Issue 1: Title "Налаштування" Too Large on Mobile

**Lines 407-416:**
```typescript
const title = this.add.text(width / 2, panelY + cssToGame(50), 'Налаштування', {
  fontFamily: 'Arial, sans-serif',
  fontSize: `${cssToGame(22)}px`,   // <-- ROOT CAUSE
  color: '#1A1A1A',
  fontStyle: 'bold',
});
```

**Root Cause:** The title font size is `cssToGame(22)` = 22 CSS pixels. This is a fixed value that does not adapt to the panel width. On a narrow mobile screen:

- Panel width: `Math.min(cssToGame(340), width * 0.85)` = `Math.min(680, 637.5)` = **637.5 px** (on 750px wide screen)
- Panel CSS width: **637.5 / 2 = ~319 CSS px**
- Title font: **22 CSS px bold** for word "Налаштування" (12 Cyrillic characters)

The word "Налаштування" in 22px bold Arial is approximately 190-210px wide, which is ~60-65% of the 319px CSS panel width. On narrower devices (320px CSS width phones like iPhone 5/SE 1st gen, panel = 272px CSS), it takes up even more proportional space, creating a visually oversized appearance.

**What needs to change:** Reduce title font size (e.g., 18px CSS or smaller), or make it responsive to panel width.

---

## Issue 2: Toggle Switches Overlap Their Labels

**Lines 434-462 (SFX toggle) and 559-586 (Animation toggle):**
```typescript
// Toggle dimensions (line 441-442):
const toggleWidth = cssToGame(60);    // = 60 CSS px = 120 Phaser px @2x
const toggleHeight = cssToGame(30);   // = 30 CSS px = 60 Phaser px @2x

// Toggle thumb radius (line 437):
const sfxToggleThumb = this.add.circle(0, 0, cssToGame(12), 0xFFFFFF);  // radius = 12 CSS px, diameter = 24 CSS px

// Toggle X position (line 440):
const sfxToggleX = panelX + panelW - cssToGame(80);  // 80 CSS px from right edge
```

**Root Cause (two sub-causes):**

**2a. Toggle is absolutely massive for mobile.** A 60x30 CSS px toggle is very large. Standard iOS toggle switches are ~51x31 pt. At 60px wide in a panel that may only be ~319px CSS wide, the toggle alone consumes ~19% of panel width. This is disproportionate.

**2b. Label text and toggle compete for the same horizontal row with insufficient spacing.**

Layout math on iPhone SE (DPR=2, width=750):
- Panel left edge (`panelX`): `(750 - 637.5) / 2` = **56.25 px**
- Label starts at: `panelX + cssToGame(30)` = `56.25 + 60` = **116.25 px** (line 421/546)
- Toggle starts at: `panelX + panelW - cssToGame(80)` = `56.25 + 637.5 - 160` = **533.75 px** (line 440/565)
- Toggle ends at: `533.75 + 120` = **653.75 px**
- Available label width: `533.75 - 116.25` = **417.5 px** = ~209 CSS px

Labels at 15 CSS px (line 423, 548):
- "Звукові ефекти" (14 chars) ~ 120-130 CSS px wide
- "Анімації бустерів" (17 chars) ~ 145-160 CSS px wide

At first glance, 209 CSS px seems like enough. However, the toggle's right-margin logic places it only `cssToGame(80)` = 80 CSS px from panel right edge, but the toggle itself is 60 CSS px wide, meaning only 20 CSS px of breathing room between toggle right edge and panel right. Meanwhile the **visual gap between label end and toggle start** is ~50-80 CSS px -- which should be fine width-wise.

**The real overlap problem is at narrower viewports and with the toggle's visual weight:**

On a device with CSS width 320px (like older iPhones):
- Panel width: `Math.min(680, 0.85 * 640)` = `544 px` Phaser = 272 CSS px
- Label start: `panelX + 60` = `48 + 60` = `108 px` = 54 CSS px
- Toggle start: `48 + 544 - 160` = `432 px` = 216 CSS px
- Available for label: `432 - 108` = `324 px` = 162 CSS px
- "Анімації бустерів" at 15px ~ 145-160px -- **barely fits or overlaps**

Additionally, the toggle thumb has radius `cssToGame(12)` = 24 px Phaser = 12 CSS px, giving it a 24 CSS px diameter that **protrudes 6px above and below** the 30px toggle track (track center-aligned to row, thumb center-aligned to row, but thumb diameter 24 > half-track-height 15 -- wait, actually the thumb sits within the track since radius 12 < height/2 = 15). The visual bulk of the 60x30 toggle next to 15px text creates a feeling of overlap even when there's a small gap.

**What needs to change:** Scale toggle dimensions down (e.g., 44x22 CSS or smaller) and/or make them proportional to screen width. Optionally increase row left-padding or decrease label font slightly. The core issue is the fixed 60x30 CSS toggle size being too large for narrow mobile panels.

---

## Issue 3: Volume Slider Overlaps Its Label

**Lines 483-541:**
```typescript
// Volume row Y position (line 483):
const volumeRowY = panelY + cssToGame(145);

// Label (lines 485-493):
const volumeLabel = this.add.text(panelX + cssToGame(30), volumeRowY, 'Гучність', {
  fontSize: `${cssToGame(15)}px`,
});
volumeLabel.setOrigin(0, 0.5);

// Slider track (lines 495-496):
const sliderTrackX = panelX + panelW - cssToGame(160);  // <-- ROOT CAUSE
const sliderTrackW = cssToGame(140);                      // 140 CSS px wide track
```

**Root Cause (two sub-causes):**

**3a. Slider and label share the same row, and the slider is too wide.**

Layout math on iPhone SE (DPR=2, width=750):
- Label starts at: `panelX + cssToGame(30)` = `56.25 + 60` = **116.25 px**
- Slider track starts at: `panelX + panelW - cssToGame(160)` = `56.25 + 637.5 - 320` = **373.75 px**
- Available for label: `373.75 - 116.25` = **257.5 px** = ~129 CSS px
- "Гучність" (8 chars) at 15 CSS px ~ 75-85 CSS px -- fits here

But on narrower devices (320px CSS width):
- Slider track start: `48 + 544 - 320` = **272 px** = 136 CSS px from left
- Label starts at: `108 px` = 54 CSS px
- Available for label: `272 - 108` = **164 px** = 82 CSS px
- "Гучність" at 15px ~ 75-85 CSS px -- **right at the boundary, may clip or touch slider**

**3b. The slider thumb also protrudes beyond the track.**

```typescript
// Slider thumb (line 516):
const sliderThumb = this.add.circle(thumbX, volumeRowY, cssToGame(10), 0xFFFFFF);
```

The slider thumb has radius `cssToGame(10)` = 20 Phaser px = 10 CSS px. The thumb's left edge when volume=0 is at `sliderTrackX - 0` (centered at track start). So the thumb circle extends 10 CSS px to the LEFT of the track start, eating into the label space further.

Combined with the slider track being 140 CSS px wide and positioned `cssToGame(160)` = 160 CSS px from the panel right edge (leaving only 20 CSS px right margin for the track), the slider consumes a huge portion of the row.

**3c. The slider control (thumb) size is visually inconsistent with toggle size.**

- Toggle thumb: radius `cssToGame(12)` = 12 CSS px, diameter 24 CSS px
- Slider thumb: radius `cssToGame(10)` = 10 CSS px, diameter 20 CSS px
- Slider track height: `cssToGame(6)` = 6 CSS px
- But slider total width: 140 CSS px -- the visual footprint is much larger than the toggles (60 CSS px)

**What needs to change:**
1. Move the volume label and slider to **separate rows** (label on top, slider below) so they don't compete horizontally
2. Reduce slider track width to be proportional to toggle width
3. Reduce slider thumb size to match toggle thumb scale
4. This will require increasing overall panel height or adjusting row spacing to accommodate the extra row

---

## Summary Table

| Issue | Location (lines) | Root Cause | Key Value |
|-------|-------------------|------------|-----------|
| 1. Title too large | 407-409 | Fixed `cssToGame(22)` font size, not responsive to panel width | `fontSize: cssToGame(22)` |
| 2. Toggles overlap labels | 437, 441-442, 562 | Fixed toggle size `60x30` CSS px too large for narrow mobile panel; thumb radius `12` CSS px | `toggleWidth: cssToGame(60)`, `toggleHeight: cssToGame(30)` |
| 3. Slider overlaps label | 495-496, 516 | Slider (140px track + 10px thumb radius) shares single row with label; total slider footprint ~160 CSS px in a ~270-320px wide panel | `sliderTrackW: cssToGame(140)`, `sliderTrackX: panelW - cssToGame(160)` |

## Recommended Fix Direction

1. **Title:** Reduce to `cssToGame(18)` or compute from panel width (`panelW * 0.055` or similar)
2. **Toggles:** Reduce to ~`44x22` CSS px (or smaller), reduce thumb radius to ~9-10px CSS; this also frees horizontal space
3. **Volume slider:** Split into 2 rows -- label row at current Y, slider row ~25-30 CSS px below; reduce track width to ~100 CSS px; reduce thumb radius to ~8 CSS px to match scaled-down toggles
4. **Panel height:** Increase from `cssToGame(340)` to accommodate the extra volume row (e.g., `cssToGame(380)`)
5. **Row spacing:** Adjust all row Y offsets to account for new 2-row volume layout and smaller elements; close button Y also needs updating

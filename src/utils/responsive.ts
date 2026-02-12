/**
 * Responsive layout utilities for DPR-aware UI sizing.
 *
 * With Scale.RESIZE + zoom: 1/dpr, Phaser coords are in device pixels.
 * CSS pixels = Phaser pixels / dpr. To get desired CSS sizes, multiply by dpr.
 *
 * Example: 16px CSS font → 16 * dpr = 32px in Phaser coords on 2x device.
 */

// Get DPR (same logic as main.ts, capped at 3 for retina without perf issues)
export function getDpr(): number {
  return Math.min(window.devicePixelRatio || 2, 3);
}

// Scale a CSS pixel value to Phaser coordinates
export function cssToGame(cssPx: number): number {
  return cssPx * getDpr();
}

// Calculate responsive game layout based on current viewport
export function getResponsiveLayout(gameWidth: number, gameHeight: number) {
  const dpr = getDpr();

  // Effective CSS dimensions
  const cssWidth = gameWidth / dpr;
  const cssHeight = gameHeight / dpr;

  // Grid sizing: tile should be at least 40px CSS, at most 60px CSS
  // 8 tiles + margins need to fit in viewport width with padding
  const maxGridCssWidth = cssWidth - 20; // 10px padding each side in CSS
  const maxTileCss = Math.floor(maxGridCssWidth / 8);
  const tileSizeCss = Math.max(36, Math.min(60, maxTileCss));
  const tileSize = tileSizeCss * dpr; // Convert to Phaser coords

  // HUD height: enough for readable text + padding
  const hudHeight = cssToGame(60); // 60px CSS
  const hudFontSize = cssToGame(14); // 14px CSS — readable on all devices
  const hudPaddingTop = cssToGame(8);

  // Overlay panel: max 90% of viewport width, min 280px CSS
  const overlayPanelWidth = Math.min(cssToGame(380), gameWidth * 0.9);

  // Button sizing
  const buttonWidth = cssToGame(180);
  const buttonHeight = cssToGame(44);
  const buttonFontSize = cssToGame(18);

  // Title font size (overlays)
  const overlayTitleSize = cssToGame(20);
  const overlaySubtitleSize = cssToGame(16);

  // Back button
  const backButtonWidth = cssToGame(80);
  const backButtonHeight = cssToGame(36);
  const backButtonFontSize = cssToGame(14);

  return {
    dpr,
    cssWidth,
    cssHeight,
    tileSize,
    hudHeight,
    hudFontSize,
    hudPaddingTop,
    overlayPanelWidth,
    buttonWidth,
    buttonHeight,
    buttonFontSize,
    overlayTitleSize,
    overlaySubtitleSize,
    backButtonWidth,
    backButtonHeight,
    backButtonFontSize,
  };
}

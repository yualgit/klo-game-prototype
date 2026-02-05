/**
 * Game Scene - Main gameplay with 8x8 grid.
 * Displays tile placeholders and HUD.
 */

import Phaser from 'phaser';

// Design constants from STYLE_GUIDE.md
const KLO_YELLOW = 0xffb800;
const KLO_BLACK = 0x1a1a1a;
const KLO_WHITE = 0xf9f9f9;

// Grid constants from TECH_SPEC.md
const TILE_SIZE = 64;
const GRID_WIDTH = 8;
const GRID_HEIGHT = 8;

// Tile colors for placeholder visualization
const TILE_COLORS = [
  0xe74c3c, // Red (fuel)
  0x8b4513, // Brown (coffee)
  0x3498db, // Blue (snack)
  0x27ae60, // Green (road)
  0x9b59b6, // Purple (extra)
];

export class Game extends Phaser.Scene {
  private backButton: Phaser.GameObjects.Container;
  private hudText: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'Game' });
  }

  create(): void {
    console.log('[Game] Creating game scene');

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Reset scene state for restarts
    this.resetState();

    // Create HUD at top
    this.createHUD(width);

    // Create back button
    this.createBackButton();

    // Draw 8x8 grid with colored tile placeholders
    this.drawGrid(width, height);
  }

  private resetState(): void {
    // Reset any scene state here for proper restart handling
  }

  private createHUD(width: number): void {
    // HUD background
    const hudBg = this.add.graphics();
    hudBg.fillStyle(KLO_BLACK, 0.1);
    hudBg.fillRect(0, 0, width, 60);

    // Level and moves text
    this.hudText = this.add.text(width / 2, 30, 'Level 1  -  Moves: 20', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#1A1A1A',
      fontStyle: 'bold',
    });
    this.hudText.setOrigin(0.5);
  }

  private createBackButton(): void {
    const buttonWidth = 100;
    const buttonHeight = 40;

    // Button background
    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(KLO_WHITE, 1);
    buttonBg.lineStyle(2, KLO_BLACK, 1);
    buttonBg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
    buttonBg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);

    // Button text
    const buttonText = this.add.text(0, 0, '< Menu', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#1A1A1A',
    });
    buttonText.setOrigin(0.5);

    // Create container for button
    this.backButton = this.add.container(70, 30, [buttonBg, buttonText]);
    this.backButton.setSize(buttonWidth, buttonHeight);
    this.backButton.setInteractive({ useHandCursor: true });

    // Hover effects
    this.backButton.on('pointerover', () => {
      this.backButton.setScale(1.05);
    });

    this.backButton.on('pointerout', () => {
      this.backButton.setScale(1);
    });

    this.backButton.on('pointerup', () => {
      console.log('[Game] Back button clicked, returning to Menu');
      this.scene.start('Menu');
    });
  }

  private drawGrid(screenWidth: number, screenHeight: number): void {
    const gridPixelWidth = GRID_WIDTH * TILE_SIZE;
    const gridPixelHeight = GRID_HEIGHT * TILE_SIZE;

    // Center grid on screen, accounting for HUD at top
    const offsetX = (screenWidth - gridPixelWidth) / 2;
    const offsetY = (screenHeight - gridPixelHeight) / 2 + 30; // Offset for HUD

    // Draw grid background
    const gridBg = this.add.graphics();
    gridBg.fillStyle(KLO_BLACK, 0.05);
    gridBg.fillRoundedRect(
      offsetX - 10,
      offsetY - 10,
      gridPixelWidth + 20,
      gridPixelHeight + 20,
      12
    );

    // Draw tiles
    for (let row = 0; row < GRID_HEIGHT; row++) {
      for (let col = 0; col < GRID_WIDTH; col++) {
        const x = offsetX + col * TILE_SIZE + TILE_SIZE / 2;
        const y = offsetY + row * TILE_SIZE + TILE_SIZE / 2;

        // Random color from palette for placeholder effect
        const colorIndex = Math.floor(Math.random() * TILE_COLORS.length);
        const color = TILE_COLORS[colorIndex];

        this.drawTile(x, y, color);
      }
    }
  }

  private drawTile(x: number, y: number, color: number): void {
    const tileSize = TILE_SIZE - 4; // Small gap between tiles
    const graphics = this.add.graphics();

    // Tile background with rounded corners
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(
      x - tileSize / 2,
      y - tileSize / 2,
      tileSize,
      tileSize,
      8
    );

    // Subtle highlight at top
    graphics.fillStyle(0xffffff, 0.2);
    graphics.fillRoundedRect(
      x - tileSize / 2 + 4,
      y - tileSize / 2 + 4,
      tileSize - 8,
      tileSize / 3,
      4
    );
  }
}

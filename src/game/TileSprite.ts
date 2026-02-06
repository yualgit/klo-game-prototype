/**
 * TileSprite - Phaser sprite wrapper for match-3 tiles.
 * Displays colored tiles based on type with programmatic drawing.
 * Designed for object pooling with reset capability.
 */

import Phaser from 'phaser';
import { TILE_COLORS, TILE_SIZE, TILE_GAP, TileType } from './constants';
import { BoosterType, ObstacleData } from './types';

// Grid offset configuration (can be set per-instance or use defaults)
const DEFAULT_OFFSET_X = 100;
const DEFAULT_OFFSET_Y = 100;

export class TileSprite extends Phaser.GameObjects.Container {
  // Public properties for engine synchronization
  public row: number;
  public col: number;
  public type: TileType;

  // Private graphics object for tile rendering
  private graphics: Phaser.GameObjects.Graphics;
  private selected: boolean = false;

  // Booster and obstacle state
  private boosterType?: BoosterType;
  private obstacleData?: ObstacleData;
  private boosterGraphics: Phaser.GameObjects.Graphics;
  private obstacleGraphics: Phaser.GameObjects.Graphics;
  private layerCountText?: Phaser.GameObjects.Text;

  // Grid offset for positioning
  private offsetX: number;
  private offsetY: number;

  constructor(
    scene: Phaser.Scene,
    row: number,
    col: number,
    type: TileType,
    offsetX: number = DEFAULT_OFFSET_X,
    offsetY: number = DEFAULT_OFFSET_Y
  ) {
    super(scene, 0, 0);

    this.row = row;
    this.col = col;
    this.type = type;
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    // Create graphics objects for drawing
    this.graphics = scene.add.graphics();
    this.obstacleGraphics = scene.add.graphics();
    this.boosterGraphics = scene.add.graphics();

    this.add(this.graphics);
    this.add(this.obstacleGraphics);
    this.add(this.boosterGraphics);

    // Calculate initial position and draw
    this.updatePosition();
    this.draw();

    // Add to scene
    scene.add.existing(this);
  }

  /**
   * Draw the tile with current type and selected state.
   * Uses rounded rectangle with color from TILE_COLORS and highlight effect.
   */
  private draw(): void {
    this.graphics.clear();

    const tileSize = TILE_SIZE - TILE_GAP;
    const halfSize = tileSize / 2;
    const color = TILE_COLORS[this.type];

    // Main tile background with rounded corners
    this.graphics.fillStyle(color, 1);
    this.graphics.fillRoundedRect(-halfSize, -halfSize, tileSize, tileSize, 8);

    // Subtle highlight at top for depth effect
    this.graphics.fillStyle(0xffffff, 0.2);
    this.graphics.fillRoundedRect(
      -halfSize + 4,
      -halfSize + 4,
      tileSize - 8,
      tileSize / 3,
      4
    );

    // Selection state: add glow effect
    if (this.selected) {
      this.graphics.lineStyle(4, 0xffffff, 0.8);
      this.graphics.strokeRoundedRect(-halfSize, -halfSize, tileSize, tileSize, 8);
    }

    // Draw obstacle overlay
    this.drawObstacle();

    // Draw booster overlay
    this.drawBooster();
  }

  /**
   * Update tile type and redraw.
   */
  public setType(type: TileType): void {
    this.type = type;
    this.draw();
  }

  /**
   * Set booster type and redraw.
   */
  public setBooster(boosterType?: BoosterType): void {
    this.boosterType = boosterType;
    this.draw();
  }

  /**
   * Set obstacle data and redraw.
   */
  public setObstacle(obstacle?: ObstacleData): void {
    this.obstacleData = obstacle;
    this.draw();
  }

  /**
   * Update grid position (row/col) and recalculate screen position.
   */
  public setGridPosition(row: number, col: number): void {
    this.row = row;
    this.col = col;
    this.updatePosition();
  }

  /**
   * Set selected state and update visual appearance.
   */
  public setSelected(selected: boolean): void {
    this.selected = selected;
    this.draw();

    // Add scale effect for better visual feedback
    if (selected) {
      this.setScale(1.1);
    } else {
      this.setScale(1.0);
    }
  }

  /**
   * Reset tile for object pooling reuse.
   * Sets new type, position, and redraws.
   */
  public reset(type: TileType, row: number, col: number): void {
    this.type = type;
    this.row = row;
    this.col = col;
    this.selected = false;
    this.boosterType = undefined;
    this.obstacleData = undefined;
    this.setScale(1.0);
    this.boosterGraphics.clear();
    this.obstacleGraphics.clear();
    if (this.layerCountText) {
      this.layerCountText.destroy();
      this.layerCountText = undefined;
    }
    this.updatePosition();
    this.draw();
  }

  /**
   * Calculate screen position from grid coordinates.
   */
  private updatePosition(): void {
    this.x = this.offsetX + this.col * TILE_SIZE + TILE_SIZE / 2;
    this.y = this.offsetY + this.row * TILE_SIZE + TILE_SIZE / 2;
  }

  /**
   * Set grid offset for positioning calculations.
   * Useful for centering grid on screen.
   */
  public setOffset(offsetX: number, offsetY: number): void {
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.updatePosition();
  }

  /**
   * Draw booster overlay on tile.
   */
  private drawBooster(): void {
    this.boosterGraphics.clear();

    if (!this.boosterType) return;

    const tileSize = TILE_SIZE - TILE_GAP;
    const halfSize = tileSize / 2;

    this.boosterGraphics.lineStyle(3, 0xffffff, 1);

    switch (this.boosterType) {
      case 'linear_horizontal':
        // Horizontal arrow bar
        this.boosterGraphics.fillStyle(0xffffff, 0.9);
        this.boosterGraphics.fillRect(-halfSize + 10, -5, tileSize - 20, 10);
        // Arrow heads
        this.boosterGraphics.beginPath();
        this.boosterGraphics.moveTo(halfSize - 10, 0);
        this.boosterGraphics.lineTo(halfSize - 18, -6);
        this.boosterGraphics.lineTo(halfSize - 18, 6);
        this.boosterGraphics.closePath();
        this.boosterGraphics.fillPath();
        this.boosterGraphics.beginPath();
        this.boosterGraphics.moveTo(-halfSize + 10, 0);
        this.boosterGraphics.lineTo(-halfSize + 18, -6);
        this.boosterGraphics.lineTo(-halfSize + 18, 6);
        this.boosterGraphics.closePath();
        this.boosterGraphics.fillPath();
        break;

      case 'linear_vertical':
        // Vertical arrow bar
        this.boosterGraphics.fillStyle(0xffffff, 0.9);
        this.boosterGraphics.fillRect(-5, -halfSize + 10, 10, tileSize - 20);
        // Arrow heads
        this.boosterGraphics.beginPath();
        this.boosterGraphics.moveTo(0, halfSize - 10);
        this.boosterGraphics.lineTo(-6, halfSize - 18);
        this.boosterGraphics.lineTo(6, halfSize - 18);
        this.boosterGraphics.closePath();
        this.boosterGraphics.fillPath();
        this.boosterGraphics.beginPath();
        this.boosterGraphics.moveTo(0, -halfSize + 10);
        this.boosterGraphics.lineTo(-6, -halfSize + 18);
        this.boosterGraphics.lineTo(6, -halfSize + 18);
        this.boosterGraphics.closePath();
        this.boosterGraphics.fillPath();
        break;

      case 'bomb':
        // Star shape using lines to create * pattern
        this.boosterGraphics.lineStyle(4, 0xffffff, 0.9);
        const starSize = 20;
        // Vertical line
        this.boosterGraphics.lineBetween(0, -starSize, 0, starSize);
        // Horizontal line
        this.boosterGraphics.lineBetween(-starSize, 0, starSize, 0);
        // Diagonal lines
        const diag = starSize * 0.707; // 45 degrees
        this.boosterGraphics.lineBetween(-diag, -diag, diag, diag);
        this.boosterGraphics.lineBetween(-diag, diag, diag, -diag);
        break;

      case 'klo_sphere':
        // Glowing circle
        this.boosterGraphics.fillStyle(0xffffff, 0.8);
        this.boosterGraphics.fillCircle(0, 0, 15);
        // Inner glow
        this.boosterGraphics.fillStyle(0xffffff, 0.4);
        this.boosterGraphics.fillCircle(0, 0, 20);
        break;
    }
  }

  /**
   * Draw obstacle overlay on tile.
   */
  private drawObstacle(): void {
    this.obstacleGraphics.clear();

    if (!this.obstacleData) {
      // Clean up layer count text if no obstacle
      if (this.layerCountText) {
        this.layerCountText.destroy();
        this.layerCountText = undefined;
      }
      return;
    }

    const tileSize = TILE_SIZE - TILE_GAP;
    const halfSize = tileSize / 2;

    switch (this.obstacleData.type) {
      case 'ice':
        // Semi-transparent light blue overlay
        this.obstacleGraphics.fillStyle(0x87ceeb, 0.5);
        this.obstacleGraphics.fillRoundedRect(-halfSize, -halfSize, tileSize, tileSize, 8);
        // White highlight in top-left corner
        this.obstacleGraphics.fillStyle(0xffffff, 0.6);
        this.obstacleGraphics.fillCircle(-halfSize + 10, -halfSize + 10, 8);
        break;

      case 'dirt':
        // Semi-transparent brown overlay
        this.obstacleGraphics.fillStyle(0x8b4513, 0.7);
        this.obstacleGraphics.fillRoundedRect(-halfSize, -halfSize, tileSize, tileSize, 8);
        break;

      case 'crate':
        // Brown stroke border with cross lines
        this.obstacleGraphics.lineStyle(3, 0x8b4513, 0.8);
        this.obstacleGraphics.strokeRoundedRect(-halfSize, -halfSize, tileSize, tileSize, 8);
        // Cross lines
        this.obstacleGraphics.lineBetween(-halfSize, 0, halfSize, 0); // Horizontal
        this.obstacleGraphics.lineBetween(0, -halfSize, 0, halfSize); // Vertical
        break;

      case 'blocked':
        // Dark gray fill
        this.obstacleGraphics.fillStyle(0x333333, 0.9);
        this.obstacleGraphics.fillRoundedRect(-halfSize, -halfSize, tileSize, tileSize, 8);
        // Red X diagonal lines
        this.obstacleGraphics.lineStyle(4, 0xff0000, 0.8);
        this.obstacleGraphics.lineBetween(-halfSize + 10, -halfSize + 10, halfSize - 10, halfSize - 10);
        this.obstacleGraphics.lineBetween(-halfSize + 10, halfSize - 10, halfSize - 10, -halfSize + 10);
        break;
    }

    // Layer count display for multi-layer obstacles
    if (this.obstacleData.layers > 1) {
      if (!this.layerCountText) {
        this.layerCountText = this.scene.add.text(
          halfSize - 15,
          halfSize - 15,
          String(this.obstacleData.layers),
          {
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            color: '#ffffff',
            fontStyle: 'bold',
          }
        );
        this.add(this.layerCountText);
      } else {
        this.layerCountText.setText(String(this.obstacleData.layers));
      }
    } else {
      // Remove layer count text if layers <= 1
      if (this.layerCountText) {
        this.layerCountText.destroy();
        this.layerCountText = undefined;
      }
    }
  }
}

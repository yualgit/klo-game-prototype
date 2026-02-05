/**
 * TileSprite - Phaser sprite wrapper for match-3 tiles.
 * Displays colored tiles based on type with programmatic drawing.
 * Designed for object pooling with reset capability.
 */

import Phaser from 'phaser';
import { TILE_COLORS, TILE_SIZE, TILE_GAP, TileType } from './constants';

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

    // Create graphics object for drawing
    this.graphics = scene.add.graphics();
    this.add(this.graphics);

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
  }

  /**
   * Update tile type and redraw.
   */
  public setType(type: TileType): void {
    this.type = type;
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
    this.setScale(1.0);
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
}

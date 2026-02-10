/**
 * TileSprite - Phaser sprite wrapper for match-3 tiles.
 * Displays colored tiles based on type with programmatic drawing.
 * Designed for object pooling with reset capability.
 */

import Phaser from 'phaser';
import { TILE_COLORS, TILE_SIZE, TILE_GAP, TileType, TEXTURE_KEYS, OBSTACLE_TEXTURE_KEYS, BOOSTER_TEXTURE_KEYS } from './constants';
import { BoosterType, ObstacleData } from './types';

// Grid offset configuration (can be set per-instance or use defaults)
const DEFAULT_OFFSET_X = 100;
const DEFAULT_OFFSET_Y = 100;

export class TileSprite extends Phaser.GameObjects.Container {
  // Public properties for engine synchronization
  public row: number;
  public col: number;
  public type: TileType;

  // Private image object for tile rendering
  private tileImage: Phaser.GameObjects.Image;
  private selected: boolean = false;

  // Booster and obstacle state
  private boosterType?: BoosterType;
  private obstacleData?: ObstacleData;
  private boosterGraphics: Phaser.GameObjects.Graphics;
  private boosterImage?: Phaser.GameObjects.Image;
  private boosterIdleTween?: Phaser.Tweens.Tween;
  private obstacleGraphics: Phaser.GameObjects.Graphics;
  private obstacleImage?: Phaser.GameObjects.Image;
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

    // Create tile image using texture from TEXTURE_KEYS
    const textureKey = TEXTURE_KEYS[type];
    this.tileImage = scene.add.image(0, 0, textureKey);
    // Scale image to fit tile size (assets are large, ~400-500px, need to fit ~60px tile)
    const targetSize = TILE_SIZE - TILE_GAP;
    this.tileImage.setDisplaySize(targetSize, targetSize);
    this.add(this.tileImage);

    // Create graphics objects for drawing overlays
    this.obstacleGraphics = scene.add.graphics();
    this.boosterGraphics = scene.add.graphics();

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
   * Uses PNG Image sprites instead of programmatic Graphics drawing.
   */
  private draw(): void {
    // Update tile image texture
    const textureKey = TEXTURE_KEYS[this.type];
    if (this.scene.textures.exists(textureKey)) {
      this.tileImage.setTexture(textureKey);
    }
    const targetSize = TILE_SIZE - TILE_GAP;
    this.tileImage.setDisplaySize(targetSize, targetSize);

    // Selection state: add glow effect via tint
    if (this.selected) {
      this.tileImage.setTint(0xffffcc); // Slight yellow tint for selection
    } else {
      this.tileImage.clearTint();
    }

    // Draw obstacle overlay
    this.drawObstacle();

    // Draw booster overlay (keep Graphics-based for booster overlays - arrows, stars, circles)
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
    this.setScale(selected ? 1.1 : 1.0);
  }

  /**
   * Reset tile for object pooling reuse.
   * Sets new type, position, and redraws.
   */
  public reset(type: TileType, row: number, col: number): void {
    // Cleanup booster tween and image
    if (this.boosterIdleTween) {
      this.boosterIdleTween.stop();
      this.boosterIdleTween.remove();
      this.boosterIdleTween = undefined;
    }
    if (this.boosterImage) {
      this.boosterImage.destroy();
      this.boosterImage = undefined;
    }

    this.type = type;
    this.row = row;
    this.col = col;
    this.selected = false;
    this.boosterType = undefined;
    this.obstacleData = undefined;
    this.setScale(1.0);
    this.boosterGraphics.clear();
    this.obstacleGraphics.clear();
    if (this.obstacleImage) {
      this.obstacleImage.destroy();
      this.obstacleImage = undefined;
    }
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
   * Draw booster overlay on tile using sprite images with idle animations.
   */
  private drawBooster(): void {
    // Clear old Graphics-based drawing (safety measure)
    this.boosterGraphics.clear();

    // Remove old booster image and tween if exists
    if (this.boosterIdleTween) {
      this.boosterIdleTween.stop();
      this.boosterIdleTween.remove();
      this.boosterIdleTween = undefined;
    }
    if (this.boosterImage) {
      this.boosterImage.destroy();
      this.boosterImage = undefined;
    }

    // Early return if no booster
    if (!this.boosterType) return;

    // Look up texture key from BOOSTER_TEXTURE_KEYS
    const textureKey = BOOSTER_TEXTURE_KEYS[this.boosterType];

    // Create booster image sprite if texture exists
    if (textureKey && this.scene.textures.exists(textureKey)) {
      this.boosterImage = this.scene.add.image(0, 0, textureKey);
      const targetSize = TILE_SIZE - TILE_GAP;
      this.boosterImage.setDisplaySize(targetSize, targetSize);
      this.add(this.boosterImage);

      // Add subtle idle animation effect
      this.addBoosterIdleEffect();
    }
  }

  /**
   * Add subtle idle animation effect to booster image.
   * Each booster type gets a unique barely-noticeable effect.
   */
  private addBoosterIdleEffect(): void {
    if (!this.boosterImage || !this.boosterType) return;

    // Stop existing tween
    if (this.boosterIdleTween) {
      this.boosterIdleTween.stop();
      this.boosterIdleTween.remove();
      this.boosterIdleTween = undefined;
    }

    switch (this.boosterType) {
      case 'bomb':
        // Subtle pulse: scale 1.0 -> 1.03 over 1.2s
        this.boosterIdleTween = this.scene.tweens.add({
          targets: this.boosterImage,
          scaleX: 1.03,
          scaleY: 1.03,
          duration: 600,
          ease: 'Sine.InOut',
          yoyo: true,
          repeat: -1,
        });
        break;

      case 'linear_horizontal':
        // Subtle horizontal shimmer: alpha 0.88 -> 1.0 over 0.8s
        this.boosterIdleTween = this.scene.tweens.add({
          targets: this.boosterImage,
          alpha: 0.88,
          duration: 400,
          ease: 'Sine.InOut',
          yoyo: true,
          repeat: -1,
        });
        break;

      case 'linear_vertical':
        // Subtle vertical shimmer: alpha 0.88 -> 1.0 over 0.8s (same as horizontal)
        this.boosterIdleTween = this.scene.tweens.add({
          targets: this.boosterImage,
          alpha: 0.88,
          duration: 400,
          ease: 'Sine.InOut',
          yoyo: true,
          repeat: -1,
        });
        break;

      case 'klo_sphere':
        // Subtle slow rotation: 0 -> 360 degrees over 6s
        this.boosterIdleTween = this.scene.tweens.add({
          targets: this.boosterImage,
          angle: 360,
          duration: 6000,
          ease: 'Linear',
          repeat: -1,
        });
        break;
    }
  }

  /**
   * Draw obstacle overlay on tile.
   * Uses PNG sprites for ice, dirt, and crate obstacles.
   */
  private drawObstacle(): void {
    // Clear old graphics-based obstacle
    this.obstacleGraphics.clear();

    // Remove old obstacle image if exists
    if (this.obstacleImage) {
      this.obstacleImage.destroy();
      this.obstacleImage = undefined;
    }

    if (!this.obstacleData) {
      if (this.layerCountText) {
        this.layerCountText.destroy();
        this.layerCountText = undefined;
      }
      return;
    }

    const targetSize = TILE_SIZE - TILE_GAP;
    const halfSize = targetSize / 2;

    switch (this.obstacleData.type) {
      case 'ice': {
        // Use ice01/02/03 based on layers remaining (3=ice01 full, 2=ice02 cracked, 1=ice03 broken)
        const iceKeys = OBSTACLE_TEXTURE_KEYS.ice;
        // layers 3->ice01 (full), 2->ice02 (cracked), 1->ice03 (most broken)
        const idx = Math.max(0, Math.min(2, 3 - this.obstacleData.layers));
        const key = iceKeys[idx];
        this.obstacleImage = this.scene.add.image(0, 0, key);
        this.obstacleImage.setDisplaySize(targetSize, targetSize);
        this.obstacleImage.setAlpha(0.85);
        this.add(this.obstacleImage);
        break;
      }
      case 'grass': {
        // Use grass sprites for grass (grss01/02/03 based on layers)
        const grassKeys = OBSTACLE_TEXTURE_KEYS.grass;
        const idx = Math.max(0, Math.min(2, 3 - this.obstacleData.layers));
        const key = grassKeys[idx];
        this.obstacleImage = this.scene.add.image(0, 0, key);
        this.obstacleImage.setDisplaySize(targetSize, targetSize);
        this.obstacleImage.setAlpha(0.85);
        this.add(this.obstacleImage);
        break;
      }
      case 'crate': {
        // Per user decision: bubble.png = 1-hit blocker. 'crate' IS the 1-hit blocker type.
        // Display bubble.png sprite for crate obstacles.
        const crateKey = OBSTACLE_TEXTURE_KEYS.crate; // 'obstacle_bubble'
        this.obstacleImage = this.scene.add.image(0, 0, crateKey);
        this.obstacleImage.setDisplaySize(targetSize, targetSize);
        this.obstacleImage.setAlpha(0.9);
        this.add(this.obstacleImage);
        break;
      }
      case 'blocked': {
        // Keep programmatic blocked cell (dark gray with red X) — no asset available
        this.obstacleGraphics.fillStyle(0x333333, 0.9);
        this.obstacleGraphics.fillRoundedRect(-halfSize, -halfSize, targetSize, targetSize, 8);
        this.obstacleGraphics.lineStyle(4, 0xff0000, 0.8);
        this.obstacleGraphics.lineBetween(-halfSize + 10, -halfSize + 10, halfSize - 10, halfSize - 10);
        this.obstacleGraphics.lineBetween(-halfSize + 10, halfSize - 10, halfSize - 10, -halfSize + 10);
        break;
      }
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

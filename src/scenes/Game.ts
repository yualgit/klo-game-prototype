/**
 * Game Scene - Main gameplay with 8x8 grid.
 * Integrates Match3Engine and TileSprite for full gameplay.
 */

import Phaser from 'phaser';
import { Match3Engine } from '../game/Match3Engine';
import { TileSprite } from '../game/TileSprite';
import { TileData, SpawnRules } from '../game/types';
import { TILE_SIZE } from '../utils/constants';

// Design constants from STYLE_GUIDE.md
const KLO_YELLOW = 0xffb800;
const KLO_BLACK = 0x1a1a1a;
const KLO_WHITE = 0xf9f9f9;

// Grid constants from TECH_SPEC.md
const GRID_WIDTH = 8;
const GRID_HEIGHT = 8;

export class Game extends Phaser.Scene {
  // UI elements
  private backButton: Phaser.GameObjects.Container;
  private hudText: Phaser.GameObjects.Text;

  // Game engine and state
  private engine: Match3Engine;
  private tileSprites: TileSprite[][] = [];
  private isProcessing: boolean = false;
  private selectedTile: TileSprite | null = null;

  // Grid positioning
  private gridOffsetX: number;
  private gridOffsetY: number;

  // Level data
  private levelData: any;

  // Input tracking
  private dragStartX: number = 0;
  private dragStartY: number = 0;

  constructor() {
    super({ key: 'Game' });
  }

  create(): void {
    console.log('[Game] Creating game scene');

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Reset scene state for restarts
    this.resetState();

    // Load level data
    this.levelData = this.cache.json.get('level_001');
    console.log('[Game] Level data loaded:', this.levelData);

    // Calculate grid offsets (center on screen with HUD offset)
    const gridPixelWidth = GRID_WIDTH * TILE_SIZE;
    const gridPixelHeight = GRID_HEIGHT * TILE_SIZE;
    this.gridOffsetX = (width - gridPixelWidth) / 2;
    this.gridOffsetY = (height - gridPixelHeight) / 2 + 30; // Offset for HUD

    // Initialize engine and generate grid
    this.engine = new Match3Engine(GRID_HEIGHT, GRID_WIDTH);
    const spawnRules: SpawnRules = this.levelData.spawn_rules;
    this.engine.generateGrid(spawnRules);

    // Create HUD at top
    this.createHUD(width);

    // Create back button
    this.createBackButton();

    // Draw grid background
    this.drawGridBackground();

    // Create tiles from engine state
    this.createTilesFromEngine();

    // Setup input handling
    this.setupInput();
  }

  private resetState(): void {
    // Reset any scene state here for proper restart handling
    this.tileSprites = [];
    this.isProcessing = false;
    this.selectedTile = null;
  }

  private createHUD(width: number): void {
    // HUD background
    const hudBg = this.add.graphics();
    hudBg.fillStyle(KLO_BLACK, 0.1);
    hudBg.fillRect(0, 0, width, 60);

    // Level and moves text
    const moves = this.levelData?.moves || 20;
    this.hudText = this.add.text(width / 2, 30, `Level 1  -  Moves: ${moves}`, {
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

  private drawGridBackground(): void {
    const gridPixelWidth = GRID_WIDTH * TILE_SIZE;
    const gridPixelHeight = GRID_HEIGHT * TILE_SIZE;

    // Draw grid background
    const gridBg = this.add.graphics();
    gridBg.fillStyle(KLO_BLACK, 0.05);
    gridBg.fillRoundedRect(
      this.gridOffsetX - 10,
      this.gridOffsetY - 10,
      gridPixelWidth + 20,
      gridPixelHeight + 20,
      12
    );
  }

  /**
   * Create TileSprite objects from engine grid state
   */
  private createTilesFromEngine(): void {
    const grid: TileData[][] = this.engine.getGrid();

    // Initialize 2D array
    this.tileSprites = [];

    for (let row = 0; row < GRID_HEIGHT; row++) {
      this.tileSprites[row] = [];
      for (let col = 0; col < GRID_WIDTH; col++) {
        const tileData = grid[row][col];

        // Engine should never generate empty tiles, but safeguard
        const tileType = tileData.type === 'empty' ? 'fuel' : tileData.type;

        // Create TileSprite
        const tile = new TileSprite(
          this,
          row,
          col,
          tileType as 'fuel' | 'coffee' | 'snack' | 'road',
          this.gridOffsetX,
          this.gridOffsetY
        );

        // Make interactive - Containers need explicit hit area
        const hitArea = new Phaser.Geom.Rectangle(
          -TILE_SIZE / 2,
          -TILE_SIZE / 2,
          TILE_SIZE,
          TILE_SIZE
        );
        tile.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        // Store in array
        this.tileSprites[row][col] = tile;
      }
    }

    console.log('[Game] Created', GRID_HEIGHT * GRID_WIDTH, 'tiles from engine state');
  }

  /**
   * Setup input handling for tap and swipe
   */
  private setupInput(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isProcessing) return;

      this.dragStartX = pointer.x;
      this.dragStartY = pointer.y;

      // Find tile at pointer
      const tile = this.getTileAtPointer(pointer);
      if (tile) {
        // Clear previous selection
        if (this.selectedTile && this.selectedTile !== tile) {
          this.selectedTile.setSelected(false);
        }

        // Set new selection
        this.selectedTile = tile;
        tile.setSelected(true);
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.isProcessing || !this.selectedTile) return;

      const dx = pointer.x - this.dragStartX;
      const dy = pointer.y - this.dragStartY;
      const SWIPE_THRESHOLD = 30;

      // Check if it's a swipe or tap
      if (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(dy) > SWIPE_THRESHOLD) {
        // Swipe detected - determine direction
        let targetTile: TileSprite | null = null;

        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal swipe
          if (dx > 0 && this.selectedTile.col < GRID_WIDTH - 1) {
            targetTile = this.tileSprites[this.selectedTile.row][this.selectedTile.col + 1];
          } else if (dx < 0 && this.selectedTile.col > 0) {
            targetTile = this.tileSprites[this.selectedTile.row][this.selectedTile.col - 1];
          }
        } else {
          // Vertical swipe
          if (dy > 0 && this.selectedTile.row < GRID_HEIGHT - 1) {
            targetTile = this.tileSprites[this.selectedTile.row + 1][this.selectedTile.col];
          } else if (dy < 0 && this.selectedTile.row > 0) {
            targetTile = this.tileSprites[this.selectedTile.row - 1][this.selectedTile.col];
          }
        }

        if (targetTile) {
          this.onTileSwap(this.selectedTile, targetTile);
          this.selectedTile.setSelected(false);
          this.selectedTile = null;
        }
      } else {
        // Tap detected - check for adjacent tile tap
        const tappedTile = this.getTileAtPointer(pointer);
        if (tappedTile && tappedTile !== this.selectedTile) {
          if (this.isAdjacent(this.selectedTile, tappedTile)) {
            this.onTileSwap(this.selectedTile, tappedTile);
            this.selectedTile.setSelected(false);
            this.selectedTile = null;
          } else {
            // Not adjacent - select new tile
            this.selectedTile.setSelected(false);
            this.selectedTile = tappedTile;
            tappedTile.setSelected(true);
          }
        }
      }
    });
  }

  /**
   * Get tile at pointer position
   */
  private getTileAtPointer(pointer: Phaser.Input.Pointer): TileSprite | null {
    const col = Math.floor((pointer.x - this.gridOffsetX) / TILE_SIZE);
    const row = Math.floor((pointer.y - this.gridOffsetY) / TILE_SIZE);

    if (row >= 0 && row < GRID_HEIGHT && col >= 0 && col < GRID_WIDTH) {
      return this.tileSprites[row][col];
    }

    return null;
  }

  /**
   * Check if two tiles are adjacent
   */
  private isAdjacent(t1: TileSprite, t2: TileSprite): boolean {
    const rowDiff = Math.abs(t1.row - t2.row);
    const colDiff = Math.abs(t1.col - t2.col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }

  /**
   * Handle tile swap with animation and cascade
   */
  private async onTileSwap(tile1: TileSprite, tile2: TileSprite): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    console.log('[Game] Swapping tiles:', tile1.row, tile1.col, '<->', tile2.row, tile2.col);

    // Swap in engine
    this.engine.swapTiles(tile1.row, tile1.col, tile2.row, tile2.col);

    // Animate the swap
    await Promise.all([
      this.tweenAsync({
        targets: tile1,
        x: this.gridOffsetX + tile2.col * TILE_SIZE + TILE_SIZE / 2,
        y: this.gridOffsetY + tile2.row * TILE_SIZE + TILE_SIZE / 2,
        duration: 150,
        ease: 'Power2',
      }),
      this.tweenAsync({
        targets: tile2,
        x: this.gridOffsetX + tile1.col * TILE_SIZE + TILE_SIZE / 2,
        y: this.gridOffsetY + tile1.row * TILE_SIZE + TILE_SIZE / 2,
        duration: 150,
        ease: 'Power2',
      }),
    ]);

    // Update sprite positions in array
    const tempRow = tile1.row;
    const tempCol = tile1.col;
    tile1.row = tile2.row;
    tile1.col = tile2.col;
    tile2.row = tempRow;
    tile2.col = tempCol;

    this.tileSprites[tile1.row][tile1.col] = tile1;
    this.tileSprites[tile2.row][tile2.col] = tile2;

    // Check for matches
    const matches = this.engine.findMatches();

    if (matches.length === 0) {
      // Invalid swap - revert
      console.log('[Game] No matches, reverting swap');

      this.engine.swapTiles(tile1.row, tile1.col, tile2.row, tile2.col);

      await Promise.all([
        this.tweenAsync({
          targets: tile1,
          x: this.gridOffsetX + tile2.col * TILE_SIZE + TILE_SIZE / 2,
          y: this.gridOffsetY + tile2.row * TILE_SIZE + TILE_SIZE / 2,
          duration: 150,
          ease: 'Power2',
        }),
        this.tweenAsync({
          targets: tile2,
          x: this.gridOffsetX + tile1.col * TILE_SIZE + TILE_SIZE / 2,
          y: this.gridOffsetY + tile1.row * TILE_SIZE + TILE_SIZE / 2,
          duration: 150,
          ease: 'Power2',
        }),
      ]);

      // Revert sprite positions
      const tempRow2 = tile1.row;
      const tempCol2 = tile1.col;
      tile1.row = tile2.row;
      tile1.col = tile2.col;
      tile2.row = tempRow2;
      tile2.col = tempCol2;

      this.tileSprites[tile1.row][tile1.col] = tile1;
      this.tileSprites[tile2.row][tile2.col] = tile2;

      this.isProcessing = false;
    } else {
      // Valid swap - process cascade
      console.log('[Game] Valid swap, processing cascade');
      await this.processCascade();

      // Check for valid moves, reshuffle if needed
      if (!this.engine.hasValidMoves()) {
        console.log('[Game] No valid moves, reshuffling board');
        this.engine.reshuffleBoard();
        this.syncSpritesToEngine();
      }

      this.isProcessing = false;
    }
  }

  /**
   * Wrap Phaser tween in Promise for async/await
   */
  private tweenAsync(config: Phaser.Types.Tweens.TweenBuilderConfig): Promise<void> {
    return new Promise((resolve) => {
      this.tweens.add({
        ...config,
        onComplete: () => resolve(),
      });
    });
  }

  /**
   * Process cascade: match removal -> gravity -> spawn -> repeat
   */
  private async processCascade(): Promise<void> {
    let depth = 0;
    const MAX_DEPTH = 20;

    while (depth < MAX_DEPTH) {
      const matches = this.engine.findMatches();
      if (matches.length === 0) break;

      depth++;
      console.log('[Game] Cascade depth:', depth, 'Matches:', matches.length);

      // Animate match removal
      await this.animateMatchRemoval(matches);

      // Remove matches in engine
      this.engine.removeMatches(matches);

      // Apply gravity and get movements
      const movements = this.engine.applyGravity();

      // Animate movements
      if (movements.length > 0) {
        await this.animateMovements(movements);
      }

      // Spawn new tiles
      const spawnRules: SpawnRules = this.levelData.spawn_rules;
      const spawns = this.engine.spawnNewTiles(spawnRules);

      // Animate new tiles
      if (spawns.length > 0) {
        await this.animateNewTiles(spawns);
      }

      // Sync sprites with engine state
      this.syncSpritesToEngine();
    }

    console.log('[Game] Cascade complete, depth:', depth);
  }

  /**
   * Animate match removal with fade and shrink
   */
  private async animateMatchRemoval(matches: any[]): Promise<void> {
    const tweens: Promise<void>[] = [];

    matches.forEach((match) => {
      match.tiles.forEach((tileData: TileData) => {
        const sprite = this.tileSprites[tileData.row][tileData.col];

        tweens.push(
          this.tweenAsync({
            targets: sprite,
            scale: 0,
            alpha: 0,
            duration: 200,
            ease: 'Power2',
          })
        );
      });
    });

    await Promise.all(tweens);
  }

  /**
   * Animate tile movements from gravity
   */
  private async animateMovements(movements: any[]): Promise<void> {
    const tweens: Promise<void>[] = [];

    movements.forEach((movement) => {
      const sprite = this.tileSprites[movement.fromRow][movement.fromCol];

      tweens.push(
        this.tweenAsync({
          targets: sprite,
          x: this.gridOffsetX + movement.toCol * TILE_SIZE + TILE_SIZE / 2,
          y: this.gridOffsetY + movement.toRow * TILE_SIZE + TILE_SIZE / 2,
          duration: 150,
          ease: 'Power2',
        })
      );
    });

    await Promise.all(tweens);
  }

  /**
   * Animate new tiles falling from top
   */
  private async animateNewTiles(spawns: any[]): Promise<void> {
    const tweens: Promise<void>[] = [];

    spawns.forEach((spawn, index) => {
      const sprite = this.tileSprites[spawn.row][spawn.col];

      // Set type and position above screen (safeguard against empty type)
      const tileType = spawn.type === 'empty' ? 'fuel' : spawn.type;
      sprite.setType(tileType as 'fuel' | 'coffee' | 'snack' | 'road');
      sprite.x = this.gridOffsetX + spawn.col * TILE_SIZE + TILE_SIZE / 2;
      sprite.y = this.gridOffsetY - (index + 1) * TILE_SIZE;
      sprite.setScale(1);
      sprite.setAlpha(1);

      // Tween to final position
      tweens.push(
        this.tweenAsync({
          targets: sprite,
          y: this.gridOffsetY + spawn.row * TILE_SIZE + TILE_SIZE / 2,
          duration: 150,
          ease: 'Bounce.easeOut',
        })
      );
    });

    await Promise.all(tweens);
  }

  /**
   * Sync sprite array with engine grid state
   */
  private syncSpritesToEngine(): void {
    const grid: TileData[][] = this.engine.getGrid();

    for (let row = 0; row < GRID_HEIGHT; row++) {
      for (let col = 0; col < GRID_WIDTH; col++) {
        const tileData = grid[row][col];
        const sprite = this.tileSprites[row][col];

        // Engine should never have empty tiles after spawn, but safeguard
        const tileType = tileData.type === 'empty' ? 'fuel' : tileData.type;

        sprite.setType(tileType as 'fuel' | 'coffee' | 'snack' | 'road');
        sprite.row = row;
        sprite.col = col;
        sprite.x = this.gridOffsetX + col * TILE_SIZE + TILE_SIZE / 2;
        sprite.y = this.gridOffsetY + row * TILE_SIZE + TILE_SIZE / 2;
        sprite.setScale(1);
        sprite.setAlpha(1);
      }
    }
  }
}

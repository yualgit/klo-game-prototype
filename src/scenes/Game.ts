/**
 * Game Scene - Main gameplay with 8x8 grid.
 * Integrates Match3Engine and TileSprite for full gameplay.
 */

import Phaser from 'phaser';
import { Match3Engine } from '../game/Match3Engine';
import { TileSprite } from '../game/TileSprite';
import { TileData, SpawnRules, LevelGoal, LevelEvent, MatchResult, TileType } from '../game/types';
import { TILE_SIZE } from '../utils/constants';
import { TILE_COLORS, GUI_TEXTURE_KEYS, TEXTURE_KEYS } from '../game/constants';
import { LevelManager } from '../game/LevelManager';
import { BoosterActivator } from '../game/BoosterActivator';
import { ProgressManager } from '../game/ProgressManager';
import { AudioManager } from '../game/AudioManager';
import { VFXManager } from '../game/VFXManager';

// Design constants from STYLE_GUIDE.md
const KLO_YELLOW = 0xffb800;
const KLO_BLACK = 0x1a1a1a;
const KLO_WHITE = 0xf9f9f9;

// Grid constants from TECH_SPEC.md
const GRID_WIDTH = 8;
const GRID_HEIGHT = 8;

const MAX_LEVELS = 5;

export class Game extends Phaser.Scene {
  // UI elements
  private backButton: Phaser.GameObjects.Container;
  private hudText: Phaser.GameObjects.Text;

  // Game engine and state
  private engine: Match3Engine;
  private tileSprites: TileSprite[][] = [];
  private isProcessing: boolean = false;
  private selectedTile: TileSprite | null = null;

  // Level management
  private levelManager: LevelManager;
  private boosterActivator: BoosterActivator;
  private currentLevel: number;
  private totalMoves: number;

  // Grid positioning
  private gridOffsetX: number;
  private gridOffsetY: number;

  // VFX and Audio
  private audioManager: AudioManager;
  private vfxManager: VFXManager;

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

    // Fade in from black
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Scene background gradient (warm tones)
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xFFFBF0, 0xFFFBF0, 0xFFF0D0, 0xFFF0D0, 1);
    bg.fillRect(0, 0, width, height);

    // Reset scene state for restarts
    this.resetState();

    // Get level ID from scene data
    const data = this.scene.settings.data as { levelId?: number };
    this.currentLevel = data?.levelId || 1;

    // Load level data
    const levelKey = `level_${String(this.currentLevel).padStart(3, '0')}`;
    this.levelData = this.cache.json.get(levelKey);
    console.log('[Game] Level data loaded:', this.levelData);

    // Store total moves for star calculation
    this.totalMoves = this.levelData.moves;

    // Calculate grid offsets (center on screen with HUD offset)
    const gridPixelWidth = GRID_WIDTH * TILE_SIZE;
    const gridPixelHeight = GRID_HEIGHT * TILE_SIZE;
    this.gridOffsetX = (width - gridPixelWidth) / 2;
    this.gridOffsetY = (height - gridPixelHeight) / 2 + 30; // Offset for HUD

    // Initialize engine and generate grid
    this.engine = new Match3Engine(GRID_HEIGHT, GRID_WIDTH);
    const spawnRules: SpawnRules = this.levelData.spawn_rules;
    this.engine.generateGrid(spawnRules);

    // Initialize obstacles if any
    if (this.levelData.obstacles && this.levelData.obstacles.length > 0) {
      this.engine.initializeObstacles(this.levelData.obstacles);
    }

    // Initialize level manager - normalize goal format from JSON
    const levelGoals: LevelGoal[] = this.levelData.goals.map((g: any) => ({
      type: g.type === 'destroy' ? 'destroy_obstacle' : g.type,
      item: g.item,
      obstacleType: g.obstacleType || g.obstacle,
      boosterType: g.boosterType,
      count: g.count,
      description: g.description,
      current: 0,
    }));
    this.levelManager = new LevelManager({
      moves: this.levelData.moves,
      goals: levelGoals,
    });

    // Subscribe to level events
    this.levelManager.subscribe((event: LevelEvent) => {
      this.handleLevelEvent(event);
    });

    // Initialize booster activator
    this.boosterActivator = new BoosterActivator(this.engine);

    // Initialize audio and VFX managers
    this.audioManager = new AudioManager(this);
    this.vfxManager = new VFXManager(this);

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
    // HUD background with styled bar
    const hudBg = this.add.graphics();
    hudBg.fillStyle(0xFFB800, 0.15);
    hudBg.fillRoundedRect(8, 8, width - 16, 52, 8);

    // Add KLO branding stripe on left
    hudBg.fillStyle(KLO_YELLOW, 1);
    hudBg.fillRoundedRect(12, 12, 4, 44, 2);

    // Initial HUD text
    this.updateHUDText(width);
  }

  /**
   * Update HUD text with current level state
   */
  private updateHUDText(width: number): void {
    const moves = this.levelManager.getMovesRemaining();
    const goals = this.levelManager.getGoals();

    // Format goals for display with mini tile icons
    const goalText = goals
      .map((g) => {
        const item = g.item || g.obstacleType || g.boosterType || '';
        return `${item}: ${g.current}/${g.count}`;
      })
      .join(' | ');

    const text = `Рівень ${this.currentLevel}  •  Ходи: ${moves}  •  ${goalText}`;

    if (!this.hudText) {
      this.hudText = this.add.text(width / 2, 34, text, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#1A1A1A',
        fontStyle: 'bold',
      });
      this.hudText.setOrigin(0.5);
    } else {
      this.hudText.setText(text);
    }
  }

  /**
   * Handle level events from LevelManager
   */
  private handleLevelEvent(event: LevelEvent): void {
    const width = this.cameras.main.width;

    switch (event.type) {
      case 'moves_changed':
        this.updateHUDText(width);
        break;

      case 'goals_updated':
        this.updateHUDText(width);
        break;

      case 'level_won':
        console.log('[Game] Level won!');
        this.isProcessing = true;
        this.showWinOverlay();
        break;

      case 'level_lost':
        console.log('[Game] Level lost!');
        this.isProcessing = true;
        this.showLoseOverlay();
        break;
    }
  }

  /**
   * Show win overlay with animated star reveal, confetti, and coupon
   */
  private showWinOverlay(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const progress = this.registry.get('progress') as ProgressManager;

    // Calculate stars and save progress
    const movesUsed = this.totalMoves - this.levelManager.getMovesRemaining();
    const { stars: earnedStars } = progress.completeLevel(this.currentLevel, movesUsed, this.totalMoves);
    progress.saveProgress();

    // Dark backdrop with fade-in
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.6);
    backdrop.fillRect(0, 0, width, height);
    backdrop.setAlpha(0);

    this.tweens.add({
      targets: backdrop,
      alpha: 1,
      duration: 200,
    });

    // Panel background
    const panelW = 400;
    const panelH = this.currentLevel === 5 ? 400 : 320;
    const panelX = (width - panelW) / 2;
    const panelY = (height - panelH) / 2;

    const panel = this.add.graphics();
    panel.fillStyle(KLO_WHITE, 1);
    panel.fillRoundedRect(0, 0, panelW, panelH, 16);

    // Panel container starts above screen and slides in
    const panelContainer = this.add.container(panelX, -panelH);
    panelContainer.add(panel);

    this.tweens.add({
      targets: panelContainer,
      y: panelY,
      duration: 500,
      ease: 'Bounce.Out',
      onComplete: () => {
        // Play win sound and trigger confetti after panel lands
        this.audioManager.playWin();
        this.vfxManager.confettiBurst(width / 2, 0);
      },
    });

    // Title
    const titleText = this.add.text(panelW / 2, 40, 'Рівень пройдено!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '32px',
      color: '#1A1A1A',
      fontStyle: 'bold',
    });
    titleText.setOrigin(0.5);
    panelContainer.add(titleText);

    // Crown icon for 3-star completion
    if (earnedStars === 3) {
      const crown = this.add.image(panelW / 2, 80, GUI_TEXTURE_KEYS.crown1);
      crown.setDisplaySize(40, 40);
      panelContainer.add(crown);
    }

    // Animated star reveal - stars appear one by one
    const starY = earnedStars === 3 ? 120 : 90;
    const starSpacing = 60;
    const starStartX = panelW / 2 - starSpacing;

    for (let i = 0; i < 3; i++) {
      const filled = i < earnedStars;
      const starText = this.add.text(starStartX + i * starSpacing, starY, filled ? '★' : '☆', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '48px',
        color: filled ? '#FFB800' : '#CCCCCC',
      });
      starText.setOrigin(0.5);
      starText.setScale(0);

      panelContainer.add(starText);

      // Animate star in with elastic bounce, staggered
      this.tweens.add({
        targets: starText,
        scale: 1,
        delay: 600 + i * 300,
        duration: 400,
        ease: 'Elastic.Out',
      });
    }

    let nextButtonY = 200;

    // Coupon display for level 5
    if (this.currentLevel === 5) {
      const couponBg = this.add.graphics();
      couponBg.fillStyle(KLO_YELLOW, 1);
      couponBg.lineStyle(3, 0xFFD700, 1);
      couponBg.fillRoundedRect(40, 180, panelW - 80, 90, 12);
      couponBg.strokeRoundedRect(40, 180, panelW - 80, 90, 12);
      panelContainer.add(couponBg);

      const couponTitle = this.add.text(panelW / 2, 200, 'Ваш купон:', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#1A1A1A',
        fontStyle: 'bold',
      });
      couponTitle.setOrigin(0.5);
      panelContainer.add(couponTitle);

      const couponText = this.add.text(panelW / 2, 235, '🎁 Безкоштовна кава S', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        color: '#1A1A1A',
        fontStyle: 'bold',
      });
      couponText.setOrigin(0.5);
      panelContainer.add(couponText);

      nextButtonY = 290;
    }

    // "Далі" button → next level or LevelSelect
    const isLastLevel = this.currentLevel >= MAX_LEVELS;
    const nextLabel = isLastLevel ? 'Меню' : 'Далі';

    const nextBtn = this.createOverlayButton(panelW / 2, nextButtonY, nextLabel, () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (isLastLevel) {
          this.scene.start('LevelSelect');
        } else {
          this.scene.start('Game', { levelId: this.currentLevel + 1 });
        }
      });
    });
    panelContainer.add(nextBtn);

    // "Рівні" button → LevelSelect (only when not last level)
    if (!isLastLevel) {
      const levelsBtn = this.createOverlayButton(panelW / 2, nextButtonY + 60, 'Рівні', () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('LevelSelect');
        });
      }, true);
      panelContainer.add(levelsBtn);
    }
  }

  /**
   * Show lose overlay with slide-in animation and styled treatment
   */
  private showLoseOverlay(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Brief camera shake before overlay
    this.cameras.main.shake(150, 0.003);

    // Play lose sound
    this.audioManager.playLose();

    // Dark backdrop with fade-in
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.6);
    backdrop.fillRect(0, 0, width, height);
    backdrop.setAlpha(0);

    this.tweens.add({
      targets: backdrop,
      alpha: 1,
      duration: 200,
    });

    // Panel background
    const panelW = 400;
    const panelH = 280;
    const panelX = (width - panelW) / 2;
    const panelY = (height - panelH) / 2;

    const panel = this.add.graphics();
    panel.fillStyle(KLO_WHITE, 1);
    panel.fillRoundedRect(0, 0, panelW, panelH, 16);

    // Panel container starts above screen and slides in
    const panelContainer = this.add.container(panelX, -panelH);
    panelContainer.add(panel);

    this.tweens.add({
      targets: panelContainer,
      y: panelY,
      duration: 400,
      ease: 'Back.Out',
    });

    // Title (motivational tone)
    const titleText = this.add.text(panelW / 2, 50, 'Ходи закінчились!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '32px',
      color: '#1A1A1A',
      fontStyle: 'bold',
    });
    titleText.setOrigin(0.5);
    panelContainer.add(titleText);

    // Subtitle
    const subtitle = this.add.text(panelW / 2, 95, 'Спробуйте ще раз!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#666666',
    });
    subtitle.setOrigin(0.5);
    panelContainer.add(subtitle);

    // "Повторити" button → restart same level
    const retryBtn = this.createOverlayButton(panelW / 2, 150, 'Повторити', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Game', { levelId: this.currentLevel });
      });
    });
    panelContainer.add(retryBtn);

    // "Меню" button → LevelSelect
    const menuBtn = this.createOverlayButton(panelW / 2, 210, 'Меню', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('LevelSelect');
      });
    }, true);
    panelContainer.add(menuBtn);
  }

  /**
   * Create a styled button for overlays using GUI sprites
   */
  private createOverlayButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    secondary: boolean = false
  ): Phaser.GameObjects.Container {
    const buttonWidth = 200;
    const buttonHeight = 50;

    // Use GUI sprite background
    const bg = this.add.image(0, 0, secondary ? GUI_TEXTURE_KEYS.buttonYellow : GUI_TEXTURE_KEYS.buttonOrange);
    bg.setDisplaySize(buttonWidth, buttonHeight);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#1A1A1A',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);

    const container = this.add.container(x, y, [bg, text]);
    container.setSize(buttonWidth, buttonHeight);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => container.setScale(1.05));
    container.on('pointerout', () => container.setScale(1));
    container.on('pointerdown', () => container.setScale(0.95));
    container.on('pointerup', onClick);

    return container;
  }

  private createBackButton(): void {
    const buttonWidth = 100;
    const buttonHeight = 40;

    // Button background using GUI sprite
    const buttonBg = this.add.image(0, 0, GUI_TEXTURE_KEYS.buttonYellow);
    buttonBg.setDisplaySize(buttonWidth, buttonHeight);

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
      console.log('[Game] Back button clicked, returning to LevelSelect');
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('LevelSelect');
      });
    });
  }

  private drawGridBackground(): void {
    const gridPixelWidth = GRID_WIDTH * TILE_SIZE;
    const gridPixelHeight = GRID_HEIGHT * TILE_SIZE;

    // Board background with shadow and polished style
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.08);
    shadow.fillRoundedRect(
      this.gridOffsetX - 12,
      this.gridOffsetY - 12,
      gridPixelWidth + 24,
      gridPixelHeight + 24,
      16
    );

    const board = this.add.graphics();
    board.fillStyle(0xFFFFFF, 0.6);
    board.fillRoundedRect(
      this.gridOffsetX - 8,
      this.gridOffsetY - 8,
      gridPixelWidth + 16,
      gridPixelHeight + 16,
      14
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

        // Set initial booster and obstacle visuals
        tile.setBooster(tileData.booster);
        tile.setObstacle(tileData.obstacle);

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
   * Check if a tile has an obstacle that prevents it from being moved
   */
  private tileIsLocked(tile: TileSprite): boolean {
    const grid = this.engine.getGrid();
    const tileData = grid[tile.row][tile.col];
    return !!(tileData.obstacle && tileData.obstacle.layers > 0);
  }

  /**
   * Handle tile swap with animation and cascade
   */
  private async onTileSwap(tile1: TileSprite, tile2: TileSprite): Promise<void> {
    if (this.isProcessing) return;

    // Prevent swapping tiles with obstacles (ice, dirt, crate)
    if (this.tileIsLocked(tile1) || this.tileIsLocked(tile2)) {
      console.log('[Game] Swap blocked - tile has obstacle');
      return;
    }

    this.isProcessing = true;

    console.log('[Game] Swapping tiles:', tile1.row, tile1.col, '<->', tile2.row, tile2.col);

    // Swap in engine
    this.engine.swapTiles(tile1.row, tile1.col, tile2.row, tile2.col);

    // Animate the swap with bounce ease
    await Promise.all([
      this.tweenAsync({
        targets: tile1,
        x: this.gridOffsetX + tile2.col * TILE_SIZE + TILE_SIZE / 2,
        y: this.gridOffsetY + tile2.row * TILE_SIZE + TILE_SIZE / 2,
        duration: 150,
        ease: 'Back.Out',
      }),
      this.tweenAsync({
        targets: tile2,
        x: this.gridOffsetX + tile1.col * TILE_SIZE + TILE_SIZE / 2,
        y: this.gridOffsetY + tile1.row * TILE_SIZE + TILE_SIZE / 2,
        duration: 150,
        ease: 'Back.Out',
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

    // Get grid data for booster checks
    const grid = this.engine.getGrid();
    const tile1Data = grid[tile1.row][tile1.col];
    const tile2Data = grid[tile2.row][tile2.col];

    let validSwap = false;

    // Check if both tiles have boosters -> combo
    if (tile1Data.booster && tile2Data.booster) {
      console.log('[Game] Booster combo detected');

      // Add booster combo VFX (use sphere wave for dramatic effect)
      const comboX = this.gridOffsetX + tile1.col * TILE_SIZE + TILE_SIZE / 2;
      const comboY = this.gridOffsetY + tile1.row * TILE_SIZE + TILE_SIZE / 2;
      this.vfxManager.boosterSphereWave(comboX, comboY);
      this.audioManager.playSphere();

      const tilesToRemove = this.boosterActivator.activateBoosterCombo(tile1Data, tile2Data);
      this.levelManager.onTilesMatched(tilesToRemove);
      await this.animateMatchRemoval([{ tiles: tilesToRemove, type: tile1Data.type, direction: 'horizontal' }]);
      this.engine.removeMatches([{ tiles: tilesToRemove, type: tile1Data.type, direction: 'horizontal' }]);
      validSwap = true;
    }
    // Check if one tile is KLO-sphere being swapped with regular tile
    else if (tile1Data.booster === 'klo_sphere' && !tile2Data.booster) {
      console.log('[Game] KLO-sphere swap with regular tile');

      // Add sphere wave VFX and sound
      const sphereX = this.gridOffsetX + tile1.col * TILE_SIZE + TILE_SIZE / 2;
      const sphereY = this.gridOffsetY + tile1.row * TILE_SIZE + TILE_SIZE / 2;
      this.vfxManager.boosterSphereWave(sphereX, sphereY);
      this.audioManager.playSphere();

      const tilesToRemove = this.engine.getTilesByType(tile2Data.type);
      this.levelManager.onTilesMatched(tilesToRemove);
      await this.animateMatchRemoval([{ tiles: tilesToRemove, type: tile2Data.type, direction: 'horizontal' }]);
      this.engine.removeMatches([{ tiles: tilesToRemove, type: tile2Data.type, direction: 'horizontal' }]);
      validSwap = true;
    } else if (tile2Data.booster === 'klo_sphere' && !tile1Data.booster) {
      console.log('[Game] KLO-sphere swap with regular tile');

      // Add sphere wave VFX and sound
      const sphereX = this.gridOffsetX + tile2.col * TILE_SIZE + TILE_SIZE / 2;
      const sphereY = this.gridOffsetY + tile2.row * TILE_SIZE + TILE_SIZE / 2;
      this.vfxManager.boosterSphereWave(sphereX, sphereY);
      this.audioManager.playSphere();

      const tilesToRemove = this.engine.getTilesByType(tile1Data.type);
      this.levelManager.onTilesMatched(tilesToRemove);
      await this.animateMatchRemoval([{ tiles: tilesToRemove, type: tile1Data.type, direction: 'horizontal' }]);
      this.engine.removeMatches([{ tiles: tilesToRemove, type: tile1Data.type, direction: 'horizontal' }]);
      validSwap = true;
    }
    // Otherwise check for normal matches
    else {
      const matchResult = this.engine.findMatchesWithBoosters();
      if (matchResult.tilesToRemove.length > 0) {
        validSwap = true;
      }
    }

    if (!validSwap) {
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
      // Valid swap - decrement moves
      this.levelManager.decrementMoves();

      // Process cascade
      console.log('[Game] Valid swap, processing cascade');
      await this.processCascade();

      // Check lose condition AFTER cascade (cascade may complete goals)
      this.levelManager.checkLoseCondition();

      // Only unlock input if level is still active
      if (this.levelManager.isLevelComplete()) {
        return;
      }

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
      const matchResult: MatchResult = this.engine.findMatchesWithBoosters();
      if (matchResult.tilesToRemove.length === 0) break;

      depth++;
      console.log('[Game] Cascade depth:', depth, 'Tiles to remove:', matchResult.tilesToRemove.length);

      // Add cascade combo escalation VFX
      const worldX = this.gridOffsetX + GRID_WIDTH * TILE_SIZE / 2;
      const worldY = this.gridOffsetY + GRID_HEIGHT * TILE_SIZE / 2;
      this.vfxManager.cascadeCombo(worldX, worldY, depth);

      // Track matched tiles for goals BEFORE removeMatches mutates types to 'empty'
      this.levelManager.onTilesMatched(matchResult.tilesToRemove);

      // Animate tile removal
      await this.animateMatchRemoval([{ tiles: matchResult.tilesToRemove, type: 'fuel', direction: 'horizontal' }]);

      // Check for boosters in removed tiles and activate them
      const grid = this.engine.getGrid();
      const activatedTiles: TileData[] = [];
      for (const tile of matchResult.tilesToRemove) {
        const tileData = grid[tile.row][tile.col];
        if (tileData.booster) {
          console.log('[Game] Activating booster at', tile.row, tile.col, ':', tileData.booster);

          // Add booster activation VFX and sound
          const bx = this.gridOffsetX + tileData.col * TILE_SIZE + TILE_SIZE / 2;
          const by = this.gridOffsetY + tileData.row * TILE_SIZE + TILE_SIZE / 2;

          if (tileData.booster === 'linear_horizontal') {
            const length = GRID_WIDTH * TILE_SIZE;
            this.vfxManager.boosterLineSweep(bx, by, 'horizontal', length);
            this.audioManager.playLineClear();
          } else if (tileData.booster === 'linear_vertical') {
            const length = GRID_HEIGHT * TILE_SIZE;
            this.vfxManager.boosterLineSweep(bx, by, 'vertical', length);
            this.audioManager.playLineClear();
          } else if (tileData.booster === 'bomb') {
            this.vfxManager.boosterBombExplosion(bx, by);
            this.audioManager.playBomb();
          } else if (tileData.booster === 'klo_sphere') {
            this.vfxManager.boosterSphereWave(bx, by);
            this.audioManager.playSphere();
          }

          const boosterTargets = this.boosterActivator.activateBooster(tileData);
          activatedTiles.push(...boosterTargets);
        }
      }

      // Damage obstacles from matches BEFORE removeMatches
      const matches = [{ tiles: matchResult.tilesToRemove, type: 'fuel' as TileType, direction: 'horizontal' as const }];
      const damagedObstacles = this.engine.damageObstacles(matches);
      if (damagedObstacles.length > 0) {
        console.log('[Game] Damaged', damagedObstacles.length, 'obstacles');
        this.levelManager.onObstaclesDestroyed(damagedObstacles);
        this.syncSpritesToEngine();
      }

      // Remove matched tiles from engine
      this.engine.removeMatches(matches);

      // Handle booster spawns - restore tile at spawn position so it's not overwritten
      for (const boosterSpawn of matchResult.boostersToSpawn) {
        console.log('[Game] Creating booster:', boosterSpawn.boosterType, 'at', boosterSpawn.row, boosterSpawn.col);
        // Restore tile at booster position (was just marked empty by removeMatches)
        const tile = grid[boosterSpawn.row][boosterSpawn.col];
        tile.type = boosterSpawn.baseType;
        tile.isEmpty = false;
        tile.booster = boosterSpawn.boosterType;
        // Update visual
        const sprite = this.tileSprites[boosterSpawn.row][boosterSpawn.col];
        sprite.setType(boosterSpawn.baseType as 'fuel' | 'coffee' | 'snack' | 'road');
        sprite.setBooster(boosterSpawn.boosterType);
        sprite.setScale(1);
        sprite.setAlpha(1);
        // Notify level manager
        this.levelManager.onBoosterCreated(boosterSpawn.boosterType);
      }

      // Remove booster-activated tiles if any
      if (activatedTiles.length > 0) {
        this.levelManager.onTilesMatched(activatedTiles);
        await this.animateMatchRemoval([{ tiles: activatedTiles, type: 'fuel', direction: 'horizontal' }]);
        this.engine.removeMatches([{ tiles: activatedTiles, type: 'fuel', direction: 'horizontal' }]);
      }

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

      // Performance safeguard: small delay between cascade iterations
      await new Promise<void>(resolve => this.time.delayedCall(50, resolve));
    }

    console.log('[Game] Cascade complete, depth:', depth);
  }

  /**
   * Animate match removal with fade and shrink
   */
  private async animateMatchRemoval(matches: any[]): Promise<void> {
    const tweens: Promise<void>[] = [];

    // Play match sound once per batch
    this.audioManager.playMatch();

    matches.forEach((match) => {
      match.tiles.forEach((tileData: TileData) => {
        const sprite = this.tileSprites[tileData.row][tileData.col];

        // Add particle pop VFX at each tile position
        const worldX = this.gridOffsetX + tileData.col * TILE_SIZE + TILE_SIZE / 2;
        const worldY = this.gridOffsetY + tileData.row * TILE_SIZE + TILE_SIZE / 2;
        const color = (tileData.type in TILE_COLORS ? TILE_COLORS[tileData.type as keyof typeof TILE_COLORS] : 0xffffff);
        this.vfxManager.matchPop(worldX, worldY, color);

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

      // Tween to final position with bounce ease
      tweens.push(
        this.tweenAsync({
          targets: sprite,
          y: this.gridOffsetY + spawn.row * TILE_SIZE + TILE_SIZE / 2,
          duration: 150,
          ease: 'Bounce.Out',
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
        sprite.setBooster(tileData.booster);
        sprite.setObstacle(tileData.obstacle);
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

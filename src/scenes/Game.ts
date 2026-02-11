/**
 * Game Scene - Main gameplay with 8x8 grid.
 * Integrates Match3Engine and TileSprite for full gameplay.
 */

import Phaser from 'phaser';
import { Match3Engine } from '../game/Match3Engine';
import { TileSprite } from '../game/TileSprite';
import { TileData, SpawnRules, LevelGoal, LevelEvent, MatchResult, TileType } from '../game/types';
import { TILE_SIZE } from '../utils/constants';
import { TILE_COLORS, GUI_TEXTURE_KEYS, TEXTURE_KEYS, BLOCK_TEXTURE_KEY } from '../game/constants';
import { LevelManager } from '../game/LevelManager';
import { BoosterActivator } from '../game/BoosterActivator';
import { ProgressManager } from '../game/ProgressManager';
import { EconomyManager } from '../game/EconomyManager';
import { AudioManager } from '../game/AudioManager';
import { VFXManager } from '../game/VFXManager';
import { getResponsiveLayout, cssToGame, getDpr } from '../utils/responsive';
import eventsCenter from '../utils/EventsCenter';
import { getActiveCollectionId, CARD_DEFINITIONS, CardRarity } from '../game/collectionConfig';
import { rollCard, DROP_CONFIG } from '../game/cardDropLogic';
import { CollectionsManager } from '../game/CollectionsManager';

// Design constants from STYLE_GUIDE.md
const KLO_YELLOW = 0xffb800;
const KLO_BLACK = 0x1a1a1a;
const KLO_WHITE = 0xf9f9f9;

const MAX_LEVELS = 10;

export class Game extends Phaser.Scene {
  // UI elements
  private backButton: Phaser.GameObjects.Container;
  private hudText: Phaser.GameObjects.Text;
  private hudGoalText: Phaser.GameObjects.Text;
  private bg: Phaser.GameObjects.Graphics;
  private hudBg: Phaser.GameObjects.Graphics;
  private gridBoardGraphics: Phaser.GameObjects.Graphics;
  private gridShadowGraphics: Phaser.GameObjects.Graphics;
  private gridMaskGraphics: Phaser.GameObjects.Graphics;
  private blockSprites: Phaser.GameObjects.Image[] = [];

  // Game engine and state
  private engine: Match3Engine;
  private tileSprites: (TileSprite | null)[][] = [];
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

  // Grid dimensions (read from level data)
  private gridWidth: number;
  private gridHeight: number;

  // Responsive layout
  private layout: ReturnType<typeof getResponsiveLayout>;

  // VFX and Audio
  private audioManager: AudioManager;
  private vfxManager: VFXManager;

  // Level data
  private levelData: any;

  // Scene lifecycle flag — false after shutdown to stop async chains
  private sceneActive: boolean = true;

  // Input tracking
  private dragStartX: number = 0;
  private dragStartY: number = 0;

  constructor() {
    super({ key: 'Game' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Compute responsive layout
    this.layout = getResponsiveLayout(width, height);

    // Fade in from black
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Scene background gradient (warm tones)
    this.bg = this.add.graphics();
    this.bg.fillGradientStyle(0xFFFBF0, 0xFFFBF0, 0xFFF0D0, 0xFFF0D0, 1);
    this.bg.fillRect(0, 0, width, height);

    // Mark scene as active (reset from previous shutdown)
    this.sceneActive = true;
    // Reset scene state for restarts
    this.resetState();

    // On shutdown, flag scene inactive so async chains (processCascade, etc.) stop
    this.events.once('shutdown', () => {
      this.sceneActive = false;
      this.scale.off('resize', this.handleResize, this);
      this.scene.stop('UIScene');
    });

    // Get level ID from scene data
    const data = this.scene.settings.data as { levelId?: number };
    this.currentLevel = data?.levelId || 1;

    // Load level data
    const levelKey = `level_${String(this.currentLevel).padStart(3, '0')}`;
    this.levelData = this.cache.json.get(levelKey);
    console.log('[Game] Level data loaded:', this.levelData);

    // Store total moves for star calculation
    this.totalMoves = this.levelData.moves;

    // Read grid dimensions from level data
    this.gridWidth = this.levelData.grid.width;
    this.gridHeight = this.levelData.grid.height;

    // Calculate grid offsets using responsive tile size
    // Account for UIScene header + Game HUD
    // NEW: Apply board width constraint (GAME-03)
    this.layout.tileSize = this.calculateConstrainedTileSize(width, height);
    const gridPixelWidth = this.gridWidth * this.layout.tileSize;
    this.gridOffsetX = (width - gridPixelWidth) / 2;
    this.gridOffsetY = cssToGame(50) + this.layout.hudHeight + cssToGame(10); // UIScene header + game HUD + padding

    // Initialize engine and generate grid
    this.engine = new Match3Engine(this.gridHeight, this.gridWidth);
    const spawnRules: SpawnRules = this.levelData.spawn_rules;
    this.engine.generateGrid(spawnRules);

    // Apply cell map if present
    if (this.levelData.grid.cell_map) {
      this.engine.setCellMap(this.levelData.grid.cell_map);
    }

    // Initialize obstacles if any
    if (this.levelData.obstacles && this.levelData.obstacles.length > 0) {
      this.engine.initializeObstacles(this.levelData.obstacles);
    }

    // Apply pre-placed tiles if any
    if (this.levelData.pre_placed_tiles) {
      for (const prePlaced of this.levelData.pre_placed_tiles) {
        if (this.engine.isCellActive(prePlaced.row, prePlaced.col)) {
          this.engine.setTileAt(prePlaced.row, prePlaced.col, {
            type: prePlaced.type,
            isEmpty: false,
            booster: prePlaced.booster,
            obstacle: prePlaced.obstacle,
          });
        }
      }
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

    // Launch UIScene with header only (no bottom nav during gameplay)
    this.scene.launch('UIScene', {
      currentTab: 'levels', // Not relevant since nav hidden
      showBottomNav: false,
      showHeader: true,
    });

    // Register resize handler
    this.scale.on('resize', this.handleResize, this);
  }

  private resetState(): void {
    // Reset any scene state here for proper restart handling
    this.tileSprites = [];
    this.blockSprites = [];
    this.isProcessing = false;
    this.selectedTile = null;
    // Clear references to destroyed game objects from previous scene run
    this.hudText = null!;
    this.hudGoalText = null!;
    this.backButton = null!;
  }

  private calculateConstrainedTileSize(width: number, height: number): number {
    // GAME-03: Board width = screen width - 32px padding (16px each side), max 1024px CSS
    const SIDE_PADDING = cssToGame(16); // 16px CSS each side
    const MAX_BOARD_CSS_WIDTH = 1024;
    const MAX_BOARD_WIDTH = cssToGame(MAX_BOARD_CSS_WIDTH);

    // Width constraint
    const availableWidth = width - (SIDE_PADDING * 2);
    const boardWidth = Math.min(availableWidth, MAX_BOARD_WIDTH);
    const tileSizeByWidth = Math.floor(boardWidth / this.gridWidth);

    // Height constraint: board must fit below header + HUD + padding
    const topSpace = cssToGame(50) + this.layout.hudHeight + cssToGame(10);
    const bottomPadding = cssToGame(20);
    const availableHeight = height - topSpace - bottomPadding;
    const tileSizeByHeight = Math.floor(availableHeight / this.gridHeight);

    // Use the more restrictive constraint (keeps tiles square)
    return Math.min(tileSizeByWidth, tileSizeByHeight);
  }

  private createHUD(width: number): void {
    // HUD background with styled bar (responsive height)
    // Position below UIScene header
    this.hudBg = this.add.graphics();
    this.hudBg.fillStyle(0xFFB800, 0.15);
    const padding = cssToGame(4);
    const hudY = cssToGame(50); // Below UIScene header
    this.hudBg.fillRoundedRect(padding * 2, hudY + padding * 2, width - padding * 4, this.layout.hudHeight - padding * 4, cssToGame(4));

    // Add KLO branding stripe on left (proportional)
    this.hudBg.fillStyle(KLO_YELLOW, 1);
    const stripeWidth = cssToGame(2);
    const stripeHeight = this.layout.hudHeight - padding * 6;
    this.hudBg.fillRoundedRect(padding * 3, hudY + padding * 3, stripeWidth, stripeHeight, cssToGame(1));

    // Initial HUD text
    this.updateHUDText(width);
  }

  /**
   * Update HUD text with current level state
   */
  private updateHUDText(width: number): void {
    const moves = this.levelManager.getMovesRemaining();
    const goals = this.levelManager.getGoals();
    const isMobile = width / getDpr() < 600;

    // Format goals for display
    const goalText = goals
      .map((g) => {
        const item = g.item || g.obstacleType || g.boosterType || '';
        return `${item}: ${g.current}/${g.count}`;
      })
      .join(' | ');

    const hudY = cssToGame(50) + this.layout.hudHeight / 2; // Below UIScene header

    if (isMobile) {
      // Mobile: two-line layout
      // Destroy existing texts if they exist
      if (this.hudText) {
        this.hudText.destroy();
      }
      if (this.hudGoalText) {
        this.hudGoalText.destroy();
      }

      // Line 1: Level and moves
      const line1Text = `Рівень ${this.currentLevel}  •  Ходи: ${moves}`;
      this.hudText = this.add.text(width / 2, hudY - cssToGame(8), line1Text, {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${cssToGame(14)}px`,
        color: '#1A1A1A',
        fontStyle: 'bold',
      });
      this.hudText.setOrigin(0.5);

      // Line 2: Goals (smaller font, gray)
      this.hudGoalText = this.add.text(width / 2, hudY + cssToGame(10), goalText, {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${cssToGame(11)}px`,
        color: '#666666',
      });
      this.hudGoalText.setOrigin(0.5);
    } else {
      // Desktop: single-line layout
      const text = `Рівень ${this.currentLevel}  •  Ходи: ${moves}  •  ${goalText}`;

      // Destroy goal text if it exists (viewport changed from mobile to desktop)
      if (this.hudGoalText) {
        this.hudGoalText.destroy();
        this.hudGoalText = null!;
      }

      if (!this.hudText) {
        this.hudText = this.add.text(width / 2, hudY, text, {
          fontFamily: 'Arial, sans-serif',
          fontSize: `${this.layout.hudFontSize}px`,
          color: '#1A1A1A',
          fontStyle: 'bold',
        });
        this.hudText.setOrigin(0.5);
      } else {
        this.hudText.setText(text);
        this.hudText.setPosition(width / 2, hudY);
        this.hudText.setFontSize(this.layout.hudFontSize);
      }
    }
  }

  /**
   * Handle level events from LevelManager
   */
  private handleLevelEvent(event: LevelEvent): void {
    if (!this.sceneActive) return;
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
    backdrop.setDepth(300); // Above UIScene (depth 200)

    this.tweens.add({
      targets: backdrop,
      alpha: 1,
      duration: 200,
    });

    // Panel background (responsive width)
    const panelW = this.layout.overlayPanelWidth;
    const panelH = this.currentLevel === 10 ? cssToGame(400) : cssToGame(320);
    const panelX = (width - panelW) / 2;
    const panelY = (height - panelH) / 2;

    const panel = this.add.graphics();
    panel.fillStyle(KLO_WHITE, 1);
    panel.fillRoundedRect(0, 0, panelW, panelH, cssToGame(8));

    // Panel container starts above screen and slides in
    const panelContainer = this.add.container(panelX, -panelH);
    panelContainer.setDepth(301); // Above backdrop
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
    const titleText = this.add.text(panelW / 2, cssToGame(20), 'Рівень пройдено!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${this.layout.overlayTitleSize}px`,
      color: '#1A1A1A',
      fontStyle: 'bold',
    });
    titleText.setOrigin(0.5);
    panelContainer.add(titleText);

    // Detect bonus level
    const isBonusLevel = this.levelData.bonus_level === true;

    // Bonus level hint
    if (isBonusLevel) {
      const bonusHint = this.add.text(panelW / 2, cssToGame(100), 'Бонус: обери картку!', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${this.layout.overlaySubtitleSize}px`,
        color: '#FFB800',
        fontStyle: 'bold',
      });
      bonusHint.setOrigin(0.5);
      panelContainer.add(bonusHint);
    }

    // Crown icon for 3-star completion
    if (earnedStars === 3) {
      const crown = this.add.image(panelW / 2, cssToGame(40), GUI_TEXTURE_KEYS.crown1);
      crown.setDisplaySize(cssToGame(20), cssToGame(20));
      panelContainer.add(crown);
    }

    // Animated star reveal - stars appear one by one
    const starY = earnedStars === 3 ? cssToGame(60) : cssToGame(45);
    const starSpacing = cssToGame(30);
    const starStartX = panelW / 2 - starSpacing;

    for (let i = 0; i < 3; i++) {
      const filled = i < earnedStars;
      const starText = this.add.text(starStartX + i * starSpacing, starY, filled ? '★' : '☆', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${cssToGame(24)}px`,
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

    // Lives display (informational - no life lost on win)
    const economyMgr = this.registry.get('economy') as EconomyManager;
    const currentLives = economyMgr.getLives();
    const livesDisplay = this.add.text(panelW / 2, starY + cssToGame(25), `❤ ${currentLives}/5`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${this.layout.overlaySubtitleSize}px`,
      color: '#FFB800',
    });
    livesDisplay.setOrigin(0.5);
    panelContainer.add(livesDisplay);

    // Coupon display for level 10
    if (this.currentLevel === 10) {
      const couponBg = this.add.graphics();
      const couponPadding = cssToGame(20);
      const couponHeight = cssToGame(45);
      const couponY = cssToGame(90);
      couponBg.fillStyle(KLO_YELLOW, 1);
      couponBg.lineStyle(cssToGame(1.5), 0xFFD700, 1);
      couponBg.fillRoundedRect(couponPadding, couponY, panelW - couponPadding * 2, couponHeight, cssToGame(6));
      couponBg.strokeRoundedRect(couponPadding, couponY, panelW - couponPadding * 2, couponHeight, cssToGame(6));
      panelContainer.add(couponBg);

      const couponTitle = this.add.text(panelW / 2, couponY + cssToGame(10), 'Ваш купон:', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${this.layout.overlaySubtitleSize}px`,
        color: '#1A1A1A',
        fontStyle: 'bold',
      });
      couponTitle.setOrigin(0.5);
      panelContainer.add(couponTitle);

      const couponText = this.add.text(panelW / 2, couponY + cssToGame(27.5), '🎁 Безкоштовна кава S', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${cssToGame(18)}px`,
        color: '#1A1A1A',
        fontStyle: 'bold',
      });
      couponText.setOrigin(0.5);
      panelContainer.add(couponText);
    }

    // "Далі" button → next level or LevelSelect (positioned near panel bottom)
    const isLastLevel = this.currentLevel >= MAX_LEVELS;
    const nextLabel = isLastLevel ? 'Меню' : 'Далі';

    const nextBtn = this.createOverlayButton(panelW / 2, panelH - cssToGame(80), nextLabel, () => {
      if (isBonusLevel) {
        // Show card pick in-place (replace win overlay content)
        this.showCardPickInOverlay(panelContainer, backdrop, panelW, panelH, isLastLevel);
      } else if (isLastLevel) {
        this.scene.start('LevelSelect');
      } else {
        this.scene.start('Game', { levelId: this.currentLevel + 1 });
      }
    });
    panelContainer.add(nextBtn);

    // "Рівні" button → LevelSelect (only when not last level)
    if (!isLastLevel) {
      const levelsBtn = this.createOverlayButton(panelW / 2, panelH - cssToGame(25), 'Рівні', () => {
        this.scene.start('LevelSelect');
      }, true);
      panelContainer.add(levelsBtn);
    }
  }

  /**
   * Replace win overlay content with card pick UI (2 cards, pick one, flip both).
   */
  private showCardPickInOverlay(
    panelContainer: Phaser.GameObjects.Container,
    _backdrop: Phaser.GameObjects.Graphics,
    panelW: number,
    panelH: number,
    isLastLevel: boolean
  ): void {
    // Remove all children from panel (title, stars, buttons, etc.)
    panelContainer.removeAll(true);

    // Redraw panel background (since removeAll destroyed it)
    const panel = this.add.graphics();
    panel.fillStyle(KLO_WHITE, 1);
    panel.fillRoundedRect(0, 0, panelW, panelH, cssToGame(8));
    panelContainer.add(panel);

    // Title
    const title = this.add.text(panelW / 2, cssToGame(25), 'Обери картку!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${this.layout.overlayTitleSize}px`,
      color: '#1A1A1A',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    panelContainer.add(title);

    // Get collection and roll cards
    const collectionId = getActiveCollectionId(this.currentLevel);
    const collections = this.registry.get('collections') as CollectionsManager;
    const owned = collections.getOwnedCards(collectionId);
    const pity = collections.getPityStreak(collectionId);

    let card1Id = rollCard(collectionId, owned, pity, DROP_CONFIG);
    let card2Id = rollCard(collectionId, owned, pity, DROP_CONFIG);
    for (let i = 0; i < 5 && card2Id === card1Id; i++) {
      card2Id = rollCard(collectionId, owned, pity, DROP_CONFIG);
    }

    // Card dimensions
    const cardW = cssToGame(100);
    const cardH = cssToGame(166); // 696:1158 ratio
    const cardSpacing = cssToGame(16);
    const cardY = panelH * 0.42;

    const totalCardsW = cardW * 2 + cardSpacing;
    const cardStartX = (panelW - totalCardsW) / 2 + cardW / 2;

    const cardIds = [card1Id, card2Id];
    const cardContainers: Phaser.GameObjects.Container[] = [];

    for (let i = 0; i < 2; i++) {
      const cardId = cardIds[i];
      const cardDef = CARD_DEFINITIONS[cardId];
      if (!cardDef) continue;

      const cx = cardStartX + i * (cardW + cardSpacing);
      const container = this.add.container(cx, cardY);

      // Card back (blank.png)
      const back = this.add.image(0, 0, 'collection_blank');
      back.setDisplaySize(cardW, cardH);
      container.add(back);

      // Card front (hidden)
      const front = this.add.image(0, 0, cardDef.textureKey);
      front.setDisplaySize(cardW, cardH);
      front.setVisible(false);
      container.add(front);

      // Card name (hidden)
      const nameText = this.add.text(0, cardH / 2 + cssToGame(12), cardDef.nameUk, {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${cssToGame(12)}px`,
        color: '#1A1A1A',
        fontStyle: 'bold',
      });
      nameText.setOrigin(0.5);
      nameText.setVisible(false);
      container.add(nameText);

      container.setSize(cardW, cardH);
      container.setInteractive({ useHandCursor: true });
      container.setData('cardId', cardId);

      // Hover
      container.on('pointerover', () => {
        this.tweens.add({ targets: container, scale: 1.05, duration: 150, ease: 'Quad.Out' });
      });
      container.on('pointerout', () => {
        this.tweens.add({ targets: container, scale: 1.0, duration: 150, ease: 'Quad.Out' });
      });

      // Pick handler
      container.on('pointerup', () => {
        this.handleCardPick(i, cardIds, cardContainers, panelContainer, panelW, panelH, collectionId, collections, isLastLevel);
      });

      panelContainer.add(container);
      cardContainers.push(container);
    }
  }

  /**
   * Handle card pick: flip both cards, save, show continue.
   */
  private async handleCardPick(
    pickedIndex: number,
    cardIds: string[],
    cardContainers: Phaser.GameObjects.Container[],
    panelContainer: Phaser.GameObjects.Container,
    panelW: number,
    panelH: number,
    collectionId: string,
    collections: CollectionsManager,
    isLastLevel: boolean
  ): Promise<void> {
    // Disable input on both cards
    cardContainers.forEach(c => c.removeInteractive());

    // Flip picked card first, then other
    await this.flipCardAnim(cardContainers[pickedIndex], 0);
    await this.flipCardAnim(cardContainers[1 - pickedIndex], 200);

    // Highlight picked, dim other
    this.tweens.add({ targets: cardContainers[pickedIndex], scale: 1.08, duration: 300, ease: 'Quad.Out' });
    cardContainers[1 - pickedIndex].setAlpha(0.5);

    // Show "Обрано!" above picked card
    const picked = cardContainers[pickedIndex];
    const chosenText = this.add.text(picked.x, picked.y - cssToGame(95), 'Обрано!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(14)}px`,
      color: '#FFB800',
      fontStyle: 'bold',
    });
    chosenText.setOrigin(0.5);
    panelContainer.add(chosenText);

    // Show rarity labels
    const rarityLabels: Record<CardRarity, string> = {
      common: 'Звичайна', rare: 'Рідкісна', epic: 'Епічна', legendary: 'Легендарна',
    };
    const rarityColors: Record<CardRarity, string> = {
      common: '#888888', rare: '#4488FF', epic: '#AA44FF', legendary: '#FFB800',
    };

    cardContainers.forEach((card) => {
      const cardId = card.getData('cardId') as string;
      const cardDef = CARD_DEFINITIONS[cardId];
      if (!cardDef) return;
      const label = this.add.text(card.x, card.y + cssToGame(120), rarityLabels[cardDef.rarity], {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${cssToGame(11)}px`,
        color: rarityColors[cardDef.rarity],
      });
      label.setOrigin(0.5);
      panelContainer.add(label);
    });

    // Save picked card
    await new Promise<void>(resolve => this.time.delayedCall(600, () => resolve()));
    const pickedCardId = cardIds[pickedIndex];
    collections.selectCard(collectionId, pickedCardId);

    // Show continue button
    const continueBtn = this.createOverlayButton(panelW / 2, panelH - cssToGame(40), 'Далі', () => {
      if (isLastLevel) {
        this.scene.start('LevelSelect');
      } else {
        this.scene.start('Game', { levelId: this.currentLevel + 1 });
      }
    });
    panelContainer.add(continueBtn);
  }

  /**
   * Flip card animation: scaleX 1→0 (hide back, show front) → 0→1
   */
  private flipCardAnim(container: Phaser.GameObjects.Container, delay: number): Promise<void> {
    return new Promise(resolve => {
      this.time.delayedCall(delay, () => {
        this.tweens.add({
          targets: container,
          scaleX: 0,
          duration: 200,
          ease: 'Quad.In',
          onComplete: () => {
            // Swap: hide back (index 0), show front (index 1) + name (index 2)
            const back = container.getAt(0) as Phaser.GameObjects.Image;
            const front = container.getAt(1) as Phaser.GameObjects.Image;
            const nameText = container.getAt(2) as Phaser.GameObjects.Text;
            back.setVisible(false);
            front.setVisible(true);
            nameText.setVisible(true);

            this.tweens.add({
              targets: container,
              scaleX: 1,
              duration: 200,
              ease: 'Quad.Out',
              onComplete: () => resolve(),
            });
          },
        });
      });
    });
  }

  /**
   * Show lose overlay with slide-in animation and styled treatment
   */
  private showLoseOverlay(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Lose life
    const economy = this.registry.get('economy') as EconomyManager;
    economy.loseLife();

    // Brief camera shake before overlay
    this.cameras.main.shake(150, 0.003);

    // Play lose sound
    this.audioManager.playLose();

    // Dark backdrop with fade-in
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.6);
    backdrop.fillRect(0, 0, width, height);
    backdrop.setAlpha(0);
    backdrop.setDepth(300); // Above UIScene (depth 200)

    this.tweens.add({
      targets: backdrop,
      alpha: 1,
      duration: 200,
    });

    // Panel background (responsive width, tall enough for buttons at bottom)
    const panelW = this.layout.overlayPanelWidth;
    const panelH = cssToGame(250);
    const panelX = (width - panelW) / 2;
    const panelY = (height - panelH) / 2;

    const panel = this.add.graphics();
    panel.fillStyle(KLO_WHITE, 1);
    panel.fillRoundedRect(0, 0, panelW, panelH, cssToGame(8));

    // Panel container starts above screen and slides in
    const panelContainer = this.add.container(panelX, -panelH);
    panelContainer.setDepth(301); // Above backdrop
    panelContainer.add(panel);

    this.tweens.add({
      targets: panelContainer,
      y: panelY,
      duration: 400,
      ease: 'Back.Out',
    });

    // Title (motivational tone)
    const titleText = this.add.text(panelW / 2, cssToGame(25), 'Ходи закінчились!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${this.layout.overlayTitleSize}px`,
      color: '#1A1A1A',
      fontStyle: 'bold',
    });
    titleText.setOrigin(0.5);
    panelContainer.add(titleText);

    // Subtitle
    const subtitle = this.add.text(panelW / 2, cssToGame(50), 'Спробуйте ще раз!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${this.layout.overlaySubtitleSize}px`,
      color: '#666666',
    });
    subtitle.setOrigin(0.5);
    panelContainer.add(subtitle);

    // Lives remaining display
    const livesRemaining = economy.getLives();
    const livesInfo = this.add.text(panelW / 2, cssToGame(75), `Залишилось життів: ${livesRemaining}/5`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${this.layout.overlaySubtitleSize}px`,
      color: '#FFB800',
      fontStyle: 'bold',
    });
    livesInfo.setOrigin(0.5);
    panelContainer.add(livesInfo);

    // "Повторити" button → restart same level (positioned near panel bottom)
    const retryBtn = this.createOverlayButton(panelW / 2, panelH - cssToGame(80), 'Повторити', () => {
      const eco = this.registry.get('economy') as EconomyManager;
      if (!eco.canStartLevel()) {
        // Show inline refill option instead of restarting
        this.showRefillOrReturn(panelContainer, panelW, panelH);
        return;
      }
      this.scene.start('Game', { levelId: this.currentLevel });
    });
    panelContainer.add(retryBtn);

    // "Меню" button → LevelSelect
    const menuBtn = this.createOverlayButton(panelW / 2, panelH - cssToGame(25), 'Меню', () => {
      this.scene.start('LevelSelect');
    }, true);
    panelContainer.add(menuBtn);
  }

  /**
   * Show refill option when player tries to retry without lives
   */
  private showRefillOrReturn(panelContainer: Phaser.GameObjects.Container, panelW: number, _panelH: number): void {
    const economy = this.registry.get('economy') as EconomyManager;
    const canRefill = economy.getBonuses() >= 15;

    // Add refill message (positioned between lives info and buttons)
    const msg = this.add.text(panelW / 2, cssToGame(105), canRefill ? 'Поповнити життя?' : 'Недостатньо бонусів', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${this.layout.overlaySubtitleSize}px`,
      color: canRefill ? '#1A1A1A' : '#999999',
      fontStyle: 'bold',
    });
    msg.setOrigin(0.5);
    panelContainer.add(msg);

    if (canRefill) {
      const refillBtn = this.createOverlayButton(panelW / 2, cssToGame(135), 'Поповнити (15)', async () => {
        const success = await economy.spendBonusesForRefill();
        if (success) {
          this.scene.start('Game', { levelId: this.currentLevel });
        }
      });
      panelContainer.add(refillBtn);
    }
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
    const buttonWidth = this.layout.buttonWidth;
    const buttonHeight = this.layout.buttonHeight;

    // Use GUI sprite background
    const bg = this.add.image(0, 0, secondary ? GUI_TEXTURE_KEYS.buttonYellow : GUI_TEXTURE_KEYS.buttonOrange);
    bg.setDisplaySize(buttonWidth, buttonHeight);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${this.layout.buttonFontSize}px`,
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
    const width = this.cameras.main.width;
    const isMobile = width / getDpr() < 600;

    let buttonWidth: number;
    let buttonHeight: number;
    let buttonText: string;
    let fontSize: number;

    if (isMobile) {
      // Mobile: square icon-only button
      buttonWidth = cssToGame(36);
      buttonHeight = cssToGame(36);
      buttonText = '<';
      fontSize = cssToGame(18);
    } else {
      // Desktop: existing "< Menu" button
      buttonWidth = this.layout.backButtonWidth;
      buttonHeight = this.layout.backButtonHeight;
      buttonText = '< Menu';
      fontSize = this.layout.backButtonFontSize;
    }

    // Button background using GUI sprite
    const buttonBg = this.add.image(0, 0, GUI_TEXTURE_KEYS.buttonYellow);
    buttonBg.setDisplaySize(buttonWidth, buttonHeight);

    // Button text
    const text = this.add.text(0, 0, buttonText, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${fontSize}px`,
      color: '#1A1A1A',
      fontStyle: isMobile ? 'bold' : 'normal',
    });
    text.setOrigin(0.5);

    // Create container for button (position below UIScene header)
    const buttonX = cssToGame(35) + buttonWidth / 2;
    const buttonY = cssToGame(50) + this.layout.hudHeight / 2;
    this.backButton = this.add.container(buttonX, buttonY, [buttonBg, text]);
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
      this.scene.start('LevelSelect');
    });
  }

  private drawGridBackground(): void {
    const gridPixelWidth = this.gridWidth * this.layout.tileSize;
    const gridPixelHeight = this.gridHeight * this.layout.tileSize;

    // Board background with shadow and polished style
    this.gridShadowGraphics = this.add.graphics();
    this.gridShadowGraphics.fillStyle(0x000000, 0.08);
    const shadowPadding = cssToGame(6);
    this.gridShadowGraphics.fillRoundedRect(
      this.gridOffsetX - shadowPadding,
      this.gridOffsetY - shadowPadding,
      gridPixelWidth + shadowPadding * 2,
      gridPixelHeight + shadowPadding * 2,
      cssToGame(8)
    );

    this.gridBoardGraphics = this.add.graphics();
    this.gridBoardGraphics.fillStyle(0xFFFFFF, 0.6);
    const boardPadding = cssToGame(4);
    this.gridBoardGraphics.fillRoundedRect(
      this.gridOffsetX - boardPadding,
      this.gridOffsetY - boardPadding,
      gridPixelWidth + boardPadding * 2,
      gridPixelHeight + boardPadding * 2,
      cssToGame(7)
    );

    // Inactive cell rendering: block sprites or transparent mask
    const inactiveStyle = this.levelData.grid.inactive_cell_style || 'transparent';

    this.gridMaskGraphics = this.add.graphics();

    for (let row = 0; row < this.gridHeight; row++) {
      for (let col = 0; col < this.gridWidth; col++) {
        if (!this.engine.isCellActive(row, col)) {
          if (inactiveStyle === 'block') {
            // Place block sprite
            const x = this.gridOffsetX + col * this.layout.tileSize + this.layout.tileSize / 2;
            const y = this.gridOffsetY + row * this.layout.tileSize + this.layout.tileSize / 2;
            const blockSprite = this.add.image(x, y, BLOCK_TEXTURE_KEY);
            blockSprite.setDisplaySize(this.layout.tileSize, this.layout.tileSize);
            blockSprite.setDepth(0); // Same depth as board, under tiles
            this.blockSprites.push(blockSprite);
          } else {
            // Transparent: mask with bg color
            this.gridMaskGraphics.fillStyle(0xFFFBF0, 1);
            this.gridMaskGraphics.fillRect(
              this.gridOffsetX + col * this.layout.tileSize,
              this.gridOffsetY + row * this.layout.tileSize,
              this.layout.tileSize,
              this.layout.tileSize
            );
          }
        }
      }
    }
  }

  /**
   * Create TileSprite objects from engine grid state
   */
  private createTilesFromEngine(): void {
    const grid: TileData[][] = this.engine.getGrid();

    // Initialize 2D array
    this.tileSprites = [];

    let activeTileCount = 0;

    for (let row = 0; row < this.gridHeight; row++) {
      this.tileSprites[row] = [];
      for (let col = 0; col < this.gridWidth; col++) {
        // Skip inactive cells
        if (!this.engine.isCellActive(row, col)) {
          this.tileSprites[row][col] = null;
          continue;
        }

        const tileData = grid[row][col];

        // Engine should never generate empty tiles, but safeguard
        const tileType = (tileData.type === 'empty' ? 'burger' : tileData.type) as 'burger' | 'hotdog' | 'oil' | 'water' | 'snack' | 'soda';

        // Create TileSprite with responsive tile size
        const tile = new TileSprite(
          this,
          row,
          col,
          tileType,
          this.gridOffsetX,
          this.gridOffsetY,
          this.layout.tileSize
        );

        // Set initial booster and obstacle visuals
        tile.setBooster(tileData.booster);
        tile.setObstacle(tileData.obstacle);

        // Make interactive - Containers need explicit hit area
        const hitArea = new Phaser.Geom.Rectangle(
          -this.layout.tileSize / 2,
          -this.layout.tileSize / 2,
          this.layout.tileSize,
          this.layout.tileSize
        );
        tile.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        // Store in array
        this.tileSprites[row][col] = tile;
        activeTileCount++;
      }
    }

    console.log('[Game] Created', activeTileCount, 'active tiles from engine state');
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
        let targetRow = this.selectedTile.row;
        let targetCol = this.selectedTile.col;

        if (Math.abs(dx) > Math.abs(dy)) {
          // Horizontal swipe
          if (dx > 0 && this.selectedTile.col < this.gridWidth - 1) {
            targetRow = this.selectedTile.row;
            targetCol = this.selectedTile.col + 1;
          } else if (dx < 0 && this.selectedTile.col > 0) {
            targetRow = this.selectedTile.row;
            targetCol = this.selectedTile.col - 1;
          }
        } else {
          // Vertical swipe
          if (dy > 0 && this.selectedTile.row < this.gridHeight - 1) {
            targetRow = this.selectedTile.row + 1;
            targetCol = this.selectedTile.col;
          } else if (dy < 0 && this.selectedTile.row > 0) {
            targetRow = this.selectedTile.row - 1;
            targetCol = this.selectedTile.col;
          }
        }

        // Check if target cell is active before accessing sprite
        if (this.engine.isCellActive(targetRow, targetCol)) {
          targetTile = this.tileSprites[targetRow][targetCol];
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
    const col = Math.floor((pointer.x - this.gridOffsetX) / this.layout.tileSize);
    const row = Math.floor((pointer.y - this.gridOffsetY) / this.layout.tileSize);

    if (row >= 0 && row < this.gridHeight && col >= 0 && col < this.gridWidth) {
      // Skip inactive cells
      if (!this.engine.isCellActive(row, col)) return null;

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
        x: this.gridOffsetX + tile2.col * this.layout.tileSize + this.layout.tileSize / 2,
        y: this.gridOffsetY + tile2.row * this.layout.tileSize + this.layout.tileSize / 2,
        duration: 150,
        ease: 'Back.Out',
      }),
      this.tweenAsync({
        targets: tile2,
        x: this.gridOffsetX + tile1.col * this.layout.tileSize + this.layout.tileSize / 2,
        y: this.gridOffsetY + tile1.row * this.layout.tileSize + this.layout.tileSize / 2,
        duration: 150,
        ease: 'Back.Out',
      }),
    ]);
    if (!this.sceneActive) return;

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
      const comboX = this.gridOffsetX + tile1.col * this.layout.tileSize + this.layout.tileSize / 2;
      const comboY = this.gridOffsetY + tile1.row * this.layout.tileSize + this.layout.tileSize / 2;
      this.vfxManager.boosterSphereWave(comboX, comboY);
      this.audioManager.playSphere();

      const tilesToRemove = this.boosterActivator.activateBoosterCombo(tile1Data, tile2Data);
      this.levelManager.onTilesMatched(tilesToRemove);
      await this.animateMatchRemoval([{ tiles: tilesToRemove, type: tile1Data.type, direction: 'horizontal' }]);
      if (!this.sceneActive) return;
      this.engine.removeMatches([{ tiles: tilesToRemove, type: tile1Data.type, direction: 'horizontal' }]);
      validSwap = true;
    }
    // Check if one tile is KLO-sphere being swapped with regular tile
    else if (tile1Data.booster === 'klo_sphere' && !tile2Data.booster) {
      console.log('[Game] KLO-sphere swap with regular tile');

      // Add sphere wave VFX and sound
      const sphereX = this.gridOffsetX + tile1.col * this.layout.tileSize + this.layout.tileSize / 2;
      const sphereY = this.gridOffsetY + tile1.row * this.layout.tileSize + this.layout.tileSize / 2;
      this.vfxManager.boosterSphereWave(sphereX, sphereY);
      this.audioManager.playSphere();

      const tilesToRemove = this.engine.getTilesByType(tile2Data.type);
      this.levelManager.onTilesMatched(tilesToRemove);
      await this.animateMatchRemoval([{ tiles: tilesToRemove, type: tile2Data.type, direction: 'horizontal' }]);
      if (!this.sceneActive) return;
      this.engine.removeMatches([{ tiles: tilesToRemove, type: tile2Data.type, direction: 'horizontal' }]);
      validSwap = true;
    } else if (tile2Data.booster === 'klo_sphere' && !tile1Data.booster) {
      console.log('[Game] KLO-sphere swap with regular tile');

      // Add sphere wave VFX and sound
      const sphereX = this.gridOffsetX + tile2.col * this.layout.tileSize + this.layout.tileSize / 2;
      const sphereY = this.gridOffsetY + tile2.row * this.layout.tileSize + this.layout.tileSize / 2;
      this.vfxManager.boosterSphereWave(sphereX, sphereY);
      this.audioManager.playSphere();

      const tilesToRemove = this.engine.getTilesByType(tile1Data.type);
      this.levelManager.onTilesMatched(tilesToRemove);
      await this.animateMatchRemoval([{ tiles: tilesToRemove, type: tile1Data.type, direction: 'horizontal' }]);
      if (!this.sceneActive) return;
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
          x: this.gridOffsetX + tile2.col * this.layout.tileSize + this.layout.tileSize / 2,
          y: this.gridOffsetY + tile2.row * this.layout.tileSize + this.layout.tileSize / 2,
          duration: 150,
          ease: 'Power2',
        }),
        this.tweenAsync({
          targets: tile2,
          x: this.gridOffsetX + tile1.col * this.layout.tileSize + this.layout.tileSize / 2,
          y: this.gridOffsetY + tile1.row * this.layout.tileSize + this.layout.tileSize / 2,
          duration: 150,
          ease: 'Power2',
        }),
      ]);
      if (!this.sceneActive) return;

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
      if (!this.sceneActive) return;

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
    if (!this.sceneActive) return Promise.resolve();
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

    while (depth < MAX_DEPTH && this.sceneActive) {
      const matchResult: MatchResult = this.engine.findMatchesWithBoosters();
      if (matchResult.tilesToRemove.length === 0) break;

      depth++;
      console.log('[Game] Cascade depth:', depth, 'Tiles to remove:', matchResult.tilesToRemove.length);

      // Add cascade combo escalation VFX
      const worldX = this.gridOffsetX + this.gridWidth * this.layout.tileSize / 2;
      const worldY = this.gridOffsetY + this.gridHeight * this.layout.tileSize / 2;
      this.vfxManager.cascadeCombo(worldX, worldY, depth);

      // Separate tiles into free (removable) vs obstacle-protected (stay in place, obstacle damaged)
      const grid = this.engine.getGrid();
      const freeTiles = matchResult.tilesToRemove.filter(t => {
        const cell = grid[t.row][t.col];
        return !(cell.obstacle && cell.obstacle.layers > 0 && cell.obstacle.type !== 'blocked');
      });

      // Track only free tiles for collection goals (obstacle-protected tiles stay on board)
      this.levelManager.onTilesMatched(freeTiles);

      // Animate only free tile removal (obstacle-protected tiles stay visible)
      if (freeTiles.length > 0) {
        await this.animateMatchRemoval([{ tiles: freeTiles, type: 'burger', direction: 'horizontal' }]);
        if (!this.sceneActive) break;
      }
      // Check for boosters only in free tiles (obstacle-protected tiles can't activate)
      const activatedTiles: TileData[] = [];
      for (const tile of freeTiles) {
        const tileData = grid[tile.row][tile.col];
        if (tileData.booster) {
          console.log('[Game] Activating booster at', tile.row, tile.col, ':', tileData.booster);

          // Add booster activation VFX and sound
          const bx = this.gridOffsetX + tileData.col * this.layout.tileSize + this.layout.tileSize / 2;
          const by = this.gridOffsetY + tileData.row * this.layout.tileSize + this.layout.tileSize / 2;

          if (tileData.booster === 'linear_horizontal') {
            const length = this.gridWidth * this.layout.tileSize;
            this.vfxManager.boosterLineSweep(bx, by, 'horizontal', length);
            this.audioManager.playLineClear();
          } else if (tileData.booster === 'linear_vertical') {
            const length = this.gridHeight * this.layout.tileSize;
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
      const matches = [{ tiles: matchResult.tilesToRemove, type: 'burger' as TileType, direction: 'horizontal' as const }];
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
        const sprite = this.tileSprites[boosterSpawn.row]?.[boosterSpawn.col];
        if (sprite) {
          const baseType = (boosterSpawn.baseType === 'empty' ? 'burger' : boosterSpawn.baseType) as 'burger' | 'hotdog' | 'oil' | 'water' | 'snack' | 'soda';
          sprite.setType(baseType);
          sprite.setBooster(boosterSpawn.boosterType);
          sprite.setScale(1);
          sprite.setAlpha(1);
        }
        // Notify level manager
        this.levelManager.onBoosterCreated(boosterSpawn.boosterType);
      }

      // Remove booster-activated tiles if any
      if (activatedTiles.length > 0) {
        this.levelManager.onTilesMatched(activatedTiles);
        await this.animateMatchRemoval([{ tiles: activatedTiles, type: 'burger', direction: 'horizontal' }]);
        if (!this.sceneActive) break;
        this.engine.removeMatches([{ tiles: activatedTiles, type: 'burger', direction: 'horizontal' }]);
      }

      // Apply gravity and get movements
      const movements = this.engine.applyGravity();

      // Animate movements
      if (movements.length > 0) {
        await this.animateMovements(movements);
        if (!this.sceneActive) break;
      }

      // Spawn new tiles
      const spawnRules: SpawnRules = this.levelData.spawn_rules;
      const spawns = this.engine.spawnNewTiles(spawnRules);

      // Animate new tiles
      if (spawns.length > 0) {
        await this.animateNewTiles(spawns);
        if (!this.sceneActive) break;
      }

      // Sync sprites with engine state
      this.syncSpritesToEngine();

      // Performance safeguard: small delay between cascade iterations
      if (!this.sceneActive) break;
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
        // Skip inactive cells
        const sprite = this.tileSprites[tileData.row]?.[tileData.col];
        if (!sprite) return;

        // Add particle pop VFX at each tile position
        const worldX = this.gridOffsetX + tileData.col * this.layout.tileSize + this.layout.tileSize / 2;
        const worldY = this.gridOffsetY + tileData.row * this.layout.tileSize + this.layout.tileSize / 2;
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
      // Skip inactive cells
      const sprite = this.tileSprites[movement.fromRow]?.[movement.fromCol];
      if (!sprite) return;

      tweens.push(
        this.tweenAsync({
          targets: sprite,
          x: this.gridOffsetX + movement.toCol * this.layout.tileSize + this.layout.tileSize / 2,
          y: this.gridOffsetY + movement.toRow * this.layout.tileSize + this.layout.tileSize / 2,
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
      // Skip inactive cells
      const sprite = this.tileSprites[spawn.row]?.[spawn.col];
      if (!sprite) return;

      // Set type and position above screen (safeguard against empty type)
      const tileType = (spawn.type === 'empty' ? 'burger' : spawn.type) as 'burger' | 'hotdog' | 'oil' | 'water' | 'snack' | 'soda';
      sprite.setType(tileType);
      sprite.x = this.gridOffsetX + spawn.col * this.layout.tileSize + this.layout.tileSize / 2;
      sprite.y = this.gridOffsetY - (index + 1) * this.layout.tileSize;
      sprite.setScale(1);
      sprite.setAlpha(1);

      // Tween to final position with bounce ease
      tweens.push(
        this.tweenAsync({
          targets: sprite,
          y: this.gridOffsetY + spawn.row * this.layout.tileSize + this.layout.tileSize / 2,
          duration: 150,
          ease: 'Bounce.Out',
        })
      );
    });

    await Promise.all(tweens);
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    // Skip if scene not active (mid-shutdown)
    if (!this.sceneActive) return;

    const { width, height } = gameSize;

    // Recompute responsive layout
    this.layout = getResponsiveLayout(width, height);

    // Update camera viewport (CRITICAL for input)
    this.cameras.main.setViewport(0, 0, width, height);

    // Recalculate grid offset with new layout (account for UIScene header)
    // NEW: Reapply board width constraint
    this.layout.tileSize = this.calculateConstrainedTileSize(width, height);
    const gridPixelWidth = this.gridWidth * this.layout.tileSize;
    this.gridOffsetX = (width - gridPixelWidth) / 2;
    this.gridOffsetY = cssToGame(50) + this.layout.hudHeight + cssToGame(10);

    // Redraw background
    if (this.bg) {
      this.bg.clear();
      this.bg.fillGradientStyle(0xFFFBF0, 0xFFFBF0, 0xFFF0D0, 0xFFF0D0, 1);
      this.bg.fillRect(0, 0, width, height);
    }

    // Redraw HUD background with new layout (below UIScene header)
    if (this.hudBg) {
      this.hudBg.clear();
      this.hudBg.fillStyle(0xFFB800, 0.15);
      const padding = cssToGame(4);
      const hudY = cssToGame(50);
      this.hudBg.fillRoundedRect(padding * 2, hudY + padding * 2, width - padding * 4, this.layout.hudHeight - padding * 4, cssToGame(4));
      this.hudBg.fillStyle(KLO_YELLOW, 1);
      const stripeWidth = cssToGame(2);
      const stripeHeight = this.layout.hudHeight - padding * 6;
      this.hudBg.fillRoundedRect(padding * 3, hudY + padding * 3, stripeWidth, stripeHeight, cssToGame(1));
    }

    // Recreate HUD text for mobile/desktop switch (destroy and recreate via updateHUDText)
    if (this.hudText) {
      this.hudText.destroy();
      this.hudText = null!;
    }
    if (this.hudGoalText) {
      this.hudGoalText.destroy();
      this.hudGoalText = null!;
    }
    this.updateHUDText(width);

    // Recreate back button for mobile/desktop switch (destroy and recreate)
    if (this.backButton) {
      this.backButton.destroy();
      this.backButton = null!;
    }
    this.createBackButton();

    // Redraw grid background (board, shadow, mask)
    this.redrawGridBackground();

    // Reposition all tile sprites
    this.repositionAllTiles();
  }

  private redrawGridBackground(): void {
    const gridPixelWidth = this.gridWidth * this.layout.tileSize;
    const gridPixelHeight = this.gridHeight * this.layout.tileSize;

    // Redraw shadow
    if (this.gridShadowGraphics) {
      this.gridShadowGraphics.clear();
      this.gridShadowGraphics.fillStyle(0x000000, 0.08);
      const shadowPadding = cssToGame(6);
      this.gridShadowGraphics.fillRoundedRect(
        this.gridOffsetX - shadowPadding,
        this.gridOffsetY - shadowPadding,
        gridPixelWidth + shadowPadding * 2,
        gridPixelHeight + shadowPadding * 2,
        cssToGame(8)
      );
    }

    // Redraw board
    if (this.gridBoardGraphics) {
      this.gridBoardGraphics.clear();
      this.gridBoardGraphics.fillStyle(0xFFFFFF, 0.6);
      const boardPadding = cssToGame(4);
      this.gridBoardGraphics.fillRoundedRect(
        this.gridOffsetX - boardPadding,
        this.gridOffsetY - boardPadding,
        gridPixelWidth + boardPadding * 2,
        gridPixelHeight + boardPadding * 2,
        cssToGame(7)
      );
    }

    // Reposition block sprites or redraw mask for inactive cells
    const inactiveStyle = this.levelData.grid.inactive_cell_style || 'transparent';

    if (inactiveStyle === 'block') {
      // Reposition block sprites on resize with new tile size
      let blockIdx = 0;
      for (let row = 0; row < this.gridHeight; row++) {
        for (let col = 0; col < this.gridWidth; col++) {
          if (!this.engine.isCellActive(row, col)) {
            if (blockIdx < this.blockSprites.length) {
              this.blockSprites[blockIdx].setPosition(
                this.gridOffsetX + col * this.layout.tileSize + this.layout.tileSize / 2,
                this.gridOffsetY + row * this.layout.tileSize + this.layout.tileSize / 2
              );
              this.blockSprites[blockIdx].setDisplaySize(this.layout.tileSize, this.layout.tileSize);
              blockIdx++;
            }
          }
        }
      }
    }

    // Redraw mask for transparent mode
    if (this.gridMaskGraphics && inactiveStyle === 'transparent') {
      this.gridMaskGraphics.clear();
      this.gridMaskGraphics.fillStyle(0xFFFBF0, 1);
      for (let row = 0; row < this.gridHeight; row++) {
        for (let col = 0; col < this.gridWidth; col++) {
          if (!this.engine.isCellActive(row, col)) {
            this.gridMaskGraphics.fillRect(
              this.gridOffsetX + col * this.layout.tileSize,
              this.gridOffsetY + row * this.layout.tileSize,
              this.layout.tileSize,
              this.layout.tileSize
            );
          }
        }
      }
    }
  }

  private repositionAllTiles(): void {
    for (let row = 0; row < this.gridHeight; row++) {
      for (let col = 0; col < this.gridWidth; col++) {
        const sprite = this.tileSprites[row]?.[col];
        if (sprite) {
          sprite.setOffset(this.gridOffsetX, this.gridOffsetY, this.layout.tileSize);
        }
      }
    }
  }

  /**
   * Sync sprite array with engine grid state
   */
  private syncSpritesToEngine(): void {
    const grid: TileData[][] = this.engine.getGrid();

    for (let row = 0; row < this.gridHeight; row++) {
      for (let col = 0; col < this.gridWidth; col++) {
        // Skip inactive cells
        const sprite = this.tileSprites[row][col];
        if (!sprite) continue;

        const tileData = grid[row][col];

        // Engine should never have empty tiles after spawn, but safeguard
        const tileType = (tileData.type === 'empty' ? 'burger' : tileData.type) as 'burger' | 'hotdog' | 'oil' | 'water' | 'snack' | 'soda';

        sprite.setType(tileType);
        sprite.setBooster(tileData.booster);
        sprite.setObstacle(tileData.obstacle);
        sprite.row = row;
        sprite.col = col;
        sprite.x = this.gridOffsetX + col * this.layout.tileSize + this.layout.tileSize / 2;
        sprite.y = this.gridOffsetY + row * this.layout.tileSize + this.layout.tileSize / 2;
        sprite.setScale(1);
        sprite.setAlpha(1);
      }
    }
  }
}

/**
 * LevelSelect Scene - Mini road map with winding path and checkpoint buttons.
 * Player picks a level to play. Shows progress via stars and gold lock overlays.
 */

import Phaser from 'phaser';
import { ProgressManager } from '../game/ProgressManager';
import { EconomyManager } from '../game/EconomyManager';
import { GUI_TEXTURE_KEYS, MAP_CONFIG } from '../game/constants';
import { getResponsiveLayout, cssToGame, getDpr } from '../utils/responsive';
import eventsCenter from '../utils/EventsCenter';

const KLO_YELLOW = 0xffb800;
const KLO_BLACK = 0x1a1a1a;
const KLO_WHITE = 0xf9f9f9;

const LEVEL_NAMES: Record<number, string> = {
  1: 'Перша заправка',
  2: 'Кава в дорогу',
  3: 'Перший лід',
  4: 'Льодяна кава',
  5: 'Перший бустер',
  6: 'Діамантове поле',
  7: 'Трав\'яне поле',
  8: 'Подарунок на старті',
  9: 'Льодяна фортеця',
  10: 'Фінальний виклик',
};

export class LevelSelect extends Phaser.Scene {
  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private overlayActive: boolean = false;
  private levelNodes: Phaser.GameObjects.Container[] = [];

  // UI elements for resize repositioning
  private layout: ReturnType<typeof getResponsiveLayout>;

  // X offset to center nodes on screen
  private nodeOffsetX: number = 0;

  constructor() {
    super({ key: 'LevelSelect' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const progress = this.registry.get('progress') as ProgressManager;
    const economy = this.registry.get('economy') as EconomyManager;

    // Store layout for responsive sizing
    this.layout = getResponsiveLayout(width, height);

    // Calculate x offset to center nodes on screen
    // Node x range is 260-650, center is 455
    const nodeRangeCenter = (260 + 650) / 2;
    this.nodeOffsetX = width / 2 - nodeRangeCenter;

    // Fade in from black
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Camera setup for scrollable world
    // Extend world bottom so first level appears ~30% from bottom of viewport
    const firstLevelY = MAP_CONFIG.LEVEL_NODES[0].y;
    const worldBottom = firstLevelY + Math.round(height * 0.3);
    const worldHeight = Math.max(MAP_CONFIG.MAP_HEIGHT, worldBottom);
    this.cameras.main.setBounds(0, 0, width, worldHeight);

    // No horizontal scroll needed - nodes are centered on screen
    this.cameras.main.scrollX = 0;

    // Create parallax background layers
    this.createParallaxBackground();

    // Draw the road path connecting level nodes
    this.drawRoadPath();

    // Create level checkpoint buttons using MAP_CONFIG positions
    for (let i = 0; i < MAP_CONFIG.LEVEL_NODES.length; i++) {
      const levelId = i + 1;
      const node = MAP_CONFIG.LEVEL_NODES[i];
      this.createLevelCheckpoint(node.x + this.nodeOffsetX, node.y, levelId, progress);
    }

    // Map pointer at current unlocked level
    const currentLevelId = this.getCurrentLevel(progress);
    if (currentLevelId > 0 && currentLevelId <= 10) {
      const pointerPos = MAP_CONFIG.LEVEL_NODES[currentLevelId - 1];
      this.createMapPointer(pointerPos.x + this.nodeOffsetX, pointerPos.y - 60);
    }

    // Setup drag scrolling
    this.setupDragScrolling();

    // Auto-scroll to current level
    this.scrollToCurrentLevel();

    // Launch UIScene with full navigation
    this.scene.launch('UIScene', {
      currentTab: 'levels',
      showBottomNav: true,
      showHeader: true,
    });

    // Listen for navigation events
    eventsCenter.on('navigate-to', this.handleNavigation, this);

    // Register resize handler
    this.scale.on('resize', this.handleResize, this);
  }

  private handleNavigation = (target: string): void => {
    this.scene.stop('UIScene');

    switch (target) {
      case 'levels':
        // Already on levels, no-op
        break;
      case 'collections':
        this.scene.start('Collections');
        break;
      case 'shop':
        this.scene.start('Shop');
        break;
    }
  };

  private createParallaxBackground(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const maxScroll = MAP_CONFIG.MAP_HEIGHT - height;

    // Sky layer - static, covers entire viewport (scrollFactor=0 = screen coords)
    const sky = this.add.image(width / 2, height / 2, 'kyiv_sky');
    // Source: 1536x1024 — scale to cover the full viewport (aspect-fill)
    const skyScale = Math.max(width / 1536, height / 1024);
    sky.setScale(skyScale);
    sky.setScrollFactor(MAP_CONFIG.PARALLAX_SKY);
    sky.setDepth(0);

    // Far layer - 3 segments, slow parallax (scrollFactor 0.25)
    const farEffectiveRange = Math.max(maxScroll, 0) * MAP_CONFIG.PARALLAX_FAR + height;
    // Source: 1536x1024, scale to fill at least viewport width (aspect-fill)
    const farScale = Math.max(width / 1536, MAP_CONFIG.MAP_WIDTH / 1536);
    const farSpacing = farEffectiveRange / 3;
    const farParts = ['kyiv_far_top', 'kyiv_far_mid', 'kyiv_far_bottom'];
    farParts.forEach((key, i) => {
      const part = this.add.image(width / 2, farSpacing * i + farSpacing / 2, key);
      part.setScale(farScale);
      part.setScrollFactor(MAP_CONFIG.PARALLAX_FAR);
      part.setDepth(1);
    });

    // Mid layer - 2 images, medium parallax (scrollFactor 0.6)
    const midEffectiveRange = Math.max(maxScroll, 0) * MAP_CONFIG.PARALLAX_MID + height;
    // Source: 1024x1536, scale to fill at least viewport width
    const midScale = Math.max(width / 1024, 1);
    const midParts = ['kyiv_mid', 'kyiv_mid_0'];
    const midSpacing = midEffectiveRange / 2;
    midParts.forEach((key, i) => {
      const part = this.add.image(width / 2, midSpacing * i + midSpacing / 2, key);
      part.setScale(midScale);
      part.setScrollFactor(MAP_CONFIG.PARALLAX_MID);
      part.setDepth(2);
    });
  }

  private drawRoadPath(): void {
    const path = this.add.graphics();
    path.setDepth(3);

    const nodes = MAP_CONFIG.LEVEL_NODES;
    const offsetX = this.nodeOffsetX;

    // Draw base path (light gray)
    path.lineStyle(10, 0xdddddd, 1);
    path.beginPath();
    path.moveTo(nodes[0].x + offsetX, nodes[0].y);
    for (let i = 1; i < nodes.length; i++) {
      path.lineTo(nodes[i].x + offsetX, nodes[i].y);
    }
    path.strokePath();

    // Draw colored progress line (partial)
    // For now, just draw the full path in a lighter color overlay
    path.lineStyle(6, 0xffb800, 0.4);
    path.beginPath();
    path.moveTo(nodes[0].x + offsetX, nodes[0].y);
    for (let i = 1; i < nodes.length; i++) {
      path.lineTo(nodes[i].x + offsetX, nodes[i].y);
    }
    path.strokePath();
  }

  private setupDragScrolling(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = false;
      this.dragStartY = pointer.y;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown && !this.overlayActive) {
        const deltaY = pointer.y - pointer.prevPosition.y;

        // Check if drag threshold exceeded
        if (Math.abs(pointer.y - this.dragStartY) > MAP_CONFIG.DRAG_THRESHOLD) {
          this.isDragging = true;
        }

        // Scroll camera if dragging
        if (this.isDragging) {
          this.cameras.main.scrollY -= deltaY;
        }
      }
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging && !this.overlayActive) {
        this.handleTap(pointer);
      }
      this.isDragging = false;
    });
  }

  private handleTap(pointer: Phaser.Input.Pointer): void {
    // Convert pointer screen coordinates to world coordinates
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

    // Check each level node container to see if tap is within its bounds
    for (let i = 0; i < this.levelNodes.length; i++) {
      const container = this.levelNodes[i];
      if (!container) continue;

      const bounds = container.getBounds();

      if (Phaser.Geom.Rectangle.Contains(bounds, worldPoint.x, worldPoint.y)) {
        const levelId = i + 1;
        const progress = this.registry.get('progress') as ProgressManager;
        const economy = this.registry.get('economy') as EconomyManager;

        // Check if level is unlocked
        if (progress.isLevelUnlocked(levelId)) {
          // Check economy gating
          if (!economy.canStartLevel()) {
            this.showNoLivesPrompt(economy);
            return;
          }

          // Start level with fade out
          this.cameras.main.fadeOut(300, 0, 0, 0);
          this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('Game', { levelId });
          });
          return;
        }
      }
    }
  }

  private scrollToCurrentLevel(): void {
    const progress = this.registry.get('progress') as ProgressManager;
    const currentLevelId = this.getCurrentLevel(progress);
    const width = this.cameras.main.width;

    if (currentLevelId > 0 && currentLevelId <= 10) {
      const targetNode = MAP_CONFIG.LEVEL_NODES[currentLevelId - 1];
      // Pan camera vertically to current level (X stays centered)
      this.cameras.main.pan(width / 2, targetNode.y, 800, 'Sine.easeInOut', true);
    }
  }


  private showNoLivesPrompt(economy: EconomyManager): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Block scroll interaction while overlay is active
    this.overlayActive = true;

    // Store overlay elements for cleanup
    const overlayElements: Phaser.GameObjects.GameObject[] = [];

    // Dark backdrop - blocks scroll dragging
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.6);
    backdrop.fillRect(0, 0, width, height);
    backdrop.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
    backdrop.setScrollFactor(0);
    backdrop.setDepth(100);
    overlayElements.push(backdrop);

    // White panel
    const panelW = Math.min(cssToGame(300), width * 0.9);
    const panelH = cssToGame(250);
    const panelX = (width - panelW) / 2;
    const panelY = (height - panelH) / 2;

    const panel = this.add.graphics();
    panel.fillStyle(KLO_WHITE, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, cssToGame(16));
    panel.setScrollFactor(0);
    panel.setDepth(101);
    overlayElements.push(panel);

    // Title
    const title = this.add.text(width / 2, panelY + cssToGame(50), 'Немає життів!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(28)}px`,
      color: '#1A1A1A',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    title.setScrollFactor(0);
    title.setDepth(102);
    overlayElements.push(title);

    // Countdown
    const seconds = economy.getSecondsUntilNextLife();
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const countdownMsg = this.add.text(
      width / 2,
      panelY + cssToGame(90),
      `Наступне через: ${minutes}:${secs.toString().padStart(2, '0')}`,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${cssToGame(14)}px`,
        color: '#666666',
      }
    );
    countdownMsg.setOrigin(0.5);
    countdownMsg.setScrollFactor(0);
    countdownMsg.setDepth(102);
    overlayElements.push(countdownMsg);

    const canRefill = economy.getBonuses() >= 15;

    // Refill button or message
    if (canRefill) {
      const refillBtn = this.createOverlayButton(
        width / 2,
        panelY + cssToGame(140),
        'Поповнити (15 бонусів)',
        async () => {
          const success = await economy.spendBonusesForRefill();
          if (success) {
            // Clean up overlay
            overlayElements.forEach(el => el.destroy());
            this.overlayActive = false;
          }
        }
      );
      overlayElements.push(refillBtn);
    } else {
      const noBonus = this.add.text(width / 2, panelY + cssToGame(140), 'Недостатньо бонусів', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${cssToGame(16)}px`,
        color: '#999999',
        fontStyle: 'bold',
      });
      noBonus.setOrigin(0.5);
      noBonus.setScrollFactor(0);
      noBonus.setDepth(102);
      overlayElements.push(noBonus);
    }

    // Close button
    const closeBtn = this.createOverlayButton(
      width / 2,
      panelY + cssToGame(190),
      'Закрити',
      () => {
        overlayElements.forEach(el => el.destroy());
        this.overlayActive = false;
      },
      true
    );
    overlayElements.push(closeBtn);
  }

  private createOverlayButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    secondary: boolean = false
  ): Phaser.GameObjects.Container {
    const buttonWidth = cssToGame(140);
    const buttonHeight = cssToGame(36);

    const bg = this.add.image(0, 0, secondary ? GUI_TEXTURE_KEYS.buttonYellow : GUI_TEXTURE_KEYS.buttonOrange);
    bg.setDisplaySize(buttonWidth, buttonHeight);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(13)}px`,
      color: '#1A1A1A',
      fontStyle: 'bold',
    });
    text.setOrigin(0.5);

    const container = this.add.container(x, y, [bg, text]);
    container.setSize(buttonWidth, buttonHeight);
    container.setInteractive({ useHandCursor: true });
    container.setScrollFactor(0);
    container.setDepth(102);

    container.on('pointerover', () => container.setScale(1.05));
    container.on('pointerout', () => container.setScale(1));
    container.on('pointerdown', () => container.setScale(0.95));
    container.on('pointerup', onClick);

    return container;
  }


  private createLevelCheckpoint(
    x: number,
    y: number,
    levelId: number,
    progress: ProgressManager
  ): void {
    const unlocked = progress.isLevelUnlocked(levelId);
    const stars = progress.getStars(levelId);
    const name = LEVEL_NAMES[levelId] || `Рівень ${levelId}`;
    const landmark = MAP_CONFIG.LEVEL_NODES[levelId - 1].label;

    const size = cssToGame(38);

    // Button background - circular checkpoint using GUI sprite
    const bg = this.add.image(0, 0, unlocked ? GUI_TEXTURE_KEYS.buttonOrange : GUI_TEXTURE_KEYS.buttonYellow);
    bg.setDisplaySize(size, size);

    // Apply tint for locked levels
    if (!unlocked) {
      bg.setTint(0xcccccc);
    }

    // Level number
    const numText = this.add.text(0, 0, String(levelId), {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(18)}px`,
      color: unlocked ? '#1A1A1A' : '#999999',
      fontStyle: 'bold',
    });
    numText.setOrigin(0.5);

    // Stars display below button
    const starString = this.getStarString(stars);
    const starText = this.add.text(0, size / 2 + cssToGame(10), starString, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(10)}px`,
      color: '#FFB800',
    });
    starText.setOrigin(0.5);

    // Kyiv landmark label below stars
    const landmarkText = this.add.text(0, size / 2 + cssToGame(25), landmark, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(8)}px`,
      color: '#666666',
    });
    landmarkText.setOrigin(0.5);

    const children: Phaser.GameObjects.GameObject[] = [bg, numText, starText, landmarkText];

    // Crown decoration for 3-star levels
    if (stars === 3) {
      const crown = this.add.image(0, -size / 2 - cssToGame(10), GUI_TEXTURE_KEYS.crown1);
      crown.setDisplaySize(cssToGame(16), cssToGame(16));
      children.push(crown);
    }

    // Lock overlay for locked levels
    if (!unlocked) {
      const lockOverlay = this.add.graphics();
      lockOverlay.fillStyle(0x000000, 0.3);
      lockOverlay.fillCircle(0, 0, size / 2);

      const lockIcon = this.add.image(0, 0, GUI_TEXTURE_KEYS.goldLock);
      lockIcon.setDisplaySize(cssToGame(20), cssToGame(20));

      children.unshift(lockOverlay); // Add behind lock icon
      children.push(lockIcon);
    }

    const container = this.add.container(x, y, children);
    container.setSize(size, size);
    container.setDepth(5);

    // Store container for tap detection
    this.levelNodes.push(container);

    // Make interactive for hit testing, but don't add event handlers
    // (scene-level tap handler will check bounds centrally)
    if (unlocked) {
      container.setInteractive({ useHandCursor: true });
    }
  }

  private createMapPointer(x: number, y: number): void {
    const pointer = this.add.image(x, y, GUI_TEXTURE_KEYS.mapPointer);
    pointer.setDisplaySize(cssToGame(24), cssToGame(24));
    pointer.setDepth(6);

    // Gentle bobbing animation
    this.tweens.add({
      targets: pointer,
      y: y + 10,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private getCurrentLevel(progress: ProgressManager): number {
    // Find the first locked level (that's the current target)
    for (let i = 1; i <= 10; i++) {
      if (!progress.isLevelUnlocked(i)) {
        return i - 1; // Previous level is current
      }
    }
    return 10; // All unlocked
  }

  private getStarString(stars: number): string {
    let result = '';
    for (let i = 0; i < 3; i++) {
      result += i < stars ? '★' : '☆';
    }
    return result;
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    const { width, height } = gameSize;

    // Recompute layout for new viewport
    this.layout = getResponsiveLayout(width, height);

    // Update camera viewport (CRITICAL for input)
    this.cameras.main.setViewport(0, 0, width, height);

    // Update camera bounds with dynamic bottom padding
    const firstLevelY = MAP_CONFIG.LEVEL_NODES[0].y;
    const worldBottom = firstLevelY + Math.round(height * 0.3);
    const worldHeight = Math.max(MAP_CONFIG.MAP_HEIGHT, worldBottom);
    this.cameras.main.setBounds(0, 0, width, worldHeight);

    // No horizontal scroll needed - nodes are centered on screen
    this.cameras.main.setScroll(0, this.cameras.main.scrollY);
  }

  shutdown(): void {
    // Cleanup resize handler
    this.scale.off('resize', this.handleResize, this);

    // Cleanup event listeners
    eventsCenter.off('navigate-to', this.handleNavigation, this);

    // Cleanup pointer event listeners
    this.input.off('pointerdown');
    this.input.off('pointermove');
    this.input.off('pointerup');

    // Stop UIScene
    this.scene.stop('UIScene');

    // Clear level nodes array
    this.levelNodes = [];
  }
}

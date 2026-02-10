/**
 * LevelSelect Scene - Mini road map with winding path and checkpoint buttons.
 * Player picks a level to play. Shows progress via stars and gold lock overlays.
 */

import Phaser from 'phaser';
import { ProgressManager } from '../game/ProgressManager';
import { EconomyManager } from '../game/EconomyManager';
import { SettingsManager } from '../game/SettingsManager';
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
  private backButton: Phaser.GameObjects.Container;
  private layout: ReturnType<typeof getResponsiveLayout>;

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

    // Fade in from black
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Camera setup for scrollable world
    // Extend world bottom so first level appears ~30% from bottom of viewport
    const firstLevelY = MAP_CONFIG.LEVEL_NODES[0].y;
    const worldBottom = firstLevelY + Math.round(height * 0.3);
    const worldHeight = Math.max(MAP_CONFIG.MAP_HEIGHT, worldBottom);
    this.cameras.main.setBounds(0, 0, MAP_CONFIG.MAP_WIDTH, worldHeight);

    // Center camera horizontally on level node range
    const nodeRangeCenterX = (260 + 650) / 2;
    const scrollX = Phaser.Math.Clamp(
      nodeRangeCenterX - width / 2,
      0,
      Math.max(0, MAP_CONFIG.MAP_WIDTH - width)
    );
    this.cameras.main.scrollX = scrollX;

    // Create parallax background layers
    this.createParallaxBackground();

    // Draw the road path connecting level nodes
    this.drawRoadPath();

    // Create level checkpoint buttons using MAP_CONFIG positions
    for (let i = 0; i < MAP_CONFIG.LEVEL_NODES.length; i++) {
      const levelId = i + 1;
      const node = MAP_CONFIG.LEVEL_NODES[i];
      this.createLevelCheckpoint(node.x, node.y, levelId, progress);
    }

    // Map pointer at current unlocked level
    const currentLevelId = this.getCurrentLevel(progress);
    if (currentLevelId > 0 && currentLevelId <= 10) {
      const pointerPos = MAP_CONFIG.LEVEL_NODES[currentLevelId - 1];
      this.createMapPointer(pointerPos.x, pointerPos.y - 60);
    }

    // Back button (below UIScene header)
    this.createBackButton();

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
    eventsCenter.on('open-settings', this.showSettingsOverlay, this);

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
      const part = this.add.image(MAP_CONFIG.MAP_WIDTH / 2, farSpacing * i + farSpacing / 2, key);
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
      const part = this.add.image(MAP_CONFIG.MAP_WIDTH / 2, midSpacing * i + midSpacing / 2, key);
      part.setScale(midScale);
      part.setScrollFactor(MAP_CONFIG.PARALLAX_MID);
      part.setDepth(2);
    });
  }

  private drawRoadPath(): void {
    const path = this.add.graphics();
    path.setDepth(3);

    const nodes = MAP_CONFIG.LEVEL_NODES;

    // Draw base path (light gray)
    path.lineStyle(10, 0xdddddd, 1);
    path.beginPath();
    path.moveTo(nodes[0].x, nodes[0].y);
    for (let i = 1; i < nodes.length; i++) {
      path.lineTo(nodes[i].x, nodes[i].y);
    }
    path.strokePath();

    // Draw colored progress line (partial)
    // For now, just draw the full path in a lighter color overlay
    path.lineStyle(6, 0xffb800, 0.4);
    path.beginPath();
    path.moveTo(nodes[0].x, nodes[0].y);
    for (let i = 1; i < nodes.length; i++) {
      path.lineTo(nodes[i].x, nodes[i].y);
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

    if (currentLevelId > 0 && currentLevelId <= 10) {
      const targetNode = MAP_CONFIG.LEVEL_NODES[currentLevelId - 1];
      // Pan camera: center X on node range, Y on current level
      const nodeRangeCenterX = (260 + 650) / 2;
      this.cameras.main.pan(nodeRangeCenterX, targetNode.y, 800, 'Sine.easeInOut', true);
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

  private createBackButton(): void {
    const buttonWidth = cssToGame(60);
    const buttonHeight = cssToGame(28);
    const buttonY = cssToGame(50) + cssToGame(15); // Below UIScene header

    // Button background using GUI sprite
    const buttonBg = this.add.image(0, 0, GUI_TEXTURE_KEYS.buttonYellow);
    buttonBg.setDisplaySize(buttonWidth, buttonHeight);

    const buttonText = this.add.text(0, 0, '< Меню', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(11)}px`,
      color: '#1A1A1A',
    });
    buttonText.setOrigin(0.5);

    this.backButton = this.add.container(cssToGame(40), buttonY, [buttonBg, buttonText]);
    this.backButton.setSize(buttonWidth, buttonHeight);
    this.backButton.setInteractive({ useHandCursor: true });
    this.backButton.setScrollFactor(0);
    this.backButton.setDepth(11);

    this.backButton.on('pointerover', () => {
      this.tweens.add({
        targets: this.backButton,
        scale: 1.05,
        duration: 100,
      });
    });

    this.backButton.on('pointerout', () => {
      this.tweens.add({
        targets: this.backButton,
        scale: 1,
        duration: 100,
      });
    });

    this.backButton.on('pointerup', () => {
      // Fade out to black before returning to menu
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Menu');
      });
    });
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


  private showSettingsOverlay(): void {
    const settings = this.registry.get('settings') as SettingsManager;
    if (!settings) {
      console.warn('[LevelSelect] SettingsManager not found in registry');
      return;
    }

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Block scroll interaction while overlay is active
    this.overlayActive = true;

    // Store all overlay elements for cleanup
    const overlayElements: Phaser.GameObjects.GameObject[] = [];

    // Dark backdrop - blocks clicks to elements behind and scroll dragging
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.7);
    backdrop.fillRect(0, 0, width, height);
    backdrop.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
    backdrop.setScrollFactor(0);
    backdrop.setDepth(100);
    backdrop.on('pointerup', () => {
      // Click backdrop to close
      overlayElements.forEach(el => el.destroy());
      this.overlayActive = false;
    });
    overlayElements.push(backdrop);

    // White panel (responsive width, centered)
    const panelW = Math.min(cssToGame(340), width * 0.9);
    const panelH = cssToGame(380);
    const panelX = (width - panelW) / 2;
    const panelY = (height - panelH) / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0xF9F9F9, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, cssToGame(16));
    panel.setInteractive(new Phaser.Geom.Rectangle(panelX, panelY, panelW, panelH), Phaser.Geom.Rectangle.Contains);
    panel.setScrollFactor(0);
    panel.setDepth(101);
    overlayElements.push(panel);

    // Title
    const title = this.add.text(width / 2, panelY + cssToGame(50), 'Налаштування', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(24)}px`,
      color: '#1A1A1A',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    title.setScrollFactor(0);
    title.setDepth(102);
    overlayElements.push(title);

    // ---- SFX Toggle (y offset ~100 from panel top) ----
    const sfxRowY = panelY + cssToGame(100);

    const sfxLabel = this.add.text(panelX + cssToGame(30), sfxRowY, 'Звукові ефекти', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(16)}px`,
      color: '#1A1A1A',
    });
    sfxLabel.setOrigin(0, 0.5);
    sfxLabel.setScrollFactor(0);
    sfxLabel.setDepth(102);
    overlayElements.push(sfxLabel);

    // Toggle switch: track state with mutable local variable
    let sfxEnabled = settings.get('sfxEnabled');

    const sfxToggleBg = this.add.graphics();
    sfxToggleBg.setScrollFactor(0);
    sfxToggleBg.setDepth(102);
    const sfxToggleThumb = this.add.circle(0, 0, cssToGame(12), 0xFFFFFF);
    sfxToggleThumb.setScrollFactor(0);
    sfxToggleThumb.setDepth(103);
    const sfxToggleX = panelX + panelW - cssToGame(80);
    const toggleWidth = cssToGame(60);
    const toggleHeight = cssToGame(30);

    const updateSfxToggle = () => {
      sfxToggleBg.clear();
      sfxToggleBg.fillStyle(sfxEnabled ? 0x4CAF50 : 0xCCCCCC, 1);
      sfxToggleBg.fillRoundedRect(sfxToggleX, sfxRowY - toggleHeight/2, toggleWidth, toggleHeight, toggleHeight/2);

      // Position thumb: left when off, right when on
      const thumbX = sfxEnabled ? sfxToggleX + toggleWidth - cssToGame(16) : sfxToggleX + cssToGame(16);
      sfxToggleThumb.setPosition(thumbX, sfxRowY);
    };

    updateSfxToggle();
    overlayElements.push(sfxToggleBg, sfxToggleThumb);

    // Make toggle interactive
    const sfxToggleHitArea = this.add.rectangle(sfxToggleX + toggleWidth/2, sfxRowY, toggleWidth, toggleHeight);
    sfxToggleHitArea.setInteractive({ useHandCursor: true });
    sfxToggleHitArea.setAlpha(0.001);
    sfxToggleHitArea.setScrollFactor(0);
    sfxToggleHitArea.setDepth(103);
    overlayElements.push(sfxToggleHitArea);

    sfxToggleHitArea.on('pointerup', () => {
      sfxEnabled = !sfxEnabled;
      settings.set('sfxEnabled', sfxEnabled);

      // Animate thumb position
      const thumbX = sfxEnabled ? sfxToggleX + toggleWidth - cssToGame(16) : sfxToggleX + cssToGame(16);
      this.tweens.add({
        targets: sfxToggleThumb,
        x: thumbX,
        duration: 200,
        ease: 'Cubic.Out',
      });

      // Update background color
      updateSfxToggle();
    });

    // ---- Volume Slider (y offset ~170 from panel top) ----
    const volumeRowY = panelY + cssToGame(170);

    const volumeLabel = this.add.text(panelX + cssToGame(30), volumeRowY, 'Гучність', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(16)}px`,
      color: '#1A1A1A',
    });
    volumeLabel.setOrigin(0, 0.5);
    volumeLabel.setScrollFactor(0);
    volumeLabel.setDepth(102);
    overlayElements.push(volumeLabel);

    const sliderTrackX = panelX + panelW - cssToGame(160);
    const sliderTrackW = cssToGame(140);
    const sliderTrackH = cssToGame(6);

    // Track background
    const sliderTrack = this.add.rectangle(sliderTrackX, volumeRowY, sliderTrackW, sliderTrackH, 0xDDDDDD);
    sliderTrack.setOrigin(0, 0.5);
    sliderTrack.setScrollFactor(0);
    sliderTrack.setDepth(102);
    overlayElements.push(sliderTrack);

    // Fill (shows current volume)
    const sliderFill = this.add.rectangle(sliderTrackX, volumeRowY, 0, sliderTrackH, 0xFFB800);
    sliderFill.setOrigin(0, 0.5);
    sliderFill.setScrollFactor(0);
    sliderFill.setDepth(102);
    overlayElements.push(sliderFill);

    // Thumb
    const volume = settings.get('sfxVolume');
    const thumbX = sliderTrackX + volume * sliderTrackW;
    const sliderThumb = this.add.circle(thumbX, volumeRowY, cssToGame(10), 0xFFFFFF);
    sliderThumb.setStrokeStyle(cssToGame(2), 0xFFB800);
    sliderThumb.setScrollFactor(0);
    sliderThumb.setDepth(103);
    overlayElements.push(sliderThumb);

    // Initial fill width
    sliderFill.setDisplaySize(volume * sliderTrackW, sliderTrackH);

    // Make thumb draggable
    sliderThumb.setInteractive({ useHandCursor: true, draggable: true });
    this.input.setDraggable(sliderThumb);

    sliderThumb.on('drag', (pointer: Phaser.Input.Pointer) => {
      // Clamp thumb position to track bounds
      const clampedX = Phaser.Math.Clamp(pointer.x, sliderTrackX, sliderTrackX + sliderTrackW);
      sliderThumb.setX(clampedX);

      // Update fill width
      const fillWidth = clampedX - sliderTrackX;
      sliderFill.setDisplaySize(fillWidth, sliderTrackH);

      // Calculate and set volume value
      const volumeValue = (clampedX - sliderTrackX) / sliderTrackW;
      settings.set('sfxVolume', volumeValue);
    });

    // ---- Animation Toggle (y offset ~240 from panel top) ----
    const animRowY = panelY + cssToGame(240);

    const animLabel = this.add.text(panelX + cssToGame(30), animRowY, 'Анімації бустерів', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(16)}px`,
      color: '#1A1A1A',
    });
    animLabel.setOrigin(0, 0.5);
    animLabel.setScrollFactor(0);
    animLabel.setDepth(102);
    overlayElements.push(animLabel);

    // Toggle switch: track state with mutable local variable
    let animEnabled = settings.get('animationsEnabled');

    const animToggleBg = this.add.graphics();
    animToggleBg.setScrollFactor(0);
    animToggleBg.setDepth(102);
    const animToggleThumb = this.add.circle(0, 0, cssToGame(12), 0xFFFFFF);
    animToggleThumb.setScrollFactor(0);
    animToggleThumb.setDepth(103);
    const animToggleX = panelX + panelW - cssToGame(80);

    const updateAnimToggle = () => {
      animToggleBg.clear();
      animToggleBg.fillStyle(animEnabled ? 0x4CAF50 : 0xCCCCCC, 1);
      animToggleBg.fillRoundedRect(animToggleX, animRowY - toggleHeight/2, toggleWidth, toggleHeight, toggleHeight/2);

      // Position thumb: left when off, right when on
      const thumbX = animEnabled ? animToggleX + toggleWidth - cssToGame(16) : animToggleX + cssToGame(16);
      animToggleThumb.setPosition(thumbX, animRowY);
    };

    updateAnimToggle();
    overlayElements.push(animToggleBg, animToggleThumb);

    // Make toggle interactive
    const animToggleHitArea = this.add.rectangle(animToggleX + toggleWidth/2, animRowY, toggleWidth, toggleHeight);
    animToggleHitArea.setInteractive({ useHandCursor: true });
    animToggleHitArea.setAlpha(0.001);
    animToggleHitArea.setScrollFactor(0);
    animToggleHitArea.setDepth(103);
    overlayElements.push(animToggleHitArea);

    animToggleHitArea.on('pointerup', () => {
      animEnabled = !animEnabled;
      settings.set('animationsEnabled', animEnabled);

      // Animate thumb position
      const thumbX = animEnabled ? animToggleX + toggleWidth - cssToGame(16) : animToggleX + cssToGame(16);
      this.tweens.add({
        targets: animToggleThumb,
        x: thumbX,
        duration: 200,
        ease: 'Cubic.Out',
      });

      // Update background color
      updateAnimToggle();
    });

    // ---- Close Button (y offset ~320 from panel top) ----
    const closeBtn = this.createOverlayButton(
      width / 2,
      panelY + cssToGame(320),
      'Закрити',
      () => {
        overlayElements.forEach(el => el.destroy());
        this.overlayActive = false;
      },
      true
    );
    overlayElements.push(closeBtn);
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
    this.cameras.main.setBounds(0, 0, MAP_CONFIG.MAP_WIDTH, worldHeight);

    // Center camera horizontally on level node range (x=260..650)
    const nodeRangeCenter = (260 + 650) / 2;
    const scrollX = Phaser.Math.Clamp(
      nodeRangeCenter - width / 2,
      0,
      Math.max(0, MAP_CONFIG.MAP_WIDTH - width)
    );
    this.cameras.main.setScroll(scrollX, this.cameras.main.scrollY);

    // Reposition back button
    if (this.backButton) {
      this.backButton.setPosition(cssToGame(40), cssToGame(50) + cssToGame(15));
    }
  }

  shutdown(): void {
    // Cleanup resize handler
    this.scale.off('resize', this.handleResize, this);

    // Cleanup event listeners
    eventsCenter.off('navigate-to', this.handleNavigation, this);
    eventsCenter.off('open-settings', this.showSettingsOverlay, this);

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

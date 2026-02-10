/**
 * UIScene - Persistent UI scene with global header and bottom navigation.
 *
 * This scene runs in PARALLEL with content scenes (LevelSelect, Collections, Shop)
 * and displays a consistent header + bottom nav that stays visible across navigation.
 *
 * Features:
 * - Header: Lives/bonuses/countdown/settings (reactively updated from EconomyManager events)
 * - Bottom nav: 3 tabs (Levels/Collections/Shop) with active tab highlighting
 * - Emits navigation events via EventsCenter for content scene switching
 * - Responsive resize handling
 */

import Phaser from 'phaser';
import { EconomyManager } from '../game/EconomyManager';
import { cssToGame, getDpr } from '../utils/responsive';
import eventsCenter from '../utils/EventsCenter';

interface UISceneData {
  currentTab?: 'levels' | 'collections' | 'shop';
  showBottomNav?: boolean; // default true
  showHeader?: boolean; // default true
}

export class UIScene extends Phaser.Scene {
  private currentTab: 'levels' | 'collections' | 'shop';
  private showBottomNav: boolean;
  private showHeader: boolean;

  // Header elements
  private headerBg: Phaser.GameObjects.Graphics | null = null;
  private heartIcons: Phaser.GameObjects.Image[] = [];
  private countdownText: Phaser.GameObjects.Text | null = null;
  private bonusIcon: Phaser.GameObjects.Text | null = null;
  private bonusText: Phaser.GameObjects.Text | null = null;
  private settingsGear: Phaser.GameObjects.Text | null = null;

  // Bottom nav elements
  private navBg: Phaser.GameObjects.Graphics | null = null;
  private navBorder: Phaser.GameObjects.Graphics | null = null;
  private tabElements: Map<string, Phaser.GameObjects.GameObject[]> = new Map();

  // Reactive updates
  private countdownTimer: Phaser.Time.TimerEvent | null = null;
  private economy: EconomyManager | null = null;

  constructor() {
    super({ key: 'UIScene' });
  }

  init(data: UISceneData): void {
    this.currentTab = data.currentTab || 'levels';
    this.showBottomNav = data.showBottomNav !== false; // default true
    this.showHeader = data.showHeader !== false; // default true
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    if (this.showHeader) {
      this.createHeader(width);
    }

    if (this.showBottomNav) {
      this.createBottomNav(width, height);
    }

    this.setupReactiveUpdates();

    // Register resize handler
    this.scale.on('resize', this.handleResize, this);

    // Register shutdown cleanup
    this.events.once('shutdown', this.onShutdown, this);
  }

  private createHeader(width: number): void {
    const headerHeight = cssToGame(50);

    // Background: white with 0.8 alpha, blocks click-through
    this.headerBg = this.add.graphics();
    this.headerBg.fillStyle(0xffffff, 0.8);
    this.headerBg.fillRect(0, 0, width, headerHeight);
    this.headerBg.setScrollFactor(0);
    this.headerBg.setDepth(200);
    this.headerBg.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, headerHeight),
      Phaser.Geom.Rectangle.Contains
    );

    // Bonus icon (left side of header)
    this.bonusIcon = this.add.text(cssToGame(20), headerHeight / 2 - cssToGame(2), '💵', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(14)}px`,
    });
    this.bonusIcon.setOrigin(0, 0.5);
    this.bonusIcon.setScrollFactor(0);
    this.bonusIcon.setDepth(201);

    // Bonus text
    this.bonusText = this.add.text(cssToGame(38), headerHeight / 2 - cssToGame(2), '500', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(13)}px`,
      color: '#FFB800',
      fontStyle: 'bold',
    });
    this.bonusText.setOrigin(0, 0.5);
    this.bonusText.setScrollFactor(0);
    this.bonusText.setDepth(201);

    // Heart icons (5 hearts, centered in header)
    const heartSize = cssToGame(16);
    const heartSpacing = cssToGame(18);
    const totalHeartsWidth = 5 * heartSpacing - (heartSpacing - heartSize); // 5 hearts with spacing
    const heartsStartX = (width - totalHeartsWidth) / 2;
    this.heartIcons = [];

    for (let i = 0; i < 5; i++) {
      const heart = this.add.image(
        heartsStartX + i * heartSpacing,
        headerHeight / 2 - cssToGame(2),
        'gui_heart'
      );
      heart.setDisplaySize(heartSize, heartSize);
      heart.setOrigin(0, 0.5);
      heart.setScrollFactor(0);
      heart.setDepth(201);
      this.heartIcons.push(heart);
    }

    // Countdown text (centered below hearts, hidden when lives = 5)
    this.countdownText = this.add.text(width / 2, headerHeight / 2 + cssToGame(12), '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(9)}px`,
      color: '#666666',
    });
    this.countdownText.setOrigin(0.5, 0.5);
    this.countdownText.setScrollFactor(0);
    this.countdownText.setDepth(201);
    this.countdownText.setVisible(false);

    // Settings gear icon
    this.settingsGear = this.add.text(width - cssToGame(25), headerHeight / 2, '⚙', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(20)}px`,
      color: '#1A1A1A',
    });
    this.settingsGear.setOrigin(0.5);
    this.settingsGear.setScrollFactor(0);
    this.settingsGear.setDepth(201);
    this.settingsGear.setInteractive({ useHandCursor: true });
    this.settingsGear.on('pointerup', () => {
      eventsCenter.emit('open-settings');
    });
  }

  private createBottomNav(width: number, height: number): void {
    const navHeight = cssToGame(56);

    // Read safe area bottom inset from CSS custom property
    const safeAreaBottomCss = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0'
    );
    const safeAreaBottom = safeAreaBottomCss * getDpr();

    const navY = height - navHeight - safeAreaBottom;

    // Background: white with 0.95 alpha, blocks click-through
    this.navBg = this.add.graphics();
    this.navBg.fillStyle(0xffffff, 0.95);
    this.navBg.fillRect(0, navY, width, navHeight + safeAreaBottom);
    this.navBg.setScrollFactor(0);
    this.navBg.setDepth(200);
    this.navBg.setInteractive(
      new Phaser.Geom.Rectangle(0, navY, width, navHeight + safeAreaBottom),
      Phaser.Geom.Rectangle.Contains
    );

    // Top border
    this.navBorder = this.add.graphics();
    this.navBorder.lineStyle(1, 0xe0e0e0, 1);
    this.navBorder.beginPath();
    this.navBorder.moveTo(0, navY);
    this.navBorder.lineTo(width, navY);
    this.navBorder.strokePath();
    this.navBorder.setScrollFactor(0);
    this.navBorder.setDepth(200);

    // Create 3 tab buttons
    const navCenterY = navY + navHeight / 2;
    this.createTabButton(width * 0.17, navCenterY, 'Рівні', '🗺', 'levels');
    this.createTabButton(width * 0.5, navCenterY, 'Колекції', '🃏', 'collections');
    this.createTabButton(width * 0.83, navCenterY, 'Магазин', '🛒', 'shop');
  }

  private createTabButton(
    x: number,
    navCenterY: number,
    label: string,
    icon: string,
    tabId: 'levels' | 'collections' | 'shop'
  ): void {
    const elements: Phaser.GameObjects.GameObject[] = [];

    const isActive = tabId === this.currentTab;

    // Active tab gets a subtle glow behind icon
    if (isActive) {
      const glow = this.add.circle(x, navCenterY - cssToGame(6), cssToGame(20), 0xffb800, 0.15);
      glow.setScrollFactor(0);
      glow.setDepth(201);
      elements.push(glow);
    }

    // Icon
    const iconObj = this.add.text(x, navCenterY - cssToGame(6), icon, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(18)}px`,
      color: isActive ? '#FFB800' : '#AAAAAA',
    });
    iconObj.setOrigin(0.5);
    iconObj.setScrollFactor(0);
    iconObj.setDepth(201);
    elements.push(iconObj);

    // Label
    const labelObj = this.add.text(x, navCenterY + cssToGame(12), label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${cssToGame(10)}px`,
      color: isActive ? '#FFB800' : '#AAAAAA',
      fontStyle: isActive ? 'bold' : 'normal',
    });
    labelObj.setOrigin(0.5);
    labelObj.setScrollFactor(0);
    labelObj.setDepth(201);
    elements.push(labelObj);

    // Invisible hit area for interaction
    const hitAreaWidth = cssToGame(80);
    const hitAreaHeight = cssToGame(56);
    const hitArea = this.add.rectangle(
      x,
      navCenterY,
      hitAreaWidth,
      hitAreaHeight,
      0x000000,
      0.001
    );
    hitArea.setScrollFactor(0);
    hitArea.setDepth(202);
    hitArea.setInteractive({ useHandCursor: true });
    hitArea.on('pointerup', () => {
      if (tabId !== this.currentTab) {
        eventsCenter.emit('navigate-to', tabId);
      }
    });
    elements.push(hitArea);

    // Store elements for later updates
    this.tabElements.set(tabId, elements);
  }

  private setupReactiveUpdates(): void {
    this.economy = this.registry.get('economy') as EconomyManager;

    if (!this.economy) {
      console.error('[UIScene] EconomyManager not found in registry');
      return;
    }

    // Subscribe to economy events
    this.economy.on('lives-changed', this.onLivesChanged, this);
    this.economy.on('bonuses-changed', this.onBonusesChanged, this);

    // Setup 1-second timer for countdown updates
    this.countdownTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updateCountdown,
      callbackScope: this,
      loop: true,
    });

    // Initial update
    this.onLivesChanged();
    this.onBonusesChanged();
  }

  private onLivesChanged = (): void => {
    if (!this.economy || this.heartIcons.length === 0) return;

    const lives = this.economy.getLives();

    // Update heart icons: filled for available, dark for lost
    for (let i = 0; i < 5; i++) {
      const heart = this.heartIcons[i];
      if (heart) {
        heart.setTexture(i < lives ? 'gui_heart' : 'gui_heart_dark');
      }
    }

    this.updateCountdown();
  };

  private onBonusesChanged = (): void => {
    if (!this.economy || !this.bonusText) return;

    const bonuses = this.economy.getBonuses();
    this.bonusText.setText(`${bonuses}`);
  };

  private updateCountdown = (): void => {
    if (!this.economy || !this.countdownText) return;

    const lives = this.economy.getLives();

    if (lives >= 5) {
      this.countdownText.setVisible(false);
      return;
    }

    const seconds = this.economy.getSecondsUntilNextLife();
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    this.countdownText.setText(`+1 через ${minutes}:${secs.toString().padStart(2, '0')}`);
    this.countdownText.setVisible(true);
  };

  private handleResize = (gameSize: Phaser.Structs.Size): void => {
    const width = gameSize.width;
    const height = gameSize.height;

    // Destroy all existing UI elements
    this.destroyAllElements();

    // Recreate header and bottom nav
    if (this.showHeader) {
      this.createHeader(width);
    }

    if (this.showBottomNav) {
      this.createBottomNav(width, height);
    }

    // Re-subscribe to economy events
    this.setupReactiveUpdates();
  };

  private destroyAllElements(): void {
    // Destroy header elements
    if (this.headerBg) this.headerBg.destroy();
    this.heartIcons.forEach((heart) => heart.destroy());
    this.heartIcons = [];
    if (this.countdownText) this.countdownText.destroy();
    if (this.bonusIcon) this.bonusIcon.destroy();
    if (this.bonusText) this.bonusText.destroy();
    if (this.settingsGear) this.settingsGear.destroy();

    // Destroy bottom nav elements
    if (this.navBg) this.navBg.destroy();
    if (this.navBorder) this.navBorder.destroy();
    this.tabElements.forEach((elements) => {
      elements.forEach((el) => el.destroy());
    });
    this.tabElements.clear();

    // Clear timers
    if (this.countdownTimer) {
      this.countdownTimer.remove();
      this.countdownTimer = null;
    }

    // Remove economy listeners
    if (this.economy) {
      this.economy.off('lives-changed', this.onLivesChanged);
      this.economy.off('bonuses-changed', this.onBonusesChanged);
    }
  }

  private onShutdown = (): void => {
    // Remove resize listener
    this.scale.off('resize', this.handleResize);

    // Remove economy event listeners
    if (this.economy) {
      this.economy.off('lives-changed', this.onLivesChanged);
      this.economy.off('bonuses-changed', this.onBonusesChanged);
    }

    // Remove timer event
    if (this.countdownTimer) {
      this.countdownTimer.remove();
      this.countdownTimer = null;
    }
  };
}

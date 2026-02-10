/**
 * LevelSelect Scene - Mini road map with winding path and checkpoint buttons.
 * Player picks a level to play. Shows progress via stars and gold lock overlays.
 */

import Phaser from 'phaser';
import { ProgressManager } from '../game/ProgressManager';
import { EconomyManager } from '../game/EconomyManager';
import { SettingsManager } from '../game/SettingsManager';
import { GUI_TEXTURE_KEYS } from '../game/constants';

const KLO_YELLOW = 0xffb800;
const KLO_BLACK = 0x1a1a1a;
const KLO_WHITE = 0xf9f9f9;

const LEVEL_NAMES: Record<number, string> = {
  1: 'Перша заправка',
  2: 'Кава в дорогу',
  3: 'Перший лід',
  4: 'Льодяна кава',
  5: 'Перший бустер',
};

export class LevelSelect extends Phaser.Scene {
  private livesText: Phaser.GameObjects.Text;
  private bonusText: Phaser.GameObjects.Text;
  private countdownText: Phaser.GameObjects.Text;
  private timerEvent: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'LevelSelect' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const progress = this.registry.get('progress') as ProgressManager;
    const economy = this.registry.get('economy') as EconomyManager;

    // Fade in from black
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Background: Light warm gradient (same as Menu)
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xF9F9F9, 0xF9F9F9, 0xFFF5E0, 0xFFF5E0, 1);
    bg.fillRect(0, 0, width, height);

    // Title
    const title = this.add.text(width / 2, 60, 'Оберіть рівень', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '40px',
      color: '#1A1A1A',
      fontStyle: 'bold',
      shadow: { offsetX: 2, offsetY: 2, color: '#00000020', blur: 4, fill: true },
    });
    title.setOrigin(0.5);

    // Back button
    this.createBackButton();

    // Economy HUD (top-right area)
    this.createEconomyHUD(width, economy);

    // Settings gear icon
    this.createSettingsButton(width);

    // 5 checkpoint positions along a winding path
    const checkpoints = [
      { x: width * 0.2, y: height * 0.78 },
      { x: width * 0.5, y: height * 0.65 },
      { x: width * 0.3, y: height * 0.48 },
      { x: width * 0.6, y: height * 0.35 },
      { x: width * 0.5, y: height * 0.2 },
    ];

    // Draw the road path connecting checkpoints
    this.drawRoadPath(checkpoints);

    // Create level checkpoint buttons
    for (let i = 0; i < 5; i++) {
      const levelId = i + 1;
      this.createLevelCheckpoint(
        checkpoints[i].x,
        checkpoints[i].y,
        levelId,
        progress
      );
    }

    // Map pointer at current unlocked level
    const currentLevelId = this.getCurrentLevel(progress);
    if (currentLevelId > 0 && currentLevelId <= 5) {
      const pointerPos = checkpoints[currentLevelId - 1];
      this.createMapPointer(pointerPos.x, pointerPos.y - 60);
    }
  }

  private drawRoadPath(checkpoints: Array<{ x: number; y: number }>): void {
    const path = this.add.graphics();

    // Draw base path (light gray)
    path.lineStyle(10, 0xdddddd, 1);
    path.beginPath();
    path.moveTo(checkpoints[0].x, checkpoints[0].y);
    for (let i = 1; i < checkpoints.length; i++) {
      path.lineTo(checkpoints[i].x, checkpoints[i].y);
    }
    path.strokePath();

    // Draw colored progress line (partial)
    // For now, just draw the full path in a lighter color overlay
    path.lineStyle(6, 0xffb800, 0.4);
    path.beginPath();
    path.moveTo(checkpoints[0].x, checkpoints[0].y);
    for (let i = 1; i < checkpoints.length; i++) {
      path.lineTo(checkpoints[i].x, checkpoints[i].y);
    }
    path.strokePath();
  }

  private createEconomyHUD(width: number, economy: EconomyManager): void {
    const containerX = width - 100;
    const containerY = 60;

    // Heart icon + lives count
    const heartIcon = this.add.text(containerX - 70, containerY - 20, '❤', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
    });
    heartIcon.setOrigin(0.5);

    this.livesText = this.add.text(containerX - 40, containerY - 20, '5/5', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#1A1A1A',
      fontStyle: 'bold',
    });
    this.livesText.setOrigin(0, 0.5);

    // Countdown text (hidden when lives = 5)
    this.countdownText = this.add.text(containerX - 70, containerY + 10, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#666666',
    });
    this.countdownText.setOrigin(0, 0.5);

    // Bonus icon + count
    const bonusIcon = this.add.text(containerX - 70, containerY + 40, '💎', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
    });
    bonusIcon.setOrigin(0.5);

    this.bonusText = this.add.text(containerX - 40, containerY + 40, '500', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#FFB800',
      fontStyle: 'bold',
    });
    this.bonusText.setOrigin(0, 0.5);

    // Create 1-second timer for countdown updates
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: this.updateEconomyDisplay,
      callbackScope: this,
      loop: true,
    });

    // Initial update
    this.updateEconomyDisplay();

    // Cleanup on scene shutdown
    this.events.once('shutdown', () => {
      if (this.timerEvent) {
        this.timerEvent.remove();
        this.timerEvent = null!;
      }
    });
  }

  private updateEconomyDisplay(): void {
    const economy = this.registry.get('economy') as EconomyManager;
    if (!economy) return;

    // Update lives text
    const lives = economy.getLives();
    this.livesText.setText(`${lives}/5`);

    // Update countdown if lives < 5
    if (lives < 5) {
      const seconds = economy.getSecondsUntilNextLife();
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      this.countdownText.setText(`Далі: ${minutes}:${secs.toString().padStart(2, '0')}`);
    } else {
      this.countdownText.setText('');
    }

    // Update bonuses
    const bonuses = economy.getBonuses();
    this.bonusText.setText(`${bonuses}`);
  }

  private showNoLivesPrompt(economy: EconomyManager): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Store overlay elements for cleanup
    const overlayElements: Phaser.GameObjects.GameObject[] = [];

    // Dark backdrop
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.6);
    backdrop.fillRect(0, 0, width, height);
    overlayElements.push(backdrop);

    // White panel
    const panelW = 300;
    const panelH = 250;
    const panelX = (width - panelW) / 2;
    const panelY = (height - panelH) / 2;

    const panel = this.add.graphics();
    panel.fillStyle(KLO_WHITE, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 16);
    overlayElements.push(panel);

    // Title
    const title = this.add.text(width / 2, panelY + 50, 'Немає життів!', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '32px',
      color: '#1A1A1A',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    overlayElements.push(title);

    // Countdown
    const seconds = economy.getSecondsUntilNextLife();
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const countdownMsg = this.add.text(
      width / 2,
      panelY + 90,
      `Наступне через: ${minutes}:${secs.toString().padStart(2, '0')}`,
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        color: '#666666',
      }
    );
    countdownMsg.setOrigin(0.5);
    overlayElements.push(countdownMsg);

    const canRefill = economy.getBonuses() >= 15;

    // Refill button or message
    if (canRefill) {
      const refillBtn = this.createOverlayButton(
        width / 2,
        panelY + 140,
        'Поповнити (15 бонусів)',
        async () => {
          const success = await economy.spendBonusesForRefill();
          if (success) {
            // Clean up overlay
            overlayElements.forEach(el => el.destroy());
            // Update HUD
            this.updateEconomyDisplay();
          }
        }
      );
      overlayElements.push(refillBtn);
    } else {
      const noBonus = this.add.text(width / 2, panelY + 140, 'Недостатньо бонусів', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '18px',
        color: '#999999',
        fontStyle: 'bold',
      });
      noBonus.setOrigin(0.5);
      overlayElements.push(noBonus);
    }

    // Close button
    const closeBtn = this.createOverlayButton(
      width / 2,
      panelY + 190,
      'Закрити',
      () => {
        overlayElements.forEach(el => el.destroy());
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
    const buttonWidth = 200;
    const buttonHeight = 50;

    const bg = this.add.image(0, 0, secondary ? GUI_TEXTURE_KEYS.buttonYellow : GUI_TEXTURE_KEYS.buttonOrange);
    bg.setDisplaySize(buttonWidth, buttonHeight);

    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
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

    const buttonText = this.add.text(0, 0, '< Меню', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#1A1A1A',
    });
    buttonText.setOrigin(0.5);

    const container = this.add.container(70, 30, [buttonBg, buttonText]);
    container.setSize(buttonWidth, buttonHeight);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        scale: 1.05,
        duration: 100,
      });
    });

    container.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        scale: 1,
        duration: 100,
      });
    });

    container.on('pointerup', () => {
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

    const size = 70;

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
      fontSize: '32px',
      color: unlocked ? '#1A1A1A' : '#999999',
      fontStyle: 'bold',
    });
    numText.setOrigin(0.5);

    // Stars display below button
    const starString = this.getStarString(stars);
    const starText = this.add.text(0, size / 2 + 20, starString, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#FFB800',
    });
    starText.setOrigin(0.5);

    const children: Phaser.GameObjects.GameObject[] = [bg, numText, starText];

    // Crown decoration for 3-star levels
    if (stars === 3) {
      const crown = this.add.image(0, -size / 2 - 15, GUI_TEXTURE_KEYS.crown1);
      crown.setDisplaySize(28, 28);
      children.push(crown);
    }

    // Lock overlay for locked levels
    if (!unlocked) {
      const lockOverlay = this.add.graphics();
      lockOverlay.fillStyle(0x000000, 0.3);
      lockOverlay.fillCircle(0, 0, size / 2);

      const lockIcon = this.add.image(0, 0, GUI_TEXTURE_KEYS.goldLock);
      lockIcon.setDisplaySize(32, 32);

      children.unshift(lockOverlay); // Add behind lock icon
      children.push(lockIcon);
    }

    const container = this.add.container(x, y, children);
    container.setSize(size, size);

    if (unlocked) {
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => {
        this.tweens.add({
          targets: container,
          scale: 1.1,
          duration: 100,
        });
      });

      container.on('pointerout', () => {
        this.tweens.add({
          targets: container,
          scale: 1,
          duration: 100,
        });
      });

      container.on('pointerdown', () => {
        this.tweens.add({
          targets: container,
          scale: 0.95,
          duration: 50,
        });
      });

      container.on('pointerup', () => {
        const economy = this.registry.get('economy') as EconomyManager;
        if (!economy.canStartLevel()) {
          console.log('[LevelSelect] No lives, showing refill prompt');
          this.showNoLivesPrompt(economy);
          return;
        }
        console.log(`[LevelSelect] Starting level ${levelId}`);

        // Fade out to black before starting level
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('Game', { levelId });
        });
      });
    }
  }

  private createMapPointer(x: number, y: number): void {
    const pointer = this.add.image(x, y, GUI_TEXTURE_KEYS.mapPointer);
    pointer.setDisplaySize(40, 40);

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
    for (let i = 1; i <= 5; i++) {
      if (!progress.isLevelUnlocked(i)) {
        return i - 1; // Previous level is current
      }
    }
    return 5; // All unlocked
  }

  private getStarString(stars: number): string {
    let result = '';
    for (let i = 0; i < 3; i++) {
      result += i < stars ? '★' : '☆';
    }
    return result;
  }

  private createSettingsButton(width: number): void {
    // Position gear icon in top area, between back button and economy HUD
    const gearIcon = this.add.text(width - 200, 30, '⚙', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: '#1A1A1A',
    });
    gearIcon.setOrigin(0.5);
    gearIcon.setInteractive({ useHandCursor: true });

    // Hover effects
    gearIcon.on('pointerover', () => {
      this.tweens.add({
        targets: gearIcon,
        scale: 1.15,
        duration: 100,
      });
    });

    gearIcon.on('pointerout', () => {
      this.tweens.add({
        targets: gearIcon,
        scale: 1,
        duration: 100,
      });
    });

    gearIcon.on('pointerup', () => {
      this.showSettingsOverlay();
    });
  }

  private showSettingsOverlay(): void {
    const settings = this.registry.get('settings') as SettingsManager;
    if (!settings) {
      console.warn('[LevelSelect] SettingsManager not found in registry');
      return;
    }

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Store all overlay elements for cleanup
    const overlayElements: Phaser.GameObjects.GameObject[] = [];

    // Dark backdrop - blocks clicks to elements behind
    const backdrop = this.add.graphics();
    backdrop.fillStyle(0x000000, 0.7);
    backdrop.fillRect(0, 0, width, height);
    backdrop.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
    backdrop.on('pointerup', () => {
      // Click backdrop to close
      overlayElements.forEach(el => el.destroy());
    });
    overlayElements.push(backdrop);

    // White panel (340 x 380, centered)
    const panelW = 340;
    const panelH = 380;
    const panelX = (width - panelW) / 2;
    const panelY = (height - panelH) / 2;

    const panel = this.add.graphics();
    panel.fillStyle(0xF9F9F9, 1);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 16);
    panel.setInteractive(new Phaser.Geom.Rectangle(panelX, panelY, panelW, panelH), Phaser.Geom.Rectangle.Contains);
    overlayElements.push(panel);

    // Title
    const title = this.add.text(width / 2, panelY + 50, 'Налаштування', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: '#1A1A1A',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    overlayElements.push(title);

    // ---- SFX Toggle (y offset ~100 from panel top) ----
    const sfxRowY = panelY + 100;

    const sfxLabel = this.add.text(panelX + 30, sfxRowY, 'Звукові ефекти', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#1A1A1A',
    });
    sfxLabel.setOrigin(0, 0.5);
    overlayElements.push(sfxLabel);

    // Toggle switch: track state with mutable local variable
    let sfxEnabled = settings.get('sfxEnabled');

    const sfxToggleBg = this.add.graphics();
    const sfxToggleThumb = this.add.circle(0, 0, 12, 0xFFFFFF);
    const sfxToggleX = panelX + panelW - 80;

    const updateSfxToggle = () => {
      sfxToggleBg.clear();
      sfxToggleBg.fillStyle(sfxEnabled ? 0x4CAF50 : 0xCCCCCC, 1);
      sfxToggleBg.fillRoundedRect(sfxToggleX, sfxRowY - 15, 60, 30, 15);

      // Position thumb: left when off, right when on
      const thumbX = sfxEnabled ? sfxToggleX + 60 - 16 : sfxToggleX + 16;
      sfxToggleThumb.setPosition(thumbX, sfxRowY);
    };

    updateSfxToggle();
    overlayElements.push(sfxToggleBg, sfxToggleThumb);

    // Make toggle interactive
    const sfxToggleHitArea = this.add.rectangle(sfxToggleX + 30, sfxRowY, 60, 30);
    sfxToggleHitArea.setInteractive({ useHandCursor: true });
    sfxToggleHitArea.setAlpha(0.001);
    overlayElements.push(sfxToggleHitArea);

    sfxToggleHitArea.on('pointerup', () => {
      sfxEnabled = !sfxEnabled;
      settings.set('sfxEnabled', sfxEnabled);

      // Animate thumb position
      const thumbX = sfxEnabled ? sfxToggleX + 60 - 16 : sfxToggleX + 16;
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
    const volumeRowY = panelY + 170;

    const volumeLabel = this.add.text(panelX + 30, volumeRowY, 'Гучність', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#1A1A1A',
    });
    volumeLabel.setOrigin(0, 0.5);
    overlayElements.push(volumeLabel);

    const sliderTrackX = panelX + panelW - 160;
    const sliderTrackW = 140;

    // Track background
    const sliderTrack = this.add.rectangle(sliderTrackX, volumeRowY, sliderTrackW, 6, 0xDDDDDD);
    sliderTrack.setOrigin(0, 0.5);
    overlayElements.push(sliderTrack);

    // Fill (shows current volume)
    const sliderFill = this.add.rectangle(sliderTrackX, volumeRowY, 0, 6, 0xFFB800);
    sliderFill.setOrigin(0, 0.5);
    overlayElements.push(sliderFill);

    // Thumb
    const volume = settings.get('sfxVolume');
    const thumbX = sliderTrackX + volume * sliderTrackW;
    const sliderThumb = this.add.circle(thumbX, volumeRowY, 10, 0xFFFFFF);
    sliderThumb.setStrokeStyle(2, 0xFFB800);
    overlayElements.push(sliderThumb);

    // Initial fill width
    sliderFill.setDisplaySize(volume * sliderTrackW, 6);

    // Make thumb draggable
    sliderThumb.setInteractive({ useHandCursor: true, draggable: true });
    this.input.setDraggable(sliderThumb);

    sliderThumb.on('drag', (pointer: Phaser.Input.Pointer) => {
      // Clamp thumb position to track bounds
      const clampedX = Phaser.Math.Clamp(pointer.x, sliderTrackX, sliderTrackX + sliderTrackW);
      sliderThumb.setX(clampedX);

      // Update fill width
      const fillWidth = clampedX - sliderTrackX;
      sliderFill.setDisplaySize(fillWidth, 6);

      // Calculate and set volume value
      const volumeValue = (clampedX - sliderTrackX) / sliderTrackW;
      settings.set('sfxVolume', volumeValue);
    });

    // ---- Animation Toggle (y offset ~240 from panel top) ----
    const animRowY = panelY + 240;

    const animLabel = this.add.text(panelX + 30, animRowY, 'Анімації бустерів', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#1A1A1A',
    });
    animLabel.setOrigin(0, 0.5);
    overlayElements.push(animLabel);

    // Toggle switch: track state with mutable local variable
    let animEnabled = settings.get('animationsEnabled');

    const animToggleBg = this.add.graphics();
    const animToggleThumb = this.add.circle(0, 0, 12, 0xFFFFFF);
    const animToggleX = panelX + panelW - 80;

    const updateAnimToggle = () => {
      animToggleBg.clear();
      animToggleBg.fillStyle(animEnabled ? 0x4CAF50 : 0xCCCCCC, 1);
      animToggleBg.fillRoundedRect(animToggleX, animRowY - 15, 60, 30, 15);

      // Position thumb: left when off, right when on
      const thumbX = animEnabled ? animToggleX + 60 - 16 : animToggleX + 16;
      animToggleThumb.setPosition(thumbX, animRowY);
    };

    updateAnimToggle();
    overlayElements.push(animToggleBg, animToggleThumb);

    // Make toggle interactive
    const animToggleHitArea = this.add.rectangle(animToggleX + 30, animRowY, 60, 30);
    animToggleHitArea.setInteractive({ useHandCursor: true });
    animToggleHitArea.setAlpha(0.001);
    overlayElements.push(animToggleHitArea);

    animToggleHitArea.on('pointerup', () => {
      animEnabled = !animEnabled;
      settings.set('animationsEnabled', animEnabled);

      // Animate thumb position
      const thumbX = animEnabled ? animToggleX + 60 - 16 : animToggleX + 16;
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
      panelY + 320,
      'Закрити',
      () => {
        overlayElements.forEach(el => el.destroy());
      },
      true
    );
    overlayElements.push(closeBtn);
  }
}

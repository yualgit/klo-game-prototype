/**
 * LevelSelect Scene - Mini road map with winding path and checkpoint buttons.
 * Player picks a level to play. Shows progress via stars and gold lock overlays.
 */

import Phaser from 'phaser';
import { ProgressManager } from '../game/ProgressManager';
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
  constructor() {
    super({ key: 'LevelSelect' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const progress = this.registry.get('progress') as ProgressManager;

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
}

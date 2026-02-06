/**
 * LevelSelect Scene - Grid of level buttons with stars and lock states.
 * Player picks a level to play. Shows progress via stars.
 */

import Phaser from 'phaser';
import { ProgressManager } from '../game/ProgressManager';

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

    // Title
    const title = this.add.text(width / 2, 60, 'Оберіть рівень', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '40px',
      color: '#1A1A1A',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);

    // Back button
    this.createBackButton();

    // Level buttons - 5 in a row, centered
    const buttonSize = 120;
    const gap = 20;
    const totalWidth = 5 * buttonSize + 4 * gap;
    const startX = (width - totalWidth) / 2 + buttonSize / 2;
    const centerY = height / 2;

    for (let i = 1; i <= 5; i++) {
      const x = startX + (i - 1) * (buttonSize + gap);
      this.createLevelButton(x, centerY, i, buttonSize, progress);
    }
  }

  private createBackButton(): void {
    const buttonWidth = 100;
    const buttonHeight = 40;

    const buttonBg = this.add.graphics();
    buttonBg.fillStyle(KLO_WHITE, 1);
    buttonBg.lineStyle(2, KLO_BLACK, 1);
    buttonBg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
    buttonBg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);

    const buttonText = this.add.text(0, 0, '< Меню', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#1A1A1A',
    });
    buttonText.setOrigin(0.5);

    const container = this.add.container(70, 30, [buttonBg, buttonText]);
    container.setSize(buttonWidth, buttonHeight);
    container.setInteractive({ useHandCursor: true });

    container.on('pointerover', () => container.setScale(1.05));
    container.on('pointerout', () => container.setScale(1));
    container.on('pointerup', () => this.scene.start('Menu'));
  }

  private createLevelButton(
    x: number,
    y: number,
    levelId: number,
    size: number,
    progress: ProgressManager
  ): void {
    const unlocked = progress.isLevelUnlocked(levelId);
    const stars = progress.getStars(levelId);
    const name = LEVEL_NAMES[levelId] || `Рівень ${levelId}`;

    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(unlocked ? KLO_YELLOW : 0xcccccc, 1);
    bg.fillRoundedRect(-size / 2, -size / 2, size, size, 12);

    // Level number
    const numText = this.add.text(0, -20, String(levelId), {
      fontFamily: 'Arial, sans-serif',
      fontSize: '36px',
      color: unlocked ? '#1A1A1A' : '#999999',
      fontStyle: 'bold',
    });
    numText.setOrigin(0.5);

    // Level name
    const nameText = this.add.text(0, 12, name, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: unlocked ? '#1A1A1A' : '#999999',
      wordWrap: { width: size - 16 },
      align: 'center',
    });
    nameText.setOrigin(0.5);

    // Stars display below button
    const starString = this.getStarString(stars);
    const starText = this.add.text(0, size / 2 + 16, starString, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '20px',
      color: '#FFB800',
    });
    starText.setOrigin(0.5);

    const children: Phaser.GameObjects.GameObject[] = [bg, numText, nameText, starText];

    // Lock overlay for locked levels
    if (!unlocked) {
      const lockOverlay = this.add.graphics();
      lockOverlay.fillStyle(0x000000, 0.3);
      lockOverlay.fillRoundedRect(-size / 2, -size / 2, size, size, 12);

      const lockIcon = this.add.text(0, -20, '🔒', {
        fontSize: '32px',
      });
      lockIcon.setOrigin(0.5);

      children.push(lockOverlay, lockIcon);
    }

    const container = this.add.container(x, y, children);
    container.setSize(size, size);

    if (unlocked) {
      container.setInteractive({ useHandCursor: true });

      container.on('pointerover', () => {
        container.setScale(1.05);
      });

      container.on('pointerout', () => {
        container.setScale(1);
      });

      container.on('pointerdown', () => {
        container.setScale(0.95);
      });

      container.on('pointerup', () => {
        console.log(`[LevelSelect] Starting level ${levelId}`);
        this.scene.start('Game', { levelId });
      });
    }
  }

  private getStarString(stars: number): string {
    let result = '';
    for (let i = 0; i < 3; i++) {
      result += i < stars ? '★' : '☆';
    }
    return result;
  }
}

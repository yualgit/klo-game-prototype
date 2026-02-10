/**
 * Collections Scene - Full collection viewing UI with scrollable card grids.
 * Displays 3 collections (Coffee/Food/Cars) with 6-card grids showing owned/locked states.
 */

import Phaser from 'phaser';
import { CollectionsManager } from '../game/CollectionsManager';
import { cssToGame } from '../utils/responsive';
import eventsCenter from '../utils/EventsCenter';
import {
  getCollectionIds,
  getCollectionMeta,
  getCardsForCollection,
  CardDefinition,
  CardRarity,
} from '../game/collectionConfig';

const RARITY_COLORS: Record<CardRarity, number> = {
  common: 0x888888,
  rare: 0x4488ff,
  epic: 0xaa44ff,
  legendary: 0xffb800,
};

export class Collections extends Phaser.Scene {
  private isDragging: boolean = false;
  private dragStartY: number = 0;
  private allElements: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'Collections' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Fade in from black
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Build the UI
    this.buildCollectionsUI();

    // Setup drag scrolling
    this.setupDragScrolling();

    // Launch UIScene with collections tab active
    this.scene.launch('UIScene', {
      currentTab: 'collections',
      showBottomNav: true,
      showHeader: true,
    });
    this.scene.bringToTop('UIScene');

    // Listen for navigation
    eventsCenter.on('navigate-to', this.handleNavigation, this);
    eventsCenter.on('open-settings', this.showSettings, this);

    // Register resize handler
    this.scale.on('resize', this.handleResize, this);

    // Register shutdown cleanup
    this.events.once('shutdown', () => {
      eventsCenter.off('navigate-to', this.handleNavigation, this);
      eventsCenter.off('open-settings', this.showSettings, this);
      this.scale.off('resize', this.handleResize, this);
      this.scene.stop('UIScene');
    });
  }

  private buildCollectionsUI(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const collectionsManager = this.registry.get('collections') as CollectionsManager;

    // Clear previous elements if any
    this.allElements.forEach((el) => el.destroy());
    this.allElements = [];

    // Layout constants
    const headerOffset = cssToGame(60); // UIScene header height
    const bottomNavSafeArea = cssToGame(70); // UIScene bottom nav
    const cardWidth = cssToGame(80);
    const cardAspect = 1158 / 696; // card images are 696x1158 (portrait)
    const cardHeight = cardWidth * cardAspect;
    const cardGap = cssToGame(12);

    // Each collection block: title(30) + description(30) + 2 rows of cards + gap + progress(50) + spacing(50)
    const collectionBlockHeight = cssToGame(30) + cssToGame(30) + 2 * cardHeight + cardGap + cssToGame(20) + cssToGame(50) + cssToGame(50);
    // Calculate world height: header + 3 collections + bottom nav + viewport padding
    const worldHeight = headerOffset + cssToGame(20) + 3 * collectionBlockHeight + bottomNavSafeArea + height;
    this.cameras.main.setBounds(0, 0, width, worldHeight);

    // Background - covers full world height
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xf9f9f9, 0xf9f9f9, 0xfff5e0, 0xfff5e0, 1);
    bg.fillRect(0, 0, width, worldHeight);
    this.allElements.push(bg);

    // Render each collection
    const collectionIds = getCollectionIds();
    let currentY = headerOffset + cssToGame(20); // Start below header with padding

    for (const collectionId of collectionIds) {
      const meta = getCollectionMeta(collectionId);
      const cards = getCardsForCollection(collectionId);
      const progress = collectionsManager.getProgress(collectionId);

      // Collection name
      const nameText = this.add.text(width / 2, currentY, meta.nameUk, {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${cssToGame(22)}px`,
        color: '#1A1A1A',
        fontStyle: 'bold',
      });
      nameText.setOrigin(0.5, 0);
      this.allElements.push(nameText);

      currentY += cssToGame(30);

      // Reward description
      const rewardText = this.add.text(width / 2, currentY, meta.rewardDescription, {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${cssToGame(14)}px`,
        color: '#888888',
      });
      rewardText.setOrigin(0.5, 0);
      this.allElements.push(rewardText);

      currentY += cssToGame(30);

      // Card grid (2 rows x 3 columns)
      const gridWidth = 3 * cardWidth + 2 * cardGap;
      const gridStartX = (width - gridWidth) / 2;

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        const col = i % 3;
        const row = Math.floor(i / 3);
        const cardX = gridStartX + col * (cardWidth + cardGap) + cardWidth / 2;
        const cardY = currentY + row * (cardHeight + cardGap) + cardHeight / 2;

        const isOwned = collectionsManager.isCardOwned(collectionId, card.id);

        if (isOwned) {
          // Owned card: full color, preserve aspect ratio
          const cardImage = this.add.image(cardX, cardY, card.textureKey);
          cardImage.setDisplaySize(cardWidth, cardHeight);
          this.allElements.push(cardImage);

          // Rarity badge (small colored dot at bottom-right)
          const badgeRadius = cssToGame(4);
          const badgeX = cardX + cardWidth / 2 - badgeRadius * 2;
          const badgeY = cardY + cardHeight / 2 - badgeRadius * 2;
          const badge = this.add.graphics();
          badge.fillStyle(RARITY_COLORS[card.rarity], 1);
          badge.fillCircle(badgeX, badgeY, badgeRadius);
          this.allElements.push(badge);
        } else {
          // Unowned card: grayscale with "?" overlay, preserve aspect ratio
          const cardImage = this.add.image(cardX, cardY, card.textureKey);
          cardImage.setDisplaySize(cardWidth, cardHeight);
          cardImage.setTint(0x808080);
          cardImage.setAlpha(0.4);
          this.allElements.push(cardImage);

          // "?" overlay
          const questionMark = this.add.text(cardX, cardY, '?', {
            fontFamily: 'Arial, sans-serif',
            fontSize: `${cssToGame(28)}px`,
            color: '#FFFFFF',
            fontStyle: 'bold',
          });
          questionMark.setOrigin(0.5);
          this.allElements.push(questionMark);
        }
      }

      currentY += 2 * (cardHeight + cardGap) + cssToGame(20);

      // Progress text
      const progressText = this.add.text(
        width / 2,
        currentY,
        `${progress.owned}/${progress.total}`,
        {
          fontFamily: 'Arial, sans-serif',
          fontSize: `${cssToGame(16)}px`,
          color: '#666666',
        }
      );
      progressText.setOrigin(0.5, 0);
      this.allElements.push(progressText);

      currentY += cssToGame(50); // Spacing before next collection
    }
  }

  private setupDragScrolling(): void {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = false;
      this.dragStartY = pointer.y;
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) {
        const deltaY = pointer.y - pointer.prevPosition.y;

        // Check if drag threshold exceeded
        if (Math.abs(pointer.y - this.dragStartY) > 10) {
          this.isDragging = true;
        }

        // Scroll camera if dragging
        if (this.isDragging) {
          this.cameras.main.scrollY -= deltaY;
        }
      }
    });

    this.input.on('pointerup', () => {
      this.isDragging = false;
    });
  }

  private handleNavigation = (target: string): void => {
    this.scene.stop('UIScene');

    switch (target) {
      case 'levels':
        this.scene.start('LevelSelect');
        break;
      case 'collections':
        // Already on collections, no-op
        break;
      case 'shop':
        this.scene.start('Shop');
        break;
    }
  };

  private showSettings = (): void => {
    // For now, just log. Full settings overlay can be added later.
    console.log('[Collections] Settings requested');
  };

  private handleResize = (gameSize: Phaser.Structs.Size): void => {
    const { width, height } = gameSize;

    // Update camera viewport (CRITICAL for input)
    this.cameras.main.setViewport(0, 0, width, height);

    // Rebuild UI with new dimensions
    this.buildCollectionsUI();
  };
}

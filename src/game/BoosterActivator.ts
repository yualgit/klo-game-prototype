import { Match3Engine } from './Match3Engine';
import { TileData } from './types';

/**
 * BoosterActivator - Handles booster activation and combo logic
 *
 * Provides methods for activating individual boosters and
 * executing booster-booster combo effects.
 */
export class BoosterActivator {
  constructor(private engine: Match3Engine) {}

  /**
   * Activate a single booster and return tiles to remove
   */
  activateBooster(booster: TileData): TileData[] {
    switch (booster.booster) {
      case 'linear_horizontal':
        return this.engine.getTilesInRow(booster.row);
      case 'linear_vertical':
        return this.engine.getTilesInColumn(booster.col);
      case 'bomb':
        return this.engine.getTilesInRadius(booster.row, booster.col, 1);
      case 'klo_sphere':
        return this.engine.getTilesByType(booster.type);
      default:
        return [];
    }
  }
}

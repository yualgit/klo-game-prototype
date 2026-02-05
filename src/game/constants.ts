/**
 * Game constants for tile types, colors, and dimensions.
 * Used by TileSprite and Match3Engine.
 */

// Tile types for match-3 game (KLO fuel stations)
export const TILE_TYPES = ['fuel', 'coffee', 'snack', 'road'] as const;
export type TileType = typeof TILE_TYPES[number];

// Tile colors mapped to KLO brand and thematic colors
export const TILE_COLORS: Record<TileType, number> = {
  fuel: 0xffb800,    // KLO yellow - fuel pumps
  coffee: 0x8b4513,  // Brown - coffee
  snack: 0x3498db,   // Blue - snacks
  road: 0x27ae60,    // Green - road/travel
};

// Tile dimensions (import from utils/constants for consistency)
export { TILE_SIZE } from '../utils/constants';

// Gap between tiles in grid
export const TILE_GAP = 4;

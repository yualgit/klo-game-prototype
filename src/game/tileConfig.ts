/**
 * Single source of truth for tile type configuration
 * All tile types, colors, texture keys, and asset paths are defined here
 */

export interface TileConfigEntry {
  color: number;
  textureKey: string;
  assetPath: string;
}

export const TILE_CONFIG = {
  burger:   { color: 0xFFB800, textureKey: 'tile_burger',   assetPath: 'assets/tiles/burger.png' },
  coffee:   { color: 0x6F4E37, textureKey: 'tile_coffee',   assetPath: 'assets/tiles/coffee.png' },
  fuel_can: { color: 0x2ECC71, textureKey: 'tile_fuel_can', assetPath: 'assets/tiles/fuel_can.png' },
  hotdog:   { color: 0xFF6B35, textureKey: 'tile_hotdog',   assetPath: 'assets/tiles/hotdog.png' },
  oil:      { color: 0x1A1A1A, textureKey: 'tile_oil',      assetPath: 'assets/tiles/oil.png' },
  snack:    { color: 0xF39C12, textureKey: 'tile_snack',    assetPath: 'assets/tiles/snack.png' },
  soda:     { color: 0xE74C3C, textureKey: 'tile_soda',     assetPath: 'assets/tiles/soda.png' },
  water:    { color: 0x4A90E2, textureKey: 'tile_water',    assetPath: 'assets/tiles/water.png' },
  wheel:    { color: 0x95A5A6, textureKey: 'tile_wheel',    assetPath: 'assets/tiles/wheel.png' },
} as const satisfies Record<string, TileConfigEntry>;

export type TileTypeId = keyof typeof TILE_CONFIG;
export const TILE_TYPE_IDS = Object.keys(TILE_CONFIG) as TileTypeId[];

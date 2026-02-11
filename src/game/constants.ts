/**
 * Game constants for tile types, colors, and dimensions.
 * Used by TileSprite and Match3Engine.
 */

import { TILE_CONFIG, TileTypeId, TILE_TYPE_IDS } from './tileConfig';

// Tile types for match-3 game (KLO fuel stations)
export const TILE_TYPES = TILE_TYPE_IDS;
export type { TileType } from './types';

// Tile colors mapped to KLO brand and thematic colors
export const TILE_COLORS: Record<TileTypeId, number> = Object.fromEntries(
  Object.entries(TILE_CONFIG).map(([key, val]) => [key, val.color])
) as Record<TileTypeId, number>;

// Tile dimensions (import from utils/constants for consistency)
export { TILE_SIZE } from '../utils/constants';

// Gap between tiles in grid
export const TILE_GAP = 4;

// Tile texture keys (mapping game types to asset filenames)
export const TEXTURE_KEYS: Record<TileTypeId, string> = Object.fromEntries(
  Object.entries(TILE_CONFIG).map(([key, val]) => [key, val.textureKey])
) as Record<TileTypeId, string>;

// Booster texture keys
export const BOOSTER_TEXTURE_KEYS: Record<string, string> = {
  bomb: 'booster_bomb',
  linear_horizontal: 'booster_klo_horizontal',
  linear_vertical: 'booster_klo_vertical',
  klo_sphere: 'booster_klo_sphere',
};

// Block texture key
export const BLOCK_TEXTURE_KEY = 'block_texture';

// Obstacle texture keys
// Per user decision: bubble.png = 1-hit blocker. The game's 'crate' type IS the 1-hit blocker.
// So bubble.png maps to crate type.
export const OBSTACLE_TEXTURE_KEYS = {
  crate: 'obstacle_bubble',   // bubble.png = 1-hit blocker (per CONTEXT.md)
  ice: ['obstacle_ice01', 'obstacle_ice02', 'obstacle_ice03'],
  grass: ['obstacle_grss01', 'obstacle_grss02', 'obstacle_grss03'],
} as const;

// GUI texture keys (use orange/yellow buttons per KLO branding)
export const GUI_TEXTURE_KEYS = {
  buttonOrange: 'gui_button_orange',
  buttonYellow: 'gui_button_yellow',
  buttonRed: 'gui_button_red',
  buttonGreen: 'gui_button_green',
  smallSquareButtonBlue: 'gui_small_square_button_blue',
  close: 'gui_close',
  crown1: 'gui_crown1',
  crown2: 'gui_crown2',
  heart: 'gui_heart',
  heartDark: 'gui_heart_dark',
  goldLock: 'gui_gold_lock',
  goal: 'gui_goal',
  mapPointer: 'gui_map_pointer',
  touch: 'gui_touch',
  progressBarOrange: 'gui_progress_bar_orange',
  progressBarYellow: 'gui_progress_bar_yellow',
  sliderBg: 'gui_slider_bg',
  fillOrange: 'gui_fill_orange',
  fillYellow: 'gui_fill_yellow',
} as const;

// Sound effect keys
export const SOUND_KEYS = {
  match: 'sfx_match',
  bomb: 'sfx_bomb',
  sphere: 'sfx_sphere',
  horizontal: 'sfx_horizontal',
  levelWin: 'sfx_level_win',
  levelLose: 'sfx_level_loose',
} as const;

// Map configuration for scrollable Kyiv level select
export const MAP_CONFIG = {
  MAP_WIDTH: 512,
  MAP_HEIGHT: 2200,       // Tall enough for 10 nodes with generous spacing
  DRAG_THRESHOLD: 10,
  PARALLAX_SKY: 0,
  PARALLAX_FAR: 0.25,
  PARALLAX_MID: 0.6,
  // Level node positions along winding Kyiv journey path (world coordinates)
  LEVEL_NODES: [
    { x: 200, y: 2050, label: 'Оболонь' },
    { x: 480, y: 1850, label: 'Поштова площа' },
    { x: 200, y: 1650, label: 'Контрактова' },
    { x: 480, y: 1450, label: 'Андріївський' },
    { x: 200, y: 1250, label: 'Золоті ворота' },
    { x: 480, y: 1050, label: 'Хрещатик' },
    { x: 200, y: 860, label: 'Майдан' },
    { x: 480, y: 660, label: 'Бессарабка' },
    { x: 200, y: 460, label: 'Палац спорту' },
    { x: 480, y: 250, label: 'Печерська Лавра' },
  ],
} as const;

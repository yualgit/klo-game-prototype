/**
 * Game constants for tile types, colors, and dimensions.
 * Used by TileSprite and Match3Engine.
 */

// Tile types for match-3 game (KLO fuel stations)
export const TILE_TYPES = ['burger', 'hotdog', 'oil', 'water', 'snack', 'soda'] as const;
export type TileType = typeof TILE_TYPES[number];

// Tile colors mapped to KLO brand and thematic colors
export const TILE_COLORS: Record<TileType, number> = {
  burger: 0xFFB800,   // KLO yellow
  hotdog: 0xFF6B35,   // Orange
  oil: 0x1A1A1A,      // Dark/black
  water: 0x4A90E2,    // Blue
  snack: 0xF39C12,    // Golden
  soda: 0xE74C3C,     // Red
};

// Tile dimensions (import from utils/constants for consistency)
export { TILE_SIZE } from '../utils/constants';

// Gap between tiles in grid
export const TILE_GAP = 4;

// Tile texture keys (mapping game types to asset filenames)
export const TEXTURE_KEYS: Record<TileType, string> = {
  burger: 'tile_burger',
  hotdog: 'tile_hotdog',
  oil: 'tile_oil',
  water: 'tile_water',
  snack: 'tile_snack',
  soda: 'tile_soda',
};

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
  MAP_WIDTH: 1024,        // Same as game width
  DRAG_THRESHOLD: 10,     // Pixels of movement before drag mode activates (vs tap)
  PARALLAX_SKY: 0,        // Sky layer scroll factor (static)
  PARALLAX_FAR: 0.25,     // Far landmarks scroll factor
  PARALLAX_MID: 0.6,      // Mid-ground scroll factor
  // Level node positions along winding Kyiv journey path (x only - y calculated dynamically)
  // Path winds left-right as it goes from bottom (node 1) to top (node 10)
  // Loosely themed: starting from Obolon (bottom) through city center to Pechersk (top)
  LEVEL_NODES: [
    { x: 260, label: 'Оболонь' },        // L1 - Starting point
    { x: 560, label: 'Поштова площа' },   // L2
    { x: 310, label: 'Контрактова' },     // L3
    { x: 620, label: 'Андріївський' },    // L4
    { x: 350, label: 'Золоті ворота' },   // L5
    { x: 650, label: 'Хрещатик' },        // L6
    { x: 300, label: 'Майдан' },          // L7
    { x: 580, label: 'Бессарабка' },      // L8
    { x: 370, label: 'Палац спорту' },    // L9
    { x: 512, label: 'Печерська Лавра' }, // L10 - Final destination
  ],
} as const;

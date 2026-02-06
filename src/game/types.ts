/**
 * Core Match-3 game type definitions
 */

export type TileType = 'fuel' | 'coffee' | 'snack' | 'road' | 'empty';

export type BoosterType = 'linear_horizontal' | 'linear_vertical' | 'bomb' | 'klo_sphere';

export type ObstacleType = 'ice' | 'dirt' | 'crate' | 'blocked';

export interface ObstacleData {
  type: ObstacleType;
  layers: number;
}

export interface TileData {
  row: number;
  col: number;
  type: TileType;
  isEmpty: boolean;
  id: string; // Unique identifier for tracking
  booster?: BoosterType;
  obstacle?: ObstacleData;
}

export interface Movement {
  tileId: string;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
}

export interface Match {
  tiles: TileData[];
  type: TileType;
  direction: 'horizontal' | 'vertical';
}

export interface SpawnData {
  row: number;
  col: number;
  type: TileType;
  tileId: string;
}

export interface BoosterSpawn {
  row: number;
  col: number;
  boosterType: BoosterType;
  baseType: TileType;
}

export interface MatchResult {
  tilesToRemove: TileData[];
  boostersToSpawn: BoosterSpawn[];
}

export interface SpawnRules {
  fuel: number;
  coffee: number;
  snack: number;
  road: number;
}

export interface LevelGoal {
  type: 'collect' | 'destroy_obstacle' | 'create_booster';
  item?: TileType;
  obstacleType?: ObstacleType;
  boosterType?: BoosterType;
  count: number;
  current: number;
  description: string;
}

export type LevelEvent =
  | { type: 'moves_changed'; movesRemaining: number }
  | { type: 'goals_updated'; goals: LevelGoal[] }
  | { type: 'level_won' }
  | { type: 'level_lost' };

export interface LevelData {
  level_id: number;
  name: string;
  moves: number;
  grid: {
    width: number;
    height: number;
    blocked_cells: [number, number][];
  };
  goals: LevelGoal[];
  spawn_rules: SpawnRules;
  obstacles: {
    type: ObstacleType;
    layers: number;
    positions: [number, number][];
    description: string;
  }[];
}

export interface CascadeResult {
  matches: Match[];
  movements: Movement[];
  spawns: SpawnData[];
  depth: number;
}

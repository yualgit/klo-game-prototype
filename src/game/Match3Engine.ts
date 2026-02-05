import {
  TileData,
  Movement,
  Match,
  SpawnData,
  SpawnRules,
  CascadeResult,
  TileType,
} from './types';

/**
 * Match3Engine - Pure game logic for match-3 mechanics
 *
 * This class handles all core game algorithms as pure data operations,
 * enabling unit testing and separation from rendering.
 */
export class Match3Engine {
  private grid: TileData[][] = [];
  private rows: number;
  private cols: number;
  private tileIdCounter = 0;
  private readonly MAX_CASCADE_DEPTH = 20;

  constructor(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;
  }

  /**
   * Generate a new grid without any initial matches
   */
  generateGrid(spawnRules: SpawnRules): void {
    this.grid = [];

    for (let row = 0; row < this.rows; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.cols; col++) {
        let type: TileType;
        let attempts = 0;
        const maxAttempts = 100;

        // Keep trying random types until we find one that doesn't create a match
        do {
          type = this.getRandomTileType(spawnRules);
          attempts++;
        } while (
          this.wouldCreateMatch(this.grid, row, col, type) &&
          attempts < maxAttempts
        );

        // If we can't find a non-matching type, use the last random one
        // This is rare but prevents infinite loops
        this.grid[row][col] = {
          row,
          col,
          type,
          isEmpty: false,
          id: this.generateTileId(),
        };
      }
    }
  }

  /**
   * Check if placing a tile type at a position would create a match
   */
  private wouldCreateMatch(
    grid: TileData[][],
    row: number,
    col: number,
    type: TileType
  ): boolean {
    // Check horizontal (left and right)
    let horizontalCount = 1;

    // Count to the left
    let c = col - 1;
    while (c >= 0 && grid[row][c] && grid[row][c].type === type) {
      horizontalCount++;
      c--;
    }

    // Count to the right
    c = col + 1;
    while (c < this.cols && grid[row][c] && grid[row][c].type === type) {
      horizontalCount++;
      c++;
    }

    if (horizontalCount >= 3) return true;

    // Check vertical (up and down)
    let verticalCount = 1;

    // Count upward
    let r = row - 1;
    while (r >= 0 && grid[r][col] && grid[r][col].type === type) {
      verticalCount++;
      r--;
    }

    // Count downward
    r = row + 1;
    while (r < this.rows && grid[r] && grid[r][col] && grid[r][col].type === type) {
      verticalCount++;
      r++;
    }

    if (verticalCount >= 3) return true;

    return false;
  }

  /**
   * Get a random tile type based on spawn rules
   */
  private getRandomTileType(spawnRules: SpawnRules): TileType {
    const totalWeight =
      spawnRules.fuel +
      spawnRules.coffee +
      spawnRules.snack +
      spawnRules.road;
    const random = Math.random() * totalWeight;

    let cumulative = 0;
    cumulative += spawnRules.fuel;
    if (random < cumulative) return 'fuel';

    cumulative += spawnRules.coffee;
    if (random < cumulative) return 'coffee';

    cumulative += spawnRules.snack;
    if (random < cumulative) return 'snack';

    return 'road';
  }

  /**
   * Generate a unique tile ID
   */
  private generateTileId(): string {
    return `tile_${this.tileIdCounter++}`;
  }

  /**
   * Get the current grid state
   */
  getGrid(): TileData[][] {
    return this.grid;
  }

  /**
   * Swap two tiles and return movement data
   * Grid is updated BEFORE returning movements
   */
  swapTiles(r1: number, c1: number, r2: number, c2: number): Movement[] {
    const tile1 = this.grid[r1][c1];
    const tile2 = this.grid[r2][c2];

    // Swap in grid
    this.grid[r1][c1] = { ...tile2, row: r1, col: c1 };
    this.grid[r2][c2] = { ...tile1, row: r2, col: c2 };

    // Return movement data for animation
    return [
      {
        tileId: tile1.id,
        fromRow: r1,
        fromCol: c1,
        toRow: r2,
        toCol: c2,
      },
      {
        tileId: tile2.id,
        fromRow: r2,
        fromCol: c2,
        toRow: r1,
        toCol: c1,
      },
    ];
  }

  /**
   * Find all matches (3+ consecutive same-type tiles)
   * Streaming approach: track start position, check continuity
   */
  findMatches(): Match[] {
    const matches: Match[] = [];

    // Check horizontal matches
    for (let row = 0; row < this.rows; row++) {
      let startCol = 0;
      let currentType = this.grid[row][0].type;
      let matchLength = 1;

      for (let col = 1; col <= this.cols; col++) {
        const tile = col < this.cols ? this.grid[row][col] : null;

        if (
          tile &&
          !tile.isEmpty &&
          tile.type === currentType &&
          currentType !== 'empty'
        ) {
          matchLength++;
        } else {
          // Sequence ended
          if (matchLength >= 3 && currentType !== 'empty') {
            const tiles: TileData[] = [];
            for (let c = startCol; c < col; c++) {
              tiles.push(this.grid[row][c]);
            }
            matches.push({
              tiles,
              type: currentType,
              direction: 'horizontal',
            });
          }

          // Start new sequence
          if (tile) {
            currentType = tile.type;
            startCol = col;
            matchLength = 1;
          }
        }
      }
    }

    // Check vertical matches
    for (let col = 0; col < this.cols; col++) {
      let startRow = 0;
      let currentType = this.grid[0][col].type;
      let matchLength = 1;

      for (let row = 1; row <= this.rows; row++) {
        const tile = row < this.rows ? this.grid[row][col] : null;

        if (
          tile &&
          !tile.isEmpty &&
          tile.type === currentType &&
          currentType !== 'empty'
        ) {
          matchLength++;
        } else {
          // Sequence ended
          if (matchLength >= 3 && currentType !== 'empty') {
            const tiles: TileData[] = [];
            for (let r = startRow; r < row; r++) {
              tiles.push(this.grid[r][col]);
            }
            matches.push({
              tiles,
              type: currentType,
              direction: 'vertical',
            });
          }

          // Start new sequence
          if (tile) {
            currentType = tile.type;
            startRow = row;
            matchLength = 1;
          }
        }
      }
    }

    return matches;
  }

  /**
   * Remove matched tiles by marking them as empty
   */
  removeMatches(matches: Match[]): void {
    matches.forEach((match) => {
      match.tiles.forEach((tile) => {
        this.grid[tile.row][tile.col].isEmpty = true;
        this.grid[tile.row][tile.col].type = 'empty';
      });
    });
  }

  /**
   * Apply gravity: tiles fall down to fill empty spaces
   * Returns movement data for animation
   * Processes columns independently (bottom-to-top)
   */
  applyGravity(): Movement[] {
    const movements: Movement[] = [];

    for (let col = 0; col < this.cols; col++) {
      // Process column from bottom to top
      let writeRow = this.rows - 1;

      for (let readRow = this.rows - 1; readRow >= 0; readRow--) {
        const tile = this.grid[readRow][col];

        if (!tile.isEmpty) {
          if (readRow !== writeRow) {
            // Tile needs to fall
            movements.push({
              tileId: tile.id,
              fromRow: readRow,
              fromCol: col,
              toRow: writeRow,
              toCol: col,
            });

            // Move tile in grid
            this.grid[writeRow][col] = { ...tile, row: writeRow, col };
            this.grid[readRow][col] = {
              row: readRow,
              col,
              type: 'empty',
              isEmpty: true,
              id: this.generateTileId(),
            };
          }
          writeRow--;
        }
      }
    }

    return movements;
  }

  /**
   * Spawn new tiles to fill empty cells
   * Fills from top of each column
   */
  spawnNewTiles(spawnRules: SpawnRules): SpawnData[] {
    const spawns: SpawnData[] = [];

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        if (this.grid[row][col].isEmpty) {
          const type = this.getRandomTileType(spawnRules);
          const tileId = this.generateTileId();

          this.grid[row][col] = {
            row,
            col,
            type,
            isEmpty: false,
            id: tileId,
          };

          spawns.push({
            row,
            col,
            type,
            tileId,
          });
        }
      }
    }

    return spawns;
  }

  /**
   * Check if any valid moves exist on the board
   * A valid move is a swap that creates at least one match
   */
  hasValidMoves(): boolean {
    // Try all possible adjacent swaps
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        // Try swapping with right neighbor
        if (col < this.cols - 1) {
          this.swapTiles(row, col, row, col + 1);
          const matches = this.findMatches();
          this.swapTiles(row, col + 1, row, col); // Swap back

          if (matches.length > 0) {
            return true;
          }
        }

        // Try swapping with bottom neighbor
        if (row < this.rows - 1) {
          this.swapTiles(row, col, row + 1, col);
          const matches = this.findMatches();
          this.swapTiles(row + 1, col, row, col); // Swap back

          if (matches.length > 0) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Reshuffle the board until it has no matches and has valid moves
   * Uses regeneration approach similar to initial grid generation
   */
  reshuffleBoard(): void {
    // Estimate spawn rules from current tiles
    const spawnRules = this.estimateSpawnRules();

    let attempts = 0;
    const maxAttempts = 50;

    do {
      // Regenerate grid using same approach as initial generation
      this.generateGrid(spawnRules);
      attempts++;
    } while (
      (this.findMatches().length > 0 || !this.hasValidMoves()) &&
      attempts < maxAttempts
    );
  }

  /**
   * Process a complete turn: find matches, remove, apply gravity, spawn, repeat until no more matches
   * Returns cascade result with depth counter (max 20 to prevent infinite loops)
   */
  processTurn(): CascadeResult {
    const allMatches: Match[] = [];
    const allMovements: Movement[] = [];
    const allSpawns: SpawnData[] = [];
    let depth = 0;

    // Keep cascading until no more matches or max depth reached
    while (depth < this.MAX_CASCADE_DEPTH) {
      const matches = this.findMatches();

      if (matches.length === 0) {
        break;
      }

      depth++;
      allMatches.push(...matches);

      // Remove matches
      this.removeMatches(matches);

      // Apply gravity
      const movements = this.applyGravity();
      allMovements.push(...movements);

      // Get spawn rules from current grid distribution (approximate)
      const spawnRules = this.estimateSpawnRules();

      // Spawn new tiles
      const spawns = this.spawnNewTiles(spawnRules);
      allSpawns.push(...spawns);

      // Loop continues to check for new matches from cascade
    }

    return {
      matches: allMatches,
      movements: allMovements,
      spawns: allSpawns,
      depth,
    };
  }

  /**
   * Estimate spawn rules from current grid distribution
   * Used when spawn rules aren't provided to processTurn
   */
  private estimateSpawnRules(): SpawnRules {
    const counts = { fuel: 0, coffee: 0, snack: 0, road: 0 };
    let total = 0;

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const type = this.grid[row][col].type;
        if (type !== 'empty' && !this.grid[row][col].isEmpty) {
          if (type in counts) {
            counts[type as keyof typeof counts]++;
            total++;
          }
        }
      }
    }

    // Return proportional spawn rules, or equal distribution if board is empty
    if (total === 0) {
      return { fuel: 0.25, coffee: 0.25, snack: 0.25, road: 0.25 };
    }

    return {
      fuel: counts.fuel / total || 0.1,
      coffee: counts.coffee / total || 0.1,
      snack: counts.snack / total || 0.1,
      road: counts.road / total || 0.1,
    };
  }
}

import {
  TileData,
  Movement,
  Match,
  SpawnData,
  SpawnRules,
  CascadeResult,
  TileType,
  MatchResult,
  BoosterSpawn,
  ObstacleData,
  ObstacleType,
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
  private cellMap?: number[][];

  constructor(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;
  }

  /**
   * Check if a cell is active (not blocked by cell_map)
   */
  isCellActive(row: number, col: number): boolean {
    // Out of bounds check
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return false;
    }

    // No cellMap = all cells active (backward compatibility)
    if (!this.cellMap) {
      return true;
    }

    return this.cellMap[row][col] === 1;
  }

  /**
   * Set the cell map and mark inactive cells as blocked
   */
  setCellMap(cellMap?: number[][]): void {
    this.cellMap = cellMap;

    if (cellMap) {
      this.applyCellMap();
    }
  }

  /**
   * Apply cell map to grid by marking inactive cells as blocked
   */
  private applyCellMap(): void {
    if (!this.cellMap || !this.grid || this.grid.length === 0) return;

    for (let row = 0; row < this.rows; row++) {
      if (!this.grid[row]) continue;

      for (let col = 0; col < this.cols; col++) {
        if (this.cellMap[row][col] === 0) {
          // Mark inactive cell as empty with blocked obstacle
          this.grid[row][col] = {
            row,
            col,
            type: 'empty',
            isEmpty: true,
            id: this.generateTileId(),
            obstacle: { type: 'blocked', layers: 1 }
          };
        }
      }
    }
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

    // Apply cell map if exists
    if (this.cellMap) {
      this.applyCellMap();
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
    while (c >= 0 && this.isCellActive(row, c) && grid[row][c] && grid[row][c].type === type) {
      horizontalCount++;
      c--;
    }

    // Count to the right
    c = col + 1;
    while (c < this.cols && this.isCellActive(row, c) && grid[row][c] && grid[row][c].type === type) {
      horizontalCount++;
      c++;
    }

    if (horizontalCount >= 3) return true;

    // Check vertical (up and down)
    let verticalCount = 1;

    // Count upward
    let r = row - 1;
    while (r >= 0 && this.isCellActive(r, col) && grid[r][col] && grid[r][col].type === type) {
      verticalCount++;
      r--;
    }

    // Count downward
    r = row + 1;
    while (r < this.rows && this.isCellActive(r, col) && grid[r] && grid[r][col] && grid[r][col].type === type) {
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
    const entries = Object.entries(spawnRules) as [TileType, number][];
    const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
    const random = Math.random() * totalWeight;
    let cumulative = 0;
    for (const [type, weight] of entries) {
      cumulative += weight;
      if (random < cumulative) return type;
    }
    return entries[entries.length - 1][0]; // Fallback to last type
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
      // Find first active cell in row
      let startCol = 0;
      while (startCol < this.cols && !this.isCellActive(row, startCol)) {
        startCol++;
      }

      if (startCol >= this.cols) continue; // No active cells in row

      let currentType = this.grid[row][startCol].type;
      let matchLength = 1;

      for (let col = startCol + 1; col <= this.cols; col++) {
        // Check if we hit an inactive cell or end of row
        if (col >= this.cols || !this.isCellActive(row, col)) {
          // Sequence ended by inactive cell or end
          if (matchLength >= 3 && currentType !== 'empty') {
            const tiles: TileData[] = [];
            for (let c = startCol; c < col; c++) {
              if (this.isCellActive(row, c)) {
                tiles.push(this.grid[row][c]);
              }
            }
            matches.push({
              tiles,
              type: currentType,
              direction: 'horizontal',
            });
          }

          // Skip to next active cell
          if (col < this.cols) {
            startCol = col + 1;
            while (startCol < this.cols && !this.isCellActive(row, startCol)) {
              startCol++;
            }
            if (startCol >= this.cols) break;

            col = startCol;
            currentType = this.grid[row][startCol].type;
            matchLength = 1;
          }
          continue;
        }

        const tile = this.grid[row][col];

        if (
          !tile.isEmpty &&
          tile.type === currentType &&
          currentType !== 'empty'
        ) {
          matchLength++;
        } else {
          // Sequence ended by different type
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
          currentType = tile.type;
          startCol = col;
          matchLength = 1;
        }
      }
    }

    // Check vertical matches
    for (let col = 0; col < this.cols; col++) {
      // Find first active cell in column
      let startRow = 0;
      while (startRow < this.rows && !this.isCellActive(startRow, col)) {
        startRow++;
      }

      if (startRow >= this.rows) continue; // No active cells in column

      let currentType = this.grid[startRow][col].type;
      let matchLength = 1;

      for (let row = startRow + 1; row <= this.rows; row++) {
        // Check if we hit an inactive cell or end of column
        if (row >= this.rows || !this.isCellActive(row, col)) {
          // Sequence ended by inactive cell or end
          if (matchLength >= 3 && currentType !== 'empty') {
            const tiles: TileData[] = [];
            for (let r = startRow; r < row; r++) {
              if (this.isCellActive(r, col)) {
                tiles.push(this.grid[r][col]);
              }
            }
            matches.push({
              tiles,
              type: currentType,
              direction: 'vertical',
            });
          }

          // Skip to next active cell
          if (row < this.rows) {
            startRow = row + 1;
            while (startRow < this.rows && !this.isCellActive(startRow, col)) {
              startRow++;
            }
            if (startRow >= this.rows) break;

            row = startRow;
            currentType = this.grid[startRow][col].type;
            matchLength = 1;
          }
          continue;
        }

        const tile = this.grid[row][col];

        if (
          !tile.isEmpty &&
          tile.type === currentType &&
          currentType !== 'empty'
        ) {
          matchLength++;
        } else {
          // Sequence ended by different type
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
          currentType = tile.type;
          startRow = row;
          matchLength = 1;
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
        const cell = this.grid[tile.row][tile.col];
        // Tiles protected by obstacles stay in place — obstacle is damaged via damageObstacles()
        if (cell.obstacle && cell.obstacle.layers > 0 && cell.obstacle.type !== 'blocked') {
          return;
        }
        cell.isEmpty = true;
        cell.type = 'empty';
      });
    });
  }

  /**
   * Apply gravity: tiles fall down to fill empty spaces
   * Returns movement data for animation
   * Processes columns independently (bottom-to-top)
   * Obstacle-aware: tiles with obstacles stay in place, blocked cells don't accept tiles
   */
  applyGravity(): Movement[] {
    const movements: Movement[] = [];

    for (let col = 0; col < this.cols; col++) {
      // Process column from bottom to top
      let writeRow = this.rows - 1;

      // Find the lowest valid landing spot (skip blocked cells and inactive cells)
      while (writeRow >= 0 && (!this.isCellActive(writeRow, col) || this.grid[writeRow][col].obstacle?.type === 'blocked')) {
        writeRow--;
      }

      for (let readRow = this.rows - 1; readRow >= 0; readRow--) {
        // Skip inactive cells when reading
        if (!this.isCellActive(readRow, col)) {
          continue;
        }

        const tile = this.grid[readRow][col];

        // Skip blocked cells when reading
        if (tile.obstacle?.type === 'blocked') {
          continue;
        }

        // Tiles with active obstacles (not 'blocked') stay in place
        if (tile.obstacle && tile.obstacle.layers > 0) {
          if (readRow <= writeRow) {
            writeRow = readRow - 1;
            // Skip any blocked cells and inactive cells above
            while (writeRow >= 0 && (!this.isCellActive(writeRow, col) || this.grid[writeRow][col].obstacle?.type === 'blocked')) {
              writeRow--;
            }
          }
          continue;
        }

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
          // Skip any blocked cells and inactive cells above
          while (writeRow >= 0 && (!this.isCellActive(writeRow, col) || this.grid[writeRow][col].obstacle?.type === 'blocked')) {
            writeRow--;
          }
        }
      }
    }

    return movements;
  }

  /**
   * Spawn new tiles to fill empty cells
   * Fills from top of each column
   * Does not spawn on blocked cells or inactive cells
   */
  spawnNewTiles(spawnRules: SpawnRules): SpawnData[] {
    const spawns: SpawnData[] = [];

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        // Skip inactive cells
        if (!this.isCellActive(row, col)) {
          continue;
        }

        const tile = this.grid[row][col];

        // Do not spawn on blocked cells
        if (tile.obstacle?.type === 'blocked') {
          continue;
        }

        if (tile.isEmpty) {
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
    // Try all possible adjacent swaps (skip tiles with obstacles - not swappable)
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        // Skip inactive cells
        if (!this.isCellActive(row, col)) continue;

        const tile = this.grid[row][col];
        if (tile.obstacle && tile.obstacle.layers > 0) continue;

        // Try swapping with right neighbor
        if (col < this.cols - 1 && this.isCellActive(row, col + 1)) {
          const rightNeighbor = this.grid[row][col + 1];
          if (!(rightNeighbor.obstacle && rightNeighbor.obstacle.layers > 0)) {
            this.swapTiles(row, col, row, col + 1);
            const matches = this.findMatches();
            this.swapTiles(row, col + 1, row, col);
            if (matches.length > 0) return true;
          }
        }

        // Try swapping with bottom neighbor
        if (row < this.rows - 1 && this.isCellActive(row + 1, col)) {
          const bottomNeighbor = this.grid[row + 1][col];
          if (!(bottomNeighbor.obstacle && bottomNeighbor.obstacle.layers > 0)) {
            this.swapTiles(row, col, row + 1, col);
            const matches = this.findMatches();
            this.swapTiles(row + 1, col, row, col);
            if (matches.length > 0) return true;
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
      // generateGrid now calls applyCellMap internally
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
    const counts = { burger: 0, hotdog: 0, oil: 0, water: 0, snack: 0, soda: 0 };
    let total = 0;

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        // Skip inactive cells
        if (!this.isCellActive(row, col)) continue;

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
      return { burger: 0.167, hotdog: 0.167, oil: 0.167, water: 0.167, snack: 0.166, soda: 0.166 };
    }

    return {
      burger: counts.burger / total || 0.1,
      hotdog: counts.hotdog / total || 0.1,
      oil: counts.oil / total || 0.1,
      water: counts.water / total || 0.1,
      snack: counts.snack / total || 0.1,
      soda: counts.soda / total || 0.1,
    };
  }

  /**
   * Find matches and detect booster creation opportunities
   * Returns tiles to remove and boosters to spawn
   */
  findMatchesWithBoosters(): MatchResult {
    const matches = this.findMatches();
    const tilesToRemove: TileData[] = [];
    const boostersToSpawn: BoosterSpawn[] = [];
    const processedMatches = new Set<number>();

    // Build position sets for L/T detection
    const horizontalMatches: Match[] = [];
    const verticalMatches: Match[] = [];

    matches.forEach((match) => {
      if (match.direction === 'horizontal') {
        horizontalMatches.push(match);
      } else {
        verticalMatches.push(match);
      }
    });

    // Find L/T-shape intersections (horizontal and vertical matches of same type)
    for (let hIdx = 0; hIdx < horizontalMatches.length; hIdx++) {
      for (let vIdx = 0; vIdx < verticalMatches.length; vIdx++) {
        const hMatch = horizontalMatches[hIdx];
        const vMatch = verticalMatches[vIdx];

        // Must be same type
        if (hMatch.type !== vMatch.type) continue;

        // Find intersection
        const hPositions = new Set(hMatch.tiles.map((t) => `${t.row},${t.col}`));
        const vPositions = new Set(vMatch.tiles.map((t) => `${t.row},${t.col}`));

        let intersection: { row: number; col: number } | null = null;
        for (const pos of hPositions) {
          if (vPositions.has(pos)) {
            const [row, col] = pos.split(',').map(Number);
            intersection = { row, col };
            break;
          }
        }

        if (intersection) {
          // Found L/T-shape - spawn bomb at intersection
          boostersToSpawn.push({
            row: intersection.row,
            col: intersection.col,
            boosterType: 'bomb',
            baseType: hMatch.type,
          });

          // Add all tiles from both matches to tilesToRemove
          hMatch.tiles.forEach((t) => {
            if (!tilesToRemove.find((tile) => tile.id === t.id)) {
              tilesToRemove.push(t);
            }
          });
          vMatch.tiles.forEach((t) => {
            if (!tilesToRemove.find((tile) => tile.id === t.id)) {
              tilesToRemove.push(t);
            }
          });

          // Mark both matches as processed
          processedMatches.add(hIdx);
          processedMatches.add(horizontalMatches.length + vIdx);
        }
      }
    }

    // Process remaining matches (non-L/T)
    matches.forEach((match) => {
      const matchIdx =
        match.direction === 'horizontal'
          ? horizontalMatches.indexOf(match)
          : horizontalMatches.length + verticalMatches.indexOf(match);

      if (processedMatches.has(matchIdx)) {
        return; // Already processed as part of L/T
      }

      const matchLength = match.tiles.length;
      const middleIdx = Math.floor(matchLength / 2);
      const middleTile = match.tiles[middleIdx];

      if (matchLength >= 5) {
        // KLO-sphere
        boostersToSpawn.push({
          row: middleTile.row,
          col: middleTile.col,
          boosterType: 'klo_sphere',
          baseType: match.type,
        });
      } else if (matchLength === 4) {
        // Linear booster
        boostersToSpawn.push({
          row: middleTile.row,
          col: middleTile.col,
          boosterType:
            match.direction === 'horizontal'
              ? 'linear_horizontal'
              : 'linear_vertical',
          baseType: match.type,
        });
      }
      // matchLength === 3: no booster

      // Add tiles to remove
      match.tiles.forEach((t) => {
        if (!tilesToRemove.find((tile) => tile.id === t.id)) {
          tilesToRemove.push(t);
        }
      });
    });

    return { tilesToRemove, boostersToSpawn };
  }

  /**
   * Get tile at specific position
   */
  getTileAt(row: number, col: number): TileData {
    return this.grid[row][col];
  }

  /**
   * Set tile at specific position (merge partial data)
   */
  setTileAt(row: number, col: number, tile: Partial<TileData>): void {
    this.grid[row][col] = { ...this.grid[row][col], ...tile };
  }

  /**
   * Get all tiles in a row
   */
  getTilesInRow(row: number): TileData[] {
    return this.grid[row];
  }

  /**
   * Get all tiles in a column
   */
  getTilesInColumn(col: number): TileData[] {
    const tiles: TileData[] = [];
    for (let row = 0; row < this.rows; row++) {
      tiles.push(this.grid[row][col]);
    }
    return tiles;
  }

  /**
   * Get tiles in radius around a position (square area)
   */
  getTilesInRadius(row: number, col: number, radius: number): TileData[] {
    const tiles: TileData[] = [];
    const minRow = Math.max(0, row - radius);
    const maxRow = Math.min(this.rows - 1, row + radius);
    const minCol = Math.max(0, col - radius);
    const maxCol = Math.min(this.cols - 1, col + radius);

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        tiles.push(this.grid[r][c]);
      }
    }
    return tiles;
  }

  /**
   * Get all tiles of a specific type
   */
  getTilesByType(type: TileType): TileData[] {
    const tiles: TileData[] = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const tile = this.grid[row][col];
        if (tile.type === type && !tile.isEmpty) {
          tiles.push(tile);
        }
      }
    }
    return tiles;
  }

  /**
   * Get adjacent tiles (up to 4: up, down, left, right)
   */
  getAdjacentTiles(row: number, col: number): TileData[] {
    const tiles: TileData[] = [];

    // Up
    if (row > 0 && this.isCellActive(row - 1, col)) {
      tiles.push(this.grid[row - 1][col]);
    }
    // Down
    if (row < this.rows - 1 && this.isCellActive(row + 1, col)) {
      tiles.push(this.grid[row + 1][col]);
    }
    // Left
    if (col > 0 && this.isCellActive(row, col - 1)) {
      tiles.push(this.grid[row][col - 1]);
    }
    // Right
    if (col < this.cols - 1 && this.isCellActive(row, col + 1)) {
      tiles.push(this.grid[row][col + 1]);
    }

    return tiles;
  }

  /**
   * Damage obstacles adjacent to matched tiles
   * Returns list of damaged/destroyed obstacles for goal tracking
   */
  damageObstacles(matches: Match[]): ObstacleData[] {
    const damagedObstacles: ObstacleData[] = [];
    const processedPositions = new Set<string>();

    // For each match, get each matched tile
    matches.forEach((match) => {
      match.tiles.forEach((matchedTile) => {
        // Get adjacent tiles
        const adjacentTiles = this.getAdjacentTiles(matchedTile.row, matchedTile.col);

        adjacentTiles.forEach((adjTile) => {
          const posKey = `${adjTile.row},${adjTile.col}`;

          // Skip if already processed this position
          if (processedPositions.has(posKey)) {
            return;
          }

          // Check if tile has an obstacle
          if (adjTile.obstacle && adjTile.obstacle.layers > 0) {
            // Skip 'blocked' type (permanent, takes no damage)
            if (adjTile.obstacle.type === 'blocked') {
              return;
            }

            // Store obstacle data before damage for goal tracking
            const obstacleBeforeDamage = { ...adjTile.obstacle };

            // Decrement obstacle layers
            this.grid[adjTile.row][adjTile.col].obstacle!.layers--;

            // If layers reaches 0, remove obstacle
            if (this.grid[adjTile.row][adjTile.col].obstacle!.layers === 0) {
              delete this.grid[adjTile.row][adjTile.col].obstacle;
            }

            // Add to damaged list
            damagedObstacles.push(obstacleBeforeDamage);

            // Mark position as processed
            processedPositions.add(posKey);
          }
        });
      });
    });

    return damagedObstacles;
  }

  /**
   * Initialize obstacles on the grid
   * Used for level setup
   */
  initializeObstacles(
    obstacles: Array<{
      type: ObstacleType;
      layers: number;
      positions: [number, number][];
    }>
  ): void {
    obstacles.forEach((obstacleConfig) => {
      obstacleConfig.positions.forEach(([row, col]) => {
        this.grid[row][col].obstacle = {
          type: obstacleConfig.type,
          layers: obstacleConfig.layers,
        };

        // For 'blocked' type: mark cell as empty (no tile can exist here)
        if (obstacleConfig.type === 'blocked') {
          this.grid[row][col].isEmpty = true;
          this.grid[row][col].type = 'empty';
        }
      });
    });
  }
}

/**
 * Canvas Renderer
 * Handles all visual rendering of the game board and pieces
 */

import {
  Piece,
  Position,
  Move,
  GhostPiece,
  RenderConfig,
  BOARD_SIZE,
  THEME_COLORS,
  isPlayableSquare,
  positionsEqual,
} from '../types.js';

/**
 * Default render configuration
 */
function createDefaultConfig(canvasSize: number): RenderConfig {
  const cellSize = canvasSize / BOARD_SIZE;
  return {
    cellSize,
    boardSize: canvasSize,
    pieceRadius: cellSize * 0.38,
    colors: THEME_COLORS,
  };
}

/**
 * Canvas Renderer class
 */
export class Renderer {
  private _canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D;
  private _config: RenderConfig;
  private _animationFrame: number | null = null;

  // State for rendering
  private _board: (Piece | null)[][] = [];
  private _selectedPiece: Piece | null = null;
  private _validMoves: Move[] = [];
  private _ghostPieces: GhostPiece[] = [];
  private _glowingPiece: Piece | null = null;
  private _glowStartTime: number = 0;
  private _moveTraces: { path: Position[] }[] = [];

  // Animation state
  private _animatingPiece: Piece | null = null;
  private _animationFrom: Position | null = null;
  private _animationTo: Position | null = null;
  private _animationProgress: number = 0;
  private _animationStartTime: number = 0;
  private _animationDuration: number = 300;
  private _onAnimationComplete: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }
    this._ctx = ctx;
    this._config = createDefaultConfig(canvas.width);

    // Handle high DPI displays
    this._setupHighDPI();
  }

  /**
   * Sets up canvas for high DPI displays
   */
  private _setupHighDPI(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this._canvas.getBoundingClientRect();

    // Set the canvas size in pixels
    this._canvas.width = rect.width * dpr;
    this._canvas.height = rect.height * dpr;

    // Scale the context to match
    this._ctx.scale(dpr, dpr);

    // Update config with logical size
    this._config = createDefaultConfig(rect.width);
  }

  /**
   * Resizes the canvas (call on window resize)
   */
  resize(): void {
    this._setupHighDPI();
    this.render();
  }

  /**
   * Updates the board state
   */
  setBoard(board: (Piece | null)[][]): void {
    this._board = board;
  }

  /**
   * Sets the selected piece and valid moves
   */
  setSelection(piece: Piece | null, validMoves: Move[]): void {
    this._selectedPiece = piece;
    this._validMoves = validMoves;
  }

  /**
   * Sets ghost pieces for precog overlay
   */
  setGhostPieces(ghosts: GhostPiece[]): void {
    this._ghostPieces = ghosts;
  }

  /**
   * Clears ghost pieces
   */
  clearGhostPieces(): void {
    this._ghostPieces = [];
  }

  /**
   * Adds a move trace with full path (for multi-jumps)
   * @param from Starting position
   * @param to Ending position  
   * @param captures Array of captured piece positions (used to reconstruct path)
   */
  addMoveTrace(from: Position, to: Position, captures: Position[] = []): void {
    // Reconstruct the full path through captures
    // Each capture position is the midpoint of a jump, so the landing is 
    // on the opposite side of the captured piece from the jumping piece
    const path: Position[] = [from];
    
    if (captures.length > 0) {
      let currentPos = from;
      for (const capturePos of captures) {
        // The landing position is on the opposite side of the capture
        const landingRow = capturePos.row + (capturePos.row - currentPos.row);
        const landingCol = capturePos.col + (capturePos.col - currentPos.col);
        path.push({ row: landingRow, col: landingCol });
        currentPos = { row: landingRow, col: landingCol };
      }
    } else {
      path.push(to);
    }
    
    this._moveTraces.push({ path });
    // Keep only last 10 traces
    if (this._moveTraces.length > 10) {
      this._moveTraces.shift();
    }
  }

  /**
   * Clears all move traces
   */
  clearMoveTraces(): void {
    this._moveTraces = [];
  }

  /**
   * Starts the glow animation for a piece
   */
  startGlow(piece: Piece, duration: number = 1000): Promise<void> {
    return new Promise(resolve => {
      this._glowingPiece = piece;
      this._glowStartTime = performance.now();

      const animate = (time: number): void => {
        const elapsed = time - this._glowStartTime;

        if (elapsed >= duration) {
          this._glowingPiece = null;
          this.render();
          resolve();
          return;
        }

        this.render();
        requestAnimationFrame(animate);
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Animates a piece moving from one position to another
   */
  animateMove(
    piece: Piece,
    from: Position,
    to: Position,
    duration: number = 300
  ): Promise<void> {
    return new Promise(resolve => {
      this._animatingPiece = piece;
      this._animationFrom = from;
      this._animationTo = to;
      this._animationProgress = 0;
      this._animationStartTime = performance.now();
      this._animationDuration = duration;
      this._onAnimationComplete = resolve;

      this._startAnimationLoop();
    });
  }

  /**
   * Animates a piece through multiple positions (for multi-jump captures)
   * @param piece The piece to animate
   * @param path Array of positions to animate through (including start)
   * @param durationPerHop Duration for each hop in milliseconds
   */
  async animateMultiJump(
    piece: Piece,
    path: Position[],
    durationPerHop: number = 250
  ): Promise<void> {
    if (path.length < 2) {
      return;
    }

    // Animate through each hop sequentially
    for (let i = 0; i < path.length - 1; i++) {
      await this.animateMove(piece, path[i], path[i + 1], durationPerHop);
    }
  }

  /**
   * Starts the animation loop
   */
  private _startAnimationLoop(): void {
    const animate = (time: number): void => {
      if (!this._animatingPiece) {
        return;
      }

      const elapsed = time - this._animationStartTime;
      this._animationProgress = Math.min(elapsed / this._animationDuration, 1);

      // Ease out cubic
      this._animationProgress =
        1 - Math.pow(1 - this._animationProgress, 3);

      this.render();

      if (this._animationProgress >= 1) {
        this._animatingPiece = null;
        this._animationFrom = null;
        this._animationTo = null;

        if (this._onAnimationComplete) {
          this._onAnimationComplete();
          this._onAnimationComplete = null;
        }
      } else {
        this._animationFrame = requestAnimationFrame(animate);
      }
    };

    this._animationFrame = requestAnimationFrame(animate);
  }

  /**
   * Main render function
   */
  render(): void {
    const { cellSize, boardSize, colors } = this._config;

    // Clear canvas
    this._ctx.fillStyle = colors.bgPrimary;
    this._ctx.fillRect(0, 0, boardSize, boardSize);

    // Draw board
    this._drawBoard();

    // Draw move traces
    this._drawMoveTraces();

    // Draw valid move indicators
    this._drawValidMoveIndicators();

    // Draw ghost pieces (precog overlay)
    this._drawGhostPieces();

    // Draw pieces
    this._drawPieces();

    // Draw selection highlight
    this._drawSelectionHighlight();
  }

  /**
   * Draws the checker board
   */
  private _drawBoard(): void {
    const { cellSize, colors } = this._config;

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const x = col * cellSize;
        const y = row * cellSize;

        if (isPlayableSquare(row, col)) {
          // Dark square (playable)
          this._ctx.fillStyle = colors.bgTertiary;
        } else {
          // Light square
          this._ctx.fillStyle = colors.bgSecondary;
        }

        this._ctx.fillRect(x, y, cellSize, cellSize);

        // Draw subtle grid lines
        this._ctx.strokeStyle = `rgba(0, 212, 255, 0.1)`;
        this._ctx.lineWidth = 1;
        this._ctx.strokeRect(x, y, cellSize, cellSize);
      }
    }
  }

  /**
   * Draws move traces (history lines)
   */
  private _drawMoveTraces(): void {
    const { cellSize } = this._config;

    this._ctx.lineWidth = 2;
    this._ctx.setLineDash([5, 5]);

    for (let i = 0; i < this._moveTraces.length; i++) {
      const trace = this._moveTraces[i];
      const opacity = 0.1 + (i / this._moveTraces.length) * 0.2;

      this._ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;

      if (trace.path.length < 2) continue;

      this._ctx.beginPath();
      const startX = trace.path[0].col * cellSize + cellSize / 2;
      const startY = trace.path[0].row * cellSize + cellSize / 2;
      this._ctx.moveTo(startX, startY);

      // Draw through all path points (handles multi-jumps)
      for (let j = 1; j < trace.path.length; j++) {
        const x = trace.path[j].col * cellSize + cellSize / 2;
        const y = trace.path[j].row * cellSize + cellSize / 2;
        this._ctx.lineTo(x, y);
      }
      
      this._ctx.stroke();
    }

    this._ctx.setLineDash([]);
  }

  /**
   * Draws valid move indicators
   */
  private _drawValidMoveIndicators(): void {
    const { cellSize, colors } = this._config;

    for (const move of this._validMoves) {
      const x = move.to.col * cellSize + cellSize / 2;
      const y = move.to.row * cellSize + cellSize / 2;

      // Draw pulsing dot for valid moves
      const time = performance.now() / 1000;
      const pulse = 0.5 + Math.sin(time * 4) * 0.3;

      if (move.captures.length > 0) {
        // Capture move - orange
        this._ctx.fillStyle = `rgba(255, 107, 53, ${pulse})`;
      } else {
        // Regular move - cyan
        this._ctx.fillStyle = `rgba(0, 212, 255, ${pulse})`;
      }

      this._ctx.beginPath();
      this._ctx.arc(x, y, cellSize * 0.15, 0, Math.PI * 2);
      this._ctx.fill();

      // Draw capture indicator on captured pieces
      for (const capturePos of move.captures) {
        const cx = capturePos.col * cellSize + cellSize / 2;
        const cy = capturePos.row * cellSize + cellSize / 2;

        this._ctx.strokeStyle = `rgba(255, 107, 53, ${pulse})`;
        this._ctx.lineWidth = 3;
        this._ctx.beginPath();
        this._ctx.arc(cx, cy, cellSize * 0.35, 0, Math.PI * 2);
        this._ctx.stroke();
      }
    }
  }

  /**
   * Draws ghost pieces for precog predictions
   */
  private _drawGhostPieces(): void {
    const { cellSize, pieceRadius, colors } = this._config;

    for (const ghost of this._ghostPieces) {
      const x = ghost.position.col * cellSize + cellSize / 2;
      const y = ghost.position.row * cellSize + cellSize / 2;

      const color =
        ghost.player === 'human' ? colors.pieceHuman : colors.pieceAgatha;

      // Ghost piece (semi-transparent)
      this._ctx.globalAlpha = ghost.opacity;

      // Draw ghost with dashed outline
      this._ctx.setLineDash([4, 4]);
      this._ctx.strokeStyle = color;
      this._ctx.lineWidth = 2;
      this._ctx.beginPath();
      this._ctx.arc(x, y, pieceRadius, 0, Math.PI * 2);
      this._ctx.stroke();
      this._ctx.setLineDash([]);

      // Fill with very low opacity
      this._ctx.fillStyle = color;
      this._ctx.globalAlpha = ghost.opacity * 0.3;
      this._ctx.fill();

      this._ctx.globalAlpha = 1;

      // Draw crown for ghost kings
      if (ghost.type === 'king') {
        this._drawCrown(x, y, pieceRadius * 0.6, ghost.opacity * 0.7);
      }
    }
  }

  /**
   * Draws all pieces on the board
   */
  private _drawPieces(): void {
    const { cellSize, pieceRadius, colors } = this._config;

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const piece = this._board[row]?.[col];
        if (!piece) continue;

        // Skip if this piece is being animated
        if (
          this._animatingPiece &&
          positionsEqual(piece.position, this._animatingPiece.position)
        ) {
          continue;
        }

        const x = col * cellSize + cellSize / 2;
        const y = row * cellSize + cellSize / 2;

        this._drawPiece(piece, x, y);
      }
    }

    // Draw animating piece
    if (this._animatingPiece && this._animationFrom && this._animationTo) {
      const fromX =
        this._animationFrom.col * cellSize + cellSize / 2;
      const fromY =
        this._animationFrom.row * cellSize + cellSize / 2;
      const toX = this._animationTo.col * cellSize + cellSize / 2;
      const toY = this._animationTo.row * cellSize + cellSize / 2;

      const x = fromX + (toX - fromX) * this._animationProgress;
      const y = fromY + (toY - fromY) * this._animationProgress;

      this._drawPiece(this._animatingPiece, x, y);
    }
  }

  /**
   * Draws a single piece
   */
  private _drawPiece(piece: Piece, x: number, y: number): void {
    const { pieceRadius, colors } = this._config;

    const color =
      piece.player === 'human' ? colors.pieceHuman : colors.pieceAgatha;

    // Check if this piece is glowing
    const isGlowing =
      this._glowingPiece &&
      positionsEqual(piece.position, this._glowingPiece.position);

    // Draw glow effect
    if (isGlowing) {
      const elapsed = performance.now() - this._glowStartTime;
      const pulse = Math.sin((elapsed / 1000) * Math.PI * 4) * 0.5 + 0.5;

      const gradient = this._ctx.createRadialGradient(
        x,
        y,
        pieceRadius * 0.5,
        x,
        y,
        pieceRadius * 2
      );
      gradient.addColorStop(0, `rgba(0, 212, 255, ${0.6 * pulse})`);
      gradient.addColorStop(1, 'rgba(0, 212, 255, 0)');

      this._ctx.fillStyle = gradient;
      this._ctx.beginPath();
      this._ctx.arc(x, y, pieceRadius * 2, 0, Math.PI * 2);
      this._ctx.fill();
    }

    // Draw shadow
    this._ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this._ctx.beginPath();
    this._ctx.arc(x + 2, y + 2, pieceRadius, 0, Math.PI * 2);
    this._ctx.fill();

    // Draw piece body
    const gradient = this._ctx.createRadialGradient(
      x - pieceRadius * 0.3,
      y - pieceRadius * 0.3,
      0,
      x,
      y,
      pieceRadius
    );
    gradient.addColorStop(0, this._lightenColor(color, 40));
    gradient.addColorStop(0.7, color);
    gradient.addColorStop(1, this._darkenColor(color, 30));

    this._ctx.fillStyle = gradient;
    this._ctx.beginPath();
    this._ctx.arc(x, y, pieceRadius, 0, Math.PI * 2);
    this._ctx.fill();

    // Draw piece edge
    this._ctx.strokeStyle = this._darkenColor(color, 20);
    this._ctx.lineWidth = 2;
    this._ctx.stroke();

    // Draw king crown
    if (piece.type === 'king') {
      this._drawCrown(x, y, pieceRadius * 0.6, 1);
    }
  }

  /**
   * Draws a crown for king pieces
   */
  private _drawCrown(
    x: number,
    y: number,
    size: number,
    opacity: number
  ): void {
    const { colors } = this._config;

    this._ctx.globalAlpha = opacity;

    // Crown glow
    const glowGradient = this._ctx.createRadialGradient(x, y, 0, x, y, size);
    glowGradient.addColorStop(0, `rgba(255, 215, 0, 0.8)`);
    glowGradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

    this._ctx.fillStyle = glowGradient;
    this._ctx.beginPath();
    this._ctx.arc(x, y, size, 0, Math.PI * 2);
    this._ctx.fill();

    // Crown shape
    this._ctx.fillStyle = colors.accentGold;
    this._ctx.strokeStyle = this._darkenColor(colors.accentGold, 20);
    this._ctx.lineWidth = 1;

    const crownWidth = size * 0.8;
    const crownHeight = size * 0.6;

    this._ctx.beginPath();
    this._ctx.moveTo(x - crownWidth / 2, y + crownHeight / 2);
    this._ctx.lineTo(x - crownWidth / 2, y - crownHeight / 4);
    this._ctx.lineTo(x - crownWidth / 4, y);
    this._ctx.lineTo(x, y - crownHeight / 2);
    this._ctx.lineTo(x + crownWidth / 4, y);
    this._ctx.lineTo(x + crownWidth / 2, y - crownHeight / 4);
    this._ctx.lineTo(x + crownWidth / 2, y + crownHeight / 2);
    this._ctx.closePath();

    this._ctx.fill();
    this._ctx.stroke();

    this._ctx.globalAlpha = 1;
  }

  /**
   * Draws selection highlight around selected piece
   */
  private _drawSelectionHighlight(): void {
    if (!this._selectedPiece) return;

    const { cellSize, colors } = this._config;
    const { row, col } = this._selectedPiece.position;

    const x = col * cellSize;
    const y = row * cellSize;

    // Pulsing selection border
    const time = performance.now() / 1000;
    const pulse = 0.5 + Math.sin(time * 4) * 0.5;

    this._ctx.strokeStyle = `rgba(0, 212, 255, ${pulse})`;
    this._ctx.lineWidth = 3;
    this._ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
  }

  /**
   * Gets the board position from screen coordinates
   */
  getPositionFromCoords(screenX: number, screenY: number): Position | null {
    const rect = this._canvas.getBoundingClientRect();
    const x = screenX - rect.left;
    const y = screenY - rect.top;

    const col = Math.floor(x / this._config.cellSize);
    const row = Math.floor(y / this._config.cellSize);

    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) {
      return null;
    }

    return { row, col };
  }

  /**
   * Lightens a hex color
   */
  private _lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);
    return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
  }

  /**
   * Darkens a hex color
   */
  private _darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
    const B = Math.max(0, (num & 0x0000ff) - amt);
    return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
  }
}

/**
 * Creates a new renderer instance
 */
export function createRenderer(canvas: HTMLCanvasElement): Renderer {
  return new Renderer(canvas);
}

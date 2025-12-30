/**
 * Canvas Renderer
 * Handles all visual rendering of the game board and pieces
 */
import { Piece, Position, Move, GhostPiece } from '../types.js';
/**
 * Canvas Renderer class
 */
export declare class Renderer {
    private _canvas;
    private _ctx;
    private _config;
    private _animationFrame;
    private _board;
    private _selectedPiece;
    private _validMoves;
    private _ghostPieces;
    private _glowingPiece;
    private _glowStartTime;
    private _moveTraces;
    private _animatingPiece;
    private _animationFrom;
    private _animationTo;
    private _animationProgress;
    private _animationStartTime;
    private _animationDuration;
    private _onAnimationComplete;
    constructor(canvas: HTMLCanvasElement);
    /**
     * Sets up canvas for high DPI displays
     */
    private _setupHighDPI;
    /**
     * Resizes the canvas (call on window resize)
     */
    resize(): void;
    /**
     * Updates the board state
     */
    setBoard(board: (Piece | null)[][]): void;
    /**
     * Sets the selected piece and valid moves
     */
    setSelection(piece: Piece | null, validMoves: Move[]): void;
    /**
     * Sets ghost pieces for precog overlay
     */
    setGhostPieces(ghosts: GhostPiece[]): void;
    /**
     * Clears ghost pieces
     */
    clearGhostPieces(): void;
    /**
     * Adds a move trace with full path (for multi-jumps)
     * @param from Starting position
     * @param to Ending position
     * @param captures Array of captured piece positions (used to reconstruct path)
     */
    addMoveTrace(from: Position, to: Position, captures?: Position[]): void;
    /**
     * Clears all move traces
     */
    clearMoveTraces(): void;
    /**
     * Starts the glow animation for a piece (timed)
     */
    startGlow(piece: Piece, duration?: number): Promise<void>;
    /**
     * Starts continuous glow animation (must call stopGlow to end)
     */
    startContinuousGlow(piece: Piece): void;
    /**
     * Runs the continuous glow animation loop
     */
    private _runContinuousGlow;
    /**
     * Stops the glow animation
     */
    stopGlow(): void;
    /**
     * Animates a piece moving from one position to another
     */
    animateMove(piece: Piece, from: Position, to: Position, duration?: number): Promise<void>;
    /**
     * Animates a piece through multiple positions (for multi-jump captures)
     * @param piece The piece to animate
     * @param path Array of positions to animate through (including start)
     * @param durationPerHop Duration for each hop in milliseconds
     */
    animateMultiJump(piece: Piece, path: Position[], durationPerHop?: number): Promise<void>;
    /**
     * Starts the animation loop
     */
    private _startAnimationLoop;
    /**
     * Main render function
     */
    render(): void;
    /**
     * Draws the checker board
     */
    private _drawBoard;
    /**
     * Draws move traces (history lines)
     */
    private _drawMoveTraces;
    /**
     * Draws valid move indicators
     */
    private _drawValidMoveIndicators;
    /**
     * Draws ghost pieces for precog predictions
     */
    private _drawGhostPieces;
    /**
     * Draws all pieces on the board
     */
    private _drawPieces;
    /**
     * Draws a single piece
     */
    private _drawPiece;
    /**
     * Draws a crown for king pieces
     */
    private _drawCrown;
    /**
     * Draws selection highlight around selected piece
     */
    private _drawSelectionHighlight;
    /**
     * Gets the board position from screen coordinates
     */
    getPositionFromCoords(screenX: number, screenY: number): Position | null;
    /**
     * Lightens a hex color
     */
    private _lightenColor;
    /**
     * Darkens a hex color
     */
    private _darkenColor;
}
/**
 * Creates a new renderer instance
 */
export declare function createRenderer(canvas: HTMLCanvasElement): Renderer;
//# sourceMappingURL=renderer.d.ts.map
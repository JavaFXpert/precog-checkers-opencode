/**
 * Game Rules - American Checkers
 * Move validation, captures, and multi-jump logic
 */
import { Piece, Player, Move } from '../types.js';
/**
 * Gets all valid moves for a specific piece
 * In American checkers, if any capture is available, player MUST capture
 */
export declare function getValidMovesForPiece(board: (Piece | null)[][], piece: Piece): Move[];
/**
 * Gets all valid moves for a player
 */
export declare function getAllValidMoves(board: (Piece | null)[][], player: Player): Move[];
/**
 * Checks if a specific move is valid
 */
export declare function isValidMove(board: (Piece | null)[][], piece: Piece, move: Move): boolean;
/**
 * Executes a move on the board (modifies the board in place)
 * Returns true if successful
 */
export declare function executeMove(board: (Piece | null)[][], move: Move): boolean;
/**
 * Checks if the player has any captures available
 */
export declare function hasCaptures(board: (Piece | null)[][], player: Player): boolean;
/**
 * Checks if a player has any valid moves
 */
export declare function hasValidMoves(board: (Piece | null)[][], player: Player): boolean;
/**
 * Gets the number of captures in a move (for display)
 */
export declare function getCaptureCount(move: Move): number;
/**
 * Checks if a move is a capture
 */
export declare function isCapture(move: Move): boolean;
/**
 * Simulates a move and returns the resulting board
 * Does not modify the original board
 */
export declare function simulateMove(board: (Piece | null)[][], move: Move): (Piece | null)[][];
//# sourceMappingURL=rules.d.ts.map
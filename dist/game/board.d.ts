/**
 * Board State Management
 * Handles the checkers board representation and piece management
 */
import { Piece, Player, Position } from '../types.js';
/**
 * Creates the initial board setup with pieces in starting positions
 * Human (red) pieces on bottom 3 rows, Agatha (white) pieces on top 3 rows
 */
export declare function createInitialBoard(): (Piece | null)[][];
/**
 * Creates a deep copy of the board
 */
export declare function cloneBoard(board: (Piece | null)[][]): (Piece | null)[][];
/**
 * Gets the piece at a given position
 */
export declare function getPieceAt(board: (Piece | null)[][], pos: Position): Piece | null;
/**
 * Sets a piece at a given position
 */
export declare function setPieceAt(board: (Piece | null)[][], pos: Position, piece: Piece | null): void;
/**
 * Removes a piece from the board
 */
export declare function removePieceAt(board: (Piece | null)[][], pos: Position): Piece | null;
/**
 * Moves a piece from one position to another
 * Returns the moved piece (with updated position) or null if move failed
 */
export declare function movePiece(board: (Piece | null)[][], from: Position, to: Position): Piece | null;
/**
 * Checks if a piece should be promoted to king
 */
export declare function shouldPromote(piece: Piece, position: Position): boolean;
/**
 * Gets all pieces belonging to a player
 */
export declare function getPlayerPieces(board: (Piece | null)[][], player: Player): Piece[];
/**
 * Counts pieces for a player
 */
export declare function countPieces(board: (Piece | null)[][], player: Player): number;
/**
 * Counts kings for a player
 */
export declare function countKings(board: (Piece | null)[][], player: Player): number;
/**
 * Gets the opponent player
 */
export declare function getOpponent(player: Player): Player;
/**
 * Gets the forward direction for a player
 * Human moves up (negative row), Agatha moves down (positive row)
 */
export declare function getForwardDirection(player: Player): number;
/**
 * Converts board position to algebraic notation (e.g., "e3")
 */
export declare function positionToNotation(pos: Position): string;
/**
 * Converts algebraic notation to board position
 */
export declare function notationToPosition(notation: string): Position | null;
/**
 * Formats a move for display in history
 */
export declare function formatMove(from: Position, to: Position, captured: boolean): string;
/**
 * Creates a string representation of the board (for debugging)
 */
export declare function boardToString(board: (Piece | null)[][]): string;
/**
 * Validates board integrity
 */
export declare function validateBoard(board: (Piece | null)[][]): boolean;
//# sourceMappingURL=board.d.ts.map
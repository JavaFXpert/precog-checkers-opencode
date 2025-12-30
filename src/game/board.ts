/**
 * Board State Management
 * Handles the checkers board representation and piece management
 */

import {
  Piece,
  Player,
  PieceType,
  Position,
  BOARD_SIZE,
  INITIAL_PIECE_COUNT,
  isPlayableSquare,
  isValidPosition,
  positionsEqual,
} from '../types.js';

/**
 * Creates the initial board setup with pieces in starting positions
 * Human (red) pieces on bottom 3 rows, Agatha (white) pieces on top 3 rows
 */
export function createInitialBoard(): (Piece | null)[][] {
  const board: (Piece | null)[][] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    board[row] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (isPlayableSquare(row, col)) {
        // Agatha's pieces on top 3 rows (rows 0-2)
        if (row < 3) {
          board[row][col] = {
            player: 'agatha',
            type: 'man',
            position: { row, col },
          };
        }
        // Human's pieces on bottom 3 rows (rows 5-7)
        else if (row > 4) {
          board[row][col] = {
            player: 'human',
            type: 'man',
            position: { row, col },
          };
        }
        // Empty middle rows
        else {
          board[row][col] = null;
        }
      } else {
        // Non-playable squares (light squares) are always null
        board[row][col] = null;
      }
    }
  }

  return board;
}

/**
 * Creates a deep copy of the board
 */
export function cloneBoard(board: (Piece | null)[][]): (Piece | null)[][] {
  return board.map(row =>
    row.map(cell =>
      cell
        ? {
            player: cell.player,
            type: cell.type,
            position: { row: cell.position.row, col: cell.position.col },
          }
        : null
    )
  );
}

/**
 * Gets the piece at a given position
 */
export function getPieceAt(
  board: (Piece | null)[][],
  pos: Position
): Piece | null {
  if (!isValidPosition(pos)) {
    return null;
  }
  return board[pos.row][pos.col];
}

/**
 * Sets a piece at a given position
 */
export function setPieceAt(
  board: (Piece | null)[][],
  pos: Position,
  piece: Piece | null
): void {
  if (isValidPosition(pos)) {
    board[pos.row][pos.col] = piece;
    if (piece) {
      piece.position = { row: pos.row, col: pos.col };
    }
  }
}

/**
 * Removes a piece from the board
 */
export function removePieceAt(
  board: (Piece | null)[][],
  pos: Position
): Piece | null {
  const piece = getPieceAt(board, pos);
  if (piece) {
    board[pos.row][pos.col] = null;
  }
  return piece;
}

/**
 * Moves a piece from one position to another
 * Returns the moved piece (with updated position) or null if move failed
 */
export function movePiece(
  board: (Piece | null)[][],
  from: Position,
  to: Position
): Piece | null {
  const piece = getPieceAt(board, from);
  if (!piece) {
    return null;
  }

  // Remove from old position
  board[from.row][from.col] = null;

  // Update piece position
  piece.position = { row: to.row, col: to.col };

  // Check for promotion
  if (shouldPromote(piece, to)) {
    piece.type = 'king';
  }

  // Place at new position
  board[to.row][to.col] = piece;

  return piece;
}

/**
 * Checks if a piece should be promoted to king
 */
export function shouldPromote(piece: Piece, position: Position): boolean {
  if (piece.type === 'king') {
    return false;
  }

  // Human promotes at row 0 (top), Agatha promotes at row 7 (bottom)
  if (piece.player === 'human' && position.row === 0) {
    return true;
  }
  if (piece.player === 'agatha' && position.row === BOARD_SIZE - 1) {
    return true;
  }

  return false;
}

/**
 * Gets all pieces belonging to a player
 */
export function getPlayerPieces(
  board: (Piece | null)[][],
  player: Player
): Piece[] {
  const pieces: Piece[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece && piece.player === player) {
        pieces.push(piece);
      }
    }
  }

  return pieces;
}

/**
 * Counts pieces for a player
 */
export function countPieces(
  board: (Piece | null)[][],
  player: Player
): number {
  return getPlayerPieces(board, player).length;
}

/**
 * Counts kings for a player
 */
export function countKings(
  board: (Piece | null)[][],
  player: Player
): number {
  return getPlayerPieces(board, player).filter(p => p.type === 'king').length;
}

/**
 * Gets the opponent player
 */
export function getOpponent(player: Player): Player {
  return player === 'human' ? 'agatha' : 'human';
}

/**
 * Gets the forward direction for a player
 * Human moves up (negative row), Agatha moves down (positive row)
 */
export function getForwardDirection(player: Player): number {
  return player === 'human' ? -1 : 1;
}

/**
 * Converts board position to algebraic notation (e.g., "e3")
 */
export function positionToNotation(pos: Position): string {
  const col = String.fromCharCode(97 + pos.col); // 'a' to 'h'
  const row = BOARD_SIZE - pos.row; // 1 to 8 (bottom to top)
  return `${col}${row}`;
}

/**
 * Converts algebraic notation to board position
 */
export function notationToPosition(notation: string): Position | null {
  if (notation.length !== 2) {
    return null;
  }

  const col = notation.charCodeAt(0) - 97; // 'a' = 0
  const row = BOARD_SIZE - parseInt(notation[1], 10);

  const pos = { row, col };
  return isValidPosition(pos) ? pos : null;
}

/**
 * Formats a move for display in history
 */
export function formatMove(
  from: Position,
  to: Position,
  captured: boolean
): string {
  const fromNotation = positionToNotation(from);
  const toNotation = positionToNotation(to);
  const separator = captured ? ' x ' : ' -> ';
  return `${fromNotation}${separator}${toNotation}`;
}

/**
 * Creates a string representation of the board (for debugging)
 */
export function boardToString(board: (Piece | null)[][]): string {
  let result = '  a b c d e f g h\n';

  for (let row = 0; row < BOARD_SIZE; row++) {
    result += `${BOARD_SIZE - row} `;
    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];
      if (piece) {
        if (piece.player === 'human') {
          result += piece.type === 'king' ? 'R ' : 'r ';
        } else {
          result += piece.type === 'king' ? 'W ' : 'w ';
        }
      } else if (isPlayableSquare(row, col)) {
        result += '. ';
      } else {
        result += '  ';
      }
    }
    result += `${BOARD_SIZE - row}\n`;
  }

  result += '  a b c d e f g h';
  return result;
}

/**
 * Validates board integrity
 */
export function validateBoard(board: (Piece | null)[][]): boolean {
  if (board.length !== BOARD_SIZE) {
    return false;
  }

  for (let row = 0; row < BOARD_SIZE; row++) {
    if (board[row].length !== BOARD_SIZE) {
      return false;
    }

    for (let col = 0; col < BOARD_SIZE; col++) {
      const piece = board[row][col];

      // Non-playable squares must be empty
      if (!isPlayableSquare(row, col) && piece !== null) {
        return false;
      }

      // Verify piece position matches its location
      if (piece && !positionsEqual(piece.position, { row, col })) {
        return false;
      }
    }
  }

  return true;
}

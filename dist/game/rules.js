/**
 * Game Rules - American Checkers
 * Move validation, captures, and multi-jump logic
 */
import { BOARD_SIZE, isValidPosition, positionsEqual, } from '../types.js';
import { getPieceAt, getOpponent, getForwardDirection, cloneBoard, movePiece, removePieceAt, shouldPromote, } from './board.js';
const ALL_DIRECTIONS = [
    { rowDelta: -1, colDelta: -1 }, // Up-left
    { rowDelta: -1, colDelta: 1 }, // Up-right
    { rowDelta: 1, colDelta: -1 }, // Down-left
    { rowDelta: 1, colDelta: 1 }, // Down-right
];
/**
 * Gets valid movement directions for a piece
 * Men can only move forward, kings can move in all directions
 */
function getValidDirections(piece) {
    if (piece.type === 'king') {
        return ALL_DIRECTIONS;
    }
    const forward = getForwardDirection(piece.player);
    return ALL_DIRECTIONS.filter(dir => dir.rowDelta === forward);
}
/**
 * Gets all simple (non-capture) moves for a piece
 */
function getSimpleMoves(board, piece) {
    const moves = [];
    const directions = getValidDirections(piece);
    for (const dir of directions) {
        const to = {
            row: piece.position.row + dir.rowDelta,
            col: piece.position.col + dir.colDelta,
        };
        if (isValidPosition(to) && getPieceAt(board, to) === null) {
            moves.push({
                from: piece.position,
                to,
                captures: [],
                isPromotion: shouldPromote(piece, to),
            });
        }
    }
    return moves;
}
/**
 * Gets all capture moves for a piece (single jump)
 * Men can only capture FORWARD, kings can capture in all directions
 */
function getSingleCaptures(board, piece) {
    const moves = [];
    const opponent = getOpponent(piece.player);
    // Verify piece position matches where it is on the board
    const actualPiece = getPieceAt(board, piece.position);
    if (!actualPiece || actualPiece.player !== piece.player) {
        console.warn('Piece position mismatch in getSingleCaptures', {
            piecePos: piece.position,
            actualPiece,
        });
        return moves;
    }
    // Get valid directions for this piece
    // Men can only capture forward, kings can capture in all directions
    const validDirections = getValidDirections(piece);
    for (const dir of validDirections) {
        const jumpedPos = {
            row: piece.position.row + dir.rowDelta,
            col: piece.position.col + dir.colDelta,
        };
        const landingPos = {
            row: piece.position.row + 2 * dir.rowDelta,
            col: piece.position.col + 2 * dir.colDelta,
        };
        if (!isValidPosition(jumpedPos) || !isValidPosition(landingPos)) {
            continue;
        }
        const jumpedPiece = getPieceAt(board, jumpedPos);
        const landingSquare = getPieceAt(board, landingPos);
        // Must jump over opponent piece and land on empty square
        if (jumpedPiece &&
            jumpedPiece.player === opponent &&
            landingSquare === null) {
            moves.push({
                from: piece.position,
                to: landingPos,
                captures: [jumpedPos],
                isPromotion: shouldPromote(piece, landingPos),
            });
        }
    }
    return moves;
}
/**
 * Recursively finds all multi-jump sequences for a piece
 */
function findMultiJumps(board, piece, currentCaptures, startPosition) {
    const moves = [];
    // Get captures from current position
    const singleCaptures = getSingleCaptures(board, piece);
    if (singleCaptures.length === 0) {
        // No more captures available - this is the end of the sequence
        if (currentCaptures.length > 0) {
            moves.push({
                from: startPosition,
                to: piece.position,
                captures: [...currentCaptures],
                isPromotion: shouldPromote(piece, piece.position),
            });
        }
    }
    else {
        // Continue each capture chain
        for (const capture of singleCaptures) {
            // Check if we've already captured this piece
            if (currentCaptures.some(pos => positionsEqual(pos, capture.captures[0]))) {
                continue;
            }
            // Simulate the capture
            const newBoard = cloneBoard(board);
            const movedPiece = movePiece(newBoard, piece.position, capture.to);
            removePieceAt(newBoard, capture.captures[0]);
            if (movedPiece) {
                // Check for promotion - in American checkers, piece is promoted
                // immediately and stops jumping (unless king can continue)
                const wasPromoted = movedPiece.type === 'king' && piece.type === 'man';
                if (wasPromoted) {
                    // Promoted during jump - must stop
                    moves.push({
                        from: startPosition,
                        to: capture.to,
                        captures: [...currentCaptures, capture.captures[0]],
                        isPromotion: true,
                    });
                }
                else {
                    // Continue looking for more jumps
                    const continuations = findMultiJumps(newBoard, movedPiece, [...currentCaptures, capture.captures[0]], startPosition);
                    if (continuations.length > 0) {
                        moves.push(...continuations);
                    }
                    else {
                        // No more jumps possible
                        moves.push({
                            from: startPosition,
                            to: capture.to,
                            captures: [...currentCaptures, capture.captures[0]],
                            isPromotion: capture.isPromotion,
                        });
                    }
                }
            }
        }
    }
    return moves;
}
/**
 * Gets all capture moves for a piece, including multi-jumps
 */
function getCapturesForPiece(board, piece) {
    const singleCaptures = getSingleCaptures(board, piece);
    if (singleCaptures.length === 0) {
        return [];
    }
    const allCaptures = [];
    for (const capture of singleCaptures) {
        // Simulate the capture and look for continuations
        const newBoard = cloneBoard(board);
        const movedPiece = movePiece(newBoard, piece.position, capture.to);
        removePieceAt(newBoard, capture.captures[0]);
        if (movedPiece) {
            const wasPromoted = movedPiece.type === 'king' && piece.type === 'man';
            if (wasPromoted) {
                // Promoted during jump - must stop
                allCaptures.push({
                    from: piece.position,
                    to: capture.to,
                    captures: [capture.captures[0]],
                    isPromotion: true,
                });
            }
            else {
                // Look for multi-jumps
                const continuations = findMultiJumps(newBoard, movedPiece, [capture.captures[0]], piece.position);
                if (continuations.length > 0) {
                    allCaptures.push(...continuations);
                }
                else {
                    allCaptures.push(capture);
                }
            }
        }
    }
    return allCaptures;
}
/**
 * Gets all valid moves for a specific piece
 * In American checkers, if any capture is available, player MUST capture
 */
export function getValidMovesForPiece(board, piece) {
    // First check if ANY piece has a capture available
    const allCaptures = getAllCapturesForPlayer(board, piece.player);
    if (allCaptures.length > 0) {
        // Mandatory capture - only return captures for this piece
        return getCapturesForPiece(board, piece);
    }
    // No captures available - return simple moves
    return getSimpleMoves(board, piece);
}
/**
 * Gets all capture moves for all pieces of a player
 */
function getAllCapturesForPlayer(board, player) {
    const captures = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = board[row][col];
            if (piece && piece.player === player) {
                captures.push(...getCapturesForPiece(board, piece));
            }
        }
    }
    return captures;
}
/**
 * Gets all valid moves for a player
 */
export function getAllValidMoves(board, player) {
    // First check for mandatory captures
    const captures = getAllCapturesForPlayer(board, player);
    if (captures.length > 0) {
        return captures;
    }
    // No captures - get all simple moves
    const moves = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = board[row][col];
            if (piece && piece.player === player) {
                moves.push(...getSimpleMoves(board, piece));
            }
        }
    }
    return moves;
}
/**
 * Checks if a specific move is valid
 */
export function isValidMove(board, piece, move) {
    const validMoves = getValidMovesForPiece(board, piece);
    return validMoves.some(m => positionsEqual(m.from, move.from) &&
        positionsEqual(m.to, move.to));
}
/**
 * Validates that a move is geometrically legal (diagonal movement)
 */
function isGeometricallyValid(move) {
    const rowDiff = Math.abs(move.to.row - move.from.row);
    const colDiff = Math.abs(move.to.col - move.from.col);
    // For a simple move: 1 diagonal step
    // For a capture: 2 diagonal steps per capture
    // The total displacement should equal captures * 2 (for captures) or 1 (simple move)
    if (move.captures.length === 0) {
        // Simple move: must be exactly 1 diagonal
        return rowDiff === 1 && colDiff === 1;
    }
    // For multi-jumps, we need to verify each jump is diagonal
    // The final position should be reachable via the captures
    // Each capture represents a diagonal jump of 2
    // But they could be in different directions, so we can't just check total distance
    // Instead, verify row and col diffs are equal (diagonal) and reasonable
    // Maximum possible distance is 2 * number of captures
    const maxDist = 2 * move.captures.length;
    return rowDiff <= maxDist && colDiff <= maxDist && rowDiff % 2 === 0 && colDiff % 2 === 0;
}
/**
 * Executes a move on the board (modifies the board in place)
 * Returns true if successful
 */
export function executeMove(board, move) {
    const piece = getPieceAt(board, move.from);
    if (!piece) {
        return false;
    }
    // Validate move is geometrically legal
    if (!isGeometricallyValid(move)) {
        console.error('Invalid move detected!', {
            from: move.from,
            to: move.to,
            captures: move.captures,
            rowDiff: Math.abs(move.to.row - move.from.row),
            colDiff: Math.abs(move.to.col - move.from.col),
        });
        return false;
    }
    // Remove captured pieces
    for (const capturePos of move.captures) {
        removePieceAt(board, capturePos);
    }
    // Move the piece
    movePiece(board, move.from, move.to);
    return true;
}
/**
 * Checks if the player has any captures available
 */
export function hasCaptures(board, player) {
    return getAllCapturesForPlayer(board, player).length > 0;
}
/**
 * Checks if a player has any valid moves
 */
export function hasValidMoves(board, player) {
    return getAllValidMoves(board, player).length > 0;
}
/**
 * Gets the number of captures in a move (for display)
 */
export function getCaptureCount(move) {
    return move.captures.length;
}
/**
 * Checks if a move is a capture
 */
export function isCapture(move) {
    return move.captures.length > 0;
}
/**
 * Simulates a move and returns the resulting board
 * Does not modify the original board
 */
export function simulateMove(board, move) {
    const newBoard = cloneBoard(board);
    executeMove(newBoard, move);
    return newBoard;
}
//# sourceMappingURL=rules.js.map
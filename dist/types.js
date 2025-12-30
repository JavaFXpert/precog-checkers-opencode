/**
 * Precog Checkers - Type Definitions
 * Core types for the game state, pieces, moves, and UI
 */
// ============================================
// Constants
// ============================================
/** Board dimensions */
export const BOARD_SIZE = 8;
/** Initial piece count per player */
export const INITIAL_PIECE_COUNT = 12;
/** Minimax search depth (hard difficulty) */
export const AI_SEARCH_DEPTH = 8;
/** Animation durations in milliseconds */
export const ANIMATION_DURATION = {
    MOVE: 300,
    CAPTURE: 200,
    GLOW: 1000,
    PROMOTION: 500,
};
/** Default evaluation weights */
export const DEFAULT_WEIGHTS = {
    pieceValue: 100,
    kingValue: 150,
    centerControl: 10,
    advancement: 5,
    backRowDefense: 3,
    mobilityBonus: 2,
};
/** Theme colors matching CSS variables */
export const THEME_COLORS = {
    bgPrimary: '#0a0e17',
    bgSecondary: '#0d1520',
    bgTertiary: '#1a2a4a',
    accentPrimary: '#00d4ff',
    accentSecondary: '#ff6b35',
    accentGold: '#ffd700',
    pieceHuman: '#ff3a3a',
    pieceAgatha: '#e0e8ff',
    textPrimary: '#e0e8ff',
    textSecondary: '#7a8ba8',
};
/** Convert Position to string key */
export function positionToKey(pos) {
    return `${pos.row},${pos.col}`;
}
/** Convert string key back to Position */
export function keyToPosition(key) {
    const [row, col] = key.split(',').map(Number);
    return { row, col };
}
/** Check if two positions are equal */
export function positionsEqual(a, b) {
    return a.row === b.row && a.col === b.col;
}
/** Check if a position is within board bounds */
export function isValidPosition(pos) {
    return pos.row >= 0 && pos.row < BOARD_SIZE &&
        pos.col >= 0 && pos.col < BOARD_SIZE;
}
/** Check if a position is a playable dark square */
export function isPlayableSquare(row, col) {
    return (row + col) % 2 === 1;
}
//# sourceMappingURL=types.js.map
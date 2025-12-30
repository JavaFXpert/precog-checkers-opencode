/**
 * Precog Checkers - Type Definitions
 * Core types for the game state, pieces, moves, and UI
 */
/** The two players in the game */
export type Player = 'human' | 'agatha';
/** Type of checker piece */
export type PieceType = 'man' | 'king';
/** Position on the board (0-indexed) */
export interface Position {
    readonly row: number;
    readonly col: number;
}
/** A checker piece */
export interface Piece {
    readonly player: Player;
    type: PieceType;
    position: Position;
}
/** A single move from one position to another */
export interface Move {
    readonly from: Position;
    readonly to: Position;
    readonly captures: Position[];
    readonly isPromotion: boolean;
}
/** Sequence of moves for multi-jump */
export interface MoveSequence {
    readonly moves: Move[];
    readonly piece: Piece;
}
/** Current state of the game */
export type GameStatus = 'playing' | 'human_wins' | 'agatha_wins' | 'draw';
/** Complete game state */
export interface GameState {
    readonly board: (Piece | null)[][];
    currentPlayer: Player;
    status: GameStatus;
    selectedPiece: Piece | null;
    validMoves: Move[];
    moveHistory: MoveRecord[];
    humanPieceCount: number;
    agathaPieceCount: number;
}
/** Record of a move for history */
export interface MoveRecord {
    readonly moveNumber: number;
    readonly player: Player;
    readonly from: Position;
    readonly to: Position;
    readonly captured: boolean;
    readonly promoted: boolean;
}
/** Result of minimax evaluation */
export interface MinimaxResult {
    readonly score: number;
    readonly move: Move | null;
}
/** Evaluation weights for the AI */
export interface EvaluationWeights {
    readonly pieceValue: number;
    readonly kingValue: number;
    readonly centerControl: number;
    readonly advancement: number;
    readonly backRowDefense: number;
    readonly mobilityBonus: number;
}
/** Precog prediction for ghost overlay */
export interface PrecogPrediction {
    readonly humanMove: Move;
    readonly agathaResponse: Move | null;
    readonly score: number;
}
/** Visual theme colors */
export interface ThemeColors {
    readonly bgPrimary: string;
    readonly bgSecondary: string;
    readonly bgTertiary: string;
    readonly accentPrimary: string;
    readonly accentSecondary: string;
    readonly accentGold: string;
    readonly pieceHuman: string;
    readonly pieceAgatha: string;
    readonly textPrimary: string;
    readonly textSecondary: string;
}
/** Canvas rendering configuration */
export interface RenderConfig {
    readonly cellSize: number;
    readonly boardSize: number;
    readonly pieceRadius: number;
    readonly colors: ThemeColors;
}
/** Animation state for a piece */
export interface PieceAnimation {
    readonly piece: Piece;
    readonly fromX: number;
    readonly fromY: number;
    readonly toX: number;
    readonly toY: number;
    readonly startTime: number;
    readonly duration: number;
    type: 'move' | 'capture' | 'glow';
}
/** Ghost piece for precog overlay */
export interface GhostPiece {
    readonly position: Position;
    readonly player: Player;
    readonly type: PieceType;
    readonly opacity: number;
}
/** Click/touch event data */
export interface BoardClickEvent {
    readonly row: number;
    readonly col: number;
    readonly screenX: number;
    readonly screenY: number;
}
/** Available sound effects */
export type SoundEffect = 'select' | 'move' | 'capture' | 'promotion' | 'win' | 'lose';
/** Sound system configuration */
export interface SoundConfig {
    enabled: boolean;
    volume: number;
}
/** Board dimensions */
export declare const BOARD_SIZE = 8;
/** Initial piece count per player */
export declare const INITIAL_PIECE_COUNT = 12;
/** Minimax search depth (hard difficulty) */
export declare const AI_SEARCH_DEPTH = 8;
/** Animation durations in milliseconds */
export declare const ANIMATION_DURATION: {
    readonly MOVE: 300;
    readonly CAPTURE: 200;
    readonly GLOW: 1000;
    readonly PROMOTION: 500;
};
/** Default evaluation weights */
export declare const DEFAULT_WEIGHTS: EvaluationWeights;
/** Theme colors matching CSS variables */
export declare const THEME_COLORS: ThemeColors;
/** Deep readonly type */
export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
/** Position key for Map/Set usage */
export type PositionKey = `${number},${number}`;
/** Convert Position to string key */
export declare function positionToKey(pos: Position): PositionKey;
/** Convert string key back to Position */
export declare function keyToPosition(key: PositionKey): Position;
/** Check if two positions are equal */
export declare function positionsEqual(a: Position, b: Position): boolean;
/** Check if a position is within board bounds */
export declare function isValidPosition(pos: Position): boolean;
/** Check if a position is a playable dark square */
export declare function isPlayableSquare(row: number, col: number): boolean;
//# sourceMappingURL=types.d.ts.map
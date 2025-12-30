/**
 * Precog System
 * Generates predictions for the ghost piece overlay
 */
import { Piece, Move, GhostPiece, PrecogPrediction } from '../types.js';
/**
 * Gets predictions for all valid moves of a piece
 * Shows where Agatha would likely respond
 */
export declare function getPrecogPredictions(board: (Piece | null)[][], validMoves: Move[]): PrecogPrediction[];
/**
 * Converts predictions to ghost pieces for rendering
 */
export declare function predictionsToGhosts(board: (Piece | null)[][], predictions: PrecogPrediction[]): GhostPiece[];
/**
 * Gets a single prediction for a specific move
 */
export declare function getPredictionForMove(board: (Piece | null)[][], move: Move): PrecogPrediction;
/**
 * Gets ghost pieces showing where the human's piece would end up
 * and where Agatha would respond
 */
export declare function getGhostsForSelection(board: (Piece | null)[][], selectedPiece: Piece, validMoves: Move[]): GhostPiece[];
/**
 * Determines if a move is "dangerous" (leads to piece loss)
 */
export declare function isMoveDangerous(board: (Piece | null)[][], move: Move): boolean;
/**
 * Gets the best move suggestion for the human player
 */
export declare function getBestMoveForHuman(board: (Piece | null)[][], validMoves: Move[]): Move | null;
/**
 * Analyzes a position and returns strategic insights
 */
export declare function analyzePosition(board: (Piece | null)[][], player: 'human' | 'agatha'): {
    bestMove: Move | null;
    threatLevel: 'low' | 'medium' | 'high';
    opportunities: Move[];
};
//# sourceMappingURL=precog.d.ts.map
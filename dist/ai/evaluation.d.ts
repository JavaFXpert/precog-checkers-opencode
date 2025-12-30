/**
 * Board Evaluation Function
 * Scores board positions for the minimax algorithm
 */
import { Piece, Player, EvaluationWeights } from '../types.js';
/**
 * Evaluates the board from Agatha's perspective
 * Positive scores favor Agatha, negative favor human
 */
export declare function evaluateBoard(board: (Piece | null)[][], weights?: EvaluationWeights): number;
/**
 * Evaluates end-game scenarios
 * Returns very high/low scores for winning/losing positions
 */
export declare function evaluateEndGame(board: (Piece | null)[][], player: Player): number | null;
/**
 * Calculates material advantage
 * Simple piece count difference weighted by piece type
 */
export declare function getMaterialAdvantage(board: (Piece | null)[][], player: Player): number;
/**
 * Determines if this is an end-game situation
 * (few pieces remaining, requiring different strategy)
 */
export declare function isEndGame(board: (Piece | null)[][]): boolean;
/**
 * Evaluates king safety (distance from opponent pieces)
 */
export declare function evaluateKingSafety(board: (Piece | null)[][], player: Player): number;
/**
 * Detailed position evaluation breakdown
 * Returns component scores for material, position, and mobility
 */
export interface DetailedEvaluation {
    totalScore: number;
    materialScore: number;
    positionalScore: number;
    mobilityScore: number;
    agathaMen: number;
    agathaKings: number;
    humanMen: number;
    humanKings: number;
}
export declare function getDetailedEvaluation(board: (Piece | null)[][], weights?: EvaluationWeights): DetailedEvaluation;
//# sourceMappingURL=evaluation.d.ts.map
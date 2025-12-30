/**
 * Agatha's Thoughts - LLM-powered commentary
 * Generates strategic observations and trash talk
 */
import { Piece, Move } from '../types.js';
/**
 * Game context for generating commentary
 */
interface GameContext {
    humanPieces: number;
    agathaPieces: number;
    lastHumanMove: Move | null;
    agathaMove: Move | null;
    moveNumber: number;
    isCapture: boolean;
    isMultiCapture: boolean;
    humanKings: number;
    agathaKings: number;
    isEndgame: boolean;
}
/**
 * Generates Agatha's commentary using an LLM
 */
export declare function generateAgathaThought(context: GameContext, apiKey: string | null): Promise<string>;
/**
 * Builds context from game state
 */
export declare function buildGameContext(board: (Piece | null)[][], lastHumanMove: Move | null, agathaMove: Move | null, moveNumber: number): GameContext;
export {};
//# sourceMappingURL=agatha-thoughts.d.ts.map
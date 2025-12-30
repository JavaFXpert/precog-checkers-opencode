/**
 * Agatha's Thoughts - LLM-powered commentary
 * Generates strategic observations and trash talk
 */
import { Piece, Move } from '../types.js';
/**
 * AI strategy metrics from minimax search
 */
export interface AIMetrics {
    positionsEvaluated: number;
    searchDepth: number;
    moveScore: number;
    availableMoves: number;
}
/**
 * Game context for generating commentary
 */
export interface GameContext {
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
    aiMetrics: AIMetrics | null;
}
/** Message in conversation history */
export interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}
/**
 * Generates Agatha's commentary using an LLM
 */
export declare function generateAgathaThought(context: GameContext, apiKey: string | null, conversationHistory?: ConversationMessage[]): Promise<string>;
/**
 * Generates Agatha's reply to a human message
 */
export declare function generateAgathaReply(humanMessage: string, apiKey: string | null, conversationHistory?: ConversationMessage[]): Promise<string>;
/**
 * Builds context from game state
 */
export declare function buildGameContext(board: (Piece | null)[][], lastHumanMove: Move | null, agathaMove: Move | null, moveNumber: number, aiMetrics?: AIMetrics | null): GameContext;
//# sourceMappingURL=agatha-thoughts.d.ts.map
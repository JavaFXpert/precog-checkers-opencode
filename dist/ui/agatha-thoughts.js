/**
 * Agatha's Thoughts - LLM-powered commentary
 * Generates strategic observations and trash talk
 */
import { BOARD_SIZE } from '../types.js';
import { positionToNotation } from '../game/board.js';
/**
 * Generates Agatha's commentary using an LLM
 */
export async function generateAgathaThought(context, apiKey) {
    // If no API key, use local fallback
    if (!apiKey) {
        return generateLocalThought(context);
    }
    try {
        const prompt = buildPrompt(context);
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true',
            },
            body: JSON.stringify({
                model: 'claude-haiku-4-20250414',
                max_tokens: 150,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            }),
        });
        if (!response.ok) {
            console.warn('LLM API error, using fallback:', response.status);
            return generateLocalThought(context);
        }
        const data = await response.json();
        const thought = data.content?.[0]?.text || generateLocalThought(context);
        return thought.trim();
    }
    catch (error) {
        console.warn('LLM API error, using fallback:', error);
        return generateLocalThought(context);
    }
}
/**
 * Builds the prompt for the LLM
 */
function buildPrompt(context) {
    const { humanPieces, agathaPieces, lastHumanMove, agathaMove, moveNumber, isCapture, isMultiCapture, humanKings, agathaKings, isEndgame, } = context;
    const humanMoveFrom = lastHumanMove ? positionToNotation(lastHumanMove.from) : '';
    const humanMoveTo = lastHumanMove ? positionToNotation(lastHumanMove.to) : '';
    const humanCaptured = lastHumanMove && lastHumanMove.captures.length > 0;
    const humanCaptureCount = lastHumanMove ? lastHumanMove.captures.length : 0;
    const agathaMoveFrom = agathaMove ? positionToNotation(agathaMove.from) : '';
    const agathaMoveTo = agathaMove ? positionToNotation(agathaMove.to) : '';
    const agathaCaptureCount = agathaMove ? agathaMove.captures.length : 0;
    return `You are Agatha, a precognitive AI from Minority Report playing checkers. You see the future.

SPECIFIC MOVES THIS TURN:
- Human just moved their piece from ${humanMoveFrom} to ${humanMoveTo}${humanCaptured ? `, capturing ${humanCaptureCount} of your piece(s)` : ''}
- You are responding by moving from ${agathaMoveFrom} to ${agathaMoveTo}${agathaCaptureCount > 0 ? `, capturing ${agathaCaptureCount} of their piece(s)` : ''}

GAME STATE:
- Move #${moveNumber}
- Your pieces: ${agathaPieces} (${agathaKings} kings) | Human's pieces: ${humanPieces} (${humanKings} kings)
- Endgame: ${isEndgame ? 'yes, few pieces left' : 'no'}

Write 1-2 SHORT sentences as Agatha commenting on:
1. The human's specific move (${humanMoveFrom} to ${humanMoveTo}) - was it good/bad/predictable?
2. Your specific counter-move (${agathaMoveFrom} to ${agathaMoveTo}) - why it's brilliant

Be mysterious, reference visions/futures, include trash talk. Mention the actual square names.
Respond with ONLY the thought, no quotes.`;
}
/**
 * Local fallback when API is unavailable
 */
function generateLocalThought(context) {
    const { humanPieces, agathaPieces, lastHumanMove, agathaMove, isCapture, isMultiCapture, moveNumber, isEndgame, } = context;
    const humanFrom = lastHumanMove ? positionToNotation(lastHumanMove.from) : '?';
    const humanTo = lastHumanMove ? positionToNotation(lastHumanMove.to) : '?';
    const agathaFrom = agathaMove ? positionToNotation(agathaMove.from) : '?';
    const agathaTo = agathaMove ? positionToNotation(agathaMove.to) : '?';
    const agathaCaptureCount = agathaMove ? agathaMove.captures.length : 0;
    const thoughts = [];
    // Capture-related thoughts with specific moves
    if (isMultiCapture) {
        thoughts.push(`Your move to ${humanTo} was brave. My ${agathaFrom} to ${agathaTo} captures ${agathaCaptureCount} pieces - exactly as I foresaw.`, `${humanFrom} to ${humanTo}? I saw that coming. Now watch ${agathaCaptureCount} of your pieces vanish.`, `A double capture from ${agathaFrom}. I saw this chain three moves ago when you moved to ${humanTo}.`);
    }
    else if (isCapture) {
        thoughts.push(`${humanFrom} to ${humanTo}... predictable. My piece at ${agathaFrom} was destined to take yours.`, `I saw your move to ${humanTo} and its consequence: my capture from ${agathaFrom} to ${agathaTo}.`, `Your piece at ${humanTo} lasted exactly as long as my visions predicted. ${agathaFrom} to ${agathaTo}.`, `The moment you chose ${humanTo}, I knew ${agathaFrom} would strike.`);
    }
    // Non-capture moves with specifics
    if (!isCapture) {
        thoughts.push(`${humanFrom} to ${humanTo}? Interesting. My ${agathaFrom} to ${agathaTo} sets up what comes next.`, `Your ${humanTo} placement was adequate. ${agathaFrom} to ${agathaTo} positions me for victory.`, `I foresaw your move to ${humanTo}. My response from ${agathaFrom} begins your downfall.`, `${humanTo} - one of three moves I predicted. ${agathaFrom} to ${agathaTo} is my optimal counter.`);
    }
    // Advantage-based thoughts
    if (agathaPieces > humanPieces + 2) {
        thoughts.push(`Down to ${humanPieces} pieces now. The visions of your defeat sharpen with each move.`, `${agathaPieces} to ${humanPieces}. The future I've seen draws closer.`);
    }
    else if (humanPieces > agathaPieces + 2) {
        thoughts.push(`You have ${humanPieces} pieces to my ${agathaPieces}. Numbers mean nothing to one who sees the future.`, `A temporary advantage. My visions show how ${agathaTo} changes everything.`);
    }
    // Endgame
    if (isEndgame) {
        thoughts.push(`Few pieces remain. Every square matters now. ${agathaTo} is precisely where I need to be.`, `The endgame crystallizes. From ${agathaFrom} to ${agathaTo}, I see the final moves.`);
    }
    // Pick a random thought
    return thoughts[Math.floor(Math.random() * thoughts.length)];
}
/**
 * Builds context from game state
 */
export function buildGameContext(board, lastHumanMove, agathaMove, moveNumber) {
    let humanPieces = 0;
    let agathaPieces = 0;
    let humanKings = 0;
    let agathaKings = 0;
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const piece = board[row]?.[col];
            if (piece) {
                if (piece.player === 'human') {
                    humanPieces++;
                    if (piece.type === 'king')
                        humanKings++;
                }
                else {
                    agathaPieces++;
                    if (piece.type === 'king')
                        agathaKings++;
                }
            }
        }
    }
    const isCapture = agathaMove ? agathaMove.captures.length > 0 : false;
    const isMultiCapture = agathaMove ? agathaMove.captures.length > 1 : false;
    const isEndgame = humanPieces + agathaPieces <= 8;
    return {
        humanPieces,
        agathaPieces,
        lastHumanMove,
        agathaMove,
        moveNumber,
        isCapture,
        isMultiCapture,
        humanKings,
        agathaKings,
        isEndgame,
    };
}
//# sourceMappingURL=agatha-thoughts.js.map
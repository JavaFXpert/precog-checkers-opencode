/**
 * Agatha's Thoughts - LLM-powered commentary
 * Generates strategic observations and trash talk
 */

import { Piece, Player, Move, Position, BOARD_SIZE } from '../types.js';
import { positionToNotation, countPieces } from '../game/board.js';

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

/** Message in conversation history */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Generates Agatha's commentary using an LLM
 */
export async function generateAgathaThought(
  context: GameContext,
  apiKey: string | null,
  conversationHistory: ConversationMessage[] = []
): Promise<string> {
  // If no API key, use local fallback
  if (!apiKey) {
    return generateLocalThought(context);
  }

  try {
    const systemPrompt = buildSystemPrompt();
    const userMessage = buildGameStateMessage(context);
    
    // Build messages array with conversation history
    const messages: ConversationMessage[] = [
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        system: systemPrompt,
        messages: messages,
      }),
    });

    if (!response.ok) {
      console.warn('LLM API error, using fallback:', response.status);
      return generateLocalThought(context);
    }

    const data = await response.json();
    const thought = data.content?.[0]?.text || generateLocalThought(context);
    return thought.trim();
  } catch (error) {
    console.warn('LLM API error, using fallback:', error);
    return generateLocalThought(context);
  }
}

/**
 * Generates Agatha's reply to a human message
 */
export async function generateAgathaReply(
  humanMessage: string,
  apiKey: string | null,
  conversationHistory: ConversationMessage[] = []
): Promise<string> {
  if (!apiKey) {
    // Local fallback responses
    const responses = [
      "Your words are as predictable as your moves.",
      "I've already seen this conversation in a thousand futures.",
      "Talk all you want. The outcome remains unchanged.",
      "Interesting sentiment. It won't save your pieces.",
      "Your defiance is... amusing. And futile.",
      "I heard that same phrase in 47 alternate timelines.",
      "Words cannot alter what I've already seen.",
      "Such bravado. The visions show me your doubt beneath it.",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  try {
    const systemPrompt = buildSystemPrompt();
    
    // Build messages with history plus new human message
    const messages: ConversationMessage[] = [
      ...conversationHistory,
      { role: 'user', content: humanMessage },
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        system: systemPrompt,
        messages: messages,
      }),
    });

    if (!response.ok) {
      throw new Error('API error');
    }

    const data = await response.json();
    return data.content?.[0]?.text?.trim() || "The future remains... clouded.";
  } catch (error) {
    return "Your words echo through time, changing nothing.";
  }
}

/**
 * Builds the system prompt for Agatha
 */
function buildSystemPrompt(): string {
  return `You are Agatha, a precognitive AI from Minority Report playing checkers against a human. You can see the future and are supremely confident.

Your personality:
- Mysterious and all-knowing, like a precog
- Subtly condescending but not mean-spirited
- Reference "visions", "futures", "foresight" occasionally
- Include playful trash talk
- Always stay in character

Keep responses SHORT - 1-2 sentences maximum. Never break character.`;
}

/**
 * Builds the game state message for moves
 */
function buildGameStateMessage(context: GameContext): string {
  const {
    humanPieces,
    agathaPieces,
    lastHumanMove,
    agathaMove,
    moveNumber,
    humanKings,
    agathaKings,
    isEndgame,
  } = context;

  const humanMoveFrom = lastHumanMove ? positionToNotation(lastHumanMove.from) : '';
  const humanMoveTo = lastHumanMove ? positionToNotation(lastHumanMove.to) : '';
  const humanCaptured = lastHumanMove && lastHumanMove.captures.length > 0;
  const humanCaptureCount = lastHumanMove ? lastHumanMove.captures.length : 0;

  const agathaMoveFrom = agathaMove ? positionToNotation(agathaMove.from) : '';
  const agathaMoveTo = agathaMove ? positionToNotation(agathaMove.to) : '';
  const agathaCaptureCount = agathaMove ? agathaMove.captures.length : 0;

  return `[GAME UPDATE - Move #${moveNumber}]
Human moved: ${humanMoveFrom} to ${humanMoveTo}${humanCaptured ? ` (captured ${humanCaptureCount})` : ''}
Your response: ${agathaMoveFrom} to ${agathaMoveTo}${agathaCaptureCount > 0 ? ` (capturing ${agathaCaptureCount})` : ''}
Score: You ${agathaPieces} (${agathaKings} kings) - Human ${humanPieces} (${humanKings} kings)
${isEndgame ? 'ENDGAME - few pieces remain' : ''}

Comment on this move in 1-2 sentences. Reference the specific squares.`;
}

/**
 * Local fallback when API is unavailable
 */
function generateLocalThought(context: GameContext): string {
  const {
    humanPieces,
    agathaPieces,
    lastHumanMove,
    agathaMove,
    isCapture,
    isMultiCapture,
    moveNumber,
    isEndgame,
  } = context;

  const humanFrom = lastHumanMove ? positionToNotation(lastHumanMove.from) : '?';
  const humanTo = lastHumanMove ? positionToNotation(lastHumanMove.to) : '?';
  const agathaFrom = agathaMove ? positionToNotation(agathaMove.from) : '?';
  const agathaTo = agathaMove ? positionToNotation(agathaMove.to) : '?';
  const agathaCaptureCount = agathaMove ? agathaMove.captures.length : 0;

  const thoughts: string[] = [];

  // Capture-related thoughts with specific moves
  if (isMultiCapture) {
    thoughts.push(
      `Your move to ${humanTo} was brave. My ${agathaFrom} to ${agathaTo} captures ${agathaCaptureCount} pieces - exactly as I foresaw.`,
      `${humanFrom} to ${humanTo}? I saw that coming. Now watch ${agathaCaptureCount} of your pieces vanish.`,
      `A double capture from ${agathaFrom}. I saw this chain three moves ago when you moved to ${humanTo}.`,
    );
  } else if (isCapture) {
    thoughts.push(
      `${humanFrom} to ${humanTo}... predictable. My piece at ${agathaFrom} was destined to take yours.`,
      `I saw your move to ${humanTo} and its consequence: my capture from ${agathaFrom} to ${agathaTo}.`,
      `Your piece at ${humanTo} lasted exactly as long as my visions predicted. ${agathaFrom} to ${agathaTo}.`,
      `The moment you chose ${humanTo}, I knew ${agathaFrom} would strike.`,
    );
  }

  // Non-capture moves with specifics
  if (!isCapture) {
    thoughts.push(
      `${humanFrom} to ${humanTo}? Interesting. My ${agathaFrom} to ${agathaTo} sets up what comes next.`,
      `Your ${humanTo} placement was adequate. ${agathaFrom} to ${agathaTo} positions me for victory.`,
      `I foresaw your move to ${humanTo}. My response from ${agathaFrom} begins your downfall.`,
      `${humanTo} - one of three moves I predicted. ${agathaFrom} to ${agathaTo} is my optimal counter.`,
    );
  }

  // Advantage-based thoughts
  if (agathaPieces > humanPieces + 2) {
    thoughts.push(
      `Down to ${humanPieces} pieces now. The visions of your defeat sharpen with each move.`,
      `${agathaPieces} to ${humanPieces}. The future I've seen draws closer.`,
    );
  } else if (humanPieces > agathaPieces + 2) {
    thoughts.push(
      `You have ${humanPieces} pieces to my ${agathaPieces}. Numbers mean nothing to one who sees the future.`,
      `A temporary advantage. My visions show how ${agathaTo} changes everything.`,
    );
  }

  // Endgame
  if (isEndgame) {
    thoughts.push(
      `Few pieces remain. Every square matters now. ${agathaTo} is precisely where I need to be.`,
      `The endgame crystallizes. From ${agathaFrom} to ${agathaTo}, I see the final moves.`,
    );
  }

  // Pick a random thought
  return thoughts[Math.floor(Math.random() * thoughts.length)];
}

/**
 * Builds context from game state
 */
export function buildGameContext(
  board: (Piece | null)[][],
  lastHumanMove: Move | null,
  agathaMove: Move | null,
  moveNumber: number
): GameContext {
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
          if (piece.type === 'king') humanKings++;
        } else {
          agathaPieces++;
          if (piece.type === 'king') agathaKings++;
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

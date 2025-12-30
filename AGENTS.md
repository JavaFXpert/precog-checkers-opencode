# AGENTS.md - AI Coding Agent Guidelines

This document provides instructions for AI coding agents working in this repository.

## Project Overview

- **Type**: Static web application (HTML/TypeScript/CSS)
- **Deployment**: GitHub Pages (root directory)
- **Entry Point**: `index.html`
- **Target Model**: Claude Opus 4.5 Thinking

## Build & Development Commands

### TypeScript Compilation

```bash
# Install TypeScript globally (if needed)
npm install -g typescript

# Compile TypeScript to JavaScript
tsc

# Compile with watch mode
tsc --watch

# Compile specific file
tsc src/filename.ts --outDir dist/
```

### Local Development Server

```bash
# Using Python (built-in)
python3 -m http.server 8000

# Using Node.js http-server
npx http-server . -p 8000

# Using live-server with auto-reload
npx live-server --port=8000
```

### Linting & Formatting

```bash
# ESLint (if configured)
npx eslint src/**/*.ts
npx eslint src/filename.ts --fix

# Prettier (if configured)
npx prettier --write "src/**/*.ts"
npx prettier --check "src/**/*.ts"
```

### Testing

```bash
# Run all tests (adjust based on test framework)
npm test

# Run single test file
npx jest path/to/test.spec.ts
npx vitest run path/to/test.spec.ts

# Run tests matching pattern
npx jest --testNamePattern="test name pattern"
npx vitest run -t "test name pattern"
```

## Project Structure

```
/
├── index.html          # Main entry point (GitHub Pages serves this)
├── src/
│   ├── main.ts         # Application entry point
│   ├── types.ts        # Type definitions
│   └── utils/          # Utility functions
├── styles/
│   └── main.css        # Stylesheets
├── dist/               # Compiled JavaScript output
├── assets/             # Static assets (images, fonts)
├── tsconfig.json       # TypeScript configuration
└── AGENTS.md           # This file
```

## Code Style Guidelines

### TypeScript

#### Imports
- Group imports in order: external libraries, internal modules, types
- Use named exports over default exports
- Sort imports alphabetically within groups

```typescript
// External libraries
import { someFunction } from 'external-lib';

// Internal modules
import { helperFunction } from './utils/helpers';
import { GameState } from './types';

// Type-only imports
import type { Config, Options } from './types';
```

#### Naming Conventions
- **Files**: `kebab-case.ts` (e.g., `game-board.ts`)
- **Classes**: `PascalCase` (e.g., `GameBoard`)
- **Interfaces/Types**: `PascalCase` (e.g., `PlayerState`)
- **Functions/Variables**: `camelCase` (e.g., `calculateScore`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `MAX_PLAYERS`)
- **Private members**: prefix with underscore `_privateMethod`

#### Type Annotations
- Always provide explicit return types for functions
- Use `interface` for object shapes, `type` for unions/intersections
- Avoid `any`; use `unknown` when type is truly unknown
- Prefer `readonly` for immutable data

```typescript
interface Player {
  readonly id: string;
  name: string;
  score: number;
}

function calculateWinner(players: Player[]): Player | null {
  // Implementation
}
```

#### Error Handling
- Use custom error classes for domain-specific errors
- Always handle promise rejections
- Provide meaningful error messages

```typescript
class GameError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'GameError';
  }
}

async function loadGame(): Promise<void> {
  try {
    const data = await fetchGameData();
    // Process data
  } catch (error) {
    if (error instanceof GameError) {
      handleGameError(error);
    } else {
      console.error('Unexpected error:', error);
      throw error;
    }
  }
}
```

### HTML

- Use semantic HTML5 elements (`<header>`, `<main>`, `<section>`, etc.)
- Include `lang` attribute on `<html>` element
- Always provide `alt` attributes for images
- Use lowercase for element names and attributes

### CSS

- Use CSS custom properties (variables) for theming
- Follow BEM naming convention: `block__element--modifier`
- Mobile-first responsive design
- Group properties: positioning, box model, typography, visual

```css
:root {
  --color-primary: #007bff;
  --spacing-md: 1rem;
}

.game-board {
  /* Positioning */
  position: relative;
  
  /* Box model */
  display: grid;
  padding: var(--spacing-md);
  
  /* Typography */
  font-size: 1rem;
  
  /* Visual */
  background-color: var(--color-primary);
}

.game-board__cell--active {
  border: 2px solid currentColor;
}
```

## GitHub Pages Deployment

- The `index.html` in the root directory is the entry point
- All paths must be relative (no leading `/`)
- Compiled JS should be committed or built via GitHub Actions
- Test locally before pushing: `npx live-server`

## Agent-Specific Instructions

### When Making Changes
1. Read existing code to understand patterns before modifying
2. Run TypeScript compiler to check for errors before committing
3. Test changes locally in a browser
4. Keep commits focused and atomic

### When Adding Features
1. Add types first in `types.ts` or relevant module
2. Implement with full type safety
3. Update `index.html` if new scripts are needed
4. Test across different viewport sizes

### When Debugging
1. Use browser DevTools console for runtime errors
2. Check TypeScript compiler output for type errors
3. Verify all file paths are relative and correct

### Code Review Checklist
- [ ] TypeScript compiles without errors
- [ ] No `any` types introduced
- [ ] Error cases handled appropriately
- [ ] CSS follows BEM convention
- [ ] HTML is semantic and accessible
- [ ] Works on GitHub Pages (relative paths)

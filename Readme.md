***

```markdown
# Web App Architecture Documentation

## 📌 LLM Context (Read First)
This is a Vanilla JavaScript Single Page Application (SPA) designed to be a cute, mobile-first web app. It uses **ES Modules (ESM)** natively in the browser without any bundlers (no Webpack, Vite, etc.). It is deployed directly to GitHub Pages.

The architecture separates UI state (HTML/CSS) from game loops and feature logic (JS modules).

## 📁 Directory Structure
```text
/
├── index.html        )
├── style.css        
└── js/
    ├── main.js       # Entry point. Bootstraps modules and attaches global event listeners
    ├── state.js      # Global state object (current screen, game loop IDs, active flags)
    ├── utils.js      # Helper functions (DOM selectors, Canvas polyfills)
    ├── navigation.js # Handles screen switching and teardown of active games
    ├── features/
    │   ├── hug.js        # Logic for the virtual hug (heart particle animations)
    │   └── itinerary.js  # Logic for the daily checklist and "deal" button
    └── games/
        ├── flappy.js     # Canvas-based Flappy Bird clone (Heart/Love themed)
        └── snake.js      # Canvas-based Snake clone (Mobile touch/swipe + grid logic)
```

---

## 🏗️ Core Architecture Concepts

### 1. Screen Management (The `.screen` pattern)
All pages of the app are already present in `index.html` as `<div class="screen">`.
* Screens are hidden by default using `opacity: 0` and `pointer-events: none`.
* The `js/navigation.js` file toggles the `.active` class to fade screens in and out.
* **Important CSS Rule:** Screens use `justify-content: flex-start` with `.screen-content { margin: auto; }`. This prevents a known Flexbox bug where content gets cut off at the top on mobile devices when it overflows the screen height.

### 2. Global State Management (`js/state.js`)
We avoid circular dependencies by keeping a central `state` object.
```javascript
export const state = {
    currentScreen: 'opening',
    gameLoopId: null,   // Stores requestAnimationFrame ID for flappy
    snakeLoopId: null,  // Stores requestAnimationFrame ID for snake
    // ...other flags
};
```
Whenever a screen changes, `navigation.js` checks `state.currentScreen` to gracefully stop any running `requestAnimationFrame` loops before transitioning.

### 3. Games / Canvas Loops
Games (`flappy.js`, `snake.js`) follow a strict internal structure:
1. `setup[Game]()`: Binds event listeners (keyboard, touch, buttons). Called once in `main.js`.
2. `resize[Game]()`: Handles Canvas scaling (accounts for `devicePixelRatio`).
3. `start[Game]()`: Resets variables, clears overlays, and triggers `requestAnimationFrame`.
4. `stop[Game]()`: Cancels `requestAnimationFrame` and hides overlays.
5. `[game]Loop()`: The actual frame-by-frame drawing and logic function.

---

## 🛠️ How to Add a New Feature or Screen

If you (the LLM) are asked to add a new screen (e.g., a "Letter" screen), follow these exact steps:

1. **HTML:** Add a new `<div id="screen-letter" class="screen">...</div>` inside the `#app` div in `index.html`.
2. **State:** If the feature needs tracking, add a variable to `js/state.js`.
3. **Navigation:** Add `letter: $('screen-letter')` to the `screens` object in `js/navigation.js`. Add its background color to `bgMap`.
4. **Logic:** Create `js/features/letter.js`. Export a `setupLetter()` function.
5. **Main:** Import `setupLetter` in `js/main.js` and call it. Add an event listener to a button that calls `showScreen('letter')`.

---

## 🎮 How to Add a New Game

If asked to add a new game (e.g., Tetris), follow this exact integration path:

1. **HTML:** 
   * Add the `<div id="screen-tetris" class="screen game-screen">` block.
   * Include the standard `.game-header` (scores, title) and `.game-canvas-wrap` (Canvas + `.game-overlay`).
   * Include a `<button class="game-back-btn" id="tetris-back-btn">← back</button>`.
2. **State:** Add `tetrisLoopId: null` to `js/state.js`.
3. **Logic:** Create `js/games/tetris.js`. 
   * Must export `setupTetris()`, `startTetris()`, `stopTetris()`, and `resizeTetris()`.
   * Game loop must save its animation frame to `state.tetrisLoopId`.
4. **Navigation Integration:** 
   * Update `js/navigation.js` -> `showScreen()` to call `stopTetris()` if `state.currentScreen === 'tetris' && id !== 'tetris'`.
5. **Main Integration:**
   * Call `setupTetris()` on load.
   * Add `resizeTetris()` to the global window resize event listener.

---


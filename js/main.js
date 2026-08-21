import { $, initPolyfills } from './utils.js';
import { state } from './state.js';
import { showScreen } from './navigation.js';
import { setupItinerary } from './features/itinerary.js';
import { startHugHearts, stopHugHearts } from './features/hug.js';
import { setupFlappy, startFlappy, resizeFlappy } from './games/flappy.js';
import { setupSnake, startSnake, resizeSnake } from './games/snake.js';

// 1. Initialize
initPolyfills();
setupItinerary();
setupFlappy();
setupSnake();

// 2. Global Event Listeners 

// Screen Resizing
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (state.currentScreen === 'game') resizeFlappy();
        if (state.currentScreen === 'snake') resizeSnake();
    }, 200);
});

// Prevent rubber-band scrolling on mobile
document.addEventListener('touchmove', function(e) {
    if (e.target.closest('.scrollable')) return;
    e.preventDefault();
}, { passive: false });


// 3. Navigation Bindings
$('btn-open-itinerary').addEventListener('click', () => {
    showScreen('itinerary');
    if (navigator.vibrate) navigator.vibrate(8);
});

// Hugs
$('btn-hug').addEventListener('click', () => {
    showScreen('hug');
    $('hug-message').innerHTML = 'okay you can leave the hug now<br />: )';
    $('hug-ok-btn').textContent = 'okay okay ♡';
    startHugHearts();
    if (navigator.vibrate) navigator.vibrate(12);
});

$('hug-back-btn').addEventListener('click', () => { stopHugHearts(); showScreen('itinerary'); });
$('hug-ok-btn').addEventListener('click', () => { stopHugHearts(); showScreen('itinerary'); });

// Games
$('btn-game').addEventListener('click', () => {
    showScreen('game');
    setTimeout(startFlappy, 100);
});

$('btn-snake').addEventListener('click', () => {
    showScreen('snake');
    setTimeout(startSnake, 100);
});

// Quiet Room
$('btn-quiet').addEventListener('click', () => showScreen('quiet'));
$('quiet-ok-btn').addEventListener('click', () => showScreen('itinerary'));

// 4. Start the App
showScreen('opening');
console.log('♡ for neha — modular & made with love');

setTimeout(() => {
    resizeFlappy();
    resizeSnake();
}, 50);
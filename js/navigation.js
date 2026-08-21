import { state } from './state.js';
import { stopFlappy } from './games/flappy.js';
import { stopSnake } from './games/snake.js';
import { $ } from './utils.js';

export function showScreen(id) {
    // stop games when leaving
    if (state.currentScreen === 'game' && id !== 'game') stopFlappy();
    if (state.currentScreen === 'snake' && id !== 'snake') stopSnake();

    const screens = {
        opening: $('screen-opening'),
        itinerary: $('screen-itinerary'),
        hug: $('screen-hug'),
        game: $('screen-game'),
        snake: $('screen-snake'),
        quiet: $('screen-quiet'),
    };

    Object.keys(screens).forEach(key => {
        const el = screens[key];
        if (el) {
            if (key === id) {
                el.classList.add('active');
                el.classList.remove('exit');
            } else {
                el.classList.remove('active');
                el.classList.add('exit');
            }
        }
    });

    state.currentScreen = id;
    
    const bgMap = {
        opening: '#FFF8F0',
        itinerary: '#FFF8F0',
        hug: '#F7D6DF',
        game: '#FFF8F0',
        snake: '#FFF8F0',
        quiet: '#FFF8F0',
    };
    $('app').style.background = bgMap[id] || '#FFF8F0';
}
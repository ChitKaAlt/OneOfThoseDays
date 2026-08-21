import { state } from '../state.js';
import { $ } from '../utils.js';

let hugHeartInterval = null;

function spawnHearts(count = 40) {
    const container = $('hug-hearts-container');
    const colors = ['#FFF8F0', '#F7D6DF', '#E9A9B8', '#C95C68', '#E8D5C4'];
    const symbols = ['♥', '♡', '❤', '♥', '♡'];
    
    for (let i = 0; i < count; i++) {
        const el = document.createElement('div');
        el.className = 'heart-particle';
        el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        el.style.color = colors[Math.floor(Math.random() * colors.length)];
        
        const size = 0.8 + Math.random() * 1.8;
        el.style.fontSize = size + 'rem';
        el.style.left = (Math.random() * 100) + '%';
        el.style.bottom = '-10%';
        el.style.transform = 'rotate(' + (Math.random() * 60 - 30) + 'deg)';
        
        const duration = 4 + Math.random() * 3;
        el.style.animationDuration = duration + 's';
        el.style.animationDelay = (Math.random() * 2) + 's';
        
        container.appendChild(el);
        setTimeout(() => {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, (duration + 2) * 1000);
    }
}

export function startHugHearts() {
    if (hugHeartInterval) clearInterval(hugHeartInterval);
    spawnHearts(30);
    hugHeartInterval = setInterval(() => {
        if (state.currentScreen === 'hug') spawnHearts(12);
        else stopHugHearts();
    }, 1200);
}

export function stopHugHearts() {
    if (hugHeartInterval) { 
        clearInterval(hugHeartInterval);
        hugHeartInterval = null; 
    }
    $('hug-hearts-container').innerHTML = '';
}
import { state } from '../state.js';
import { $ } from '../utils.js';
import { showScreen } from '../navigation.js';

let flappyCanvas, fctx;
let flappy = {
    running: false, score: 0, best: parseInt(localStorage.getItem('flappyBest')) || 0,
    player: { x: 60, y: 0, vy: 0, radius: 16 },
    gravity: 0.15, lift: -5.0, pipes: [], pipeWidth: 50, pipeGap: 260, pipeSpeed: 1.4,
    frame: 0, spawnInterval: 260, gameOver: false, started: false, width: 0, height: 0, dpr: 1,
};

export function resizeFlappy() {
    if (!flappyCanvas) return;
    const wrap = flappyCanvas.parentElement;
    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width || 320;
    const h = rect.height || 320;
    
    flappyCanvas.width = w * dpr;
    flappyCanvas.height = h * dpr;
    flappyCanvas.style.width = w + 'px';
    flappyCanvas.style.height = h + 'px';
    flappy.width = w; flappy.height = h; flappy.dpr = dpr;
    
    fctx.scale(dpr, dpr);
    if (!flappy.running && !flappy.gameOver) {
        flappy.player.y = h / 2;
        flappy.player.vy = 0;
    }
}

function resetFlappy() {
    flappy.score = 0; flappy.pipes = []; flappy.frame = 0;
    flappy.gameOver = false; flappy.running = true; flappy.started = false;
    flappy.player.y = flappy.height / 2; flappy.player.vy = 0;
    
    $('game-overlay').classList.remove('active');
    $('game-score-display').textContent = '0';
    $('game-high-display').textContent = '🏆 ' + flappy.best;
    
    const hint = document.querySelector('#screen-game .game-tap-hint');
    if (hint) hint.style.opacity = '1';
}

function spawnFlappyPipe() {
    const minY = 60;
    const maxY = flappy.height - flappy.pipeGap - 60;
    const y = Math.min(maxY, Math.max(minY, Math.random() * (maxY - minY) + minY));
    flappy.pipes.push({ x: flappy.width, topY: y, scored: false });
}

function flappyGameOver() {
    if (flappy.gameOver) return;
    flappy.gameOver = true; flappy.running = false;
    
    if (state.gameLoopId) { cancelAnimationFrame(state.gameLoopId); state.gameLoopId = null; }
    
    if (flappy.score > flappy.best) {
        flappy.best = flappy.score;
        localStorage.setItem('flappyBest', String(flappy.best));
        $('game-high-display').textContent = '🏆 ' + flappy.best;
    }
    
    const emoji = $('game-overlay-emoji');
    const title = $('game-overlay-title');
    const sub = $('game-overlay-sub');
    const btn = $('game-retry-btn');
    
    if (flappy.score >= 3) {
        emoji.textContent = 'OMGGGG ♡'; title.textContent = 'see?';
        sub.textContent = 'itna sahi toh chal rha hai dimag — we need to stop doubting ourselves';
        btn.textContent = 'back to itinerary →'; btn.dataset.action = 'back';
    } else {
        emoji.textContent = 'NOOO 😭'; title.textContent = 'one more try.';
        sub.textContent = 'okay okay...'; btn.textContent = 'try again ♡'; btn.dataset.action = 'retry';
    }
    $('game-overlay').classList.add('active');
    if (navigator.vibrate) navigator.vibrate(20);
}

function drawFlappy() {
    const w = flappy.width, h = flappy.height;
    fctx.clearRect(0, 0, w, h);
    
    const grad = fctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#FFF8F0'); grad.addColorStop(1, '#F7D6DF');
    fctx.fillStyle = grad; fctx.fillRect(0, 0, w, h);

    // Decor lines
    fctx.strokeStyle = '#E8D5C4'; fctx.lineWidth = 2; fctx.setLineDash([6, 8]);
    fctx.beginPath(); fctx.moveTo(0, h - 8); fctx.lineTo(w, h - 8); fctx.stroke();
    fctx.setLineDash([]);

    // Draw Pipes
    for (const p of flappy.pipes) {
        const x = p.x, topY = p.topY, gap = flappy.pipeGap, pw = flappy.pipeWidth;
        fctx.shadowColor = 'rgba(201,92,104,0.06)'; fctx.shadowBlur = 12;
        fctx.fillStyle = '#E8D5C4'; fctx.beginPath(); fctx.roundRect(x, 0, pw, topY, 16); fctx.fill();
        fctx.fillStyle = '#F7D6DF'; fctx.beginPath(); fctx.roundRect(x + 4, 4, pw - 8, Math.max(topY - 8, 4), 12); fctx.fill();
        
        const bottomY = topY + gap; const bottomH = h - bottomY;
        fctx.fillStyle = '#E8D5C4'; fctx.beginPath(); fctx.roundRect(x, bottomY, pw, bottomH, 16); fctx.fill();
        fctx.fillStyle = '#F7D6DF'; fctx.beginPath(); fctx.roundRect(x + 4, bottomY + 4, pw - 8, Math.max(bottomH - 8, 4), 12); fctx.fill();
        
        fctx.shadowBlur = 0;
    }

    // Draw Player
    const px = flappy.player.x, py = flappy.player.y, r = flappy.player.radius, size = r * 1.6;
    fctx.shadowColor = 'rgba(201,92,104,0.15)'; fctx.shadowBlur = 20;
    fctx.fillStyle = '#C95C68'; fctx.beginPath();
    fctx.moveTo(px, py + size * 0.3);
    fctx.bezierCurveTo(px - size * 0.6, py - size * 0.3, px - size * 0.8, py + size * 0.2, px, py + size * 0.5);
    fctx.bezierCurveTo(px + size * 0.8, py + size * 0.2, px + size * 0.6, py - size * 0.3, px, py + size * 0.3);
    fctx.fill(); fctx.shadowBlur = 0;
    
    // Hint
    if (!flappy.started && !flappy.gameOver) {
        fctx.fillStyle = '#a08080';
        fctx.font = '18px Quicksand, sans-serif';
        fctx.textAlign = 'center';
        fctx.fillText('tap to start ♡', w / 2, h / 2 + 60);
    }
}

function flappyLoop() {
    if (!flappy.running || flappy.gameOver) return;
    
    flappy.frame++;
    if (flappy.frame % flappy.spawnInterval === 0) spawnFlappyPipe();
    
    if (flappy.started) {
        flappy.player.vy += flappy.gravity;
        flappy.player.y += flappy.player.vy;
    }
    
    if (flappy.player.y - flappy.player.radius < 0) {
        flappy.player.y = flappy.player.radius; flappy.player.vy = 0;
    }
    
    if (flappy.player.y + flappy.player.radius > flappy.height) { flappyGameOver(); return; }
    
    for (let i = flappy.pipes.length - 1; i >= 0; i--) {
        const p = flappy.pipes[i]; p.x -= flappy.pipeSpeed;
        const px = flappy.player.x, py = flappy.player.y, r = flappy.player.radius, pw = flappy.pipeWidth, gap = flappy.pipeGap;
        
        if (px + r - 4 > p.x && px - r + 4 < p.x + pw) {
            if (py - r + 4 < p.topY || py + r - 4 > p.topY + gap) { flappyGameOver(); return; }
        }
        
        if (!p.scored && p.x + flappy.pipeWidth < flappy.player.x) {
            p.scored = true; flappy.score++;
            $('game-score-display').textContent = flappy.score;
            if (navigator.vibrate) navigator.vibrate(5);
        }
        if (p.x + flappy.pipeWidth < -20) flappy.pipes.splice(i, 1);
    }
    
    drawFlappy();
    state.gameLoopId = requestAnimationFrame(flappyLoop);
}

export function startFlappy() {
    stopFlappy(); resizeFlappy(); resetFlappy();
    flappy.started = false; flappy.running = true; flappy.gameOver = false;
    
    drawFlappy();
    state.gameLoopId = requestAnimationFrame(flappyLoop);
}

export function stopFlappy() {
    flappy.running = false;
    if (state.gameLoopId) { cancelAnimationFrame(state.gameLoopId); state.gameLoopId = null; }
    if($('game-overlay')) $('game-overlay').classList.remove('active');
}

export function setupFlappy() {
    flappyCanvas = $('game-canvas');
    fctx = flappyCanvas.getContext('2d');

    function handleFlappyTap(e) {
        e.preventDefault();
        if (state.currentScreen !== 'game' || flappy.gameOver) return;
        
        if (!flappy.started) {
            flappy.started = true;
            flappy.player.vy = flappy.lift;
            const hint = document.querySelector('#screen-game .game-tap-hint');
            if (hint) hint.style.opacity = '0';
            if (navigator.vibrate) navigator.vibrate(6);
            return;
        }
        flappy.player.vy = flappy.lift;
        if (navigator.vibrate) navigator.vibrate(4);
    }

    flappyCanvas.addEventListener('touchstart', handleFlappyTap, { passive: false });
    flappyCanvas.addEventListener('mousedown', handleFlappyTap);

    $('game-retry-btn').addEventListener('click', function() {
        if (this.dataset.action === 'back') { showScreen('itinerary'); return; }
        startFlappy();
    });

    $('game-back-btn').addEventListener('click', () => { 
        stopFlappy(); showScreen('itinerary'); 
    });
}
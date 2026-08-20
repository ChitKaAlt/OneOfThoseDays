// script.js
// ──────────────────────────────────────────────
// STATE
// ──────────────────────────────────────────────
const state = {
    currentScreen: 'opening',
    dealChecked: false,
    hugActive: false,
    hugHeartsInterval: null,
    gameRunning: false,
    gameLoop: null,
};

// ──────────────────────────────────────────────
// DOM REFS
// ──────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const screens = {
    opening: $('screen-opening'),
    itinerary: $('screen-itinerary'),
    hug: $('screen-hug'),
    game: $('screen-game'),
    quiet: $('screen-quiet'),
};

const btnOpenItinerary = $('btn-open-itinerary');
const btnHug = $('btn-hug');
const btnGame = $('btn-game');
const btnQuiet = $('btn-quiet');
const hugBackBtn = $('hug-back-btn');
const hugOkBtn = $('hug-ok-btn');
const hugMainHeart = $('hug-main-heart');
const hugMessage = $('hug-message');
const hugHeartsContainer = $('hug-hearts-container');
const dealCheck = $('deal-check');
const dealBox = $('deal-box');
const dealDone = $('deal-done');
const gameCanvas = $('game-canvas');
const gameScoreDisplay = $('game-score-display');
const gameOverlay = $('game-overlay');
const gameOverlayEmoji = $('game-overlay-emoji');
const gameOverlayTitle = $('game-overlay-title');
const gameOverlaySub = $('game-overlay-sub');
const gameRetryBtn = $('game-retry-btn');
const quietOkBtn = $('quiet-ok-btn');
const app = $('app');

// ──────────────────────────────────────────────
// SCREEN NAVIGATION
// ──────────────────────────────────────────────
function showScreen(id) {
    Object.keys(screens).forEach(key => {
        const el = screens[key];
        if (key === id) {
            el.classList.add('active');
            el.classList.remove('exit');
        } else {
            el.classList.remove('active');
            el.classList.add('exit');
        }
    });
    state.currentScreen = id;
    const bgMap = {
        opening: '#FFF8F0',
        itinerary: '#FFF8F0',
        hug: '#F7D6DF',
        game: '#FFF8F0',
        quiet: '#FFF8F0',
    };
    app.style.background = bgMap[id] || '#FFF8F0';
}

// ──────────────────────────────────────────────
// DEAL
// ──────────────────────────────────────────────
dealCheck.addEventListener('click', function (e) {
    e.preventDefault();
    if (state.dealChecked) return;
    state.dealChecked = true;
    dealBox.textContent = '☑';
    dealBox.classList.add('checked');
    dealDone.style.display = 'block';
    if (navigator.vibrate) navigator.vibrate(10);
});

// ──────────────────────────────────────────────
// OPENING → ITINERARY
// ──────────────────────────────────────────────
btnOpenItinerary.addEventListener('click', function () {
    showScreen('itinerary');
    if (navigator.vibrate) navigator.vibrate(8);
});

// ──────────────────────────────────────────────
// VIRTUAL HUG
// ──────────────────────────────────────────────
let hugHeartInterval = null;

function spawnHearts(count = 40) {
    const container = hugHeartsContainer;
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

function startHugHearts() {
    if (hugHeartInterval) clearInterval(hugHeartInterval);
    spawnHearts(30);
    hugHeartInterval = setInterval(() => {
        if (state.currentScreen === 'hug') {
            spawnHearts(12);
        } else {
            clearInterval(hugHeartInterval);
            hugHeartInterval = null;
        }
    }, 1200);
}

function stopHugHearts() {
    if (hugHeartInterval) {
        clearInterval(hugHeartInterval);
        hugHeartInterval = null;
    }
    hugHeartsContainer.innerHTML = '';
}

btnHug.addEventListener('click', function () {
    showScreen('hug');
    hugMessage.innerHTML = 'okay you can leave the hug now<br />i\'m letting go reluctantly';
    hugOkBtn.textContent = 'okay okay ♡';
    startHugHearts();
    if (navigator.vibrate) navigator.vibrate(12);
});

hugBackBtn.addEventListener('click', function () {
    stopHugHearts();
    showScreen('itinerary');
    if (navigator.vibrate) navigator.vibrate(6);
});

hugOkBtn.addEventListener('click', function () {
    stopHugHearts();
    showScreen('itinerary');
    if (navigator.vibrate) navigator.vibrate(6);
});

// ──────────────────────────────────────────────
// QUIET / LEAVE ME ALONE
// ──────────────────────────────────────────────
btnQuiet.addEventListener('click', function () {
    showScreen('quiet');
    if (navigator.vibrate) navigator.vibrate(8);
});

quietOkBtn.addEventListener('click', function () {
    showScreen('itinerary');
    if (navigator.vibrate) navigator.vibrate(6);
});

// ──────────────────────────────────────────────
// MINI-GAME — Flappy Heart (easier)
// ──────────────────────────────────────────────
const ctx = gameCanvas.getContext('2d');
let game = {
    running: false,
    score: 0,
    best: 0,
    player: { x: 60, y: 0, vy: 0, radius: 16 },
    gravity: 0.28,       // reduced from 0.4
    lift: -8.5,          // stronger flap
    pipes: [],
    pipeWidth: 38,
    pipeGap: 140,        // wider gap
    pipeSpeed: 1.8,      // slower
    frame: 0,
    spawnInterval: 90,
    gameOver: false,
    started: false,
    width: 0,
    height: 0,
    dpr: 1,
};

function resizeGame() {
    const wrap = gameCanvas.parentElement;
    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width;
    const h = rect.height;
    gameCanvas.width = w * dpr;
    gameCanvas.height = h * dpr;
    gameCanvas.style.width = w + 'px';
    gameCanvas.style.height = h + 'px';
    game.width = w;
    game.height = h;
    game.dpr = dpr;
    ctx.scale(dpr, dpr);
    if (!game.running && !game.gameOver) {
        game.player.y = h / 2;
        game.player.vy = 0;
    }
}

function resetGame() {
    game.score = 0;
    game.pipes = [];
    game.frame = 0;
    game.gameOver = false;
    game.running = true;
    game.started = false;
    game.player.y = game.height / 2;
    game.player.vy = 0;
    gameOverlay.classList.remove('active');
    gameScoreDisplay.textContent = 'score: 0';
    const hint = document.querySelector('.game-tap-hint');
    if (hint) hint.style.opacity = '1';
}

function spawnPipe() {
    const minY = 70;
    const maxY = game.height - game.pipeGap - 70;
    const y = Math.min(maxY, Math.max(minY, Math.random() * (maxY - minY) + minY));
    game.pipes.push({
        x: game.width,
        topY: y,
        scored: false,
    });
}

function gameLoop() {
    if (!game.running || game.gameOver) return;
    game.frame++;

    if (game.frame % game.spawnInterval === 0) {
        spawnPipe();
    }

    if (game.started) {
        game.player.vy += game.gravity;
        game.player.y += game.player.vy;
    }

    if (game.player.y - game.player.radius < 0) {
        game.player.y = game.player.radius;
        game.player.vy = 0;
    }
    if (game.player.y + game.player.radius > game.height) {
        gameOver();
        return;
    }

    for (let i = game.pipes.length - 1; i >= 0; i--) {
        const p = game.pipes[i];
        p.x -= game.pipeSpeed;

        const px = game.player.x;
        const py = game.player.y;
        const r = game.player.radius;
        const pw = game.pipeWidth;
        const gap = game.pipeGap;

        if (px + r > p.x && px - r < p.x + pw) {
            if (py - r < p.topY || py + r > p.topY + gap) {
                gameOver();
                return;
            }
        }

        if (!p.scored && p.x + game.pipeWidth < game.player.x) {
            p.scored = true;
            game.score++;
            gameScoreDisplay.textContent = 'score: ' + game.score;
            if (navigator.vibrate) navigator.vibrate(5);
        }

        if (p.x + game.pipeWidth < -20) {
            game.pipes.splice(i, 1);
        }
    }

    drawGame();
    requestAnimationFrame(gameLoop);
}

function drawGame() {
    const w = game.width;
    const h = game.height;
    ctx.clearRect(0, 0, w, h);

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#FFF8F0');
    grad.addColorStop(1, '#F7D6DF');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#E8D5C4';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(0, h - 8);
    ctx.lineTo(w, h - 8);
    ctx.stroke();
    ctx.setLineDash([]);

    for (const p of game.pipes) {
        const x = p.x;
        const topY = p.topY;
        const gap = game.pipeGap;
        const pw = game.pipeWidth;

        ctx.shadowColor = 'rgba(201,92,104,0.06)';
        ctx.shadowBlur = 12;

        const topH = topY;
        ctx.fillStyle = '#E8D5C4';
        ctx.beginPath();
        ctx.roundRect(x, 0, pw, topH, 16);
        ctx.fill();
        ctx.fillStyle = '#F7D6DF';
        ctx.beginPath();
        ctx.roundRect(x + 4, 4, pw - 8, Math.max(topH - 8, 4), 12);
        ctx.fill();

        const bottomY = topY + gap;
        const bottomH = h - bottomY;
        ctx.fillStyle = '#E8D5C4';
        ctx.beginPath();
        ctx.roundRect(x, bottomY, pw, bottomH, 16);
        ctx.fill();
        ctx.fillStyle = '#F7D6DF';
        ctx.beginPath();
        ctx.roundRect(x + 4, bottomY + 4, pw - 8, Math.max(bottomH - 8, 4), 12);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,248,240,0.5)';
        for (let d = 0; d < 3; d++) {
            const dx = x + 6 + d * 12;
            const dy = (d % 2 === 0) ? 8 + d * 6 : topY - 8 - d * 4;
            if (dy > 4 && dy < topH - 4) {
                ctx.beginPath();
                ctx.arc(dx, dy, 4, 0, Math.PI * 2);
                ctx.fill();
            }
            const dy2 = bottomY + 8 + d * 6;
            if (dy2 < h - 8) {
                ctx.beginPath();
                ctx.arc(dx, dy2, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.shadowBlur = 0;
    }

    const px = game.player.x;
    const py = game.player.y;
    const r = game.player.radius;
    const size = r * 1.6;

    ctx.shadowColor = 'rgba(201,92,104,0.15)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#C95C68';
    ctx.beginPath();
    ctx.moveTo(px, py + size * 0.3);
    ctx.bezierCurveTo(px - size * 0.6, py - size * 0.3, px - size * 0.8, py + size * 0.2, px, py + size * 0.5);
    ctx.bezierCurveTo(px + size * 0.8, py + size * 0.2, px + size * 0.6, py - size * 0.3, px, py + size * 0.3);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,248,240,0.3)';
    ctx.beginPath();
    ctx.arc(px - size * 0.2, py - size * 0.15, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,248,240,0.15)';
    ctx.beginPath();
    ctx.arc(px + size * 0.1, py - size * 0.05, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    if (!game.started && !game.gameOver) {
        ctx.fillStyle = '#a08080';
        ctx.font = '18px Quicksand, sans-serif';
        ctx.fontWeight = '500';
        ctx.textAlign = 'center';
        ctx.fillText('tap to start ♡', w / 2, h / 2 + 60);
        ctx.textAlign = 'left';
    }
}

// ── roundRect polyfill ──
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
        const r = typeof radii === 'number' ? radii : (radii || 0);
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        return this;
    };
}

function gameOver() {
    if (game.gameOver) return;
    game.gameOver = true;
    game.running = false;
    if (game.score > game.best) game.best = game.score;

    if (game.score >= 5) {
        gameOverlayEmoji.textContent = 'LOOK AT YOU GO ♡';
        gameOverlayTitle.textContent = 'see?';
        gameOverlaySub.textContent = 'brain working perfectly fine.\nokay maybe i shouldn\'t have doubted you.';
        gameRetryBtn.textContent = 'back to itinerary →';
        gameRetryBtn.dataset.action = 'back';
    } else {
        gameOverlayEmoji.textContent = 'NOOO 😭';
        gameOverlayTitle.textContent = 'one more try.';
        gameOverlaySub.textContent = 'okay okay...';
        gameRetryBtn.textContent = 'try again ♡';
        gameRetryBtn.dataset.action = 'retry';
    }
    gameOverlay.classList.add('active');
    if (navigator.vibrate) navigator.vibrate(20);
}

function startGame() {
    resizeGame();
    resetGame();
    game.started = false;
    game.running = true;
    game.gameOver = false;
    gameOverlay.classList.remove('active');
    gameScoreDisplay.textContent = 'score: 0';
    const hint = document.querySelector('.game-tap-hint');
    if (hint) hint.style.opacity = '1';
    drawGame();
    if (game.gameLoop) cancelAnimationFrame(game.gameLoop);
    gameLoop();
}

// ── game input ──
function handleGameTap(e) {
    e.preventDefault();
    if (state.currentScreen !== 'game') return;
    if (game.gameOver) return;

    if (!game.started) {
        game.started = true;
        game.player.vy = game.lift;
        const hint = document.querySelector('.game-tap-hint');
        if (hint) hint.style.opacity = '0';
        if (navigator.vibrate) navigator.vibrate(6);
        return;
    }

    game.player.vy = game.lift;
    if (navigator.vibrate) navigator.vibrate(4);
}

gameCanvas.addEventListener('touchstart', handleGameTap, { passive: false });
gameCanvas.addEventListener('mousedown', handleGameTap);

gameRetryBtn.addEventListener('click', function () {
    if (this.dataset.action === 'back') {
        showScreen('itinerary');
        game.running = false;
        if (game.gameLoop) cancelAnimationFrame(game.gameLoop);
        return;
    }
    resetGame();
    game.started = false;
    gameOverlay.classList.remove('active');
    gameScoreDisplay.textContent = 'score: 0';
    const hint = document.querySelector('.game-tap-hint');
    if (hint) hint.style.opacity = '1';
    drawGame();
    if (game.gameLoop) cancelAnimationFrame(game.gameLoop);
    gameLoop();
});

btnGame.addEventListener('click', function () {
    showScreen('game');
    setTimeout(() => {
        startGame();
    }, 100);
    if (navigator.vibrate) navigator.vibrate(8);
});

// ── window resize ──
let resizeTimeout;
window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (state.currentScreen === 'game') {
            resizeGame();
            if (!game.gameOver) drawGame();
        }
    }, 200);
});

// ──────────────────────────────────────────────
// INIT
// ──────────────────────────────────────────────
showScreen('opening');

document.addEventListener('touchmove', function (e) {
    if (e.target.closest('.scrollable')) return;
    e.preventDefault();
}, { passive: false });

console.log('♡ for neha — made with love');
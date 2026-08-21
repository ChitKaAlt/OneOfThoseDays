import { state } from '../state.js';
import { $ } from '../utils.js';
import { showScreen } from '../navigation.js';

let snakeCanvas, sctx;
let snakeTouchStart = null;
let snake = {
    running: false, score: 0, best: parseInt(localStorage.getItem('snakeBest')) || 0,
    gridSize: 20, cells: [], snake: [], food: null,
    direction: 'right', nextDirection: 'right', gameOver: false, started: false,
    width: 0, height: 0, dpr: 1, cols: 0, rows: 0, loopDelay: 150, lastMove: 0,
    loveMessages: [
        'you\'re so sweet ♡', 'love grows ♡', 'heart full ♡', 
        'you\'re my favorite ♡', 'never too much ♡', 'so precious ♡', 
        'all the love ♡', 'you make me smile ♡'
    ],
    foodEaten: 0,
};

export function resizeSnake() {
    if (!snakeCanvas) return;
    const wrap = snakeCanvas.parentElement;
    const rect = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    let w = rect.width || 320;
    let h = rect.height || 320;
    const size = Math.min(w, h);
    
    snakeCanvas.width = size * dpr;
    snakeCanvas.height = size * dpr;
    snakeCanvas.style.width = size + 'px';
    snakeCanvas.style.height = size + 'px';
    snake.width = size;
    snake.height = size;
    snake.dpr = dpr;
    sctx.scale(dpr, dpr);
    
    snake.cols = Math.floor(size / snake.gridSize);
    snake.rows = Math.floor(size / snake.gridSize);
    snake.gridSize = Math.floor(size / Math.max(snake.cols, 1));
    snake.cols = Math.floor(size / snake.gridSize);
    snake.rows = Math.floor(size / snake.gridSize);
    
    if (!snake.running && !snake.gameOver) {
        initSnake();
    }
}

function initSnake() {
    const midCol = Math.floor(snake.cols / 2);
    const midRow = Math.floor(snake.rows / 2);
    snake.snake = [
        { x: midCol, y: midRow },
        { x: midCol - 1, y: midRow },
        { x: midCol - 2, y: midRow },
    ];
    snake.direction = 'right';
    snake.nextDirection = 'right';
    snake.score = 0;
    snake.foodEaten = 0;
    snake.gameOver = false;
    snake.started = false;
    
    $('snake-score-display').textContent = '0';
    $('snake-high-display').textContent = '🏆 ' + snake.best;
    spawnSnakeFood();
}

function spawnSnakeFood() {
    const maxAttempts = 1000;
    for (let i = 0; i < maxAttempts; i++) {
        const fx = Math.floor(Math.random() * snake.cols);
        const fy = Math.floor(Math.random() * snake.rows);
        if (!snake.snake.some(s => s.x === fx && s.y === fy)) {
            snake.food = { x: fx, y: fy };
            return;
        }
    }
    // Fallback if very full
    for (let y = 0; y < snake.rows; y++) {
        for (let x = 0; x < snake.cols; x++) {
            if (!snake.snake.some(s => s.x === x && s.y === y)) {
                snake.food = { x, y };
                return;
            }
        }
    }
    snake.food = null;
}

function moveSnake() {
    if (!snake.running || snake.gameOver) return;
    snake.direction = snake.nextDirection;

    const head = snake.snake[0];
    let newHead = { ...head };
    
    if (snake.direction === 'up') newHead.y--;
    if (snake.direction === 'down') newHead.y++;
    if (snake.direction === 'left') newHead.x--;
    if (snake.direction === 'right') newHead.x++;

    // Wrap around
    if (newHead.x < 0) newHead.x = snake.cols - 1;
    if (newHead.x >= snake.cols) newHead.x = 0;
    if (newHead.y < 0) newHead.y = snake.rows - 1;
    if (newHead.y >= snake.rows) newHead.y = 0;

    // Self collision
    for (let i = 0; i < snake.snake.length; i++) {
        if (snake.snake[i].x === newHead.x && snake.snake[i].y === newHead.y) {
            snakeGameOver('💔', 'your heart skipped a beat', 'want another chance?');
            return;
        }
    }

    snake.snake.unshift(newHead);

    // Food collision
    if (snake.food && newHead.x === snake.food.x && newHead.y === snake.food.y) {
        snake.score++;
        snake.foodEaten++;
        $('snake-score-display').textContent = snake.score;
        
        if (snake.score > snake.best) {
            snake.best = snake.score;
            localStorage.setItem('snakeBest', String(snake.best));
            $('snake-high-display').textContent = '🏆 ' + snake.best;
        }
        
        const msg = snake.loveMessages[snake.foodEaten % snake.loveMessages.length];
        const hint = document.querySelector('#screen-snake .game-tap-hint');
        if (hint) {
            hint.textContent = '♡ ' + msg + ' ♡';
            hint.style.opacity = '1';
            hint.style.animation = 'none';
            setTimeout(() => { hint.style.animation = ''; }, 50);
            setTimeout(() => {
                if (!snake.gameOver) {
                    hint.textContent = 'tap or swipe to move ♡';
                    hint.style.opacity = '0.6';
                }
            }, 1200);
        }
        
        if (navigator.vibrate) navigator.vibrate(8);
        spawnSnakeFood();
        
        if (!snake.food) {
            snakeGameOver('🏆', 'you filled the board with love!', 'perfect score ♡');
            return;
        }
    } else {
        snake.snake.pop();
    }
}

function snakeGameOver(emoji, title, sub) {
    if (snake.gameOver) return;
    snake.gameOver = true;
    snake.running = false;
    
    if (state.snakeLoopId) { 
        cancelAnimationFrame(state.snakeLoopId);
        state.snakeLoopId = null; 
    }
    
    $('snake-overlay-emoji').textContent = emoji;
    $('snake-overlay-title').textContent = title;
    $('snake-overlay-sub').textContent = sub || 'want another chance?';
    $('snake-retry-btn').textContent = 'try again ♡';
    $('snake-retry-btn').dataset.action = 'retry';
    $('snake-overlay').classList.add('active');
    
    if (navigator.vibrate) navigator.vibrate(20);
    const hint = document.querySelector('#screen-snake .game-tap-hint');
    if (hint) hint.textContent = 'tap to start ♡';
}

function drawSnake() {
    const w = snake.width, h = snake.height;
    const gs = snake.gridSize;
    sctx.clearRect(0, 0, w, h);

    // Background gradient
    const grad = sctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#FFF8F0');
    grad.addColorStop(1, '#F7D6DF');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, w, h);

    // Grid lines
    sctx.strokeStyle = 'rgba(232,213,196,0.20)';
    sctx.lineWidth = 0.5;
    for (let x = 0; x <= snake.cols; x++) {
        sctx.beginPath(); sctx.moveTo(x * gs, 0); sctx.lineTo(x * gs, h); sctx.stroke();
    }
    for (let y = 0; y <= snake.rows; y++) {
        sctx.beginPath(); sctx.moveTo(0, y * gs); sctx.lineTo(w, y * gs); sctx.stroke();
    }

    // Draw Food
    if (snake.food) {
        const fx = snake.food.x * gs + gs / 2;
        const fy = snake.food.y * gs + gs / 2;
        sctx.shadowColor = 'rgba(201,92,104,0.30)';
        sctx.shadowBlur = 18;
        sctx.font = (gs * 0.75) + 'px sans-serif';
        sctx.textAlign = 'center';
        sctx.textBaseline = 'middle';
        sctx.fillStyle = '#C95C68';
        sctx.fillText('❤️', fx, fy + 2);
        sctx.shadowBlur = 0;
    }

    // Draw Snake
    for (let i = 0; i < snake.snake.length; i++) {
        const seg = snake.snake[i];
        const x = seg.x * gs + gs / 2;
        const y = seg.y * gs + gs / 2;
        const rad = gs * 0.42;
        const isHead = (i === 0);
        
        const t = i / snake.snake.length;
        const r = 201 - t * 60;
        const g = 92 - t * 30;
        const b = 104 - t * 30;
        
        sctx.shadowColor = 'rgba(201,92,104,0.12)';
        sctx.shadowBlur = 8;
        
        if (isHead) {
            sctx.shadowColor = 'rgba(201,92,104,0.25)';
            sctx.shadowBlur = 16;
            sctx.fillStyle = '#C95C68';
        } else {
            sctx.fillStyle = `rgb(${r},${g},${b})`;
        }
        
        sctx.beginPath();
        sctx.arc(x, y, rad, 0, Math.PI * 2);
        sctx.fill();
        
        if (isHead) {
            sctx.shadowBlur = 0;
            sctx.font = (gs * 0.55) + 'px sans-serif';
            sctx.textAlign = 'center';
            sctx.textBaseline = 'middle';
            sctx.fillStyle = '#FFF8F0';
            sctx.fillText('♡', x, y + 1);
        } else if (i < 3) {
            sctx.shadowBlur = 0;
            sctx.fillStyle = 'rgba(255,248,240,0.15)';
            sctx.beginPath();
            sctx.arc(x - rad * 0.3, y - rad * 0.3, rad * 0.2, 0, Math.PI * 2);
            sctx.fill();
        }
        sctx.shadowBlur = 0;
    }

    // Hint text
    if (!snake.started && !snake.gameOver) {
        sctx.fillStyle = '#a08080';
        sctx.font = '18px Quicksand, sans-serif';
        sctx.textAlign = 'center';
        sctx.textBaseline = 'middle';
        sctx.fillText('tap or swipe to start ♡', w / 2, h / 2 + 40);
        sctx.textAlign = 'left';
    }
}

function snakeLoop(timestamp) {
    if (!snake.running || snake.gameOver) {
        if (!snake.running && state.snakeLoopId) {
            cancelAnimationFrame(state.snakeLoopId);
            state.snakeLoopId = null;
        }
        return;
    }
    if (!snake.lastMove) snake.lastMove = timestamp;
    if (timestamp - snake.lastMove > snake.loopDelay) {
        snake.lastMove = timestamp;
        moveSnake();
        if (snake.gameOver) return;
    }
    drawSnake();
    state.snakeLoopId = requestAnimationFrame(snakeLoop);
}

export function startSnake() {
    stopSnake();
    resizeSnake();
    initSnake();
    snake.running = true;
    snake.gameOver = false;
    snake.started = false;
    snake.lastMove = 0;
    
    $('snake-overlay').classList.remove('active');
    $('snake-score-display').textContent = '0';
    $('snake-high-display').textContent = '🏆 ' + snake.best;
    
    const hint = document.querySelector('#screen-snake .game-tap-hint');
    if (hint) { 
        hint.textContent = 'tap or swipe to start ♡';
        hint.style.opacity = '1'; 
    }
    
    drawSnake();
    state.snakeLoopId = requestAnimationFrame(snakeLoop);
}

export function stopSnake() {
    snake.running = false;
    if (state.snakeLoopId) { 
        cancelAnimationFrame(state.snakeLoopId);
        state.snakeLoopId = null; 
    }
    if ($('snake-overlay')) $('snake-overlay').classList.remove('active');
}

export function setupSnake() {
    snakeCanvas = $('snake-canvas'); 
    sctx = snakeCanvas.getContext('2d');

    function setSnakeDirection(dir) {
        if (!snake.running || snake.gameOver) return;
        const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
        if (dir !== opposites[snake.direction] || snake.snake.length < 2) {
            snake.nextDirection = dir;
            if (!snake.started) {
                snake.started = true;
                const hint = document.querySelector('#screen-snake .game-tap-hint');
                if (hint) { hint.textContent = '♡ go! ♡'; hint.style.opacity = '0.6'; }
                if (navigator.vibrate) navigator.vibrate(6);
            }
        }
    }

    // Keyboard
    document.addEventListener('keydown', e => {
        if (state.currentScreen !== 'snake') return;
        const map = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
        if (map[e.key]) { e.preventDefault(); setSnakeDirection(map[e.key]); }
    });

    // Touch and Swipe
    snakeCanvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        if (state.currentScreen !== 'snake') return;
        const touch = e.touches[0];
        snakeTouchStart = { x: touch.clientX, y: touch.clientY };
        if (!snake.started && !snake.gameOver) setSnakeDirection('right');
    }, { passive: false });

    snakeCanvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        if (!snakeTouchStart || state.currentScreen !== 'snake') return;
        const touch = e.touches[0];
        const dx = touch.clientX - snakeTouchStart.x;
        const dy = touch.clientY - snakeTouchStart.y;
        if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            setSnakeDirection(dx > 0 ? 'right' : 'left');
        } else {
            setSnakeDirection(dy > 0 ? 'down' : 'up');
        }
        snakeTouchStart = { x: touch.clientX, y: touch.clientY };
    }, { passive: false });

    snakeCanvas.addEventListener('touchend', () => { snakeTouchStart = null; }, { passive: true });

    snakeCanvas.addEventListener('mousedown', function(e) {
        if (state.currentScreen !== 'snake' || snake.gameOver) return;
        if (!snake.started) setSnakeDirection('right');
    });

    // Mobile buttons (arrows)
    document.querySelectorAll('#snake-controls .ctrl-btn').forEach(btn => {
        btn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            if (this.dataset.dir) setSnakeDirection(this.dataset.dir);
        }, { passive: false });
        btn.addEventListener('mousedown', function(e) {
            e.preventDefault();
            if (this.dataset.dir) setSnakeDirection(this.dataset.dir);
        });
    });

    // Buttons
    $('snake-retry-btn').addEventListener('click', function() {
        if (this.dataset.action === 'back') { showScreen('itinerary'); return; }
        startSnake();
    });

    $('snake-back-btn').addEventListener('click', () => { 
        stopSnake(); 
        showScreen('itinerary'); 
    });
}
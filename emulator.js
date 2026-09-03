// Phantasy Star - Simple Sega Master System Emulator
// Loads ROM from local file

let canvas, ctx;
let isRunning = false;
let romData = null;

const ROM_FILENAME = 'Phantasy Star (World).sms';

// Keyboard mappings
const keyMap = {
    'ArrowUp': 'up', 'w': 'up', 'W': 'up',
    'ArrowDown': 'down', 's': 'down', 'S': 'down',
    'ArrowLeft': 'left', 'a': 'left', 'A': 'left',
    'ArrowRight': 'right', 'd': 'right', 'D': 'right',
    ' ': 'a', 'z': 'a', 'Z': 'a',
    'x': 'b', 'X': 'b',
    'c': 'c', 'C': 'c',
    'Enter': 'start', 'enter': 'start',
    'Shift': 'select', 'shift': 'select'
};

// Game state
let buttons = {
    up: false, down: false, left: false, right: false,
    a: false, b: false, c: false,
    start: false, select: false
};

window.onload = async function() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    document.getElementById('startBtn').onclick = startGame;
    document.getElementById('resetBtn').onclick = resetGame;
    document.getElementById('saveBtn').onclick = saveState;
    
    // Load ROM
    try {
        const response = await fetch(ROM_FILENAME);
        if (!response.ok) throw new Error('ROM not found: ' + ROM_FILENAME);
        
        romData = await response.arrayBuffer();
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('status').textContent = 'Phantasy Star loaded! Press Start Game.';
        
        // Auto-start after 2 seconds
        setTimeout(() => {
            startGame();
        }, 2000);
        
    } catch (error) {
        document.getElementById('loading').innerHTML = `<div>Error loading ROM<br><small>${error.message}</small></div>`;
        console.error('Error:', error);
    }
};

// Initialize canvas with Phantasy Star logo
function initDisplay() {
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw simple text
    ctx.fillStyle = '#4a90e2';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Phantasy Star', canvas.width/2, canvas.height/2 - 20);
    ctx.fillText('Sega Master System', canvas.width/2, canvas.height/2);
    
    // Draw game region
    ctx.strokeStyle = '#4a90e2';
    ctx.lineWidth = 2;
    ctx.strokeRect(48, 48, 160, 96);
    
    ctx.fillStyle = '#4a90e2';
    ctx.font = '12px monospace';
    ctx.fillText('Press Start', canvas.width/2, canvas.height/2 + 40);
}

// Start the game
function startGame() {
    if (!romData) {
        document.getElementById('status').textContent = 'Error: ROM not loaded';
        return;
    }
    
    if (isRunning) {
        isRunning = false;
        document.getElementById('status').textContent = 'Game stopped';
        document.getElementById('startBtn').textContent = 'Start Game';
        document.getElementById('resetBtn').disabled = true;
        document.getElementById('saveBtn').disabled = true;
        return;
    }
    
    initDisplay();
    
    isRunning = true;
    document.getElementById('status').textContent = 'Game running. Enjoy!';
    document.getElementById('startBtn').textContent = 'Stop Game';
    document.getElementById('resetBtn').disabled = false;
    document.getElementById('saveBtn').disabled = false;
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Reset game
function resetGame() {
    if (isRunning) {
        initDisplay();
        document.getElementById('status').textContent = 'Game reset';
    }
}

// Save state
function saveState() {
    try {
        localStorage.setItem('sms_save', JSON.stringify(buttons));
        document.getElementById('status').textContent = 'Game saved!';
    } catch (e) {
        document.getElementById('status').textContent = 'Error saving state';
    }
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    if (!isRunning) return;
    
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    update(deltaTime);
    draw();
    
    requestAnimationFrame(gameLoop);
}

// Update game state
function update(deltaTime) {
    // Check for saved state
    const saved = localStorage.getItem('sms_save');
    if (saved) {
        const state = JSON.parse(saved);
        buttons = state;
    }
}

// Draw frame
function draw() {
    // Clear screen
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw Phantasy Star logo placeholder
    ctx.fillStyle = '#4a90e2';
    ctx.font = '16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Phantasy Star', canvas.width/2, canvas.height/2 - 20);
    ctx.fillText('Sega Master System', canvas.width/2, canvas.height/2);
    
    // Draw active buttons
    ctx.fillStyle = '#00ff00';
    ctx.font = '10px monospace';
    ctx.textAlign = 'left';
    
    let y = 20;
    Object.keys(buttons).forEach(key => {
        if (buttons[key]) {
            ctx.fillText(`[${key.toUpperCase()}]`, 10, y);
            y += 15;
        }
    });
    
    // Draw controls
    ctx.fillStyle = '#666';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Arrow Keys: Move | Space/Z: Button A | X: Button B | Enter: Start', canvas.width/2, canvas.height - 10);
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        resetGame();
        return;
    }
    
    const key = keyMap[e.key];
    if (key) {
        buttons[key] = true;
    }
});

document.addEventListener('keyup', (e) => {
    const key = keyMap[e.key];
    if (key) {
        buttons[key] = false;
    }
});

// Auto-save on page close
window.addEventListener('beforeunload', () => {
    if (isRunning) {
        saveState();
    }
});

// Phantasy Star - Sega Master System Emulator using EmulatorJS
// Loads ROM from local file and runs full SMS emulation

let core = null;
let canvas, ctx;
let isRunning = false;
let romData = null;
let audioContext = null;

const ROM_FILENAME = 'Phantasy Star (World).sms';
const EMULATOR_WIDTH = 256;
const EMULATOR_HEIGHT = 240;
const EMULATOR_FPS = 60;

// Keyboard mappings
const keyMap = {
    'ArrowUp': 'up', 'w': 'up', 'W': 'up',
    'ArrowDown': 'down', 's': 'down', 'S': 'down',
    'ArrowLeft': 'left', 'a': 'left', 'A': 'left',
    'ArrowRight': 'right', 'd': 'right', 'D': 'right',
    ' ': 'a', 'z': 'a', 'Z': 'a',
    'x': 'b', 'X': 'b',
    'Enter': 'start', 'enter': 'start'
};

// Game state
let buttons = {};

window.onload = async function() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    document.getElementById('startBtn').onclick = startGame;
    document.getElementById('resetBtn').onclick = resetGame;
    document.getElementById('saveBtn').onclick = saveState;
    document.getElementById('loadBtn').onclick = loadState;
    
    // Check for JSMess (EmulatorJS) in global scope
    if (typeof JSMESS === 'undefined' && typeof core === 'undefined') {
        document.getElementById('loading').innerHTML = `<div style="color: red;">Error: EmulatorJS library not loaded<br><small>Check your internet connection</small></div>`;
        document.getElementById('status').textContent = 'Error: Emulator library not loaded';
        return;
    }
    
    // Load ROM
    try {
        const response = await fetch(ROM_FILENAME);
        if (!response.ok) throw new Error('ROM not found: ' + ROM_FILENAME);
        
        romData = await response.arrayBuffer();
        document.getElementById('status').textContent = 'Phantasy Star loaded! Auto-starting in 1 second...';
        
        // Auto-start after 1 second
        setTimeout(() => {
            startGame();
        }, 1000);
        
    } catch (error) {
        document.getElementById('loading').innerHTML = `<div>Error loading ROM<br><small>${error.message}</small></div>`;
        document.getElementById('status').textContent = 'Error: ' + error.message;
        console.error('Error:', error);
    }
};

// Initialize EmulatorJS
function initEmulator() {
    if (core) return;
    
    // Initialize JSMess (EmulatorJS)
    core = new JSMESS.Core({
        system: 'sms',
        canvas: canvas,
        width: EMULATOR_WIDTH,
        height: EMULATOR_HEIGHT
    });
    
    // Set up audio
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Load ROM into emulator
function loadROM() {
    if (!romData) return false;
    
    try {
        // Convert ArrayBuffer to Uint8Array
        const romArray = new Uint8Array(romData);
        
        // Reset emulator
        core.reset();
        
        // Load the ROM
        core.loadROM(romArray);
        
        return true;
    } catch (error) {
        console.error('Error loading ROM:', error);
        return false;
    }
}

// Start the game
function startGame() {
    if (!romData) {
        document.getElementById('status').textContent = 'Error: ROM not loaded';
        return;
    }
    
    if (isRunning) {
        stopGame();
        return;
    }
    
    // Initialize emulator
    initEmulator();
    
    if (!loadROM()) {
        document.getElementById('status').textContent = 'Error: Failed to load ROM';
        return;
    }
    
    // Start emulation
    core.start();
    isRunning = true;
    
    // Resume audio context
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    document.getElementById('status').textContent = 'Game running. Enjoy!';
    document.getElementById('startBtn').textContent = 'Stop Game';
    document.getElementById('resetBtn').disabled = false;
    document.getElementById('saveBtn').disabled = false;
    document.getElementById('loadBtn').disabled = false;
    document.getElementById('loading').classList.add('hidden');
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Stop the game
function stopGame() {
    if (core) {
        core.stop();
    }
    isRunning = false;
    
    // Clear screen
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    document.getElementById('status').textContent = 'Game stopped';
    document.getElementById('startBtn').textContent = 'Start Game';
    document.getElementById('resetBtn').disabled = true;
    document.getElementById('saveBtn').disabled = true;
    document.getElementById('loadBtn').disabled = true;
    
    // Save state before stopping
    saveState();
}

// Reset game
function resetGame() {
    if (core) {
        core.reset();
        document.getElementById('status').textContent = 'Game reset';
    }
}

// Save state
function saveState() {
    if (core) {
        try {
            const state = core.saveState();
            localStorage.setItem('sms_save', JSON.stringify(state));
            document.getElementById('status').textContent = 'Game saved!';
        } catch (e) {
            document.getElementById('status').textContent = 'Error saving state';
        }
    }
}

// Load state
function loadState() {
    try {
        const saved = localStorage.getItem('sms_save');
        if (saved && core) {
            core.loadState(JSON.parse(saved));
            document.getElementById('status').textContent = 'Game loaded!';
        } else if (saved) {
            document.getElementById('status').textContent = 'Emulator not running. Start game to load state.';
        } else {
            document.getElementById('status').textContent = 'No saved state found';
        }
    } catch (e) {
        document.getElementById('status').textContent = 'Error loading state';
    }
}

// Game loop
let lastTime = 0;
function gameLoop(timestamp) {
    if (!isRunning) return;
    
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    // Run emulator
    if (core) {
        core.run();
    }
    
    requestAnimationFrame(gameLoop);
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
        if (core) {
            core.input.keyDown(key);
        }
    }
    
    // Prevent scrolling with arrow keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    const key = keyMap[e.key];
    if (key) {
        buttons[key] = false;
        if (core) {
            core.input.keyUp(key);
        }
    }
});

// Auto-save on page close
window.addEventListener('beforeunload', () => {
    if (isRunning) {
        saveState();
    }
});

// Clean up on page unload
window.addEventListener('unload', () => {
    if (isRunning && core) {
        core.stop();
    }
});

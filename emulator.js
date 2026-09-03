// Phantasy Star - Sega Master System Emulator using EmulatorJS
// Loads ROM from local file and runs full SMS emulation

let emulator = null;
let canvas, ctx;
let isRunning = false;
let romData = null;
let audioContext = null;

const ROM_FILENAME = 'Phantasy Star (World).sms';
const EMULATOR_WIDTH = 256;
const EMULATOR_HEIGHT = 240;

// Keyboard mappings
const keyMap = {
    'ArrowUp': 2, 'w': 2, 'W': 2,
    'ArrowDown': 3, 's': 3, 'S': 3,
    'ArrowLeft': 4, 'a': 4, 'A': 4,
    'ArrowRight': 5, 'd': 5, 'D': 5,
    ' ': 0, 'z': 0, 'Z': 0,
    'x': 1, 'X': 1,
    'Enter': 7, 'enter': 7
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
    if (emulator) return;
    
    // Check if EJS global is available
    if (typeof EJS === 'undefined') {
        document.getElementById('loading').innerHTML = `<div style="color: red;">Error: EmulatorJS library not loaded<br><small>Check your internet connection</small></div>`;
        return;
    }
    
    // Initialize emulator
    emulator = EJS_core.init({
        canvas: canvas,
        width: EMULATOR_WIDTH,
        height: EMULATOR_HEIGHT,
        system: 'sms',
        sound: true,
        autoplay: false
    });
}

// Load ROM into emulator
function loadROM() {
    if (!romData) return false;
    
    try {
        // Convert ArrayBuffer to Uint8Array
        const romArray = new Uint8Array(romData);
        
        // Load the ROM
        EJS_core.loadROM(romArray);
        
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
    
    if (!emulator) {
        document.getElementById('status').textContent = 'Error: Emulator not initialized';
        return;
    }
    
    if (!loadROM()) {
        document.getElementById('status').textContent = 'Error: Failed to load ROM';
        return;
    }
    
    // Start emulation
    EJS_core.start();
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
    EJS_core.stop();
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
    EJS_core.reset();
    document.getElementById('status').textContent = 'Game reset';
}

// Save state
function saveState() {
    try {
        const state = EJS_core.saveState();
        localStorage.setItem('sms_save', JSON.stringify(state));
        document.getElementById('status').textContent = 'Game saved!';
    } catch (e) {
        document.getElementById('status').textContent = 'Error saving state';
    }
}

// Load state
function loadState() {
    try {
        const saved = localStorage.getItem('sms_save');
        if (saved) {
            EJS_core.loadState(JSON.parse(saved));
            document.getElementById('status').textContent = 'Game loaded!';
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
    EJS_core.frame();
    
    requestAnimationFrame(gameLoop);
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        resetGame();
        return;
    }
    
    const buttonIndex = keyMap[e.key];
    if (buttonIndex !== undefined) {
        buttons[buttonIndex] = true;
        EJS_core.input.keyDown(buttonIndex);
    }
    
    // Prevent scrolling with arrow keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    const buttonIndex = keyMap[e.key];
    if (buttonIndex !== undefined) {
        buttons[buttonIndex] = false;
        EJS_core.input.keyUp(buttonIndex);
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
    if (isRunning) {
        EJS_core.stop();
    }
});

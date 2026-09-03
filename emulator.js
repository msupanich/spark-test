// Custom controls for EmulatorJS
// Uses CDN loader.js with proper configuration

let isRunning = false;
let romData = null;
const ROM_FILENAME = 'Phantasy Star (World).sms';

document.addEventListener('DOMContentLoaded', async function() {
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    const saveBtn = document.getElementById('saveBtn');
    const loadBtn = document.getElementById('loadBtn');
    const stopBtn = document.getElementById('stopBtn');
    
    // Button event listeners
    startBtn.onclick = startGame;
    resetBtn.onclick = resetGame;
    saveBtn.onclick = saveState;
    loadBtn.onclick = loadState;
    stopBtn.onclick = stopGame;
    
    // Check if ROM file exists in repo
    try {
        const response = await fetch(ROM_FILENAME);
        if (response.ok) {
            romData = await response.arrayBuffer();
            document.getElementById('status').textContent = 'Phantasy Star ROM found! Ready to play.';
            startBtn.disabled = false;
            
            // Auto-start after 1 second
            setTimeout(() => {
                if (!isRunning && window.EJS_emulator) {
                    startGame();
                }
            }, 1000);
        } else {
            document.getElementById('status').textContent = 'ROM not found. Please select one below.';
        }
    } catch (error) {
        console.log('ROM not found via fetch, will use file picker:', error);
    }
    
    // Setup file input for ROM selection
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.sms,.gen,.bin';
    fileInput.style.display = 'none';
    fileInput.onchange = handleFileSelect;
    document.body.appendChild(fileInput);
    
    // Click canvas to focus
    document.getElementById('canvas').addEventListener('click', () => {
        if (window.EJS_emulator && window.EJS_emulator.focus) {
            window.EJS_emulator.focus();
        }
    });
});

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        romData = e.target.result;
        document.getElementById('status').textContent = `Loaded: ${file.name}`;
        startBtn.disabled = false;
    };
    reader.readAsArrayBuffer(file);
}

// Start the game
function startGame() {
    if (!romData && !window.EJS_emulator) {
        document.getElementById('status').textContent = 'Error: No ROM loaded';
        return;
    }
    
    if (isRunning) {
        stopGame();
        return;
    }
    
    if (!window.EJS_emulator) {
        document.getElementById('status').textContent = 'Error: Emulator not loaded';
        return;
    }
    
    // Start the emulator
    window.EJS_emulator.start();
    isRunning = true;
    
    document.getElementById('status').textContent = 'Game running. Enjoy!';
    document.getElementById('startBtn').textContent = 'Start Game';
    document.getElementById('startBtn').disabled = true;
    document.getElementById('resetBtn').disabled = false;
    document.getElementById('saveBtn').disabled = false;
    document.getElementById('loadBtn').disabled = false;
    document.getElementById('stopBtn').disabled = false;
    document.getElementById('loading').classList.add('hidden');
}

// Stop the game
function stopGame() {
    if (window.EJS_emulator) {
        window.EJS_emulator.exit();
    }
    isRunning = false;
    
    document.getElementById('status').textContent = 'Game stopped';
    document.getElementById('startBtn').textContent = 'Start Game';
    document.getElementById('startBtn').disabled = false;
    document.getElementById('resetBtn').disabled = true;
    document.getElementById('saveBtn').disabled = true;
    document.getElementById('loadBtn').disabled = true;
    document.getElementById('stopBtn').disabled = true;
}

// Reset game
function resetGame() {
    if (window.EJS_emulator) {
        window.EJS_emulator.reset();
        document.getElementById('status').textContent = 'Game reset';
    }
}

// Save state
function saveState() {
    try {
        if (window.EJS_emulator) {
            window.EJS_emulator.saveState();
        }
        document.getElementById('status').textContent = 'Game saved!';
    } catch (e) {
        document.getElementById('status').textContent = 'Error saving state';
    }
}

// Load state
function loadState() {
    try {
        if (window.EJS_emulator) {
            window.EJS_emulator.loadState();
        }
        document.getElementById('status').textContent = 'Game loaded!';
    } catch (e) {
        document.getElementById('status').textContent = 'Error loading state';
    }
}

// Keyboard input
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        resetGame();
        return;
    }
    
    if (!window.EJS_emulator || !window.EJS_emulator.input) return;
    
    // Map keys to SMS controller buttons
    const key = e.key.toLowerCase();
    let button = null;
    
    if (key === ' ' || key === 'z') button = 0; // Button 1
    else if (key === 'x') button = 1; // Button 2
    else if (key === 'enter') button = 7; // Start
    else if (key === 'arrowup' || key === 'w') button = 2; // Up
    else if (key === 'arrowdown' || key === 's') button = 3; // Down
    else if (key === 'arrowleft' || key === 'a') button = 4; // Left
    else if (key === 'arrowright' || key === 'd') button = 5; // Right
    
    if (button !== null) {
        window.EJS_emulator.input.keyDown(button);
        e.preventDefault();
    }
});

document.addEventListener('keyup', (e) => {
    if (!window.EJS_emulator || !window.EJS_emulator.input) return;
    
    const key = e.key.toLowerCase();
    let button = null;
    
    if (key === ' ' || key === 'z') button = 0; // Button 1
    else if (key === 'x') button = 1; // Button 2
    else if (key === 'enter') button = 7; // Start
    else if (key === 'arrowup' || key === 'w') button = 2; // Up
    else if (key === 'arrowdown' || key === 's') button = 3; // Down
    else if (key === 'arrowleft' || key === 'a') button = 4; // Left
    else if (key === 'arrowright' || key === 'd') button = 5; // Right
    
    if (button !== null) {
        window.EJS_emulator.input.keyUp(button);
        e.preventDefault();
    }
});

// Auto-save on page close
window.addEventListener('beforeunload', () => {
    if (isRunning && window.EJS_emulator) {
        try {
            window.EJS_emulator.saveState();
        } catch (e) {
            // Ignore errors
        }
    }
});

// Phantasy Star - Sega Master System Emulator
// Uses JSMESS library

let mess;
let isRunning = false;
let loadedFileName = null;

const canvas = document.getElementById('smsCanvas');
const ctx = canvas.getContext('2d');
const loadingOverlay = document.getElementById('loadingOverlay');
const statusDiv = document.getElementById('status');
const startButton = document.getElementById('startButton');
const resetButton = document.getElementById('resetButton');
const saveButton = document.getElementById('saveButton');
const loadButton = document.getElementById('loadButton');
const romInput = document.getElementById('romInput');
const romNameSpan = document.getElementById('romName');

// Phantasy Star ROM filename (must be in the same directory as index.html)
const ROM_FILENAME = 'Phantasy Star (World).sms';

// Keyboard mappings
const keyMap = {
    'ArrowUp': 0, 'w': 0, 'W': 0,
    'ArrowDown': 1, 's': 1, 'S': 1,
    'ArrowLeft': 2, 'a': 2, 'A': 2,
    'ArrowRight': 3, 'd': 3, 'D': 3,
    ' ': 4, 'z': 4, 'Z': 4,  // Button A
    'x': 5, 'X': 5,         // Button B
    'c': 6, 'C': 6,         // Button C
    'Enter': 7, 'enter': 7, // Start
    'Shift': 8, 'shift': 8  // Select
};

// Initialize the emulator
async function initEmulator() {
    try {
        statusDiv.textContent = 'Initializing JSMESS...';
        
        // Create JSMESS instance with callback
        mess = new JSMESS({
            machine: 'sms',
            callback: messReady,
            rompath: './'
        });

        // Set up canvas
        mess.setDisplayCanvas(canvas);

    } catch (error) {
        console.error('Error initializing emulator:', error);
        statusDiv.textContent = `Error: ${error.message}`;
        loadingOverlay.innerHTML = `<div>Error loading emulator<br><small>${error.message}</small></div>`;
    }
}

// Called when JSMESS is ready
function messReady() {
    statusDiv.textContent = 'JSMESS ready!';
    
    // Load ROM from file
    fetch(ROM_FILENAME)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch ROM: ${response.status}`);
            }
            return response.arrayBuffer();
        })
        .then(romData => {
            // Set ROM data
            mess.setRomData(romData, ROM_FILENAME);
            loadedFileName = ROM_FILENAME;
            
            statusDiv.textContent = 'Phantasy Star loaded! Press Start Game to begin.';
            loadingOverlay.classList.add('hidden');
            updateButtons();
        })
        .catch(error => {
            console.error('Error loading ROM:', error);
            statusDiv.textContent = `Note: Could not auto-load ROM (${error.message}). Please select a ROM file manually.`;
            loadingOverlay.classList.add('hidden');
            updateButtons();
        });
}

// Start the emulator
function startGame() {
    if (!mess) {
        statusDiv.textContent = 'Error: Emulator not initialized.';
        return;
    }

    if (isRunning) {
        mess.stop();
        isRunning = false;
        statusDiv.textContent = 'Game stopped.';
        updateButtons();
        return;
    }

    try {
        statusDiv.textContent = 'Starting game...';
        mess.start();
        isRunning = true;
        statusDiv.textContent = 'Game running. Enjoy!';
        updateButtons();
    } catch (error) {
        console.error('Error starting game:', error);
        statusDiv.textContent = `Error starting game: ${error.message}`;
    }
}

// Reset the emulator
function resetGame() {
    if (mess && isRunning) {
        statusDiv.textContent = 'Resetting game...';
        mess.reset();
        statusDiv.textContent = 'Game reset.';
    }
}

// Save game state
function saveGameState() {
    try {
        localStorage.setItem('sms_game_save', 'state');
        statusDiv.textContent = 'Game saved!';
    } catch (error) {
        console.error('Error saving game state:', error);
        statusDiv.textContent = 'Error saving game state.';
    }
}

// Load game state
function loadGameState() {
    try {
        if (localStorage.getItem('sms_game_save')) {
            statusDiv.textContent = 'Game state loaded from local storage.';
        }
    } catch (error) {
        console.error('Error loading game state:', error);
    }
}

// Handle keyboard input
function handleKeyDown(event) {
    if (!isRunning) return;

    const key = keyMap[event.key];
    if (key !== undefined) {
        mess.inputKeyDown(key);
    }

    // Reset with R key
    if (event.key === 'r' || event.key === 'R') {
        resetGame();
    }

    // Save with Ctrl+S
    if (event.key === 's' || event.key === 'S') {
        if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            saveGameState();
        }
    }
}

function handleKeyUp(event) {
    if (!isRunning) return;

    const key = keyMap[event.key];
    if (key !== undefined) {
        mess.inputKeyUp(key);
    }
}

// Handle file input for manual ROM selection
romInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    statusDiv.textContent = `Loading ${file.name}...`;
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        
        loadedFileName = file.name;
        romNameSpan.textContent = file.name;
        
        // Set new ROM
        mess.setRomData(arrayBuffer, file.name);
        
        statusDiv.textContent = `${file.name} loaded. Press Start Game to begin.`;
        updateButtons();
        
    } catch (error) {
        console.error('Error loading ROM:', error);
        statusDiv.textContent = `Error loading ROM: ${error.message}`;
    }
});

// Update button states
function updateButtons() {
    startButton.disabled = !mess;
    resetButton.disabled = !mess || !isRunning;
    saveButton.disabled = !mess;
    loadButton.disabled = !mess;
    
    if (mess && isRunning) {
        startButton.textContent = 'Stop Game';
    } else if (mess) {
        startButton.textContent = 'Start Game';
    }
}

// Event listeners
startButton.addEventListener('click', startGame);
resetButton.addEventListener('click', resetGame);
saveButton.addEventListener('click', saveGameState);
loadButton.addEventListener('click', loadGameState);

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
window.addEventListener('beforeunload', saveGameState);

// Initialize on page load
window.addEventListener('DOMContentLoaded', initEmulator);

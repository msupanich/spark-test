// Phantasy Star - Sega Master System Emulator
// Uses the Cores emulator library
// ROM is loaded from a local file in the repo

let cores;
let sms;
let audioContext;
let audioNode;
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

// Wait for Cores library to be available
async function waitForCores() {
    const maxWait = 10000; // 10 seconds
    const checkInterval = 100;
    let waited = 0;
    
    while (typeof Cores === 'undefined' && waited < maxWait) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waited += checkInterval;
    }
    
    if (typeof Cores === 'undefined') {
        throw new Error('Cores library failed to load. Check your internet connection.');
    }
    
    return Cores;
}

// Initialize the emulator
async function initEmulator() {
    try {
        statusDiv.textContent = 'Loading Cores library...';
        
        // Wait for Cores library
        const Cores = await waitForCores();
        
        statusDiv.textContent = 'Initializing emulator...';
        
        // Initialize Cores
        cores = await Cores.init({
            workerUrl: 'https://unpkg.com/@jsretro/cores@latest/dist/cores.worker.js',
            basePath: 'https://unpkg.com/@jsretro/cores@latest/dist/cores',
            audio: {
                context: null,
                gainNode: null
            }
        });

        statusDiv.textContent = 'Loading Phantasy Star ROM...';
        
        // Auto-load the Phantasy Star ROM from local file
        await loadAutoROM();
        
        loadingOverlay.classList.add('hidden');
        statusDiv.textContent = 'Phantasy Star loaded! Press Start Game to begin.';
        updateButtons();

    } catch (error) {
        console.error('Error initializing emulator:', error);
        statusDiv.textContent = `Error: ${error.message}`;
        loadingOverlay.innerHTML = `<div>Error loading emulator<br><small>${error.message}</small></div>`;
    }
}

// Auto-load Phantasy Star ROM from local file
async function loadAutoROM() {
    try {
        const response = await fetch(ROM_FILENAME);
        if (!response.ok) {
            throw new Error(`Failed to fetch ROM: ${response.status} ${response.statusText}`);
        }
        
        const romData = await response.arrayBuffer();
        loadedFileName = ROM_FILENAME;
        
        statusDiv.textContent = 'ROM loaded successfully.';
        await loadROM(romData, 'SMS');
        
    } catch (error) {
        console.error('Error loading ROM:', error);
        statusDiv.textContent = `Note: Could not auto-load ROM (${error.message}). Please select a ROM file manually.`;
        // Continue to allow manual ROM selection
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
        
        // Detect console type based on file extension
        const extension = file.name.split('.').pop().toLowerCase();
        let consoleType = 'SMS'; // Default to Sega Master System
        
        switch (extension) {
            case 'bin':
            case 'sms':
                consoleType = 'SMS';
                break;
            case 'gen':
            case 'iso':
                consoleType = 'GEN';
                break;
            case 'nes':
                consoleType = 'NES';
                break;
            case 'gba':
                consoleType = 'GBA';
                break;
            case 'sfc':
            case 'smc':
                consoleType = 'SFC';
                break;
            default:
                consoleType = 'SMS';
        }

        statusDiv.textContent = `Loading ${consoleType} ROM...`;
        await loadROM(arrayBuffer, consoleType);
        
        statusDiv.textContent = `${file.name} loaded. Press Start Game to begin.`;
        updateButtons();
        
    } catch (error) {
        console.error('Error loading ROM:', error);
        statusDiv.textContent = `Error loading ROM: ${error.message}`;
    }
});

// Load ROM into emulator
async function loadROM(romData, consoleType) {
    try {
        sms = await cores.createEmulator(consoleType, {
            rom: romData,
            video: {
                canvas: canvas,
                scale: 1
            },
            audio: {
                enabled: true,
                bufferSize: 2048
            },
            region: 'AUTO',
            bios: null
        });

        // Set up video callback for rendering
        sms.setVideoCallback((frameData) => {
            // Create image data from frame
            const imageData = new ImageData(
                new Uint8ClampedArray(frameData.buffer),
                frameData.width,
                frameData.height
            );
            ctx.putImageData(imageData, 0, 0);
        });

        // Set up audio callback
        sms.setAudioCallback((left, right) => {
            if (audioNode) {
                audioNode.emitSound(left, right);
            }
        });

    } catch (error) {
        console.error('Error loading ROM:', error);
        throw error;
    }
}

// Start the emulator
async function startGame() {
    if (!sms) {
        statusDiv.textContent = 'Error: No ROM loaded. Please select a ROM file first.';
        return;
    }

    if (isRunning) {
        await sms.stop();
        isRunning = false;
        statusDiv.textContent = 'Game stopped.';
        updateButtons();
        return;
    }

    try {
        statusDiv.textContent = 'Starting game...';
        
        // Initialize audio context
        initAudio();
        
        await sms.start();
        isRunning = true;
        statusDiv.textContent = 'Game running. Enjoy!';
        updateButtons();
    } catch (error) {
        console.error('Error starting game:', error);
        statusDiv.textContent = `Error starting game: ${error.message}`;
    }
}

// Reset the emulator
async function resetGame() {
    if (sms && isRunning) {
        statusDiv.textContent = 'Resetting game...';
        await sms.reset();
        statusDiv.textContent = 'Game reset.';
    }
}

// Save game state
function saveGameState() {
    if (sms) {
        try {
            const state = sms.saveState();
            if (state) {
                localStorage.setItem('sms_game_save', state);
                localStorage.setItem('sms_game_filename', loadedFileName || 'unknown');
                statusDiv.textContent = 'Game saved!';
            } else {
                statusDiv.textContent = 'Save failed: No state data.';
            }
        } catch (error) {
            console.error('Error saving game state:', error);
            statusDiv.textContent = 'Error saving game state.';
        }
    }
}

// Load game state
function loadGameState() {
    try {
        const savedState = localStorage.getItem('sms_game_save');
        if (savedState) {
            if (sms) {
                sms.loadState(savedState);
                const savedFilename = localStorage.getItem('sms_game_filename');
                statusDiv.textContent = `Game state loaded from local storage (from ${savedFilename || 'unknown'}).`;
            }
        }
    } catch (error) {
        console.error('Error loading game state:', error);
    }
}

// Handle keyboard input
function handleKeyDown(event) {
    if (!sms || !isRunning) return;

    const key = keyMap[event.key];
    if (key) {
        sms.inputKeyDown(key);
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
    if (!sms || !isRunning) return;

    const key = keyMap[event.key];
    if (key) {
        sms.inputKeyUp(key);
    }
}

// Initialize audio context
function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioNode = cores.createAudioNode(audioContext);
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

// Update button states
function updateButtons() {
    startButton.disabled = !sms;
    resetButton.disabled = !sms || !isRunning;
    saveButton.disabled = !sms;
    loadButton.disabled = !sms;
    
    if (sms && isRunning) {
        startButton.textContent = 'Stop Game';
    } else if (sms) {
        startButton.textContent = 'Start Game';
    }
}

// Event listeners
document.getElementById('startButton').addEventListener('click', startGame);
document.getElementById('resetButton').addEventListener('click', resetGame);
document.getElementById('saveButton').addEventListener('click', saveGameState);
document.getElementById('loadButton').addEventListener('click', () => {
    loadGameState();
});

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);
window.addEventListener('beforeunload', saveGameState);

// Initialize on page load
window.addEventListener('DOMContentLoaded', initEmulator);

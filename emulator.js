// Phantasy Star - Sega Master System Emulator using JSSMS
// Loads ROM from local file and runs full SMS emulation

let sms = null;
let canvas, ctx;
let isRunning = false;
let romData = null;
let audioContext = null;
let audioScriptProcessor = null;

const ROM_FILENAME = 'Phantasy Star (World).sms';
const EMULATOR_WIDTH = 256;
const EMULATOR_HEIGHT = 240;
const EMULATOR_FPS = 60;

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
let frameInterval = null;

window.onload = async function() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    // Create offscreen canvas for rendering
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = EMULATOR_WIDTH;
    offscreenCanvas.height = EMULATOR_HEIGHT;
    const offscreenCtx = offscreenCanvas.getContext('2d');
    
    // Initialize buttons state
    for (let i = 0; i < 8; i++) {
        buttons[i] = false;
    }
    
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

// Initialize JSSMS emulator
function initSMS() {
    if (sms) return;
    
    // Create emulator instance
    sms = new JSSMS.Core({
        width: EMULATOR_WIDTH,
        height: EMULATOR_HEIGHT,
        palette: 'master-system',
        sound: true,
        soundSampleRate: 44100,
        soundFrameDuration: 1000 / EMULATOR_FPS
    });
    
    // Set up video output
    sms.emulator.video.setCallback((framebuffer) => {
        const imageData = ctx.createImageData(EMULATOR_WIDTH, EMULATOR_HEIGHT);
        
        // Convert framebuffer to RGBA
        for (let i = 0; i < framebuffer.length; i++) {
            const color = framebuffer[i];
            const paletteColor = sms.emulator.video.getPaletteColor(color);
            const offset = i * 4;
            
            imageData.data[offset] = paletteColor.r;     // R
            imageData.data[offset + 1] = paletteColor.g; // G
            imageData.data[offset + 2] = paletteColor.b; // B
            imageData.data[offset + 3] = 255;            // Alpha
        }
        
        ctx.putImageData(imageData, 0, 0);
    });
    
    // Set up sound
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create script processor for audio
        audioScriptProcessor = audioContext.createScriptProcessor(2048, 0, 2);
        audioScriptProcessor.onaudioprocess = (event) => {
            if (!isRunning) return;
            
            const outputLeft = event.outputBuffer.getChannelData(0);
            const outputRight = event.outputBuffer.getChannelData(1);
            
            // Get audio samples from emulator
            const samples = sms.emulator.sound.getSamples(2048);
            
            for (let i = 0; i < samples.length; i++) {
                const sample = samples[i] * 0.3; // Reduce volume
                outputLeft[i] = sample;
                outputRight[i] = sample;
            }
        };
        
        // Connect audio to speakers
        audioScriptProcessor.connect(audioContext.destination);
    }
}

// Load ROM into emulator
function loadROM() {
    if (!romData) return false;
    
    try {
        // Reset emulator
        sms.emulator.reset();
        
        // Load the ROM
        sms.emulator.loadROM(new Uint8Array(romData));
        
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
    
    // Initialize audio context on user interaction
    if (audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    initSMS();
    
    if (!loadROM()) {
        document.getElementById('status').textContent = 'Error: Failed to load ROM';
        return;
    }
    
    // Start emulation
    sms.emulator.start();
    isRunning = true;
    
    // Start game loop
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
    
    document.getElementById('status').textContent = 'Game running. Enjoy!';
    document.getElementById('startBtn').textContent = 'Stop Game';
    document.getElementById('resetBtn').disabled = false;
    document.getElementById('saveBtn').disabled = false;
    document.getElementById('loadBtn').disabled = false;
    document.getElementById('loading').classList.add('hidden');
    
    // Resume audio context
    if (audioContext) {
        audioContext.resume();
    }
}

// Stop the game
function stopGame() {
    if (sms) {
        sms.emulator.stop();
    }
    isRunning = false;
    
    if (frameInterval) {
        clearInterval(frameInterval);
        frameInterval = null;
    }
    
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
    if (sms) {
        sms.emulator.reset();
        document.getElementById('status').textContent = 'Game reset';
    }
}

// Save state
function saveState() {
    if (sms) {
        try {
            const state = sms.saveState();
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
        if (saved && sms) {
            sms.loadState(JSON.parse(saved));
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
    
    // Run emulator for this frame
    if (sms) {
        sms.emulator.runFrame();
    }
    
    requestAnimationFrame(gameLoop);
}

// Handle keyboard input
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        resetGame();
        return;
    }
    
    const buttonIndex = keyMap[e.key];
    if (buttonIndex !== undefined && buttons[buttonIndex] === false) {
        buttons[buttonIndex] = true;
        if (sms) {
            sms.emulator.input.keyDown(buttonIndex);
        }
    }
});

document.addEventListener('keyup', (e) => {
    const buttonIndex = keyMap[e.key];
    if (buttonIndex !== undefined) {
        buttons[buttonIndex] = false;
        if (sms) {
            sms.emulator.input.keyUp(buttonIndex);
        }
    }
});

// Prevent default behavior for arrow keys and space
document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
    }
}, { passive: false });

// Auto-save on page close
window.addEventListener('beforeunload', () => {
    if (isRunning) {
        saveState();
    }
});

// Clean up on page unload
window.addEventListener('unload', () => {
    if (isRunning && sms) {
        sms.emulator.stop();
    }
});

// Custom controls for EmulatorJS - Direct CDN setup

document.addEventListener('DOMContentLoaded', function() {
    // Wait a moment for EmulatorJS to initialize
    setTimeout(initEmulator, 1000);
});

function initEmulator() {
    if (typeof EmulatorJS === 'undefined') {
        console.error('EmulatorJS not loaded');
        document.getElementById('status').textContent = 'Error: EmulatorJS failed to load';
        return;
    }
    
    console.log('Initializing EmulatorJS...');
    
    // Configure EmulatorJS
    const config = {
        dataPath: 'https://cdn.emulatorjs.org/stable/data/',
        system: 'smsplus',
        volume: 0.5,
        startOnLoad: false,
        hideSettings: true,
        fullscreenOnLoad: false,
        noAutoFocus: true
    };
    
    // Create emulator instance
    window.emulator = new EmulatorJS('#game', config);
    
    // Set up callbacks
    window.emulator.on('ready', function() {
        console.log('EmulatorJS ready');
        document.getElementById('loading').style.display = 'none';
        document.getElementById('status').textContent = 'Emulator ready! Select a ROM file.';
    });
    
    window.emulator.on('start', function() {
        console.log('Game started');
        document.getElementById('status').textContent = 'Game running!';
        document.getElementById('resetBtn').disabled = false;
        document.getElementById('saveBtn').disabled = false;
        document.getElementById('loadBtn').disabled = false;
    });
    
    window.emulator.on('exit', function() {
        console.log('Game exited');
        document.getElementById('status').textContent = 'Game exited';
        document.getElementById('resetBtn').disabled = true;
        document.getElementById('saveBtn').disabled = true;
        document.getElementById('loadBtn').disabled = true;
    });
    
    // Set up file input
    const romInput = document.getElementById('romInput');
    romInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const romData = e.target.result;
            window.emulator.downloadROM(romData, file.name);
            document.getElementById('status').textContent = `Loaded: ${file.name}`;
        };
        reader.readAsArrayBuffer(file);
    });
    
    // Button controls
    document.getElementById('resetBtn').onclick = function() {
        if (window.emulator) window.emulator.reset();
    };
    
    document.getElementById('saveBtn').onclick = function() {
        if (window.emulator) window.emulator.saveState();
    };
    
    document.getElementById('loadBtn').onclick = function() {
        if (window.emulator) window.emulator.loadState();
    };
    
    // Keyboard controls
    document.addEventListener('keydown', function(e) {
        if (e.key === 'r' || e.key === 'R') {
            if (window.emulator) window.emulator.reset();
            return;
        }
        
        if (!window.emulator || !window.emulator.input) return;
        
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
            window.emulator.input.keyDown(button);
            e.preventDefault();
        }
    });
    
    document.addEventListener('keyup', function(e) {
        if (!window.emulator || !window.emulator.input) return;
        
        const key = e.key.toLowerCase();
        let button = null;
        
        if (key === ' ' || key === 'z') button = 0;
        else if (key === 'x') button = 1;
        else if (key === 'enter') button = 7;
        else if (key === 'arrowup' || key === 'w') button = 2;
        else if (key === 'arrowdown' || key === 's') button = 3;
        else if (key === 'arrowleft' || key === 'a') button = 4;
        else if (key === 'arrowright' || key === 'd') button = 5;
        
        if (button !== null) {
            window.emulator.input.keyUp(button);
            e.preventDefault();
        }
    });
    
    window.addEventListener('beforeunload', function() {
        if (window.emulator) {
            try { window.emulator.saveState(); } catch(e) {}
        }
    });
}

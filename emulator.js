// Custom controls for EmulatorJS

document.addEventListener('DOMContentLoaded', function() {
    const romInput = document.getElementById('romInput');
    const resetBtn = document.getElementById('resetBtn');
    const saveBtn = document.getElementById('saveBtn');
    const loadBtn = document.getElementById('loadBtn');
    
    // Handle ROM file selection
    romInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file || !window.EJS_emulator) return;
        
        // Read the file and load into emulator
        const reader = new FileReader();
        reader.onload = function(e) {
            // Convert to ArrayBuffer and load
            const romData = e.target.result;
            window.EJS_emulator.downloadROM(romData, file.name);
            document.getElementById('status').textContent = `Loaded: ${file.name}`;
        };
        reader.readAsArrayBuffer(file);
    });
    
    // Button controls
    resetBtn.onclick = function() {
        if (window.EJS_emulator) window.EJS_emulator.reset();
    };
    
    saveBtn.onclick = function() {
        if (window.EJS_emulator) window.EJS_emulator.saveState();
    };
    
    loadBtn.onclick = function() {
        if (window.EJS_emulator) window.EJS_emulator.loadState();
    };
    
    // Keyboard controls
    document.addEventListener('keydown', function(e) {
        if (e.key === 'r' || e.key === 'R') {
            if (window.EJS_emulator) window.EJS_emulator.reset();
            return;
        }
        
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
            window.EJS_emulator.input.keyDown(button);
            e.preventDefault();
        }
    });
    
    document.addEventListener('keyup', function(e) {
        if (!window.EJS_emulator || !window.EJS_emulator.input) return;
        
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
            window.EJS_emulator.input.keyUp(button);
            e.preventDefault();
        }
    });
    
    // Auto-save on close
    window.addEventListener('beforeunload', function() {
        if (window.EJS_emulator) {
            try { window.EJS_emulator.saveState(); } catch(e) {}
        }
    });
});

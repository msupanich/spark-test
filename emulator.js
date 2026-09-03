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
    
    startBtn.onclick = startGame;
    resetBtn.onclick = resetGame;
    saveBtn.onclick = saveState;
    loadBtn.onclick = loadState;
    stopBtn.onclick = stopGame;
    
    try {
        const response = await fetch(ROM_FILENAME);
        if (response.ok) {
            romData = await response.arrayBuffer();
            document.getElementById('status').textContent = 'Phantasy Star ROM found! Ready to play.';
            startBtn.disabled = false;
            setTimeout(() => { if (!isRunning && window.EJS_emulator) startGame(); }, 1000);
        } else {
            document.getElementById('status').textContent = 'ROM not found. Please select one below.';
        }
    } catch (error) {
        console.log('ROM not found:', error);
    }
});

function startGame() {
    if (!window.EJS_emulator) {
        document.getElementById('status').textContent = 'Error: Emulator not loaded';
        return;
    }
    if (isRunning) { stopGame(); return; }
    window.EJS_emulator.start();
    isRunning = true;
    document.getElementById('status').textContent = 'Game running. Enjoy!';
    document.getElementById('startBtn').disabled = true;
    document.getElementById('resetBtn').disabled = false;
    document.getElementById('saveBtn').disabled = false;
    document.getElementById('loadBtn').disabled = false;
    document.getElementById('stopBtn').disabled = false;
    document.getElementById('loading').classList.add('hidden');
}

function stopGame() {
    window.EJS_emulator.exit();
    isRunning = false;
    document.getElementById('status').textContent = 'Game stopped';
    document.getElementById('startBtn').disabled = false;
    document.getElementById('resetBtn').disabled = true;
    document.getElementById('saveBtn').disabled = true;
    document.getElementById('loadBtn').disabled = true;
    document.getElementById('stopBtn').disabled = true;
}

function resetGame() { if (window.EJS_emulator) { window.EJS_emulator.reset(); document.getElementById('status').textContent = 'Game reset'; } }
function saveState() { try { if (window.EJS_emulator) { window.EJS_emulator.saveState(); } document.getElementById('status').textContent = 'Game saved!'; } catch(e) { } }
function loadState() { try { if (window.EJS_emulator) { window.EJS_emulator.loadState(); } document.getElementById('status').textContent = 'Game loaded!'; } catch(e) { } }

document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') { resetGame(); return; }
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
    if (button !== null) { window.EJS_emulator.input.keyDown(button); e.preventDefault(); }
});

document.addEventListener('keyup', (e) => {
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
    if (button !== null) { window.EJS_emulator.input.keyUp(button); e.preventDefault(); }
});

window.addEventListener('beforeunload', () => {
    if (isRunning && window.EJS_emulator) { try { window.EJS_emulator.saveState(); } catch(e) { } }
});

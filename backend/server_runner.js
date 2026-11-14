const { spawn } = require('child_process');
const path = require('path');

function start() {
  console.log('[server_runner] Launching Khata API server (dist/server.js)...');
  const p = spawn(process.execPath, ['dist/server.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    windowsHide: true,
  });

  p.on('exit', (code) => {
    console.log(`[server_runner] Server process exited with code ${code}. Auto-restarting in 1s...`);
    setTimeout(start, 1000);
  });
}

start();

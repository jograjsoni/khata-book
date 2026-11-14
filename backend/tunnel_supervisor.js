/**
 * Resilient Tunnel Supervisor for Khata Production Backend API
 * Uses verified active tunnel with heartbeat keepalive and auto-reconnect.
 */
const { spawn } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, 'tunnel.log');
const ENV_MOBILE = path.resolve(__dirname, '../mobile/.env');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(msg);
  try {
    fs.appendFileSync(LOG_FILE, line, 'utf-8');
  } catch {}
}

let tunnelProc = null;
let currentUrl = 'https://khata-api-9951.loca.lt';

function startTunnel() {
  log(`Starting localtunnel on port 4000 with subdomain khata-api-9951...`);

  tunnelProc = spawn('cmd.exe', [
    '/c',
    'npx',
    '--yes',
    'localtunnel',
    '--port',
    '4000',
    '--subdomain',
    'khata-api-9951'
  ], {
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  tunnelProc.stdout.on('data', (data) => {
    const text = data.toString();
    log(`[lt stdout] ${text.trim()}`);
    const match = text.match(/your url is:\s*(https:\/\/[^\s]+)/i);
    if (match && match[1]) {
      currentUrl = match[1].trim();
      log(`Active Tunnel URL: ${currentUrl}`);
      updateMobileEnv(currentUrl);
    }
  });

  tunnelProc.stderr.on('data', (data) => {
    log(`[lt stderr] ${data.toString().trim()}`);
  });

  tunnelProc.on('exit', (code, signal) => {
    log(`Tunnel process exited (${code}, ${signal}). Reconnecting in 3s...`);
    tunnelProc = null;
    setTimeout(startTunnel, 3000);
  });
}

function updateMobileEnv(url) {
  try {
    if (fs.existsSync(ENV_MOBILE)) {
      let content = fs.readFileSync(ENV_MOBILE, 'utf-8');
      if (content.includes('EXPO_PUBLIC_API_URL=')) {
        content = content.replace(/EXPO_PUBLIC_API_URL=.*/, `EXPO_PUBLIC_API_URL=${url}`);
      } else {
        content += `\nEXPO_PUBLIC_API_URL=${url}\n`;
      }
      fs.writeFileSync(ENV_MOBILE, content, 'utf-8');
      log(`Successfully updated ${ENV_MOBILE} to ${url}`);
    }
  } catch (err) {
    log(`Failed to update mobile .env: ${err.message}`);
  }
}

// 20-second active TCP keepalive ping
setInterval(() => {
  if (!currentUrl) return;

  const req = https.get(
    `${currentUrl}/health`,
    {
      headers: {
        'bypass-tunnel-reminder': 'true',
        'User-Agent': 'Khata-Tunnel-Keepalive/1.0',
      },
      timeout: 8000,
    },
    (res) => {
      res.resume();
    }
  );

  req.on('error', (err) => {
    log(`Keepalive ping notice: ${err.message}`);
  });
}, 20000);

startTunnel();

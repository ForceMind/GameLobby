import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const args = new Map(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    return [key, rest.join('=') || '1'];
  }),
);

const baseUrl = args.get('base') || 'http://127.0.0.1:8787';
const outDir = resolve(args.get('out') || 'qa-screens');
const chromePath = process.env.CHROME_PATH
  || args.get('chrome')
  || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const pages = (args.get('pages') || 'lobby,tournaments,events,shop,me').split(',').filter(Boolean);
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const remotePort = Number(args.get('port') || 9340);
const userDataDir = join(outDir, `.tmp-chrome-${remotePort}`);

mkdirSync(outDir, { recursive: true });

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function waitForChrome() {
  for (let index = 0; index < 80; index += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${remotePort}/json/version`);
      if (response.ok) return;
    } catch {
      // Chrome is still starting.
    }
    await sleep(100);
  }
  throw new Error('Chrome DevTools endpoint did not become ready.');
}

let messageId = 0;

async function connect(webSocketDebuggerUrl) {
  const ws = new WebSocket(webSocketDebuggerUrl);
  const pending = new Map();

  ws.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const handlers = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) handlers.reject(new Error(message.error.message));
      else handlers.resolve(message.result || {});
    }
  });

  await new Promise((resolveOpen, rejectOpen) => {
    ws.addEventListener('open', resolveOpen);
    ws.addEventListener('error', rejectOpen);
  });

  return {
    ws,
    send(method, params = {}) {
      const id = ++messageId;
      ws.send(JSON.stringify({ id, method, params }));
      return new Promise((resolveSend, rejectSend) => {
        pending.set(id, { resolve: resolveSend, reject: rejectSend });
      });
    },
  };
}

async function capture(url, fileName, viewport) {
  const target = await fetch(`http://127.0.0.1:${remotePort}/json/new?about:blank`, { method: 'PUT' })
    .then((response) => response.json());
  const client = await connect(target.webSocketDebuggerUrl);

  await client.send('Page.enable');
  await client.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
    screenWidth: viewport.width,
    screenHeight: viewport.height,
  });

  if (viewport.mobile) {
    await client.send('Emulation.setUserAgentOverride', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    });
  }

  await client.send('Page.navigate', { url });
  await sleep(Number(args.get('wait') || 2200));
  const screenshot = await client.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: true,
  });
  const filePath = join(outDir, fileName);
  writeFileSync(filePath, Buffer.from(screenshot.data, 'base64'));
  client.ws.close();
  return filePath;
}

const chrome = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  `--remote-debugging-port=${remotePort}`,
  `--user-data-dir=${userDataDir}`,
  'about:blank',
], { stdio: 'ignore' });

try {
  await waitForChrome();
  const written = [];
  for (const page of pages) {
    const pageUrl = `${baseUrl}/?server=local&tab=${encodeURIComponent(page)}&qa=${timestamp}`;
    written.push(await capture(pageUrl, `${timestamp}-mobile-${page}.png`, { width: 390, height: 1200, mobile: true }));
    written.push(await capture(pageUrl, `${timestamp}-desktop-${page}.png`, { width: 1440, height: 1100, mobile: false }));
  }
  written.push(await capture(`${baseUrl}/?admin=1&qa=${timestamp}`, `${timestamp}-mobile-admin.png`, { width: 390, height: 1200, mobile: true }));
  written.push(await capture(`${baseUrl}/?admin=1&qa=${timestamp}`, `${timestamp}-desktop-admin.png`, { width: 1440, height: 1100, mobile: false }));

  console.log(`Screenshots written to ${outDir}`);
  for (const filePath of written) console.log(filePath);
} finally {
  chrome.kill();
  await sleep(300);
  rmSync(userDataDir, { recursive: true, force: true });
}

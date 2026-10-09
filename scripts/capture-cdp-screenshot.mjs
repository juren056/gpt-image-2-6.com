import { writeFile } from 'node:fs/promises';

const [url, outputPath, widthValue, heightValue, fullValue = 'false'] =
  process.argv.slice(2);
const width = Number(widthValue);
const height = Number(heightValue);
const fullPage = fullValue === 'true';

if (!url || !outputPath || !width || !height) {
  throw new Error(
    'Usage: node capture-cdp-screenshot.mjs <url> <output> <width> <height> [full]'
  );
}

const targets = await fetch('http://127.0.0.1:9333/json/list').then(
  (response) => response.json()
);
const target = targets.find((item) => item.type === 'page');
if (!target?.webSocketDebuggerUrl)
  throw new Error('No Edge DevTools page target is available');

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let commandId = 0;
const pending = new Map();
socket.addEventListener('message', (event) => {
  const message = JSON.parse(String(event.data));
  if (!message.id) return;
  const request = pending.get(message.id);
  if (!request) return;
  pending.delete(message.id);
  if (message.error) request.reject(new Error(message.error.message));
  else request.resolve(message.result);
});

function send(method, params = {}) {
  commandId += 1;
  const id = commandId;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width,
  height,
  deviceScaleFactor: 1,
  mobile: width < 768,
  screenWidth: width,
  screenHeight: height,
});
await send('Page.navigate', { url });
await new Promise((resolve) => setTimeout(resolve, 2200));
await send('Runtime.evaluate', {
  expression: 'document.fonts.ready',
  awaitPromise: true,
});

if (fullPage) {
  await send('Runtime.evaluate', {
    expression: `(() => {
      const style = document.createElement('style');
      style.textContent = '* { content-visibility: visible !important; contain-intrinsic-size: none !important; }';
      document.head.appendChild(style);
      return document.documentElement.scrollHeight;
    })()`,
  });
  await new Promise((resolve) => setTimeout(resolve, 1200));
}

let clip;
if (fullPage) {
  const metrics = await send('Page.getLayoutMetrics');
  const size = metrics.cssContentSize || metrics.contentSize;
  clip = {
    x: 0,
    y: 0,
    width: Math.ceil(size.width),
    height: Math.ceil(size.height),
    scale: 1,
  };
}

const screenshot = await send('Page.captureScreenshot', {
  format: 'png',
  fromSurface: true,
  captureBeyondViewport: fullPage,
  ...(clip ? { clip } : {}),
});
await writeFile(outputPath, Buffer.from(screenshot.data, 'base64'));
socket.close();

console.log(`${width}x${height}${fullPage ? ' full' : ''} -> ${outputPath}`);

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const [
  baseUrl = 'http://127.0.0.1:4322',
  outputDir = '.artifacts/creative-ui',
] = process.argv.slice(2);
const publicModelIds = [
  'qwen-image-3-edit',
  'qwen-image-2.1',
  'gpt-image-2.5-flare',
  'gpt-image-2.5-sunburst',
  'nano-banana-2',
  'nano-banana-2.5',
  'nano-banana-2-lite',
  'nano-banana-pro',
  'seedream-5-pro',
  'flux-2-pro',
];

await mkdir(outputDir, { recursive: true });

const targets = await fetch('http://127.0.0.1:9333/json/list').then(
  (response) => response.json()
);
const target = targets.find((item) => item.type === 'page');
if (!target?.webSocketDebuggerUrl) throw new Error('No Edge page target');

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
  return new Promise((resolve, reject) => {
    pending.set(commandId, { resolve, reject });
    socket.send(JSON.stringify({ id: commandId, method, params }));
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

async function navigate(path, width, height) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
    screenWidth: width,
    screenHeight: height,
  });
  await send('Page.navigate', { url: `${baseUrl}${path}` });
  await new Promise((resolve) => setTimeout(resolve, 2400));
  await evaluate('document.fonts.ready.then(() => true)');
}

async function screenshot(name) {
  const result = await send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
  });
  await writeFile(join(outputDir, name), Buffer.from(result.data, 'base64'));
}

await send('Page.enable');
await send('Runtime.enable');

await navigate('/', 1440, 1000);
await evaluate(
  `document.querySelector('button[aria-haspopup="listbox"]')?.click(); true`
);
await new Promise((resolve) => setTimeout(resolve, 250));
const desktop = await evaluate(`(() => {
  const brandImages = [...document.querySelectorAll('img[src^="/brands/"]')];
  const picker = document.querySelector('button[aria-haspopup="listbox"]');
  return {
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    modelIds: [...new Set([...document.querySelectorAll('[data-model-visual]')].map((node) => node.dataset.modelVisual))],
    toolIds: [...new Set([...document.querySelectorAll('[data-tool-visual]')].map((node) => node.dataset.toolVisual))],
    brandImages: brandImages.length,
    brokenBrandImages: brandImages.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.getAttribute('src')),
    pickerExpanded: picker?.getAttribute('aria-expanded'),
    listboxOptions: document.querySelectorAll('[role="listbox"] [role="option"]').length,
  };
})()`);
assert(
  desktop.overflow <= 1,
  `Desktop horizontal overflow: ${desktop.overflow}px`
);
assert(
  publicModelIds.every((id) => desktop.modelIds.includes(id)),
  `Desktop is missing a public model visual: ${desktop.modelIds.join(', ')}`
);
assert(
  desktop.toolIds.length === 25,
  `Desktop tool visual coverage: ${desktop.toolIds.length}/25`
);
assert(
  desktop.brandImages >= 10,
  'Official brand images are missing from the homepage'
);
assert(
  desktop.brokenBrandImages.length === 0,
  `Broken brand assets: ${desktop.brokenBrandImages.join(', ')}`
);
assert(desktop.pickerExpanded === 'true', 'Model picker did not open');
assert(desktop.listboxOptions >= 1, 'Model picker has no options');
await screenshot('homepage-desktop.png');

await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape' });
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape' });
const toolsMenuPoint = await evaluate(`(() => {
  const button = [...document.querySelectorAll('nav[aria-label="Primary navigation"] button')].find((item) => item.textContent.includes('AI Tools'));
  const rect = button?.getBoundingClientRect();
  return rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null;
})()`);
assert(toolsMenuPoint, 'AI Tools navigation trigger is missing');
await send('Input.dispatchMouseEvent', {
  type: 'mouseMoved',
  x: toolsMenuPoint.x,
  y: toolsMenuPoint.y,
});
await new Promise((resolve) => setTimeout(resolve, 350));
const scrollStart = await evaluate(`(() => {
  const more = document.querySelector('button[aria-label="Scroll for more"]');
  const panel = more?.closest('.relative')?.querySelector('.menu-scrollbar');
  return { hints: document.querySelectorAll('button[aria-label="Scroll for more"]').length, top: panel?.scrollTop || 0 };
})()`);
assert(
  scrollStart.hints >= 1,
  'A scrollable navigation menu needs a bottom hint'
);
await screenshot('nav-scroll-hint-top.png');
await evaluate(
  `document.querySelector('button[aria-label="Scroll for more"]')?.click(); true`
);
await new Promise((resolve) => setTimeout(resolve, 700));
const scrollMiddle = await evaluate(`(() => {
  const up = document.querySelector('button[aria-label="Scroll up"]');
  const panel = up?.closest('.relative')?.querySelector('.menu-scrollbar');
  return { hasUpHint: Boolean(up), top: panel?.scrollTop || 0 };
})()`);
assert(
  scrollMiddle.hasUpHint && scrollMiddle.top > 0,
  'Scroll hint did not move the menu or reveal the up affordance'
);
await screenshot('nav-scroll-hint-middle.png');

await navigate('/tools', 1440, 1000);
const tools = await evaluate(`(() => ({
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  toolIds: [...new Set([...document.querySelectorAll('[data-tool-visual]')].map((node) => node.dataset.toolVisual))],
}))()`);
assert(
  tools.overflow <= 1,
  `Tools desktop horizontal overflow: ${tools.overflow}px`
);
assert(
  tools.toolIds.length === 25,
  `Tools directory visual coverage: ${tools.toolIds.length}/25`
);
await screenshot('tools-desktop.png');

await navigate('/add-shadow-to-image', 1440, 1000);
const dedicated = await evaluate(`(() => ({
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  iconCount: document.querySelectorAll('[data-tool-visual="T05"]').length,
  heading: document.querySelector('h1')?.textContent?.trim(),
}))()`);
assert(
  dedicated.overflow <= 1,
  `Tool page horizontal overflow: ${dedicated.overflow}px`
);
assert(
  dedicated.iconCount >= 2,
  'Dedicated tool icon is missing from hero or workspace'
);
assert(
  dedicated.heading?.includes('Shadow'),
  'Dedicated tool page did not render'
);
await screenshot('tool-desktop.png');

await navigate('/', 390, 844);
await evaluate(`(() => {
  const menu = [...document.querySelectorAll('button')].find((button) => button.getAttribute('aria-expanded') === 'false' && /menu/i.test(button.getAttribute('aria-label') || ''));
  menu?.click();
  return Boolean(menu);
})()`);
await new Promise((resolve) => setTimeout(resolve, 300));
const mobile = await evaluate(`(() => {
  const menu = [...document.querySelectorAll('button')].find((button) => /menu/i.test(button.getAttribute('aria-label') || ''));
  return {
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    menuExpanded: menu?.getAttribute('aria-expanded'),
    modelVisuals: document.querySelectorAll('[data-model-visual]').length,
    toolVisuals: document.querySelectorAll('[data-tool-visual]').length,
  };
})()`);
assert(
  mobile.overflow <= 1,
  `Mobile horizontal overflow: ${mobile.overflow}px`
);
assert(mobile.menuExpanded === 'true', 'Mobile menu did not open');
assert(mobile.modelVisuals >= 10, 'Mobile model menu visuals are missing');
assert(mobile.toolVisuals >= 25, 'Mobile tool menu visuals are missing');
await screenshot('homepage-mobile-menu.png');

const dark = await evaluate(`(() => {
  document.documentElement.classList.add('dark');
  const marks = [...document.querySelectorAll('img[src^="/brands/"]')];
  return marks.every((image) => image.complete && image.naturalWidth > 0);
})()`);
assert(dark, 'A brand mark failed to render in dark mode');
await screenshot('homepage-mobile-dark.png');

socket.close();
console.log(
  JSON.stringify({ desktop, tools, dedicated, mobile, dark }, null, 2)
);

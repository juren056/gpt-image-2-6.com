import { chromium } from 'playwright-core';
import path from 'path';
import { pathToFileURL } from 'url';

const root = path.dirname(new URL(import.meta.url).pathname);
const browser = await chromium.launch({
  executablePath: '/usr/local/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

async function shot(name, file, width) {
  const page = await browser.newPage({
    viewport: { width, height: width < 500 ? 844 : 900 },
    deviceScaleFactor: 1,
  });
  const url = pathToFileURL(path.join(root, name)).href;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: path.join(root, file),
    fullPage: true,
  });
  await page.close();
  console.log(file);
}

await shot('home.html', 'homepage-desktop.png', 1440);
await shot('home.html', 'homepage-mobile.png', 390);
await shot('pricing.html', 'pricing.png', 1440);
await shot('sign-in.html', 'sign-in.png', 1440);
await shot('checkout.html', 'checkout.png', 1440);
await shot('theme.html', 'theme-board.png', 1440);

const logo = await browser.newPage({
  viewport: { width: 512, height: 512 },
  deviceScaleFactor: 1,
});
await logo.goto(pathToFileURL(path.join(root, 'assets/logo.svg')).href);
await logo.screenshot({
  path: path.join(root, 'assets/logo-512.png'),
  omitBackground: true,
});
await browser.close();
console.log('done');

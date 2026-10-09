import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  GPT_IMAGE_OPPORTUNITIES,
  GPT_IMAGE_RELATED,
} from '../src/config/gpt-image-opportunities';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const pages = Object.values(GPT_IMAGE_OPPORTUNITIES);
assert(pages.length === 5, 'Expected five GPT Image opportunity pages');
assert(
  new Set(pages.map((page) => page.path)).size === pages.length,
  'Paths must be unique'
);
assert(
  new Set(pages.map((page) => page.title)).size === pages.length,
  'Each page must own a distinct primary keyword'
);

for (const page of pages) {
  const routePath = join(
    process.cwd(),
    'src',
    'routes',
    `${page.path.slice(1)}.tsx`
  );
  assert(existsSync(routePath), `Missing route ${page.path}`);
  assert(
    page.description.length >= 120 && page.description.length <= 180,
    `${page.path} needs a useful meta description`
  );
  assert(page.outcomes.length >= 3, `${page.path} needs outcome content`);
  assert(page.steps.length >= 4, `${page.path} needs a complete workflow`);
  assert(page.faqs.length >= 4, `${page.path} needs FAQ coverage`);
  assert(
    existsSync(join(process.cwd(), 'public', page.image.slice(1))),
    `${page.path} image is missing`
  );
}

const fourK = GPT_IMAGE_OPPORTUNITIES['four-k'];
assert(
  /does not claim.*native 4K/i.test(fourK.limitation),
  '4K page must not promise native 4K output'
);

const pricing = GPT_IMAGE_OPPORTUNITIES['api-pricing'];
assert(
  pricing.badges.includes('$30 / 1M image output tokens'),
  'Pricing snapshot must retain verified image output rate'
);

for (const page of pages) {
  assert(
    GPT_IMAGE_RELATED.some((item) => item.href === page.path),
    `${page.path} needs internal-link registration`
  );
}

const generator = readFileSync(
  join(process.cwd(), 'src', 'components', 'public-model-generator.tsx'),
  'utf8'
);
assert(
  generator.includes('initialMode') && generator.includes('initialPrompt'),
  'Real generator must support task-specific defaults'
);

const sitemap = readFileSync(
  join(process.cwd(), 'src', 'routes', 'sitemap[.]xml.ts'),
  'utf8'
);
assert(
  sitemap.includes('GPT_IMAGE_OPPORTUNITIES'),
  'Sitemap must include the opportunity registry'
);

console.log(
  'GPT Image 2.5 opportunity pages: 5 routes, content, assets, generator defaults, and sitemap verified'
);

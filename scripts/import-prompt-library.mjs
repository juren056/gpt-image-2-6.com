import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Source snapshots are data only. Never execute code from the source repositories.
const root = process.cwd();
const research = path.join(root, '.artifacts/prompt-research');
const licenseUrl = 'https://creativecommons.org/licenses/by/4.0/';
const collections = [
  {
    folder: 'trending',
    name: 'MeiGen.ai — NanoBanana Trending Prompts',
    url: 'https://github.com/jau123/nanobanana-trending-prompts',
  },
  {
    folder: 'youmind',
    name: 'YouMind OpenLab — Nano Banana Pro Prompts',
    url: 'https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts',
  },
];
const hash = (value) => createHash('sha256').update(value).digest('hex');
const cdns = new Set(['images.meigen.ai', 'cms-assets.youmind.com']);
const categoryMap = {
  Photography: 'Photography',
  'Illustration & 3D': 'Illustration',
  'Product & Brand': 'Ecommerce',
  'Food & Drink': 'Food',
  'Poster Design': 'Social',
  'UI & Graphic': 'Design',
};
const excluded =
  /\b(nude|nudity|naked|lingerie|underwear|bikini|nsfw|sexual|erotic|seductive|cleavage|pornographic|gore)\b/i;
function classify(prompt, categories = []) {
  if (
    /\b(scientific diagram|scientific illustration|research diagram|technical infographic|anatomical diagram)\b/i.test(
      prompt
    )
  )
    return 'Science';
  if (
    /\b(logo design|brand identity|branding kit|design.{0,20}logo|logo.{0,20}design)\b/i.test(
      prompt
    )
  )
    return 'Brand';
  if (/\b(architecture|interior design|living room|floor plan)\b/i.test(prompt))
    return 'Architecture';
  return (
    categoryMap[categories[0]] ||
    (/\b(food|drink|recipe|cuisine)\b/i.test(prompt)
      ? 'Food'
      : /\b(product|packaging|advertisement)\b/i.test(prompt)
        ? 'Ecommerce'
        : /\b(poster|thumbnail|quote card)\b/i.test(prompt)
          ? 'Social'
          : /\b(character|avatar|chibi|anime)\b/i.test(prompt)
            ? 'Characters'
            : 'Design')
  );
}
function titleFor(prompt, category) {
  const formats = [
    [/exploded|teardown|cutaway/i, 'Exploded product and cutaway illustration'],
    [
      /typographic|typography|type designer/i,
      'Expressive typography composition',
    ],
    [/infographic/i, 'Detailed visual infographic'],
    [/brand identity|branding kit/i, 'Brand identity and visual system'],
    [/logo design/i, 'Custom logo design'],
    [/isometric/i, 'Isometric miniature scene'],
    [/storyboard|comic panel/i, 'Character storyboard composition'],
    [/gameboy|pixel art/i, 'Retro pixel art scene'],
    [/fashion editorial/i, 'Fashion editorial composition'],
    [/product photography|product photo/i, 'Studio product photography'],
    [/watercolor/i, 'Watercolor illustration'],
  ];
  for (const [pattern, title] of formats)
    if (pattern.test(prompt)) return `${title} · ${category}`;
  try {
    const object = JSON.parse(prompt);
    const title =
      object.title ||
      object.name ||
      object.description ||
      object.subject ||
      object.scene?.description ||
      object.prompt ||
      object.style;
    if (typeof title === 'string')
      return title.replace(/\s+/g, ' ').slice(0, 90);
  } catch {
    /* Plain text prompts are expected. */
  }
  const title = prompt
    .replace(/```[^\n]*|[{}"#*]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/[\n!?。]/)[0];
  return title.length > 18
    ? title.slice(0, 88).replace(/\s+\S*$/, '')
    : `${category} creative brief`;
}
const entries = [];
const editorialExclusions = JSON.parse(
  await readFile(
    path.join(root, 'src/config/prompt-library-exclusions.json'),
    'utf8'
  )
);
const snapshots = [];
for (const collection of collections) {
  const directory = path.join(research, collection.folder);
  const revision = execFileSync('git', ['-C', directory, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
  const license = await readFile(path.join(directory, 'LICENSE'), 'utf8');
  if (!license.includes('CC BY 4.0'))
    throw new Error(`License mismatch: ${collection.name}`);
  const common = {
    collection: collection.name,
    collectionUrl: collection.url,
    revision,
    license: 'CC BY 4.0',
    licenseUrl,
  };
  let sourceEntries;
  if (collection.folder === 'trending') {
    const data = JSON.parse(
      await readFile(path.join(directory, 'prompts/prompts.json'), 'utf8')
    );
    sourceEntries = data.map((item) => ({
      ...common,
      sourceId: item.id,
      prompt: item.prompt.trim(),
      sourceImage: item.image,
      sourceUrl: item.source_url,
      author: item.author_name || item.author,
      authorUrl: `https://x.com/${item.author}`,
      sourceModel: item.model === 'nanobanana' ? 'Nano Banana' : 'GPT Image',
      category: classify(item.prompt, item.categories),
      tags: item.categories || [],
      date: item.date,
      popularity: item.likes || 0,
      changes:
        'New display title and category; original prompt retained. Preview resized; original image retained.',
    }));
  } else {
    const readme = await readFile(path.join(directory, 'README.md'), 'utf8');
    sourceEntries = readme
      .split(/(?=^### No\. \d+:)/m)
      .slice(1)
      .map((section) => {
        const title = section.match(/^### No\. \d+: (.*)/)?.[1]?.trim();
        const originalPrompt = section
          .match(/#### 📝 Prompt\s*```[^\n]*\n([\s\S]*?)```/)?.[1]
          ?.trim();
        const prompt = originalPrompt?.replace(
          /\{argument\s+name="([^"]*)"\s+default="([^"]*)"\}/g,
          (_, name, value) => value || `[${name}]`
        );
        const sourceImage = section.match(/<img src="([^"]+)"/)?.[1];
        const authorMatch = section.match(
          /\*\*Author:\*\*\s*\[([^\]]+)\]\(([^)]+)\)/
        );
        const sourceUrl = section.match(
          /\*\*Source:\*\*\s*\[[^\]]+\]\(([^)]+)\)/
        )?.[1];
        return {
          ...common,
          title,
          prompt,
          originalPrompt:
            originalPrompt !== prompt ? originalPrompt : undefined,
          sourceImage,
          sourceId: sourceUrl,
          sourceUrl,
          author: authorMatch?.[1] || 'Community contributor',
          authorUrl: authorMatch?.[2] || collection.url,
          sourceModel: 'Nano Banana Pro',
          category: classify(`${title} ${prompt}`),
          tags: [],
          date: section.match(/\*\*Published:\*\*\s*(.*)/)?.[1]?.trim() || '',
          popularity: 0,
          changes:
            'Category added; editable argument tags replaced with defaults where present. Preview resized; original image retained.',
        };
      });
  }
  snapshots.push({ ...common, available: sourceEntries.length });
  entries.push(...sourceEntries);
}
const seen = new Set();
const rejected = [];
const candidates = entries.filter((item) => {
  if (editorialExclusions[item.sourceId]) {
    rejected.push({
      source: item.sourceId,
      reason: editorialExclusions[item.sourceId],
    });
    return false;
  }
  if (
    !item.prompt ||
    !item.sourceImage ||
    !item.sourceUrl ||
    item.prompt.length > 32000 ||
    excluded.test(item.prompt)
  ) {
    rejected.push({
      source: item.sourceId,
      reason:
        'Incomplete, unsupported length or unsuitable public-gallery content',
    });
    return false;
  }
  if (
    !/^https:\/\//.test(item.sourceUrl) ||
    !/^https:\/\//.test(item.authorUrl)
  )
    return false;
  const identity = hash(item.prompt.toLowerCase().replace(/\s+/g, ' ').trim());
  if (seen.has(identity)) {
    rejected.push({ source: item.sourceId, reason: 'Duplicate prompt' });
    return false;
  }
  seen.add(identity);
  item.id = `prompt-${identity.slice(0, 16)}`;
  item.title ||= titleFor(item.prompt, item.category);
  item.referenceRequired =
    /\b(uploaded|attached|reference|provided|input|supplied|original)\s+(image|photo|portrait|picture|face)|\b(same face|preserve identity|keep.*identity)\b/i.test(
      item.prompt
    );
  item.operation = item.referenceRequired ? 'edit' : 'generate';
  return true;
});
const originals = path.join(root, 'public/imgs/prompt-library/originals');
const previews = path.join(root, 'public/imgs/prompt-library/previews');
await Promise.all([
  mkdir(originals, { recursive: true }),
  mkdir(previews, { recursive: true }),
  mkdir(path.join(root, 'public/data'), { recursive: true }),
]);
const completed = [];
let previousImages = new Map();
try {
  const previous = JSON.parse(
    await readFile(
      path.join(root, 'public/data/prompt-library-v1.json'),
      'utf8'
    )
  ).data;
  previousImages = new Map(
    previous.items.map((item) => [item.id, item.originalImage])
  );
} catch {
  /* First import has no image cache. */
}
const failures = [];
let cursor = 0;
async function download(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !cdns.has(parsed.hostname))
    throw new Error('Unapproved source image host');
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(45000),
        redirect: 'error',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (Number(response.headers.get('content-length')) > 20 * 1024 * 1024)
        throw new Error('Asset too large');
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length > 20 * 1024 * 1024) throw new Error('Asset too large');
      return bytes;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
}
async function worker() {
  while (cursor < candidates.length) {
    const item = candidates[cursor++];
    try {
      const originalFile = previousImages.has(item.id)
        ? path.join(root, 'public', previousImages.get(item.id))
        : path.join(originals, `${item.id}.jpg`);
      let bytes;
      try {
        bytes = await readFile(originalFile);
      } catch {
        bytes = await download(item.sourceImage);
      }
      const metadata = await sharp(bytes, {
        limitInputPixels: 100000000,
      }).metadata();
      if (
        !['jpeg', 'png', 'webp'].includes(metadata.format) ||
        !metadata.width ||
        !metadata.height
      )
        throw new Error('Unsupported image');
      const extension = { jpeg: 'jpg', png: 'png', webp: 'webp' }[
        metadata.format
      ];
      const finalOriginal = path.join(originals, `${item.id}.${extension}`);
      await writeFile(finalOriginal, bytes);
      const previewFile = path.join(previews, `${item.id}.webp`);
      try {
        await stat(previewFile);
      } catch {
        await sharp(bytes)
          .rotate()
          .resize({
            width: 600,
            height: 600,
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: 78 })
          .toFile(previewFile);
      }
      completed.push({
        ...item,
        image: `/imgs/prompt-library/previews/${item.id}.webp`,
        originalImage: `/imgs/prompt-library/originals/${item.id}.${extension}`,
        width: metadata.width,
        height: metadata.height,
        imageSha256: hash(bytes),
      });
    } catch (error) {
      failures.push({
        id: item.id,
        sourceImage: item.sourceImage,
        error: error.message,
      });
    }
    if ((completed.length + failures.length) % 50 === 0)
      console.log(
        `Images verified: ${completed.length}; failed: ${failures.length}; queued: ${candidates.length - cursor}`
      );
  }
}
console.log(
  `Source records: ${entries.length}; eligible unique records: ${candidates.length}`
);
await Promise.all(Array.from({ length: 12 }, worker));
if (completed.length < 100)
  throw new Error(
    `Only ${completed.length} paired examples available; minimum is 100`
  );
// Start with a varied set of high-interest Nano Banana examples, then retain the rest.
completed.sort(
  (a, b) =>
    (a.sourceModel.startsWith('Nano') ? 0 : 1) -
      (b.sourceModel.startsWith('Nano') ? 0 : 1) ||
    b.popularity - a.popularity ||
    a.id.localeCompare(b.id)
);
const curation = JSON.parse(
  await readFile(
    path.join(root, 'src/config/prompt-library-curation.json'),
    'utf8'
  )
);
for (const [id, title, category] of curation) {
  const item = completed.find((row) => row.id === id);
  if (item) {
    item.title = title;
    item.category = category;
  }
}
const groups = new Map();
for (const item of completed) {
  if (!groups.has(item.category)) groups.set(item.category, []);
  groups.get(item.category).push(item);
}
const featured = curation
  .map(([id]) => completed.find((row) => row.id === id))
  .filter(Boolean);
for (let round = 0; round < 4; round++)
  for (const group of groups.values())
    if (group[round] && !featured.some((item) => item.id === group[round].id))
      featured.push(group[round]);
const featuredIds = new Set(featured.map((item) => item.id));
const ordered = [
  ...featured,
  ...completed.filter((item) => !featuredIds.has(item.id)),
];
const categories = Object.fromEntries(
  [...groups].map(([key, rows]) => [key, rows.length])
);
const revision = hash(JSON.stringify(ordered)).slice(0, 12);
const data = {
  revision,
  total: ordered.length,
  categories,
  collections: snapshots.map((source) => ({
    ...source,
    imported: completed.filter((item) => item.collection === source.collection)
      .length,
  })),
  items: ordered,
};
await writeFile(
  path.join(root, 'public/data/prompt-library-v1.json'),
  JSON.stringify({ code: 0, data })
);
await writeFile(
  path.join(root, 'src/config/prompt-library-manifest.ts'),
  `// Generated by scripts/import-prompt-library.mjs.\nexport const PROMPT_LIBRARY_MANIFEST = ${JSON.stringify({ revision, total: data.total, categories, featured: ordered.slice(0, 24) }, null, 2)} as const;\n`
);
const credits = await Promise.all(
  collections.map(
    async (source) =>
      `${source.name}\n${source.url}\n${await readFile(path.join(research, source.folder, 'LICENSE'), 'utf8')}`
  )
);
await writeFile(
  path.join(root, 'public/data/prompt-library-credits.txt'),
  `Community example images and prompts, not original works of this site.\nEach example retains its individual creator and original publication link in the catalog.\nChanges: display titles/categories, editable argument normalization, and resized WebP previews. Original image bytes retained.\n\n${credits.join('\n\n---\n\n')}`
);
await writeFile(
  path.join(research, 'import-report.json'),
  JSON.stringify(
    {
      revision,
      total: data.total,
      categories,
      sources: data.collections,
      rejected,
      failures,
    },
    null,
    2
  )
);
console.log(
  JSON.stringify({
    total: data.total,
    categories,
    sources: data.collections.map(({ collection, imported }) => ({
      collection,
      imported,
    })),
    failures: failures.length,
  })
);

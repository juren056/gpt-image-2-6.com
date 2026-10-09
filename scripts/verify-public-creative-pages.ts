import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  CREATIVE_TOOL_VISUALS,
  getModelVisual,
} from '../src/components/creative-visuals';
import { CREATIVE_EXAMPLES } from '../src/config/creative-examples';
import { CREATIVE_MODELS } from '../src/config/creative-studio';
import { CREATIVE_TOOLS } from '../src/config/creative-tools';
import {
  PUBLIC_MODEL_PAGES,
  PUBLIC_TOOL_PAGES,
} from '../src/config/public-creative';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(PUBLIC_MODEL_PAGES.length === 10, 'M01-M10 public model coverage');
assert(PUBLIC_TOOL_PAGES.length === 25, 'T01-T25 public tool coverage');
assert(
  new Set(PUBLIC_MODEL_PAGES.map((item) => item.id)).size === 10,
  'Model public IDs must be unique'
);
assert(
  new Set(PUBLIC_TOOL_PAGES.map((item) => item.id)).size === 25,
  'Tool public IDs must be unique'
);
assert(
  new Set([
    ...PUBLIC_MODEL_PAGES.map((item) => item.path),
    ...PUBLIC_TOOL_PAGES.map((item) => item.path),
  ]).size === 35,
  'Every model/tool needs a distinct public URL'
);

const qwen21 = PUBLIC_MODEL_PAGES.find((item) => item.id === 'qwen-image-2.1');
assert(
  qwen21?.availability === 'preview',
  'Qwen Image 2.1 must remain an API preview'
);
assert(
  qwen21?.path === '/qwen-image-2-1-generator',
  'Qwen Image 2.1 canonical route'
);
assert(
  existsSync(join(process.cwd(), 'public', qwen21.image.replace(/^\//, ''))),
  'Qwen Image 2.1 preview visual is missing'
);

for (const page of PUBLIC_MODEL_PAGES) {
  const visual = getModelVisual(page.id);
  assert(visual.brand && visual.src, `${page.id} needs a provider brand mark`);
  assert(
    existsSync(join(process.cwd(), 'public', visual.src.replace(/^\//, ''))),
    `${page.id} brand asset is missing: ${visual.src}`
  );
  assert(
    CREATIVE_MODELS.some((model) => model.id === page.id),
    `${page.id} must use a real runtime model`
  );
  const route = join(
    process.cwd(),
    'src',
    'routes',
    `${page.path.slice(1)}.tsx`
  );
  assert(existsSync(route), `Missing explicit route ${page.path}`);
  assert(
    CREATIVE_EXAMPLES.some(
      (example) =>
        example.modelId === page.id &&
        example.publicAsset &&
        example.promptOrRecipe &&
        Object.keys(example.parameters).length > 0
    ),
    `${page.id} needs labelled example metadata`
  );
}

for (const page of PUBLIC_TOOL_PAGES) {
  assert(
    Boolean(CREATIVE_TOOL_VISUALS[page.id]?.icon),
    `${page.id} needs a semantic tool icon`
  );
  assert(
    CREATIVE_TOOLS.some((tool) => tool.id === page.id),
    `${page.id} must map to the retained capability registry`
  );
  const route = join(
    process.cwd(),
    'src',
    'routes',
    `${page.path.slice(1)}.tsx`
  );
  assert(existsSync(route), `Missing explicit route ${page.path}`);
}

const homepage = readFileSync(
  join(process.cwd(), 'src', 'blocks', 'homepage-discovery.tsx'),
  'utf8'
);
assert(
  homepage.includes('PUBLIC_MODEL_PAGES') &&
    homepage.includes('PUBLIC_TOOL_PAGES') &&
    homepage.includes('ModelBrandTile') &&
    homepage.includes('CreativeToolTile'),
  'Homepage must render both complete public registries'
);

const generator = readFileSync(
  join(process.cwd(), 'src', 'components', 'image-generator-workspace.tsx'),
  'utf8'
);
assert(
  generator.includes('<ModelPicker') &&
    !generator.includes('<select\n                  value={selectedModel?.id}'),
  'Homepage model choice must use the branded accessible picker'
);

const studio = readFileSync(
  join(process.cwd(), 'src', 'components', 'creative-studio-workspace.tsx'),
  'utf8'
);
for (const banned of [
  '25 workflows',
  'immutable asset versions',
  'Run bounded pipeline',
  'Apply local workflow',
]) {
  assert(
    !studio.includes(banned),
    `Public Studio copy still contains: ${banned}`
  );
}

console.log(
  'public creative routes and visuals: 10 models + 25 tools verified'
);

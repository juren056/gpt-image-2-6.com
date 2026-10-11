import { readFile, writeFile } from 'node:fs/promises';

const rows = [
  [
    'hero.badge',
    'Nano Banana 2.1 · Nano Banana 2, Pro and Lite in one workspace',
    'Nano Banana 2.1 · 同一个工作空间里的 2、Pro 和 Lite',
  ],
  ['hero.name', 'Nano Banana 2.1', 'Nano Banana 2.1'],
  ['hero.heading', 'AI Image Generator', 'AI 图片生成器'],
  [
    'hero.intro',
    'Turn an idea into an image. Write a prompt, bring your references, and choose the Nano Banana model that fits. Keep faces, products and the words in your picture in focus.',
    '将创意变成图片。输入提示词、添加参考图，选择适合的 Nano Banana 模型，让人物、产品与画面中的文字更贴近你的想法。',
  ],
  ['hero.start', 'Start generating', '开始创作'],
  ['intro.title', 'What is Nano Banana 2.1?', '什么是 Nano Banana 2.1？'],
  [
    'intro.body',
    'Nano Banana 2.1 is Google’s latest update to the Nano Banana image family. It creates and edits images from text and references, with improvements to realism, prompt following and text rendering. This workspace opens on 2.1 and keeps Nano Banana 2, Pro and Lite in the same model menu. Each model’s availability is shown before you generate.',
    'Nano Banana 2.1 是 Google 对 Nano Banana 图片模型系列的最新更新，可以通过文字和参考图生成、编辑图片，改善真实感、指令遵循与文字呈现。工作空间默认选择 2.1，也可在同一菜单选择 Nano Banana 2、Pro 或 Lite。生成前会显示每个模型的实际可用状态。',
  ],
  [
    'intro.tags',
    'Nano Banana 2.1|Google|Reference images|Text in images|Image editing',
    'Nano Banana 2.1|Google|参考图片|图中文字|图像编辑',
  ],
  ['intro.start', 'Open the generator', '打开生成器'],
  ['steps.eyebrow', 'Four steps', '四步开始'],
  [
    'steps.title',
    'How to make an image with the Nano Banana 2.1 generator',
    '如何使用 Nano Banana 2.1 图片生成器',
  ],
  [
    'steps.intro',
    'Describe the idea, add references, choose your settings, and review the result.',
    '描述创意、添加参考、选择设置，然后检查结果。',
  ],
  ['steps.0.title', 'Describe the image', '描述你想要的图片'],
  [
    'steps.0.body',
    'Start with the subject, then add the setting, lighting and style. Put exact words in quotes and say where they belong.',
    '先描述主体，再补充场景、光线和风格。需要出现在画面里的文字请用引号括起，并说明位置。',
  ],
  ['steps.1.title', 'Bring your references', '添加参考图片'],
  [
    'steps.1.body',
    'Switch to Image to image and choose your photos. Name each reference in the prompt so the model knows what to preserve.',
    '切换到图生图并选择照片。在提示词中说明每张参考图的作用，让模型理解需要保留的部分。',
  ],
  ['steps.2.title', 'Choose a model and shape', '选择模型与画幅'],
  [
    'steps.2.body',
    'Choose 2.1, 2, Pro or Lite. Pick an available aspect ratio and check the model’s status and credit quote before running.',
    '选择 2.1、2、Pro 或 Lite，再选择支持的画幅。运行前检查模型状态与积分报价。',
  ],
  ['steps.3.title', 'Review and download', '检查并下载'],
  [
    'steps.3.body',
    'When generation is available, inspect the result beside your prompt. Check faces, product details and spelling before downloading.',
    '模型可用时，结果会显示在提示词旁边。下载前检查人物、产品细节与拼写；需要调整时逐项修改。',
  ],
  ['steps.start', 'Make your first image', '创作第一张图片'],
  ['models.eyebrow', 'The Nano Banana family', 'Nano Banana 模型系列'],
  [
    'models.title',
    'Which Nano Banana model should you pick?',
    '应该选择哪个 Nano Banana 模型？',
  ],
  [
    'models.intro',
    'Four models in one menu. Pick for the task, and check availability before you generate.',
    '四种模型，同一个菜单。按任务选择，生成前确认可用状态。',
  ],
  ['models.best', 'Best for', '适用方向'],
  ['models.references', 'Reference limit', '参考图上限'],
  ['models.credits', 'Credits per image', '每张图片积分'],
  ['models.default', 'Default', '默认'],
  ['models.select', 'Explore this model', '了解此模型'],
  ['models.pending', 'Quote pending', '报价待开通'],
  [
    'models.0.title',
    'The newest Nano Banana update',
    '最新的 Nano Banana 更新',
  ],
  [
    'models.0.body',
    'Creating and editing with text and references',
    '使用文字与参考图生成和编辑',
  ],
  ['models.1.title', 'A balanced creative workflow', '均衡的图片创作流程'],
  [
    'models.1.body',
    'Everyday generation and reference editing',
    '日常生成与参考图编辑',
  ],
  ['models.2.title', 'Detail-focused professional work', '重视细节的专业创作'],
  [
    'models.2.body',
    'Product details and complex visual briefs',
    '产品细节与复杂视觉任务',
  ],
  ['models.3.title', 'A lightweight draft workflow', '轻量的草图创作流程'],
  [
    'models.3.body',
    'Quick concepts and early iterations',
    '快速概念图与早期迭代',
  ],
  [
    'comparison.title',
    'Nano Banana 2.1 vs Nano Banana 2',
    'Nano Banana 2.1 与 Nano Banana 2 对比',
  ],
  [
    'comparison.body',
    'Understand what changed, where references matter, and how to compare both models using the same prompt. A practical guide without invented benchmark results.',
    '了解更新内容、参考图差异，以及如何使用相同提示词进行比较。通过实际选择标准理解两种模型。',
  ],
  ['comparison.link', 'Read the comparison', '查看对比指南'],
  ['capabilities.eyebrow', 'Inside the generator', '生成器功能'],
  [
    'capabilities.title',
    'Start with words, a photo, or both',
    '从文字、照片，或两者开始',
  ],
  [
    'capabilities.intro',
    'One focused workflow for creating an image and refining a reference.',
    '用同一个清晰的流程生成图片、修改参考图。',
  ],
  ['capabilities.0.title', 'Text to image', '文字生成图片'],
  [
    'capabilities.0.body',
    'Name the subject first. Add composition, lighting and style, then leave room for the model to build the scene.',
    '先说明主体，再补充构图、光线和风格，为模型组织画面留出清晰的空间。',
  ],
  ['capabilities.1.title', 'Edit a reference', '编辑参考图片'],
  [
    'capabilities.1.body',
    'Upload a photo and describe the change. Be specific about the details that must stay the same.',
    '上传照片并描述修改需求，同时明确哪些细节必须保留。',
  ],
  ['capabilities.2.title', 'Keep a character consistent', '保持角色一致'],
  [
    'capabilities.2.body',
    'Reuse the same reference and describe the face, outfit and proportions you want to preserve in each scene.',
    '重复使用同一张参考图，说明每个场景需要保留的人物面容、服装与比例。',
  ],
  ['capabilities.3.title', 'Put exact words in quotes', '用引号标记准确文字'],
  [
    'capabilities.3.body',
    'Quote headlines and labels, describe where they go, then proofread the generated spelling and alignment.',
    '将标题和标签文字用引号括起，说明位置，生成后检查拼写与对齐。',
  ],
  ['cases.eyebrow', 'Where it helps', '创作场景'],
  [
    'cases.title',
    'What you can make with Nano Banana',
    '用 Nano Banana 可以创作什么',
  ],
  [
    'cases.intro',
    'Product scenes, consistent characters, localized packaging and social images.',
    '产品场景、一致角色、多语言包装，以及社交媒体图片。',
  ],
  [
    'cases.0.title',
    'Online shops: put the product in a styled scene',
    '电商图片：为产品搭建场景',
  ],
  [
    'cases.0.body',
    'Build a product brief around the real object. Use references for shape, label and color, then describe the surface and props.',
    '围绕真实产品组织任务，用参考图明确形状、标签与颜色，再描述材质和道具。',
  ],
  [
    'cases.0.alt',
    'Skincare bottle on a stone pedestal with lemons and eucalyptus',
    '柠檬和桉树叶旁，石质展台上的护肤品瓶',
  ],
  [
    'cases.1.title',
    'Storyboards: one character, several scenes',
    '分镜创作：同一个角色，不同场景',
  ],
  [
    'cases.1.body',
    'Reuse a character reference across a series. Change the action and setting while checking the face and outfit each time.',
    '在系列图片中重复使用角色参考，改变动作与环境，同时逐张检查面容和服装。',
  ],
  [
    'cases.1.alt',
    'Four illustrated panels showing a girl in a yellow coat',
    '四格插画中的黄外套女孩',
  ],
  [
    'cases.2.title',
    'Packaging: adapt the words and keep the design',
    '包装设计：调整文字，保留视觉风格',
  ],
  [
    'cases.2.body',
    'Provide the original packaging and translated copy. Ask for the same layout, then manually verify every translated label.',
    '提供原包装和翻译文案，要求保留原有布局，再人工核对每个标签的翻译。',
  ],
  [
    'cases.2.alt',
    'English and French banana chip packaging side by side',
    '并排展示的英文与法文香蕉片包装',
  ],
  [
    'cases.3.title',
    'Social images: the shape your channel needs',
    '社交图片：适配发布平台的画幅',
  ],
  [
    'cases.3.body',
    'Prepare a square post, a portrait story or a wide cover. Keep the subject and important text away from crop edges.',
    '准备方形帖子、竖屏故事或横向封面，让主体与重要文字避开裁切边缘。',
  ],
  [
    'cases.3.alt',
    'Banana and berry smoothie bowl on yellow linen',
    '黄色亚麻布上的香蕉莓果碗',
  ],
  [
    'cases.caption',
    'Visual examples from the reference site, shown as illustrations. These are not generated results or benchmarks from this service.',
    '以上为对标站的视觉示意素材，不代表本站生成结果或模型测评。',
  ],
  ['pricing.eyebrow', 'Pricing', '价格方案'],
  ['pricing.title', 'Nano Banana workspace plans', 'Nano Banana 工作空间方案'],
  [
    'pricing.intro',
    'Explore membership and credit options. The generator shows the actual model quote; checkout availability depends on the connected payment provider.',
    '查看会员与积分选项。生成器显示实际模型报价；结账可用状态取决于支付服务是否接通。',
  ],
  ['faq.title', 'Nano Banana 2.1 questions', 'Nano Banana 2.1 常见问题'],
  ['closing.eyebrow', 'Ready when you are', '开始创作'],
  [
    'closing.title',
    'Bring your idea. Shape the picture.',
    '带上创意，构建你的画面。',
  ],
  [
    'closing.intro',
    'Write a clear prompt, add the references that matter, and choose a model for your next image.',
    '写出清晰的提示词，添加重要的参考图，为下一张图片选择合适的模型。',
  ],
  ['closing.prompts', 'Prompt recipes', '提示词示例'],
  ['closing.science', 'Scientific figures', '科学插图'],
  ['closing.guide', 'How to use', '使用指南'],
  ['closing.pro', '2.1 vs Pro', '2.1 与 Pro 对比'],
];
const own = { en: {}, zh: {} };
for (const [key, en, zh] of rows) {
  own.en[key] = en;
  own.zh[key] = zh;
}
await writeFile(
  '.artifacts/replica/home-copy.json',
  JSON.stringify(own, null, 2) + '\n'
);
const fragments = [own];
for (const name of ['generator', 'chrome', 'features'])
  fragments.push(
    JSON.parse(await readFile(`.artifacts/replica/${name}-copy.json`, 'utf8'))
  );
for (const locale of ['en', 'zh']) {
  const file = `messages/${locale}.json`;
  const messages = JSON.parse(await readFile(file, 'utf8'));
  for (const fragment of fragments)
    for (const [key, value] of Object.entries(fragment[locale]))
      messages[`banana.${key}`] = value;
  messages['nano_site.home.heading'] =
    locale === 'zh'
      ? 'Nano Banana 2.1 AI 图片生成器'
      : 'Nano Banana 2.1 AI Image Generator';
  messages['nano_site.home.intro'] = own[locale]['hero.intro'];
  messages['nano_site.home.title'] =
    locale === 'zh'
      ? 'Nano Banana 2.1 AI 图片生成器与编辑器'
      : 'Nano Banana 2.1 AI Image Generator & Editor';
  messages['nano_site.home.description'] =
    locale === 'zh'
      ? '使用 Nano Banana 2.1 工作空间，通过文字和参考图创作图片，对比 Pro、2 与 Lite，浏览提示词和编辑指南，开始你的图像任务。'
      : 'Create and edit with the Nano Banana 2.1 workspace. Explore reference editing, prompt recipes, model comparisons and image generation in one focused interface.';
  await writeFile(file, JSON.stringify(messages, null, 2) + '\n');
}
const english = JSON.parse(await readFile('messages/en.json', 'utf8'));
const keys = Object.keys(english)
  .filter((key) => key.startsWith('banana.'))
  .sort();
const cases = keys
  .map(
    (key) =>
      `    case ${JSON.stringify(key.slice(7))}: return m[${JSON.stringify(key)}]({}, {locale: language});`
  )
  .join('\n');
await writeFile(
  'src/blocks/banana-messages.ts',
  `// Generated by scripts/merge-banana-replica.mjs.\nimport { m } from '@/paraglide/messages.js';\nimport { getLocale } from '@/paraglide/runtime.js';\n\nexport function bananaText(key: string, locale: string = getLocale()): string {\n  const language = locale === 'zh' ? 'zh' : 'en';\n  switch (key) {\n${cases}\n    default: throw new Error('Missing banana message: ' + key);\n  }\n}\n`
);
console.log(
  `Merged ${keys.length} bilingual replica messages with static accessors.`
);

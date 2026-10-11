import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const en = {
  scenes: 'Create by task',
  title: 'Nano Banana 2.1. A workspace for every idea.',
  intro:
    'Choose your task, shape a clear brief and keep creating from the result. Your projects, references and saved images stay together.',
  start: 'Use this brief',
  guide: 'Explore this workflow',
  example: 'Illustrated workflow · editable example brief',
  projects: 'Continue a project',
  library: 'Open your library',
  continue: 'Continue',
  loading: 'Loading your projects…',
  retry: 'Try again',
  empty:
    'Start a creation, then save it as a project in Studio to continue here.',
  quote: 'This generation',
  balance: 'Current balance',
  after: 'Estimated balance after generation',
  cost: 'Credits required',
  unknown: 'Not available',
  credits_link: 'Review credits or add more',
  edit: 'Edit this result',
  variation: 'Make a variation',
  assets: 'Save and organize',
  prompt_warning:
    'Review faces, lettering and important details before using your result.',
  advanced: 'Output settings',
  failed: 'Check your credit activity for the debit or refund before retrying.',
  restored: 'Your in-progress task has been restored.',
  product_title: 'Product images',
  product_description:
    'Build a scene around your product while keeping its defining details.',
  product_hint:
    'Upload your own product photo. Review labels, shape and materials after generation.',
  product_prompt:
    'Use the uploaded product photo as the reference. Keep the packaging, label text, shape and material unchanged. Place it on a warm limestone surface beside a softly lit window, with realistic contact shadows and generous empty space for a headline. Do not invent a new logo.',
  character_title: 'People & characters',
  character_description:
    'Plan consistent portraits, outfits and scenes from a subject reference.',
  character_hint:
    'Upload an authorized subject reference. Check identity details in each result.',
  character_prompt:
    'Use the uploaded subject reference. Preserve the face, hairstyle and distinguishing features. Create a natural editorial portrait outdoors in soft morning light, wearing a plain olive jacket, with an uncluttered background. Keep realistic skin texture and hands.',
  social_title: 'Social & covers',
  social_description:
    'Compose a clear focal point with room for your platform’s headline.',
  social_hint:
    'Start with a draft, then check the crop and safe areas before publishing.',
  social_prompt:
    'Create a horizontal editorial cover for a guide to growing indoor herbs. Show three small terracotta pots on a sunny kitchen shelf, fresh green leaves and a calm cream background. Keep the right third uncluttered for a title. No rendered text, no watermark.',
  poster_title: 'Posters & typography',
  poster_description:
    'Arrange a readable message with a deliberate visual hierarchy.',
  poster_hint:
    'Inspect every letter. Use further edits to correct spelling and placement.',
  poster_prompt:
    'Design a vertical community workshop poster. Use the exact title "MAKE SOMETHING GOOD" and the subtitle "Saturday creative workshop". Deep green background, warm yellow lettering, generous margins and a small abstract paper sculpture. Make the title the strongest element. No additional text.',
  science_title: 'Scientific figures',
  science_description:
    'Draft diagrams with a clear structure and legible labels.',
  science_hint:
    'Illustration drafts need expert review. Verify scientific relationships and every label.',
  science_prompt:
    'Create a clean educational diagram showing the water cycle. Show evaporation from a lake, condensation in clouds, precipitation over hills and runoff returning to the lake. Use four labeled arrows, a white background, restrained blue and green colors, and no decorative text. This is an illustration draft for review.',
  logo_title: 'Logos & design assets',
  logo_description:
    'Explore a distinct shape before refining it into a finished brand asset.',
  logo_hint:
    'Treat generated marks as concepts. Check distinctiveness and prepare final vectors separately.',
  logo_prompt:
    'Explore a minimal logo concept for an independent plant nursery named "LEAF ROOM". Create a simple abstract leaf and doorway symbol with a distinctive negative-space opening. Use one dark green color on a plain white background. Include no mockup, texture, shadows or extra words.',
};
const zh = {
  scenes: '按场景创作',
  title: 'Nano Banana 2.1，让每种创意都有工作台。',
  intro:
    '选择场景，准备清晰的创作说明，再从结果继续修改。项目、参考素材和作品集中管理。',
  start: '使用这份创作说明',
  guide: '查看场景指南',
  example: '流程示意 · 可修改的提示词示例',
  projects: '继续上次项目',
  library: '打开作品库',
  continue: '继续创作',
  loading: '正在加载项目…',
  retry: '重试',
  empty: '开始创作，在 Studio 中保存项目后，即可在这里继续。',
  quote: '本次生成',
  balance: '当前余额',
  after: '生成后预计余额',
  cost: '所需积分',
  unknown: '暂不可用',
  credits_link: '查看积分或补充额度',
  edit: '继续编辑这张图',
  variation: '制作变体',
  assets: '保存与整理',
  prompt_warning: '使用前请检查人物、文字和重要细节。',
  advanced: '输出设置',
  failed: '重试前请在积分记录中确认扣费或退回状态。',
  restored: '已恢复正在处理的任务。',
  product_title: '商品图',
  product_description: '围绕商品搭建场景，保留产品的重要细节。',
  product_hint: '上传自己的商品照片，生成后检查标签、形状和材质。',
  character_title: '人物与角色',
  character_description: '用人物参考探索肖像、服装和连续场景。',
  character_hint: '上传已获授权的人物参考，逐张检查身份特征。',
  social_title: '社媒与封面',
  social_description: '明确视觉焦点，为平台标题和裁切预留空间。',
  social_hint: '先生成草稿，再检查裁切范围和安全区域。',
  poster_title: '海报与文字',
  poster_description: '用清晰的信息层级安排标题、正文与画面。',
  poster_hint: '逐字检查拼写，通过后续编辑修正文字与位置。',
  science_title: '科研图与信息图',
  science_description: '制作结构清晰、标签可读的图示草稿。',
  science_hint: '图示草稿需人工专业审核，核对科学关系和所有标签。',
  logo_title: 'Logo 与素材',
  logo_description: '先探索有辨识度的形状，再完善品牌设计素材。',
  logo_hint: '生成标志用于概念探索，需检查独特性并另行制作最终矢量。',
};
for (const file of readdirSync('messages').filter((f) => f.endsWith('.json'))) {
  const p = `messages/${file}`;
  const messages = JSON.parse(readFileSync(p, 'utf8'));
  const copy =
    file === 'zh.json' || file === 'zh-TW.json' ? { ...en, ...zh } : en;
  for (const [key, value] of Object.entries(copy))
    messages[`workflow.${key}`] = value;
  writeFileSync(p, JSON.stringify(messages, null, 2) + '\n');
}
// Static accessors keep the new block's translations tree-shakeable.
const expressions = Object.keys(en)
  .map(
    (key) => `  ${JSON.stringify(key)}: m['workflow.${key}']({}, { locale }),`
  )
  .join('\n');
writeFileSync(
  'src/blocks/workflow-copy.ts',
  `import { m } from '@/paraglide/messages.js';\nimport { getLocale } from '@/paraglide/runtime.js';\nexport function workflowCopy() { const locale = getLocale(); return {\n${expressions}\n}; }\n`
);

import { readdir, readFile, writeFile } from 'node:fs/promises';

const en = {
  title: 'Prompt library',
  body: 'Explore real community examples. Find a visual direction, save your favorites, then adapt the prompt in your workspace.',
  search: 'Search prompts, styles, creators or models…',
  all: 'All',
  type: 'Type',
  generate: 'Text to image',
  edit: 'Reference image',
  sort: 'Sort',
  featured: 'Featured',
  name: 'Name',
  newest: 'Newest',
  model: 'Example model',
  favorites: 'Favorites',
  favorite: 'Save prompt',
  unfavorite: 'Remove favorite',
  details: 'View image and full prompt',
  copy: 'Copy prompt',
  copied: 'Prompt copied',
  copy_error: 'Could not copy. Open the details and select the text.',
  use: 'Use prompt',
  results: 'prompts',
  of: 'of',
  previous: 'Previous',
  next: 'Next',
  no_matches: 'No prompts match your filters',
  reset: 'Reset filters',
  loading: 'Loading full library',
  error: 'Could not load the full library.',
  retry: 'Retry',
  source: 'Source',
  creator: 'Creator',
  original_image: 'Open original image',
  community: 'Community example',
  reference_hint:
    'This prompt needs a reference image. Upload your own image in the workspace before generating.',
  adapt_hint:
    'Replace subjects and editable placeholders before generating. Example images came from the source model; your results may differ.',
  attribution:
    'Community prompts and matching images, credited to their creators and collections. These examples are not original works of this site.',
  changes: 'Changes',
  storage_error: 'Browser storage is unavailable. Favorites may not persist.',
  category_Photography: 'Photography',
  category_Illustration: 'Illustration & 3D',
  category_Ecommerce: 'Ecommerce',
  category_Food: 'Food & drink',
  category_Social: 'Social & posters',
  category_Design: 'Graphic & UI',
  category_Architecture: 'Architecture',
  category_Brand: 'Brand & logo',
  category_Science: 'Science & diagrams',
  category_Characters: 'Characters',
};
const zh = {
  title: '提示词库',
  body: '浏览社区真实案例，找到创作方向，收藏喜欢的提示词，再到工作台调整并生成。',
  search: '搜索提示词、风格、作者或模型…',
  all: '全部',
  type: '类型',
  generate: '文生图',
  edit: '参考图创作',
  sort: '排序',
  featured: '精选',
  name: '名称',
  newest: '最新',
  model: '案例模型',
  favorites: '收藏',
  favorite: '收藏提示词',
  unfavorite: '取消收藏',
  details: '查看原图与完整提示词',
  copy: '复制提示词',
  copied: '提示词已复制',
  copy_error: '复制失败，请打开详情选择文字复制。',
  use: '使用提示词',
  results: '条提示词',
  of: '/',
  previous: '上一页',
  next: '下一页',
  no_matches: '没有符合筛选条件的提示词',
  reset: '重置筛选',
  loading: '正在加载完整词库',
  error: '完整词库加载失败。',
  retry: '重试',
  source: '来源',
  creator: '作者',
  original_image: '查看原始图片',
  community: '社区案例',
  reference_hint: '此提示词需要参考图，请先在工作台上传你自己的图片再生成。',
  adapt_hint:
    '生成前请替换主体与可编辑占位内容。案例来自标注的原始模型，实际生成结果可能不同。',
  attribution:
    '提示词和对应图片来自社区案例，保留原作者及素材库署名，不标称本站原创。',
  changes: '调整说明',
  storage_error: '浏览器存储不可用，收藏可能无法保留。',
  category_Photography: '摄影',
  category_Illustration: '插画与 3D',
  category_Ecommerce: '电商',
  category_Food: '美食饮品',
  category_Social: '社交与海报',
  category_Design: '平面与 UI',
  category_Architecture: '建筑空间',
  category_Brand: '品牌与标志',
  category_Science: '科学与图解',
  category_Characters: '角色人物',
};
for (const file of await readdir('messages')) {
  if (!file.endsWith('.json')) continue;
  const location = `messages/${file}`;
  const messages = JSON.parse(await readFile(location, 'utf8'));
  const source = file === 'zh.json' || file === 'zh-TW.json' ? zh : en;
  for (const [key, value] of Object.entries(source))
    messages[`prompt_library.${key}`] = value;
  await writeFile(location, JSON.stringify(messages, null, 2) + '\n');
}
console.log(
  'Prompt library controls added to all locale catalogs (English fallback outside Chinese).'
);

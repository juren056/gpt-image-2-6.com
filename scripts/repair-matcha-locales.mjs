import { readFile, writeFile } from 'node:fs/promises';

const settings = JSON.parse(
  await readFile('project.inlang/settings.json', 'utf8')
);
const english = JSON.parse(await readFile('messages/en.json', 'utf8'));

const commonEnglish = {
  'landing.nav.tools.matcha_filter.title': 'Remove Matcha Filter',
  'landing.nav.tools.matcha_filter.description':
    'Restore natural colors from a green matcha cast',
  'landing.generator.tool_matcha_filter': 'Remove matcha filter',
  'tools.matcha_filter.tool_eyebrow': 'AI color correction',
  'tools.matcha_filter.uploader_preview_alt': 'Image preview',
  'tools.matcha_filter.uploader_replace': 'Replace image',
  'tools.matcha_filter.uploader_uploading': 'Uploading...',
  'tools.matcha_filter.uploader_failed': 'Upload failed',
  'tools.matcha_filter.uploader_remove': 'Remove image',
  'tools.matcha_filter.uploader_upload': 'Upload',
  'tools.matcha_filter.uploader_max_size': 'Max {size}MB',
  'tools.matcha_filter.cost':
    '{credits} credits · one color-corrected image · failed provider tasks are refunded',
};

const simplifiedChinese = {
  'landing.nav.tools.matcha_filter.title': '去除抹茶滤镜',
  'landing.nav.tools.matcha_filter.description':
    '去除绿色偏色，还原自然肤色与白平衡',
  'landing.generator.tool_matcha_filter': '去除抹茶滤镜',
  'tools.matcha_filter.meta_title':
    'AI 去抹茶滤镜在线工具｜还原自然肤色与白平衡',
  'tools.matcha_filter.meta_description':
    '在线去除照片中的抹茶绿滤镜，用 AI 还原自然肤色、中性白色与真实色彩，同时尽量保持人物、背景和构图不变。',
  'tools.matcha_filter.eyebrow': 'AI 去抹茶滤镜',
  'tools.matcha_filter.title': '去掉抹茶滤镜，还原照片本来的颜色。',
  'tools.matcha_filter.description':
    '上传一张偏绿的照片，AI 会校正抹茶绿色偏，同时尽量保持人物、姿势、背景与构图不变。一键找回自然肤色、干净白色与真实层次。',
  'tools.matcha_filter.primary_action': '去除抹茶滤镜',
  'tools.matcha_filter.trust_1': '一键恢复色彩',
  'tools.matcha_filter.trust_2': '尽量保持人物一致',
  'tools.matcha_filter.trust_3': '支持下载 PNG',
  'tools.matcha_filter.example_title': '拖动滑块，对比抹茶绿偏色与自然色彩。',
  'tools.matcha_filter.tool_title': '上传带抹茶滤镜的照片',
  'tools.matcha_filter.tool_description':
    '工具会重点处理绿色偏色、发灰的白色和失真的肤色，并尽量保留面部、手部、服装、物体和原始画面，而不是重新设计整张照片。',
  'tools.matcha_filter.upload_title': '上传一张照片',
  'tools.matcha_filter.upload_hint':
    '支持 10 MB 以内的 JPG、PNG 或 WebP。建议使用清晰的原始大图。',
  'tools.matcha_filter.remove': '还原自然色彩',
  'tools.matcha_filter.result_title': '校正结果',
  'tools.matcha_filter.result_hint':
    '处理完成后，可拖动分割线对比原图与色彩还原结果。',
  'tools.matcha_filter.download': '下载结果',
  'tools.matcha_filter.before_alt': '带有明显抹茶绿色滤镜的人像照片',
  'tools.matcha_filter.after_alt': '恢复中性白平衡和自然色彩的同一张人像照片',
  'tools.matcha_filter.cost':
    '{credits} 积分 · 生成 1 张校色图 · 服务商失败自动退还积分',
  'tools.matcha_filter.benefits_title': '只修偏色，不丢掉原来的照片',
  'tools.matcha_filter.benefit_1_title': '自然校色，不过度处理',
  'tools.matcha_filter.benefit_1_body':
    '减少白色、阴影与肤色中的多余绿色，同时尽量保留真正的抹茶、植物和绿色服装等物体原有质感。',
  'tools.matcha_filter.benefit_2_title': '人物依然可辨认',
  'tools.matcha_filter.benefit_2_body':
    '处理指令会锁定人物身份、表情、姿势和五官结构，让结果更像校色，而不是重新生成一张人像。',
  'tools.matcha_filter.benefit_3_title': '保持原始构图',
  'tools.matcha_filter.benefit_3_body':
    '模型会被要求不添加、删除或重塑物体。用于人物身份或商业场景时，请务必仔细检查处理结果。',
  'tools.matcha_filter.how_title': '三步告别绿色偏色',
  'tools.matcha_filter.how_description':
    '不用手动拉曲线或调色轮。工具把精确的校色指令和保守的编辑强度整合成一个简单操作。',
  'tools.matcha_filter.step_1_title': '上传照片',
  'tools.matcha_filter.step_1_body':
    '选择带抹茶滤镜的人像、自拍、产品图或生活照片。',
  'tools.matcha_filter.step_2_title': 'AI 还原',
  'tools.matcha_filter.step_2_body':
    'AI 识别人为绿色偏色，并重建更中性的白平衡。',
  'tools.matcha_filter.step_3_title': '对比下载',
  'tools.matcha_filter.step_3_body':
    '在同一画面拖动对比，检查人物和物体后下载结果。',
  'tools.matcha_filter.faq_1_question': '什么是抹茶滤镜？',
  'tools.matcha_filter.faq_1_answer':
    '它通常是一种偏绿或鼠尾草绿色的风格化调色，会让肤色、白色和阴影整体染绿。此工具用于减弱这种偏色并恢复更自然的色彩平衡。',
  'tools.matcha_filter.faq_2_question': '会把照片里真正的绿色物体也去掉吗？',
  'tools.matcha_filter.faq_2_answer':
    '处理指令要求模型保留真实物体和材质，包括真正的抹茶和植物。但 AI 编辑结果仍可能变化，重要颜色请在使用前仔细核对。',
  'tools.matcha_filter.faq_3_question': '会改变人物面部或背景吗？',
  'tools.matcha_filter.faq_3_answer':
    '工作流会明确要求保持人物身份、姿势、物体与构图，并使用较保守的编辑强度。但生成式编辑无法保证像素级一致，请仔细检查前后对比。',
  'tools.matcha_filter.faq_4_question': '支持哪些图片格式？',
  'tools.matcha_filter.faq_4_answer':
    '支持 10 MB 以内的 JPG、PNG 和 WebP。清晰、高分辨率的原图能提供更多可保留的色彩与纹理信息。',
  'tools.matcha_filter.faq_5_question': '页面上的前后对比是保证效果吗？',
  'tools.matcha_filter.faq_5_answer':
    '不是。它是为了演示目标校色方向而制作的原创示例。实际输出取决于原图和 AI 服务商，请在发布前检查结果。',
  'tools.matcha_filter.cta_title': '想看看滤镜下面原本的颜色吗？',
  'tools.matcha_filter.cta_body':
    '上传一张照片，让 AI 中和抹茶绿色偏，并在下载前逐处比较原图与结果。',
  'tools.matcha_filter.cta_action': '上传照片试试看',
  'tools.matcha_filter.directory_description':
    '去除人为添加的抹茶绿色偏，同时尽量保留原始人物、物体和构图。',
  'tools.matcha_filter.directory_feature_1': '还原自然肤色',
  'tools.matcha_filter.directory_feature_2': '保守的人物一致性编辑',
  'tools.matcha_filter.directory_feature_3': '可拖动前后对比',
  'tools.matcha_filter.directory_action': '打开去抹茶滤镜工具',
};

const traditionalChinese = {
  ...simplifiedChinese,
  'landing.nav.tools.matcha_filter.title': '移除抹茶濾鏡',
  'landing.nav.tools.matcha_filter.description':
    '移除綠色色偏，還原自然膚色與白平衡',
  'landing.generator.tool_matcha_filter': '移除抹茶濾鏡',
  'tools.matcha_filter.meta_title':
    'AI 移除抹茶濾鏡線上工具｜還原自然膚色與白平衡',
  'tools.matcha_filter.eyebrow': 'AI 移除抹茶濾鏡',
  'tools.matcha_filter.title': '移除抹茶濾鏡，找回照片原本的色彩。',
  'tools.matcha_filter.primary_action': '移除抹茶濾鏡',
  'tools.matcha_filter.upload_title': '上傳一張照片',
  'tools.matcha_filter.remove': '還原自然色彩',
  'tools.matcha_filter.result_title': '校正結果',
  'tools.matcha_filter.download': '下載結果',
  'tools.matcha_filter.cost':
    '{credits} 積分 · 產生 1 張校色圖 · 服務商失敗自動退還積分',
  'tools.matcha_filter.cta_action': '上傳照片試試看',
  'tools.matcha_filter.directory_action': '開啟移除抹茶濾鏡工具',
};

Object.assign(simplifiedChinese, {
  'tools.matcha_filter.tool_eyebrow': 'AI 色彩校正',
  'tools.matcha_filter.uploader_preview_alt': '图片预览',
  'tools.matcha_filter.uploader_replace': '替换图片',
  'tools.matcha_filter.uploader_uploading': '上传中…',
  'tools.matcha_filter.uploader_failed': '上传失败',
  'tools.matcha_filter.uploader_remove': '移除图片',
  'tools.matcha_filter.uploader_upload': '上传',
  'tools.matcha_filter.uploader_max_size': '最大 {size}MB',
});

Object.assign(traditionalChinese, {
  'tools.matcha_filter.tool_eyebrow': 'AI 色彩校正',
  'tools.matcha_filter.uploader_preview_alt': '圖片預覽',
  'tools.matcha_filter.uploader_replace': '替換圖片',
  'tools.matcha_filter.uploader_uploading': '上傳中…',
  'tools.matcha_filter.uploader_failed': '上傳失敗',
  'tools.matcha_filter.uploader_remove': '移除圖片',
  'tools.matcha_filter.uploader_upload': '上傳',
  'tools.matcha_filter.uploader_max_size': '最大 {size}MB',
});

const wanKeys = Object.keys(english).filter((key) => key.startsWith('wan3.'));

for (const locale of settings.locales) {
  const file = `messages/${locale}.json`;
  const messages = JSON.parse(await readFile(file, 'utf8'));

  for (const key of wanKeys) {
    if (!(key in messages)) messages[key] = english[key];
  }
  for (const key of Object.keys(messages)) {
    if (key.startsWith('wan3.') && !(key in english)) delete messages[key];
  }

  Object.assign(messages, commonEnglish);
  if (locale === 'zh') Object.assign(messages, simplifiedChinese);
  if (locale === 'zh-TW') Object.assign(messages, traditionalChinese);

  await writeFile(file, `${JSON.stringify(messages, null, 2)}\n`, 'utf8');
}

console.log(`Repaired ${settings.locales.length} locale catalogs.`);

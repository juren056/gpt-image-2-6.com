import fs from 'node:fs';

import { PUBLIC_TOOL_PAGES } from '../src/config/public-creative';

const file = 'scripts/account-assets-messages.json';
const patch = JSON.parse(fs.readFileSync(file, 'utf8'));
const zh: Array<[string, string]> = [
  ['AI 图片生成器', '选择可用模型，把提示词变成图片。'],
  ['AI 图片编辑器', '上传参考图，选择编辑模型并描述需要修改的地方。'],
  ['背景移除', '提取主体并下载透明背景图片。'],
  ['背景替换', '替换纯色、渐变或 AI 生成的背景。'],
  ['产品阴影', '调整阴影的方向、模糊、透明度和位置。'],
  ['重新打光', '用新的光照说明调整图片氛围。'],
  ['移除物体', '选中需要移除的部分，保留其他区域。'],
  ['局部重绘', '标记局部区域并描述新的细节。'],
  ['扩展图片', '在画面边缘扩展构图。'],
  ['图片放大', '提升现有图片的分辨率。'],
  ['图层编辑器', '组织图片、文字和背景图层。'],
  ['添加文字', '在画布中加入标题或标注。'],
  ['在线图片编辑器', '调整构图、图层和画布。'],
  ['批量图片编辑', '组织多个编辑任务并查看各项进度。'],
  ['图片尺寸调整', '为不同渠道导出合适的尺寸。'],
  ['品牌素材', '统一品牌名称、颜色和素材。'],
  ['产品图片套组', '准备多种场景的产品图片。'],
  ['图片转矢量', '将图片转换为矢量素材。'],
  ['SVG 编辑器', '编辑和检查 SVG 图形。'],
  ['Logo 生成器', '为品牌设计图形方向。'],
  ['设计模板', '从模板开始组织画布元素。'],
  ['草图转图片', '上传草图并说明最终效果。'],
  ['标注编辑', '标记图片上的修改位置。'],
  ['提示词构建器', '把创作目标整理为清晰的提示词。'],
  ['工作流构建器', '组织可以重复使用的编辑步骤。'],
];
for (const tool of PUBLIC_TOOL_PAGES) {
  const pair = zh[Number(tool.id.slice(1)) - 1];
  patch.en[`account_assets.tool_${tool.id}_title`] = tool.name;
  patch.en[`account_assets.tool_${tool.id}_body`] = tool.summary;
  patch.zh[`account_assets.tool_${tool.id}_title`] = pair[0];
  patch.zh[`account_assets.tool_${tool.id}_body`] = pair[1];
}
fs.writeFileSync(file, JSON.stringify(patch, null, 2) + '\n');

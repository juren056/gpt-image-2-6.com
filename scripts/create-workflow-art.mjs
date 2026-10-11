// Original, hand-authored vector diagrams. These are explanatory illustrations,
// not AI output samples. Regenerate without model credentials or network access.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';

const output = new URL('../public/images/workflows/', import.meta.url);
await mkdir(output, { recursive: true });
const rect = (x, y, w, h, fill = '#fffef5', radius = 16) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${fill}" stroke="#56664c" stroke-width="2"/>`;
const label = (x, y, text, size = 20, color = '#29432d') =>
  `<text x="${x}" y="${y}" fill="${color}" font-family="system-ui,sans-serif" font-size="${size}">${text}</text>`;
const arrow = (x, y, w = 80) =>
  `<path d="M${x} ${y}h${w}m-12-10 12 10-12 10" fill="none" stroke="#56664c" stroke-width="3" stroke-linejoin="round"/>`;
const bottle = (x, y) =>
  `<g transform="translate(${x} ${y})">${rect(0, 22, 70, 125, '#dce7cb', 18)}${rect(18, 0, 34, 25, '#29432d', 5)}${rect(9, 64, 52, 44, '#fffef5', 3)}${label(16, 92, 'PURE', 13)}</g>`;
const person = (x, y, coat = '#e8bc32') =>
  `<g transform="translate(${x} ${y})"><circle cx="35" cy="25" r="23" fill="#c98863" stroke="#29432d" stroke-width="2"/><path d="M12 19Q16-14 55 8L58 24 45 13 12 19" fill="#29432d"/><path d="M0 126V72Q0 51 35 51T70 72V126" fill="${coat}" stroke="#29432d" stroke-width="2"/><path d="M35 53v72" stroke="#29432d" stroke-width="2"/></g>`;
const frame = (title, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="540" viewBox="0 0 720 540" role="img"><title>${title}</title><rect width="720" height="540" fill="#eef1df"/><path d="M0 72H720M40 0V540" stroke="#cbd4b7"/>${label(58, 46, 'NANO / WORKFLOW NOTES', 16)}${body}${label(58, 515, 'ORIGINAL ILLUSTRATION · NOT A GENERATED RESULT', 12, '#56664c')}</svg>`;
const art = {
  'feature-references': frame(
    'Build an editing brief with reference images',
    `${rect(62, 128, 175, 248)}${person(113, 182)}${label(82, 356, '01 / SUBJECT', 14)}${rect(267, 128, 175, 248, '#dce7cb')}${bottle(319, 170)}${label(288, 356, '02 / PRODUCT', 14)}${arrow(458, 251, 40)}${rect(517, 150, 144, 204, '#fff8b9')}${person(535, 208)}${bottle(602, 218)}${label(520, 393, 'COMPOSE &amp; CHECK', 14)}`
  ),
  'feature-text': frame(
    'Plan headline hierarchy before image generation',
    `${rect(80, 103, 300, 354, '#29432d')}${label(107, 163, 'FRESH', 45, '#fff8b9')}${label(107, 215, 'COFFEE', 45, '#fff8b9')}<path d="M151 266h123v56q-8 45-61 45t-62-45zM274 276h22q42 33-22 53" fill="#e8bc32" stroke="#fff8b9" stroke-width="3"/>${label(108, 412, 'Every morning, made for you', 16, '#eef1df')}${label(426, 171, '01 / EXACT WORDS', 16)}${label(426, 209, '02 / LARGE TYPE', 16)}${label(426, 247, '03 / SPACE TO READ', 16)}${arrow(430, 300, 120)}${label(426, 358, 'Check the output.', 20)}${label(426, 387, 'Fix spelling manually.', 16)}`
  ),
  'feature-ratios': frame(
    'Choose output formats for square, portrait and landscape',
    `${rect(62, 159, 165, 165, '#dce7cb')}${rect(268, 126, 143, 253, '#fff8b9')}${rect(450, 184, 210, 118, '#dce7cb')}<path d="M86 288l45-50 37 33 24-37 14 54M290 336l43-75 52 75M470 280l44-60 56 60 36-45 33 45" stroke="#29432d" stroke-width="3" fill="none"/>${label(111, 355, '1:1', 24)}${label(311, 410, '9:16', 24)}${label(522, 332, '16:9', 24)}${label(83, 462, 'Shape the brief before spending credits.', 22)}`
  ),
  'case-product': frame(
    'Product photography brief with room for the brand',
    `${rect(78, 114, 405, 351, '#dce7cb')}<ellipse cx="277" cy="373" rx="118" ry="32" fill="#a7b69a"/>${bottle(240, 184)}<path d="M383 349q-33-62 19-125q35 74-19 125" fill="#56664c"/>${label(113, 161, 'YOUR BRAND / YOUR PRODUCT', 15)}${arrow(505, 253, 110)}${label(505, 308, 'Preserve', 20)}${label(505, 336, 'the label.', 20)}`
  ),
  'case-character': frame(
    'Keep a character brief consistent across a storyboard',
    `${[0, 1, 2, 3].map((i) => `${rect(64 + i * 160, 140, 142, 233, i % 2 ? '#dce7cb' : '#fff8b9')}${person(100 + i * 160, 195)}${label(78 + i * 160, 355, `SCENE 0${i + 1}`, 13)}`).join('')}${label(110, 435, 'Same face. Same wardrobe. New scene.', 22)}`
  ),
  'case-localize': frame(
    'Review words when adapting packaging between languages',
    `${rect(92, 130, 216, 270, '#fff8b9')}${rect(412, 130, 216, 270, '#dce7cb')}${label(119, 194, 'BANANA', 32)}${label(119, 234, 'CHIPS', 32)}${label(437, 194, 'CHIPS DE', 29)}${label(437, 234, 'BANANE', 29)}<path d="M128 285q48 89 129-8q-36 48-92-9" fill="#e8bc32" stroke="#29432d" stroke-width="3"/><path d="M449 285q48 89 129-8q-36 48-92-9" fill="#e8bc32" stroke="#29432d" stroke-width="3"/>${arrow(329, 273, 63)}${label(144, 448, 'Review spelling and layout in each language.', 20)}`
  ),
  'case-social': frame(
    'Plan a consistent cover system across channels',
    `${rect(71, 144, 257, 257, '#29432d')}${label(94, 194, 'A SMALL', 31, '#fff8b9')}${label(94, 234, 'BIG IDEA.', 31, '#fff8b9')}<circle cx="260" cy="330" r="42" fill="#e8bc32"/>${rect(369, 125, 128, 284, '#dce7cb')}${label(385, 174, 'IDEA', 27)}<circle cx="431" cy="281" r="38" fill="#e8bc32"/>${rect(531, 197, 134, 134, '#fff8b9')}${label(551, 245, 'IDEA', 25)}<circle cx="610" cy="291" r="22" fill="#29432d"/>${label(134, 462, 'One concept. Three channel formats.', 22)}`
  ),
};
for (const [name, svg] of Object.entries(art))
  await writeFile(new URL(`${name}.svg`, output), svg);

const en = {
  'landing.pricing.credit_note':
    'Plans provide credits. Each model has its own quote; review the selected request in the workbench before generating.',
  'banana.intro.body':
    'Start from the job you need to finish: product images, consistent characters, social covers, readable posters, scientific diagrams or logo concepts. Pro is preselected in the workbench. Review the active model, references and credit estimate before submitting. Nano Banana 2.1 is listed for comparison and is not enabled for generation here.',
  'banana.intro.tags':
    'Product images|Characters|Social covers|Posters|Scientific diagrams|Logo concepts',
  'banana.cases.caption':
    'Original workflow illustrations. These explain possible briefs; they are not generated outputs or model benchmarks.',
  'banana.features.caption':
    'Original workflow illustration; review every generated output before use.',
  'banana.features.references.alt':
    'Diagram combining a character reference and a product reference in an editing brief',
  'banana.features.text.alt':
    'Original coffee poster diagram showing headline hierarchy and spelling checks',
  'banana.features.ratios.alt':
    'Original diagram of square, portrait and landscape image formats',
  'banana.cases.0.alt':
    'Original product brief diagram with a labeled bottle and space for brand copy',
  'banana.cases.1.alt':
    'Original storyboard diagram repeating one character in four scene frames',
  'banana.cases.2.alt':
    'Original packaging diagram comparing English and French label layouts',
  'banana.cases.3.alt':
    'Original social cover diagram with one concept in three channel formats',
};
const zh = {
  'landing.pricing.credit_note':
    '套餐提供积分，各模型按自己的报价消耗积分。生成前请在工作台核对所选请求的实际费用。',
  'banana.intro.body':
    '从要完成的任务出发：产品图、人物一致性、社媒封面、文字海报、科学图解或标志概念。工作台预选 Pro，提交前请核对实际模型、参考图和积分预估。Nano Banana 2.1 目前仅用于比较，本站尚未开放该模型的生成。',
  'banana.intro.tags': '产品图|人物一致性|社媒封面|文字海报|科学图解|标志概念',
  'banana.cases.caption':
    '原创工作流示意图，用于解释创作需求，不是模型生成结果或性能测评。',
  'banana.features.caption': '原创工作流示意图；实际生成后请逐项检查再使用。',
  'banana.features.references.alt':
    '把人物参考图和产品参考图组合为编辑需求的原创图解',
  'banana.features.text.alt': '展示标题层次和拼写检查的原创咖啡海报图解',
  'banana.features.ratios.alt': '展示正方形、竖版和横版图片比例的原创图解',
  'banana.cases.0.alt': '包含瓶身标签和品牌文案留白的原创产品需求图解',
  'banana.cases.1.alt': '同一个角色出现在四个分镜框中的原创图解',
  'banana.cases.2.alt': '比较英文和法文标签布局的原创包装图解',
  'banana.cases.3.alt': '同一个创意适配三种渠道尺寸的原创封面图解',
};
for (const name of await readdir(new URL('../messages/', import.meta.url))) {
  if (!name.endsWith('.json')) continue;
  const file = new URL(`../messages/${name}`, import.meta.url);
  const data = JSON.parse(await readFile(file, 'utf8'));
  Object.assign(data, name.startsWith('zh') ? zh : en);
  await writeFile(file, JSON.stringify(data, null, 2) + '\n');
}
console.log(
  `Created ${Object.keys(art).length} original SVGs and updated illustration disclosures.`
);

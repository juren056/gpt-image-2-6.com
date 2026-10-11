# Banana generator reference specification

Reference nanobanana21.com, CUA inspection 2026-10-10. Desktop screenshot: docs/design-references/replica/reference-desktop.png. All values are measured from DOM/computed styles in docs/research/replica-reference.json.

Replace src/components/nano-workbench.tsx with src/components/banana-generator.tsx. Preserve API/auth/draft/polling logic; do not preserve the old component layout.

Interaction model: click-driven. External tabs Text to image / Image to image, selected yellow. 64px high desktop, inline width316px; mobile full width. Tab selection reveals reference uploader. Custom model dropdown with searchable model list, Escape closes, selection preserves prompt. Selected model button56px high, 36px brand tile, label14px and truncated summary12px. Button width fills form. Disabled while processing.

Panel: radius12px, border1px white12%, background oklch(.17 0 0). Grid min-height512px; desktop >=1024 columns35%/65%, mobile/tablet one column. Left form padding24px desktop/20px mobile, vertical gap16px; right preview border-left desktop/border-top mobile, padding16px. Top left compact tip border radius8px padding12px/10px, title14px600, body12px. This site's tip must link to real /creative-studio and call it AI Studio, not claim an agent feature we don't have.

Order: Studio tip -> full-width model -> uploader in edit mode -> prompt -> ratio and resolution two columns -> output count -> submit -> draft/status/utility actions. Prompt textarea min-height160px,14px desktop/16pxmobile, radius8px borderwhite16%, backgroundwhite4.8%, padding10px/8px. Ratio32–40px high. Resolution if unsupported must clearly disabled/provider default; output count only1 supported, do not submit unsupported paid options. No fake premium availability. Keep save/copy recipes unobtrusive below primary form.

Right: Production preview heading14px, Result placeholder dashed1px border radius8px,height72px near top, no huge image-icon empty state. Results/errors/loading real task only. Retry polls without resubmitting. Supported models initially2.1,2,Pro,Lite (registry options), no Qwen. Model descriptions from bilingual props. Option reference limits from registry.

Return exported BananaGenerator with SAME props API as NanoWorkbench, optional new copy keys. Agent owns this component and its dedicated CSS src/styles/banana-generator.css. Root imports CSS. Agent must not touch messages/en.json,zh.json,globals.css,nano-site.tsx. Write new bilingual keys to .artifacts/replica/generator-copy.json {en:{key:value},zh:{key:value}}. Root merges keys, generates compiled accessor. Use all text from copy props, no translations in component. Root copies keys into props automatically.

Responsive:390px width container335px, tabs335px; form333px beforepadding40px.768px stacked form/result.1440px container1280px outerpadding24px, panel1232px, left430px/right800px. Empty preview smaller on mobile,min-height260px. Keyboard labels and focus states required. Preserve SSR document guard. No raw fetch, server imports or new credentials. Verify pnpm typecheck, report pre-existing errors separately. No commit/deploy.

# Banana public header specification

Reference nanobanana21.com measured1440/768/390 CUA. Screenshots docs/design-references/replica/reference-desktop.png and reference-mobile-menu.png; exact DOM in docs/research/replica-reference.json.

Replace blocks/header.tsx content to configure NEW props-only component components/banana-header.tsx. Do not reuse SiteHeader nor its checkin/gift icon controls. Remove old public frontend nav appearance. Same Header export for all routes. Agent owns both files and dedicated styles/banana-chrome.css (root imports). Also footer handled by same agent as matched public chrome but separate component/spec.

Header relative non-sticky, z30, transparent on homepage; max-width1280px,padding24px/8px. Desktop grid1fr auto1fr, logo36px (existing D pixelbanana own logo via config app_logo), gap8px, brand18px weight900. Use envConfigs.app_name. Nav center14px font500, six entries AI Studio(/creative-studio),Generate(/#tool-generator),Features(/#features),2.1vs2(/vs-2),Pricing(/pricing),FAQ(/#faq). Nav gap4px; link padding12px/8px,radiusfull,hoverforeground5%.

Right: theme32px icon,language32px icon (not old pill),Login plain compact, Start for Free yellow rounded8px height46px,padding20px. Preserve session-dependent user menu but no dailycheckin/gift widgets. Login should open real auth UI or link existing sign-in,callback safe. User scope asks actual login. Theme defaultdark set root; toggle next-themes actual light/dark. Language use EN/ZH first with existing setLocale nav; all installed locale can be retained if operational. No raw fetch in component.

<=1023 hide desktopnav and language. Hamburger32px BEFORElogo. Desktop CTA labelStart forFree; mobile Sign up minheight40px padding12px. Mobile brand16pxweight900 and logo36px, headerpadding24px. Avoid wrapping/overflow at390px. Mobile navigation sheet click-driven, accessible BaseUI/shadcn Sheet existing primitive. Has titleSite navigation,logo, sixlinks vertically,language,theme. Escape/Close closes, link navigation closes; do not guess scrolling behavior. Give all text via props/block translations.

Top announcement same48px geometry as reference, backdropblur and yellowwash background. Reference30%discount/countdown not configured here: use equally compact real copy announcing 2.1 workspace with Exploreplans CTA; dismiss X40px right, persisted sessionStorage key scoped onlythis banner. No false discounts. On homepage announcement belongs inside ambient wrapper; other publicpages may show same banner without nested themes.

Write bilingual new text fragment .artifacts/replica/chrome-copy.json {en:{key:value},zh:{key:value}}; root will merge and create bananaText helper. Block can import bananaText from blocks/banana-messages (root will create), new keys prefixed chrome.*. Existing old common translationfunctions may be reused. Verify pnpm typecheck, root regenerates new messages later. No commits/deploy/backend mutations.

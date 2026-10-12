# Account menu redesign — 2026-10-12

Owner requested the full account dropdown be redesigned in the black/yellow site theme.
The old global dropdown rule justified icons and bare text to opposite edges.
The account surface now explicitly left-aligns rows and supplies stable label spans.

The new compact studio pass combines avatar and truncated identity, a plan badge,
a tabular credit balance, ticket-edge cuts, a perforated divider and a yellow upgrade
strip. Four frequently used actions form a two-column shortcut grid; preferences
remain rows and help/admin/sign-out form a quiet bottom action group.
No fabricated usage meter, progress, premium status or billing promise is added.

Colors retain existing light/dark account tokens, with banana yellow #facc15 and
ink #18181b for the upgrade strip. The system UI font is preserved. Hover shifts
only the upgrade arrow; reduced motion removes that transition. Keyboard focus
gets a visible yellow inset boundary. Popup height respects Base UI available space;
short screens scroll inside the menu instead of placing logout below the viewport.

Only src/components/banana-account-menu.tsx and the account-menu rules in
src/styles/banana-account-shell.css are changed. All session, credit, subscription,
admin permission, checkout, sign-out and locale behavior remain in their existing
block/API implementations. Before deployment, the owner explicitly approved this
finished design. A newer production SeeAPI release was detected and retained in the
combined checkout; 3,962 tracked files match that deployed source apart from the
scoped account UI. Production env and Wrangler identities also match.

CUA component verification: large, zero and loading balances; English/Chinese
plan and credit copy; upgrade callback closes the menu; theme and language actions;
Escape restores trigger focus; End focuses Sign out; existing six link destinations
remain correct. Light/dark mobile and normal desktop screenshots are preserved in
.artifacts/account-pass/. Short-screen geometry after the fix: popup bottom 661.9px
within the observed 667px viewport; 588px viewport inside 616px scroll content.

Final verification: pnpm build, pnpm cf:build, TypeScript and the protected homepage source/built baseline passed. All 1,530 static pages were produced. Sidebar mode also opens above its trigger and remains inside the viewport; tablet mode has no internal or horizontal overflow. This is component UI verification; it does not claim a new production payment/auth transaction test.

Initial review package: 5279ef0a2e62. This package was superseded before deployment to preserve the newer production moderation release; do not deploy it. All 5,173 server/public files match the final Cloudflare build byte for byte. Security scan passed for the three scoped files; manual review found no new API/auth/payment writes, interpolation or dependencies.

Published combined release: f3f5d596d979 / Worker 1bde5582-41e4-4631-a67f-20edc5604ec7, preserving production version 6054ebc7-15ad-409b-bf40-4cc942d5f176. Combined Node/Cloudflare builds, TypeScript, SeeAPI fixture regression and homepage protection passed. All 5,173 built files match the prepared release. The final release is preserved at .artifacts/studio-redesign/release-f3f5d596d979; release-config-path.txt points to it. Future builds must retain the published SeeAPI source/baseline as well as the menu commit, rather than publishing an older checkout.

Live acceptance: homepage, Chinese homepage, pricing, robots and the 113-URL sitemap respond successfully. Published CSS and account-menu JS are byte-identical to the build. The real authenticated account shows its actual balance, four shortcuts and the permission-controlled Admin action. Upgrade closes the menu and opens the existing three-plan dialog; no checkout or payment was submitted. Light/dark desktop and mobile rendering passed. Production screenshots: live-desktop.png, live-light.png and live-mobile.png under .artifacts/account-pass/. The initial cold-session hydration required a second observation before the account button appeared; it resolved without an auth/config change.

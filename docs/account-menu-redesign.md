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
block/API implementations. Other pending moderation changes are excluded from
this isolated build. Production deployment is pending review of the finished design.

CUA component verification: large, zero and loading balances; English/Chinese
plan and credit copy; upgrade callback closes the menu; theme and language actions;
Escape restores trigger focus; End focuses Sign out; existing six link destinations
remain correct. Light/dark mobile and normal desktop screenshots are preserved in
.artifacts/account-pass/. Short-screen geometry after the fix: popup bottom 661.9px
within the observed 667px viewport; 588px viewport inside 616px scroll content.

Final build results and deployment evidence are appended after verification.

Final verification: pnpm build, pnpm cf:build, TypeScript and the protected homepage source/built baseline passed. All 1,530 static pages were produced. Sidebar mode also opens above its trigger and remains inside the viewport; tablet mode has no internal or horizontal overflow. This is component UI verification; it does not claim a new production payment/auth transaction test.

Prepared release: 5279ef0a2e62. All 5,173 server/public files match the final Cloudflare build byte for byte. Security scan passed for the three scoped files; manual review found no new API/auth/payment writes, interpolation or dependencies.

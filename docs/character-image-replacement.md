# Character photograph replacement — 2026-10-11

The owner requested a different person in the four-scene Storyboards example.
The built-in imagegen editor replaced the recurring character with one fictional
adult woman with a straight dark bob, navy jacket and cream top. The same new
identity appears reading at the cafe window, walking outdoors, sketching at a
cafe table and holding books outside the bookshop. The original four-panel grid,
scene order, warm photographic style and 16:9 card composition are retained.

The final asset is `public/images/banana21/case-character.webp`, encoded at
1280×720. The generated original is preserved as
`.artifacts/character-refresh/character-source.png`; the prior asset, registry,
messages and baseline are saved in `.artifacts/character-refresh/before/`.
The edit prompt asked to replace only the recurring woman and clothing in all
four panels while preserving the locations, activities and framing, with no
added text or watermark. Built-in imagegen was used; only deterministic resizing
and WebP encoding followed.

The character example in the generator and the homepage card share the new
asset. Its reference prompt and all locale alt descriptions now match the new
hairstyle and clothing. Only this image URL uses `character-refresh-20261011`;
the six other homepage photographs retain their prior image URLs and bytes.
No generator pricing, authentication, payment, moderation or tool behavior was
changed. The homepage baseline update compares every other protected file and
copy value against the saved before state and adds a built-output assertion for
the character revision and description.

Release verification is recorded after build and publication. This visual
replacement does not imply an additional live Fal generation/edit test.

Local review confirmed both homepage/generator image elements loaded the new
1280×720 asset. `local-card.png` records the four scenes inside the original card.
Selecting its Use this prompt button prepared the new straight-bob/navy-jacket
brief with one reference, without submitting generation. `pnpm build`, all 18
locale checks and the source/built homepage guard passed. Security review found
no HIGH issues. Prerendering produced 1530 public pages. The WebP is 130246 bytes.

Published immutable release: `7080392cf755`; Cloudflare version
`44c6aedb-0165-4a79-bb2a-8576f0a68e9e` on `nanobanana21pro-com` /
`nanobanana21pro.com`, with the existing Nano Banana D1 binding. The checked
immutable artifact was deployed via `pnpm cf:deploy --prebuilt --release-config`.
Post-release HTTP checks passed for seven public URLs including English/Chinese
homepages, and all seven image hashes matched local source. Chrome confirmed the
two live character image elements use the new revision and load at 1280×720.
Final visual evidence: `.artifacts/character-refresh/production-card.png`.
No live Fal request, Stripe charge or database/configuration change was made.

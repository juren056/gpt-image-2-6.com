# Image upload repair — 2026-10-11

## Cause and scope

The production D1 config had no `r2_*` settings. The deployed Worker had no R2 binding. The authenticated upload API therefore used the development disk fallback (`public/uploads`), which Workers reject with `operation not permitted`. Reproduced in the live Background remover using the site's public banana mark.

The same API serves the homepage/account generators, model generators, tool source images, masks and annotations, studio project exports, avatar uploads, support-widget/ticket attachments and rich-text images. These paths were inventoried; individual visual redesigns and payment/credit logic are outside this repair.

## Repair

- Dedicated private bucket `nanobanana21pro-uploads`, bound as `IMAGE_BUCKET` to this Worker. No public bucket domain, S3 API credentials or Workers plan change is needed.
- The storage module uses the native binding when present and retains the existing admin-configured R2 provider otherwise. Local disk fallback now requires development mode and a non-D1 runtime.
- The image reader `/api/storage/media/$key` streams only JPG/PNG/WebP from the upload prefix. URLs contain random UUIDs, never content hashes, original filenames or account identifiers. They are bearer links so the selected image provider can read references. No listing endpoint is exposed; responses use `nosniff`, private caching and `noindex`.
- Native uploads skip the former full-image JavaScript MD5 calculation to reduce CPU work on Workers Free. The reference upload path has no extra generation or credit charge.
- All upload widgets and rich-text images use the typed multipart API client. The client serializes requests at least 1.1 seconds apart to honor the existing server rate limit; failed requests do not block subsequent uploads.
- Existing authentication, MIME/signature checks and 10MB per-file limit remain. Added origin validation, multipart entry/count/aggregate limits and sanitized production errors. PNG checks its complete eight-byte signature.
- Immutable release preparation asserts the exact image bucket binding, preventing future releases from silently dropping upload storage.

## Validation

- `scripts/tests/image-upload-repair.test.ts`: native R2 bytes/metadata, random separate URLs for identical uploads, unsafe type/key rejection, multipart boundary, concurrent references serialized, error propagation and recovery.
- `scripts/tests/image-upload-media.test.ts`: response bytes, GET/HEAD, security headers, path traversal rejection, active content refusal and missing binding response.
- Automated security scan and manual upload/auth/path/data-exposure review passed. Homepage source/copy/images passed the existing protected baseline.
- `pnpm typecheck`, `pnpm build` and formatting checks passed. Static prerender generated 1,530 public pages. The built and live homepage retained the protected layout/copy and all seven image checksums.
- Live checks returned HTTP 200 for `/`, `/zh`, `/pricing`, `/prompts`, `/editor`, `/vs-2`, `/sitemap.xml` and `/robots.txt`.
- Authenticated browser acceptance passed for Background remover source upload, two consecutive image-to-image generator references, avatar preview and ticket attachment preview. Each uploaded image loaded from the new media route. A separate unauthenticated read of the uploaded PNG returned HTTP 200, correct MIME and `nosniff`.
- No paid image operation was started, no avatar profile change was saved and no support ticket was submitted. The temporary ticket draft was closed after validation.
- The over-1MB browser-file acceptance test was not completed: the browser extension required file-URL permission, and the user explicitly chose to skip this extra test. The 10MB per-file application limit remains; large-file live acceptance is not claimed.
- Evidence: `.artifacts/upload-repair/{before-proof,after-proof,generator-proof,avatar-proof,ticket-proof}.png`, `live-ui.json`, `production-check.json`, `build-release.log` and `deploy.log`.

## Released version

Immutable release `d811df59ead3` was deployed successfully to `nanobanana21pro-com`, Cloudflare version `c739ea26-1f11-4f90-9c91-33dfc37bdc58`. The release contains the dedicated upload bucket binding and retains the existing domain and D1 database. Deployment guards validate the binding both when preparing and when publishing future releases.

## Deployment configuration

The gitignored production `wrangler.jsonc` must include:

```json
"r2_buckets": [{ "binding": "IMAGE_BUCKET", "bucket_name": "nanobanana21pro-uploads" }]
```

Keep the existing `nanobanana21pro-com` Worker, `nanobanana21pro.com` custom domain and `nanobanana21pro-db` D1 identity. Do not point this binding at another product's bucket. R2 usage follows the account's existing R2 quotas and billing; creating the bucket does not upgrade Workers to Paid.

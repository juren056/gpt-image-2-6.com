# Qwen Image 3.0 integration readiness

## Current production state

- Production generation remains on the explicitly allowlisted Qwen Image 2 Fal endpoints.
- `qwen-image-3.0-pro` is registered as a disabled, invite-only candidate.
- The candidate has no credit price and cannot be selected by a browser request.
- No Model Studio credential or unverified Fal endpoint is called by production code.

## Activation gates

Do not enable Qwen Image 3.0 until every gate passes:

1. The provider documents production API access for the site's account and region.
2. An authenticated smoke test returns a real image from the exact advertised model ID.
3. Request fields, response fields, queue semantics, timeouts, and moderation errors are verified.
4. Real per-image cost is measured for every supported size before assigning a credit price.
5. Successful, failed, blocked, and timed-out tasks are tested against the credit ledger.
6. Generated files are copied to owned object storage and remain downloadable.
7. The UI, task history, legal copy, and model label all report the same verified model.

## Prohibited shortcuts

- Do not label Qwen Image 2 output as Qwen Image 3.0.
- Do not trust a model ID supplied by the browser.
- Do not infer credit price from the model name.
- Do not publish an API as available based only on a marketing page or a guessed endpoint.

## Repeatable checks

Run the offline catalog checks:

```bash
pnpm test:models
```

Run the read-only public documentation check:

```bash
pnpm check:qwen3
```

The public check sends no API key and creates no generation task. It is a signal for manual review, not permission to activate production.

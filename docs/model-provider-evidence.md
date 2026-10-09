# Model and Provider Evidence

Checked against first-party provider documentation on 2026-09-12. Endpoint names are preserved exactly; the implementation does not silently substitute models.

| ID  | Product model            | Provider endpoint                                                                   | Evidence used for contract implementation                                                                                                                                  |
| --- | ------------------------ | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M02 | GPT Image 2.5 Flare      | `openai/gpt-image-2.5/flare/text-to-image`, `openai/gpt-image-2.5/flare/edit`       | [fal generation schema](https://fal.ai/models/openai/gpt-image-2.5/flare/text-to-image/api), [fal edit schema](https://fal.ai/models/openai/gpt-image-2.5/flare/edit/api)  |
| M03 | GPT Image 2.5 Sunburst   | `openai/gpt-image-2.5/sunburst/text-to-image`, `openai/gpt-image-2.5/sunburst/edit` | [fal model page](https://fal.ai/gpt-image-2.5)                                                                                                                             |
| M04 | Nano Banana 2            | `fal-ai/nano-banana-2`, `fal-ai/nano-banana-2/edit`                                 | [fal generation schema](https://fal.ai/models/fal-ai/nano-banana-2/api), [fal edit schema](https://fal.ai/models/fal-ai/nano-banana-2/edit/api)                            |
| M05 | Nano Banana 2 Lite       | `google/nano-banana-2-lite`, `google/nano-banana-2-lite/edit`                       | [fal generation schema](https://fal.ai/models/google/nano-banana-2-lite/api), [fal edit schema](https://fal.ai/models/google/nano-banana-2-lite/edit/api)                  |
| M06 | Nano Banana Pro          | `fal-ai/nano-banana-pro`, `fal-ai/nano-banana-pro/edit`                             | [fal generation schema](https://fal.ai/models/fal-ai/nano-banana-pro/api), [fal edit schema](https://fal.ai/models/fal-ai/nano-banana-pro/edit/api)                        |
| M07 | Seedream 5.0 Pro         | `bytedance/seedream/v5/pro/text-to-image`, `bytedance/seedream/v5/pro/edit`         | [fal text-to-image schema](https://fal.ai/models/bytedance/seedream/v5/pro/text-to-image/api), [fal edit schema](https://fal.ai/models/bytedance/seedream/v5/pro/edit/api) |
| M08 | FLUX.2 [pro] via fal/BFL | `fal-ai/flux-2-pro`, `fal-ai/flux-2-pro/edit`                                       | [fal generation schema](https://fal.ai/models/fal-ai/flux-2-pro/api), [fal edit schema](https://fal.ai/models/fal-ai/flux-2-pro/edit/api)                                  |

Utility evidence: [BRIA background removal](https://fal.ai/models/fal-ai/bria/background/remove/api), [Clarity upscaler](https://fal.ai/models/fal-ai/clarity-upscaler/api), and [Recraft vectorize](https://fal.ai/models/fal-ai/recraft/vectorize/api).

## Important contract decisions

- Nano Banana 2 Lite is deliberately limited to one reference and 1K in this release contract; it is not presented as equivalent to the larger Gemini image models.
- All M01–M08 production requests use the server-side Fal credential; no provider key is exposed to the browser.
- FLUX.2 is labeled `FLUX.2 [pro] (fal/BFL)` so users can see the concrete variant and delivery route.
- Paid-provider output is copied to configured durable storage by the shared Fal provider path when custom storage is enabled.
